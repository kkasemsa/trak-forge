// A simulated SEQTRAK, for the demo mode in a browser and for the tests. It is NOT the real
// machine: it answers the read addresses the probe uses, from a small made-up project, and
// ignores everything else. It can drop requests to mimic the ~1-in-10 loss seen on hardware.
import { parse, paramChange, to14 } from './sysex.js';

const key = a => a.join(',');

export function demoProject() {
  const mem = new Map();
  const set = (addr, data) => mem.set(key(addr), data);
  set([0x01, 0x10, 0x15], [0]);          // project 1
  set([0x01, 0x10, 0x20], [0]);          // stopped
  set([0x01, 0x10, 0x02], [70]);         // battery
  set([0x30, 0x40, 0x76], to14(124));    // tempo
  set([0x30, 0x40, 0x79], [0]);          // pattern select mode
  set([0x30, 0x40, 0x7a], to14(16));     // master step
  set([0x30, 0x40, 0x7e], [0]);          // scale 1
  set([0x30, 0x40, 0x7f], [0x49]);       // key A

  const types = [1, 1, 1, 1, 1, 1, 2, 2, 2, 4, 5];      // PERC 2 re-typed to SYNTH
  const sounds = [49, 223, 280, 355, 384, 552, 907, 907, 1516, 1989, null];
  for (let p = 0; p < 11; p++) {
    set([0x01, 0x10 | p, 0x3c], [types[p]]);
    if (sounds[p] !== null) set([0x01, 0x10 | p, 0x33], to14(sounds[p]));
    set([0x30, 0x50 | p, 0x0f], [0]);
    for (let n = 0; n < 6; n++) set([0x30, 0x50 | p, 0x16 + 2 * n], to14(16));
    set([0x30, 0x50 | p, 0x00], [100]);
    set([0x30, 0x50 | p, 0x29], [p === 5 ? 125 : 0]);
  }

  // Drum tracks: step record, 6 bytes per occupied step, zero bytes when empty.
  const drums = { 0: [0, 4, 8, 12], 1: [4, 12], 2: [12], 3: [2, 6, 10, 14], 4: [14], 5: [] };
  for (const [p, steps] of Object.entries(drums)) {
    for (let s = 0; s < 16; s++) {
      set([0x70, 0x40 | Number(p), s], steps.includes(s) ? [60, 100, 0, 60, 0, 120] : []);
    }
  }
  // Piano rolls: 8 bytes per event (tick, type, note, velocity, off velocity, gate), dense list.
  const roll = (ah, index, notes) => {
    notes.forEach(([step, note, vel, gate], i) => {
      set([ah, (index << 4) | (i >> 7), i & 0x7f], [...to14(step * 120 + 60), 0, note, vel, 0, ...to14(gate)]);
    });
    set([ah, (index << 4) | (notes.length >> 7), notes.length & 0x7f], []);
  };
  roll(0x25, 6, [[0, 57, 96, 120], [0, 60, 96, 120], [0, 64, 96, 120]]);                       // a chord
  roll(0x75, 0, [[0, 45, 110, 120], [3, 45, 90, 120], [6, 48, 100, 120], [10, 52, 100, 240]]); // SYNTH 1
  roll(0x75, 1, [[0, 69, 90, 480], [8, 72, 90, 480]]);                                         // SYNTH 2
  roll(0x75, 2, [[2, 81, 80, 120], [5, 84, 80, 120], [9, 88, 80, 120], [13, 84, 80, 120]]);    // DX
  roll(0x75, 3, []);                                                                           // SAMPLER

  // Three scenes: 33 bytes each. Others answer zero bytes.
  const scene = (n, patterns, mutes) => {
    const d = new Array(33).fill(0);
    d[1] = 64;
    patterns.forEach((v, i) => { d[2 + i] = v; });
    mutes.forEach((v, i) => { d[14 + i] = v; });
    set([0x71, 0x40, n], d);
  };
  scene(0, new Array(11).fill(0), [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1]);
  scene(1, new Array(11).fill(0), [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1]);
  scene(2, new Array(11).fill(0), new Array(11).fill(0));
  for (let n = 3; n < 16; n++) set([0x71, 0x40, n], []);
  return mem;
}

export class SimTransport {
  // The only writes the simulator understands: step record add / change / delete on parts 0-6.
  applyWrite({ addr, data }) {
    if (this.random() < this.writeDropRate) return;
    const [ah, am, al] = addr;
    if (ah !== 0x70) return;
    const mode = am & 0xf0;
    const part = am & 0x0f;
    const at = step => key([0x70, 0x40 | part, step]);
    if (mode === 0x00 && al === 0x00 && data.length === 5) {
      const [step, note, velocity, gateMsb, gateLsb] = data;
      this.memory.set(at(step), [note, velocity, 0, 60, gateMsb, gateLsb]);
    } else if (mode === 0x20 && al === 0x00 && data.length === 1) {
      this.memory.set(at(data[0]), []);
    } else if (mode === 0x10 && data.length === 2) {
      const cur = this.memory.get(at(data[0]));
      if (!cur || cur.length < 6) return;
      const next = [...cur];
      if (al === 0x00) next[3] = data[1];
      else if (al === 0x01) next[1] = data[1];
      else if (al === 0x03) next[2] = data[1];
      this.memory.set(at(data[0]), next);
    }
  }

  // dropRate: chance a request is silently lost. random: injectable for deterministic tests.
  constructor({ memory = demoProject(), dropRate = 0, writeDropRate = 0, latencyMs = 0, random = Math.random } = {}) {
    this.writeDropRate = writeDropRate;
    this.memory = memory;
    this.dropRate = dropRate;
    this.latencyMs = latencyMs;
    this.random = random;
    this.handlers = new Set();
    this.sent = [];
  }

  onSysex(handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  emit(bytes) {
    const deliver = () => this.handlers.forEach(h => h(bytes));
    if (this.latencyMs > 0) setTimeout(deliver, this.latencyMs); else queueMicrotask(deliver);
  }

  async send(bytes) {
    this.sent.push(Array.from(bytes));
    if (bytes.length === 6 && bytes[1] === 0x7e && bytes[3] === 0x06 && bytes[4] === 0x01) {
      if (this.random() >= this.dropRate) {
        this.emit([0xf0, 0x7e, 0x7f, 0x06, 0x02, 0x43, 0x00, 0x41, 0x64, 0x06, 0x0a, 0x00, 0x00, 0x7f, 0xf7]);
      }
      return;
    }
    const msg = parse(bytes);
    if (!msg) return;
    if (msg.kind === 'change') { this.applyWrite(msg); return; }
    if (this.random() < this.dropRate) return;
    const data = this.memory.get(key(msg.addr));
    if (data === undefined) return;                    // unknown address: silence, like the hardware
    this.emit(paramChange(msg.addr, data));
  }
}
