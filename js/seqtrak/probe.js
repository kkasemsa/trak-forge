// Read-only probe of a SEQTRAK. Every function here sends Parameter Requests only:
// nothing on the device changes. Addresses and layouts are from jaeggerr/seqtrak-docs;
// each one used here is marked `verified on hardware` there unless a comment says otherwise.
import { from14 } from './sysex.js';

export const PARTS = ['KICK', 'SNARE', 'CLAP', 'HAT 1', 'HAT 2', 'PERC 1', 'PERC 2', 'SYNTH 1', 'SYNTH 2', 'DX', 'SAMPLER'];
export const PART_COUNT = 11;
export const SCENE_COUNT = 16;
export const TICKS_PER_STEP = 120;

// PartAwmType (01 1p 3C): the engine backing a part.
export const PART_TYPES = { 1: 'DRUM', 2: 'SYNTH', 3: 'DRUMKIT', 4: 'DX', 5: 'SAMPLER' };
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const one = r => (r.ok && r.data.length >= 1 ? r.data[0] : null);
const two = r => (r.ok && r.data.length >= 2 ? from14(r.data[0], r.data[1]) : null);

// Global state: which project, whether it is playing, tempo, key, lengths.
export async function readSession(link) {
  const currentProject = one(await link.read([0x01, 0x10, 0x15]));
  const sequencer = one(await link.read([0x01, 0x10, 0x20]));
  const battery = one(await link.read([0x01, 0x10, 0x02]));
  const tempo = two(await link.read([0x30, 0x40, 0x76]));
  const patternSelectMode = one(await link.read([0x30, 0x40, 0x79]));
  const masterStep = two(await link.read([0x30, 0x40, 0x7a]));
  const scale = one(await link.read([0x30, 0x40, 0x7e]));
  const keyRaw = one(await link.read([0x30, 0x40, 0x7f]));
  const key = keyRaw !== null && keyRaw >= 0x40 && keyRaw <= 0x4b ? KEYS[keyRaw - 0x40] : null;
  return {
    currentProject,                                   // 0-7; the front panel calls them 1-8
    playing: sequencer === null ? null : sequencer === 1,
    battery,                                          // percent
    tempo,                                            // BPM
    patternSelectMode,                                // 0 = patterns 1-3 reachable, 1 = all six
    masterStep,                                       // 1-128
    scale: scale === null ? null : scale + 1,         // Scale 1-8
    key,
  };
}

// One track: engine, loaded sound, selected pattern and its length, volume, mute.
export async function readPart(link, part) {
  const mid = 0x10 | part;
  const track = 0x50 | part;
  const typeRaw = one(await link.read([0x01, mid, 0x3c]));
  // CurrentSound = catalogue number - 1. The SAMPLER part never answers this one (documented),
  // so it is not asked: a silence there would cost four timeouts and say nothing.
  const sound = part === 10 ? null : two(await link.read([0x01, mid, 0x33]));
  const pattern = one(await link.read([0x30, track, 0x0f]));
  const steps = pattern === null ? null : two(await link.read([0x30, track, 0x16 + 2 * pattern]));
  const volume = one(await link.read([0x30, track, 0x00]));
  // Track mute: 0 = off, 125 = on. Matches what the user muted by hand on a real unit (2026-11-18).
  const muteRaw = one(await link.read([0x30, track, 0x29]));
  return {
    part,
    name: PARTS[part],
    typeRaw,
    type: PART_TYPES[typeRaw] ?? null,
    soundNumber: sound === null ? null : sound + 1,
    pattern,                                          // 0-5
    steps,                                            // 1-128
    volume,
    muted: muteRaw === null ? null : muteRaw !== 0,
  };
}

// The notes in a part's currently selected pattern, as a flat event list.
// Which read path works depends on the track type, not on the track number:
//   DRUM-type part              step record   70 (40|part) step      6 bytes per occupied step
//   re-typed drum part (0-6)    drum roll     25 (part<<4|idx>>7) (idx&7F)   8 bytes per event
//   SYNTH 1/2, DX, SAMPLER      synth roll    75 (n<<4|idx>>7) (idx&7F), n = part - 7
// An event/step that does not exist answers with zero data bytes. A request that got no answer
// at all (after retries) is reported as unknown, never as empty.
export async function readPattern(link, part, typeRaw, steps, onProgress = () => {}) {
  if (part <= 6 && typeRaw === 1) return readStepRecord(link, part, steps ?? 16, onProgress);
  const [ah, index] = part <= 6 ? [0x25, part] : [0x75, part - 7];
  const result = await readPianoRoll(link, ah, index, onProgress);
  // The docs only measured this list on DRUM and SYNTH-typed parts. On a DRUMKIT part the index
  // layout is not established, so the list may stop early.
  result.unverifiedLayout = part <= 6 && typeRaw === 3;
  return result;
}

async function readStepRecord(link, part, steps, onProgress) {
  const events = [];
  const unknownSteps = [];
  for (let step = 0; step < steps; step++) {
    const r = await link.read([0x70, 0x40 | part, step]);
    if (!r.ok) unknownSteps.push(step);
    else if (r.data.length >= 6) {
      const [note, velocity, retrigger, microTiming, gateMsb, gateLsb] = r.data;
      events.push({
        step,
        tick: step * TICKS_PER_STEP + microTiming,     // 60 = dead centre of the step
        note, velocity, retrigger, microTiming,
        gate: from14(gateMsb, gateLsb),
      });
    }
    onProgress(step + 1, steps);
  }
  return { model: 'step', events, unknownSteps, complete: unknownSteps.length === 0 };
}

const MAX_EVENTS = 512;

async function readPianoRoll(link, ah, index, onProgress) {
  const events = [];
  let complete = false;
  for (let i = 0; i < MAX_EVENTS; i++) {
    const r = await link.read([ah, (index << 4) | (i >> 7), i & 0x7f]);
    if (!r.ok) break;                                 // unknown: stop, list is not complete
    if (r.data.length < 8) { complete = true; break; } // zero bytes = end of the list
    const [tMsb, tLsb, type, note, velocity, , gateMsb, gateLsb] = r.data;
    const tick = from14(tMsb, tLsb);
    events.push({
      index: i,
      type,                                           // 0 = note, 1 = CC, 2 = pitch bend
      tick,
      step: Math.floor(tick / TICKS_PER_STEP),
      note, velocity,
      gate: from14(gateMsb, gateLsb),
    });
    onProgress(i + 1, null);
  }
  return { model: 'roll', events, unknownSteps: [], complete };
}

// Scenes (song mode). 71 40 <scene> answers 33 bytes for a scene that exists, zero otherwise:
//   byte 1 = length (unit unknown), bytes 2-12 = pattern per track, bytes 14-24 = mute per track.
export async function readScenes(link, onProgress = () => {}) {
  const scenes = [];
  let unknown = 0;
  for (let scene = 0; scene < SCENE_COUNT; scene++) {
    const r = await link.read([0x71, 0x40, scene]);
    if (!r.ok) unknown++;
    else if (r.data.length >= 25) {
      scenes.push({
        scene,
        length: r.data[1],
        patterns: r.data.slice(2, 13),
        mutes: r.data.slice(14, 25).map(b => b !== 0),
      });
    }
    onProgress(scene + 1, SCENE_COUNT);
  }
  return { scenes, unknown };
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
// Yamaha octave convention: MIDI note 60 = C3.
export const noteName = n => `${NOTE_NAMES[n % 12]}${Math.floor(n / 12) - 2}`;
