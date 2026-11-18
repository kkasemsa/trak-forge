// Builds a whole song from a MIDI FORGE starter and lays it out for the SEQTRAK.
//
// The generator (engine.js) is the MIDI FORGE Live engine, unchanged. This file does what the
// Live extension's song builder does (sections x parts, shared DNA, transitions), then fits the
// result to the machine:
//   3 synth voices, Move-mode style   bass -> SYNTH 1, harmony -> SYNTH 2, lead -> DX
//   drums split by instrument         kick, snare, clap, closed hat, open hat, perc, shaker/ride
//   patterns of at most 8 bars        (128 steps)
//   at most 6 patterns per track      identical sections share one; beyond 6 the closest are merged
//   one scene per section             (templates have at most 8)
import * as E from './engine.js';
import { rollNote, DEFAULT_STEP } from '../seqtrak/writer.js';

const MAX_BARS = 8;
const MAX_SLOTS = 6;
const PART_ORDER = ['lead', 'bass', 'pad', 'chords', 'counterMelody', 'arp', 'drums'];

// SEQTRAK part numbers.
const KICK = 0, SNARE = 1, CLAP = 2, HAT1 = 3, HAT2 = 4, PERC1 = 5, PERC2 = 6, SYNTH1 = 7, SYNTH2 = 8, DX = 9;
export const TRACK_NAMES = ['KICK', 'SNARE', 'CLAP', 'HAT 1', 'HAT 2', 'PERC 1', 'PERC 2', 'SYNTH 1', 'SYNTH 2', 'DX', 'SAMPLER'];

// Sounds are catalogue numbers, chosen by name and category only: a first pass to tune by ear.
const DRUM_SOUND = { kick: 1, snare: 113, clap: 249, closedHat: 312, openHat: 385, perc: 215, shaker: 457, ride: 498 };
const BASS_SOUND = { acid: 858, default: 908 };                               // Acid3 / Fat Sine
const HARMONY_SOUND = {                                                        // by the part that feeds SYNTH 2
  arp: { default: 1006 },                                                     // Pluck Bells
  chords: { detroit: 996, dubTechno: 953, deepHouse: 1135, lofi: 1135, default: 1293 },   // Detroit Stab / Analog Saw Dub / E.Piano 1 / Poly Synth Pad
  pad: { default: 1293 },
};
const LEAD_SOUND = {                                                           // by the part that feeds the DX
  lead: { ambient: 1977, lofi: 1964, deepHouse: 1964, default: 1948 },        // FM Glass Dream / Legend EP / Dyna Lead
  counterMelody: { default: 1948 },
  arp: { default: 1964 },
  pad: { default: 1976 },                                                     // FM 5th Atmosphere
  chords: { default: 1964 },
};
const pick = (table, style) => table[style] ?? table.default;
const VOLUME = { drums: 100, bass: 100, harmony: 84, lead: 92 };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function melodicContent(notes, steps) {
  const limit = steps * 120;
  const seen = new Set();
  const out = [];
  for (const n of notes) {
    if (n.muted) continue;
    // +60 puts an on-grid note at the centre of its step, which is where the machine keeps them;
    // it also leaves room for the engine's early/late groove offsets.
    const tick = Math.round(n.startTime * 480) + 60;
    if (tick < 0 || tick >= limit) continue;
    const pitch = clamp(Math.round(n.pitch), 0, 127);
    const key = `${tick}:${pitch}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const gate = clamp(Math.round(n.duration * 480), 10, 16383);
    const ev = rollNote(0, pitch, { velocity: clamp(Math.round(n.velocity ?? 100), 1, 127), gate, offset: 0 });
    ev[0] = (tick >> 7) & 0x7f;
    ev[1] = tick & 0x7f;
    out.push(ev);
  }
  return out.sort((a, b) => ((a[0] << 7) | a[1]) - ((b[0] << 7) | b[1]) || a[3] - b[3]);
}

// Splits a drum clip into one step pattern per SEQTRAK drum track.
function drumContents(notes, steps, trackOf) {
  const out = new Map();
  for (const n of notes) {
    if (n.muted) continue;
    const part = trackOf.get(n.pitch);
    if (part === undefined) continue;
    const pos = n.startTime * 4;
    const step = Math.round(pos);
    if (step < 0 || step >= steps) continue;
    if (!out.has(part)) out.set(part, new Array(steps).fill(null));
    const velocity = clamp(Math.round(n.velocity ?? 100), 1, 127);
    const cur = out.get(part)[step];
    if (cur && cur.velocity >= velocity) continue;           // two hits in one step: keep the louder
    out.get(part)[step] = { ...DEFAULT_STEP, velocity, microTiming: clamp(60 + Math.round((pos - step) * 120), 0, 119) };
  }
  return out;
}

const contentKey = (steps, content) => `${steps}|${JSON.stringify(content)}`;
const eventSet = content => new Set(Array.isArray(content[0]) || content.length === 0
  ? content.map(e => `${e[0]},${e[1]},${e[3]}`)
  : content.map((s, i) => (s ? `${i}` : null)).filter(Boolean));

function similarity(a, b) {
  if (a.steps !== b.steps) return -1;
  const x = eventSet(a.content), y = eventSet(b.content);
  let both = 0;
  for (const k of x) if (y.has(k)) both++;
  const union = x.size + y.size - both;
  return union ? both / union : 1;
}

// perSection: array (one per section) of { steps, content } or null. Returns the track's pattern
// slots and, per section, which slot plays (null = track silent there).
function assignSlots(perSection) {
  const patterns = [];
  const slotOf = perSection.map(p => {
    if (!p) return null;
    const key = contentKey(p.steps, p.content);
    let i = patterns.findIndex(q => q.key === key);
    if (i < 0) { patterns.push({ ...p, key }); i = patterns.length - 1; }
    return i;
  });
  let merged = 0;
  while (patterns.length > MAX_SLOTS) {
    // Fold the most similar pair together, keeping the earlier one.
    let best = [-2, 0, 1];
    for (let a = 0; a < patterns.length; a++) {
      for (let b = a + 1; b < patterns.length; b++) {
        const s = similarity(patterns[a], patterns[b]);
        if (s > best[0]) best = [s, a, b];
      }
    }
    const [, keep, drop] = best;
    patterns.splice(drop, 1);
    for (let i = 0; i < slotOf.length; i++) {
      if (slotOf[i] === drop) slotOf[i] = keep;
      else if (slotOf[i] !== null && slotOf[i] > drop) slotOf[i]--;
    }
    merged++;
  }
  return { patterns: patterns.map(({ steps, content }) => ({ steps, content })), slotOf, merged };
}

export function listStarters() {
  return E.SONG_STARTERS.map(s => ({ id: s.id, name: s.name, desc: s.desc, family: E.STARTER_FAMILY[s.id] ?? 'Other', bpm: s.bpm }));
}
export const FAMILIES = E.STARTER_FAMILY_ORDER;

export function buildSong(starterId, seed) {
  const s = E.resolveStarter(starterId, seed);
  if (!s) throw new Error(`Unknown starter: ${starterId}`);
  const root = s.root ?? ((seed >>> 0) % 12);
  const intervals = E.SCALES[s.scale] ?? E.SCALES['Natural Minor'];
  const global = { style: s.style, root, scale: s.scale, bars: 4, rate: s.rate, density: s.density, octave: s.octave, humanize: 30, swing: s.swing };

  let dna = s.strength > 0 ? E.deriveDNA(s.style, root, s.scale, seed) : undefined;
  const preset = E.presetProgression(s.progression, intervals);
  if (dna && preset) dna = { ...dna, progression: preset };

  // Three synth voices + drums, chosen the way Move mode chooses them.
  const palette = PART_ORDER.filter(p => s.parts.includes(p));
  const slots = E.resolveMoveTracks(palette);
  const voice = new Map();                                   // engine part -> role
  for (const role of ['lead', 'bass', 'harmony', 'drums']) if (slots[role]) voice.set(slots[role], role);
  const mapped = PART_ORDER.filter(p => voice.has(p));
  const partOf = { bass: SYNTH1, harmony: SYNTH2, lead: DX };

  const template = E.SONG_TEMPLATES[s.songLength] ?? E.SONG_TEMPLATES.standard;
  const scaleLen = intervals.length;
  const prog = dna?.progression ?? [0];
  const stepT = E._internal.rateBeats(s.rate);

  // Generate every section, exactly as the Live extension does.
  const sections = template.map((section, i) => {
    const active = E.scenePlays(section.parts, mapped);
    const sectionDna = dna ? {
      ...dna, songMotif: dna.songMotif ?? dna.motif,
      motif: E.sceneMotifTransform(section.name, dna.motif, scaleLen),
      phrase: s.phrase ? E.sectionPhraseProfile(section.name) : undefined,
    } : undefined;
    const plan = i < template.length - 1 ? E.planTransition(section.name, template[i + 1].name, s.style) : null;
    const bars = Math.min(MAX_BARS, E.sectionBars(section.name, s.style));
    const clips = new Map();
    let sectionLead;
    for (const part of active) {
      const cfg = {
        ...global, part, bars,
        density: clamp(Math.round(s.density * section.densityMul), 0, 100),
        seed: E.sectionSeed(seed, i, part),
        tempo: s.bpm, scaleLock: false,
        dna: sectionDna, strength: s.strength, sceneSalt: i,
        leadNotes: part === 'counterMelody' && s.callResponse ? sectionLead : undefined,
        drumFeel: part === 'drums' ? s.drumFeel : undefined,
        grooveDepth: s.grooveDepth, hookMode: s.hook, progressionPreset: s.progression,
        energy: s.energyArc ? E.sectionEnergy(section.name) : undefined,
        fillAtEnd: part === 'drums' && !!plan && plan.fill.beats > 0,
        fillBeats: plan && plan.fill.beats ? plan.fill.beats : undefined,
        fillIntensity: plan ? plan.fill.intensity : undefined,
        finalCadence: i === template.length - 1,
      };
      const gen = E.generate(cfg);
      const barsT = Math.max(1, Math.round(gen.lengthBeats / 4));
      const notes = E.applyTransition(gen.notes, plan, part, gen.lengthBeats, intervals, root, s.octave, stepT,
        prog[(barsT - 1) % prog.length] ?? 0, prog[0] ?? 0, false);
      if (part === 'lead') sectionLead = notes;
      clips.set(part, { notes, steps: Math.min(MAX_BARS * 16, Math.round(gen.lengthBeats * 4)) });
    }
    return { name: section.name, clips };
  });

  // Which drum instruments the song uses decides where ride and shaker go.
  const used = new Set();
  for (const sec of sections) for (const n of sec.clips.get(slots.drums)?.notes ?? []) used.add(n.pitch);
  const D = E.DRUM_MAP;
  const trackOf = new Map([[D.kick, KICK], [D.snare, SNARE], [D.clap, CLAP], [D.closedHat, HAT1], [D.openHat, HAT2], [D.perc, PERC1], [D.shaker, PERC2]]);
  trackOf.set(D.ride, used.has(D.shaker) && !used.has(D.perc) ? PERC1 : PERC2);
  const drumSound = new Map([[KICK, 'kick'], [SNARE, 'snare'], [CLAP, 'clap'], [HAT1, 'closedHat'], [HAT2, 'openHat'], [PERC1, 'perc'], [PERC2, 'shaker']]);
  if (used.has(D.ride)) drumSound.set(trackOf.get(D.ride), used.has(trackOf.get(D.ride) === PERC1 ? D.perc : D.shaker) ? drumSound.get(trackOf.get(D.ride)) : 'ride');

  // Per SEQTRAK track, per section: the pattern it plays there.
  const perTrack = new Map();
  const put = (part, i, steps, content) => {
    if (!perTrack.has(part)) perTrack.set(part, new Array(sections.length).fill(null));
    perTrack.get(part)[i] = { steps, content };
  };
  sections.forEach((sec, i) => {
    for (const [enginePart, clip] of sec.clips) {
      const role = voice.get(enginePart);
      if (role === 'drums') {
        for (const [part, content] of drumContents(clip.notes, clip.steps, trackOf)) put(part, i, clip.steps, content);
      } else {
        const content = melodicContent(clip.notes, clip.steps);
        if (content.length) put(partOf[role], i, clip.steps, content);
      }
    }
  });

  let merged = 0;
  const tracks = [];
  const play = sections.map(() => ({}));
  for (const part of [...perTrack.keys()].sort((a, b) => a - b)) {
    const a = assignSlots(perTrack.get(part));
    merged += a.merged;
    a.slotOf.forEach((slot, i) => { if (slot !== null) play[i][part] = slot; });
    const role = part <= PERC2 ? 'drums' : part === SYNTH1 ? 'bass' : part === SYNTH2 ? 'harmony' : 'lead';
    const sound = role === 'drums' ? DRUM_SOUND[drumSound.get(part)]
      : role === 'bass' ? pick(BASS_SOUND, s.style)
        : role === 'harmony' ? pick(HARMONY_SOUND[slots.harmony] ?? HARMONY_SOUND.pad, s.style)
          : pick(LEAD_SOUND[slots.lead] ?? LEAD_SOUND.lead, s.style);
    tracks.push({ part, name: TRACK_NAMES[part], sound, volume: VOLUME[role], patterns: a.patterns, source: role === 'drums' ? 'drums' : slots[role] });
  }

  return {
    name: E.songName(seed),
    starter: { id: s.id, name: s.name, style: s.style },
    seed,
    tempo: s.bpm,
    key: `${E.NOTE_NAMES[root]} ${s.scale}`,
    voices: { bass: slots.bass, harmony: slots.harmony, lead: slots.lead },
    tracks,
    scenes: sections.map((sec, i) => ({ name: sec.name, play: play[i] })),
    merged,
  };
}
