// TRAK FORGE: pick a MIDI FORGE starter, choose sounds, write the song into a SEQTRAK.
// Song tab = the app; Machine tab = what the SEQTRAK holds; Tools tab = tests and the report.
import { VERSION } from './version.js';
import { createTransport, isNative } from './transport.js';
import { Link } from './seqtrak/link.js';
import { hex } from './seqtrak/sysex.js';
import { readSession, readPart, readPattern, readScenes, PARTS, PART_COUNT, noteName } from './seqtrak/probe.js';
import { preset, presetsFor } from './seqtrak/catalog.js';
import { buildSong, listStarters, FAMILIES } from './forge/song.js';
import { writeDrumPattern, readTarget, everyNth, writeRoll, readRollTarget, testBass, writeGroove, TEST_GROOVE, writeSong, TEST_SONG, loadSound } from './seqtrak/writer.js';

const $ = id => document.getElementById(id);

// Tiny DOM builder. Text always goes in as text nodes, never as HTML: MIDI port names come
// from outside the app.
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'onclick') node.addEventListener('click', v);
    else if (v !== false && v !== null && v !== undefined) node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

const state = {
  transport: null,
  link: null,
  connected: false,
  deviceName: null,
  identity: null,
  session: null,
  parts: new Array(PART_COUNT).fill(null),
  patterns: new Array(PART_COUNT).fill(null),
  scenes: null,
  busy: false,
  error: null,
  tests: {},
  bulk: { forge: { armed: null, result: null }, groove: { armed: null, result: null }, song: { armed: null, result: null } },
  forgeSong: null,
  tab: 'song',
  starterId: null,
  family: '',
  sounds: {},          // part -> { state: 'sending' | 'ok' | 'bad' } for sounds sent to the machine
  live: {},            // part -> sound picked for a track the current song does not use
  picker: null,        // { part, category, query }
  machine: {},         // part -> sound number read from the SEQTRAK at connect
  log: [],
};

const LOG_LINES = 200;
function logFrame(direction, bytes) {
  state.log.push(`${direction === 'out' ? '->' : '<-'} ${hex(bytes)}`);
  if (state.log.length > LOG_LINES) state.log.splice(0, state.log.length - LOG_LINES);
}

// ---------- rendering

function fact(label, value, suffix = '') {
  const unknown = value === null || value === undefined;
  return el('div', { class: unknown ? 'fact unknown' : 'fact' }, el('b', {}, unknown ? 'no reply' : `${value}${suffix}`), el('span', {}, label));
}

function renderStatus() {
  const pill = $('status');
  if (!state.connected) {
    pill.className = 'pill';
    pill.textContent = 'Not connected';
  } else if (!isNative) {
    pill.className = 'pill demo';
    pill.textContent = 'Demo: simulated data';
  } else {
    pill.className = 'pill ok';
    pill.textContent = state.deviceName || 'Connected';
  }
  if (state.busy && !state.connected) { pill.className = 'pill'; pill.textContent = 'Working'; }
  const banner = $('banner');
  banner.hidden = !state.error && isNative;
  banner.className = 'banner warn';
  banner.textContent = state.error
    ?? 'Demo mode. This is not a real SEQTRAK: everything "read" or "written" goes to a built-in simulator. Run the iPad app to use your machine.';
  $('connect').textContent = state.connected ? 'Reconnect' : 'Connect';
  $('connect').disabled = state.busy;
  $('read-all').disabled = !state.connected || state.busy;
}

function renderSession() {
  const box = $('session');
  box.replaceChildren();
  const s = state.session;
  if (!s) {
    box.append(el('p', { class: 'dim' }, state.connected ? 'Press "Read everything".' : 'Connect the SEQTRAK with a USB-C cable, then press Connect.'));
    return;
  }
  const id = state.identity;
  box.append(
    fact('Project', s.currentProject === null ? null : s.currentProject + 1),
    fact('Tempo', s.tempo, ' BPM'),
    fact('Key', s.key),
    fact('Scale', s.scale),
    fact('Sequencer', s.playing === null ? null : s.playing ? 'Playing' : 'Stopped'),
    fact('Master length', s.masterStep, ' steps'),
    fact('Patterns reachable', s.patternSelectMode === null ? null : s.patternSelectMode === 1 ? '1-6' : '1-3'),
    fact('Battery', s.battery, '%'),
    fact('OS version', id?.ok && id.isSeqtrak ? id.osVersion.toFixed(1) : null),
  );
}

function patternGrid(part, pattern) {
  const steps = Math.max(part.steps ?? 16, 16);
  const byStep = new Map();
  for (const e of pattern.events) {
    if (e.type !== undefined && e.type !== 0) continue;        // only notes are drawn
    if (!byStep.has(e.step)) byStep.set(e.step, []);
    byStep.get(e.step).push(e);
  }
  const drum = pattern.model === 'step';
  const cells = [];
  for (let i = 0; i < steps; i++) {
    const hits = byStep.get(i);
    const unknown = pattern.unknownSteps.includes(i);
    const cls = ['cell', i % 4 === 0 ? 'beat' : '', hits ? 'hit' : '', unknown ? 'unknown' : ''].filter(Boolean).join(' ');
    const label = unknown ? '?' : hits ? (drum ? i + 1 : hits.map(h => noteName(h.note)).join(' ')) : i + 1;
    cells.push(el('div', { class: cls }, label));
  }
  const wrap = el('div', {}, el('div', { class: 'grid' }, cells));
  const beyond = pattern.events.filter(e => e.step >= steps).length;
  const notes = [];
  if (!pattern.complete) notes.push('Some requests got no reply, so this pattern may be incomplete. Read it again.');
  if (pattern.unverifiedLayout) notes.push('DRUMKIT tracks: the event list layout is not confirmed, so this may be cut short.');
  if (beyond) notes.push(`${beyond} event(s) sit past the pattern length and are not drawn.`);
  for (const n of notes) wrap.append(el('div', { class: 'note' }, n));
  if (pattern.complete && pattern.events.length === 0) wrap.append(el('div', { class: 'meta' }, 'Empty pattern.'));
  return wrap;
}

function renderTracks() {
  const box = $('tracks');
  box.replaceChildren();
  for (let p = 0; p < PART_COUNT; p++) {
    const part = state.parts[p];
    const row = el('div', { class: part?.muted ? 'track muted' : 'track' });
    if (!part) {
      row.append(el('div', { class: 'track-head' }, el('div', { class: 'track-name' }, PARTS[p]), el('div', { class: 'tag' }, '-'), el('div', { class: 'dim' }, 'Not read yet.')));
      box.append(row);
      continue;
    }
    const sound = preset(part.soundNumber);
    const soundCell = p === 10
      ? el('div', { class: 'sound dim' }, 'Sampler: no sound number to read')
      : sound
        ? el('div', { class: 'sound' }, sound.name, el('small', {}, `${sound.category} · #${sound.number}`))
        : el('div', { class: 'sound dim' }, part.soundNumber ? `Sound #${part.soundNumber} (not in the preset list)` : 'no reply');
    const meta = [
      part.pattern === null ? 'pattern ?' : `pattern ${part.pattern + 1}`,
      part.steps === null ? '? steps' : `${part.steps} steps`,
      part.volume === null ? 'vol ?' : `vol ${part.volume}`,
      part.muted ? 'muted' : null,
    ].filter(Boolean).join(' · ');
    row.append(el('div', { class: 'track-head' },
      el('div', { class: 'track-name' }, part.name),
      el('div', { class: 'tag' }, part.type ?? (part.typeRaw === null ? 'no reply' : `type ${part.typeRaw}`)),
      soundCell,
      el('div', { class: 'meta' }, meta),
      el('button', { class: 'small', disabled: state.busy || !state.connected, onclick: () => run(() => loadPattern(p)) }, state.patterns[p] ? 'Read again' : 'Read notes'),
    ));
    if (state.patterns[p]) row.append(patternGrid(part, state.patterns[p]));
    box.append(row);
  }
}

function renderScenes() {
  const box = $('scenes');
  box.replaceChildren();
  if (!state.scenes) { box.className = 'dim'; box.textContent = 'Not read yet.'; return; }
  box.className = '';
  const { scenes, unknown } = state.scenes;
  if (scenes.length === 0) {
    box.append(el('p', { class: 'dim' }, unknown ? 'No scene answered. Read again.' : 'This project has no scenes.'));
    return;
  }
  const head = el('tr', {}, el('th', {}, 'Scene'), el('th', {}, 'Len'), PARTS.map(n => el('th', {}, n)));
  const rows = scenes.map(s => el('tr', {},
    el('td', {}, s.scene + 1),
    el('td', {}, s.length),
    s.patterns.map((pat, i) => el('td', { class: s.mutes[i] ? 'off' : 'on' }, s.mutes[i] ? 'mute' : `P${pat + 1}`)),
  ));
  box.append(el('table', { class: 'scene-table' }, head, rows));
  box.append(el('p', { class: 'dim' }, `P = the pattern a track plays in that scene. The unit of "Len" is not known yet.${unknown ? ` ${unknown} scene request(s) got no reply.` : ''}`));
}

function renderLink() {
  const stats = state.link?.stats;
  const box = $('stats');
  box.replaceChildren();
  if (stats) {
    box.append(fact('Requests', stats.requests), fact('Replies', stats.replies), fact('Retries', stats.retries), fact('No reply', stats.failures), fact('Writes', stats.writes));
  }
  const log = $('log');
  log.textContent = state.log.slice(-60).join('\n');
  log.scrollTop = log.scrollHeight;
}

// The write tests. `cells(snapshot, steps)` turns a read-back into one label per step (null = empty).
const TESTS = [
  {
    id: 'kick', track: 'KICK', part: 0,
    title: 'Kick on steps 1, 5, 9, 13',
    target: link => readTarget(link, 0),
    wanted: steps => everyNth(steps, 4),
    write: (link, wanted, onProgress) => writeDrumPattern(link, 0, wanted, onProgress),
    cells: (snap, steps) => Array.from({ length: steps }, (_, i) => (snap[i] ? String(i + 1) : null)),
  },
  {
    id: 'bass', track: 'SYNTH 1', part: 7,
    title: 'Bass: C1 on every beat (with the kick), G1 on step 15 of each bar',
    target: link => readRollTarget(link, 7),
    wanted: steps => testBass(steps),
    write: (link, wanted, onProgress) => writeRoll(link, 7, wanted, onProgress),
    cells: (snap, steps) => {
      const out = new Array(steps).fill(null);
      for (const e of snap) {
        if (e[2] !== 0) continue;
        const st = Math.floor(((e[0] << 7) | e[1]) / 120);
        if (st < steps) out[st] = out[st] ? `${out[st]} ${noteName(e[3])}` : noteName(e[3]);
      }
      return out;
    },
  },
];
const testState = id => (state.tests[id] ??= { armed: null, result: null, snapshot: null, restored: false });

function cellGrid(labels) {
  return el('div', { class: 'grid' }, labels.map((label, i) =>
    el('div', { class: ['cell', i % 4 === 0 ? 'beat' : '', label ? 'hit' : ''].filter(Boolean).join(' ') }, label ?? i + 1)));
}

function renderWrite() {
  const box = $('write-tests');
  box.replaceChildren();
  for (const test of TESTS) {
    const w = testState(test.id);
    const off = !state.connected || state.busy;
    const row = el('div', { class: 'track' },
      el('p', {}, el('b', {}, `${test.track}. `), test.title),
      el('div', { class: 'row' },
        el('button', { class: w.armed ? 'danger' : '', disabled: off, onclick: () => run(() => runTest(test)) },
          w.armed ? `Confirm: overwrite ${test.track}, pattern ${w.armed.pattern + 1}, project ${w.armed.project + 1}` : 'Write'),
        w.armed ? el('button', { onclick: () => { w.armed = null; render(); } }, 'Cancel') : null,
        el('button', { disabled: off || !w.snapshot, onclick: () => run(() => restoreTest(test)) }, 'Put the old pattern back'),
      ));
    const r = w.result;
    if (r) {
      const where = `${test.track}, pattern ${r.target.pattern + 1}, project ${r.target.project + 1}`;
      const problem = r.moved
        ? `The project or pattern changed on the SEQTRAK during the write (${where}). Check the machine.`
        : r.mismatches
          ? `Read-back does not match on step(s) ${r.mismatches.map(i => i + 1).join(', ')} (${where}).`
          : `Read-back does not match (${where}): ${r.missing} event(s) missing, ${r.extra} unexpected.`;
      const verdict = r.ok ? `${w.restored ? 'Old pattern restored' : 'Written and verified'}: ${where}. ${r.changed} ${r.mismatches ? 'step(s) changed' : 'event(s) written'}.` : problem;
      row.append(el('div', { class: r.ok ? 'result ok' : 'result bad' },
        el('b', {}, r.ok ? 'OK. ' : 'Not verified. '), verdict,
        el('div', { class: 'label' }, 'Before'), cellGrid(test.cells(r.before, r.target.steps)),
        el('div', { class: 'label' }, 'After (read back from the SEQTRAK)'), cellGrid(test.cells(r.after, r.target.steps))));
    }
    box.append(row);
  }
}

const BULK = [
  { id: 'forge', idle: 'Write to SEQTRAK', confirm: n => `Confirm: write over project ${n}`, write: (link, onProgress) => writeSong(link, state.forgeSong, onProgress), needs: () => !!state.forgeSong, primary: true, custom: true },
  { id: 'groove', idle: 'Write groove', confirm: n => `Confirm: overwrite five tracks in project ${n}`, write: (link, onProgress) => writeGroove(link, TEST_GROOVE, onProgress) },
  { id: 'song', idle: 'Write song', confirm: n => `Confirm: replace scenes and five tracks in project ${n}`, write: (link, onProgress) => writeSong(link, TEST_SONG, onProgress) },
];

function renderBulk() {
  for (const card of BULK) {
    const g = state.bulk[card.id];
    const b = $(card.id);
    b.disabled = !state.connected || state.busy || (card.needs ? !card.needs() : false);
    b.className = (g.armed !== null ? 'danger' : card.primary ? 'primary' : '') + (card.custom ? ' big' : '');
    b.textContent = g.armed !== null ? card.confirm(g.armed + 1) : card.custom && !state.connected ? 'Connect the SEQTRAK to write' : card.idle;
    $(`${card.id}-cancel`).hidden = g.armed === null;
    const box = $(`${card.id}-result`);
    box.replaceChildren();
    const r = g.result;
    if (!r) continue;
    if (card.custom) { box.append(songResult(r)); continue; }
    box.append(el('div', { class: r.ok ? 'result ok' : 'result bad' },
      el('b', {}, r.ok ? 'OK. ' : 'Not everything verified. '), `Project ${r.project + 1}.${r.seconds !== undefined ? ` Took ${r.seconds} s.` : ''}`),
      el('ul', { class: 'checks' }, r.checks.map(c => el('li', { class: c.ok ? 'yes' : 'no' }, c.label, c.detail ? el('small', {}, ` · ${c.detail}`) : null))));
  }
}

// The outcome of writing a song, said plainly; the full checklist stays one tap away.
function songResult(r) {
  const failed = r.checks.filter(c => !c.ok);
  const song = r.song;
  const box = el('div', { class: failed.length ? 'done bad' : 'done' });
  box.append(el('h3', {}, failed.length ? `Written with ${failed.length} problem(s)` : `"${song?.name ?? 'Song'}" is on the SEQTRAK`));
  box.append(el('p', {}, `Project ${r.project + 1} · ${song ? `${song.scenes.length} scenes · ${song.tempo} BPM · ` : ''}${r.seconds} s · ${r.checks.length - failed.length} of ${r.checks.length} steps verified by reading back.`));
  if (failed.length) box.append(el('ul', { class: 'checks' }, failed.map(c => el('li', { class: 'no' }, c.label, c.detail ? el('small', {}, ` · ${c.detail}`) : null))));
  else box.append(el('p', { class: 'dim' }, 'To hear the arrangement: on the SEQTRAK hold ALL and press PROJECT (Song mode plays the scenes in order; the same again gives Scene mode, where you switch scenes yourself). Save the project on the machine to keep it.'));
  box.append(el('details', { class: 'more' }, el('summary', {}, 'All steps'),
    el('ul', { class: 'checks' }, r.checks.map(c => el('li', { class: c.ok ? 'yes' : 'no' }, c.label, c.detail ? el('small', {}, ` · ${c.detail}`) : null)))));
  return box;
}

function renderTabs() {
  for (const b of $('tabs').children) b.className = b.dataset.tab === state.tab ? 'on' : '';
  for (const t of ['song', 'machine', 'tools']) $(`tab-${t}`).hidden = t !== state.tab;
}

function render() {
  renderTabs();
  renderSounds();
  renderWrite();
  renderBulk();
  renderStatus();
  renderSession();
  renderTracks();
  renderScenes();
  renderLink();
}

function progress(text, done, total) {
  const box = $('progress');
  box.hidden = text === null;
  if (text === null) return;
  $('progress-text').textContent = text;
  $('progress-bar').style.width = total ? `${Math.round((done / total) * 100)}%` : '100%';
}

// ---------- actions

async function run(action) {
  if (state.busy) return;
  state.busy = true;
  state.error = null;
  render();
  try {
    await action();
  } catch (e) {
    console.error(e);
    state.error = e?.name === 'WriteRefused' || /Nothing was written/.test(e?.message || '') ? e.message : `Something went wrong: ${e?.message || e}`;
    for (const w of Object.values(state.tests)) w.armed = null;
    for (const g of Object.values(state.bulk)) g.armed = null;
  }
  state.busy = false;
  progress(null);
  render();
}

function showPorts(result) {
  const box = $('ports');
  const hasPorts = result.sources.length + result.destinations.length > 0;
  box.hidden = false;
  const names = [...new Set([...result.sources, ...result.destinations].map(e => e.name))].join(', ');
  const checked = `Checked at ${new Date().toLocaleTimeString()}.`;
  $('ports-help').textContent = hasPorts
    ? `${checked} No port with "SEQTRAK" in its name. The iPad sees: ${names}. "Network Session" is the iPad's own Wi-Fi MIDI port, not the SEQTRAK.`
    : `${checked} The iPad sees no MIDI device. Check the USB-C cable carries data, and that the SEQTRAK is on.`;
  const fill = (select, list) => select.replaceChildren(...list.map(e => el('option', { value: e.id }, e.name)));
  fill($('port-in'), result.sources);
  fill($('port-out'), result.destinations);
  $('port-use').disabled = !result.sources.length || !result.destinations.length;
}

async function afterConnect(name) {
  state.connected = true;
  state.deviceName = name;
  $('ports').hidden = true;
  state.link?.close();
  state.link = new Link(state.transport, { log: logFrame });
  state.identity = await state.link.identity();
  // Which sound each track holds now, so the Sounds list can show tracks the song does not use.
  // Ten quick reads; nothing is written.
  state.machine = {};
  for (let part = 0; part <= 9; part++) {
    const r = await state.link.read([0x01, 0x10 | part, 0x33]);
    if (r.ok && r.data.length >= 2) state.machine[part] = ((r.data[0] << 7) | r.data[1]) + 1;
  }
}

async function connect() {
  if (!state.transport) {
    // A MIDI device was plugged in or removed: if nothing is connected yet, try to connect.
    state.transport = await createTransport(() => { if (!state.busy && !state.connected) run(connect); });
  }
  const result = await state.transport.connect();
  if (!result.connected) {
    state.connected = false;
    showPorts(result);
    return;
  }
  await afterConnect(result.name);
}

async function loadPattern(p) {
  const part = state.parts[p];
  if (!part) return;
  state.patterns[p] = await readPattern(state.link, p, part.typeRaw, part.steps, (done, total) => {
    progress(`${part.name}: ${total ? `step ${done} of ${total}` : `${done} notes`}`, done, total);
  });
}

async function readEverything() {
  state.patterns.fill(null);
  progress('Session', 0, 1);
  state.identity = await state.link.identity();
  state.session = await readSession(state.link);
  renderSession();
  for (let p = 0; p < PART_COUNT; p++) {
    progress(`Track ${PARTS[p]}`, p, PART_COUNT);
    state.parts[p] = await readPart(state.link, p);
    renderTracks();
  }
  state.scenes = await readScenes(state.link, (done, total) => progress('Scenes', done, total));
}

// First press reads where the write would land and arms the button; second press writes.
async function runTest(test) {
  const w = testState(test.id);
  if (!w.armed) {
    w.armed = await test.target(state.link);
    return;
  }
  const armed = w.armed;
  w.armed = null;
  const now = await test.target(state.link);
  if (now.project !== armed.project || now.pattern !== armed.pattern) {
    throw new Error('The project or pattern changed on the SEQTRAK since you pressed the button. Nothing was written.');
  }
  const r = await test.write(state.link, test.wanted(now.steps), (label, d, t) => progress(`${test.track}: ${label} ${d}${t ? ` of ${t}` : ''}`, d, t));
  w.result = r;
  w.restored = false;
  if (!w.snapshot) w.snapshot = { target: r.target, content: r.before };   // keep the ORIGINAL pattern
  state.patterns[test.part] = null;
}

// ---------- song starter

const STARTERS = listStarters();
const ROLE = { bass: 'Bass', chords: 'Chords', pad: 'Pad', arp: 'Arp', lead: 'Lead', counterMelody: 'Counter melody', drums: 'Drums' };

// Sound choices are remembered per starter, so a new seed of the same starter keeps them.
const STORE = 'trakforge.sounds.v1';
function loadChoices() {
  try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch { return {}; }
}
function saveChoices(all) {
  try { localStorage.setItem(STORE, JSON.stringify(all)); } catch { /* storage unavailable: choices last for this session */ }
}
const choices = loadChoices();
const chosen = () => (choices[state.starterId] ??= {});

function rebuildSong() {
  const seed = Math.max(1, Math.min(999999, Number($('st-seed').value) || 1));
  const meta = STARTERS.find(x => x.id === state.starterId);
  $('st-desc').textContent = meta ? meta.desc : '';
  const box = $('st-preview');
  box.replaceChildren();
  try {
    state.forgeSong = buildSong(state.starterId, seed);
  } catch (e) {
    state.forgeSong = null;
    box.append(el('div', { class: 'note' }, `This starter could not be built: ${e?.message || e}`));
    return;
  }
  const song = state.forgeSong;
  for (const t of song.tracks) {
    t.suggested = t.sound;
    const pick = chosen()[t.part];
    if (pick && preset(pick)) t.sound = pick;
  }
  box.append(el('div', { class: 'song-head' }, el('b', {}, song.name), ` · ${song.tempo} BPM · ${song.key}`));
  const head = el('tr', {}, el('th', {}, 'Scene'), song.tracks.map(t => el('th', {}, t.name)));
  const rows = song.scenes.map((sc, i) => el('tr', {}, el('td', {}, `${i + 1} ${sc.name}`),
    song.tracks.map(t => (t.part in sc.play ? el('td', { class: 'on' }, `P${sc.play[t.part] + 1}`) : el('td', { class: 'off' }, '-')))));
  box.append(el('table', { class: 'scene-table' }, head, rows));
  const events = song.tracks.reduce((a, t) => a + t.patterns.reduce((b, p) => b + (t.part <= 6 ? p.content.filter(Boolean).length : p.content.length), 0), 0);
  const patterns = song.tracks.reduce((a, t) => a + t.patterns.length, 0);
  box.append(el('p', { class: 'dim' }, `${song.scenes.length} scenes, ${patterns} patterns, ${events} notes. P = the pattern a track plays in that scene; "-" = silent. Patterns are 8 bars at most.${song.merged ? ` ${song.merged} section pattern(s) were folded into a similar one to fit six per track.` : ''}`));
}

function songChanged() {
  state.bulk.forge.armed = null;
  state.bulk.forge.result = null;
  state.sounds = {};
  rebuildSong();
  renderStarters();
  render();
}

function renderStarters() {
  $('st-families').replaceChildren(
    ...[['', 'All'], ...FAMILIES.map(f => [f, f])].map(([value, label]) =>
      el('button', { class: state.family === value ? 'chip on' : 'chip', onclick: () => { state.family = value; renderStarters(); } }, label)));
  const list = STARTERS.filter(x => !state.family || x.family === state.family);
  $('st-list').replaceChildren(...list.map(x =>
    el('button', { class: x.id === state.starterId ? 'starter on' : 'starter', onclick: () => { state.starterId = x.id; songChanged(); } },
      el('b', {}, x.name), el('small', {}, `${x.family} · ${x.bpm} BPM`))));
}

function setupStarters() {
  // Rebuild as the seed is typed, and never when nothing changed: a rebuild replaces the buttons
  // below, and one triggered by the field losing focus would swallow the tap that caused it.
  const seedEdited = () => { if ((Number($('st-seed').value) || 1) !== state.forgeSong?.seed) songChanged(); };
  $('st-seed').addEventListener('input', seedEdited);
  $('st-seed').addEventListener('change', seedEdited);
  $('st-roll').addEventListener('click', () => { $('st-seed').value = String(1 + Math.floor(Math.random() * 999998)); songChanged(); });
  $('st-seed').value = String(1 + Math.floor(Math.random() * 999998));
  state.starterId = STARTERS[0].id;
  $('snd-reset').addEventListener('click', () => { delete choices[state.starterId]; saveChoices(choices); songChanged(); });
  rebuildSong();
  renderStarters();
}

// ---------- sounds

// The sound a track will get: the song's (suggested or chosen) for a track the song uses, or
// whatever was picked here / read from the machine for one it does not.
function soundOf(part) {
  const t = state.forgeSong?.tracks.find(x => x.part === part);
  if (t) return t.sound;
  return state.live[part] ?? state.parts[part]?.soundNumber ?? state.machine[part] ?? null;
}

function renderSounds() {
  const song = state.forgeSong;
  $('snd-help').textContent = state.connected
    ? 'Tap a sound to change it. The SEQTRAK loads it at once and plays a note, so you can choose by ear.'
    : 'Tap a sound to change it. Connect the SEQTRAK to hear each choice as you make it.';
  $('snd-reset').disabled = !Object.keys(choices[state.starterId] ?? {}).length;
  const box = $('sounds');
  box.replaceChildren();
  for (let part = 0; part <= 9; part++) {
    const t = song?.tracks.find(x => x.part === part);
    const number = soundOf(part);
    const info = preset(number);
    const changed = !!t && t.sound !== t.suggested;
    const st = state.sounds[part]?.state;
    const role = t ? (part <= 6 ? `${t.patterns.length} pattern${t.patterns.length > 1 ? 's' : ''}` : `${ROLE[t.source] ?? t.source} · ${t.patterns.length} pattern${t.patterns.length > 1 ? 's' : ''}`) : 'not in this song';
    box.append(el('div', { class: ['snd', t ? '' : 'off', changed ? 'changed' : ''].filter(Boolean).join(' ') },
      el('div', { class: 'snd-name' }, el('b', {}, PARTS[part]), el('small', {}, role)),
      el('button', { class: 'snd-pick', onclick: () => openPicker(part) },
        el('span', {}, el('b', {}, info ? info.name : number ? `User sound #${number}` : 'Choose a sound'),
          el('small', {}, info ? `${info.category}${changed ? ' · your choice' : t ? ' · suggested' : ' · on the SEQTRAK now'}` : number ? 'not a catalogue preset' : 'leaves the track as it is')),
        el('span', { class: 'chev' }, '›')),
      el('div', { class: `snd-state ${st === 'ok' ? 'ok' : st === 'bad' ? 'bad' : ''}` }, st === 'ok' ? 'on SEQTRAK' : st === 'bad' ? 'not loaded' : st === 'sending' ? 'sending' : '')));
  }
}

// Sends a sound to the machine now and plays one note with it. Outside the normal busy lock so
// the picker stays responsive; the link itself still sends one message at a time.
async function audition(part, number) {
  if (!state.connected || state.busy) return;
  const token = (state.sounds[part] = { state: 'sending' });
  renderSounds(); renderPickerFoot();
  let ok = false;
  try {
    ok = await loadSound(state.link, part, number, { waitMs: 100, tries: 8 });
    if (ok) {
      const note = part <= 6 ? 60 : part === 7 && state.forgeSong?.voices.bass ? 36 : 60;
      await state.link.sendRaw([0x90 | part, note, 100]);
      setTimeout(() => state.link?.sendRaw([0x80 | part, note, 0]).catch(() => {}), 350);
    }
  } catch (e) {
    console.error(e);
  }
  if (state.sounds[part] !== token) return;       // a newer pick took over
  token.state = ok ? 'ok' : 'bad';
  if (state.parts[part] && ok) state.parts[part].soundNumber = number;
  if (ok) state.machine[part] = number;
  renderSounds(); renderPickerFoot();
}

function setSound(part, number) {
  const t = state.forgeSong?.tracks.find(x => x.part === part);
  if (t) {
    t.sound = number;
    if (number === t.suggested) delete chosen()[part]; else chosen()[part] = number;
    saveChoices(choices);
    state.bulk.forge.result = null;
  } else state.live[part] = number;
  audition(part, number);
  renderSounds();
  renderPicker();
}

// ---------- sound picker

// Where the list opens for a track that has no catalogue sound yet.
const NATURAL_CATEGORY = { 0: 'Kick', 1: 'Snare', 2: 'Clap', 3: 'Closed HiHat', 4: 'Open HiHat' };

function openPicker(part) {
  const now = preset(soundOf(part));
  state.picker = { part, category: now?.category ?? NATURAL_CATEGORY[part] ?? '', query: '' };
  $('pk-search').value = '';
  $('picker').hidden = false;
  renderPicker();
  $('pk-list').querySelector('.on')?.scrollIntoView({ block: 'center' });
}

function closePicker() {
  state.picker = null;
  $('picker').hidden = true;
  render();
}

function renderPickerFoot() {
  const pk = state.picker;
  if (!pk) return;
  const st = state.sounds[pk.part]?.state;
  $('pk-foot').textContent = !state.connected ? 'Not connected: the choice is kept and sent when you write the song.'
    : st === 'sending' ? 'Sending to the SEQTRAK…'
      : st === 'ok' ? 'Loaded on the SEQTRAK. A test note was played.'
        : st === 'bad' ? 'The SEQTRAK did not confirm this sound. Try again.'
          : 'Tap a sound to load it on the SEQTRAK and hear it.';
}

const PICKER_LIMIT = 300;
function renderPicker() {
  const pk = state.picker;
  if (!pk) return;
  const all = presetsFor(pk.part);
  const current = soundOf(pk.part);
  $('pk-title').textContent = PARTS[pk.part];
  $('pk-now').textContent = preset(current)?.name ?? '';
  const cats = [...new Set(all.map(x => x.category))];
  $('pk-cats').replaceChildren(
    ...[['', 'All'], ...cats.map(c => [c, c])].map(([value, label]) =>
      el('button', { class: pk.category === value ? 'chip on' : 'chip', onclick: () => { pk.category = value; renderPicker(); $('pk-list').scrollTop = 0; } }, label)));
  const q = pk.query.trim().toLowerCase();
  // A search looks through every category; without one, the chosen category is shown.
  const list = all.filter(x => (q ? x.name.toLowerCase().includes(q) || x.category.toLowerCase().includes(q) : !pk.category || x.category === pk.category));
  const shown = list.slice(0, PICKER_LIMIT);
  $('pk-list').replaceChildren(...shown.map(x =>
    el('button', { class: x.number === current ? 'pk-item on' : 'pk-item', onclick: () => setSound(pk.part, x.number) },
      el('span', {}, x.name), el('small', {}, `${x.category} · ${x.number}`))));
  if (!shown.length) $('pk-list').append(el('p', { class: 'dim', style: 'padding:12px;margin:0' }, 'No sound matches.'));
  else if (list.length > shown.length) $('pk-list').append(el('p', { class: 'dim', style: 'padding:12px;margin:0' }, `${list.length - shown.length} more: type to narrow the list.`));
  renderPickerFoot();
}

async function runBulk(card) {
  const g = state.bulk[card.id];
  const r = await state.link.read([0x01, 0x10, 0x15]);
  const project = r.ok && r.data.length ? r.data[0] : null;
  if (project === null) throw new Error('The SEQTRAK did not say which project is current. Nothing was written.');
  if (g.armed === null) { g.armed = project; return; }
  const armed = g.armed;
  g.armed = null;
  if (project !== armed) throw new Error('The project changed on the SEQTRAK since you pressed the button. Nothing was written.');
  g.result = await card.write(state.link, (label, d, t) => progress(`${card.idle}: ${label}`, d, t));
  if (card.custom) { g.result.song = { name: state.forgeSong.name, tempo: state.forgeSong.tempo, scenes: state.forgeSong.scenes.map(x => x.name) }; state.sounds = {}; }
  state.patterns.fill(null);
  state.parts.fill(null);
  state.scenes = null;
}

async function restoreTest(test) {
  const w = testState(test.id);
  const saved = w.snapshot.target;
  const now = await test.target(state.link);
  if (now.project !== saved.project || now.pattern !== saved.pattern) {
    throw new Error(`The saved pattern belongs to project ${saved.project + 1}, pattern ${saved.pattern + 1}. Select that on the SEQTRAK first. Nothing was written.`);
  }
  w.result = await test.write(state.link, w.snapshot.content, (label, d, t) => progress(`${test.track}: ${label} ${d}${t ? ` of ${t}` : ''}`, d, t));
  w.restored = true;
  if (w.result.ok) w.snapshot = null;
  state.patterns[test.part] = null;
}

// Everything read so far, as text to paste into a message when something looks wrong.
function report() {
  return JSON.stringify({
    app: `TRAK FORGE ${VERSION}`,
    mode: isNative ? 'device' : 'demo (simulated)',
    device: state.deviceName,
    identity: state.identity?.bytes ? hex(state.identity.bytes) : null,
    session: state.session,
    parts: state.parts.map(p => p && { ...p, sound: preset(p.soundNumber)?.name ?? null }),
    patterns: state.patterns,
    groove: state.bulk.groove.result,
    song: state.bulk.song.result,
    forge: state.forgeSong && { starter: state.forgeSong.starter, seed: state.forgeSong.seed, name: state.forgeSong.name, sounds: Object.fromEntries(state.forgeSong.tracks.map(t => [t.name, { sound: t.sound, name: preset(t.sound)?.name ?? null, suggested: t.suggested }])), result: state.bulk.forge.result },
    soundsSent: state.sounds,
    writeTests: Object.fromEntries(Object.entries(state.tests).map(([id, w]) => [id, w.result])),
    scenes: state.scenes,
    stats: state.link?.stats ?? null,
    log: state.log,
  }, null, 1);
}

async function copyReport() {
  const text = report();
  const button = $('copy-report');
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copied';
  } catch {
    // Clipboard blocked: show the report in the log, where the text can be selected.
    $('log').textContent = text;
    button.textContent = 'Shown below';
  }
  setTimeout(() => { button.textContent = 'Copy report'; }, 1500);
}

// ---------- start

function fail(where, e) {
  console.error(where, e);
  state.error = `${where}: ${e?.message || e}`;
  renderStatus();
}

async function start() {
  $('version').textContent = VERSION;
  // Buttons are wired before anything that can fail, so a startup problem is shown, not silent.
  $('connect').addEventListener('click', () => run(connect));
  $('read-all').addEventListener('click', () => run(readEverything));
  $('copy-report').addEventListener('click', copyReport);
  for (const card of BULK) {
    $(card.id).addEventListener('click', () => run(() => runBulk(card)));
    $(`${card.id}-cancel`).addEventListener('click', () => { state.bulk[card.id].armed = null; render(); });
  }
  $('port-use').addEventListener('click', () => run(async () => {
    await state.transport.connectTo(Number($('port-in').value), Number($('port-out').value));
    await afterConnect($('port-out').selectedOptions[0]?.textContent ?? 'MIDI device');
  }));
  for (const b of $('tabs').children) b.addEventListener('click', () => { state.tab = b.dataset.tab; renderTabs(); window.scrollTo(0, 0); });
  $('pk-done').addEventListener('click', closePicker);
  $('picker').addEventListener('click', ev => { if (ev.target === $('picker')) closePicker(); });
  // Typing searches every category, so the category filter is dropped while there is a query.
  $('pk-search').addEventListener('input', ev => { if (state.picker) { state.picker.query = ev.target.value; if (ev.target.value.trim()) state.picker.category = ''; renderPicker(); } });
  setupStarters();
  window.addEventListener('error', ev => fail('Script error', ev.error || ev.message));
  window.addEventListener('unhandledrejection', ev => fail('Error', ev.reason));
  render();
  await run(connect);
}

start();
