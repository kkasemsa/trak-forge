// TRAK FORGE, phase 1: a read-only view of what a SEQTRAK is holding.
import { VERSION } from './version.js';
import { createTransport, isNative } from './transport.js';
import { Link } from './seqtrak/link.js';
import { hex } from './seqtrak/sysex.js';
import { readSession, readPart, readPattern, readScenes, PARTS, PART_COUNT, noteName } from './seqtrak/probe.js';
import { preset } from './seqtrak/catalog.js';
import { writeDrumPattern, readTarget, everyNth, writeRoll, readRollTarget, testBass } from './seqtrak/writer.js';

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
  if (state.error) {
    banner.className = 'banner warn';
    banner.textContent = state.error;
  } else if (!isNative) {
    banner.className = 'banner warn';
    banner.textContent = 'Demo mode. This is not a real SEQTRAK: every value below comes from a built-in simulator. Run the iPad app to read your machine.';
  } else {
    banner.className = 'banner';
    banner.textContent = 'Reading changes nothing on the SEQTRAK. Only the Write tests card writes to it.';
  }
  $('connect').textContent = state.connected ? 'Reconnect' : 'Connect';
  $('connect').disabled = state.busy;
  $('read-all').disabled = !state.connected || state.busy;
  $('copy-report').disabled = !state.session;
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
    const row = el('div', { class: 'track' });
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

function render() {
  renderWrite();
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
  $('port-use').addEventListener('click', () => run(async () => {
    await state.transport.connectTo(Number($('port-in').value), Number($('port-out').value));
    await afterConnect($('port-out').selectedOptions[0]?.textContent ?? 'MIDI device');
  }));
  window.addEventListener('error', ev => fail('Script error', ev.error || ev.message));
  window.addEventListener('unhandledrejection', ev => fail('Error', ev.reason));
  render();
  await run(connect);
}

start();
