// Writes to the SEQTRAK. Everything that changes the machine lives in this file.
//
// Rules, from the hardware notes in seqtrak-docs (04-sequencer-editing):
//   - step record (ah = 70) only exists on DRUM-type parts, and writes into the SELECTED pattern
//     of the CURRENT project: no message carries a project or pattern number
//   - the sequencer must be stopped
//   - writes are not acknowledged, so every write is followed by a read-back
//   - add carries step, note, velocity, gate; the machine sets retrigger 0 and micro timing 60
import { from14, to14 } from './sysex.js';

export class WriteRefused extends Error {}

const one = r => (r.ok && r.data.length >= 1 ? r.data[0] : null);
const two = r => (r.ok && r.data.length >= 2 ? from14(r.data[0], r.data[1]) : null);

export const DEFAULT_STEP = { note: 60, velocity: 100, retrigger: 0, microTiming: 60, gate: 120 };

const sameStep = (a, b) => (!a && !b) || (!!a && !!b
  && a.note === b.note && a.velocity === b.velocity && a.retrigger === b.retrigger
  && a.microTiming === b.microTiming && a.gate === b.gate);

// Reads where a write would land, and refuses if anything is unknown or unsafe.
export async function readTarget(link, part) {
  const playing = one(await link.read([0x01, 0x10, 0x20]));
  const project = one(await link.read([0x01, 0x10, 0x15]));
  const typeRaw = one(await link.read([0x01, 0x10 | part, 0x3c]));
  const pattern = one(await link.read([0x30, 0x50 | part, 0x0f]));
  const steps = pattern === null ? null : two(await link.read([0x30, 0x50 | part, 0x16 + 2 * pattern]));
  if ([playing, project, typeRaw, pattern, steps].includes(null)) {
    throw new WriteRefused('The SEQTRAK did not answer every question about where the write would land. Nothing was written.');
  }
  if (playing !== 0) throw new WriteRefused('The sequencer is playing. Stop it first. Nothing was written.');
  if (typeRaw !== 1) throw new WriteRefused('This track is not a DRUM-type track, so step writing does not apply. Nothing was written.');
  return { part, project, pattern, steps };
}

// Every step of a drum part's selected pattern: an array of step contents, null where empty.
// Throws rather than guess if any step could not be read.
export async function readSteps(link, part, steps, onProgress = () => {}) {
  const out = [];
  for (let step = 0; step < steps; step++) {
    const r = await link.read([0x70, 0x40 | part, step]);
    if (!r.ok) throw new WriteRefused(`Step ${step + 1} did not answer, so the pattern is not known for certain. Stopped.`);
    if (r.data.length >= 6) {
      const [note, velocity, retrigger, microTiming, gateMsb, gateLsb] = r.data;
      out.push({ note, velocity, retrigger, microTiming, gate: from14(gateMsb, gateLsb) });
    } else out.push(null);
    onProgress(step + 1, steps);
  }
  return out;
}

async function putStep(link, part, step, want) {
  await link.write([0x70, part, 0x00], [step, want.note, want.velocity, ...to14(want.gate)]);
  if (want.microTiming !== 60) await link.write([0x70, 0x10 | part, 0x00], [step, want.microTiming]);
  if (want.retrigger !== 0) await link.write([0x70, 0x10 | part, 0x03], [step, want.retrigger]);
}

const clearStep = (link, part, step) => link.write([0x70, 0x20 | part, 0x00], [step]);

// Makes a drum part's selected pattern equal to `wanted` (array of step contents or null),
// touching only the steps that differ, then reads everything back.
// Returns { target, before, after, changed, mismatches }.
export async function writeDrumPattern(link, part, wanted, onProgress = () => {}) {
  const target = await readTarget(link, part);
  if (wanted.length !== target.steps) {
    throw new WriteRefused(`The pattern is ${target.steps} steps long but ${wanted.length} were supplied. Nothing was written.`);
  }
  const before = await readSteps(link, part, target.steps, (d, t) => onProgress('Reading', d, t));
  let changed = 0;
  for (let step = 0; step < target.steps; step++) {
    if (sameStep(before[step], wanted[step])) continue;
    if (before[step]) await clearStep(link, part, step);
    if (wanted[step]) await putStep(link, part, step, wanted[step]);
    changed++;
    onProgress('Writing', step + 1, target.steps);
  }
  // The target must not have moved under us (someone pressing a button on the machine).
  const still = await readTarget(link, part);
  const after = await readSteps(link, part, target.steps, (d, t) => onProgress('Checking', d, t));
  const mismatches = [];
  for (let step = 0; step < target.steps; step++) if (!sameStep(after[step], wanted[step])) mismatches.push(step);
  const moved = still.project !== target.project || still.pattern !== target.pattern;
  return { target, before, after, changed, mismatches, moved, ok: mismatches.length === 0 && !moved };
}

// A simple test pattern: a hit on every `every`-th step.
export function everyNth(steps, every = 4) {
  return Array.from({ length: steps }, (_, i) => (i % every === 0 ? { ...DEFAULT_STEP } : null));
}

// ---------- piano roll (SYNTH 1, SYNTH 2, DX, SAMPLER = parts 7-10)
//
// Events are raw 8-byte payloads, exactly as the machine stores them:
//   tickMsb tickLsb type note velocity offVelocity gateMsb gateLsb
// Keeping them raw means a snapshot can be written back byte for byte, CC events included.

const MAX_EVENTS = 512;
const rollIndex = part => part - 7;                     // the synth block counts its own tracks 0-3

export async function readRollTarget(link, part) {
  if (part < 7 || part > 10) throw new WriteRefused('Piano-roll writing is only wired for SYNTH 1, SYNTH 2, DX and SAMPLER. Nothing was written.');
  const playing = one(await link.read([0x01, 0x10, 0x20]));
  const project = one(await link.read([0x01, 0x10, 0x15]));
  const pattern = one(await link.read([0x30, 0x50 | part, 0x0f]));
  const steps = pattern === null ? null : two(await link.read([0x30, 0x50 | part, 0x16 + 2 * pattern]));
  if ([playing, project, pattern, steps].includes(null)) {
    throw new WriteRefused('The SEQTRAK did not answer every question about where the write would land. Nothing was written.');
  }
  if (playing !== 0) throw new WriteRefused('The sequencer is playing. Stop it first. Nothing was written.');
  return { part, project, pattern, steps };
}

export async function readRoll(link, part, onProgress = () => {}) {
  const n = rollIndex(part);
  const out = [];
  for (let i = 0; i < MAX_EVENTS; i++) {
    const r = await link.read([0x75, (n << 4) | (i >> 7), i & 0x7f]);
    if (!r.ok) throw new WriteRefused(`Event ${i + 1} did not answer, so the pattern is not known for certain. Stopped.`);
    if (r.data.length < 8) return out;
    out.push(r.data.slice(0, 8));
    onProgress(i + 1);
  }
  throw new WriteRefused('The pattern holds more events than this app handles. Stopped.');
}

const rollKey = e => e.join(',');
const sortedKeys = events => events.map(rollKey).sort();

// Replaces a synth part's selected pattern with `wanted` (raw payloads): clears the pattern,
// adds every event, then reads the list back and compares it as a set (the machine may reorder).
export async function writeRoll(link, part, wanted, onProgress = () => {}) {
  const target = await readRollTarget(link, part);
  const limit = target.steps * 120;
  for (const e of wanted) {
    if (e.length !== 8) throw new WriteRefused('An event is not 8 bytes. Nothing was written.');
    if (from14(e[0], e[1]) >= limit) throw new WriteRefused(`An event sits past the end of the ${target.steps}-step pattern. Nothing was written.`);
  }
  const before = await readRoll(link, part, d => onProgress('Reading', d, null));
  const n = rollIndex(part);

  // Clear the selected pattern in one message, and make sure it really is empty before adding.
  await link.write([0x01, 0x10 | part, 0x37], [target.pattern]);
  const cleared = await readRoll(link, part);
  if (cleared.length !== 0) {
    throw new WriteRefused(`The clear command left ${cleared.length} event(s) in place. Stopped before adding anything; the old pattern is ${cleared.length === before.length ? 'still there' : 'partly there'}.`);
  }
  for (let i = 0; i < wanted.length; i++) {
    await link.write([0x72, n << 4, 0x00], wanted[i]);
    onProgress('Writing', i + 1, wanted.length);
  }
  const still = await readRollTarget(link, part);
  const after = await readRoll(link, part, d => onProgress('Checking', d, null));
  const want = sortedKeys(wanted);
  const got = sortedKeys(after);
  const missing = want.filter(k => !got.includes(k)).length;
  const extra = got.filter(k => !want.includes(k)).length;
  const moved = still.project !== target.project || still.pattern !== target.pattern;
  const matches = want.length === got.length && want.every((k, i) => k === got[i]);
  return { target, before, after, changed: wanted.length, missing, extra, moved, ok: matches && !moved };
}

// One note on the grid. `offset` is the position inside the step: 60 is the centre the machine
// itself uses for a step-recorded note.
export function rollNote(step, note, { velocity = 100, gate = 120, offset = 60 } = {}) {
  return [...to14(step * 120 + offset), 0, note, velocity, 0, ...to14(gate)];
}

// Test bass line: the root on every beat, plus a fifth on the last off-beat of each bar.
export function testBass(steps) {
  const out = [];
  for (let s = 0; s < steps; s++) {
    if (s % 4 === 0) out.push(rollNote(s, 36));
    else if (s % 16 === 14) out.push(rollNote(s, 43));
  }
  return out;
}

// ---------- project settings and sounds

const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function setTempo(link, bpm) {
  await link.write([0x30, 0x40, 0x76], to14(bpm));
  return two(await link.read([0x30, 0x40, 0x76])) === bpm;
}

// Loads a catalogue sound (1-2032) onto a part: Bank Select MSB 63, LSB, Program Change on the
// part's MIDI channel, all three every time (the bank is not latched). Verified by reading
// CurrentSound back; loading can take a moment, so the read is retried.
export async function loadSound(link, part, number, { waitMs = 150, tries = 6 } = {}) {
  const index = number - 1;
  await link.sendRaw([0xb0 | part, 0x00, 63]);
  await link.sendRaw([0xb0 | part, 0x20, index >> 7]);
  await link.sendRaw([0xc0 | part, index & 0x7f]);
  for (let i = 0; i < tries; i++) {
    if (two(await link.read([0x01, 0x10 | part, 0x33])) === index) return true;
    await sleep(waitMs);
  }
  return false;
}

// A track volume of 0 silences a track whatever its pattern holds (seen on hardware after a
// project slot is reused). Raise it only when it is 0; any other level is the user's own mix.
export async function ensureAudible(link, part, level = 100) {
  const now = one(await link.read([0x30, 0x50 | part, 0x00]));
  if (now === null) return { ok: false, raised: false };
  if (now !== 0) return { ok: true, raised: false };
  await link.write([0x30, 0x50 | part, 0x00], [level]);
  return { ok: one(await link.read([0x30, 0x50 | part, 0x00])) === level, raised: true };
}

// ---------- a whole one-pattern groove

const chord = (step, notes, opts) => notes.map(n => rollNote(step, n, opts));
const perBar = (steps, fn) => { const out = []; for (let bar = 0; bar * 16 < steps; bar++) out.push(...fn(bar * 16).filter(e => ((e[0] << 7) | e[1]) < steps * 120)); return out; };
const hits = (steps, list) => Array.from({ length: steps }, (_, i) => (list.includes(i % 16) ? { ...DEFAULT_STEP } : null));

// C minor, 124 BPM: four-on-the-floor, clap-style snare on 2 and 4, off-beat hats, a sine bass
// and an off-beat chord stab. Sounds are catalogue numbers.
export const TEST_GROOVE = {
  tempo: 124,
  tracks: [
    { part: 0, name: 'KICK', sound: 1, drum: steps => hits(steps, [0, 4, 8, 12]) },
    { part: 1, name: 'SNARE', sound: 113, drum: steps => hits(steps, [4, 12]) },
    { part: 3, name: 'HAT 1', sound: 312, drum: steps => hits(steps, [2, 6, 10, 14]) },
    { part: 7, name: 'SYNTH 1', sound: 908, roll: steps => perBar(steps, b => [
      rollNote(b + 0, 36), rollNote(b + 3, 36), rollNote(b + 6, 36), rollNote(b + 10, 39), rollNote(b + 12, 36), rollNote(b + 14, 43),
    ]) },
    { part: 8, name: 'SYNTH 2', sound: 996, roll: steps => perBar(steps, b => [
      ...chord(b + 2, [60, 63, 67], { velocity: 90 }), ...chord(b + 9, [60, 63, 67], { velocity: 80 }),
    ]) },
  ],
};

// Writes a groove into the selected patterns of the current project. Returns a list of checks,
// one line per thing attempted; a failed track does not stop the others.
export async function writeGroove(link, groove, onProgress = () => {}) {
  const playing = one(await link.read([0x01, 0x10, 0x20]));
  const project = one(await link.read([0x01, 0x10, 0x15]));
  if (playing === null || project === null) throw new WriteRefused('The SEQTRAK did not answer. Nothing was written.');
  if (playing !== 0) throw new WriteRefused('The sequencer is playing. Stop it first. Nothing was written.');
  const checks = [];
  const add = (label, ok, detail = '') => checks.push({ label, ok, detail });

  onProgress('Tempo', 0, groove.tracks.length + 1);
  add(`Tempo ${groove.tempo} BPM`, await setTempo(link, groove.tempo));

  for (let i = 0; i < groove.tracks.length; i++) {
    const t = groove.tracks[i];
    onProgress(t.name, i + 1, groove.tracks.length + 1);
    try {
      add(`${t.name}: sound #${t.sound}`, await loadSound(link, t.part, t.sound));
      const vol = await ensureAudible(link, t.part);
      if (vol.raised || !vol.ok) add(`${t.name}: volume was 0, raised to 100`, vol.ok);
      if (t.drum) {
        const target = await readTarget(link, t.part);
        const r = await writeDrumPattern(link, t.part, t.drum(target.steps));
        add(`${t.name}: pattern ${r.target.pattern + 1}, ${r.target.steps} steps`, r.ok, r.ok ? `${r.changed} step(s) changed` : 'read-back does not match');
      } else {
        const target = await readRollTarget(link, t.part);
        const r = await writeRoll(link, t.part, t.roll(target.steps));
        add(`${t.name}: pattern ${r.target.pattern + 1}, ${r.target.steps} steps`, r.ok, r.ok ? `${r.changed} note(s) written` : `read-back does not match (${r.missing} missing, ${r.extra} unexpected)`);
      }
    } catch (e) {
      add(`${t.name}: stopped`, false, e?.message || String(e));
    }
  }
  return { project, checks, ok: checks.every(c => c.ok) };
}

// ---------- a whole song: several patterns per track, and scenes

const ALL_PARTS = 11;
const MAX_SCENES = 16;

// Selects pattern slot `slot` (0-5) on a part and proves it took. Slots 3-5 are only reachable
// with Pattern Select Mode 1; without it the machine silently stays on slot 2, and a write aimed
// at slot 3 would destroy slot 2. So: never continue on a mismatch.
export async function selectPattern(link, part, slot) {
  await link.write([0x30, 0x50 | part, 0x0f], [slot]);
  const now = one(await link.read([0x30, 0x50 | part, 0x0f]));
  if (now !== slot) throw new WriteRefused(`Pattern ${slot + 1} could not be selected (the machine says ${now === null ? 'nothing' : now + 1}). Stopped before writing into the wrong pattern.`);
}

export async function setPatternLength(link, part, slot, steps) {
  const addr = [0x30, 0x50 | part, 0x16 + 2 * slot];
  await link.write(addr, to14(steps));
  return two(await link.read(addr)) === steps;
}

async function setByte(link, addr, value) {
  await link.write(addr, [value]);
  return one(await link.read(addr)) === value;
}

async function readScene(link, scene) {
  const r = await link.read([0x71, 0x40, scene]);
  if (!r.ok) throw new WriteRefused(`Scene ${scene + 1} did not answer. Stopped.`);
  if (r.data.length < 25) return null;
  return { patterns: r.data.slice(2, 13), mutes: r.data.slice(14, 25) };
}

// Makes the project's scenes equal to `scenes` ([{ patterns: [11], mutes: [11 of 0/1] }]):
// creates missing ones, sets every track's pattern and mute, removes scenes past the end.
export async function writeScenes(link, scenes, onProgress = () => {}) {
  for (let s = 0; s < scenes.length; s++) {
    onProgress(s + 1, scenes.length);
    if (!(await readScene(link, s))) await link.write([0x71, 0x00, 0x00], [s]);
    for (let p = 0; p < ALL_PARTS; p++) {
      await link.write([0x71, 0x10 | p, 0x01], [s, scenes[s].patterns[p]]);
      await link.write([0x71, 0x10 | p, 0x02], [s, scenes[s].mutes[p]]);
    }
  }
  for (let s = MAX_SCENES - 1; s >= scenes.length; s--) {
    if (await readScene(link, s)) await link.write([0x71, 0x20, 0x00], [s]);
  }
  const wrong = [];
  for (let s = 0; s < MAX_SCENES; s++) {
    const got = await readScene(link, s);
    const want = scenes[s] ?? null;
    const same = (!got && !want) || (!!got && !!want
      && want.patterns.every((v, i) => v === got.patterns[i]) && want.mutes.every((v, i) => v === got.mutes[i]));
    if (!same) wrong.push(s);
  }
  return wrong;
}

// song = { tempo, steps, tracks: [{ part, name, sound, patterns: [fn(steps) -> content, ...] }],
//          scenes: [{ name, play: { <part>: <slot> } }] }
// A track plays in a scene only if the scene lists it; every other track is muted there, so
// whatever an unused track still holds stays silent.
export async function writeSong(link, song, onProgress = () => {}) {
  const playing = one(await link.read([0x01, 0x10, 0x20]));
  const project = one(await link.read([0x01, 0x10, 0x15]));
  if (playing === null || project === null) throw new WriteRefused('The SEQTRAK did not answer. Nothing was written.');
  if (playing !== 0) throw new WriteRefused('The sequencer is playing. Stop it first. Nothing was written.');
  const checks = [];
  const add = (label, ok, detail = '') => checks.push({ label, ok, detail });
  const total = song.tracks.length + 2;

  onProgress('Settings', 0, total);
  // Without this, pattern slots 4-6 are unreachable. If it does not take, stop: nothing written yet.
  if (!(await setByte(link, [0x30, 0x40, 0x79], 1))) throw new WriteRefused('Pattern Select Mode could not be set. Nothing else was written.');
  add('All six pattern slots reachable', true);
  add(`Tempo ${song.tempo} BPM`, await setTempo(link, song.tempo));

  for (let i = 0; i < song.tracks.length; i++) {
    const t = song.tracks[i];
    onProgress(t.name, i + 1, total);
    try {
      const isDrum = t.part <= 6;
      if (isDrum && one(await link.read([0x01, 0x10 | t.part, 0x3c])) !== 1) throw new WriteRefused('not a DRUM-type track');
      add(`${t.name}: sound #${t.sound}`, await loadSound(link, t.part, t.sound));
      const vol = await ensureAudible(link, t.part);
      if (vol.raised || !vol.ok) add(`${t.name}: volume was 0, raised to 100`, vol.ok);
      if (one(await link.read([0x30, 0x50 | t.part, 0x29])) !== 0) add(`${t.name}: unmuted`, await setByte(link, [0x30, 0x50 | t.part, 0x29], 0));
      for (let slot = 0; slot < t.patterns.length; slot++) {
        await selectPattern(link, t.part, slot);
        if (!(await setPatternLength(link, t.part, slot, song.steps))) throw new WriteRefused(`pattern ${slot + 1} length could not be set to ${song.steps}`);
        const content = t.patterns[slot](song.steps);
        const r = isDrum ? await writeDrumPattern(link, t.part, content) : await writeRoll(link, t.part, content);
        if (r.target.pattern !== slot) throw new WriteRefused(`the write landed in pattern ${r.target.pattern + 1}, not ${slot + 1}`);
        add(`${t.name}: pattern ${slot + 1}`, r.ok, r.ok ? (isDrum ? `${content.filter(Boolean).length} hit(s)` : `${content.length} note(s)`) : 'read-back does not match');
      }
      if (t.patterns.length > 1) await selectPattern(link, t.part, 0);
    } catch (e) {
      add(`${t.name}: stopped`, false, e?.message || String(e));
    }
  }

  onProgress('Scenes', total - 1, total);
  try {
    const scenes = song.scenes.map(sc => ({
      patterns: Array.from({ length: ALL_PARTS }, (_, p) => sc.play[p] ?? 0),
      mutes: Array.from({ length: ALL_PARTS }, (_, p) => (p in sc.play ? 0 : 1)),
    }));
    const wrong = await writeScenes(link, scenes);
    add(`${scenes.length} scenes: ${song.scenes.map(s => s.name).join(', ')}`, wrong.length === 0, wrong.length ? `scene(s) ${wrong.map(s => s + 1).join(', ')} do not read back as written` : 'other scenes removed');
  } catch (e) {
    add('Scenes: stopped', false, e?.message || String(e));
  }
  return { project, checks, ok: checks.every(c => c.ok) };
}

// C minor, 124 BPM, four scenes that build: the same idea, more of it each time.
export const TEST_SONG = {
  tempo: 124,
  steps: 16,
  tracks: [
    { part: 0, name: 'KICK', sound: 1, patterns: [s => hits(s, [0, 4, 8, 12])] },
    { part: 1, name: 'SNARE', sound: 113, patterns: [s => hits(s, [4, 12])] },
    { part: 3, name: 'HAT 1', sound: 312, patterns: [s => hits(s, [2, 6, 10, 14]), s => hits(s, [0, 2, 4, 6, 8, 10, 12, 14, 15])] },
    { part: 7, name: 'SYNTH 1', sound: 908, patterns: [
      s => perBar(s, b => [rollNote(b + 0, 36), rollNote(b + 3, 36), rollNote(b + 6, 36), rollNote(b + 10, 39), rollNote(b + 12, 36), rollNote(b + 14, 43)]),
      s => perBar(s, b => [rollNote(b + 0, 36), rollNote(b + 3, 36), rollNote(b + 6, 48), rollNote(b + 8, 36), rollNote(b + 10, 44), rollNote(b + 12, 43), rollNote(b + 14, 46)]),
    ] },
    { part: 8, name: 'SYNTH 2', sound: 996, patterns: [
      s => perBar(s, b => [...chord(b + 2, [60, 63, 67], { velocity: 90 }), ...chord(b + 9, [60, 63, 67], { velocity: 80 })]),
      s => perBar(s, b => [...chord(b + 2, [60, 63, 67], { velocity: 90 }), ...chord(b + 6, [56, 60, 63], { velocity: 85 }), ...chord(b + 11, [58, 62, 65], { velocity: 85 })]),
    ] },
  ],
  scenes: [
    { name: 'Intro', play: { 0: 0, 7: 0 } },
    { name: 'Groove', play: { 0: 0, 1: 0, 3: 0, 7: 0 } },
    { name: 'Full', play: { 0: 0, 1: 0, 3: 0, 7: 0, 8: 0 } },
    { name: 'Lift', play: { 0: 0, 1: 0, 3: 1, 7: 1, 8: 1 } },
  ],
};
