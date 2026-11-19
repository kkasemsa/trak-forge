// Protocol core tests. The byte strings asserted here are copied from the worked examples in
// jaeggerr/seqtrak-docs (02-sysex-format, 04-sequencer-editing, 10-verified-behaviour), so a
// failure means this code and the documented wire format disagree.
import assert from 'node:assert/strict';
import { paramRequest, paramChange, parse, from14, to14, hex } from '../js/seqtrak/sysex.js';
import { Link } from '../js/seqtrak/link.js';
import { SimTransport } from '../js/seqtrak/sim.js';
import { readSession, readPart, readPattern, readScenes, noteName } from '../js/seqtrak/probe.js';
import { preset } from '../js/seqtrak/catalog.js';
import { buildSong, listStarters } from '../js/forge/song.js';
import { writeDrumPattern, readSteps, everyNth, DEFAULT_STEP, WriteRefused, writeRoll, readRoll, rollNote, testBass, loadSound, setTempo, ensureAudible, writeGroove, TEST_GROOVE, writeSong, TEST_SONG, selectPattern } from '../js/seqtrak/writer.js';

let passed = 0;
const test = async (name, fn) => { await fn(); passed++; console.log(`  ok  ${name}`); };
const bytes = s => s.split(' ').map(h => parseInt(h, 16));
const two14 = d => from14(d[0], d[1]);

// Deterministic random so the drop tests always drop the same requests.
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

await test('tempo request matches the documented frame', () => {
  assert.equal(hex(paramRequest([0x30, 0x40, 0x76])), 'F0 43 30 7F 1C 0C 30 40 76 F7');
});

await test('step read request matches the documented frame', () => {
  assert.equal(hex(paramRequest([0x70, 0x40, 0x03])), 'F0 43 30 7F 1C 0C 70 40 03 F7');
});

await test('tempo reply decodes to 119 BPM', () => {
  const msg = parse(bytes('F0 43 10 7F 1C 0C 30 40 76 00 77 F7'));
  assert.deepEqual(msg.addr, [0x30, 0x40, 0x76]);
  assert.equal(from14(...msg.data), 119);
});

await test('device number nibble is masked', () => {
  assert.equal(parse(bytes('F0 43 15 7F 1C 0C 30 40 76 00 77 F7')).kind, 'change');
});

await test('zero-data reply parses as empty, not as failure', () => {
  assert.deepEqual(parse(bytes('F0 43 10 7F 1C 0C 70 40 03 F7')).data, []);
});

await test('bulk dumps and foreign SysEx are rejected', () => {
  assert.equal(parse(bytes('F0 43 00 7F 1C 00 34 0C 00 00 00 01 F7')), null);
  assert.equal(parse(bytes('F0 7E 7F 06 02 43 00 41 64 06 0A 00 00 7F F7')), null);
  assert.equal(parse([0xf0, 0x43, 0x10]), null);
});

await test('14-bit values are MSB first', () => {
  assert.deepEqual(to14(960), [0x07, 0x40]);          // documented: eventTime 960 reads back 07 40
  assert.equal(from14(0x07, 0x40), 960);
  assert.deepEqual(to14(120), [0x00, 0x78]);
});

await test('8-bit data is refused', () => {
  assert.throws(() => paramChange([0x30, 0x40, 0x76], [0x80]));
  assert.throws(() => paramRequest([0x30, 0x40]));
});

await test('preset catalogue matches the names read on hardware', () => {
  assert.equal(preset(50).name, 'Rumble Kick 2');
  assert.equal(preset(908).name, 'Fat Sine');
  assert.equal(preset(1517).name, 'Trumpet');
  assert.equal(preset(1990).name, 'FM Ambient Pad');
  assert.equal(preset(3).name, 'Tight Punchy Kick 3');
  assert.equal(preset(0), null);
  assert.equal(preset(99999), null);
});

await test('note names use C3 = 60', () => {
  assert.equal(noteName(60), 'C3');
  assert.equal(noteName(36), 'C1');
  assert.equal(noteName(69), 'A3');
});

const fast = { paceMs: 0, timeoutMs: 20 };

await test('identity check recognises a SEQTRAK and its OS version', async () => {
  const link = new Link(new SimTransport(), fast);
  const id = await link.identity();
  assert.equal(id.ok, true);
  assert.equal(id.isSeqtrak, true);
  assert.equal(id.osVersion, 2.0);
});

await test('session read', async () => {
  const link = new Link(new SimTransport(), fast);
  const s = await readSession(link);
  assert.deepEqual(s, { currentProject: 0, playing: false, battery: 70, tempo: 124, patternSelectMode: 0, masterStep: 16, scale: 1, key: 'A' });
});

await test('part read resolves type, sound and mute; never asks the sampler for its sound', async () => {
  const t = new SimTransport();
  const link = new Link(t, fast);
  const dx = await readPart(link, 9);
  assert.equal(dx.type, 'DX');
  assert.equal(preset(dx.soundNumber).name, 'FM Ambient Pad');
  assert.equal((await readPart(link, 5)).muted, true);
  t.sent.length = 0;
  const sampler = await readPart(link, 10);
  assert.equal(sampler.type, 'SAMPLER');
  assert.equal(sampler.soundNumber, null);
  assert.equal(t.sent.some(f => f[6] === 0x01 && f[7] === 0x1a && f[8] === 0x33), false);
  assert.equal(link.stats.failures, 0);
});

await test('drum pattern reads through step record', async () => {
  const link = new Link(new SimTransport(), fast);
  const p = await readPattern(link, 0, 1, 16);
  assert.equal(p.model, 'step');
  assert.deepEqual(p.events.map(e => e.step), [0, 4, 8, 12]);
  assert.equal(p.events[0].gate, 120);
  assert.equal(p.events[1].tick, 4 * 120 + 60);
  assert.equal(p.complete, true);
});

await test('re-typed drum part reads through the drum piano roll, with its chord', async () => {
  const t = new SimTransport();
  const link = new Link(t, fast);
  const p = await readPattern(link, 6, 2, 16);
  assert.equal(p.model, 'roll');
  assert.deepEqual(p.events.map(e => e.note), [57, 60, 64]);
  assert.ok(p.events.every(e => e.step === 0));
  assert.equal(t.sent[0][6], 0x25);
  assert.equal(t.sent[0][7], 0x60);                    // global part number 6 in the high nibble
});

await test('native synth parts use the local index 0-3, not the global part number', async () => {
  const t = new SimTransport();
  const link = new Link(t, fast);
  const p = await readPattern(link, 9, 4, 16);          // DX = local index 2
  assert.deepEqual(p.events.map(e => e.step), [2, 5, 9, 13]);
  assert.equal(t.sent[0][6], 0x75);
  assert.equal(t.sent[0][7], 0x20);
  assert.equal(p.complete, true);
});

await test('event index above 127 spills into the address-mid byte', async () => {
  const t = new SimTransport({ memory: new Map() });
  const mem = t.memory;
  for (let i = 0; i < 130; i++) mem.set([0x75, (1 << 4) | (i >> 7), i & 0x7f].join(','), [...to14(i * 120 + 60), 0, 60, 100, 0, 0, 120]);
  mem.set([0x75, 0x11, 2].join(','), []);
  const p = await readPattern(new Link(t, fast), 8, 2, 128);
  assert.equal(p.events.length, 130);
  assert.equal(p.events[129].step, 129);
  assert.equal(p.complete, true);
});

await test('scenes: three exist, mutes are read from offset 14 not 13', async () => {
  const link = new Link(new SimTransport(), fast);
  const { scenes, unknown } = await readScenes(link);
  assert.equal(unknown, 0);
  assert.equal(scenes.length, 3);
  assert.deepEqual(scenes[0].mutes, [false, true, true, false, true, true, true, false, true, true, true]);
  assert.equal(scenes[0].length, 64);
});

await test('dropped requests are retried and the result is still complete', async () => {
  const link = new Link(new SimTransport({ dropRate: 0.3, random: seeded(7) }), fast);
  const p = await readPattern(link, 0, 1, 16);
  assert.deepEqual(p.events.map(e => e.step), [0, 4, 8, 12]);
  assert.equal(p.complete, true);
  assert.ok(link.stats.retries > 0, 'the test must actually have exercised a retry');
});

await test('a silent device is reported as unknown, never as an empty pattern', async () => {
  const link = new Link(new SimTransport({ dropRate: 1 }), { ...fast, attempts: 2 });
  const s = await readSession(link);
  assert.equal(s.tempo, null);
  assert.equal(s.playing, null);
  const drum = await readPattern(link, 0, 1, 4);
  assert.equal(drum.complete, false);
  assert.deepEqual(drum.unknownSteps, [0, 1, 2, 3]);
  const roll = await readPattern(link, 7, 2, 16);
  assert.equal(roll.complete, false);
  assert.equal((await link.identity()).ok, false);
});

await test('the probe sends only read frames', async () => {
  const t = new SimTransport();
  const link = new Link(t, fast);
  await link.identity();
  await readSession(link);
  for (let p = 0; p < 11; p++) {
    const part = await readPart(link, p);
    await readPattern(link, p, part.typeRaw, part.steps);
  }
  await readScenes(link);
  const identity = 'F0 7E 7F 06 01 F7';
  for (const f of t.sent) {
    const isRequest = f.length === 10 && (f[2] & 0xf0) === 0x30;
    assert.ok(isRequest || hex(f) === identity, `not a read frame: ${hex(f)}`);
  }
  assert.ok(t.sent.length > 100);
});

await test('concurrent reads are serialised and each gets its own answer', async () => {
  const link = new Link(new SimTransport({ latencyMs: 3 }), { paceMs: 0, timeoutMs: 100 });
  const [a, b, c] = await Promise.all([
    link.read([0x30, 0x40, 0x76]), link.read([0x01, 0x10, 0x02]), link.read([0x30, 0x40, 0x7f]),
  ]);
  assert.equal(from14(...a.data), 124);
  assert.deepEqual(b.data, [70]);
  assert.deepEqual(c.data, [0x49]);
});

// ---------- writer

const stepsOf = snapshot => snapshot.map((s, i) => (s ? i : null)).filter(i => i !== null);

await test('step add and delete frames match the documented bytes', async () => {
  const t = new SimTransport();
  const link = new Link(t, { ...fast, writePaceMs: 0 });
  const wanted = await readSteps(link, 0, 16);
  wanted[3] = { ...DEFAULT_STEP };
  wanted[0] = null;
  t.sent.length = 0;
  await writeDrumPattern(link, 0, wanted);
  const writes = t.sent.filter(f => (f[2] & 0xf0) === 0x10).map(hex);
  assert.deepEqual(writes, [
    'F0 43 10 7F 1C 0C 70 20 00 00 F7',                 // delete step 0
    'F0 43 10 7F 1C 0C 70 00 00 03 3C 64 00 78 F7',     // add middle C on step 3 (documented frame)
  ]);
});

await test('writing a drum pattern changes only the steps that differ and verifies', async () => {
  const t = new SimTransport();
  const link = new Link(t, { ...fast, writePaceMs: 0 });
  const r = await writeDrumPattern(link, 1, everyNth(16, 4));      // SNARE had steps 4 and 12
  assert.deepEqual(stepsOf(r.before), [4, 12]);
  assert.deepEqual(stepsOf(r.after), [0, 4, 8, 12]);
  assert.equal(r.changed, 2);
  assert.equal(r.ok, true);
  assert.equal(link.stats.writes, 2);
  // Other parts untouched.
  assert.deepEqual(stepsOf(await readSteps(link, 0, 16)), [0, 4, 8, 12]);
  assert.deepEqual(stepsOf(await readSteps(link, 3, 16)), [2, 6, 10, 14]);
});

await test('restoring the snapshot puts the old pattern back, micro timing included', async () => {
  const t = new SimTransport();
  t.memory.set('112,67,2', [60, 90, 2, 45, 0, 100]);                // HAT 1 step 2: non-default step
  const link = new Link(t, { ...fast, writePaceMs: 0 });
  const first = await writeDrumPattern(link, 3, everyNth(16, 4));
  const back = await writeDrumPattern(link, 3, first.before);
  assert.equal(back.ok, true);
  assert.deepEqual(back.after, first.before);
  assert.deepEqual(back.after[2], { note: 60, velocity: 90, retrigger: 2, microTiming: 45, gate: 100 });
});

await test('a write the machine ignored is reported as a mismatch, not as success', async () => {
  const link = new Link(new SimTransport({ writeDropRate: 1 }), { ...fast, writePaceMs: 0 });
  const r = await writeDrumPattern(link, 1, everyNth(16, 4));
  assert.equal(r.ok, false);
  assert.deepEqual(r.mismatches, [0, 8]);
});

await test('writing is refused while playing, on a non-drum track, or when the machine is silent', async () => {
  const playing = new SimTransport();
  playing.memory.set('1,16,32', [1]);
  await assert.rejects(writeDrumPattern(new Link(playing, fast), 0, everyNth(16)), WriteRefused);
  const t = new SimTransport();
  await assert.rejects(writeDrumPattern(new Link(t, fast), 6, everyNth(16)), WriteRefused);   // PERC 2 is SYNTH-typed
  await assert.rejects(writeDrumPattern(new Link(t, fast), 0, everyNth(8)), WriteRefused);    // wrong length
  const silent = new SimTransport({ dropRate: 1 });
  await assert.rejects(writeDrumPattern(new Link(silent, { ...fast, attempts: 2 }), 0, everyNth(16)), WriteRefused);
  for (const tr of [playing, t, silent]) assert.equal(tr.sent.some(f => (f[2] & 0xf0) === 0x10), false, 'no write frame may be sent');
});

// ---------- piano-roll writer

await test('piano-roll note frame matches the documented layout', async () => {
  assert.deepEqual(rollNote(0, 36), [0x00, 0x3c, 0x00, 0x24, 0x64, 0x00, 0x00, 0x78]);
  assert.deepEqual(rollNote(8, 60, { offset: 0, gate: 360 }), [0x07, 0x40, 0x00, 0x3c, 0x64, 0x00, 0x02, 0x68]);
  const t = new SimTransport();
  const link = new Link(t, { ...fast, writePaceMs: 0 });
  await writeRoll(link, 9, [rollNote(1, 72)]);                        // DX = local index 2
  const writes = t.sent.filter(f => (f[2] & 0xf0) === 0x10).map(hex);
  assert.deepEqual(writes, [
    'F0 43 10 7F 1C 0C 01 19 37 00 F7',                               // clear pattern 0 of part 9
    'F0 43 10 7F 1C 0C 72 20 00 01 34 00 48 64 00 00 78 F7',          // add at tick 180
  ]);
});

await test('writing a synth pattern replaces it, verifies, and can be restored', async () => {
  const t = new SimTransport();
  const link = new Link(t, { ...fast, writePaceMs: 0 });
  const r = await writeRoll(link, 7, testBass(16));
  assert.equal(r.before.length, 4);
  assert.equal(r.after.length, 5);                                    // 4 beats + the fifth on step 14
  assert.equal(r.ok, true);
  assert.equal((await readRoll(link, 8)).length, 2, 'SYNTH 2 must be untouched');
  const back = await writeRoll(link, 7, r.before);
  assert.equal(back.ok, true);
  assert.deepEqual(back.after, r.before);
});

await test('synth writing stops if the clear did not work, and refuses bad input', async () => {
  const stuck = new SimTransport();
  stuck.memory.set('48,87,15', [2]);                                  // machine has pattern 3 selected...
  const link = new Link(stuck, { ...fast, writePaceMs: 0 });
  const realApply = stuck.applyWrite.bind(stuck);
  stuck.applyWrite = msg => { if (msg.addr[0] !== 0x01) realApply(msg); };   // ...and ignores the clear
  await assert.rejects(writeRoll(link, 7, testBass(16)), /clear command left 4/);
  assert.equal(stuck.sent.some(f => f[6] === 0x72), false, 'no note may be added after a failed clear');
  const t = new SimTransport();
  const l2 = new Link(t, fast);
  await assert.rejects(writeRoll(l2, 7, [rollNote(16, 36)]), WriteRefused);   // past the end of 16 steps
  await assert.rejects(writeRoll(l2, 3, testBass(16)), WriteRefused);         // a drum part
  assert.equal(t.sent.some(f => (f[2] & 0xf0) === 0x10), false);
});

// ---------- sounds, tempo, groove

await test('loading a sound sends Bank Select MSB, LSB and Program Change on the part channel', async () => {
  const t = new SimTransport();
  const link = new Link(t, { ...fast, writePaceMs: 0 });
  assert.equal(await loadSound(link, 7, 858, { waitMs: 0 }), true);          // documented example: Acid3 on SYNTH 1
  assert.deepEqual(t.sent.filter(f => f[0] < 0xf0).map(hex), ['B7 00 3F', 'B7 20 06', 'C7 59']);
  assert.equal(preset((await readPart(link, 7)).soundNumber).name, 'Acid3');
});

await test('a sound that did not load is reported, not assumed', async () => {
  const link = new Link(new SimTransport({ writeDropRate: 1 }), { ...fast, writePaceMs: 0 });
  assert.equal(await loadSound(link, 7, 858, { waitMs: 0, tries: 2 }), false);
  assert.equal(await setTempo(link, 99), false);
});

await test('track volume is raised only when it is 0', async () => {
  const t = new SimTransport();
  t.memory.set('48,87,0', [0]);
  const link = new Link(t, { ...fast, writePaceMs: 0 });
  assert.deepEqual(await ensureAudible(link, 7), { ok: true, raised: true });
  assert.deepEqual(await ensureAudible(link, 8), { ok: true, raised: false });
  assert.equal(link.stats.writes, 1);
});

await test('the test groove writes five tracks into a 64-step and 16-step project and verifies each', async () => {
  const t = new SimTransport();
  t.memory.set('48,87,22', to14(64));                                        // SYNTH 1 pattern is 64 steps
  const link = new Link(t, { ...fast, writePaceMs: 0 });
  const r = await writeGroove(link, TEST_GROOVE);
  assert.equal(r.ok, true, JSON.stringify(r.checks.filter(c => !c.ok)));
  assert.equal(two14(t.memory.get('48,64,118')), 124);
  assert.equal((await readRoll(link, 7)).length, 24);                        // 6 notes x 4 bars
  assert.equal((await readRoll(link, 8)).length, 6);                         // 2 chords x 3 notes, one bar
  assert.deepEqual(stepsOf(await readSteps(link, 3, 16)), [2, 6, 10, 14]);
  assert.equal(preset((await readPart(link, 8)).soundNumber).name, 'Detroit Stab');
  assert.deepEqual(stepsOf(await readSteps(link, 2, 16)), [12], 'CLAP is not part of the groove');
});

await test('one failing track is reported and does not stop the others', async () => {
  const t = new SimTransport();
  t.memory.set('1,17,60', [2]);                                              // SNARE re-typed to SYNTH
  const r = await writeGroove(new Link(t, { ...fast, writePaceMs: 0 }), TEST_GROOVE);
  assert.equal(r.ok, false);
  assert.deepEqual(r.checks.filter(c => !c.ok).map(c => c.label), ['SNARE: stopped']);
  assert.equal(r.checks.filter(c => c.ok).length, 10);   // tempo, 4 tracks x (sound + pattern), and the SNARE sound
});

// ---------- song

await test('pattern slots 4-6 are refused unless the mode allows them', async () => {
  const t = new SimTransport();
  const link = new Link(t, { ...fast, writePaceMs: 0 });
  await selectPattern(link, 0, 2);
  await assert.rejects(selectPattern(link, 0, 4), /could not be selected/);       // mode 0: machine stays on 3
  t.memory.set('48,64,121', [1]);
  await selectPattern(link, 0, 4);
});

await test('the test song writes patterns into separate slots and builds four scenes', async () => {
  const t = new SimTransport();
  const link = new Link(t, { ...fast, writePaceMs: 0 });
  const r = await writeSong(link, TEST_SONG);
  assert.equal(r.ok, true, JSON.stringify(r.checks.filter(c => !c.ok)));
  // HAT 1: slot 1 and slot 2 hold different patterns, and slot 1 is selected again at the end.
  assert.deepEqual(stepsOf(await readSteps(link, 3, 16)), [2, 6, 10, 14]);
  await selectPattern(link, 3, 1);
  assert.deepEqual(stepsOf(await readSteps(link, 3, 16)), [0, 2, 4, 6, 8, 10, 12, 14, 15]);
  await selectPattern(link, 8, 1);
  assert.equal((await readRoll(link, 8)).length, 9);
  assert.equal(two14(t.memory.get('48,87,22')), 16);                              // SYNTH 1 pattern 1 length
  const { scenes } = await readScenes(link);
  assert.equal(scenes.length, 4);
  assert.deepEqual(scenes[0].mutes.map(Number), [0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1]);   // Intro: kick + bass
  assert.deepEqual(scenes[3].patterns, [0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0]);            // Lift: second patterns
  assert.deepEqual(scenes[2].mutes.map(Number), [0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1]);
});

await test('a scene write the machine ignored is reported', async () => {
  const t = new SimTransport();
  const real = t.applyScene.bind(t);
  t.applyScene = (am, al, data) => { if (!(al === 0x02 && data[0] === 1)) real(am, al, data); };   // scene 2 mutes ignored
  const r = await writeSong(new Link(t, { ...fast, writePaceMs: 0 }), TEST_SONG);
  assert.equal(r.ok, false);
  assert.match(r.checks.at(-1).detail, /scene\(s\) 2 do not read back/);
});

// ---------- FORGE songs

await test('every starter builds a song that fits the SEQTRAK', async () => {
  const starters = listStarters();
  assert.ok(starters.length >= 100);
  let mergedSongs = 0;
  for (const st of starters) {
    const song = buildSong(st.id, 4242);
    assert.ok(song.scenes.length >= 1 && song.scenes.length <= 16, st.id);
    assert.ok(song.tracks.length >= 1, `${st.id}: no tracks`);
    assert.ok(song.tempo >= 40 && song.tempo <= 240, st.id);
    for (const t of song.tracks) {
      assert.ok(t.part >= 0 && t.part <= 9, st.id);
      assert.ok(t.patterns.length >= 1 && t.patterns.length <= 6, `${st.id} ${t.name}: ${t.patterns.length} patterns`);
      assert.ok(preset(t.sound), `${st.id} ${t.name}: sound ${t.sound}`);
      assert.equal(preset(t.sound).engine, t.part <= 6 ? 'Drum' : t.part === 9 ? 'DX' : 'Synth', `${st.id} ${t.name}`);
      for (const p of t.patterns) {
        assert.ok(p.steps >= 16 && p.steps <= 128 && p.steps % 16 === 0, `${st.id} ${t.name}: ${p.steps} steps`);
        if (t.part <= 6) {
          assert.equal(p.content.length, p.steps);
          for (const h of p.content) if (h) assert.ok(h.velocity >= 1 && h.velocity <= 127 && h.microTiming >= 0 && h.microTiming <= 119);
        } else {
          assert.ok(p.content.length > 0);
          for (const e of p.content) {
            assert.equal(e.length, 8);
            assert.ok(e.every(b => Number.isInteger(b) && b >= 0 && b <= 127), `${st.id} ${t.name}: 7-bit`);
            assert.ok(((e[0] << 7) | e[1]) < p.steps * 120, `${st.id} ${t.name}: event past the end`);
            assert.ok(((e[0] << 7) | e[1]) + ((e[6] << 7) | e[7]) <= p.steps * 120, `${st.id} ${t.name}: note rings past the end`);
          }
        }
      }
    }
    for (const sc of song.scenes) {
      assert.ok(Object.keys(sc.play).length >= 1, `${st.id}: silent scene ${sc.name}`);
      for (const [part, slot] of Object.entries(sc.play)) {
        const t = song.tracks.find(x => x.part === Number(part));
        assert.ok(t && slot < t.patterns.length, `${st.id}: scene points at a missing pattern`);
      }
    }
    if (song.merged) mergedSongs++;
  }
  console.log(`      ${starters.length} starters; ${mergedSongs} needed patterns merged to fit 6 slots`);
});

await test('a machine that shortens a note is reported with the exact difference', async () => {
  const t = new SimTransport();
  const real = t.applyWrite.bind(t);
  t.applyWrite = msg => { if (msg.addr[0] === 0x72) msg.data[7] = 100; real(msg); };      // gate forced to 100
  const r = await writeRoll(new Link(t, { ...fast, writePaceMs: 0 }), 7, [rollNote(0, 36)]);
  assert.equal(r.ok, false);
  assert.equal(r.diff, 'sent 1, found 1; not found: 60/36/100/120; unexpected: 60/36/100/100');
});

await test('tracks a song does not use are muted on the track, the ones it uses are not', async () => {
  const song = buildSong('cosmicVoyage', 440978);
  const used = new Set(song.tracks.map(x => x.part));
  const t = new SimTransport();
  const r = await writeSong(new Link(t, { ...fast, writePaceMs: 0 }), song);
  assert.equal(r.ok, true, JSON.stringify(r.checks.filter(c => !c.ok)));
  for (let p = 0; p < 11; p++) assert.equal(t.memory.get(`48,${0x50 | p},41`)[0], used.has(p) ? 0 : 125, `part ${p}`);
});

await test('the same starter and seed give the same song; another seed gives another', async () => {
  const a = JSON.stringify(buildSong('berlinCathedral', 7));
  assert.equal(JSON.stringify(buildSong('berlinCathedral', 7)), a);
  assert.notEqual(JSON.stringify(buildSong('berlinCathedral', 8)), a);
});

await test('a generated song writes to the simulated SEQTRAK and every read-back matches', async () => {
  const song = buildSong(listStarters().find(s => s.family === 'Detroit').id, 99);
  const t = new SimTransport();
  const link = new Link(t, { ...fast, writePaceMs: 0 });
  const r = await writeSong(link, song);
  assert.equal(r.ok, true, JSON.stringify(r.checks.filter(c => !c.ok)));
  const { scenes } = await readScenes(link);
  assert.equal(scenes.length, song.scenes.length);
  assert.equal(two14(t.memory.get('48,64,118')), song.tempo);
  const bass = song.tracks.find(x => x.part === 7);
  if (bass) assert.equal((await readRoll(link, 7)).length, bass.patterns[0].content.length);
});

console.log(`${passed} tests passed`);
