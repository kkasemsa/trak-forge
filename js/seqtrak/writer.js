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
