// TRAK FORGE, phase 1: a read-only view of what a SEQTRAK is holding.
import { VERSION } from './version.js';
import { createTransport, isNative } from './transport.js';
import { Link } from './seqtrak/link.js';
import { hex } from './seqtrak/sysex.js';
import { readSession, readPart, readPattern, readScenes, PARTS, PART_COUNT, noteName } from './seqtrak/probe.js';
import { preset } from './seqtrak/catalog.js';
import { writeDrumPattern, readTarget, everyNth } from './seqtrak/writer.js';

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
  write: { armed: null, result: null, snapshot: null, restored: false },
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
    banner.textContent = 'Reading changes nothing on the SEQTRAK. Only the Write test card writes to it.';
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

function stepGrid(snapshot) {
  return el('div', { class: 'grid' }, snapshot.map((st, i) =>
    el('div', { class: ['cell', i % 4 === 0 ? 'beat' : '', st ? 'hit' : ''].filter(Boolean).join(' ') }, i + 1)));
}

function renderWrite() {
  const w = state.write;
  const kick = $('write-kick');
  kick.disabled = !state.connected || state.busy;
  kick.className = w.armed ? 'danger' : '';
  kick.textContent = w.armed
    ? `Confirm: overwrite KICK, pattern ${w.armed.pattern + 1}, project ${w.armed.project + 1}`
    : 'Write test kick';
  $('write-cancel').hidden = !w.armed;
  $('write-restore').disabled = !state.connected || state.busy || !w.snapshot;
  const box = $('write-result');
  box.replaceChildren();
  const r = w.result;
  if (!r) return;
  const where = `KICK, pattern ${r.target.pattern + 1}, project ${r.target.project + 1}`;
  const verdict = r.ok
    ? `${w.restored ? 'Old pattern restored' : 'Written and verified'}: ${where}. ${r.changed} step(s) changed.`
    : r.moved
      ? `The project or pattern changed on the SEQTRAK during the write (${where}). Check the machine.`
      : `Read-back does not match on step(s) ${r.mismatches.map(i => i + 1).join(', ')} (${where}).`;
  box.className = r.ok ? 'result ok' : 'result bad';
  box.append(el('b', {}, r.ok ? 'OK. ' : 'Not verified. '), verdict,
    el('div', { class: 'label' }, 'Before'), stepGrid(r.before),
    el('div', { class: 'label' }, 'After (read back from the SEQTRAK)'), stepGrid(r.after));
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
    state.write.armed = null;
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
async function writeKick() {
  const w = state.write;
  if (!w.armed) {
    w.armed = await readTarget(state.link, 0);
    return;
  }
  const armed = w.armed;
  w.armed = null;
  const now = await readTarget(state.link, 0);
  if (now.project !== armed.project || now.pattern !== armed.pattern) {
    throw new Error('The project or pattern changed on the SEQTRAK since you pressed the button. Nothing was written.');
  }
  const r = await writeDrumPattern(state.link, 0, everyNth(now.steps, 4), (label, d, t) => progress(`${label} step ${d} of ${t}`, d, t));
  w.result = r;
  w.restored = false;
  if (!w.snapshot) w.snapshot = { target: r.target, steps: r.before };   // keep the ORIGINAL pattern
  state.patterns[0] = null;
}

async function restoreKick() {
  const w = state.write;
  const now = await readTarget(state.link, 0);
  if (now.project !== w.snapshot.target.project || now.pattern !== w.snapshot.target.pattern) {
    throw new Error(`The saved pattern belongs to project ${w.snapshot.target.project + 1}, pattern ${w.snapshot.target.pattern + 1}. Select that on the SEQTRAK first. Nothing was written.`);
  }
  w.result = await writeDrumPattern(state.link, 0, w.snapshot.steps, (label, d, t) => progress(`${label} step ${d} of ${t}`, d, t));
  w.restored = true;
  if (w.result.ok) w.snapshot = null;
  state.patterns[0] = null;
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
    write: state.write.result,
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
  $('write-kick').addEventListener('click', () => run(writeKick));
  $('write-cancel').addEventListener('click', () => { state.write.armed = null; render(); });
  $('write-restore').addEventListener('click', () => run(restoreKick));
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
