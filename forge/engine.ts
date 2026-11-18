/**
 * MIDI FORGE Live — generative engine v2 (pure, deterministic, SDK-free)
 * ---------------------------------------------------------------------
 * generate(config) -> notes shaped exactly like the SDK's NoteDescription,
 * all times in BEATS. No runtime SDK dependency, so it can be probe-tested in
 * plain Node.
 *
 * v2: declarative per-style traits table (11 genres), tempo-aware note gating,
 * swing, and per-part seeds for the lock / re-roll workflow.
 */

export interface ForgeNote {
  pitch: number;
  startTime: number;
  duration: number;
  velocity?: number;
  probability?: number;
  velocityDeviation?: number;
  muted?: boolean;
  slide?: boolean; // acid bass: legato/portamento into the next note (overlap held)
  keepChromatic?: boolean; // engine-internal: exempt from scale-lock snapping (e.g. raised V third)
}

export type PartId =
  | "lead"
  | "bass"
  | "pad"
  | "chords"
  | "counterMelody"
  | "arp"
  | "piano"
  | "drums";

export const PART_LABELS: Record<PartId, string> = {
  lead: "Lead",
  bass: "Bass",
  pad: "Pad",
  chords: "Chords",
  counterMelody: "Counter Melody",
  piano: "Piano",
  arp: "Arp",
  drums: "Drums",
};
export type StyleId =
  | "melodicTechno"
  | "dubTechno"
  | "detroit"
  | "ambient"
  | "classicSeq"
  | "deepHouse"
  | "acid"
  | "trance"
  | "lofi"
  | "synthwave"
  | "breakbeat";
export type RateId = "1/4" | "1/8" | "1/16" | "1/8T";

export type DnaDim = "harmony" | "motif" | "rhythm" | "groove" | "register";
export const DNA_DIMS: DnaDim[] = ["harmony", "motif", "rhythm", "groove", "register"];
/** What each dimension is when the user hasn't set it — the pre-0.85 behaviour. */
export const DNA_DIM_DEFAULT = (d: DnaDim, strength: number): number =>
  d === "harmony" || d === "groove" || d === "register" ? 100 : strength;

export interface ForgeConfig {
  part: PartId;
  style: StyleId;
  root: number; // 0..11
  scale: string; // key into SCALES
  bars: number; // 1,2,4,8
  rate: RateId;
  density: number; // 0..100
  octave: number; // centre octave for the part
  humanize: number; // 0..100 velocity variation
  swing: number; // 0..100 (overrides style default when > 0)
  tempo?: number; // BPM from Live; informs gate length only
  scaleLock?: boolean; // snap all pitched output to root+scale
  dna?: MusicalDNA; // shared musical identity (progression, motif, register, groove)
  strength?: number; // 0..100 identity vs evolution — how hard the DNA is applied
  leadNotes?: ForgeNote[]; // when generating counterMelody: the lead to answer (call/response)
  drumMap?: Partial<Record<keyof typeof DRUM_MAP, number>>; // real pad notes from the track's kit
  drumFeel?: DrumFeel; // starter-specific drum character (overrides the style's default kit)
  pianoSparse?: boolean; // piano: motif-statement-only mode (for busy sections)
  pianoFigure?: PianoFigure; // piano: accompaniment figuration ("auto" = by genre)
  energy?: number; // 0..1 section energy — scales dynamics (build/release across a Song)
  grooveDepth?: number; // 0..100 how strongly the shared groove template is applied
  hookMode?: boolean; // AABA' hook form on the lead (default: style trait)
  evolveSeq?: boolean; // evolving ostinato arp (default: style trait)
  progressionPreset?: string; // explicit named progression — overrides genre pool AND dna when set
  fillAtEnd?: boolean; // drums: build a fill in the final bar (into a higher-energy section)
  /** v0.85 PER-DIMENSION DNA STRENGTH (0..100 each). Absent dims follow `strength` (the master),
   *  so an absent dnaMix is exactly the pre-0.85 behaviour. */
  dnaMix?: Partial<Record<DnaDim, number>>;
  /** v0.85: a locked dimension draws its randomness from the SONG (DNA seed + scene), not the
   *  part/roll seed — so Re-roll leaves it untouched. Harmony, Groove and Register have NO
   *  per-roll randomness (each is a pure function of the DNA and its slider; harmony must be
   *  shared by every part), so they are held across Re-roll by construction. */
  dnaLocks?: Partial<Record<"motif" | "rhythm", boolean>>;
  /** v0.85: scene index (song builds), so a locked dimension still differs scene to scene. */
  sceneSalt?: number;
  fillBeats?: 2 | 4; // v0.77: transition planner — fill length (default 2)
  fillIntensity?: number; // v0.77: 0.3..1, velocity ceiling of the fill
  finalCadence?: boolean; // melodic parts: resolve the last bar to the tonic and fade (song ending)
  seed: number;
}

export const SCALES: Record<string, number[]> = {
  "Natural Minor": [0, 2, 3, 5, 7, 8, 10],
  Major: [0, 2, 4, 5, 7, 9, 11],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11],
  "Minor Pentatonic": [0, 3, 5, 7, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

export const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

const BEATS_PER_BAR = 4;

export const DRUM_MAP = {
  kick: 36,
  snare: 38,
  clap: 39,
  closedHat: 42,
  openHat: 46,
  ride: 51,
  perc: 37,
  shaker: 70,
} as const;

// ---------- style traits ----------
type ChordShape = "triad" | "seventh" | "ninth" | "sus" | "add9";
type ChordPlacement = "pad" | "downbeat" | "stab" | "swung" | "wash";
type BassMode = "offbeatRoll" | "rootAnchor" | "acid" | "octave" | "walking";
type ArpDir = "up" | "down" | "updown" | "random";
type DrumKit =
  | "fourFloor"
  | "house"
  | "electro"
  | "breakbeat"
  | "sparse"
  | "none";

interface StyleTraits {
  label: string;
  progressions: number[][];
  chordShape: ChordShape;
  chordPlacement: ChordPlacement;
  bass: BassMode;
  arpDir: ArpDir[];
  drums: DrumKit;
  swing: number; // 0..1 default swing
  defaultRate: RateId;
  gate: number; // base note-length multiplier
  hook?: boolean; // lead uses AABA' hook form (Oxygène / Café del Mar / Knights)
  evolve?: boolean; // arp is an evolving ostinato (Betrayal / Rubycon)
}

export const STYLES: Record<StyleId, StyleTraits> = {
  melodicTechno: {
    label: "Melodic Techno",
    progressions: [[0, 5, 2, 6], [0, 6, 5, 4], [0, 3, 6, 4], [5, 6, 0, 0]],
    chordShape: "triad", chordPlacement: "downbeat", bass: "offbeatRoll",
    arpDir: ["up", "down", "updown"], drums: "fourFloor",
    swing: 0, defaultRate: "1/16", gate: 1, hook: true,
  },
  dubTechno: {
    label: "Dub Techno",
    progressions: [[0, 3], [0, 4], [0, 5]],
    chordShape: "triad", chordPlacement: "stab", bass: "rootAnchor",
    arpDir: ["up", "updown"], drums: "sparse",
    swing: 0, defaultRate: "1/8", gate: 0.9,
  },
  detroit: {
    label: "Detroit",
    progressions: [[0, 3, 4, 5], [0, 5, 3, 4], [5, 3, 0, 4], [5, 6, 0, 0]],
    chordShape: "seventh", chordPlacement: "swung", bass: "rootAnchor",
    arpDir: ["up", "updown"], drums: "fourFloor",
    swing: 0.08, defaultRate: "1/16", gate: 1, hook: true,
  },
  ambient: {
    label: "Ambient",
    progressions: [[0, 5, 3, 4], [0, 4, 5, 3], [0, 5, 0, 4]],
    chordShape: "add9", chordPlacement: "wash", bass: "rootAnchor",
    arpDir: ["updown", "up"], drums: "sparse",
    swing: 0, defaultRate: "1/8", gate: 1.6,
  },
  classicSeq: {
    label: "Classic Sequence",
    progressions: [[0, 4, 5, 3], [0, 5, 3, 4]],
    chordShape: "triad", chordPlacement: "downbeat", bass: "octave",
    arpDir: ["up"], drums: "electro",
    swing: 0, defaultRate: "1/16", gate: 0.95, evolve: true,
  },
  deepHouse: {
    label: "Deep House",
    progressions: [[1, 4, 0, 5], [0, 3, 5, 4], [5, 4, 3, 0]],
    chordShape: "seventh", chordPlacement: "swung", bass: "offbeatRoll",
    arpDir: ["up", "updown"], drums: "house",
    swing: 0.14, defaultRate: "1/16", gate: 1,
  },
  acid: {
    label: "Acid",
    progressions: [[0, 0, 0, 3], [0, 3, 0, 5]],
    chordShape: "triad", chordPlacement: "stab", bass: "acid",
    arpDir: ["up", "random"], drums: "fourFloor",
    swing: 0.04, defaultRate: "1/16", gate: 0.8, evolve: true,
  },
  trance: {
    label: "Trance",
    progressions: [[0, 5, 3, 4], [0, 3, 4, 5], [0, 5, 2, 6]],
    chordShape: "sus", chordPlacement: "downbeat", bass: "offbeatRoll",
    arpDir: ["up", "updown"], drums: "fourFloor",
    swing: 0, defaultRate: "1/16", gate: 0.9, hook: true,
  },
  lofi: {
    label: "Lo-Fi",
    progressions: [[1, 4, 0, 3], [0, 5, 1, 4], [3, 5, 0, 4]],
    chordShape: "ninth", chordPlacement: "swung", bass: "walking",
    arpDir: ["updown", "random"], drums: "breakbeat",
    swing: 0.26, defaultRate: "1/8", gate: 1.1,
  },
  synthwave: {
    label: "Synthwave",
    progressions: [[0, 5, 3, 4], [5, 3, 0, 4]],
    chordShape: "triad", chordPlacement: "downbeat", bass: "octave",
    arpDir: ["up"], drums: "electro",
    swing: 0, defaultRate: "1/16", gate: 1, hook: true, evolve: true,
  },
  breakbeat: {
    label: "Breakbeat",
    progressions: [[0, 3, 0, 5], [0, 5, 3, 4]],
    chordShape: "seventh", chordPlacement: "stab", bass: "rootAnchor",
    arpDir: ["up", "random"], drums: "breakbeat",
    swing: 0.1, defaultRate: "1/16", gate: 0.9,
  },
};

// ---------- chord progression presets ----------
// Named progressions with reliable emotional signatures. Each carries a major and
// a minor form (0-indexed scale degrees); the resolver picks the form matching the
// scale's quality, or maps through the relative key when a form is missing.
export interface ProgressionPreset {
  id: string;
  label: string;
  mood: string;
  major?: number[];
  minor?: number[];
  raiseV?: boolean; // harmonic-minor V: raise the third of the v chord (the "magic note")
}

export const PROGRESSION_PRESETS: ProgressionPreset[] = [
  { id: "auto", label: "Auto (genre)", mood: "let the genre pick" },
  { id: "royalRoad", label: "Royal Road", mood: "bittersweet lift, yearning", major: [3, 4, 2, 5], minor: [5, 6, 4, 0] },
  { id: "axis", label: "Axis", mood: "anthemic, hopeful", major: [0, 4, 5, 3], minor: [0, 5, 2, 6] },
  { id: "andalusian", label: "Andalusian", mood: "dramatic descent, inevitability", minor: [0, 6, 5, 4], raiseV: true },
  { id: "epicRise", label: "Epic Rise", mood: "heroic build", major: [3, 4, 0, 0], minor: [5, 6, 0, 0] },
  { id: "doowop", label: "Doo-wop", mood: "nostalgic warmth", major: [0, 5, 3, 4], minor: [0, 5, 3, 4] },
  { id: "pachelbel", label: "Pachelbel", mood: "stately, wistful (8-bar cycle)", major: [0, 4, 5, 2, 3, 0, 3, 4] },
  { id: "static", label: "Static (one chord)", mood: "hypnotic, dub / Berlin", major: [0], minor: [0] },
];

/** Is the scale major-ish (major third at degree 2)? */
function scaleIsMajor(intervals: number[]): boolean {
  return (intervals[2] ?? 4) === 4;
}

/** Resolve a preset to a progression for the given scale, or null for "auto". */
export function presetProgression(presetId: string | undefined, intervals: number[]): number[] | null {
  if (!presetId || presetId === "auto") return null;
  const p = PROGRESSION_PRESETS.find((x) => x.id === presetId);
  if (!p) return null;
  const major = scaleIsMajor(intervals);
  const len = intervals.length;
  if (major && p.major) return p.major;
  if (!major && p.minor) return p.minor;
  // map through the relative key: relative minor of a major scale sits at degree 5,
  // relative major of a minor scale at degree 2.
  if (major && p.minor) return p.minor.map((d) => (d + 5) % len);
  if (!major && p.major) return p.major.map((d) => (d + 2) % len);
  return null;
}

/** Does this preset ask for the raised-V "magic note"? */
export function presetRaisesV(presetId: string | undefined): boolean {
  return !!PROGRESSION_PRESETS.find((x) => x.id === presetId)?.raiseV;
}

// ---------- Song Starters ----------
// One-click recipes: selecting a starter populates EVERY control in the dialog
// (apply-and-tweak — nothing is locked). Each is a coherent combination drawn from
// the song studies, not random values. "surprise" builds a fresh coherent recipe.
export interface SongStarter {
  id: string;
  name: string;
  desc: string; // shown in the dialog so you know the vibe before committing
  style: StyleId;
  scale: string;
  root?: number; // default keeps the current root if omitted
  bpm: number;
  rate: RateId;
  progression: string; // preset id
  songLength: SongTemplateId;
  strength: number;
  grooveDepth: number;
  swing: number;
  density: number;
  octave: number;
  hook: boolean;
  phrase: boolean;
  callResponse: boolean;
  energyArc: boolean;
  parts: PartId[]; // which parts to enable
  // Optional metadata (v0.26):
  tags?: string[];          // free-form descriptors for filtering ("hypnotic", "dark", …)
  moveFriendly?: boolean;   // collapses cleanly onto Move's 4 tracks
  drumFeel?: DrumFeel;      // preferred drum character (hint for future drum shaping)
  soundProfile?: string;    // starter-specific instrument recipe id (see SOUND_PROFILES)
  clipBars?: number;        // explicit long-clip length (bars); overrides the computed value
}

/** Long, evolving clips suit hypnotic/long-form genres. Returns the clip length in bars for a
 *  starter (16–64) when it should be long, or 0 for a normal-length clip. Explicit `clipBars`
 *  wins; otherwise it's inferred from the song length + tags. The engine already evolves across
 *  bars (mutating ostinato, per-bar chord motion, energy arc), so a longer clip = more evolution. */
export function starterClipBars(s: Pick<SongStarter, "clipBars" | "songLength" | "tags" | "style">): number {
  if (s.clipBars && s.clipBars > 0) return Math.min(64, s.clipBars);
  const t = s.tags ?? [];
  const LONG_STYLES = new Set(["dubTechno", "classicSeq", "melodicTechno", "ambient", "detroit"]);
  if (s.songLength === "berlin") return 64;                       // Berlin-School: longest
  if (t.includes("long-form") && LONG_STYLES.has(s.style)) return 48;
  if (t.includes("hypnotic") || t.includes("long-form")) return 32;
  return 0;                                                       // normal clip length
}
export function isLongStarter(s: SongStarter): boolean { return starterClipBars(s) >= 16; }

export type DrumFeel = "fourFloor" | "breakbeat" | "lofiSwing" | "minimalDub" | "acidJack" | "ambientNone";

const ALL_MEL: PartId[] = ["lead", "bass", "pad", "chords", "counterMelody", "arp", "drums"];

export const SONG_STARTERS: SongStarter[] = [
  {
    id: "berlinCathedral", name: "Berlin Cathedral",
    desc: "Vast, hypnotic Berlin-School sequence that slowly evolves and layers into a cathedral of sound. Rubycon / Ricochet territory.",
    style: "classicSeq", scale: "Natural Minor", bpm: 124, rate: "1/16", progression: "static", songLength: "berlin",
    strength: 95, grooveDepth: 70, swing: 0, density: 70, octave: 3,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["arp", "bass", "pad", "chords", "lead", "drums"],
    soundProfile: "berlinAnalogSeq",
  },
  {
    id: "detroitSoul", name: "Detroit Soul",
    desc: "Warm, swung Detroit techno — lush 7th chords over a soulful turnaround with a singable hook. Soulful and a little melancholy.",
    style: "detroit", scale: "Dorian", bpm: 126, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 75, grooveDepth: 60, swing: 8, density: 70, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ALL_MEL,
    soundProfile: "detroitEmotional",
  },
  {
    id: "ibizaSunset", name: "Ibiza Sunset",
    desc: "Anthemic melodic trance with an exposed breakdown and a big lift. Café del Mar at golden hour.",
    style: "trance", scale: "Natural Minor", bpm: 138, rate: "1/16", progression: "auto", songLength: "anthem",
    strength: 80, grooveDepth: 45, swing: 0, density: 75, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ALL_MEL,
    soundProfile: "tranceGlass",
  },
  {
    id: "deepHypnosis", name: "Deep Hypnosis",
    desc: "Dub-techno dread: one chord, deep space, sparse offbeat stabs, heavy shared groove. Basic Channel on downers.",
    style: "dubTechno", scale: "Natural Minor", bpm: 122, rate: "1/16", progression: "static", songLength: "long",
    strength: 90, grooveDepth: 85, swing: 0, density: 42, octave: 3,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["bass", "pad", "chords", "arp", "drums"],
    soundProfile: "dubChordHeavy",
  },
  {
    id: "melancholyMachine", name: "Melancholy Machine",
    desc: "Emotional melodic techno on the dramatic Andalusian cadence (with its raised-V magic note). Call-and-response leads that ache.",
    style: "melodicTechno", scale: "Natural Minor", bpm: 124, rate: "1/16", progression: "andalusian", songLength: "standard",
    strength: 85, grooveDepth: 60, swing: 0, density: 68, octave: 3,
    hook: false, phrase: true, callResponse: true, energyArc: true, parts: ALL_MEL,
    soundProfile: "detroitEmotional",
  },
  {
    id: "acidRain", name: "Acid Rain",
    desc: "Squelchy 303 acid in Phrygian — an evolving single-line sequence that mutates bar by bar over a relentless four-floor kick.",
    style: "acid", scale: "Phrygian", bpm: 130, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 70, grooveDepth: 55, swing: 4, density: 78, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["bass", "arp", "lead", "drums"],
    soundProfile: "acidDub",
  },
  {
    id: "cosmicVoyage", name: "Cosmic Voyage",
    desc: "Weightless ambient drift: add9 wash chords, whole-bar sustains, almost no percussion. Xtal / Music for Airports.",
    style: "ambient", scale: "Lydian", bpm: 72, rate: "1/8", progression: "auto", songLength: "long",
    strength: 60, grooveDepth: 30, swing: 0, density: 40, octave: 3,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["pad", "chords", "lead", "arp"],
    soundProfile: "cosmicFloat",
  },
  {
    id: "anthemRising", name: "Anthem Rising",
    desc: "Heroic melodic techno built to peak — a rising progression, hook lead, hard energy arc into a Drop. Fists-in-the-air stuff.",
    style: "melodicTechno", scale: "Natural Minor", bpm: 126, rate: "1/16", progression: "auto", songLength: "long",
    strength: 82, grooveDepth: 65, swing: 0, density: 76, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ALL_MEL,
    soundProfile: "tranceGlass",
  },
  {
    id: "midnightDrive", name: "Midnight Drive",
    desc: "Neon synthwave cruise: steady octave bass, catchy hook, evolving arp, doo-wop nostalgia. Drive soundtrack at 2am.",
    style: "synthwave", scale: "Natural Minor", bpm: 118, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 78, grooveDepth: 50, swing: 0, density: 70, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["lead", "bass", "chords", "arp", "pad", "drums"],
    soundProfile: "synthwaveNeon",
  },
  {
    id: "smokyBasement", name: "Smoky Basement",
    desc: "Late-night lo-fi: dusty swung drums, mellow keys, sparse and warm. Head-nod tempo, no urgency.",
    style: "lofi", scale: "Dorian", bpm: 84, rate: "1/8T", progression: "auto", songLength: "short",
    strength: 70, grooveDepth: 70, swing: 16, density: 55, octave: 3,
    hook: false, phrase: true, callResponse: false, energyArc: false, parts: ["chords", "bass", "lead", "drums"],
    soundProfile: "deepHouseVelvet",
  },
  {
    id: "warehouseRave", name: "Warehouse Rave",
    desc: "Peak-time breakbeat energy: chopped drums, stabby chords, a big driving melodic sweep. Prodigy-adjacent.",
    style: "breakbeat", scale: "Natural Minor", bpm: 134, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 72, grooveDepth: 55, swing: 0, density: 82, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ALL_MEL,
    soundProfile: "brightBreaks",
  },
  {
    id: "starlightDisco", name: "Starlight Disco",
    desc: "Deep-house shimmer: rolling offbeat bass, lush pads, four-floor warmth and a rolling groove. Sunrise on the dancefloor.",
    style: "deepHouse", scale: "Natural Minor", bpm: 123, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 76, grooveDepth: 62, swing: 6, density: 74, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ALL_MEL,
    soundProfile: "organHouse",
  },
  {
    id: "phrygianTemple", name: "Phrygian Temple",
    desc: "Dark ritual techno: one droning chord in Phrygian, Berlin layering, incense and shadow. Hypnosis with an edge.",
    style: "melodicTechno", scale: "Phrygian", bpm: 126, rate: "1/16", progression: "static", songLength: "berlin",
    strength: 92, grooveDepth: 68, swing: 0, density: 66, octave: 2,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["arp", "bass", "pad", "chords", "lead", "drums"],
    soundProfile: "berlinAnalogSeq",
  },
  {
    id: "goldenHour", name: "Golden Hour",
    desc: "Warm major-key deep house with a nostalgic turnaround — optimistic, rooftop-at-sunset energy.",
    style: "deepHouse", scale: "Major", bpm: 120, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 72, grooveDepth: 58, swing: 8, density: 70, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ALL_MEL,
    soundProfile: "deepHouseVelvet",
  },
  {
    id: "stormWarning", name: "Storm Warning",
    desc: "Aggressive breakbeat drama on the Andalusian descent — chopped drums under an inevitable falling cadence. Tension weather.",
    style: "breakbeat", scale: "Natural Minor", bpm: 136, rate: "1/16", progression: "andalusian", songLength: "anthem",
    strength: 78, grooveDepth: 60, swing: 0, density: 84, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ALL_MEL,
    soundProfile: "jungleReese",
  },
  {
    id: "glassGarden", name: "Glass Garden",
    desc: "Delicate music-box ambient: slow add9 washes, fragile and crystalline. For rainy windows.",
    style: "ambient", scale: "Major", bpm: 76, rate: "1/8", progression: "auto", songLength: "long",
    strength: 65, grooveDepth: 25, swing: 0, density: 45, octave: 4,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["pad", "chords", "lead", "arp"],
    soundProfile: "glassAmbient",
  },
  {
    id: "nightTrain", name: "Night Train",
    desc: "Rolling long-form Detroit on the Axis loop — a steady machine glide with soulful 7ths, city lights streaking past.",
    style: "detroit", scale: "Natural Minor", bpm: 124, rate: "1/16", progression: "auto", songLength: "long",
    strength: 80, grooveDepth: 64, swing: 8, density: 72, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ALL_MEL,
    soundProfile: "electroFunk",
  },
  {
    id: "solarFlare", name: "Solar Flare",
    desc: "Exotic uplift: Harmonic-Minor trance with a soaring build, breakdown to a blazing hook. Dramatic and a little dangerous.",
    style: "trance", scale: "Harmonic Minor", bpm: 140, rate: "1/16", progression: "auto", songLength: "anthem",
    strength: 84, grooveDepth: 48, swing: 0, density: 78, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ALL_MEL,
    soundProfile: "tranceGlass",
  },
  {
    id: "tangerinePulse", name: "Tangerine Pulse",
    desc: "Classic Berlin pulse: hypnotic 16th-note sequence, slow harmonic movement, minimal drums, long-form evolution.",
    style: "classicSeq", scale: "Natural Minor", bpm: 118, rate: "1/16", progression: "static", songLength: "berlin",
    strength: 94, grooveDepth: 55, swing: 0, density: 64, octave: 3,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["arp", "bass", "pad", "chords", "lead"],
    soundProfile: "berlinAnalogSeq",
  },
  {
    id: "oxygeneMemory", name: "Oxygene Memory",
    desc: "Airy cosmic synth lead over soft minor harmony, with AABA hook shape and wide spacious phrasing.",
    style: "synthwave", scale: "Natural Minor", bpm: 96, rate: "1/8", progression: "auto", songLength: "standard",
    strength: 82, grooveDepth: 35, swing: 0, density: 58, octave: 4,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["lead", "counterMelody", "pad", "chords", "arp"],
    soundProfile: "jarreAirLead",
  },
  {
    id: "arilWinter", name: "Aril Winter",
    desc: "Melancholic Detroit machine soul: restrained drums, emotional minor movement, simple hook, deep late-night pulse.",
    style: "detroit", scale: "Dorian", bpm: 123, rate: "1/16", progression: "auto", songLength: "long",
    strength: 84, grooveDepth: 68, swing: 8, density: 62, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["lead", "bass", "pad", "chords", "counterMelody", "drums"],
    soundProfile: "detroitEmotional",
  },
  {
    id: "motorikDawn", name: "Motorik Dawn",
    desc: "Steady motorik electronic groove with simple bass motion, bright repeating motifs, and gradual sunrise energy.",
    style: "classicSeq", scale: "Major", bpm: 116, rate: "1/16", progression: "auto", songLength: "long",
    strength: 76, grooveDepth: 50, swing: 0, density: 66, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["arp", "bass", "chords", "lead", "drums"],
    soundProfile: "berlinAnalogSeq",
  },
  {
    id: "rainyNeon", name: "Rainy Neon",
    desc: "Sad neon synthwave: minor nostalgia, soft hook, octave bass, wet pads, and cinematic night-drive mood.",
    style: "synthwave", scale: "Natural Minor", bpm: 108, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 80, grooveDepth: 45, swing: 0, density: 64, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["lead", "bass", "pad", "chords", "arp", "drums"],
    soundProfile: "synthwaveNeon",
  },
  {
    id: "minimalSignal", name: "Minimal Signal",
    desc: "Minimal techno starter with only bass, drums, chord stabs, and one evolving signal motif.",
    style: "dubTechno", scale: "Natural Minor", bpm: 126, rate: "1/16", progression: "static", songLength: "standard",
    strength: 88, grooveDepth: 78, swing: 0, density: 46, octave: 3,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["bass", "chords", "arp", "drums"],
    soundProfile: "dubChordHeavy",
  },
  {
    id: "acidTemple", name: "Acid Temple",
    desc: "Phrygian acid ritual: 303-style bass, sparse lead fragments, dark modal pressure, and warehouse tension.",
    style: "acid", scale: "Phrygian", bpm: 132, rate: "1/16", progression: "static", songLength: "berlin",
    strength: 86, grooveDepth: 62, swing: 4, density: 74, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["bass", "arp", "lead", "drums"],
    soundProfile: "acidDub",
  },
  {
    id: "floatingShrine", name: "Floating Shrine",
    desc: "Slow sacred ambient: Lydian glow, gentle lead phrases, long add9 pads, and almost no rhythmic pressure.",
    style: "ambient", scale: "Lydian", bpm: 68, rate: "1/8", progression: "auto", songLength: "long",
    strength: 70, grooveDepth: 20, swing: 0, density: 38, octave: 4,
    hook: false, phrase: true, callResponse: true, energyArc: true, parts: ["pad", "chords", "lead", "counterMelody", "arp"],
    soundProfile: "glassAmbient",
  },
  {
    id: "acidDawn", name: "Acid Dawn",
    desc: "Brighter, hopeful acid: a squelchy 303 line in natural minor rising toward the light, open hats, a warmer filter.",
    style: "acid", scale: "Natural Minor", bpm: 128, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 68, grooveDepth: 52, swing: 2, density: 74, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["bass", "arp", "lead", "drums"],
    soundProfile: "acidChrome",
  },
  {
    id: "squelchFunk", name: "Squelch Funk",
    desc: "Funky swung acid: a rubbery 303 bass with real bounce, Dorian brightness, ghost-note hats. Chicago jack.",
    style: "acid", scale: "Dorian", bpm: 124, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 66, grooveDepth: 70, swing: 14, density: 72, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["bass", "arp", "chords", "drums"],
    soundProfile: "acidChrome",
  },
  {
    id: "warehouse303", name: "Warehouse 303",
    desc: "Hard peak-time acid: relentless resonant 303, pounding kick, dense and aggressive, built to a drop. Sweat on the walls.",
    style: "acid", scale: "Phrygian", bpm: 136, rate: "1/16", progression: "auto", songLength: "anthem",
    strength: 78, grooveDepth: 58, swing: 0, density: 86, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["bass", "arp", "lead", "drums"],
    soundProfile: "acidChrome",
  },
  {
    id: "liquidAcid", name: "Liquid Acid",
    desc: "Deep hypnotic acid: one static drone, a slow-mutating 303, dubby space and heavy groove. Long-form trance-out.",
    style: "acid", scale: "Natural Minor", bpm: 122, rate: "1/16", progression: "static", songLength: "long",
    strength: 88, grooveDepth: 78, swing: 0, density: 58, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["bass", "arp", "pad", "drums"],
    soundProfile: "acidDub",
  },
  {
    id: "northernSignal", name: "Northern Signal",
    desc: "Cold melodic techno with a clear emotional hook, restrained drums, and a slow-blooming Nordic atmosphere.",
    style: "melodicTechno", scale: "Dorian", bpm: 124, rate: "1/16", progression: "auto", songLength: "long",
    strength: 84, grooveDepth: 58, swing: 0, density: 62, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ALL_MEL,
    tags: ["emotional", "hypnotic", "long-form"], moveFriendly: true, drumFeel: "fourFloor", soundProfile: "detroitEmotional",
  },
  {
    id: "redPlanetSequence", name: "Red Planet Sequence",
    desc: "Dry desert Berlin sequence: pulsing bass, slow filter movement, sparse lead fragments, and a long hypnotic build.",
    style: "classicSeq", scale: "Phrygian", bpm: 120, rate: "1/16", progression: "static", songLength: "berlin",
    strength: 92, grooveDepth: 62, swing: 0, density: 68, octave: 2,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["arp", "bass", "pad", "lead", "drums"],
    tags: ["sequence", "hypnotic", "long-form", "dark"], moveFriendly: false, drumFeel: "minimalDub", soundProfile: "berlinAnalogSeq",
  },
  {
    id: "chromeHearts", name: "Chrome Hearts",
    desc: "Emotional Detroit electro-soul with metallic bells, warm bass, and a simple repeated lead motif.",
    style: "detroit", scale: "Dorian", bpm: 121, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 78, grooveDepth: 66, swing: 10, density: 60, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["lead", "bass", "chords", "counterMelody", "drums"],
    tags: ["emotional", "detroit", "soulful"], moveFriendly: true, drumFeel: "fourFloor", soundProfile: "detroitEmotional",
  },
  {
    id: "iceCavern", name: "Ice Cavern",
    desc: "Dark ambient techno atmosphere: frozen pads, minimal pulse, distant lead echoes, and no obvious anthem shape.",
    style: "ambient", scale: "Natural Minor", bpm: 88, rate: "1/8", progression: "static", songLength: "long",
    strength: 82, grooveDepth: 35, swing: 0, density: 42, octave: 3,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["pad", "chords", "lead", "arp"],
    tags: ["ambient", "dark", "minimal-drums", "long-form"], moveFriendly: false, drumFeel: "ambientNone", soundProfile: "glassAmbient",
  },
  {
    id: "afterhoursDub", name: "Afterhours Dub",
    desc: "Very deep dub-techno: one chord, sub pressure, filtered drums, and long tape-delay space.",
    style: "dubTechno", scale: "Natural Minor", bpm: 118, rate: "1/16", progression: "static", songLength: "long",
    strength: 90, grooveDepth: 82, swing: 2, density: 38, octave: 2,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["bass", "chords", "pad", "drums"],
    tags: ["dub", "hypnotic", "minimal-drums", "long-form"], moveFriendly: true, drumFeel: "minimalDub", soundProfile: "dubChordHeavy",
  },
  {
    id: "neonRunner", name: "Neon Runner",
    desc: "Fast synthwave chase cue: octave bass, bright arp, short hook, and energetic night-drive momentum.",
    style: "synthwave", scale: "Natural Minor", bpm: 128, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 76, grooveDepth: 52, swing: 0, density: 78, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["lead", "bass", "chords", "arp", "drums"],
    tags: ["retro", "energetic", "hook"], moveFriendly: true, drumFeel: "fourFloor", soundProfile: "synthwaveNeon",
  },
  {
    id: "brokenSunrise", name: "Broken Sunrise",
    desc: "Melodic breakbeat with hopeful chords, chopped drums, and a bright emotional hook.",
    style: "breakbeat", scale: "Major", bpm: 132, rate: "1/16", progression: "auto", songLength: "anthem",
    strength: 74, grooveDepth: 60, swing: 4, density: 80, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ALL_MEL,
    tags: ["breaks", "emotional", "hook", "energetic"], moveFriendly: false, drumFeel: "breakbeat", soundProfile: "brightBreaks",
  },
  {
    id: "slowOrbit", name: "Slow Orbit",
    desc: "Slow cosmic electronica: gentle sequence, soft bass, floating lead, and gradual orbital motion.",
    style: "classicSeq", scale: "Lydian", bpm: 92, rate: "1/8", progression: "auto", songLength: "long",
    strength: 76, grooveDepth: 40, swing: 0, density: 50, octave: 3,
    hook: false, phrase: true, callResponse: true, energyArc: true, parts: ["arp", "bass", "pad", "lead"],
    tags: ["sequence", "cosmic", "chill", "long-form"], moveFriendly: true, drumFeel: "ambientNone", soundProfile: "cosmicFloat",
  },
  {
    id: "velvetWarehouse", name: "Velvet Warehouse",
    desc: "Soft but driving deep-house groove with warm chords, sidechained pads, and a late-night club feel.",
    style: "deepHouse", scale: "Dorian", bpm: 122, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 74, grooveDepth: 72, swing: 10, density: 66, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["lead", "bass", "pad", "chords", "drums"],
    tags: ["club", "deep-house", "warm"], moveFriendly: true, drumFeel: "fourFloor", soundProfile: "deepHouseVelvet",
  },
  {
    id: "cometTail", name: "Comet Tail",
    desc: "Uplifting trance with a cleaner, less aggressive build: glassy arp, wide pads, and a long melodic tail.",
    style: "trance", scale: "Natural Minor", bpm: 136, rate: "1/16", progression: "auto", songLength: "anthem",
    strength: 80, grooveDepth: 44, swing: 0, density: 72, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ALL_MEL,
    tags: ["trance", "uplifting", "hook", "energetic"], moveFriendly: false, drumFeel: "fourFloor", soundProfile: "tranceGlass",
  },
  // ---- v0.31: acid expansion ----
  {
    id: "chromeWasp", name: "Chrome Wasp",
    desc: "Hard fast acid: stinging 303 accents, metallic bell fragments, relentless jacking kick — peak-time venom.",
    style: "acid", scale: "Natural Minor", bpm: 138, rate: "1/16", progression: "static", songLength: "standard",
    strength: 86, grooveDepth: 74, swing: 0, density: 78, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["bass", "arp", "lead", "drums"],
    tags: ["acid", "hard", "energetic"], moveFriendly: true, drumFeel: "acidJack", soundProfile: "acidChrome",
  },
  {
    id: "basementJack", name: "Basement Jack",
    desc: "Chicago jack-house acid: swung 303, clap-heavy groove, sweaty low-ceiling club energy.",
    style: "acid", scale: "Dorian", bpm: 124, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 78, grooveDepth: 80, swing: 12, density: 70, octave: 2,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["bass", "arp", "chords", "drums"],
    tags: ["acid", "club", "jack"], moveFriendly: true, drumFeel: "acidJack", soundProfile: "acidChrome",
  },
  {
    id: "tealShadows", name: "Teal Shadows",
    desc: "Deep dub-acid: slow 303 pressure inside chord fog, filtered drums, cavernous late-night space.",
    style: "acid", scale: "Natural Minor", bpm: 119, rate: "1/16", progression: "static", songLength: "long",
    strength: 90, grooveDepth: 78, swing: 2, density: 46, octave: 2,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["bass", "chords", "pad", "drums"],
    tags: ["acid", "dub", "hypnotic", "long-form"], moveFriendly: true, drumFeel: "minimalDub", soundProfile: "acidDub",
    clipBars: 48,
  },
  {
    id: "acidPilgrim", name: "Acid Pilgrim",
    desc: "Slow eastern acid: Harmonic-Minor 303 chant, droning pad, patient hypnotic procession.",
    style: "acid", scale: "Harmonic Minor", bpm: 112, rate: "1/16", progression: "static", songLength: "long",
    strength: 88, grooveDepth: 66, swing: 0, density: 55, octave: 2,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["bass", "arp", "pad", "drums"],
    tags: ["acid", "hypnotic", "long-form", "eastern"], moveFriendly: false, drumFeel: "fourFloor", soundProfile: "acidDub",
    clipBars: 48,
  },
  {
    id: "acidMeadow", name: "Acid Meadow",
    desc: "Pastoral melodic acid: Lydian 303 lines that sing instead of bite, bright pads, open-air festival dawn.",
    style: "acid", scale: "Lydian", bpm: 126, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 76, grooveDepth: 62, swing: 0, density: 66, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["bass", "arp", "lead", "pad", "drums"],
    tags: ["acid", "melodic", "uplifting"], moveFriendly: true, drumFeel: "fourFloor", soundProfile: "acidChrome",
  },
  {
    id: "voltagePrayer", name: "Voltage Prayer",
    desc: "Berlin acid ritual: one 303 phrase mutating for an hour, monastic pads, the long hypnotic yes.",
    style: "acid", scale: "Phrygian", bpm: 122, rate: "1/16", progression: "static", songLength: "berlin",
    strength: 94, grooveDepth: 70, swing: 0, density: 60, octave: 2,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["bass", "arp", "pad", "drums"],
    tags: ["acid", "hypnotic", "long-form", "dark"], moveFriendly: false, drumFeel: "fourFloor", soundProfile: "acidDub",
  },
  // ---- v0.31: other genres ----
  {
    id: "midnightFunk", name: "Midnight Funk",
    desc: "Detroit electro-funk: rubbery bass, syncopated machine drums, neon-lit boogie chords.",
    style: "detroit", scale: "Dorian", bpm: 116, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 76, grooveDepth: 84, swing: 14, density: 68, octave: 2,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["bass", "chords", "lead", "counterMelody", "drums"],
    tags: ["funk", "club", "groove"], moveFriendly: true, drumFeel: "breakbeat", soundProfile: "electroFunk",
  },
  {
    id: "rustBelt", name: "Rust Belt",
    desc: "Industrial sequence techno: corroded pulse, grinding low end, sparks of lead over factory-floor drums.",
    style: "classicSeq", scale: "Phrygian", bpm: 128, rate: "1/16", progression: "static", songLength: "long",
    strength: 90, grooveDepth: 58, swing: 0, density: 72, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["arp", "bass", "lead", "drums"],
    tags: ["dark", "hypnotic", "long-form", "industrial"], moveFriendly: false, drumFeel: "fourFloor", soundProfile: "industrialSeq",
  },
  {
    id: "paperLanterns", name: "Paper Lanterns",
    desc: "Warm lo-fi drift: dusty keys, soft swing, small hours and warm rain on the window.",
    style: "lofi", scale: "Major", bpm: 82, rate: "1/8", progression: "doowop", songLength: "short",
    strength: 70, grooveDepth: 74, swing: 16, density: 52, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: false, parts: ["chords", "bass", "lead", "drums"],
    tags: ["chill", "warm", "night"], moveFriendly: true, drumFeel: "lofiSwing", soundProfile: "deepHouseVelvet",
  },
  {
    id: "duskHighway", name: "Dusk Highway",
    desc: "Darker synthwave cruise: minor-key octave bass, slow neon arps, taillights disappearing into fog.",
    style: "synthwave", scale: "Dorian", bpm: 118, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 78, grooveDepth: 56, swing: 0, density: 64, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["lead", "bass", "pad", "arp", "drums"],
    tags: ["retro", "dark", "night-drive"], moveFriendly: true, drumFeel: "fourFloor", soundProfile: "synthwaveNeon",
  },
  {
    id: "morningRitual", name: "Morning Ritual",
    desc: "Sunrise deep house: gentle major chords, patient groove, coffee-and-balcony optimism.",
    style: "deepHouse", scale: "Major", bpm: 120, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 72, grooveDepth: 70, swing: 8, density: 60, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["chords", "bass", "pad", "lead", "drums"],
    tags: ["chill", "warm", "sunrise"], moveFriendly: true, drumFeel: "fourFloor", soundProfile: "organHouse",
  },
  {
    id: "jungleGlass", name: "Jungle Glass",
    desc: "Fast glassy breaks: chopped drums under crystalline melodic fragments — precision chaos.",
    style: "breakbeat", scale: "Minor Pentatonic", bpm: 158, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 78, grooveDepth: 64, swing: 0, density: 82, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["lead", "bass", "pad", "arp", "drums"],
    tags: ["breaks", "energetic", "glassy"], moveFriendly: false, drumFeel: "breakbeat", soundProfile: "jungleReese",
  },
  // ---- D MINI showcase family (v0.67): four tracks each, ONE goes to the hardware.
  { id: "dminiDoctorBass", name: "Doctor Bass", desc: "Detroit soul with the D MINI as the bass engine — Unison saws, tight envelope, Contour doing the talking. The showcase: what three VCOs in the low end actually mean.",
    style: "detroit", scale: "Dorian", bpm: 122, rate: "1/16", progression: "auto", songLength: "standard", strength: 70, grooveDepth: 60, swing: 8, density: 62, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["lead", "bass", "chords", "drums"], soundProfile: "dminiBass", tags: ["hardware", "d mini", "bass"], moveFriendly: true },
  { id: "dminiSoloFlight", name: "Solo Flight", desc: "Melodic techno with the D MINI singing lead — full Unison stack, wide Detune, Contour Decay ON so lines ring. The showcase: the classic Moog voice above a modern floor.",
    style: "melodicTechno", scale: "Natural Minor", bpm: 124, rate: "1/16", progression: "auto", songLength: "standard", strength: 78, grooveDepth: 55, swing: 4, density: 60, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["lead", "bass", "pad", "drums"], soundProfile: "dminiLead", tags: ["hardware", "d mini", "lead"], moveFriendly: true },
  { id: "dminiFilterBreathes", name: "The Filter Breathes", desc: "Berlin School around a hypnotic eight-note sequence into the D MINI — and the ENTIRE performance is one knob: Cutoff, closed to open and back. Notes never change; your hand is the arrangement.",
    style: "classicSeq", scale: "Dorian", root: 4, bpm: 122, rate: "1/16", progression: "auto", songLength: "long", strength: 75, grooveDepth: 50, swing: 0, density: 70, octave: 3,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["arp", "bass", "lead", "drums"], soundProfile: "dminiFilter", tags: ["hardware", "d mini", "filter", "berlin"], moveFriendly: true },
  { id: "dminiGlideworks", name: "Glideworks", desc: "Acid floor with the D MINI gliding above the 303 — legato lines smeared by the Glide knob while Emphasis makes the filter vocal. The showcase: portamento as melody.",
    style: "acid", scale: "Phrygian", bpm: 128, rate: "1/16", progression: "auto", songLength: "standard", strength: 68, grooveDepth: 55, swing: 4, density: 72, octave: 2,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["lead", "bass", "arp", "drums"], soundProfile: "dminiGlide", tags: ["hardware", "d mini", "glide", "acid"], moveFriendly: true },
  { id: "dminiRingChamber", name: "Ring Chamber", desc: "Dub techno with the D MINI in RING mode — inharmonic metal stabs into long delay, retuned live with the Detune knob. The showcase: the mode nobody uses, in the genre that loves it.",
    style: "dubTechno", scale: "Natural Minor", bpm: 118, rate: "1/8", progression: "auto", songLength: "standard", strength: 60, grooveDepth: 60, swing: 6, density: 45, octave: 3,
    hook: false, phrase: false, callResponse: true, energyArc: true, parts: ["lead", "chords", "bass", "drums"], soundProfile: "dminiRing", tags: ["hardware", "d mini", "ring mod", "dub"], moveFriendly: true },
  { id: "dminiDeepCurrent", name: "Deep Current", desc: "Ambient drone with the D MINI holding the floor — Triangle Unison with slow Detune beating, six-second swells, everything ringing on. The showcase: one held note as a living thing.",
    style: "ambient", scale: "Natural Minor", bpm: 72, rate: "1/8", progression: "static", songLength: "standard", strength: 55, grooveDepth: 35, swing: 0, density: 35, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: false, parts: ["bass", "pad", "lead", "drums"], soundProfile: "dminiDrone", tags: ["hardware", "d mini", "drone", "ambient"], moveFriendly: true },
  { id: "dminiThreeVoices", name: "Three Voices", desc: "Synthwave chords from the D MINI's three-voice paraphony — one shared envelope, staccato blocks, saws in POLY mode. The showcase: what 'paraphonic' actually sounds like, used on purpose.",
    style: "synthwave", scale: "Natural Minor", bpm: 106, rate: "1/8", progression: "auto", songLength: "standard", strength: 65, grooveDepth: 45, swing: 2, density: 55, octave: 3,
    hook: true, phrase: false, callResponse: false, energyArc: true, parts: ["chords", "bass", "lead", "drums"], soundProfile: "dminiPoly", tags: ["hardware", "d mini", "paraphonic", "retro"], moveFriendly: true },
  // ---- Waldorf Protein showcase family (v0.68): four tracks each, ONE to the hardware.
  { id: "proteinLivingMatter", name: "Living Matter", desc: "Melodic techno built on the wavetable move itself — a resonant table sweeping under a pad while the floor pulses. The showcase: wave position as the living centre of a song.",
    style: "melodicTechno", scale: "Natural Minor", bpm: 124, rate: "1/16", progression: "auto", songLength: "standard", strength: 74, grooveDepth: 55, swing: 4, density: 58, octave: 3,
    hook: true, phrase: false, callResponse: false, energyArc: true, parts: ["lead", "bass", "pad", "drums"], soundProfile: "proteinSweep", tags: ["hardware", "protein", "wavetable"], moveFriendly: true },
  { id: "proteinHuckabyDeep", name: "Huckaby Deep", desc: "Deep house in the Microwave lineage — the Protein's 8-bit ASIC bass holding the floor the way Detroit's deep-house masters used the original. The showcase: low-octave aliasing as warmth.",
    style: "deepHouse", scale: "Dorian", bpm: 120, rate: "1/16", progression: "auto", songLength: "standard", strength: 66, grooveDepth: 65, swing: 10, density: 60, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["lead", "bass", "chords", "drums"], soundProfile: "proteinBass", tags: ["hardware", "protein", "bass", "deep house"], moveFriendly: true },
  { id: "proteinItSpeaks", name: "It Speaks", desc: "Breaks with the Protein's speech wavetables as the voice — a lead that forms vowels as the Wave knob moves. The showcase: the strangest tables in the ROM, played like a singer.",
    style: "breakbeat", scale: "Phrygian", bpm: 132, rate: "1/16", progression: "auto", songLength: "standard", strength: 70, grooveDepth: 60, swing: 6, density: 62, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["lead", "bass", "arp", "drums"], soundProfile: "proteinSpeech", tags: ["hardware", "protein", "speech", "breaks"], moveFriendly: true },
  { id: "proteinFourFaces", name: "Four Faces", desc: "Detroit soul where every chord stab lands on a DIFFERENT layer — mallet, formant, glass, brass, rotating round-robin. The showcase: four timbres, one part, no hands.",
    style: "detroit", scale: "Dorian", bpm: 121, rate: "1/16", progression: "auto", songLength: "standard", strength: 68, grooveDepth: 60, swing: 8, density: 58, octave: 3,
    hook: false, phrase: false, callResponse: true, energyArc: true, parts: ["chords", "bass", "lead", "drums"], soundProfile: "proteinRobin", tags: ["hardware", "protein", "round robin", "layers"], moveFriendly: true },
  { id: "proteinAgedCircuits", name: "Aged Circuits", desc: "Ambient where the patch grows old in real time — the Flavor knob and de-calibrated filters slowly ruining a pristine pad, beautifully. The showcase: imperfection as the arrangement.",
    style: "ambient", scale: "Natural Minor", bpm: 68, rate: "1/8", progression: "static", songLength: "standard", strength: 55, grooveDepth: 35, swing: 0, density: 35, octave: 3,
    hook: false, phrase: false, callResponse: false, energyArc: false, parts: ["pad", "bass", "lead", "drums"], soundProfile: "proteinFlavor", tags: ["hardware", "protein", "flavor", "ambient"], moveFriendly: true },
  { id: "proteinDustAndDirt", name: "Dust & Dirt", desc: "Lo-fi keys with the ring-dirt engaged — an e-piano table with rust in its overtones, velocity opening the wavetable. The showcase: the Dirt section as character, not damage.",
    style: "lofi", scale: "Dorian", bpm: 84, rate: "1/8", progression: "auto", songLength: "standard", strength: 60, grooveDepth: 70, swing: 14, density: 50, octave: 3,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["chords", "bass", "lead", "drums"], soundProfile: "proteinDirt", tags: ["hardware", "protein", "dirt", "lofi"], moveFriendly: true },
  { id: "proteinGlassReactor", name: "Glass Reactor", desc: "Trance around a glittering PPG-glass sequence — velocity opens the wavetable so the arp sparkles unevenly, like light through moving water. The showcase: the table the whole lineage is famous for.",
    style: "trance", scale: "Natural Minor", bpm: 138, rate: "1/16", progression: "auto", songLength: "long", strength: 76, grooveDepth: 50, swing: 0, density: 74, octave: 3,
    hook: true, phrase: false, callResponse: false, energyArc: true, parts: ["arp", "bass", "lead", "drums"], soundProfile: "proteinGlass", tags: ["hardware", "protein", "ppg", "trance"], moveFriendly: true },
  // ---- D MINI showcase collection (v0.69): 20 more, living in their genre families,
  // tagged "d mini" (+ "qi" when the Walrus Qi is in the chain, "top pick" for the channel five).
  { id: "dminiMidnightAutobahn", name: "Midnight Autobahn", desc: "Driving through Germany at 2 AM under endless highway lights — the classic Berlin School showcase. The D MINI lead evolves for the whole ride: filter sweeps, touches of glide, Qi delay stretching the lane markers.",
    style: "classicSeq", scale: "Minor Pentatonic", root: 4, bpm: 126, rate: "1/16", progression: "auto", songLength: "long", strength: 74, grooveDepth: 50, swing: 0, density: 66, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["arp", "bass", "lead", "drums"], soundProfile: "dminiLead", tags: ["hardware", "d mini", "qi", "berlin", "tangerine dream", "top pick"], moveFriendly: true },
  { id: "dminiFilterNeverStops", name: "The Filter Never Stops", desc: "Minimal analog techno where the filter is the main performer — cutoff, resonance, and envelope amount doing everything melody usually does, over a sequence that never blinks.",
    style: "dubTechno", scale: "Dorian", root: 2, bpm: 122, rate: "1/16", progression: "auto", songLength: "standard", strength: 62, grooveDepth: 55, swing: 4, density: 60, octave: 3,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["arp", "bass", "chords", "drums"], soundProfile: "dminiFilter", tags: ["hardware", "d mini", "minimal", "moog", "top pick"], moveFriendly: true },
  { id: "dminiOneNoteJourney", name: "One Note Journey", desc: "An entire performance built from one note — oscillator blending and timbre evolution as the whole composition, Ciani-style. Educational, hypnotic, and every knob move is on camera.",
    style: "ambient", scale: "Natural Minor", root: 9, bpm: 110, rate: "1/8", progression: "static", songLength: "standard", strength: 50, grooveDepth: 35, swing: 0, density: 35, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: false, parts: ["bass", "pad", "lead", "drums"], soundProfile: "dminiDrone", tags: ["hardware", "d mini", "qi", "one note", "suzanne ciani", "top pick"], moveFriendly: true },
  { id: "dminiBassEater", name: "Bass That Eats Speakers", desc: "Driving techno with massive analog bass shaking the room — why people buy a Minimoog-style synth in the first place. Brikha-school melody in the machines above; pure weight below.",
    style: "detroit", scale: "Natural Minor", root: 5, bpm: 130, rate: "1/16", progression: "auto", songLength: "standard", strength: 68, grooveDepth: 55, swing: 4, density: 68, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["lead", "bass", "chords", "drums"], soundProfile: "dminiBass", tags: ["hardware", "d mini", "aril brikha", "top pick"], moveFriendly: true },
  { id: "dminiBladeRunnerSunset", name: "Blade Runner Sunset", desc: "Flying above a neon city at sunset — cinematic synthwave with an expressive portamento lead in the Vangelis tradition, every phrase arriving on a slide through Qi haze.",
    style: "synthwave", scale: "Natural Minor", root: 1, bpm: 96, rate: "1/8", progression: "auto", songLength: "standard", strength: 70, grooveDepth: 45, swing: 2, density: 52, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["lead", "bass", "pad", "drums"], soundProfile: "dminiGlide", tags: ["hardware", "d mini", "qi", "cinematic", "vangelis"], moveFriendly: true },
  { id: "dminiAcidNo303", name: "Acid Without a 303", desc: "Proof the D MINI can growl like acid — resonance high, envelopes fast, the ladder filter snapping where a 303 would squelch. Hardfloor energy at 132.",
    style: "acid", scale: "Phrygian", root: 4, bpm: 132, rate: "1/16", progression: "auto", songLength: "standard", strength: 64, grooveDepth: 55, swing: 4, density: 74, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["lead", "bass", "arp", "drums"], soundProfile: "dminiBass", tags: ["hardware", "d mini", "hardfloor"], moveFriendly: true },
  { id: "dminiThreeOscillators", name: "Three Oscillators", desc: "The analog showcase, built layer by layer — one VCO, then two, then all three with detune blooming. The arrangement IS the lesson: what each oscillator adds, heard in order.",
    style: "classicSeq", scale: "Minor Pentatonic", root: 7, bpm: 118, rate: "1/16", progression: "auto", songLength: "standard", strength: 66, grooveDepth: 45, swing: 0, density: 58, octave: 3,
    hook: true, phrase: false, callResponse: false, energyArc: true, parts: ["lead", "bass", "chords", "drums"], soundProfile: "dminiLead", tags: ["hardware", "d mini", "minimoog", "educational"], moveFriendly: true },
  { id: "dminiSciFiSignals", name: "Vintage Sci-Fi Signals", desc: "The soundtrack to a 70s sci-fi film that never existed — noise, ring textures, and modulation as transmissions from somewhere, Jarre-adjacent, harmonic minor for the unease.",
    style: "synthwave", scale: "Harmonic Minor", root: 2, bpm: 100, rate: "1/8", progression: "auto", songLength: "standard", strength: 58, grooveDepth: 45, swing: 0, density: 48, octave: 3,
    hook: false, phrase: false, callResponse: true, energyArc: true, parts: ["lead", "chords", "bass", "drums"], soundProfile: "dminiRing", tags: ["hardware", "d mini", "qi", "sci-fi", "jarre"], moveFriendly: true },
  { id: "dmini1974Meets2026", name: "1974 Meets 2026", desc: "Vintage analog transformed into modern melodic techno — the Bodzin thesis: a 50-year-old voice, a present-tense arrangement, filter performance and delay bridging the decades.",
    style: "melodicTechno", scale: "Natural Minor", root: 11, bpm: 124, rate: "1/16", progression: "auto", songLength: "standard", strength: 78, grooveDepth: 55, swing: 4, density: 62, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["lead", "bass", "pad", "drums"], soundProfile: "dminiLead", tags: ["hardware", "d mini", "qi", "bodzin", "top pick"], moveFriendly: true },
  { id: "dminiAnalogMeditation", name: "Analog Meditation", desc: "A calm sunrise over distant mountains — ambient Berlin in the Steve Roach lineage, the drone breathing through slow filter movement, nothing in a hurry, nothing wasted.",
    style: "ambient", scale: "Dorian", root: 9, bpm: 90, rate: "1/8", progression: "static", songLength: "standard", strength: 52, grooveDepth: 35, swing: 0, density: 35, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: false, parts: ["bass", "pad", "lead", "drums"], soundProfile: "dminiDrone", tags: ["hardware", "d mini", "qi", "steve roach", "meditation"], moveFriendly: true },
  { id: "dminiMoogMountain", name: "Moog Mountain", desc: "Climbing a mountain with analog power — melodic techno around a thick mono lead in the Bäumel register: patient, inevitable, and heavier with every switchback.",
    style: "melodicTechno", scale: "Dorian", root: 5, bpm: 128, rate: "1/16", progression: "auto", songLength: "standard", strength: 74, grooveDepth: 55, swing: 4, density: 64, octave: 3,
    hook: true, phrase: false, callResponse: false, energyArc: true, parts: ["lead", "bass", "pad", "drums"], soundProfile: "dminiLead", tags: ["hardware", "d mini", "patrice baumel"], moveFriendly: true },
  { id: "dminiResonanceRitual", name: "Resonance Ritual", desc: "A hypnotic ritual built around resonance — minimal techno where the Emphasis knob is the shaman, whistling over a sequence that repeats until repetition becomes the point.",
    style: "dubTechno", scale: "Dorian", root: 4, bpm: 123, rate: "1/16", progression: "auto", songLength: "standard", strength: 58, grooveDepth: 60, swing: 6, density: 56, octave: 3,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["arp", "bass", "chords", "drums"], soundProfile: "dminiFilter", tags: ["hardware", "d mini", "minimal", "villalobos", "ritual"], moveFriendly: true },
  { id: "dminiNeonMonolith", name: "Neon Monolith", desc: "A glowing monolith awakens at night — dark synthwave with the D MINI as a menacing lead, Perturbator-black, square-edged and slow to forgive.",
    style: "synthwave", scale: "Natural Minor", root: 0, bpm: 118, rate: "1/16", progression: "auto", songLength: "standard", strength: 68, grooveDepth: 50, swing: 0, density: 58, octave: 3,
    hook: true, phrase: false, callResponse: false, energyArc: true, parts: ["lead", "bass", "chords", "drums"], soundProfile: "dminiLead", tags: ["hardware", "d mini", "qi", "dark", "perturbator"], moveFriendly: true },
  { id: "dminiWarmVoltage", name: "Warm Voltage", desc: "Vintage circuits glowing on a rainy evening — chill electronica in Mixolydian, Boards-of-Canada warm, the paraphonic D MINI holding soft chords like an old radio holds a station.",
    style: "lofi", scale: "Mixolydian", root: 7, bpm: 108, rate: "1/8", progression: "auto", songLength: "standard", strength: 58, grooveDepth: 70, swing: 12, density: 48, octave: 3,
    hook: false, phrase: false, callResponse: false, energyArc: false, parts: ["chords", "bass", "lead", "drums"], soundProfile: "dminiPoly", tags: ["hardware", "d mini", "qi", "boards of canada", "warm"], moveFriendly: true },
  { id: "dminiAnalogHorizon", name: "Analog Horizon", desc: "Watching the sunrise from a cliff edge — progressive melodic with an emotional lead melody in the Böhmer school: wide Unison, long phrases, the kind of line the crowd films.",
    style: "melodicTechno", scale: "Natural Minor", root: 2, bpm: 126, rate: "1/16", progression: "auto", songLength: "long", strength: 80, grooveDepth: 50, swing: 2, density: 60, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["lead", "bass", "pad", "drums"], soundProfile: "dminiLead", tags: ["hardware", "d mini", "qi", "ben bohmer", "emotional"], moveFriendly: true },
  { id: "dminiLadderDreams", name: "Ladder Dreams", desc: "Exploring the legendary ladder filter — deep techno as a guided tour of the transistor ladder's character: where it purrs, where it bites, where it swallows its own bass.",
    style: "dubTechno", scale: "Natural Minor", root: 6, bpm: 125, rate: "1/16", progression: "auto", songLength: "standard", strength: 60, grooveDepth: 55, swing: 4, density: 58, octave: 3,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["arp", "bass", "pad", "drums"], soundProfile: "dminiFilter", tags: ["hardware", "d mini", "ladder filter", "minimoog"], moveFriendly: true },
  { id: "dminiShadowOscillator", name: "Shadow Oscillator", desc: "Machines awaken in an abandoned factory — industrial electronica with an aggressive oscillator mix, Reznor-jagged, the ring stabs hitting like dropped sheet metal.",
    style: "breakbeat", scale: "Phrygian", root: 11, bpm: 128, rate: "1/16", progression: "auto", songLength: "standard", strength: 62, grooveDepth: 55, swing: 4, density: 66, octave: 3,
    hook: false, phrase: false, callResponse: true, energyArc: true, parts: ["lead", "chords", "bass", "drums"], soundProfile: "dminiRing", tags: ["hardware", "d mini", "industrial", "reznor"], moveFriendly: true },
  { id: "dminiSunsetResonance", name: "Sunset Resonance", desc: "A peaceful evening beside the ocean — downtempo ambient where smooth resonance sweeps roll in like the tide, Eno-patient, each one slightly different, none of them urgent.",
    style: "ambient", scale: "Dorian", root: 4, bpm: 95, rate: "1/8", progression: "static", songLength: "standard", strength: 52, grooveDepth: 40, swing: 0, density: 38, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: false, parts: ["bass", "pad", "lead", "drums"], soundProfile: "dminiDrone", tags: ["hardware", "d mini", "qi", "eno", "ocean"], moveFriendly: true },
  { id: "dminiPulseGenerator", name: "Pulse Generator", desc: "A vintage sequencer powers an endless groove — Berlin techno at 134 in the Schulze machine-room: fast sequences, small filter tweaks, momentum as the only argument.",
    style: "classicSeq", scale: "Minor Pentatonic", root: 9, bpm: 134, rate: "1/16", progression: "auto", songLength: "standard", strength: 66, grooveDepth: 45, swing: 0, density: 76, octave: 3,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["arp", "bass", "lead", "drums"], soundProfile: "dminiFilter", tags: ["hardware", "d mini", "klaus schulze", "sequencer"], moveFriendly: true },
  { id: "dminiEndlessVoltage", name: "Endless Voltage", desc: "Electricity flows forever through analog circuits — Berlin School as a long evolving sequence, Tangerine-Dream-endless, the Qi feeding the filter's slow story back to itself.",
    style: "classicSeq", scale: "Natural Minor", root: 4, bpm: 124, rate: "1/16", progression: "auto", songLength: "long", strength: 70, grooveDepth: 45, swing: 0, density: 64, octave: 3,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["arp", "bass", "pad", "drums"], soundProfile: "dminiFilter", tags: ["hardware", "d mini", "qi", "berlin", "tangerine dream"], moveFriendly: true },
  // ---- D MINI × ACID (v0.71): four more, each a different D MINI capability inside acid.
  { id: "dminiSelfOscillate", name: "Self-Oscillate", desc: "Acid where the D MINI's ladder filter sings its own note — Emphasis pushed to the self-oscillation edge so Cutoff becomes a second melody whistling over the 303. The showcase: resonance as an instrument.",
    style: "acid", scale: "Phrygian", root: 9, bpm: 130, rate: "1/16", progression: "auto", songLength: "long", strength: 62, grooveDepth: 55, swing: 4, density: 70, octave: 3,
    hook: false, phrase: false, callResponse: true, energyArc: true, parts: ["lead", "bass", "arp", "drums"], soundProfile: "dminiEmphasis", tags: ["hardware", "d mini", "acid", "resonance", "self-oscillation"], moveFriendly: true },
  { id: "dminiLadderAcid", name: "Ladder Acid", desc: "No 303 at all — the D MINI IS the acid line. Unison saws, snappy decay, Contour doing the env-mod squelch on a Moog ladder: rounder, meaner, and with the low end a diode filter can't give. The showcase: the D MINI as bass synth.",
    style: "acid", scale: "Natural Minor", root: 2, bpm: 128, rate: "1/16", progression: "auto", songLength: "long", strength: 66, grooveDepth: 55, swing: 2, density: 74, octave: 2,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["bass", "arp", "lead", "drums"], soundProfile: "dminiAcidBass", tags: ["hardware", "d mini", "acid", "bass", "no 303", "top pick"], moveFriendly: true },
  { id: "dminiWobbleAcid", name: "Wobble Acid", desc: "Acid with the D MINI's Filter Mod switch as the show — the LFO on the ladder filter, rate riding from 1/8 to 1/16 to free-run over a straight 303 floor. The showcase: the modulation section nobody touches.",
    style: "acid", scale: "Phrygian", root: 4, bpm: 130, rate: "1/16", progression: "auto", songLength: "long", strength: 60, grooveDepth: 55, swing: 4, density: 68, octave: 3,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["lead", "bass", "arp", "drums"], soundProfile: "dminiFilterMod", tags: ["hardware", "d mini", "acid", "filter mod", "lfo", "wobble"], moveFriendly: true },
  { id: "dminiSlowAcid", name: "Slow Acid", desc: "Acid at 118 — the D MINI's Glide as portamento over a rubbery 303, Phrygian and patient. Slower means every slide is heard whole; the D MINI's smear becomes the hook. The showcase: acid you can watch.",
    style: "acid", scale: "Phrygian", root: 7, bpm: 118, rate: "1/16", progression: "auto", songLength: "standard", strength: 62, grooveDepth: 60, swing: 6, density: 64, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["lead", "bass", "arp", "drums"], soundProfile: "dminiGlide", tags: ["hardware", "d mini", "acid", "glide", "slow"], moveFriendly: true },
  // ---- D MINI × SEQUENCE STAR (v0.73): the D MINI runs the sequence in ALL EIGHT scenes.
  { id: "dminiPerpetual", name: "Perpetual", desc: "Acid where the D MINI sequence never leaves — all eight scenes, one line, and Cutoff IS the arrangement: closed and growling alone in the Intro, wide open over the full floor at the Drop. The star: a sequence you can't stop watching.",
    style: "acid", scale: "Phrygian", root: 4, bpm: 128, rate: "1/16", progression: "static", songLength: "sequence", strength: 70, grooveDepth: 50, swing: 2, density: 78, octave: 3,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["arp", "bass", "chords", "lead", "drums"], soundProfile: "dminiSeqAcid", tags: ["hardware", "d mini", "acid", "sequence", "star", "all scenes", "top pick"], moveFriendly: true },
  { id: "dminiSquelchEngine", name: "Squelch Engine", desc: "Faster, meaner acid — 134 with the D MINI sequence driving every scene, Emphasis riding the squelch edge and Contour snapping accents. The floor comes and goes; the engine doesn't. The star: relentless.",
    style: "acid", scale: "Natural Minor", root: 9, bpm: 134, rate: "1/16", progression: "static", songLength: "sequence", strength: 66, grooveDepth: 50, swing: 0, density: 82, octave: 3,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["arp", "bass", "chords", "lead", "drums"], soundProfile: "dminiSeqAcid", tags: ["hardware", "d mini", "acid", "sequence", "star", "all scenes"], moveFriendly: true },
  { id: "dminiPhrygianMachine", name: "Phrygian Machine", desc: "Acid at 126 in E Phrygian — the D MINI sequence hypnotic and dark in all eight scenes, the flat second giving every repeat its menace. Cutoff opens across the song like a door. The star: the pattern as a place you live in.",
    style: "acid", scale: "Phrygian", root: 4, bpm: 126, rate: "1/16", progression: "static", songLength: "sequence", strength: 72, grooveDepth: 55, swing: 4, density: 76, octave: 3,
    hook: false, phrase: false, callResponse: false, energyArc: true, parts: ["arp", "bass", "chords", "lead", "drums"], soundProfile: "dminiSeqAcid", tags: ["hardware", "d mini", "acid", "sequence", "star", "all scenes", "phrygian"], moveFriendly: true },
  { id: "dminiGrooveGalaxy", name: "Groove Galaxy", desc: "Brikha-school Detroit — the D MINI runs a round, legato, MELODIC sequence in every scene while soulful sevenths and a second voice arrive above it. Octave mode, low resonance, notes ringing into each other. The star: a sequence that's a tune.",
    style: "detroit", scale: "Dorian", root: 5, bpm: 124, rate: "1/16", progression: "auto", songLength: "sequence", strength: 74, grooveDepth: 60, swing: 6, density: 70, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["arp", "bass", "chords", "lead", "counterMelody", "drums"], soundProfile: "dminiSeqBrikha", tags: ["hardware", "d mini", "detroit", "aril brikha", "sequence", "star", "all scenes", "top pick"], moveFriendly: true },
  { id: "dminiDeepBlue", name: "Deep Blue", desc: "Detroit melodic techno at 122 — the D MINI sequence as the emotional constant, Dorian and warm, Decay lengthening in the Break until the steps become a chord. Everything else is weather. The star: patience with a pulse.",
    style: "detroit", scale: "Dorian", root: 2, bpm: 122, rate: "1/16", progression: "auto", songLength: "sequence", strength: 76, grooveDepth: 60, swing: 6, density: 66, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["arp", "bass", "chords", "lead", "counterMelody", "drums"], soundProfile: "dminiSeqBrikha", tags: ["hardware", "d mini", "detroit", "aril brikha", "sequence", "star", "all scenes"], moveFriendly: true },
  { id: "dminiArtOfVibration", name: "Art of Vibration", desc: "The Brikha thesis at 128 — a D MINI sequence so melodic it carries the song alone, then keeps carrying it when the soul chords and the second voice pile on. Detune breathes at Build 2. The star: the sequence as the melody's engine.",
    style: "detroit", scale: "Natural Minor", root: 7, bpm: 128, rate: "1/16", progression: "auto", songLength: "sequence", strength: 74, grooveDepth: 55, swing: 4, density: 72, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["arp", "bass", "chords", "lead", "counterMelody", "drums"], soundProfile: "dminiSeqBrikha", tags: ["hardware", "d mini", "detroit", "aril brikha", "sequence", "star", "all scenes"], moveFriendly: true },
  // ---- Behringer CZ-1 MINI showcases (v0.74): phase distortion, not subtractive —
  // DCW (adds harmonics) is the arrangement knob where D MINI uses Cutoff (removes them).
  { id: "cz1SeqCathedral", name: "CZ Cathedral",
    desc: "Berlin School sequence where the CZ-1 MINI's phase distortion IS the arrangement — DCW opening from a closed pulse to a fully harmonic drive across all eight scenes, Jarre / Tangerine Dream territory built on digital oscillators instead of analog ones. The star: DCW doing the job Cutoff does on the D MINI sequence-stars, but by adding harmonics rather than subtracting them.",
    style: "classicSeq", scale: "Natural Minor", bpm: 122, rate: "1/16", progression: "static", songLength: "sequence",
    strength: 88, grooveDepth: 65, swing: 0, density: 68, octave: 3,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["arp", "bass", "chords", "lead", "drums"],
    soundProfile: "cz1SeqPulse", tags: ["hardware", "cz-1 mini", "sequence", "star", "all scenes", "jarre", "berlin", "phase distortion", "top pick"], moveFriendly: true },
  { id: "cz1EnsembleGlow", name: "Ensemble Glow",
    desc: "Warm Detroit soul voiced through the CZ-1 MINI's LINE 1+2 stack — the architecture itself is the showcase, not one knob: two phase-distortion lines detuned into a single glowing EP/string hybrid chord voice, the sound that made this synthesis method a mid-80s pop staple.",
    style: "detroit", scale: "Dorian", bpm: 124, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 78, grooveDepth: 58, swing: 6, density: 66, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["chords", "bass", "lead", "drums"],
    soundProfile: "cz1LineStack", tags: ["hardware", "cz-1 mini", "detroit", "line stack", "dual line", "retro"], moveFriendly: true },
  { id: "cz1MetalDrift", name: "Metal Drift",
    desc: "Dub techno with the CZ-1 MINI's DETUNE pushed to dissonance — two phase-distortion lines beating against each other for a clangorous, inharmonic lead, sent into long delay feedback. The showcase: the parameter everyone sets to a few cents for chorus, used instead for deliberate metal.",
    style: "dubTechno", scale: "Natural Minor", bpm: 122, rate: "1/16", progression: "static", songLength: "long",
    strength: 86, grooveDepth: 78, swing: 0, density: 40, octave: 3,
    hook: false, phrase: true, callResponse: true, energyArc: true, parts: ["lead", "chords", "bass", "drums"],
    soundProfile: "cz1RingDrift", tags: ["hardware", "cz-1 mini", "dub", "detune", "dissonance", "long-form", "hypnotic"], moveFriendly: true },
  // ---- CZ-1 MINI × HOOKS (v0.75): catchy first. The CZ line's actual history is mid-80s pop
  // earworms — E-piano, bell and brass hooks — so these put the hardware on the hook part.
  { id: "cz1TineAnthem", name: "Tine Anthem",
    desc: "Synthwave anthem with the CZ-1 MINI's electric piano as THE hook — the bright-to-mellow tine strike that defined mid-80s pop, exposed alone in the Breakdown and carried back on OB-X pads at the Drop. The hook repeats unchanged every time: recognisable by the second chorus. The showcase: the sound the CZ was famous for, used the way it was famous.",
    style: "synthwave", scale: "Natural Minor", root: 9, bpm: 118, rate: "1/8", progression: "auto", songLength: "anthem",
    strength: 82, grooveDepth: 45, swing: 0, density: 62, octave: 4,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["lead", "chords", "bass", "pad", "arp", "drums"],
    soundProfile: "cz1TineHook", tags: ["hardware", "cz-1 mini", "hook", "80s pop", "e-piano", "anthem", "top pick"], moveFriendly: true },
  { id: "cz1BellAnthem", name: "Glass Anthem",
    desc: "Melodic trance at 132 with the CZ-1 MINI's glass bell on the topline — a ringing, inharmonic hook over a rolling sub, washed in hall. The bell goes pure and exposed in the Breakdown (Detune pulled in), then shimmers wide again at the Drop. The showcase: the CZ's other signature voice, written to be sung back.",
    style: "trance", scale: "Natural Minor", root: 4, bpm: 132, rate: "1/16", progression: "auto", songLength: "anthem",
    strength: 84, grooveDepth: 42, swing: 0, density: 70, octave: 4,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["lead", "chords", "bass", "arp", "pad", "drums"],
    soundProfile: "cz1BellHook", tags: ["hardware", "cz-1 mini", "hook", "bell", "trance", "anthem"], moveFriendly: true },
  { id: "cz1StabHook", name: "Stab Hook",
    desc: "80s synthwave where the CZ-1 MINI's brass STABS are the hook — the notes never change, the rhythm of the hits is the earworm, and one control (DCW rate) flips the section from swell to hard hit. A singable topline rides on top; the stabs are what you leave humming. The showcase: rhythm as melody.",
    style: "synthwave", scale: "Dorian", root: 2, bpm: 116, rate: "1/8", progression: "auto", songLength: "standard",
    strength: 78, grooveDepth: 55, swing: 4, density: 64, octave: 3,
    hook: true, phrase: false, callResponse: true, energyArc: true, parts: ["chords", "lead", "bass", "drums"],
    soundProfile: "cz1BrassStab", tags: ["hardware", "cz-1 mini", "hook", "brass", "stab", "retro"], moveFriendly: true },
  { id: "cz1ReedSong", name: "Reed Song",
    desc: "Melodic techno with the CZ-1 MINI as a reedy, vocal lead — call-and-response phrases with a delayed vibrato that makes it sound played, not programmed; a bell counter-melody answers behind it. Built for a hook you can whistle. The showcase: the phase-distortion reed as a singer.",
    style: "melodicTechno", scale: "Natural Minor", root: 7, bpm: 124, rate: "1/16", progression: "auto", songLength: "standard",
    strength: 84, grooveDepth: 58, swing: 0, density: 66, octave: 4,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["lead", "counterMelody", "chords", "bass", "drums"],
    soundProfile: "cz1ReedTopline", tags: ["hardware", "cz-1 mini", "hook", "reed", "vocal", "call and response"], moveFriendly: true },

  // ---- v0.79: ten more songs, aimed at the thinner genres (Trance, Deep House, Lo-fi,
  // Breakbeat, Ambient) plus two hook-first Detroit/Berlin entries. All Move-friendly.
  { id: "tranceOpenSky", name: "Open Sky", desc: "Uplifting trance at 138 with a wide supersaw-style pad and a bell hook that only appears at the Drop — the Breakdown is pad and lead alone, long enough to feel the room hold its breath.",
    style: "trance", scale: "Natural Minor", root: 2, bpm: 138, rate: "1/16", progression: "auto", songLength: "anthem", strength: 84, grooveDepth: 40, swing: 0, density: 72, octave: 4,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["lead", "chords", "bass", "arp", "pad", "drums"], soundProfile: "tranceGlass", tags: ["trance", "uplifting", "anthem", "hook"], moveFriendly: true },
  { id: "tranceNightDrive", name: "Night Drive 132", desc: "Progressive trance, darker and slower than Open Sky: a rolling offbeat bass, plucked arp, and a lead that phrases in long question-answer pairs across eight bars.",
    style: "trance", scale: "Dorian", root: 9, bpm: 132, rate: "1/16", progression: "auto", songLength: "long", strength: 82, grooveDepth: 48, swing: 0, density: 66, octave: 4,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["lead", "arp", "bass", "pad", "drums"], soundProfile: "tranceGlass", tags: ["trance", "progressive", "long-form", "hook"], moveFriendly: true },
  { id: "houseSaltAir", name: "Salt Air", desc: "Deep house at 121 with organ stabs on the offs and a warm, slow-moving chord bed — the kind of track that runs the same groove for six minutes and never gets boring because the bass keeps answering the organ.",
    style: "deepHouse", scale: "Dorian", root: 5, bpm: 121, rate: "1/16", progression: "auto", songLength: "standard", strength: 74, grooveDepth: 62, swing: 8, density: 60, octave: 3,
    hook: true, phrase: false, callResponse: true, energyArc: true, parts: ["chords", "bass", "lead", "drums"], soundProfile: "organHouse", tags: ["deep house", "organ", "groove", "hook"], moveFriendly: true },
  { id: "houseLateCheckout", name: "Late Checkout", desc: "Slow deep house at 118 — dusty chords, a sub that sits still, a lead that only speaks in the Break. For the hour after the club, not the club.",
    style: "deepHouse", scale: "Major", root: 7, bpm: 118, rate: "1/16", progression: "auto", songLength: "standard", strength: 72, grooveDepth: 66, swing: 10, density: 52, octave: 3,
    hook: false, phrase: true, callResponse: false, energyArc: true, parts: ["chords", "bass", "lead", "pad", "drums"], soundProfile: "deepHouseVelvet", tags: ["deep house", "slow", "afterhours"], moveFriendly: true },
  { id: "lofiRainWindow", name: "Rain Window", desc: "Lo-fi at 78 with a Lydian lift — soft keys, a bass that walks, and a lead that hums one four-note idea over and over, slightly differently each pass.",
    style: "lofi", scale: "Lydian", root: 0, bpm: 78, rate: "1/8T", progression: "auto", songLength: "short", strength: 76, grooveDepth: 72, swing: 18, density: 50, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: false, parts: ["chords", "bass", "lead", "drums"], soundProfile: "deepHouseVelvet", tags: ["lo-fi", "keys", "hook"], moveFriendly: true },
  { id: "lofiTapeLoop", name: "Tape Loop", desc: "Lo-fi at 88, Minor Pentatonic, built like a sampled loop: a two-chord vamp, a bass that repeats exactly, and drums with heavy swing. The point is that it doesn't change.",
    style: "lofi", scale: "Minor Pentatonic", root: 4, bpm: 88, rate: "1/8", progression: "auto", songLength: "short", strength: 90, grooveDepth: 75, swing: 20, density: 48, octave: 3,
    hook: false, phrase: false, callResponse: false, energyArc: false, parts: ["chords", "bass", "drums"], soundProfile: "deepHouseVelvet", tags: ["lo-fi", "loop", "hypnotic"], moveFriendly: true },
  { id: "breaksNeonRain", name: "Neon Rain", desc: "Breakbeat at 134 with a Reese bass and a bright hook lead — a rave anthem with the drums doing the storytelling: the fill into each Main is where the song actually turns.",
    style: "breakbeat", scale: "Natural Minor", root: 7, bpm: 134, rate: "1/16", progression: "auto", songLength: "standard", strength: 80, grooveDepth: 55, swing: 0, density: 68, octave: 4,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["lead", "bass", "chords", "drums"], soundProfile: "jungleReese", tags: ["breakbeat", "rave", "hook"], moveFriendly: true },
  { id: "breaksHalfLight", name: "Half Light", desc: "Slow breaks at 112 — halftime feel, a wide pad and a lead that leaves space. Trip-hop adjacent without the samples.",
    style: "breakbeat", scale: "Phrygian", root: 2, bpm: 112, rate: "1/8", progression: "auto", songLength: "standard", strength: 74, grooveDepth: 68, swing: 6, density: 46, octave: 3,
    hook: false, phrase: true, callResponse: true, energyArc: true, parts: ["lead", "bass", "pad", "drums"], soundProfile: "brightBreaks", tags: ["breakbeat", "halftime", "dark"], moveFriendly: true },
  { id: "ambientTideTables", name: "Tide Tables", desc: "Ambient at 70 with no drums — a glass pad, a bass that changes once a bar, and a lead that arrives in the second half and repeats a three-note cell until the Fade. Sunrise music.",
    style: "ambient", scale: "Major", root: 9, bpm: 70, rate: "1/4", progression: "auto", songLength: "long", strength: 86, grooveDepth: 20, swing: 0, density: 34, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["pad", "bass", "lead"], soundProfile: "glassAmbient", tags: ["ambient", "no drums", "long-form", "hook"], moveFriendly: true },
  { id: "detroitHighRise", name: "High Rise", desc: "Detroit at 126 with the hook in the CHORDS — a stab pattern that never changes its notes, only its rhythm per section, over a bass that funks against it. Sung-back stabs, Underground-Resistance energy without the rage.",
    style: "detroit", scale: "Dorian", root: 4, bpm: 126, rate: "1/16", progression: "auto", songLength: "standard", strength: 86, grooveDepth: 60, swing: 4, density: 64, octave: 3,
    hook: true, phrase: false, callResponse: true, energyArc: true, parts: ["chords", "bass", "lead", "drums"], soundProfile: "detroitEmotional", tags: ["detroit", "stabs", "hook"], moveFriendly: true },
  // ---- v0.81: Jean-Michel Jarre, six ways. Not one "Jarre" — six distinct records' habits.
  { id: "jarreEquinoxSeq", name: "Équinoxe Machine", desc: "Équinoxe-era Jarre: a bright staccato ostinato that never stops, Eminent strings through a phaser, and a PWM lead that sings a four-bar tune you can whistle over the top. The sequence is the star — it runs in every scene.",
    style: "classicSeq", scale: "Natural Minor", root: 2, bpm: 126, rate: "1/16", progression: "static", songLength: "sequence", strength: 90, grooveDepth: 40, swing: 0, density: 70, octave: 3,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["arp", "lead", "pad", "chords", "bass", "drums"], soundProfile: "jarreSequence", tags: ["jarre", "berlin", "sequence", "star", "all scenes", "hook", "top pick"], moveFriendly: true },
  { id: "jarreMagneticFields", name: "Magnetic Fields", desc: "Faster, brighter Jarre at 132 — the sequence in Dorian so it lifts instead of broods, brass stabs on the changes, and a lead that only arrives at the Main and then owns the second half. Fairlight-era energy without the samples.",
    style: "classicSeq", scale: "Dorian", root: 7, bpm: 132, rate: "1/16", progression: "auto", songLength: "long", strength: 86, grooveDepth: 42, swing: 0, density: 72, octave: 3,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["arp", "lead", "chords", "pad", "bass", "drums"], soundProfile: "jarreSequence", tags: ["jarre", "berlin", "long-form", "hook", "bright"], moveFriendly: true },
  { id: "jarreOxygeneNight", name: "Oxygène Night", desc: "The slow Oxygène side at 88: phased strings breathing in whole notes, a rhythm-box pulse, and a lead that states one melancholy phrase and answers itself in echoes. Space, then more space.",
    style: "ambient", scale: "Natural Minor", root: 9, bpm: 88, rate: "1/8", progression: "auto", songLength: "long", strength: 84, grooveDepth: 30, swing: 0, density: 44, octave: 4,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["lead", "counterMelody", "pad", "chords", "bass", "drums"], soundProfile: "jarreAirLead", tags: ["jarre", "oxygene", "ambient", "long-form", "hook"], moveFriendly: true },
  { id: "jarreGrandRendezVous", name: "Grand Rendez-Vous", desc: "The Rendez-Vous grandeur: huge brass-choir pads, a heroic lead over a slow harmonic rhythm, the anthem template so the Breakdown strips to pad and lead and the Drop brings the sequence back underneath. Stadium Jarre.",
    style: "synthwave", scale: "Major", root: 0, bpm: 104, rate: "1/8", progression: "auto", songLength: "anthem", strength: 84, grooveDepth: 35, swing: 0, density: 62, octave: 4,
    hook: true, phrase: true, callResponse: true, energyArc: true, parts: ["lead", "chords", "pad", "arp", "bass", "drums"], soundProfile: "jarreAirLead", tags: ["jarre", "rendez-vous", "anthem", "hook", "major"], moveFriendly: true },
  { id: "jarreLaserHarp", name: "Laser Harp", desc: "Fourth Rendez-Vous energy at 120: a fanfare hook on the lead, staccato brass answering it, a driving sequence under both. The hook is stated plainly every time — it's a fanfare, not a solo.",
    style: "synthwave", scale: "Major", root: 5, bpm: 120, rate: "1/16", progression: "auto", songLength: "standard", strength: 88, grooveDepth: 45, swing: 0, density: 68, octave: 4,
    hook: true, phrase: false, callResponse: true, energyArc: true, parts: ["lead", "chords", "arp", "bass", "drums"], soundProfile: "jarreSequence", tags: ["jarre", "rendez-vous", "fanfare", "hook"], moveFriendly: true },
  { id: "jarreChronologie", name: "Chronologie", desc: "Jarre meets the dancefloor at 130 — the Chronologie 4 move: a trance pulse, a sequence with a rave-era shuffle, and a lead hook that resolves up to the fifth every eight bars. The most club-ready thing here.",
    style: "trance", scale: "Natural Minor", root: 4, bpm: 130, rate: "1/16", progression: "auto", songLength: "long", strength: 86, grooveDepth: 46, swing: 4, density: 70, octave: 4,
    hook: true, phrase: true, callResponse: false, energyArc: true, parts: ["lead", "arp", "chords", "bass", "pad", "drums"], soundProfile: "jarreSequence", tags: ["jarre", "trance", "chronologie", "long-form", "hook"], moveFriendly: true },
];

/** Curation families for grouping the (now large) starter list in the UI. */
// ---------------------------------------------------------------- Starter families (v0.79)
// Families are STANDARD ELECTRONIC GENRES, derived from each starter's `style` — not mood
// buckets. (Until v0.78 they were Club / Emotional / Dark / Retro / Chill, which mixed
// Detroit, trance and deep house in one drawer and split Detroit across two.) Hardware
// showcases live in their genre; the "d mini" / "protein" / "cz-1 mini" tags drive the chips.
export const STYLE_FAMILY: Record<StyleId, string> = {
  classicSeq: "Berlin School",
  detroit: "Detroit",
  dubTechno: "Dub Techno",
  melodicTechno: "Melodic Techno",
  acid: "Acid Techno", // default; the groove/melodic side is re-homed to Acid House below
  trance: "Trance",
  deepHouse: "Deep House",
  synthwave: "Synthwave",
  breakbeat: "Breakbeat",
  ambient: "Ambient",
  lofi: "Lo-fi",
};
export const STARTER_FAMILY_ORDER = ["Berlin School", "Detroit", "Dub Techno", "Melodic Techno", "Acid House", "Acid Techno", "Trance", "Deep House", "Synthwave", "Breakbeat", "Ambient", "Lo-fi"];
/** v0.79.1: the one style that splits into two genres. Acid HOUSE = the groove/melodic/swung
 *  side (Chicago jack, Dorian/Lydian, ≤128 with bounce); Acid TECHNO = the dark, hard,
 *  hypnotic Phrygian side and every sequence-star. Explicit by id so the split is a curatorial
 *  call, not a bpm heuristic. */
export const FAMILY_OVERRIDE: Record<string, string> = {
  squelchFunk: "Acid House", basementJack: "Acid House", acidMeadow: "Acid House",
  acidDawn: "Acid House", dminiSlowAcid: "Acid House",
};
/** v0.82: INFLUENCES — the artist/scene a starter is modelled on, as a filter orthogonal to
 *  genre and hardware. Keyed by the tag as written on the starter; value is the display label.
 *  A starter may carry several. Adding a name here is all it takes for a new Influence chip. */
export const INFLUENCES: Record<string, string> = {
  "jarre": "Jean-Michel Jarre",
  "tangerine dream": "Tangerine Dream",
  "klaus schulze": "Klaus Schulze",
  "steve roach": "Steve Roach",
  "vangelis": "Vangelis",
  "eno": "Brian Eno",
  "suzanne ciani": "Suzanne Ciani",
  "boards of canada": "Boards of Canada",
  "aril brikha": "Aril Brikha",
  "villalobos": "Ricardo Villalobos",
  "bodzin": "Stephan Bodzin",
  "patrice baumel": "Patrice Bäumel",
  "ben bohmer": "Ben Böhmer",
  "hardfloor": "Hardfloor",
  "perturbator": "Perturbator",
  "reznor": "Trent Reznor",
};
export function starterInfluences(s: SongStarter): string[] {
  return (s.tags || []).filter((t) => INFLUENCES[t]).map((t) => INFLUENCES[t]);
}
export const STARTER_FAMILY: Record<string, string> = Object.fromEntries(
  SONG_STARTERS.map((s) => [s.id, FAMILY_OVERRIDE[s.id] ?? STYLE_FAMILY[s.style] ?? "Ambient"]),
);

/** Resolve a starter by id. "surprise" returns a seeded pick from the one starter list
 *  (SONG_STARTERS is the single source of truth; the dialog's Surprise picks from the same
 *  injected list, so there's no separate fabrication to drift out of sync). */
export function resolveStarter(id: string, seed: number): SongStarter | null {
  if (id === "surprise") {
    const r = mulberry32((seed | 0) ^ 0x5ee5);
    const base = SONG_STARTERS[Math.floor(r() * SONG_STARTERS.length)];
    return { ...base, id: "surprise", name: "Surprise", desc: `🎲 ${base.name}: ${base.desc}` };
  }
  return SONG_STARTERS.find((s) => s.id === id) ?? null;
}

/** A memorable, seeded song name — evocative of dark melodic/techno aesthetics. */
export function songName(seed: number): string {
  const r = mulberry32((seed | 0) ^ 0x50f7);
  const adj = ["Obsidian", "Crimson", "Iron", "Silent", "Hollow", "Distant", "Frozen", "Molten", "Velvet", "Ashen", "Cobalt", "Amber", "Pale", "Endless", "Sacred", "Phantom", "Electric", "Lunar", "Solar", "Northern", "Buried", "Golden", "Violet", "Static", "Midnight", "Fractured", "Gilded", "Sunken"];
  const noun = ["Drift", "Vessel", "Meridian", "Pulse", "Signal", "Cathedral", "Horizon", "Descent", "Aurora", "Threshold", "Circuit", "Tide", "Ember", "Mirage", "Spire", "Echo", "Current", "Void", "Halo", "Machine", "Requiem", "Passage", "Bloom", "Frequency", "Monolith", "Lantern", "Cascade", "Reverie"];
  return adj[Math.floor(r() * adj.length)] + " " + noun[Math.floor(r() * noun.length)];
}

// ---------- Song Sheet: sound guide + info ----------
// Per-genre, per-part sound-design suggestions using Ableton-native instruments,
// shown in the Song Info panel so each Forge track knows what to load.
const GUIDE_DEFAULT: Record<PartId, string> = {
  piano: "Drift — felt EP: soft triangle keys, dark lid, quiet sub; the song's motif as a piece",
  lead: "Drift — mono saw lead, medium filter env, ping-pong delay",
  bass: "Drift — saw bass, tight decay, LP filter ~400 Hz, slight drive",
  pad: "Wavetable — warm 2-osc pad, slow attack, chorus + long reverb",
  chords: "Analog — poly stab, fast decay, a touch of chorus",
  counterMelody: "Operator — soft square, short delay, sits behind the lead",
  arp: "Drift — bright pluck, short decay, 1/8 delay 30% wet",
  drums: "Drum Rack — 909-style kit, light bus compression",
};
export const SOUND_GUIDE: Record<StyleId, Partial<Record<PartId, string>>> = {
  melodicTechno: {
    lead: "Drift — detuned saw lead, LP env + resonance, dotted-8th delay (Tale Of Us energy)",
    bass: "Drift/Operator — rolling offbeat saw bass, tight AMP decay, saturator",
    pad: "Wavetable — dark evolving pad, slow LFO on wavetable position, big hall",
    chords: "Analog — plucked minor stabs, short release, sidechain to kick",
    counterMelody: "Operator — glassy FM keys, low velocity, 1/4 delay",
    arp: "Drift — hypnotic 16th pluck, filter slowly opening across sections",
    drums: "Drum Rack — rumbling kick (long tail), tight claps, shaker 16ths",
  },
  dubTechno: {
    lead: "Operator — muted FM tone drowned in delay + spring-style reverb",
    bass: "Drift — deep sine/triangle sub, very short, mono",
    pad: "Wavetable — grey washed pad, HP at 200 Hz, huge reverb 100% wet send",
    chords: "Analog — THE dub chord: minor stab into filtered ping-pong delay, echoes forever",
    counterMelody: "Operator — sparse echo blips",
    arp: "Drift — dark 16th tick, mostly filtered away",
    drums: "Drum Rack — dusty 909, hats soft, everything through a gentle LP",
  },
  detroit: {
    lead: "Operator — bell-ish FM lead (Knights strings: try Strings ensemble rack), soulful vibrato",
    bass: "Drift — round finger-style bass, swung, slight portamento",
    pad: "Wavetable — lush string machine pad, ensemble chorus",
    chords: "Analog — 7th-chord stabs, swung, phaser slow",
    counterMelody: "Operator — muted trumpet-ish FM, call-and-response",
    arp: "Drift — bright hi-string pluck",
    drums: "Drum Rack — 909 with swung hats, rimshot accents",
  },
  ambient: {
    lead: "Wavetable — airy whistle/flute tone, glide, long release, shimmer reverb",
    bass: "Drift — barely-there sub swell, slow attack",
    pad: "Wavetable — 2 detuned wavetables, 4s attack, granular-ish motion, cathedral reverb",
    chords: "Analog — add9 washes, slow attack, tremolo very slow",
    counterMelody: "Operator — music-box tine, sparse",
    arp: "Drift — soft harp pluck, generous delay feedback",
    drums: "Drum Rack — brushed textures or none at all",
  },
  classicSeq: {
    lead: "Drift — resonant PWM lead à la Tangerine Dream, portamento on",
    bass: "Drift — punchy octave sequence bass, tight, slight drive",
    pad: "Wavetable — choir-ish pad, slow phaser",
    chords: "Analog — organ-ish sustained triads",
    counterMelody: "Operator — secondary sequence voice, detuned from the arp",
    arp: "Drift — THE sequence: square/saw mix, 16ths, filter rides the whole song",
    drums: "Drum Rack — CR-78/electro kit, restrained",
  },
  deepHouse: {
    lead: "Operator — muted EP lead, soft velocity",
    bass: "Drift — deep rolling sub with a rubbery attack click",
    pad: "Wavetable — warm jazzy pad, gentle chorus",
    chords: "Analog — Rhodes-style 7th stabs, swung, LP filter",
    counterMelody: "Operator — vibes/marimba-ish FM, sparse",
    arp: "Drift — silky pluck, low in the mix",
    drums: "Drum Rack — 909 four-floor, open hat offbeats, ride ghost notes",
  },
  acid: {
    lead: "Drift — screaming resonant saw, envelope mod full (or a 303 clone on this track)",
    bass: "Drift — 303: saw, high resonance, env-mod, accent + glide (the evolving line IS the song)",
    pad: "Wavetable — thin background haze, keep out of the way",
    chords: "Analog — rare metallic stabs",
    counterMelody: "Operator — secondary acid blips, heavily delayed",
    arp: "Drift — clicky 16th ticker",
    drums: "Drum Rack — hard 909, crunchy hats, clap layered",
  },
  trance: {
    lead: "Drift — supersaw-style detuned lead, wide, sidechained, big reverb (the anthem voice)",
    bass: "Drift — offbeat saw bass, tight LP, mono",
    pad: "Wavetable — uplifting supersaw pad, slow attack",
    chords: "Analog — sus-chord plucks, gated feel",
    counterMelody: "Operator — crystal counter-line, upper register",
    arp: "Drift — driving 16th pluck, delay throw",
    drums: "Drum Rack — 909, long crash tails, rolling 16th hats",
  },
  lofi: {
    lead: "Operator — dusty EP melody, low velocity, wow/flutter (Echo device)",
    bass: "Drift — soft round bass, no click",
    pad: "Wavetable — tape-warble pad, vinyl crackle layer",
    chords: "Analog — jazzy 7/9 keys through a LP + saturator",
    counterMelody: "Operator — hummed-melody stand-in, very quiet",
    arp: "Drift — kalimba-ish pluck",
    drums: "Drum Rack — dusty breaks kit, swung, low-passed",
  },
  synthwave: {
    lead: "Drift — brassy PWM lead, glide, gated reverb",
    bass: "Drift — driving octave bass, chorus, tight",
    pad: "Wavetable — huge 80s polysynth pad, ensemble chorus",
    chords: "Analog — power triads, gated",
    counterMelody: "Operator — DX-style bells",
    arp: "Drift — sparkling 16th arp, delay",
    drums: "Drum Rack — LinnDrum/gated-snare kit",
  },
  breakbeat: {
    lead: "Drift — rave hoover/stab lead, pitch-bent",
    bass: "Drift — reese-ish detuned bass, LP moves",
    pad: "Wavetable — dark strings pad",
    chords: "Analog — rave piano/stab chords, bright",
    counterMelody: "Operator — vocal-chop stand-in blips",
    arp: "Drift — festival pluck, wide",
    drums: "Drum Rack — chopped break kit (the star): layered snares, crash accents",
  },
};

/** What each genre is actually *about* — the intent behind the parameters. Written for the
 *  Song Info panel so a sheet reads like a producer's note, not a settings dump. */
const STYLE_STORY: Record<string, string> = {
  melodicTechno: "Melodic techno lives in the tension between a machine pulse and a human melody. The groove never lets go; the emotion arrives in the filter and the reverb tail, not in a chorus. Think Bodzin, Brikha — hypnotic first, pretty second.",
  dubTechno: "Dub techno is about space and decay. One chord, drenched in delay feedback, breathing against a soft kick. The chord isn't the event — the *echo* of the chord is. Basic Channel, Deepchord: the mix desk is the instrument.",
  detroit: "Detroit techno is soul played by machines. Bell melodies and 7th chords carry real melancholy over a stubbornly mechanical kick. It's optimistic and sad at once — Atkins, May, the future as it was imagined in 1988.",
  ambient: "Ambient is weather, not narrative. There's no beat to follow, so the ear falls into texture and slow harmonic drift. It has to reward both close listening and total inattention — Eno's test.",
  classicSeq: "Berlin School is the sequencer as protagonist. One 16th-note line runs for the whole piece; the composition happens *to* it — filter opening, notes added, octaves shifting. Tangerine Dream, Schulze: patience is the technique.",
  deepHouse: "Deep house is warmth and swing. Rhodes 7ths, a bass that walks rather than pounds, and a shuffle that makes the grid feel human. It's a groove you sink into, not one that hits you.",
  acid: "Acid is one squelching machine line — the 303 — and everyone else getting out of its way. The melody *is* the filter movement. Res up, cutoff riding, accent and glide doing the singing. The line evolves; nothing else needs to.",
  trance: "Trance is the long emotional arc: tension coiled over 32 bars, released in a supersaw payoff. Its honesty is in the build — the breakdown has to earn the drop, or it's just loud.",
  lofi: "Lo-fi is imperfection as comfort. Detuned keys, tape wobble, a swung kit that's slightly late. The dust is the point — polish it and the feeling dies.",
  synthwave: "Synthwave is nostalgia for a decade that never quite happened. Octave bass runs, gated drums, neon leads with too much reverb — sincere, not ironic.",
  breakbeat: "Breakbeat is broken momentum. The kick lands where you don't expect and the groove pulls forward. Energy comes from the gaps, not the density.",
};

/** Per-section guidance: what this section is FOR, and what to do with your hands. */
const SECTION_NOTE: Record<string, string> = {
  Intro: "State the idea bare. Filter mostly closed, few elements — let the listener lean in.",
  Build: "Add one element, not three. Open the filter a little. Tension comes from restraint.",
  Main: "The idea at full size. This is the section the track is *about* — ride the filter here.",
  Break: "Take the floor away. Drop the drums, let the tails and reverb breathe. The reset that makes Main 2 land.",
  "Main 2": "Same idea, more weight. Add the counter-element you held back. Never a new idea — a fuller one.",
  "Build 2": "Coil it again, tighter and shorter than the first build. The listener knows what's coming.",
  Drop: "Maximum commitment. Everything in, filter wide. Short — leave before it gets boring.",
  Outro: "Undo the intro. Strip back element by element, let the last echo decay into nothing.",
};

export interface SongStory {
  idea: string;
  style: string;
  sound: string;
  arrangement: string;
  performance: string;
  sections: { name: string; bars: number; note: string; cue?: string }[];
}

/** Build the narrative for a song sheet — pure and deterministic. */
/** How to PERFORM the hardware in each D MINI showcase — shown in Song Info. */
/** GENRE cue scores — the playing cue for every section when a song has no hardware showcase
 *  profile. Written for a Move + Live jam: which track's filter/sends/mute to move, when.
 *  Placeholders {lead}/{bass}/{harm}/{drums} are resolved to the song's actual track names. */
const GENRE_CUES: Record<StyleId, Record<string, string>> = {
  melodicTechno: {
    Intro: "Only {harm} and a filtered {bass}. **{harm} filter at 30%** — the chords are a rumour. Nothing else in.",
    Build: "Bring {drums} in on bar 1, hats only until bar 9. **Open {harm}'s filter 30 → 55%** across the section.",
    Main: "Full floor. **{lead} carries the idea** — ride its filter with the 8-bar phrases; sends up 20% on the last bar of each 8.",
    Break: "Mute {drums} on the downbeat. **{harm} + reverb send to 60%** — the chords finally breathe. Last 4 bars: pull the send back down.",
    "Main 2": "Everything back, one notch bigger: **{lead} filter 10% wider than Main**, {bass} unmuted on bar 1 with the kick.",
    "Build 2": "Cut {bass} for 8 bars — tension by absence. **{lead} filter climbing** to wide open by the last bar.",
    Drop: "**Filters wide, sends low, everything in.** The idea at full size. Don't add — commit.",
    Outro: "Mute {lead} first, then {drums} at bar 5. **{harm} filter closing 100 → 30%** — end where you began.",
  },
  dubTechno: {
    Intro: "Kick and a closed {harm} chord. **{harm} filter 25%, delay send 40%** — the chord is a shape in fog.",
    Build: "Hats in. **Nudge the delay feedback up 10%** — the tails start to overlap. Nothing melodic yet.",
    Main: "The chord finds its pulse. **{harm} filter 25 ↔ 45% in slow waves**, 8 bars per breath. This IS the song.",
    Break: "Kick out. **Delay feedback to 70%** — the chord repeats into itself. Let it smear for 8, then pull feedback down.",
    "Main 2": "Kick back. **{harm} filter waves 5% wider**; {bass} sub unmuted for weight.",
    "Build 2": "Hi-pass {bass} out slowly — **the floor thins under the chord.** Delay send creeping up.",
    Drop: "**{harm} filter to 60%** — the brightest the chord ever gets. Feedback down so it stays clear.",
    Outro: "Kick out at bar 1. **Delay feedback up, dry signal down** — the chord dissolves into its own echoes.",
  },
  detroit: {
    Intro: "Kick, hats, {bass}. **{bass} filter 40%** — feel the pocket before anything sings.",
    Build: "**{harm} stabs enter, filter 50%** — short, on the off-beats. Snare in on bar 9.",
    Main: "Full groove. **{lead} answers the stabs** — keep it sparse; the space IS Detroit. Ride {harm}'s send for the phrase-ends.",
    Break: "Kick and {bass} out. **{harm} + reverb send 50%** — the stabs float. Bring the kick back on the last beat.",
    "Main 2": "The soul section: **{harm} filter 10% wider, stabs a touch longer** — everything back, warmer.",
    "Build 2": "Snare rolls in {drums}; **{lead} filter climbing** — the payoff is owed.",
    Drop: "**Full groove, filters open** — but keep the space. Detroit's climax is confidence, not clutter.",
    Outro: "Strip in reverse: {lead} out, {harm} out, {bass} filter closing — **the kick leaves last.**",
  },
  ambient: {
    Intro: "Only {harm}. **Filter 20%, reverb send 60%** — the pad exists before it has a shape. Wait a full scene.",
    Build: "**{harm} filter 20 → 40%** across the whole scene, one continuous breath. {bass} enters, barely.",
    Main: "The idea at rest. **{lead} enters mid-scene, filter low** — a distant bell. Nothing else moves; time does.",
    Break: "Nothing new — take away instead: **{bass} out, {harm} send to 80%.** The reset that makes return mean something.",
    "Main 2": "{bass} back. **{lead} filter 15% wider** — the bell is a little closer.",
    "Build 2": "The one lean-forward: **{harm} filter to 55%**, sends steady.",
    Drop: "The fullest the piece gets — **{harm} filter 60%, {lead} present.** Still nothing sudden.",
    Outro: "**Every filter closing over 8 bars, sends up** — the pad returns to a rumour, then to nothing.",
  },
  classicSeq: {
    Intro: "{harm} sequence only, **filter 25%** — rhythm without pitch. Sit on your hands.",
    Build: "Kick in on bar 1. **{harm} filter 25 → 40%**, one continuous creep — if anyone sees you move, you moved too fast.",
    Main: "**{harm} filter 40 → 60%** over the scene, micro-oscillating with the phrase. {lead} drifts long tones above.",
    Break: "Kick out. **{harm} resonance up 20%** — the sequence whistles its own melody. The only resonance move in the piece.",
    "Main 2": "Resonance back down; **{harm} filter 40 → 70%** — familiar ground, higher altitude.",
    "Build 2": "**70 → 85%** in 16 bars — faster than before feels urgent. The sequence starts to shout.",
    Drop: "**{harm} filter wide open, HOLD.** Every harmonic lit. The payoff for the patience is simply all of it.",
    Outro: "One unbroken fall, **wide open → 25%**, all 8 bars. End where you began.",
  },
  deepHouse: {
    Intro: "Kick and swung hats. **{bass} filter 35%** — the pocket first, always.",
    Build: "**{harm} chords enter, filter 45%**, on the twos and fours. Let it swing before anything else.",
    Main: "The room. **Micro-moves only** — {bass} filter ±5% with the phrases, like a fader you're pretending not to touch.",
    Break: "Kick out. **{harm} + reverb send 45%** — the chords hang. Deep house breaks are warm, not empty.",
    "Main 2": "The fullest it gets: **{bass} filter 50%, {harm} a touch brighter.** The climax is a warm room, not a drop.",
    "Build 2": "**{harm} filter to 60%** — a little more light in the room.",
    Drop: "Deep house doesn't drop — **hold Main 2's warmth and lean in.** Sends up 10%.",
    Outro: "**{bass} filter back to 35%** over 8 bars — the track leaves the way it arrived, still grooving.",
  },
  acid: {
    Intro: "Kick and {bass} squelch, **{bass} filter 25%, resonance 50%** — the 303 line closed, growling.",
    Build: "**{bass} filter to 40%.** The squelch appears. Hats in on bar 9.",
    Main: "**{bass} filter 40 ↔ 60% in 2-bar waves, resonance 60%** — the 303 move, your hand. Everything else stays out of its way.",
    Break: "Kick out. **{bass} resonance to 80%, filter 30%** — thin, whistling growl. The tension bar.",
    "Main 2": "Kick back on the downbeat. **{bass} filter 45 ↔ 65%, resonance 65%** — the full-fat groove.",
    "Build 2": "**{bass} filter climbing 65 → 75%** — the growl becomes a bark.",
    Drop: "**{bass} filter 80%, resonance 75%** — the biggest squelch of the set. Sixteen bars, no mercy.",
    Outro: "**{bass} filter 80 → 25%** in one fall — the line submerges. End when it's a pulse again.",
  },
  trance: {
    Intro: "Kick, {bass} pumping root–fifth. **{harm} filter 40%** — the arp glints in half-light.",
    Build: "**{harm} filter 40 → 60%** in one smooth ramp with the riser. Commit.",
    Main: "Hold 60%. **{lead} theme enters** — the arp does the work, you keep the pocket. Micro-dips at phrase turnarounds.",
    Break: "Floor out. **{harm} filter to 45%, reverb send 60%** — the arp exposed, almost music-box.",
    "Main 2": "Back to 60%, {bass} pumping. **The ear knows the Drop is owed — don't spend it early.**",
    "Build 2": "**Delay send DOWN to 15%** — dry arp suddenly close and small, a held breath — while {harm} filter creeps to 70%.",
    Drop: "Everything at once: **{harm} filter 90%, resonance up, sends back to 40%.** Pure light. The thumbnail frame.",
    Outro: "**{harm} filter 90 → 40%**, resonance home — the reactor cooling. Let the last delay repeats be the last thing alive.",
  },
  lofi: {
    Intro: "Kick and sub, swung. **{harm} keys filter 40%** — dusty lid. Nod twice.",
    Build: "Keys enter behind the beat. **Touch nothing** — the velocities do the work.",
    Main: "**{harm} filter to 50%** as the section lifts. Behind the beat, always.",
    Break: "Kick out. **{harm} + reverb send 50%** — the keys ache in the space. Swing keeps it human.",
    "Main 2": "Kick back. **{harm} filter easing to 45%** — coming home, but the ear remembers the space.",
    "Build 2": "**{harm} filter 55%** — a last lean into the light.",
    Drop: "Lo-fi doesn't drop — **hold Main 2 and let the dust settle in the mix.**",
    Outro: "Last chords, **{harm} filter drifting to 35%.** End with the softest chord of the take.",
  },
  synthwave: {
    Intro: "{bass} pulse and gated {drums}. **{harm} filter 40%** — the neon flickers on.",
    Build: "**{harm} chords enter, filter 50%**, staccato blocks. Snare on bar 9.",
    Main: "**{lead} theme, filter 60%** — sing it. {harm} blocks tight; the space between stabs is the groove.",
    Break: "Kick out. **{harm} one long held chord, reverb send 60%** — let it decay completely.",
    "Main 2": "Blocks return. **{harm} filter 50 → 65%** — the chorus lift; all voices bloom together.",
    "Build 2": "Snare rolls; **{lead} filter climbing** — the sunset is owed.",
    Drop: "**Filters open, gated reverb up** — the widescreen moment. Hold it.",
    Outro: "Staccato echoes thinning, then **a single held final chord, {harm} filter easing to 40%.** One breath out.",
  },
  breakbeat: {
    Intro: "Breaks and sub only. **{lead} filter 25%**, waiting.",
    Build: "**{lead} enters, filter 40%** — short phrases. Establish the speaker before the speech.",
    Main: "**{lead} filter 40 ↔ 60% every 4-bar phrase** — conversation with the breaks. Let the delay stack.",
    Break: "Half-time floor. **{lead} one long low note, filter 55%, reverb send 60%** — the creepiest 8 bars.",
    "Main 2": "Full breaks. **{lead} filter changes every 2 bars** — agitated now; short phrases, not paragraphs.",
    "Build 2": "**{lead} filter to 75%**, snare rolls in {drums} — the voice pushes forward.",
    Drop: "**{lead} filter 70%, delay send 50%** — full projection, phrases overlapping. Then out.",
    Outro: "One final phrase, then **{lead} filter slowly to 0%** while the delay repeats — the voice loses its language.",
  },
};

/** Per-scene PLAYING CUES for the hardware showcase profiles — the booklet's timeline as data.
 *  Keyed by section name; missing sections fall back to SECTION_NOTE. These print on the
 *  Performance Sheet's timeline row, at the moment they're needed. */
export const PROFILE_CUES: Record<string, Record<string, string>> = {
  dminiSeqAcid: {
    Intro: "Sequence alone. **Cutoff 2.5, Emphasis 6.5** — closed, growling, hypnotic. Nothing else. Let it repeat until it stops being repetition.",
    Build: "Kick and sub in. **Cutoff to 3.5** — the squelch appears under the floor. Two-bar waves, small.",
    Main: "Full floor. **Cutoff 4 ↔ 5.5 in 2-bar waves**, Contour 7 snapping. Everything else stays OUT of the sequence's way.",
    Break: "Floor gone, chords hold. **Cutoff 3, Emphasis 8** — the sequence thin and whistling over the chords. The tension bar.",
    "Main 2": "Floor back on the downbeat. **Cutoff 5, Emphasis 7** — the full-fat groove. Contour to 8 for accents.",
    "Build 2": "Stripped to arp + kick + sub. **Cutoff climbing 5 → 6**, Emphasis 7.5 — the growl brightens into a bark.",
    Drop: "**Cutoff 6.5, Emphasis 8** — the biggest the sequence gets. Sixteen bars, no mercy, no second idea.",
    Outro: "Floor out, chords fade. **Cutoff 6.5 → 2.5** in one unbroken fall — the sequence submerges. End when it's a pulse.",
  },
  dminiSeqBrikha: {
    Intro: "Sequence alone. **Cutoff 3.5, Decay 3.5** — round, legato, already melodic. Let the room learn the pattern.",
    Build: "Kick and warm bass in. **Cutoff to 4** — a little light on the sequence. Hats on bar 9.",
    Main: "The soul section: chords and the melodic answer arrive. **Cutoff 4 → 5 over 32 bars**, one long arc — the sequence blooms under the melody.",
    Break: "Floor gone, chords only. **Decay (25) to 5** — the steps ring into each other, the sequence turns to a chord. Cutoff 4.",
    "Main 2": "Everything back, one notch bigger. **Cutoff 5 → 5.5, Decay back to 3.5** — the machine returns, warmer.",
    "Build 2": "Stripped to arp + kick + bass. **Detune (11) to 5.6** — the beat quickens; anticipation without density.",
    Drop: "**Cutoff 6, Detune back to 5.3** — the fullest, cleanest statement of the sequence, melody singing above it. The payoff is clarity.",
    Outro: "Floor out, chords fade. **Cutoff 6 → 3.5, Decay to 5** — the sequence softens into a memory of itself.",
  },
  // ---- CZ-1 MINI × HOOKS (v0.75): every cue is a CZ-1 MINI move; the hook itself stays untouched.
  cz1TineHook: {
    Intro: "Drums and bass only — the CZ is silent. **Filter Cutoff (CC89) preset to 72**, Chorus on, hands off. Let the room want the hook before it hears it.",
    Groove: "Arp and OB-X pads in. Still no CZ. **Nothing to touch** — this scene exists so the Breakdown lands.",
    Breakdown: "Floor out. **The tine hook, alone, over the pad.** Cutoff (CC89) 45 — darker, closer. Play it exactly as written; recognisability is the whole point.",
    Lift: "Arp back under the hook. **Cutoff (CC89) 45 → 72 across the scene** — the tine brightens as the room fills. Same notes.",
    Drop: "Everything. **Cutoff 72, Chorus Amount (CC92) to 30** — the hook at full width over OB-X pads. Do not vary the hook; vary nothing but the width.",
    "Groove 2": "One notch down. **Chorus Amount back to 20.** The hook keeps repeating; the audience is singing it now.",
    Outro: "Arp, bass, drums thin out. **Cutoff (CC89) 72 → 40** on the last hook statement — the tine sinks into the dark it came from.",
  },
  cz1BellHook: {
    Intro: "Drums and rolling sub. CZ silent. **Detune Fine (CC12) preset to 12**, H90 hall ready. Anticipation.",
    Groove: "Arp pluck and sidechained stabs in. **Still no bell.** Filter the arp dark so the top of the mix is empty — that space is the bell's.",
    Breakdown: "Floor out. **The bell hook, alone, Detune Fine (CC12) 12 → 4** — the shimmer collapses to a pure ring. Exposed, simple, sung.",
    Lift: "Arp returns under it. **Detune Fine 4 → 12 over the scene** — the bell widens back to shimmer as the energy climbs.",
    Drop: "Everything, 132, full. **Detune Fine 12, Cutoff (CC89) 85** — the bell at its widest and brightest, hook unchanged, hall wide open.",
    "Groove 2": "Same hook, one layer thinner. **Cutoff (CC89) to 78** — a shade softer so the second Drop can be brighter.",
    Outro: "Floor out, sub and arp fade. **Last hook statement into a long hall tail** — let the ring finish itself. No fade on the CZ.",
  },
  cz1BrassStab: {
    Intro: "Stabs alone sketch the rhythm. **DCW1 RA stage 1 (CC73) 25 — swell stabs**, soft-edged. The rhythm is the hook: establish it, don't decorate it.",
    Build: "Bass in. **CC73 to 40** — stabs sharpen. Same rhythm, same notes.",
    Main: "Topline arrives over the stabs. **CC73 70 — hard 80s hits.** The stabs now punch; the lead sings above them.",
    Break: "Lead over the stabs, **CC73 25** — swell again, breathing. The rhythm you've been hearing is now the only harmony.",
    "Main 2": "**CC73 70.** Everything back. If you change anything, change ONLY the stab attack — never the pattern.",
    Outro: "Stabs alone, **CC73 25**, fading. End on one swell stab held past the last bar.",
  },
  cz1ReedTopline: {
    Intro: "Chords alone. CZ silent. **Vibrato Depth (CC6) preset to 20, Delay (CC7) 35** — the reed is set to sound played, not programmed.",
    Build: "Bass and chords settle the floor. **Reed enters on the last 4 bars** — one question phrase, Depth 20, restrained.",
    Main: "Call and response: reed asks, bell counter-melody answers. **Vibrato Depth (CC6) 20 on phrases, 35 on the held hook notes** — expression lives in the wobble.",
    Break: "Floor out. **Reed alone over the chords, Depth 35, longer notes** — the hook stated slow, like a singer taking the bridge.",
    "Main 2": "Everything. **Depth back to 20 — cleaner, the hook stated plainly** so it's whistleable. Let the bell answer breathe.",
    Outro: "Chords fade. **One final held reed note, Depth 40, Delay 35** — the vibrato arrives late and carries it out.",
  },
  dminiEmphasis: {
    Intro: "**Emphasis 6, Cutoff 3.** The whistle is barely there — a hint of feedback under the 303.",
    Build: "**Emphasis to 7.5.** The filter starts to sing its own note. Play SHORT — let the ring finish each phrase.",
    Main: "**Emphasis 8**, and now Cutoff IS pitch: **sweep 2.5 ↔ 4** to play the whistle as a second melody over the sequence.",
    Break: "**Emphasis 9 — self-oscillation.** Floor drops; you're playing a pure sine with the Cutoff knob. Slow, deliberate, alone.",
    "Main 2": "Back to **Emphasis 8**; trade fours with the 303 — it squelches, you whistle back.",
    "Build 2": "**Emphasis 8.5, Cutoff creeping up** — the ring tightens toward a scream.",
    Drop: "**Emphasis 9, Cutoff 5** — full scream over the full floor. Eight bars max, then pull back — nobody survives more.",
    Outro: "**Emphasis falling 9 → 6** as Cutoff closes — the whistle dies into the sequence, then the sequence dies.",
  },
  dminiAcidBass: {
    Intro: "**Cutoff 2, Emphasis 6.5.** The D MINI IS the acid line — closed, growling under the kick. Feel it, don't hear it.",
    Build: "**Cutoff to 3.5.** The squelch appears — Contour 7 doing what a 303's env mod does. Nothing else moves.",
    Main: "**Cutoff 4–5**, working the knob in 2-bar waves. This IS the 303 move on a Moog filter — rounder, meaner, more low end.",
    Break: "**Cutoff to 2.5, Emphasis 8** — thin, hollow, whistling growl with the floor gone. The tension bar.",
    "Main 2": "**Cutoff 5, Emphasis 7** — the full-fat groove. Contour to 8 for the accents.",
    "Build 2": "**Cutoff climbing 5 → 6**, Emphasis 7.5 — the growl brightens into a bark.",
    Drop: "**Cutoff 6, Emphasis 8** — the biggest acid bass a ladder filter makes. Sixteen bars, no mercy.",
    Outro: "**Cutoff 6 → 2** in one fall — the line submerges. End when it's a pulse again.",
  },
  dminiFilterMod: {
    Intro: "**Filter Mod ON, LFO Rate 3, Mod Depth 3** — a shallow, slow wobble on a held note. Under the radar.",
    Build: "**Mod Depth to 5.** The wobble is now audible as rhythm — a second sequencer inside the sound.",
    Main: "**LFO Rate to 1/8-ish (4).** Locked-feeling wobble against the 303. Ride Cutoff 3.5 ↔ 5 to move the wobble's centre.",
    Break: "**LFO Rate down to 1 — slow sweep**, Mod Depth 8. The wobble becomes a tide. Floor gone; let it wash.",
    "Main 2": "**LFO Rate back to 4, Depth 6.** Familiar wobble; now push **Emphasis to 6.5** — the LFO sweeps a sharper peak.",
    "Build 2": "**LFO Rate to 6 (1/16-ish)** — the wobble doubles; tension by density.",
    Drop: "**LFO Rate 8 — free-run**, Depth 8, Emphasis 7 — the ladder filter as a ring modulator. The chaos payoff.",
    Outro: "**Depth to 0** over 8 bars — the wobble slows into stillness; a plain held note, then nothing.",
  },
  dminiBass: {
    Intro: "**Cutoff to 2.5** before launch — the bass enters as pure weight. Check the three VCOs are in tune while it's dark.",
    Build: "Ease **Cutoff to 3.5** (home) across the first 8 bars. Hands off Contour — save it.",
    Main: "Home groove. Every 8th bar push **Contour to 7–8 for two beats** and let go — that snap is your accent.",
    Break: "Pull **Cutoff to 2**; the keys own the room. Last 4 bars: one slow rise toward 4.",
    "Main 2": "The payoff: **Cutoff 4–5, Contour parked at 7.** Biggest the bass gets. If it distorts, that's correct.",
    "Build 2": "Cutoff climbing **4.5 → 5.5** — the floor tightens before it drops.",
    Drop: "**Cutoff 5, Contour 8** — the heaviest four bars of the set, then hold.",
    Outro: "Ride **Cutoff down to closed** over all 8 bars. Contour Decay OFF: the last note stops dead. End ON the stop.",
  },
  dminiLead: {
    Intro: "Lead rests — **tuning ritual**: check the three VCOs against the sub while nobody hears.",
    Build: "First fragments — play them **plain, zero vibrato**. Restraint now makes the Break land.",
    Main: "Full theme. **Mod-wheel vibrato only on phrase-ending notes** — a singer, not a siren. Cutoff home at 6.",
    Break: "The star moment: **open Cutoff to 7**, long tones, full vibrato — let each ring on the ON decay.",
    "Main 2": "Theme returns. **Nudge Detune to 6.5** — the stack widens, the return feels bigger without playing louder.",
    "Build 2": "Drop the left hand an octave; **Cutoff 6.5** — the lead thickens before the payoff.",
    Drop: "**Cutoff 7, Detune 6.5**, full vibrato — the vocal solo of the set.",
    Outro: "One final phrase, hands off. The tail outlives the last drum hit — **the ring is the ending.** Detune back to 6.",
  },
  dminiFilter: {
    Intro: "**Cutoff 2.** The sequence is a shadow — rhythm without pitch. Sit on your hands.",
    Build: "One continuous creep, **2 → 3**, spread across all 16 bars. If anyone sees you move, you moved too fast.",
    Main: "**3 → 4.5** over 32 bars. Micro-oscillate ±0.2 with the phrase — but always trending open.",
    Break: "Fall back to **3** and raise **Emphasis to 6–7** — the resonant peak becomes the melody. The ONLY Emphasis move.",
    "Main 2": "Emphasis back to **5**, then climb **3 → 5.5**. Familiar ground, higher altitude.",
    "Build 2": "**5.5 → 6.5.** Faster now — a point and a half in 16 bars feels urgent. The filter starts to shout.",
    Drop: "**7 — wide open** and HOLD. Every harmonic fully lit for a full minute. The payoff is simply: all of it.",
    Outro: "One unbroken fall, **7 → 2**, all 8 bars. End where you began: rhythm without pitch, then silence.",
  },
  dminiGlide: {
    Intro: "**Glide 0.** Stepped, dry, mechanical — establish 'normal' so its dissolution means something.",
    Build: "**Glide to 1.5.** Only the large intervals smear; small steps still snap.",
    Main: "**Glide 3.** Everything slides. Add vowels — tiny **Cutoff wiggles (4 ↔ 5)** in time with the 303's filter.",
    Break: "**Glide 5.** Fully smeared — pitch becomes trajectory. Play WIDE intervals; the journey is the note.",
    "Main 2": "Ease to **Glide 4** so the theme is recognisable again; keep Emphasis 6 singing.",
    "Build 2": "**Glide 5, Cutoff creeping to 5.5** — the lines lean into each other.",
    Drop: "**Glide 5.5, Emphasis 6.5** — the whole line is one continuous bend.",
    Outro: "**Glide 6** on the final phrase — the last note sets off and the song ends before it arrives. End mid-slide.",
  },
  dminiRing: {
    Intro: "Silence from the hardware. Set **Detune 5**; one test hit off-mic — find tonight's bell.",
    Build: "One stab every 2 bars on the AND of 3. **Duck Cutoff to 3 between hits** so every stab arrives out of darkness.",
    Main: "Call & response with the dub chord. Sweep **Detune 4 → 6 over 8 bars**, then back — bell → gong → bell.",
    Break: "The extremes: **Detune 2, then 8** — broken glass, sheet metal. A sound-design solo; the ugly positions are the point.",
    "Main 2": "Settle at **Detune 5.5** and go SPARSER than Main. After the Break's chaos, restraint reads as mastery.",
    "Build 2": "Stabs every bar now, **Cutoff rising to 6** — the metal brightens.",
    Drop: "**Detune 6, Cutoff 6.5** — stabs on every downbeat into maximum Qi feedback.",
    Outro: "One final stab on bar 1, then **turn Detune in slow motion toward 5** while the Qi rings it out. Fade the pedal, not the synth.",
  },
  dminiDrone: {
    Intro: "Hold the root. Attack at 6 — the drone **takes ~5 s to exist**; let the fade-in be the downbeat. Then nothing.",
    Build: "One full breath: **Cutoff 2.5 → 4 → 2.5** across the whole scene. Watch the pad, not the knob.",
    Main: "Move to the **fifth** for this scene (release the root fully first — the ON decay carries the crossfade). Slow Cutoff breaths.",
    Break: "Back on the root. **Nudge Detune to 5.5** — the beating quickens; agitated water. Loudest thing in the piece.",
    "Main 2": "**Detune back to 5.2** in slow motion (30 s of travel). Alternate root and fifth every 16 bars.",
    "Build 2": "Cutoff breath **2.5 → 4.5** — the one time the drone leans forward.",
    Drop: "**Cutoff 4.5, Detune 5.4** — the fullest the drone ever gets. Still nothing sudden.",
    Outro: "Release on bar 1 and touch nothing. Contour Decay ON: **the tail IS the outro** — the song ends when the drone decides.",
  },
  dminiPoly: {
    Intro: "Sub and drums only. Rest hands on the keys and **count** — the pocket starts soon.",
    Build: "**Two-note dyads**, staccato. Withholding the third voice now makes the Main an arrival.",
    Main: "Full **three-voice triads**. All three pitches share one bloom. Tight releases — the silence between stabs is the groove.",
    Break: "Hold **ONE chord** and let it decay completely — 8 bars, one gesture. Three voices dying as one.",
    "Main 2": "Blocks return. **Open Cutoff 5 → 6.5** — in POLY the filter opens on ALL voices at once; that collective bloom is the lift.",
    "Build 2": "Dyads again, faster, **Decay to 6** — tension through thinning, not adding.",
    Drop: "**Cutoff 7, full triads on every hit** — the shared envelope at maximum.",
    Outro: "Staccato echoes thin to dyads, then a **single held final chord** with Cutoff easing to 4. Three voices, one breath out.",
  },
  proteinSweep: {
    Intro: "Pad enters at **Wave 20%** — soft glass. Let Env 3's bloom be the only motion.",
    Build: "Creep **Wave 20 → 35%** across the section. If you can hear yourself sweeping, slow down.",
    Main: "Hold around **40%**; the envelope's per-note sweep does the work. Small ±5% strokes with the phrases.",
    Break: "Fall back to **20%** — still water while the floor drops out.",
    "Main 2": "The one great journey: **20 → 80% across the full scene**, THROUGH the resonant ridge. This is the climax.",
    "Build 2": "Hold **80%** — the strange thin frames at the table's end.",
    Drop: "**Wave 90%** and Cutoff up — the table fully lit.",
    Outro: "Stay past the ridge; let the last chord release through Env 3. **End in the weird part of the table.**",
  },
  proteinBass: {
    Intro: "**Cutoff 30%.** Bass and kick find each other — adjust nothing until you feel it lock.",
    Build: "Ease to **35%** as the chords arrive. The aliasing halo is now audible — that's the Microwave saying hello.",
    Main: "Home. **Micro-moves only (±3%)**, riding the 8-bar phrases like a fader you're pretending not to touch.",
    Break: "Pull **Cutoff Track to ~20%** — high bass notes go woolly and distant. Restore before the section ends.",
    "Main 2": "The fullest it gets: **Cutoff 45%**. In deep house the climax is a warm room, not a drop.",
    "Build 2": "**Cutoff 40%**, Dirt nudged to 15% — a little more hair on the low end.",
    Drop: "**Cutoff 45%, Dirt 15%** — the room at its warmest.",
    Outro: "Back to **30%** over 8 bars — the track leaves the way it arrived, still grooving.",
  },
  proteinSpeech: {
    Intro: "Park **Wave at your darkest vowel (~25%)** and wait — the voice should arrive like someone entering the room.",
    Build: "First short phrases, one vowel. **Don't move the knob yet** — establish the speaker before the speech.",
    Main: "Conversation: **new Wave position every 4-bar phrase** — 25 / 45 / 60 / back. Let the delay stack syllables into almost-words.",
    Break: "Half-time floor. Park on an **open vowel (~55%)** and hold one long low note — the LFO makes it moan.",
    "Main 2": "Faster diction: **vowel change every 2 bars**. Agitated now — short phrases; panic, not paragraphs.",
    "Build 2": "Vowels every bar, **Cutoff up to 75%** — the voice pushes forward.",
    Drop: "**Wave 60–70%, delay Amount 50%** — the voice at full projection, syllables overlapping.",
    Outro: "One final phrase, then sweep **Wave slowly to 0%** while the delay repeats — the voice loses its language. End on the machine.",
  },
  proteinRobin: {
    Intro: "Kit and bass. **Solo-check all four layers** once more — the rotation only works if the weights agree.",
    Build: "Stabs begin. Listen for the cycle — mallet, formant, glass, brass — and **count its period against the 4-bar phrase**.",
    Main: "The lead answers the rotation. Your discipline: **touch nothing.** Folded hands next to a synth that keeps changing colour IS the show.",
    Break: "Rotation fully audible for the first time. If you must move, **reverb Amount to 45%** — four timbres in one room.",
    "Main 2": "The sanctioned move: **each layer's Cutoff up ~10%**, as a set. The whole rotation brightens together.",
    "Build 2": "Reverb back to 30%; stabs faster — **the rotation cycles quicker on its own.**",
    Drop: "Hands off. **Every stab a different face**, brightened — let the round robin run the payoff.",
    Outro: "Stabs thin. The last four chords land on four different faces — **let whichever falls on the final chord be the ending.**",
  },
  proteinFlavor: {
    Intro: "**Flavor 0%.** Digitally perfect — sterile on purpose. Let them trust the machine before you break it.",
    Build: "**Flavor 10%.** Something is very slightly wrong and no one can say what. Play the same chord twice; hear the voices disagree.",
    Main: "**Flavor 25%.** The wobble is character now — tape-like, warm. Long root/fifth holds; nothing else.",
    Break: "**Flavor 40%.** With floor gone, the aging IS the content. This is the portrait shot.",
    "Main 2": "**Flavor 55%, then 65%** halfway through. Old now — lovely and unreliable. Hold chords longer than feels safe.",
    "Build 2": "**Flavor 70%** — the pitch breathes visibly.",
    Drop: "**Flavor 75%** — as old as it gets. Let the instability finish the chords for you.",
    Outro: "Final chord, release — and as the tail fades, **reload the saved pristine slot**. One young clean chord. End on the memory.",
  },
  proteinDirt: {
    Intro: "Kit and sub. **Dirt at 10%**, waiting.",
    Build: "Keys enter behind the beat. Generated velocities do the work — **listen for louder chords opening the table.** Touch nothing.",
    Main: "**Dirt to 25%** as the section lifts — the rust steps forward, pitched a fifth up.",
    Break: "Re-voice the rust: **retune Osc 2 to +3** — the fifth turns sour. **Dirt to 40%**, its one visit to the ceiling.",
    "Main 2": "**Osc 2 back to +7, Dirt easing to 20%** — coming home, but the ear remembers the sour version.",
    "Build 2": "**Dirt 30%** — a last lean into the grit.",
    Drop: "**Dirt 35%, Osc 2 +7** — the dust at its densest, still musical.",
    Outro: "Last chords, **Dirt drifting to 10%**. The dust settles — literally. End with the softest chord of the take.",
  },
  proteinGlass: {
    Intro: "**Cutoff 55%.** The sequence glints in half-light — the accents already open the table.",
    Build: "To **Cutoff 70%** in one smooth ramp with the riser. Commit.",
    Main: "Hold 70%. The glass does the work; you keep the pocket. **Micro-dips (−5%) at phrase turnarounds.**",
    Break: "Floor out, glass exposed. **Cutoff to 60%** — closer, almost music-box.",
    "Main 2": "Back to **70%**. The ear knows the Drop is owed. Don't spend it early.",
    "Build 2": "The trick: **delay Amount to 15%** — dry glass suddenly close and small — while Cutoff creeps to 75%.",
    Drop: "Everything at once: **Cutoff 85%, Resonance 45%, delay back to 40%.** Pure light. The thumbnail frame.",
    Outro: "Resonance home to 25%, **Cutoff falling 85 → 55%** — the reactor cooling. Let the last repeats be the last thing alive.",
  },
};

const PROFILE_PERFORMANCE: Record<string, string> = {
  proteinSweep: "**The Wave knob is the pad.** Set Env 3 to carry the slow sweep on every note, then override it by hand at section changes — pull position back to 20% entering Breaks, push toward 80% into the Drop. The table's resonant ridge around the middle is your sweet spot; linger there.",
  proteinBass: "**Huckaby discipline: Cutoff and nothing else.** The 8-bit aliasing does the harmonic work in octaves 1–2 — resist the urge to add. Ride Cutoff 30–45% with the sections; in the Break, pull Cutoff Track down so high notes go woolly. Save the patch to a slot before the jam — the Protein remembers, use it.",
  proteinSpeech: "**Make it talk.** Vowels live between 20% and 70% of the wave position — move the knob BETWEEN phrases, not during, so each phrase speaks a different syllable. LFO 1 keeps a slow undercurrent; your hand does the diction. In the Break, park at an open-vowel spot and let it moan over the half-time floor.",
  proteinRobin: "**Hands off — that's the study.** Four layers rotate under a static part; your discipline is NOT touching it while the round robin shimmers. Your one move: in Main 2, nudge each layer's Cutoff up ~10% (they're matched, so the rotation brightens as a set). If a layer sticks out, fix its level, not its tone.",
  proteinFlavor: "**Flavor is the clock.** Start at 0% — pristine, digital, still. Add roughly 10% per section, never during a phrase. By the Outro (~70%) the pad wobbles like a 40-year-old machine, and THAT decay is the piece. The de-calibrated filters mean every chord voices slightly differently: play the same chord twice and listen for the difference.",
  proteinDirt: "**Dirt is seasoning, played in ranges.** 10% verses, 25–40% when the section lifts — past 50% it stops being dust and becomes distortion, which is a different song. Osc 2's tuning sets WHICH rust you hear: +7 is churchy, +3 is sour, unison is tremolo. Retune between sections, land back on +7 to come home.",
  proteinGlass: "**Velocity already plays the glitter — you play the frame.** Cutoff follows the energy arc (55% Intro → 70% Mains → 85% Drop); push Resonance to 45% ONLY at the Drop, where the sequence turns to pure light. In Build 2, pull the delay Amount down so the dry glass sounds suddenly close — then let it bloom back for the payoff.",
  dminiSeqAcid: "**The sequence never leaves — you are the arrangement.** The D MINI runs the same acid line in all eight scenes; what changes is Cutoff (15) (2.5 closed → 6.5 open across the song), Emphasis (16) (6.5 → 8 at the Drop), and what the floor is doing around it. Never touch the notes. Never add a second idea. Cutoff is the composition.",
  dminiSeqBrikha: "**The sequence never leaves — and it's melodic.** Octave mode, low Emphasis, longer Decay: the D MINI's line is a tune, not a growl. Cutoff (15) moves in long arcs (a whole scene per move); Decay (25) is your second dial — longer turns the sequence into a chord, shorter back into a machine. The Drop is clarity, not size.",
  dminiEmphasis: "**Emphasis (16) is the melody.** Between 6 and 9 the ladder filter goes from a whistle under the sound to a pure sine on top of it — and once it self-oscillates, Cutoff plays PITCH. Keep the MIDI short and let the ring speak between notes; play the whistle against the 303's squelch, never with it.",
  dminiAcidBass: "**You are the acid line.** No 303 in this song — the D MINI's ladder filter does the squelch: Contour (17) is your env-mod, Cutoff (15) is the knob, Emphasis (16) sets the bite. Work Cutoff in 2-bar waves like a 303 player would, and save the Emphasis push for the Drop. Louder low end than any 303 — mind your monitors.",
  dminiFilterMod: "**LFO Rate is your instrument.** Filter Mod ON puts the LFO on the ladder; Mod Depth (28) is how much, LFO Rate is how fast. Near 1/8 it locks to the groove; near 1/16 it doubles; free-run turns the filter into a ring modulator. Move the rate BETWEEN phrases so each section has its own wobble.",
  dminiBass: "**The D MINI is your bass.** Set the panel per the track's knob list, then perform with two fingers: Cutoff (15) creeps from 3.5 toward 5 as sections build, and Contour (17) is your accent — push it for the Drop, pull it back for Breaks. Keep Emphasis low; the weight IS the show.",
  dminiLead: "**The D MINI is your lead voice.** Mod-wheel vibrato is the phrase-ending — none in the Intro, full singer's vibrato by the Break. Ride Cutoff (15) with the energy arc and drop your left hand an octave in Main 2: Unison detune does the rest.",
  dminiFilter: "**The song is one knob.** The sequence never changes — Cutoff (15) closed at 2 through the Intro, opening ~1 point per section to ~7 at the Peak, then closing again for the Fade. Emphasis (16) to 6–7 ONLY in the Strip, where the resonance becomes the melody. Do not touch anything else; that discipline is the piece.",
  dminiGlide: "**Glide is the melody.** Start with Glide near 0 — dry, stepped. Raise it a point per section: by the Peak, lines smear into each other and the pitch never fully arrives. Emphasis (16) at 6 keeps the filter vocal; small Cutoff moves read as vowels.",
  dminiRing: "**Detune (11) is your instrument.** In RING mode it retunes the whole inharmonic spectrum — sweep it slowly and the stabs morph from bell to gong to broken glass. Play sparse hits, let your Qi delay do the repeats, and duck Cutoff between phrases so every stab arrives out of darkness.",
  dminiDrone: "**Hold one note and live there.** The drone breathes through Cutoff (15) between 2 and 4 — a full section per sweep, never faster. Nudge Detune (11) ±0.3 for the beating to speed and slow. Contour Decay (23) stays ON: when you finally release, the tail is the ending.",
  dminiPoly: "**Respect the shared envelope.** Three voices, one contour — legato re-triggers steal the envelope from held notes, so play staccato block chords and let Decay (25) make the space. Open Cutoff (15) for the chorus sections; in POLY mode the filter opens on ALL voices at once, and that bloom is the drama.",
};

export function buildSongStory(o: {
  seed: number; style: StyleId; key: string; bpm: number;
  templateId: string | null; progressionPreset: string; parts: PartId[];
  moveMode?: boolean; moveBars16?: boolean; soundProfile?: string; clipBars?: number;
  starterId?: string;
  tracks: { part: PartId; track: string; instrument: string; patch?: string; patchName: string }[];
}): SongStory {
  const starter = o.starterId ? SONG_STARTERS.find((s) => s.id === o.starterId) : undefined;
  const preset = PROGRESSION_PRESETS.find((p) => p.id === o.progressionPreset);
  const traits = STYLES[o.style] ?? STYLES.melodicTechno;
  const isStatic = preset?.id === "static" || (preset?.label ?? "").toLowerCase().includes("static");

  // --- the one strong idea ---
  const ideaBits: string[] = [];
  if (starter?.desc) ideaBits.push(starter.desc);
  const engine = o.parts.includes("bass") && (traits.bass === "acid")
    ? "the 303 line is the engine — everything else is weather around it"
    : o.parts.includes("arp")
      ? "the sequence is the engine — the composition happens to it, not around it"
      : o.parts.includes("chords") || o.parts.includes("pad")
        ? "the chord and its decay are the engine — the space around it does the work"
        : "the groove itself is the engine";
  ideaBits.push(`In ${o.key} at ${o.bpm} BPM, ${engine}.`);
  ideaBits.push(isStatic
    ? "The harmony is static on purpose: one chord, so the ear stops tracking changes and starts hearing texture. That's the hypnosis."
    : `Harmony moves as ${preset?.label ?? "a genre-typical progression"} — enough motion to breathe, not enough to distract.`);
  if (o.clipBars && o.clipBars >= 16) {
    ideaBits.push(`Clips run ${o.clipBars} bars so the evolution happens *inside* the loop — by the final third the bass lifts an octave and the pad doubles up top. Long-form, not looped.`);
  }

  // --- sound identity ---
  const named = o.tracks.filter((t) => t.patch && t.part !== "drums");
  const externals = o.tracks.filter((t) => (t.instrument || "").includes("MIDI out"));
  const soundBits: string[] = [];
  if (externals.length) soundBits.push("One voice is HARDWARE — the reason this song exists:");
  for (const t of externals) soundBits.push(`· **${t.track}** — ${(t.instrument || "").replace(/\s*\(MIDI out\)\s*$/, "")} (external hardware; MIDI out, no device loaded — panel settings on the card)`);
  const rest = externals.length ? "Every other part" : "Each part";
  if (o.moveMode) soundBits.push(`Everything ${externals.length ? "else " : ""}is Drift (Move's only voice), so the identity comes from patch design rather than instrument choice:`);
  else soundBits.push(`${rest} gets the instrument that suits it:`);
  for (const t of named) {
    soundBits.push(`· **${t.track}** — ${t.patchName}${o.moveMode ? "" : ` on ${t.instrument}`}`);
  }
  const drums = o.tracks.find((t) => t.part === "drums");
  if (drums) soundBits.push(`· **${drums.track}** — ${starter?.drumFeel ? `${starter.drumFeel} feel` : "kit per style"}`);

  // --- arrangement ---
  const tpl = o.templateId ? SONG_TEMPLATES[o.templateId as SongTemplateId] : undefined;
  const cueMap = (o.soundProfile && PROFILE_CUES[o.soundProfile]) || null;
  const genreCues = GENRE_CUES[o.style] || null;
  const trackFor = (part: PartId): string | null => o.tracks.find((t) => t.part === part)?.track ?? null;
  const nameOf = (parts: PartId[], fallback: string): string => {
    for (const p of parts) { const t = trackFor(p); if (t) return t; }
    return fallback;
  };
  const subs: Record<string, string> = {
    "{lead}": nameOf(["lead", "counterMelody", "piano"], "the lead"),
    "{bass}": nameOf(["bass"], "the bass"),
    "{harm}": nameOf(["chords", "pad", "arp", "piano"], "the harmony"),
    "{drums}": nameOf(["drums"], "the drums"),
  };
  const fill = (txt: string): string => txt.replace(/\{(lead|bass|harm|drums)\}/g, (m) => subs[m] ?? m);
  const sections = (tpl ?? []).map((s) => ({
    name: s.name,
    plays: scenePlays(s.parts, o.parts),
    bars: capBarsForMove(sectionBars(s.name, o.style), !!o.moveBars16),
    note: SECTION_NOTE[s.name] ?? "Carry the idea forward.",
    // the playing cue for THIS scene: hardware showcase score first, else the genre score
    cue: cueMap?.[s.name] ?? (genreCues?.[s.name] ? fill(genreCues[s.name]) : ""),
  }));
  // v0.77 TRANSITION PLANNER: every scene boundary gets its own line in the cue
  for (let i = 0; i < sections.length - 1; i++) {
    const plan = planTransition(sections[i].name, sections[i + 1].name, o.style);
    if (plan?.cue) sections[i].cue = (sections[i].cue ? sections[i].cue + " " : "") + plan.cue;
  }
  const totalBars = sections.reduce((a, b) => a + b.bars, 0);
  const mins = totalBars ? (totalBars * 4 * 60) / o.bpm / 60 : 0;
  const arrangement = tpl
    ? `${sections.length} scenes, ${totalBars} bars — roughly ${mins.toFixed(1)} minutes at ${o.bpm} BPM. The arc is energy, not novelty: every section is the same idea seen from a different distance. Launch scenes in order, or jump Main ↔ Break live.`
    : "Single scene — one clip per part. Build the arrangement by hand, or re-generate in Song mode for a full scene plan.";

  // --- performance notes ---
  const perfBits: string[] = [];
  if (o.soundProfile && PROFILE_PERFORMANCE[o.soundProfile]) perfBits.push(PROFILE_PERFORMANCE[o.soundProfile]);
  const extT = o.tracks.find((t) => (t.instrument || "").includes("MIDI out"));
  if (extT) {
    const hw = (extT.instrument || "").replace(/\s*\(MIDI out\)\s*$/, "");
    perfBits.push(`**${extT.track}** carries NO Live instrument — route its MIDI Out to the ${hw} (channel 1) and monitor the hardware's audio. The panel settings are on the track's card above.`);
  }
  const bassT = o.tracks.find((t) => t.part === "bass");
  if (bassT && traits.bass === "acid") perfBits.push(`Ride the **filter cutoff and resonance on ${bassT.track}** — that's the performance. The 303 line doesn't change; your hand makes it sing.`);
  else if (bassT) perfBits.push(`Keep **${bassT.track}** steady — it's the floor, not the show.`);
  const padT = o.tracks.find((t) => t.part === "pad" || t.part === "chords");
  if (padT) perfBits.push(`Use the **Delay/Reverb sends on ${padT.track}** as an instrument — feedback up in the Break, back down before Main 2.`);
  const arpT = o.tracks.find((t) => t.part === "arp");
  if (arpT) perfBits.push(`**${arpT.track}** is your tension dial: filter it down in Intro, wide open by Drop.`);
  perfBits.push("Judge it by ear on the hardware, not by the numbers here — if a section feels long, it is.");

  return {
    idea: ideaBits.join(" "),
    style: STYLE_STORY[o.style] ?? STYLE_STORY.melodicTechno,
    sound: soundBits.join("\n"),
    arrangement,
    performance: perfBits.join(" "),
    sections,
  };
}

export interface SongSheet {
  name: string;
  styleId: string;
  styleLabel: string;
  key: string; // e.g. "A Natural Minor"
  suggestedBpm: number;
  template: string; // song template or "Clip generate"
  sectionPlan?: string; // per-section bar lengths (song mode), e.g. "Intro 8 · Main 32 · …"
  progression: string; // preset label or "Genre pool"
  seed: number;
  createdAt: string;
  moveMode?: boolean; // true → generated for Ableton Move (4 Drift-only tracks)
  soundProfile?: string; // starter-specific instrument identity (SOUND_PROFILES id)
  clipBars?: number; // long evolving clip length in bars (0/undefined = normal)
  starterId?: string; // the starter this song came from (drives the narrative)
  story?: SongStory;  // the producer's note: idea / style / sound / arrangement / performance
  tracks: { part: PartId; track: string; instrument: string; patch?: string; patchName: string; rack?: string; sound: string; macros: string[] }[];
}

export function buildSongSheet(o: {
  seed: number; style: StyleId; root: number; scale: string;
  templateId: string | null; progressionPreset: string; parts: PartId[]; suggestedBpm?: number | null;
  moveMode?: boolean; moveBars16?: boolean; soundProfile?: string; clipBars?: number; starterId?: string;
}): SongSheet {
  const traits = STYLES[o.style] ?? STYLES.melodicTechno;
  const hint = STYLE_HINTS[o.style];
  const bpm = o.suggestedBpm ?? (hint ? Math.round((hint.bpm[0] + hint.bpm[1]) / 2) : 122);
  const preset = PROGRESSION_PRESETS.find((p) => p.id === o.progressionPreset);
  const tplNames: Record<string, string> = {
    short: "Short (4 sections)", standard: "Standard (6 sections)", long: "Long (8 sections)",
    berlin: "Berlin School (additive, 8 sections)", anthem: "Anthem (breakdown-led, 7 sections)",
    sequence: "Sequence (star in all 8 scenes)",
  };
  const guide = SOUND_GUIDE[o.style] ?? {};
  const activeParts = [...ALL_PARTS, "piano" as PartId].filter((p) => o.parts.includes(p));
  // In Move mode the 4 on-device tracks each play a RESOLVED source part (arp→Harmony, etc.);
  // the sheet must name the patch for the part that actually lands on each Move track, and use
  // the Move track names. In Forge mode each part has its own track.
  const moveSlotSource: Partial<Record<MoveSlot, PartId>> = {};
  if (o.moveMode) {
    const slotMap = resolveMoveTracks(activeParts);
    for (const slot of MOVE_SLOTS) if (slotMap[slot]) moveSlotSource[slot] = slotMap[slot]!;
  }
  const rows: SongSheet["tracks"] = [];
  if (o.moveMode) {
    for (const slot of MOVE_SLOTS) {
      const part = moveSlotSource[slot];
      if (!part) continue;
      const recipe = moveRecipe(part, o.soundProfile);
      rows.push({
        part, track: `Move · ${MOVE_SLOT_LABELS[slot]}`,
        instrument: recipe.instrument, patch: recipe.patch, patchName: patchDisplayName(recipe.patch),
        rack: rackFileName(recipe.patch),
        sound: `${recipe.instrument} — ${guide[part] ?? GUIDE_DEFAULT[part]}`,
        macros: recipe.macros,
      });
    }
  } else {
    for (const p of activeParts) {
      const recipe = deviceRecipe(o.style, p, o.soundProfile);
      rows.push({
        part: p, track: `Forge · ${PART_LABELS[p]}`,
        instrument: recipe.instrument, patch: recipe.patch, patchName: patchDisplayName(recipe.patch),
        rack: rackFileName(recipe.patch),
        sound: guide[p] ?? GUIDE_DEFAULT[p],
        macros: recipe.macros,
      });
    }
  }
  return {
    name: songName(o.seed),
    styleId: o.style,
    styleLabel: traits.label,
    key: `${NOTE_NAMES[((o.root % 12) + 12) % 12]} ${o.scale}`,
    suggestedBpm: bpm,
    template: o.templateId ? (tplNames[o.templateId] ?? o.templateId) : "Clip generate (one scene)",
    sectionPlan: o.templateId && SONG_TEMPLATES[o.templateId as SongTemplateId]
      ? SONG_TEMPLATES[o.templateId as SongTemplateId].map((s) => `${s.name} ${capBarsForMove(sectionBars(s.name, o.style), !!o.moveBars16)}`).join(" · ")
      : undefined,
    progression: preset && preset.id !== "auto" ? `${preset.label} — ${preset.mood}` : "Genre pool (auto)",
    seed: o.seed,
    createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    moveMode: !!o.moveMode,
    soundProfile: o.soundProfile,
    clipBars: o.clipBars && o.clipBars >= 16 ? o.clipBars : undefined,
    starterId: o.starterId,
    tracks: rows,
    story: buildSongStory({
      seed: o.seed, style: o.style, key: `${NOTE_NAMES[((o.root % 12) + 12) % 12]} ${o.scale}`,
      bpm, templateId: o.templateId, progressionPreset: o.progressionPreset, parts: activeParts,
      moveMode: o.moveMode, moveBars16: !!o.moveBars16, soundProfile: o.soundProfile, clipBars: o.clipBars,
      starterId: o.starterId, tracks: rows,
    }),
  };
}

// ---------- Device recipes (Move/Forge "Load instruments" button) ----------
// Built-in Live devices only (insertDevice loads default presets; no .adg presets or
// third-party plugins are loadable via the SDK). Each recipe = one instrument plus a
// short audio-effect chain that matches the sound-guide character for that style/part.
export interface DeviceRecipe {
  instrument: string;   // built-in Live instrument name (or a hardware label when external)
  effects: string[];    // built-in Live audio effects, in chain order
  macros: string[];     // character hints: which params to tweak + direction (dial in by hand)
  patch?: string;       // INSTRUMENT_PATCHES id applied to the instrument on load
  external?: string;    // hardware name (e.g. "D MINI"): NO devices are loaded; the track's
                        // MIDI Out goes to the hardware, and macros carry panel settings
}

// sensible per-part defaults, used when a style has no specific override.
// Each recipe: instrument, an audio-effect chain, and macro hints (the parameters
// to tweak by hand — parameter names verified against the Live device reference).
const DEVICE_DEFAULT: Record<PartId, DeviceRecipe> = {
  lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["Filter Freq: open slowly", "Resonance: mid", "Delay: 1/8 dotted", "Reverb: long tail"], patch: "pwmLead" },
  bass: { instrument: "Drift", effects: ["Saturator"], macros: ["Filter Freq: low–mid", "Amp Decay: tight", "Saturator Drive: +", "Sub: mono"], patch: "subBass" },
  pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["Attack: slow", "Release: long", "Chorus: wide", "Reverb: cathedral"], patch: "warmPad" },
  chords: { instrument: "Analog", effects: ["Chorus-Ensemble", "Reverb"], macros: ["Amp Decay: short (stab)", "Filter Freq: mid", "Chorus: light", "sidechain to kick"], patch: "stab" },
  counterMelody: { instrument: "Operator", effects: ["Delay"], macros: ["low velocity", "Delay: 1/4", "sit behind the lead"], patch: "keys" },
  arp: { instrument: "Drift", effects: ["Delay"], macros: ["Amp Decay: pluck", "Filter Freq: rides across sections", "Delay: 30% wet"], patch: "seqPluck" },
  piano: { instrument: "Drift", effects: ["Reverb"], macros: ["felt EP — soft hammers", "Reverb: room, close", "wide velocity: PLAY it"], patch: "feltEP" },
  drums: { instrument: "Drum Rack", effects: ["Compressor"], macros: ["Compressor: bus glue", "kick: long tail", "hats: tight"] },
};

// style-specific character overrides (device chain + macro hints) — informed by the
// classic sound of each genre. Filter cutoff is a HINT, never auto-set (silence risk).
const DEVICE_OVERRIDES: Partial<Record<StyleId, Partial<Record<PartId, DeviceRecipe>>>> = {
  melodicTechno: {
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["Filter Freq: opens across the arc", "Resonance: mid-high", "Delay: 1/8 dotted", "Reverb: big hall (Tale Of Us)"], patch: "moogLead" },
    chords: { instrument: "Analog", effects: ["Compressor", "Reverb"], macros: ["Amp Decay: pluck", "sidechain to kick", "Reverb: lush"], patch: "stab" },
    drums: { instrument: "Drum Rack", effects: ["Compressor", "Saturator"], macros: ["Compressor: pump", "Saturator Drive: warm", "kick: long rumble"] },
  },
  dubTechno: {
    chords: { instrument: "Analog", effects: ["Delay", "Reverb"], macros: ["THE dub chord", "Delay: long feedback", "Reverb: 100% send", "Filter Freq: down"], patch: "wash" },
    pad: { instrument: "Wavetable", effects: ["Auto Filter", "Reverb"], macros: ["Auto Filter: HP ~200 Hz", "Reverb: huge", "wash it out"], patch: "warmPad" },
    drums: { instrument: "Drum Rack", effects: ["Auto Filter", "Compressor"], macros: ["Auto Filter: gentle LP", "Compressor: glue", "dusty 909"] },
  },
  detroit: {
    counterMelody: { instrument: "Collision", effects: ["Delay", "Reverb"], macros: ["wooden mallet (Marimba resonator)", "Delay: 1/8", "Reverb: wide"], patch: "collisionMallet" },
    lead: { instrument: "Operator", effects: ["Chorus-Ensemble", "Delay"], macros: ["FM bell tone", "Chorus: ensemble", "vibrato: subtle", "Delay: 1/8"], patch: "bell" },
    chords: { instrument: "Analog", effects: ["Phaser-Flanger"], macros: ["7th-chord stabs", "Phaser: slow", "swing"], patch: "stab" },
  },
  ambient: {
    counterMelody: { instrument: "Tension", effects: ["Reverb", "Delay"], macros: ["bowed string (Bow exciter)", "Reverb: infinite", "Delay: dotted"], patch: "tensionBow" },
    lead: { instrument: "Wavetable", effects: ["Reverb", "Delay"], macros: ["Attack: slow", "Release: very long", "Reverb: shimmer", "glide on"], patch: "warmPad" },
    pad: { instrument: "Wavetable", effects: ["Reverb", "Delay"], macros: ["Attack: 4s", "wavetable position: slow LFO", "Reverb: cathedral 100%"], patch: "warmPad" },
    chords: { instrument: "Analog", effects: ["Reverb"], macros: ["add9 wash", "Attack: slow", "Reverb: infinite"], patch: "wash" },
  },
  classicSeq: {
    arp: { instrument: "Drift", effects: ["Auto Filter", "Delay"], macros: ["THE sequence", "Auto Filter: ride cutoff whole song", "Resonance: +", "Delay: 1/16"], patch: "seqPluck" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["PWM lead (Tangerine Dream)", "Portamento: on", "Delay: sync"], patch: "pwmLead" },
  },
  acid: {
    bass: { instrument: "Drift", effects: ["Overdrive", "Auto Filter"], macros: ["Filter Cutoff: low–mid", "Resonance: high", "Env Amount: high", "Overdrive Drive: +", "Filter Env: sweep on accents"], patch: "acid303" },
    arp: { instrument: "Drift", effects: ["Auto Filter", "Delay"], macros: ["Resonance: high", "Auto Filter: env-mod", "clicky 16ths"], patch: "acid303" },
    drums: { instrument: "Drum Rack", effects: ["Overdrive", "Compressor"], macros: ["Overdrive: crunch the hats", "Compressor: hard", "909 kit"] },
  },
  trance: {
    lead: { instrument: "Drift", effects: ["Reverb", "Delay"], macros: ["supersaw: detune wide", "sidechain", "Reverb: big", "Delay: throw"], patch: "superLead" },
    pad: { instrument: "Wavetable", effects: ["Reverb"], macros: ["Attack: slow", "uplifting (OB-Xa bloom)", "Reverb: huge"], patch: "obPad" },
  },
  lofi: {
    counterMelody: { instrument: "Electric", effects: ["Chorus-Ensemble", "Delay"], macros: ["Rhodes EP (warm tines)", "Chorus: warm", "Delay: 1/4"], patch: "electricRhodes" },
    chords: { instrument: "Analog", effects: ["Saturator", "Auto Filter"], macros: ["jazzy 7/9 keys", "Saturator: tape", "Auto Filter: LP roll-off", "wow/flutter"], patch: "keys" },
    drums: { instrument: "Drum Rack", effects: ["Auto Filter", "Saturator"], macros: ["Auto Filter: LP (dusty)", "Saturator: tape", "swing", "vinyl feel"] },
  },
  synthwave: {
    lead: { instrument: "Drift", effects: ["Reverb", "Delay"], macros: ["brassy PWM", "gated reverb", "glide", "Delay: sync"], patch: "pwmLead" },
    pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["80s poly (Juno-106)", "Chorus: wide ensemble", "Reverb: gated"], patch: "junoPad" },
  },
  breakbeat: {
    drums: { instrument: "Drum Rack", effects: ["Saturator", "Glue Compressor"], macros: ["chopped break (the star)", "Saturator: grit", "Glue: smash the bus", "crash accents"] },
  },
  deepHouse: {
    counterMelody: { instrument: "Electric", effects: ["Chorus-Ensemble"], macros: ["Rhodes stab (warm tines)", "Chorus: light"], patch: "electricRhodes" },
    chords: { instrument: "Analog", effects: ["Chorus-Ensemble", "Reverb"], macros: ["Rhodes-style 7ths", "swing", "Chorus: warm", "LP filter"], patch: "keys" },
    pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["warm jazzy pad (Juno-106)", "gentle chorus"], patch: "junoPad" },
  },
};

/** Best-effort, SAFE parameter targets to auto-apply per device (normalized 0..1 of
 *  the parameter range). Only additive/dry-wet params that can't silence a track —
 *  filter cutoff/resonance are left as hints. Matched by name alias, defensively. */
export const SAFE_PARAM_TARGETS: { device: string; aliases: string[]; target01: number }[] = [
  { device: "Overdrive", aliases: ["drive"], target01: 0.35 },
  { device: "Overdrive", aliases: ["dry/wet", "dry / wet"], target01: 0.6 },
  { device: "Saturator", aliases: ["drive"], target01: 0.3 },
  { device: "Reverb", aliases: ["dry/wet", "dry / wet"], target01: 0.28 },
  { device: "Delay", aliases: ["dry/wet", "dry / wet"], target01: 0.3 },
  { device: "Chorus-Ensemble", aliases: ["dry/wet", "amount"], target01: 0.4 },
  { device: "Compressor", aliases: ["dry/wet"], target01: 1.0 },
];

// ---------- Instrument character patches ----------
// Classic synth settings translated onto Live's built-in synths. Each ParamMove is
// matched against the device's real parameter list by lowercase alias (first match
// wins); unmatched moves are skipped and logged — never fatal. `item` targets a
// quantized chooser by value-item label (e.g. Voice Mode → "Mono", Osc 1 → "Saw").
// Guardrails: any filter-cutoff move stays ≥ 0.35 of range (audible), and no patch
// zeroes both decay and sustain (can't render a track silent).
export interface ParamMove {
  aliases: string[];      // lowercase name fragments, most specific first; "=x" = exact-only.
                          // Internal Live names (e.g. "filter_resonance") are listed first so
                          // they win by exact match when the SDK exposes internal names.
  target01?: number;      // normalized 0..1 of [min, max] — ONLY for params whose range is a
                          // true unit interval (res, sustain, shape, gains). For Hz/seconds
                          // params the range is LINEAR real units, so use hz/seconds instead.
  hz?: number;            // absolute frequency (Hz), clamped to [min,max] — for Freq/Rate params
  seconds?: number;       // absolute time (s), clamped to [min,max] — for Attack/Decay/Release/Glide
  item?: string;          // for quantized choosers: pick the value item containing this label
  value?: number;         // raw absolute value to set directly (for numeric enums like
                          // Oscillator1_Type: Saw=4; used when the param isn't a string chooser)
}

export const INSTRUMENT_PATCHES: Record<string, ParamMove[]> = {
  // === Drift patches (SDK display names: LP Res / LP Freq / Osc 1 Wave / Env 1 * / Voice Mode) ===
  // TB-303.
  // === Drift patches — authored in REAL units (LP Freq 20–20000 Hz linear; env times
  // 0–60 s linear; Osc 2 Detune ±7 SEMITONES; LP Mod Amt ±1 so t01 0.5 = zero). ===
  acid303: [
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["glide time", "glide"], seconds: 0.06 },   // 303 slide ~60 ms (legato+mono)
    { aliases: ["lp freq"], hz: 420 },                     // squelch base — env opens from here
    { aliases: ["lp res"], target01: 0.78 },
    { aliases: ["lp mod amt 1"], target01: 0.85 },         // ±1 range → +0.70 env→filter
    { aliases: ["env 1 attack"], seconds: 0.001 },
    { aliases: ["env 1 decay"], seconds: 0.35 },
    { aliases: ["env 1 sustain"], target01: 0.85 },        // amp stays; the FILTER env plinks
    { aliases: ["env 1 release"], seconds: 0.08 },
    { aliases: ["env 2 attack"], seconds: 0.001 },         // mod env = the 303 filter plink
    { aliases: ["env 2 decay"], seconds: 0.28 },
    { aliases: ["env 2 sustain"], target01: 0.0 },
  ],
  moogLead: [
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Shark Tooth", value: 2 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5086 },       // ±7 st → +0.12 st (chorus width, NOT an interval)
    { aliases: ["osc 2 gain"], target01: 0.35 },           // 0–1.995 → ≈0.70
    { aliases: ["glide time", "glide"], seconds: 0.09 },
    { aliases: ["lp freq"], hz: 2200 },
    { aliases: ["lp res"], target01: 0.3 },
    { aliases: ["lp mod amt 1"], target01: 0.7 },          // → +0.40
    { aliases: ["env 1 attack"], seconds: 0.005 },
    { aliases: ["env 1 decay"], seconds: 0.4 },
    { aliases: ["env 1 sustain"], target01: 0.55 },
    { aliases: ["env 1 release"], seconds: 0.25 },
  ],
  subBass: [
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Saturated", value: 3 }, // sine+harmonics: reads on small speakers
    { aliases: ["lp freq"], hz: 350 },
    { aliases: ["lp res"], target01: 0.12 },
    { aliases: ["env 1 attack"], seconds: 0.002 },
    { aliases: ["env 1 decay"], seconds: 0.4 },
    { aliases: ["env 1 sustain"], target01: 0.7 },
    { aliases: ["env 1 release"], seconds: 0.12 },         // short — no low-end mud between notes
  ],
  seqPluck: [
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 1 gain"], target01: 0.72 },       // ≈ unity (screenshot: 0.5 ≈ −6 dB, max ≈ +6) — transient voices vanish at default
    { aliases: ["lp freq"], hz: 1400 },
    { aliases: ["lp res"], target01: 0.5 },
    { aliases: ["lp mod amt 1"], target01: 0.75 },         // → +0.50
    { aliases: ["env 1 attack"], seconds: 0.001 },
    { aliases: ["env 1 decay"], seconds: 0.22 },           // Berlin-school pluck
    { aliases: ["env 1 sustain"], target01: 0.05 },
    { aliases: ["env 1 release"], seconds: 0.15 },
  ],
  pwmLead: [
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.45 },          // pulse width (true 0–1)
    { aliases: ["osc 1 shape mod amt", "osc 1 shape mod"], target01: 0.675 }, // ±1 → +0.35 PWM depth
    { aliases: ["lfo rate"], hz: 0.6 },                    // slow PWM movement (0.17–1700 Hz linear!)
    { aliases: ["glide time", "glide"], seconds: 0.12 },
    { aliases: ["lp freq"], hz: 3000 },
    { aliases: ["lp res"], target01: 0.35 },
    { aliases: ["env 1 sustain"], target01: 0.7 },
    { aliases: ["env 1 release"], seconds: 0.3 },
  ],
  superLead: [
    { aliases: ["voice mode"], item: "Unison", value: 3 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.487 },        // −0.18 st against unison spread
    { aliases: ["osc 2 gain"], target01: 0.4 },            // ≈0.80
    { aliases: ["lp freq"], hz: 6000 },
    { aliases: ["lp res"], target01: 0.2 },
    { aliases: ["env 1 attack"], seconds: 0.003 },
    { aliases: ["env 1 sustain"], target01: 0.75 },
    { aliases: ["env 1 release"], seconds: 0.5 },
  ],
  // Drift pad/chord — for Move mode Harmony (Move runs Drift natively) and Drift-only sets.
  driftPad: [
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["lp freq"], hz: 1800 },
    { aliases: ["lp res"], target01: 0.1 },
    { aliases: ["env 1 attack"], seconds: 0.9 },           // blooms within a beat, not 24 s
    { aliases: ["env 1 decay"], seconds: 2.0 },
    { aliases: ["env 1 sustain"], target01: 0.85 },
    { aliases: ["env 1 release"], seconds: 2.8 },
  ],
  // === v0.33 Drift expansion — 10 more voices so starters stop sharing sounds ===
  glassBell: [ // Detroit-style bell: triangle ping, fast decay, wide open filter
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 1 gain"], target01: 0.72 },       // ≈ unity (screenshot: 0.5 ≈ −6 dB, max ≈ +6) — transient voices vanish at default
    { aliases: ["lp freq"], hz: 9000 },
    { aliases: ["lp res"], target01: 0.15 },
    { aliases: ["env 1 attack"], seconds: 0.001 },
    { aliases: ["env 1 decay"], seconds: 0.9 },
    { aliases: ["env 1 sustain"], target01: 0.0 },
    { aliases: ["env 1 release"], seconds: 0.7 },
  ],
  hooverRave: [ // rave stab: saturated + detuned pulse layer, unison, mid growl
    { aliases: ["voice mode"], item: "Unison", value: 3 },
    { aliases: ["osc 1 wave"], item: "Saturated", value: 3 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Rectangle", value: 4 },
    { aliases: ["osc 2 detune"], target01: 0.4786 },       // −0.30 st growl
    { aliases: ["osc 2 gain"], target01: 0.45 },
    { aliases: ["lp freq"], hz: 2600 },
    { aliases: ["lp res"], target01: 0.35 },
    { aliases: ["env 1 attack"], seconds: 0.005 },
    { aliases: ["env 1 decay"], seconds: 0.5 },
    { aliases: ["env 1 sustain"], target01: 0.6 },
    { aliases: ["env 1 release"], seconds: 0.18 },
  ],
  dreamKeys: [ // soft triangle keys — lo-fi / deep-house chords
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["lp freq"], hz: 2500 },
    { aliases: ["lp res"], target01: 0.08 },
    { aliases: ["env 1 attack"], seconds: 0.05 },
    { aliases: ["env 1 decay"], seconds: 1.2 },
    { aliases: ["env 1 sustain"], target01: 0.5 },
    { aliases: ["env 1 release"], seconds: 0.6 },
  ],
  feltEP: [ // felt EP — the Piano part's voice: soft hammers, dark lid, motif-carrier
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Sine", value: 0 },
    { aliases: ["osc 2 octave", "osc 2 oct"], value: -1 },   // sub an octave down = body
    { aliases: ["osc 2 detune"], target01: 0.5 },            // sub sine: detune MUST be 0 (±7 st range → 0.5)
    { aliases: ["osc 2 gain"], target01: 0.32 },             // felt warmth, never dominant
    { aliases: ["lp freq"], hz: 2600 },                      // the felt "lid" — dark but PRESENT in a mix
    { aliases: ["lp res"], target01: 0.06 },
    { aliases: ["lp mod amt 1"], target01: 0.68 },           // hammer brightness rides the mod env
    { aliases: ["env 1 attack"], seconds: 0.003 },           // soft hammer, not a pluck click
    { aliases: ["env 1 decay"], seconds: 2.4 },              // piano-length natural decay
    { aliases: ["env 1 sustain"], target01: 0.34 },          // holds its place under pads
    { aliases: ["env 1 release"], seconds: 0.5 },            // half-pedal tail
    { aliases: ["env 2 attack"], seconds: 0.001 },           // mod env = the hammer transient
    { aliases: ["env 2 decay"], seconds: 0.7 },
    { aliases: ["env 2 sustain"], target01: 0.0 },
  ],
  darkDrone: [ // dub drone pad: two barely-detuned saws under a 600 Hz lid
    { aliases: ["voice mode"], item: "Stereo", value: 2 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5057 },       // +0.08 st slow beat
    { aliases: ["osc 2 gain"], target01: 0.4 },
    { aliases: ["lp freq"], hz: 600 },
    { aliases: ["lp res"], target01: 0.2 },
    { aliases: ["env 1 attack"], seconds: 1.5 },
    { aliases: ["env 1 sustain"], target01: 1.0 },
    { aliases: ["env 1 release"], seconds: 3.5 },
  ],
  plasticPluck: [ // electro pluck: rectangle snap for Detroit electro / funk lines
    { aliases: ["osc 1 wave"], item: "Rectangle", value: 6 },
    { aliases: ["osc 1 gain"], target01: 0.72 },       // ≈ unity (screenshot: 0.5 ≈ −6 dB, max ≈ +6) — transient voices vanish at default
    { aliases: ["lp freq"], hz: 2200 },
    { aliases: ["lp res"], target01: 0.4 },
    { aliases: ["lp mod amt 1"], target01: 0.7 },          // → +0.40 snap
    { aliases: ["env 1 attack"], seconds: 0.001 },
    { aliases: ["env 1 decay"], seconds: 0.12 },
    { aliases: ["env 1 sustain"], target01: 0.0 },
    { aliases: ["env 1 release"], seconds: 0.1 },
  ],
  acidRubber: [ // 303 variant: PULSE core — rubbery squelch, faster plink than acid303
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.3 },
    { aliases: ["glide time", "glide"], seconds: 0.055 },
    { aliases: ["lp freq"], hz: 380 },
    { aliases: ["lp res"], target01: 0.85 },
    { aliases: ["lp mod amt 1"], target01: 0.88 },         // → +0.76
    { aliases: ["env 1 attack"], seconds: 0.001 },
    { aliases: ["env 1 sustain"], target01: 0.85 },
    { aliases: ["env 1 release"], seconds: 0.07 },
    { aliases: ["env 2 attack"], seconds: 0.001 },
    { aliases: ["env 2 decay"], seconds: 0.18 },
    { aliases: ["env 2 sustain"], target01: 0.0 },
  ],
  cosmicSweep: [ // evolving pulse pad: slow PWM drift for cosmic/ambient beds
    { aliases: ["voice mode"], item: "Stereo", value: 2 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.5 },
    { aliases: ["osc 1 shape mod amt", "osc 1 shape mod"], target01: 0.7 }, // ±1 → +0.40
    { aliases: ["lfo rate"], hz: 0.25 },                   // very slow drift
    { aliases: ["lp freq"], hz: 1400 },
    { aliases: ["lp res"], target01: 0.15 },
    { aliases: ["env 1 attack"], seconds: 1.2 },
    { aliases: ["env 1 sustain"], target01: 0.9 },
    { aliases: ["env 1 release"], seconds: 3.0 },
  ],
  funkClav: [ // narrow-pulse clav: tight funk comping (Midnight Funk) — POLY so it can comp chords
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 gain"], target01: 0.72 },       // ≈ unity (screenshot: 0.5 ≈ −6 dB, max ≈ +6) — transient voices vanish at default
    { aliases: ["osc 1 shape"], target01: 0.15 },          // narrow = clavy
    { aliases: ["lp freq"], hz: 3200 },
    { aliases: ["lp res"], target01: 0.55 },
    { aliases: ["env 1 attack"], seconds: 0.001 },
    { aliases: ["env 1 decay"], seconds: 0.18 },
    { aliases: ["env 1 sustain"], target01: 0.1 },
    { aliases: ["env 1 release"], seconds: 0.09 },
  ],
  iceLead: [ // thin icy lead: triangle + high-passed body for ambient/ice starters
    { aliases: ["voice mode"], item: "Stereo", value: 2 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 2 detune"], target01: 0.5143 },       // +0.20 st shimmer
    { aliases: ["osc 2 gain"], target01: 0.3 },
    { aliases: ["hp freq"], hz: 320 },                     // thin the body — icy
    { aliases: ["lp freq"], hz: 8000 },
    { aliases: ["lp res"], target01: 0.2 },
    { aliases: ["env 1 attack"], seconds: 0.03 },
    { aliases: ["env 1 sustain"], target01: 0.65 },
    { aliases: ["env 1 release"], seconds: 1.2 },
  ],
  warmBrass: [ // analog brass swell: saturated + saw layer, slow-ish attack (synthwave)
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saturated", value: 3 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.4893 },       // −0.15 st
    { aliases: ["osc 2 gain"], target01: 0.38 },
    { aliases: ["lp freq"], hz: 1600 },
    { aliases: ["lp res"], target01: 0.18 },
    { aliases: ["lp mod amt 1"], target01: 0.65 },         // → +0.30 brass blossom
    { aliases: ["env 1 attack"], seconds: 0.08 },
    { aliases: ["env 1 decay"], seconds: 0.8 },
    { aliases: ["env 1 sustain"], target01: 0.7 },
    { aliases: ["env 1 release"], seconds: 0.35 },
  ],
  // === v0.36 expansion — 10 more voices, wired into profiles/starters ===
  crystalPluck: [ // trance/emotional pluck: triangle ping with a shimmer tail
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 1 gain"], target01: 0.72 },       // ≈ unity (screenshot: 0.5 ≈ −6 dB, max ≈ +6) — transient voices vanish at default
    { aliases: ["lp freq"], hz: 4500 },
    { aliases: ["lp res"], target01: 0.45 },
    { aliases: ["lp mod amt 1"], target01: 0.725 },        // → +0.45
    { aliases: ["env 1 attack"], seconds: 0.001 },
    { aliases: ["env 1 decay"], seconds: 0.28 },
    { aliases: ["env 1 sustain"], target01: 0.0 },
    { aliases: ["env 1 release"], seconds: 0.4 },
  ],
  deepPulseBass: [ // hollow pulse bass — the dub-techno low end
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.35 },
    { aliases: ["lp freq"], hz: 500 },
    { aliases: ["lp res"], target01: 0.18 },
    { aliases: ["env 1 attack"], seconds: 0.002 },
    { aliases: ["env 1 decay"], seconds: 0.35 },
    { aliases: ["env 1 sustain"], target01: 0.65 },
    { aliases: ["env 1 release"], seconds: 0.1 },
  ],
  reeseBass: [ // jungle/breaks reese: unison + wide-ish twin saws under a low lid
    { aliases: ["voice mode"], item: "Unison", value: 3 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5214 },       // +0.30 st — the reese beat
    { aliases: ["osc 2 gain"], target01: 0.45 },
    { aliases: ["lp freq"], hz: 550 },
    { aliases: ["lp res"], target01: 0.15 },
    { aliases: ["env 1 attack"], seconds: 0.004 },
    { aliases: ["env 1 sustain"], target01: 0.9 },
    { aliases: ["env 1 release"], seconds: 0.15 },
  ],
  houseOrgan: [ // two sines an octave apart, organ gate — disco/deep house
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Sine", value: 0 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Sine", value: 0 },
    { aliases: ["osc 2 oct"], value: 1 },                  // +1 octave drawbar
    { aliases: ["osc 2 gain"], target01: 0.3 },
    { aliases: ["lp freq"], hz: 8000 },
    { aliases: ["lp res"], target01: 0.05 },
    { aliases: ["env 1 attack"], seconds: 0.003 },
    { aliases: ["env 1 sustain"], target01: 1.0 },
    { aliases: ["env 1 release"], seconds: 0.06 },         // organ gate
  ],
  sineWhistle: [ // pure sine lead with glide — floating melodies, sunrise house
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Sine", value: 0 },
    { aliases: ["glide time", "glide"], seconds: 0.08 },
    { aliases: ["lp freq"], hz: 10000 },
    { aliases: ["lp res"], target01: 0.1 },
    { aliases: ["env 1 attack"], seconds: 0.02 },
    { aliases: ["env 1 sustain"], target01: 0.8 },
    { aliases: ["env 1 release"], seconds: 0.25 },
  ],
  tapeStrings: [ // Berlin-school string machine: twin saws, slow bow, mid lid
    { aliases: ["voice mode"], item: "Stereo", value: 2 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5071 },       // +0.10 st ensemble
    { aliases: ["osc 2 gain"], target01: 0.35 },
    { aliases: ["lp freq"], hz: 2800 },
    { aliases: ["lp res"], target01: 0.12 },
    { aliases: ["env 1 attack"], seconds: 0.45 },
    { aliases: ["env 1 decay"], seconds: 1.5 },
    { aliases: ["env 1 sustain"], target01: 0.8 },
    { aliases: ["env 1 release"], seconds: 1.6 },
  ],
  laserZap: [ // techno zap: near-closed filter kicked open by a 90 ms envelope
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 1 gain"], target01: 0.72 },       // ≈ unity (screenshot: 0.5 ≈ −6 dB, max ≈ +6) — transient voices vanish at default
    { aliases: ["lp freq"], hz: 260 },
    { aliases: ["lp res"], target01: 0.7 },
    { aliases: ["lp mod amt 1"], target01: 0.95 },         // → +0.90 zap
    { aliases: ["env 1 attack"], seconds: 0.001 },
    { aliases: ["env 1 decay"], seconds: 0.18 },
    { aliases: ["env 1 sustain"], target01: 0.0 },
    { aliases: ["env 1 release"], seconds: 0.08 },
    { aliases: ["env 2 attack"], seconds: 0.001 },
    { aliases: ["env 2 decay"], seconds: 0.09 },
    { aliases: ["env 2 sustain"], target01: 0.0 },
  ],
  glassChoir: [ // airy twin-triangle choir pad, thinned with HP — trance breakdowns, ice
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 2 detune"], target01: 0.5086 },       // +0.12 st
    { aliases: ["osc 2 gain"], target01: 0.3 },
    { aliases: ["hp freq"], hz: 200 },
    { aliases: ["lp freq"], hz: 6000 },
    { aliases: ["lp res"], target01: 0.1 },
    { aliases: ["env 1 attack"], seconds: 1.4 },
    { aliases: ["env 1 sustain"], target01: 0.9 },
    { aliases: ["env 1 release"], seconds: 2.4 },
  ],
  industrialStab: [ // corroded saturated stab for warehouse/industrial sequence work
    { aliases: ["voice mode"], item: "Poly", value: 0 }, // POLY: it comps chord stabs
    { aliases: ["osc 1 wave"], item: "Saturated", value: 3 },
    { aliases: ["lp freq"], hz: 1200 },
    { aliases: ["lp res"], target01: 0.45 },
    { aliases: ["lp mod amt 1"], target01: 0.75 },         // → +0.50
    { aliases: ["env 1 attack"], seconds: 0.001 },
    { aliases: ["env 1 decay"], seconds: 0.3 },
    { aliases: ["env 1 sustain"], target01: 0.2 },
    { aliases: ["env 1 release"], seconds: 0.12 },
  ],
  octaveRunner: [ // tight pulse bass for synthwave octave lines
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.4 },
    { aliases: ["lp freq"], hz: 900 },
    { aliases: ["lp res"], target01: 0.3 },
    { aliases: ["env 1 attack"], seconds: 0.001 },
    { aliases: ["env 1 decay"], seconds: 0.25 },
    { aliases: ["env 1 sustain"], target01: 0.4 },
    { aliases: ["env 1 release"], seconds: 0.08 },
  ],
  // === v0.44 additions ===
  dubChordStab: [ // THE dub chord as a Drift voice: dark, saturated, short bloom, poly
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saturated", value: 3 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.52 },      // +0.28 st chorus width
    { aliases: ["osc 2 gain"], target01: 0.35 },
    { aliases: ["lp freq"], hz: 750 },                   // dark, opens with velocity/filter rides
    { aliases: ["lp res"], target01: 0.35 },
    { aliases: ["env 1 attack"], seconds: 0.004 },
    { aliases: ["env 1 decay"], seconds: 0.5 },
    { aliases: ["env 1 sustain"], target01: 0.25 },
    { aliases: ["env 1 release"], seconds: 0.45 },       // tail feeds the delay/reverb sends
  ],
  cathedralOrgan: [ // pulse + octave-up sine: hollow organ for house/ambient chords, poly
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.5 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Sine", value: 0 },
    { aliases: ["osc 2 oct"], value: 1 },                // the octave drawbar
    { aliases: ["osc 2 gain"], target01: 0.4 },
    { aliases: ["lp freq"], hz: 2600 },
    { aliases: ["env 1 attack"], seconds: 0.02 },
    { aliases: ["env 1 sustain"], target01: 0.9 },
    { aliases: ["env 1 release"], seconds: 0.25 },
  ],
  duneFlute: [ // breathy triangle+noise lead: airy, melancholic, poly for gentle doubles
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["noise on"], target01: 1 },
    { aliases: ["noise level"], target01: 0.18 },        // the breath
    { aliases: ["lp freq"], hz: 3200 },
    { aliases: ["env 1 attack"], seconds: 0.06 },        // soft speak
    { aliases: ["env 1 sustain"], target01: 0.8 },
    { aliases: ["env 1 release"], seconds: 0.3 },
    { aliases: ["lfo rate"], hz: 5.2 },                  // gentle vibrato
    { aliases: ["lfo amount"], target01: 0.06 },
  ],
  wireLead: [ // shark-tooth mono lead: thin, wiry, cuts through dub fog without width
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Shark Tooth", value: 2 },
    { aliases: ["lp freq"], hz: 1800 },
    { aliases: ["lp res"], target01: 0.45 },
    { aliases: ["env 1 attack"], seconds: 0.002 },
    { aliases: ["env 1 decay"], seconds: 0.4 },
    { aliases: ["env 1 sustain"], target01: 0.6 },
    { aliases: ["env 1 release"], seconds: 0.12 },
  ],
  neonPluck: [ // bright saw pluck with LFO shimmer: trance/synthwave sequences, poly
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 1 gain"], target01: 0.72 },         // transient voice: needs ~unity
    { aliases: ["lp freq"], hz: 2400 },
    { aliases: ["lp res"], target01: 0.3 },
    { aliases: ["env 1 attack"], seconds: 0.001 },
    { aliases: ["env 1 decay"], seconds: 0.22 },
    { aliases: ["env 1 sustain"], target01: 0.0 },
    { aliases: ["env 1 release"], seconds: 0.1 },
    { aliases: ["lfo rate"], hz: 0.35 },                 // slow neon flicker on the filter
    { aliases: ["lfo amount"], target01: 0.12 },
  ],
  abyssBass: [ // pure sine sub with a saturated whisper: the deepest floor, mono
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Sine", value: 0 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saturated", value: 2 },
    { aliases: ["osc 2 gain"], target01: 0.15 },         // just a whisper of harmonics
    { aliases: ["osc 2 detune"], target01: 0.5 },        // sub layers stay at 0 detune
    { aliases: ["lp freq"], hz: 300 },
    { aliases: ["env 1 attack"], seconds: 0.002 },
    { aliases: ["env 1 decay"], seconds: 0.3 },
    { aliases: ["env 1 sustain"], target01: 0.7 },
    { aliases: ["env 1 release"], seconds: 0.06 },
  ],
  rubberBand: [ // rectangle bounce bass: short, elastic, electro-funk pocket, mono
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Rectangle", value: 6 },
    { aliases: ["lp freq"], hz: 650 },
    { aliases: ["lp res"], target01: 0.5 },
    { aliases: ["env 1 attack"], seconds: 0.001 },
    { aliases: ["env 1 decay"], seconds: 0.16 },         // the bounce
    { aliases: ["env 1 sustain"], target01: 0.1 },
    { aliases: ["env 1 release"], seconds: 0.05 },
  ],
  // === v0.63: classic-synth studies =========================================================
  // Drift is a 2-oscillator synth with one multimode filter, so these are STUDIES of the
  // originals' behaviour, not emulations: what made each machine recognisable, expressed in
  // Drift's terms. Filter Type is the main untouched lever — II for the steeper/darker ladder
  // character (Moog, Prophet Rev3, SH/Pro-One), I for the gentler 2-pole voices (Oberheim SEM,
  // CS-80, Jupiter, string machines). If a patch sounds inverted, that switch is the first thing
  // to flip — it's the one judgement here I can't verify by ear.
  modelDBass: [ // Minimoog Model D: three oscs in reality; Drift gets two saws, one an octave down.
    { aliases: ["voice mode"], item: "Mono", value: 1 },      // the Model D is monophonic by nature
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 oct"], value: -1 },                    // the classic "osc 2 an octave below"
    // A real Model D detunes this oscillator and that beating IS the fatness — but an octave-down
    // layer beating in a techno low end is mud on a big system. Weight here, fatness in the lead.
    { aliases: ["osc 2 detune"], target01: 0.5 },
    { aliases: ["osc 2 gain"], target01: 0.62 },
    { aliases: ["lp type"], item: "II", value: 1 },           // ladder-ish: steep and warm
    { aliases: ["lp freq"], hz: 380 },
    { aliases: ["lp res"], target01: 0.32 },                  // Moog res thickens before it whistles
    { aliases: ["lp mod amt 1"], target01: 0.55 },
    { aliases: ["env 1 attack"], seconds: 0.002 },
    { aliases: ["env 1 decay"], seconds: 0.28 },
    { aliases: ["env 1 sustain"], target01: 0.55 },
    { aliases: ["env 1 release"], seconds: 0.1 },
    { aliases: ["env 2 attack"], seconds: 0.001 },
    { aliases: ["env 2 decay"], seconds: 0.35 },
    { aliases: ["env 2 sustain"], target01: 0 },
    { aliases: ["glide time"], seconds: 0.04 },
  ],
  modelDLead: [ // the same machine pushed up: brighter, more res, longer glide — the Berlin lead
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5143 },          // +0.2 st beating = the fatness
    { aliases: ["osc 2 gain"], target01: 0.7 },
    { aliases: ["lp type"], item: "II", value: 1 },
    { aliases: ["lp freq"], hz: 1200 },
    { aliases: ["lp res"], target01: 0.42 },
    { aliases: ["lp mod amt 1"], target01: 0.45 },
    { aliases: ["env 1 attack"], seconds: 0.004 },
    { aliases: ["env 1 decay"], seconds: 0.5 },
    { aliases: ["env 1 sustain"], target01: 0.7 },
    { aliases: ["env 1 release"], seconds: 0.18 },
    { aliases: ["glide time"], seconds: 0.09 },
  ],
  obxBrass: [ // Oberheim OB-X: two saws through a 2-pole SEM filter. THE 80s brass stab.
    { aliases: ["voice mode"], item: "Poly", value: 0 },      // brass is chordal — Poly (8 on Move)
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5129 },          // +0.18 st
    { aliases: ["osc 2 gain"], target01: 0.7 },
    { aliases: ["lp type"], item: "I", value: 0 },            // 2-pole SEM: gentler slope, more air
    { aliases: ["lp freq"], hz: 1400 },
    { aliases: ["lp res"], target01: 0.22 },
    { aliases: ["lp mod amt 1"], target01: 0.6 },             // the brass "blat" is the filter env
    { aliases: ["env 1 attack"], seconds: 0.03 },
    { aliases: ["env 1 decay"], seconds: 0.5 },
    { aliases: ["env 1 sustain"], target01: 0.75 },
    { aliases: ["env 1 release"], seconds: 0.25 },
    { aliases: ["env 2 attack"], seconds: 0.02 },
    { aliases: ["env 2 decay"], seconds: 0.4 },
    { aliases: ["env 2 sustain"], target01: 0.2 },
  ],
  prophet5Pad: [ // Prophet-5 Rev3: Curtis 4-pole, saw + a squarer second osc, slow bloom
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Rectangle", value: 4 }, // osc 2 has no Pulse — Rectangle is the stand-in
    { aliases: ["osc 2 detune"], target01: 0.5179 },          // +0.25 st
    { aliases: ["osc 2 gain"], target01: 0.6 },
    { aliases: ["lp type"], item: "II", value: 1 },
    { aliases: ["lp freq"], hz: 1100 },
    { aliases: ["lp res"], target01: 0.28 },
    { aliases: ["env 1 attack"], seconds: 0.6 },
    { aliases: ["env 1 decay"], seconds: 1.2 },
    { aliases: ["env 1 sustain"], target01: 0.8 },
    { aliases: ["env 1 release"], seconds: 1.8 },
    { aliases: ["lfo rate"], hz: 4.6 },
    { aliases: ["lfo amount"], target01: 0.04 },              // barely-there vibrato
  ],
  juno106Pad: [ // Juno-106: ONE pulse DCO + a square sub, an HPF, and that chorus doing the work
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.5 },
    { aliases: ["osc 1 shape mod amt"], target01: 0.25 },     // slow PWM — the Juno shimmer
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Rectangle", value: 4 },
    { aliases: ["osc 2 oct"], value: -1 },                    // the sub
    { aliases: ["osc 2 detune"], target01: 0.5 },             // sub NEVER detunes — it would beat
    { aliases: ["osc 2 gain"], target01: 0.45 },
    { aliases: ["hp freq"], hz: 120 },                        // the Juno's HPF thins the low end
    { aliases: ["lp freq"], hz: 2200 },
    { aliases: ["lp res"], target01: 0.2 },
    { aliases: ["env 1 attack"], seconds: 0.5 },
    { aliases: ["env 1 decay"], seconds: 1.0 },
    { aliases: ["env 1 sustain"], target01: 0.85 },
    { aliases: ["env 1 release"], seconds: 1.5 },
    { aliases: ["lfo rate"], hz: 0.45 },
    { aliases: ["lfo amount"], target01: 0.12 },
  ],
  sh101Bass: [ // SH-101: saw + square sub, one filter, no nonsense. Electro/acid bass.
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Rectangle", value: 4 },
    { aliases: ["osc 2 oct"], value: -1 },
    { aliases: ["osc 2 detune"], target01: 0.5 },             // sub stays dead centre
    { aliases: ["osc 2 gain"], target01: 0.5 },
    { aliases: ["lp type"], item: "II", value: 1 },
    { aliases: ["lp freq"], hz: 520 },
    { aliases: ["lp res"], target01: 0.45 },
    { aliases: ["lp mod amt 1"], target01: 0.7 },
    { aliases: ["env 1 attack"], seconds: 0.001 },
    { aliases: ["env 1 decay"], seconds: 0.18 },
    { aliases: ["env 1 sustain"], target01: 0.25 },
    { aliases: ["env 1 release"], seconds: 0.06 },
    { aliases: ["env 2 attack"], seconds: 0.001 },
    { aliases: ["env 2 decay"], seconds: 0.22 },
    { aliases: ["env 2 sustain"], target01: 0 },
    { aliases: ["glide time"], seconds: 0.02 },
  ],
  cs80Brass: [ // Yamaha CS-80: HP+LP per voice, slow swell, ever-present vibrato. Vangelis.
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5157 },          // +0.22 st
    { aliases: ["osc 2 gain"], target01: 0.75 },
    { aliases: ["hp freq"], hz: 90 },                         // the CS-80's high-pass stage
    { aliases: ["lp type"], item: "I", value: 0 },
    { aliases: ["lp freq"], hz: 1600 },
    { aliases: ["lp res"], target01: 0.18 },
    { aliases: ["env 1 attack"], seconds: 0.09 },             // the swell, not a stab
    { aliases: ["env 1 decay"], seconds: 0.8 },
    { aliases: ["env 1 sustain"], target01: 0.8 },
    { aliases: ["env 1 release"], seconds: 0.5 },
    { aliases: ["lfo rate"], hz: 5.5 },
    { aliases: ["lfo amount"], target01: 0.05 },
  ],
  jupiter8Pad: [ // Jupiter-8: two detuned saws, 2-pole option, unhurried. Lush by design.
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5214 },          // +0.3 st — wide but still one note
    { aliases: ["osc 2 gain"], target01: 0.8 },
    { aliases: ["lp type"], item: "I", value: 0 },
    { aliases: ["lp freq"], hz: 1800 },
    { aliases: ["lp res"], target01: 0.25 },
    { aliases: ["env 1 attack"], seconds: 0.8 },
    { aliases: ["env 1 decay"], seconds: 1.5 },
    { aliases: ["env 1 sustain"], target01: 0.85 },
    { aliases: ["env 1 release"], seconds: 2.2 },
  ],
  proOneLead: [ // Sequential Pro-One: pulse + saw, aggressive filter env, glide. The mono lead.
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.35 },             // narrow pulse = hollow and reedy
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5107 },
    { aliases: ["osc 2 gain"], target01: 0.65 },
    { aliases: ["lp type"], item: "II", value: 1 },
    { aliases: ["lp freq"], hz: 1400 },
    { aliases: ["lp res"], target01: 0.5 },
    { aliases: ["lp mod amt 1"], target01: 0.65 },
    { aliases: ["env 1 attack"], seconds: 0.005 },
    { aliases: ["env 1 decay"], seconds: 0.4 },
    { aliases: ["env 1 sustain"], target01: 0.6 },
    { aliases: ["env 1 release"], seconds: 0.15 },
    { aliases: ["glide time"], seconds: 0.06 },
  ],
  eminentStrings: [ // Eminent 310 — Jarre's Oxygène strings. The machine is plain; the PHASER is the sound.
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5229 },          // +0.32 st ensemble shimmer
    { aliases: ["osc 2 gain"], target01: 0.9 },
    { aliases: ["lp type"], item: "I", value: 0 },
    { aliases: ["lp freq"], hz: 2600 },
    { aliases: ["lp res"], target01: 0.1 },                   // string machines barely filter
    { aliases: ["env 1 attack"], seconds: 0.35 },
    { aliases: ["env 1 decay"], seconds: 1.0 },
    { aliases: ["env 1 sustain"], target01: 0.9 },
    { aliases: ["env 1 release"], seconds: 1.2 },
  ],
  ms20Lead: [ // Korg MS-20: the filter screams. Saturated osc, resonance near the edge.
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Saturated", value: 3 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Rectangle", value: 4 },
    { aliases: ["osc 2 detune"], target01: 0.5071 },
    { aliases: ["osc 2 gain"], target01: 0.55 },
    { aliases: ["lp type"], item: "II", value: 1 },
    { aliases: ["lp freq"], hz: 900 },
    { aliases: ["lp res"], target01: 0.75 },                  // on the edge of self-oscillation
    { aliases: ["lp mod amt 1"], target01: 0.8 },
    { aliases: ["env 1 attack"], seconds: 0.002 },
    { aliases: ["env 1 decay"], seconds: 0.3 },
    { aliases: ["env 1 sustain"], target01: 0.5 },
    { aliases: ["env 1 release"], seconds: 0.1 },
    { aliases: ["glide time"], seconds: 0.03 },
  ],
  taurusBass: [ // Moog Taurus pedals: almost no harmonics, all weight. Dub/Berlin floor.
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 1 oct"], value: -1 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Sine", value: 0 },
    { aliases: ["osc 2 oct"], value: -1 },
    { aliases: ["osc 2 detune"], target01: 0.5 },             // sub layer: zero detune
    { aliases: ["osc 2 gain"], target01: 0.7 },
    { aliases: ["lp type"], item: "II", value: 1 },
    { aliases: ["lp freq"], hz: 180 },                        // almost everything removed
    { aliases: ["lp res"], target01: 0.2 },
    { aliases: ["env 1 attack"], seconds: 0.005 },
    { aliases: ["env 1 decay"], seconds: 0.6 },
    { aliases: ["env 1 sustain"], target01: 0.8 },
    { aliases: ["env 1 release"], seconds: 0.3 },
    { aliases: ["glide time"], seconds: 0.05 },
  ],
  staticHaze: [ // noise-forward airy pad: tape hiss turned into weather, stereo
    { aliases: ["voice mode"], item: "Stereo", value: 2 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 1 gain"], target01: 0.4 },
    { aliases: ["noise on"], target01: 1 },
    { aliases: ["noise level"], target01: 0.45 },        // the haze IS the sound
    { aliases: ["lp freq"], hz: 1400 },
    { aliases: ["env 1 attack"], seconds: 1.2 },
    { aliases: ["env 1 sustain"], target01: 0.85 },
    { aliases: ["env 1 release"], seconds: 2.5 },
  ],
  // === Wavetable patches (Flt 1 Freq / Flt 1 Res / Amp Attack..Release) ===
  junoPad: [
    { aliases: ["amp attack"], target01: 0.3 },
    { aliases: ["amp sustain"], target01: 0.85 },
    { aliases: ["amp release"], target01: 0.55 },
    { aliases: ["flt 1 freq"], target01: 0.6 },
    { aliases: ["flt 1 res"], target01: 0.12 },
  ],
  obPad: [
    { aliases: ["amp attack"], target01: 0.5 },
    { aliases: ["amp sustain"], target01: 0.9 },
    { aliases: ["amp release"], target01: 0.65 },
    { aliases: ["flt 1 freq"], target01: 0.68 },
    { aliases: ["flt 1 res"], target01: 0.2 },
  ],
  warmPad: [
    { aliases: ["amp attack"], target01: 0.45 },
    { aliases: ["amp sustain"], target01: 0.8 },
    { aliases: ["amp release"], target01: 0.6 },
    { aliases: ["flt 1 freq"], target01: 0.65 },
  ],
  // === Analog patches (F1 Freq / F1 Resonance / AEG1 Attack..Rel) ===
  stab: [
    { aliases: ["aeg1 attack"], target01: 0.02 },
    { aliases: ["aeg1 decay"], target01: 0.35 },
    { aliases: ["aeg1 sustain"], target01: 0.3 },
    { aliases: ["aeg1 rel"], target01: 0.25 },
    { aliases: ["f1 freq"], target01: 0.55 },
    { aliases: ["f1 resonance"], target01: 0.25 },
  ],
  wash: [
    { aliases: ["aeg1 attack"], target01: 0.6 },
    { aliases: ["aeg1 sustain"], target01: 0.85 },
    { aliases: ["aeg1 rel"], target01: 0.75 },
  ],
  // === keys: applied on BOTH Analog and Operator, so it lists names for each ===
  keys: [
    { aliases: ["aeg1 attack", "ae attack"], target01: 0.08 },
    { aliases: ["aeg1 decay", "ae decay"], target01: 0.5 },
    { aliases: ["aeg1 sustain", "ae sustain"], target01: 0.45 },
    { aliases: ["tone"], target01: 0.4 },
  ],
  // === Operator patch (Ae Attack..Release / Filter Freq / Filter Res / Tone) ===
  bell: [
    { aliases: ["ae attack"], target01: 0.02 },
    { aliases: ["ae decay"], target01: 0.6 },
    { aliases: ["ae sustain"], target01: 0.25 },
    { aliases: ["ae release"], target01: 0.5 },
    { aliases: ["tone"], target01: 0.6 },
    { aliases: ["filter freq"], target01: 0.6 },
  ],
  // === Physical-model instruments (Collision/Tension/Electric) — no filter/ADSR; these
  //     select the resonator/exciter voice and a couple of tone controls, real names only. ===
  // Collision: bright wooden mallet for Detroit counter-melodies.
  collisionMallet: [
    { aliases: ["res 1 type"], item: "Marimba", value: 1 },
    { aliases: ["res 1 decay"], target01: 0.55 },
    { aliases: ["mallet stiffness"], target01: 0.62 },
    { aliases: ["res 1 brightness"], target01: 0.62 },
  ],
  // Tension: bowed sustained string for Ambient counter-melodies.
  tensionBow: [
    { aliases: ["exciter type"], item: "Bow", value: 0 },
    { aliases: ["filter freq"], target01: 0.72 },
    { aliases: ["string decay"], target01: 0.8 },
  ],
  // Electric: warm Rhodes EP for Lo-Fi / Deep House counter-melodies.
  electricRhodes: [
    { aliases: ["f tine vol"], target01: 0.45 },
    { aliases: ["f tine color"], target01: 0.5 },
    { aliases: ["damp tone"], target01: 0.5 },
  ],
};

/** The instrument + effect chain to load for a given style/part. */
export function deviceRecipe(style: StyleId, part: PartId, soundProfile?: string): DeviceRecipe {
  // A starter's soundProfile can override specific parts to give it a recognizable identity
  // (e.g. a Jarre-style air lead, a dub-heavy chord). Falls back to the style recipe per part.
  if (soundProfile && SOUND_PROFILES[soundProfile]?.[part]) return SOUND_PROFILES[soundProfile][part]!;
  return DEVICE_OVERRIDES[style]?.[part] ?? DEVICE_DEFAULT[part];
}

/** Starter-specific instrument identities. Each profile overrides just the parts that give it
 *  character; everything else falls through to the style recipe. Patches reference the same
 *  real-name INSTRUMENT_PATCHES table, so they load reliably. */
const SOUND_PROFILES: Record<string, Partial<Record<PartId, DeviceRecipe>>> = {
  // ---- Waldorf Protein showcase profiles (v0.68) --------------------------------
  // ONE part per song goes to the Protein (external — no device loaded; MIDI Out to the
  // hardware). Protein pots have no printed scale, so values are % of knob travel /
  // display values; wavetables are named by CHARACTER — scroll and pick by ear.
  proteinSweep: {
    pad: { instrument: "Waldorf Protein (MIDI out)", effects: [], external: "Protein", patch: undefined,
      macros: ["Layer: single", "Osc 1: a resonant-sweep wavetable (classic MW1 territory)", "Osc 2: same table, Wave offset +15%", "Wave position: start 20%", "Env 3 → Wave: +60%, slow attack ~2s", "Cutoff: 55%, Resonance: 20%", "Env Amount: +25%", "FX: reverb, Amount 40%", "PERFORM: the Wave knob — the sweep IS the pad"] },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sparse fragments above the sweeping table"], patch: "modelDLead" },
  },
  proteinBass: {
    bass: { instrument: "Waldorf Protein (MIDI out)", effects: [], external: "Protein", patch: undefined,
      macros: ["Layer: single", "Osc 1: a hollow/formant table, low position ~10%", "Osc 2: OFF (or -12 sub, table pos 0%)", "Play octave 1–2: the ASIC aliasing IS the warmth", "Cutoff: 35%, Cutoff Track: 50%", "Resonance: 15%", "Env Amount: +20%, fast decay", "Dirt: 10% (subtle)", "PERFORM: Cutoff and nothing else — Huckaby discipline"] },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["rare bell fragments, deep-house sparse"], patch: "glassBell" },
  },
  proteinSpeech: {
    lead: { instrument: "Waldorf Protein (MIDI out)", effects: [], external: "Protein", patch: undefined,
      macros: ["Layer: single", "Osc 1: a SPEECH wavetable", "Osc 2: algorithmic table, quiet (-30%)", "Wave position: 30% — vowels live 20–70%", "LFO 1 → Wave: slow triangle, ±20%", "Cutoff: 65%, Resonance: 30%", "Env: medium attack 80ms, long release", "FX: delay, Amount 35%", "PERFORM: Wave position by hand = making it talk"] },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["reese-adjacent weight under the voice"], patch: "subBass" },
  },
  proteinRobin: {
    chords: { instrument: "Waldorf Protein (MIDI out)", effects: [], external: "Protein", patch: undefined,
      macros: ["Multi: 4 LAYERS in ROUND ROBIN — the showcase", "Layer 1: mallet table · Layer 2: formant · Layer 3: glass · Layer 4: soft brass", "Use Load Layer to pull each from factory presets", "Match Cutoff ~50% + envelope shapes across layers", "Every stab lands on the NEXT layer — the chord shimmers between four faces", "Match layer LEVELS by ear (solo each; equal loudness)", "FX: shared reverb 30%", "PERFORM: nothing — let the round robin do it; that's the point"] },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["emotional Detroit fragments over the rotation"], patch: "modelDLead" },
  },
  proteinFlavor: {
    pad: { instrument: "Waldorf Protein (MIDI out)", effects: [], external: "Protein", patch: undefined,
      macros: ["Layer: 2 layers, same warm table, detuned ±7 cents", "Wave position: 45%, no wave modulation — stillness", "Cutoff: 45%, slow attack ~3s, long release", "FLAVOR: start 0% — the knob is the performance", "Filter de-calibration: enable (aged-hardware drift)", "FX: reverb, Amount 55%", "Save the pristine version to a slot FIRST — you will want to come home", "PERFORM: Flavor 0 → 70% across the song — the patch grows old in real time"] },
    lead: { instrument: "Drift", effects: ["Reverb", "Delay"], macros: ["distant bowed echoes"], patch: "glassBell" },
  },
  proteinDirt: {
    chords: { instrument: "Waldorf Protein (MIDI out)", effects: [], external: "Protein", patch: undefined,
      macros: ["Layer: single", "Osc 1: e-piano/mallet-ish table, position 35%", "DIRT: type ring (osc1×osc2), amount 20% — the showcase", "Osc 2: tuned +7 semitones (the ring interval)", "Cutoff: 40% — dusty lid", "Env: soft attack 30ms, medium decay", "FX: modulation (chorus-ish), Amount 30%", "Velocity → Wave: +15% (harder = brighter dust)", "PERFORM: Dirt amount 10–40% per section; Osc 2 tune = re-voicing the rust"] },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["hazy topline, behind the beat"], patch: "pwmLead" },
  },
  proteinGlass: {
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["anthem fragments over the glass"], patch: "pwmLead" },
    arp: { instrument: "Waldorf Protein (MIDI out)", effects: [], external: "Protein", patch: undefined,
      macros: ["Layer: single", "Osc 1: a GLASSY PPG-style table, position 60%", "Osc 2: same family, +12 semitones, -20% level", "Velocity → Wave: +25% — the sequence glitters unevenly", "Cutoff: 70%, Resonance: 25%", "Env: instant attack, decay ~250ms, no sustain", "Cutoff Track: 70% (highs ring brighter)", "FX: delay 1/16, Amount 40%", "PERFORM: Cutoff rides the arc; at the Drop push Resonance to 45%"] },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["trance floor, root-fifth pump"], patch: "subBass" },
  },
  dminiEmphasis: {
    lead: { instrument: "Behringer D MINI (MIDI out)", effects: [], external: "D MINI", patch: undefined,
      macros: ["Mode (10): Octave", "Detune (11): 5", "Waveform (12): Saw", "Scale (13): 8'", "Noise Level (14): 0", "Cutoff (15): 3", "Emphasis (16): 8 — the showcase: self-oscillation edge", "Contour (17): 5", "Filter Mod (18): OFF", "Attack (24): 0", "Decay (25): 2.5", "Sustain (26): 0", "Contour Decay (23): OFF", "Osc Mod (27): OFF", "Trigger Sync: on", "PERFORM: Emphasis 6 ↔ 9 is the melody; Cutoff whistles the pitch"] },
    bass: { instrument: "Drift", effects: ["Saturator", "Auto Filter"], macros: ["the 303 keeps the floor while the D MINI screams above"], patch: "acidRubber" },
  },
  dminiAcidBass: {
    bass: { instrument: "Behringer D MINI (MIDI out)", effects: [], external: "D MINI", patch: undefined,
      macros: ["Mode (10): Unison", "Detune (11): 5 — dead centre, no beat", "Waveform (12): Saw", "Scale (13): 16'", "Noise Level (14): 0", "Cutoff (15): 2 — closed to start", "Emphasis (16): 6.5", "Contour (17): 7 — the squelch", "Filter Mod (18): OFF", "Attack (24): 0", "Decay (25): 2 — short, snappy", "Sustain (26): 0", "Contour Decay (23): OFF", "Osc Mod (27): OFF", "Trigger Sync: on", "PERFORM: Cutoff 2 → 6 and back; Emphasis 6.5 → 8 at the Drop"] },
    arp: { instrument: "Drift", effects: ["Delay"], macros: ["thin sixteenth stabs above the growl — never busy"], patch: "seqPluck" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["rare fragments"], patch: "modelDLead" },
  },
  dminiFilterMod: {
    lead: { instrument: "Behringer D MINI (MIDI out)", effects: [], external: "D MINI", patch: undefined,
      macros: ["Mode (10): Unison", "Detune (11): 5.5", "Waveform (12): Square", "Scale (13): 8'", "Noise Level (14): 0", "Cutoff (15): 4", "Emphasis (16): 5", "Contour (17): 4", "Filter Mod (18): ON — the showcase: LFO on the ladder", "LFO Rate: 3 — sync-ish to 1/8 at 130", "LFO Wave: square", "Mod Depth (28): 6", "Attack (24): 0", "Decay (25): 3", "Sustain (26): 4", "Contour Decay (23): OFF", "PERFORM: LFO Rate is your instrument — 1/8 → 1/16 → free-run"] },
    bass: { instrument: "Drift", effects: ["Saturator", "Auto Filter"], macros: ["straight 303 floor under the wobble"], patch: "acidRubber" },
  },
  // ---- D MINI × SEQUENCE STAR (v0.73): the arp IS the D MINI, in every scene ------------
  dminiSeqAcid: {
    arp: { instrument: "Behringer D MINI (MIDI out)", effects: [], external: "D MINI", patch: undefined,
      macros: ["Mode (10): Unison", "Detune (11): 5 — dead centre", "Waveform (12): Saw", "Scale (13): 8'", "Noise Level (14): 0", "Cutoff (15): 2.5 — start closed", "Emphasis (16): 6.5 — the squelch edge", "Contour (17): 7", "Filter Mod (18): OFF", "Attack (24): 0", "Decay (25): 2 — snappy", "Sustain (26): 0", "Contour Decay (23): OFF", "Osc Mod (27): OFF", "Trigger Sync: on", "PERFORM: Cutoff is the arrangement — 2.5 → 6.5 across the song; Emphasis to 8 for the Drop"] },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["clean sub, root only — never competes with the sequence"], patch: "subBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["rare answers in the gaps"], patch: "modelDLead" },
    chords: { instrument: "Drift", effects: ["Reverb"], macros: ["stabs on the offs, filtered dark"], patch: "dubChordStab" },
  },
  dminiSeqBrikha: {
    arp: { instrument: "Behringer D MINI (MIDI out)", effects: [], external: "D MINI", patch: undefined,
      macros: ["Mode (10): Octave", "Detune (11): 5.3 — a breath of beat", "Waveform (12): Saw", "Scale (13): 8'", "Noise Level (14): 0", "Cutoff (15): 3.5", "Emphasis (16): 3 — round, never squelchy", "Contour (17): 4", "Filter Mod (18): OFF", "Attack (24): 0", "Decay (25): 3.5 — notes ring into each other", "Sustain (26): 2", "Contour Decay (23): OFF", "Osc Mod (27): OFF", "Trigger Sync: off — legato steps overlap", "PERFORM: Cutoff 3.5 → 6 in long arcs; Decay (25) is your second dial — longer = more melody, shorter = more machine"] },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["warm, mid-forward — the emotional floor"], patch: "modelDBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["the melodic answer — Brikha's second voice"], patch: "modelDLead" },
    chords: { instrument: "Drift", effects: ["Reverb"], macros: ["soulful sustained sevenths, wide"], patch: "dreamKeys" },
    counterMelody: { instrument: "Drift", effects: ["Delay"], macros: ["a shadow of the sequence, an octave up, quiet"], patch: "pwmLead" },
  },
  // ---- Behringer D MINI showcase profiles (v0.67) -------------------------------
  // ONE part per song goes out to the hardware (external — no device is loaded on that
  // track; route its MIDI Out to the D MINI). Macros are panel settings, knobs 0–10,
  // control numbers per the Quick Start Guide — same conventions as your patch booklet.
  dminiBass: {
    bass: { instrument: "Behringer D MINI (MIDI out)", effects: [], external: "D MINI", patch: undefined,
      macros: ["Mode (10): Unison", "Detune (11): 5.5 — a hair of beat", "Waveform (12): Saw", "Cutoff (15): 3.5", "Emphasis (16): 2", "Contour (17): 6 — the character knob", "Attack (24): 0.5", "Decay (25): 4.5", "Sustain (26): 3", "Contour Decay (23): OFF — notes stop dead", "Scale (13): 16'", "Noise Level (14): 0", "Filter Mod (18): OFF", "Osc Mod (27): OFF", "Trigger Sync: off"] },
    chords: { instrument: "Drift", effects: ["Reverb"], macros: ["soulful stabs behind the hardware"], patch: "dreamKeys" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sparse fragments — leave the low end to the hardware"], patch: "modelDLead" },
  },
  dminiLead: {
    lead: { instrument: "Behringer D MINI (MIDI out)", effects: [], external: "D MINI", patch: undefined,
      macros: ["Mode (10): Unison — all three VCOs", "Detune (11): 6 — wide and proud", "Waveform (12): Saw", "Cutoff (15): 6", "Emphasis (16): 4", "Contour (17): 5", "Attack (24): 1", "Decay (25): 5.5", "Sustain (26): 6", "Contour Decay (23): ON — lines ring", "Scale (13): 8'", "Noise Level (14): 0", "Filter Mod (18): OFF", "Osc Mod (27): ON — mod wheel = vibrato", "Mod Depth (28): 1"] },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["stay out of the lead's way"], patch: "subBass" },
  },
  dminiFilter: {
    arp: { instrument: "Behringer D MINI (MIDI out)", effects: [], external: "D MINI", patch: undefined,
      macros: ["Mode (10): Octave", "Detune (11): 5 — centre", "Waveform (12): Saw", "Cutoff (15): START AT 2 — the whole song lives in this knob", "Emphasis (16): 5", "Contour (17): 3", "Attack (24): 0", "Decay (25): 3", "Sustain (26): 4", "Contour Decay (23): OFF", "Scale (13): 8'", "Noise Level (14): 0", "Filter Mod (18): OFF", "Osc Mod (27): OFF", "Trigger Sync: off"] },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["pulsing floor under the sequence"], patch: "modelDBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["rare long tones over the breathing filter"], patch: "pwmLead" },
  },
  dminiGlide: {
    lead: { instrument: "Behringer D MINI (MIDI out)", effects: [], external: "D MINI", patch: undefined,
      macros: ["Mode (10): Unison", "Glide: 4 — the showcase; legato notes slide", "Waveform (12): Saw", "Cutoff (15): 4.5", "Emphasis (16): 6 — vocal", "Contour (17): 5.5", "Attack (24): 0.5", "Decay (25): 4", "Sustain (26): 5", "Scale (13): 8'", "Noise Level (14): 0", "Filter Mod (18): OFF", "Osc Mod (27): OFF"] },
    bass: { instrument: "Drift", effects: ["Saturator", "Auto Filter"], macros: ["the 303 keeps squelching below"], patch: "acidRubber" },
  },
  dminiRing: {
    lead: { instrument: "Behringer D MINI (MIDI out)", effects: [], external: "D MINI", patch: undefined,
      macros: ["Mode (10): RING — the showcase: metallic inharmonics", "Detune (11): PLAY THIS — it retunes the ring spectrum", "Waveform (12): Square", "Cutoff (15): 5", "Emphasis (16): 3", "Contour (17): 4", "Attack (24): 0", "Decay (25): 3.5", "Sustain (26): 2", "Send the audio into your Qi delay — ring + long feedback = dub metal", "Scale (13): 8'", "Noise Level (14): 0", "Filter Mod (18): OFF", "Osc Mod (27): OFF"] },
    chords: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["the dub chord answers the ring hits"], patch: "dubChordStab" },
  },
  dminiDrone: {
    bass: { instrument: "Behringer D MINI (MIDI out)", effects: [], external: "D MINI", patch: undefined,
      macros: ["Mode (10): Unison", "Detune (11): 5.2 — slow beating, alive", "Waveform (12): Triangle", "Cutoff (15): 2.5", "Emphasis (16): 4", "Contour (17): 2", "Attack (24): 6 — swells in", "Decay (25): 8", "Sustain (26): 8", "Contour Decay (23): ON — everything rings on", "Scale (13): 32'", "Noise Level (14): 0.5 — air", "Noise Type: pink", "Filter Mod (18): ON — slow LFO breath", "LFO Rate: 0.5", "LFO Wave: triangle"] },
    pad: { instrument: "Drift", effects: ["Reverb"], macros: ["weather above the drone"], patch: "darkDrone" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["distant bell fragments, minutes apart"], patch: "glassBell" },
  },
  dminiPoly: {
    chords: { instrument: "Behringer D MINI (MIDI out)", effects: [], external: "D MINI", patch: undefined,
      macros: ["Mode (10): POLY — 3-voice paraphonic, the showcase", "Detune (11): 5", "Waveform (12): Saw", "Cutoff (15): 5", "Emphasis (16): 2", "Contour (17): 4", "Attack (24): 2", "Decay (25): 5", "Sustain (26): 5", "ONE shared envelope for all three voices — play staccato blocks, not legato lines", "Scale (13): 8'", "Noise Level (14): 0", "Filter Mod (18): OFF", "Osc Mod (27): OFF", "Trigger Sync: on — chords retrigger together"] },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["clean sub under the paraphony"], patch: "subBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["retro topline answering the block chords"], patch: "pwmLead" },
  },
  // ---- Behringer CZ-1 MINI showcase profiles (v0.74) ----------------------------
  // ONE part per song goes out to the hardware (external — no device loaded; route its
  // MIDI Out to the CZ-1 MINI). The CZ-1 MINI is phase-distortion, not subtractive, so its
  // "performable" knob is DCW LV (adds harmonics) rather than a filter cutoff (removes them)
  // — same arrangement role as the D MINI's Cutoff, opposite mechanism. CC numbers verified
  // against the CZ-1 MINI's own MIDI implementation (0–99 range unless noted); panel groups
  // match the CZ-1 MINI Patch Booklet's layout (Oscillators/Line, DCW, DCA, Detune, Filter,
  // Chorus). Companion parts stay on internal Live instruments, same convention as D MINI.
  cz1SeqPulse: {
    arp: { instrument: "Behringer CZ-1 MINI (MIDI out)", effects: [], external: "CZ-1 MINI", patch: undefined,
      macros: ["Line Select: 1 (single line — keep the transient tight for a driving pulse)",
        "DCO 1 — WF1 / WF2: Square / Resonance I (Saw)",
        "DCW1 LV stage 1 (CC65): START AT 15 — the whole song lives in this value",
        "DCW1 RA stage 1 (CC73): 85 — fast open, snappy per hit",
        "DCA1: fast attack, short release (see Patch Booklet: Sequencer Bloop)",
        "Filter Cutoff (CC89): 60, Resonance (CC90): 15",
        "Chorus: OFF — keep the pulse dry and cutting",
        "PERFORM: DCW1 LV stage 1 (CC65) is your arrangement knob — 15 → 80 across the song. This is the phase-distortion counterpart to the D MINI sequence-stars' Cutoff move: harmonics ADDED instead of subtracted, same dramatic arc."] },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["clean sub, root only — never competes with the sequence"], patch: "subBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["rare answers in the gaps, Jarre-adjacent air"], patch: "pwmLead" },
    chords: { instrument: "Drift", effects: ["Reverb"], macros: ["stabs on the offs, filtered dark"], patch: "dubChordStab" },
  },
  cz1LineStack: {
    chords: { instrument: "Behringer CZ-1 MINI (MIDI out)", effects: [], external: "CZ-1 MINI", patch: undefined,
      macros: ["Line Select: 1+2 — the showcase: two phase-distortion lines stacked, not one knob",
        "DCO 1 & 2 — WF1 / WF2: Saw / Resonance II (Triangle) on both lines",
        "DCW1/2 LV stage 1: ~90, falling to ~35 by SUS (bright strike → mellow body — see Patch Booklet: Bright EP)",
        "DCA1/2: fast attack, natural decay, no long tail",
        "Detune Fine (CC12): 6–10 — width from the second line, not a chorus pedal",
        "Filter Cutoff (CC89): 72, Resonance (CC90): 15",
        "Chorus Rate (CC91): 25, Amount (CC92): 20",
        "PERFORM: there's no single arrangement knob here — the character IS the two-line stack. If you want one live move, ride Chorus Amount (CC92) for width, or nudge Detune Fine (CC12) a few cents for slow beating."] },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["warm, stays out of the stack's low-mid"], patch: "subBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sparse answers above the chord voice"], patch: "modelDLead" },
  },
  cz1RingDrift: {
    lead: { instrument: "Behringer CZ-1 MINI (MIDI out)", effects: [], external: "CZ-1 MINI", patch: undefined,
      macros: ["Line Select: 1+2", "DCO 1 & 2 — WF1 / WF2: Resonance III (Trapezoid) / Double Sine, both lines — inharmonic, and legal (original CZ hardware would not pair two Resonance waveforms)",
        "Detune Polarity (CC9): 1, OCT (CC10): 0",
        "Detune NOTE (CC11): PLAY THIS — semitones of dissonance; wide = more clangorous (see Patch Booklet: Ring Mod Metallic)",
        "Detune Fine (CC12): 30 — extra beating on top of the semitone spread",
        "Filter Cutoff (CC89): 60, Resonance (CC90): 40, LFO Wave: Square, Rate: 30, Depth: 40",
        "Send the audio into your Qi delay / H90 — the beating plus feedback = dub metal, same trick as the D MINI's Ring mode",
        "PERFORM: Detune NOTE (CC11) is your instrument here — start near 0 (in tune, hidden) and widen through the song for the metallic showcase."] },
    chords: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["the dub chord answers the CZ hits"], patch: "dubChordStab" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["clean sub anchor under the dissonance"], patch: "subBass" },
  },
  // ---- CZ-1 MINI × HOOKS (v0.75): the CZ series' real-world identity was catchy mid-80s
  // pop — E-piano hooks, bell toplines, brass stabs. These four put the hardware on the
  // part that carries the earworm, with hook/phrase/callResponse driving the writing.
  cz1TineHook: {
    lead: { instrument: "Behringer CZ-1 MINI (MIDI out)", effects: [], external: "CZ-1 MINI", patch: undefined,
      macros: ["Line Select: 1+2 — tine strike on line 1, body on line 2 (see Patch Booklet: Bright EP)",
        "DCO 1 & 2 — WF1 / WF2: Saw / Resonance II (Triangle)",
        "DCW1 LV stage 1 (CC65): 95, falling to ~35 by SUS — the bright-to-mellow collapse IS the tine",
        "DCW1 RA stage 1 (CC73): 90 — instant strike",
        "DCA1: fast attack, medium decay, short release — every hook note lands and clears",
        "Detune Fine (CC12): 8 — width, not chorus",
        "Filter Cutoff (CC89): 72, Resonance (CC90): 18",
        "Chorus Rate (CC91): 25, Amount (CC92): 20",
        "PERFORM: nothing during the hook — let it be recognisable every time. Between hooks, pull Filter Cutoff (CC89) to 45 for the Breakdown and open it back at the Lift."] },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["round 80s sub, follows the root"], patch: "subBass" },
    chords: { instrument: "Analog", effects: ["Chorus-Ensemble", "Reverb"], macros: ["OB-X style pads under the tine hook"], patch: "obxBrass" },
    pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["wide glassy bed for the Breakdown"], patch: "warmPad" },
  },
  cz1BellHook: {
    lead: { instrument: "Behringer CZ-1 MINI (MIDI out)", effects: [], external: "CZ-1 MINI", patch: undefined,
      macros: ["Line Select: 1+2 — detuned for shimmer (see Patch Booklet: Glass Bell)",
        "DCO 1 & 2 — WF1 / WF2: Resonance II (Triangle) / Double Sine",
        "DCW1 LV stage 1 (CC65): 99 → 20 by SUS — full inharmonic strike, then a clean ring",
        "DCA1: instant attack, LONG END rate — the ring is the hook's sustain",
        "Detune Fine (CC12): 12 — shimmer, just short of clang",
        "Filter Cutoff (CC89): 85, Resonance (CC90): 8",
        "Chorus Rate (CC91): 15, Amount (CC92): 18",
        "PERFORM: Detune Fine (CC12) 12 → 4 into the Breakdown (the bell goes pure and exposed), back to 12 at the Drop. Send to your H90 hall — this hook is meant to be washed."] },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["trance sub, tight and rolling"], patch: "subBass" },
    chords: { instrument: "Analog", effects: ["Chorus-Ensemble", "Reverb"], macros: ["sidechained anthem stabs"], patch: "stab" },
    arp: { instrument: "Drift", effects: ["Delay"], macros: ["16th pluck underneath, filtered dark so the bell owns the top"], patch: "seqPluck" },
  },
  cz1BrassStab: {
    chords: { instrument: "Behringer CZ-1 MINI (MIDI out)", effects: [], external: "CZ-1 MINI", patch: undefined,
      macros: ["Line Select: 1+2 — small-section width (see Patch Booklet: Swell Stab)",
        "DCO 1 & 2 — WF1 / WF2: Saw / Square",
        "DCW1 LV stage 1 (CC65): 90; DCW1 RA stage 1 (CC73): 25 — SLOW open: the brass tongue",
        "DCA1: medium attack, held sustain, short release — a stab, not a pad",
        "Detune Fine (CC12): 14 — the section",
        "Filter Cutoff (CC89): 80, Resonance (CC90): 12",
        "Chorus Rate (CC91): 30, Amount (CC92): 25",
        "PERFORM: DCW1 RA stage 1 (CC73) is the character — 25 for a swell stab, 70 for a hard 80s hit. Switch between them per section; the hook is the rhythm of the stabs, so keep the notes identical."] },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["singable topline over the stabs"], patch: "pwmLead" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["octave-jumping synthwave bass"], patch: "subBass" },
  },
  cz1ReedTopline: {
    lead: { instrument: "Behringer CZ-1 MINI (MIDI out)", effects: [], external: "CZ-1 MINI", patch: undefined,
      macros: ["Line Select: 1 (see Patch Booklet: Reed Lead)",
        "DCO 1 — WF1 / WF2: Resonance III (Trapezoid) / Saw — the nasal formant",
        "DCW1 LV stage 1 (CC65): 70, SUS 60 — steady, present, no swell",
        "DCA1: quick attack, held sustain, medium release — legato-friendly",
        "Vibrato Wave (CC2): Triangle, Rate (CC3): 45, Depth (CC6): 20, Delay (CC7): 35 — the delayed wobble is what makes it a player, not a preset",
        "Filter Cutoff (CC89): 75, Resonance (CC90): 15",
        "PERFORM: Vibrato Depth (CC6) is your expression — 20 on the verse phrases, 35 on the hook's held notes. Mod wheel (CC1) if you'd rather play it."] },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["warm, mid-forward floor"], patch: "modelDBass" },
    chords: { instrument: "Drift", effects: ["Reverb"], macros: ["soulful sevenths answering the reed"], patch: "dreamKeys" },
    counterMelody: { instrument: "Operator", effects: ["Delay"], macros: ["bell answer, low velocity, behind the reed"], patch: "bell" },
  },
  // Jarre-style airy analog lead over a sequence.
  jarreAirLead: {
    lead: { instrument: "Drift", effects: ["Reverb", "Delay"], macros: ["airy PWM lead (Oxygène)", "Reverb: wide", "Delay: sync"], patch: "pwmLead" },
    pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["glassy cosmic pad", "Chorus: wide", "Reverb: huge"], patch: "warmPad" },
  },
  // Jarre, the SEQUENCE side (Équinoxe / Magnetic Fields / Chronologie): a bright staccato
  // ostinato, Eminent-through-phaser strings, CS-80-style brass chords, PWM lead on top.
  jarreSequence: {
    arp: { instrument: "Drift", effects: ["Delay"], macros: ["staccato ARP-2600 style pluck, short gate", "Delay: 1/8 dotted, low feedback — the Jarre echo"], patch: "seqPluck" },
    lead: { instrument: "Drift", effects: ["Reverb", "Delay"], macros: ["airy PWM lead, sings in 4-bar phrases", "Reverb: wide", "Delay: sync"], patch: "pwmLead" },
    pad: { instrument: "Drift", effects: ["Phaser", "Reverb"], macros: ["Eminent strings — the PHASER is the sound"], patch: "eminentStrings" },
    chords: { instrument: "Drift", effects: ["Chorus-Ensemble", "Reverb"], macros: ["CS-80-style brass swells on the changes"], patch: "cs80Brass" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["round, octave-jumping sequencer bass"], patch: "subBass" },
  },
  // Emotional Detroit — FM bells + warm sub.
  detroitEmotional: {
    lead: { instrument: "Operator", effects: ["Chorus-Ensemble", "Delay", "Reverb"], macros: ["FM bell, singing", "Chorus: ensemble", "Delay: 1/8", "Reverb: lush"], patch: "bell" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["warm round sub", "Saturator: gentle"], patch: "subBass" },
    chords: { instrument: "Analog", effects: ["Chorus-Ensemble", "Reverb"], macros: ["soulful 7th stabs", "sidechain"], patch: "stab" },
    arp: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["emotional shimmer seq"], patch: "crystalPluck" },
  },
  // Berlin analog sequence — the arp/seq is the star.
  berlinAnalogSeq: {
    arp: { instrument: "Drift", effects: ["Auto Filter", "Delay", "Reverb"], macros: ["THE sequence", "Auto Filter: slow ride", "Resonance: mid-high", "Delay: 1/16"], patch: "seqPluck" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["pulsing analog bass", "mono"], patch: "modelDBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sparse fragments", "Delay: dotted"], patch: "modelDLead" },
  },
  // Dub-techno with the chord front and centre.
  dubChordHeavy: {
    chords: { instrument: "Analog", effects: ["Auto Filter", "Delay", "Reverb"], macros: ["THE dub chord", "Delay: long feedback", "Reverb: 100%", "Filter: down"], patch: "wash" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["dub pedal weight"], patch: "taurusBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sparse dark fragments"], patch: "moogLead" },
  },
  // Soft glass ambient.
  glassAmbient: {
    pad: { instrument: "Wavetable", effects: ["Reverb", "Delay"], macros: ["frozen glass pad", "Attack: 4s", "Reverb: cathedral"], patch: "warmPad" },
    lead: { instrument: "Tension", effects: ["Reverb", "Delay"], macros: ["distant bowed echoes", "Reverb: infinite"], patch: "tensionBow" },
  },
  // Cosmic floating sequence.
  cosmicFloat: {
    arp: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["gentle floating seq", "Delay: 1/8", "Reverb: wide"], patch: "seqPluck" },
    pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["soft orbital pad"], patch: "warmPad" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["thin floating lead"], patch: "iceLead" },
    counterMelody: { instrument: "Drift", effects: ["Delay"], macros: ["distant whistle answers"], patch: "sineWhistle" },
  },
  // Bright neon synthwave.
  synthwaveNeon: {
    lead: { instrument: "Drift", effects: ["Reverb", "Delay"], macros: ["bright saw lead", "gated reverb", "Delay: sync"], patch: "superLead" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["octave synth bass"], patch: "octaveRunner" },
    pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["80s poly", "Chorus: wide"], patch: "junoPad" },
  },
  // Warm velvet deep house.
  deepHouseVelvet: {
    chords: { instrument: "Analog", effects: ["Chorus-Ensemble", "Reverb"], macros: ["warm Rhodes 7ths", "swing"], patch: "keys" },
    pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["velvet pad", "sidechain"], patch: "junoPad" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["soft whistle motif"], patch: "sineWhistle" },
  },
  // Glassy uplifting trance.
  tranceGlass: {
    lead: { instrument: "Drift", effects: ["Reverb", "Delay"], macros: ["supersaw, big", "sidechain", "Reverb: huge"], patch: "superLead" },
    pad: { instrument: "Wavetable", effects: ["Reverb"], macros: ["wide glassy pad (OB-Xa)"], patch: "obPad" },
    arp: { instrument: "Drift", effects: ["Delay"], macros: ["crystal 16ths", "sidechain"], patch: "crystalPluck" },
  },
  // Bright emotional breaks.
  brightBreaks: {
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["92 hoover hook", "Delay: 1/8"], patch: "hooverRave" },
    chords: { instrument: "Analog", effects: ["Chorus-Ensemble", "Reverb"], macros: ["bright major chords"], patch: "stab" },
    bass: { instrument: "Drift", effects: ["Saturator", "Auto Filter"], macros: ["reese undertow"], patch: "reeseBass" },
    arp: { instrument: "Drift", effects: ["Delay"], macros: ["crystal fragments"], patch: "crystalPluck" },
  },
  // Metallic chrome acid — 303 bass under FM-bell fragments.
  acidChrome: {
    bass: { instrument: "Drift", effects: ["Saturator", "Auto Filter"], macros: ["303 squelch, chrome-bright", "Saturator: hard", "Auto Filter: ride the res"], patch: "acid303" },
    arp: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["tight 16th seq", "Delay: 1/16"], patch: "seqPluck" },
    counterMelody: { instrument: "Drift", effects: ["Delay"], macros: ["zap answers"], patch: "laserZap" },
    lead: { instrument: "Operator", effects: ["Delay", "Reverb"], macros: ["metallic bell fragments", "Reverb: plate"], patch: "bell" },
  },
  // Deep dub-acid — 303 pressure inside a chord-heavy fog.
  acidDub: {
    bass: { instrument: "Drift", effects: ["Saturator", "Auto Filter"], macros: ["slow 303, low cutoff", "opens over the night"], patch: "acidRubber" },
    chords: { instrument: "Analog", effects: ["Auto Filter", "Delay", "Reverb"], macros: ["THE dub chord", "Delay: long feedback"], patch: "wash" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sparse dark fragments"], patch: "moogLead" },
    pad: { instrument: "Drift", effects: ["Reverb"], macros: ["dark fog pad"], patch: "darkDrone" },
  },
  // Industrial sequence — corroded stabs over a deep pulse low end (Rust Belt).
  industrialSeq: {
    chords: { instrument: "Drift", effects: ["Saturator", "Delay"], macros: ["corroded stab", "Saturator: grind"], patch: "industrialStab" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["deep pulse pressure"], patch: "deepPulseBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sparks over the floor"], patch: "moogLead" },
    arp: { instrument: "Drift", effects: ["Auto Filter", "Delay"], macros: ["relentless 16ths"], patch: "seqPluck" },
  },
  // Jungle/breaks reese — reese low end under crystalline fragments (Jungle Glass, Storm Warning).
  jungleReese: {
    bass: { instrument: "Drift", effects: ["Saturator", "Auto Filter"], macros: ["THE reese", "Auto Filter: slow sweep"], patch: "reeseBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["crystal fragments"], patch: "crystalPluck" },
    chords: { instrument: "Drift", effects: ["Reverb"], macros: ["airy choir bed"], patch: "glassChoir" },
    pad: { instrument: "Drift", effects: ["Reverb"], macros: ["thin high pad"], patch: "glassChoir" },
  },
  // Organ house — two-sine drawbar chords + whistle lead (Morning Ritual, Starlight Disco).
  organHouse: {
    chords: { instrument: "Drift", effects: ["Chorus-Ensemble", "Compressor"], macros: ["organ gate chords", "sidechain"], patch: "houseOrgan" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sine whistle motif"], patch: "sineWhistle" },
    pad: { instrument: "Drift", effects: ["Chorus-Ensemble", "Reverb"], macros: ["soft key bed"], patch: "dreamKeys" },
  },
  // Detroit electro-funk — clav comping + rubbery electro pluck (Midnight Funk).
  electroFunk: {
    chords: { instrument: "Drift", effects: ["Chorus-Ensemble", "Compressor"], macros: ["narrow-pulse clav comping", "tight and dry"], patch: "funkClav" },
    counterMelody: { instrument: "Drift", effects: ["Delay"], macros: ["rubbery electro pluck", "Delay: 1/8"], patch: "plasticPluck" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["round funk sub"], patch: "subBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["bell motif, singing"], patch: "glassBell" },
    arp: { instrument: "Drift", effects: ["Delay"], macros: ["rubbery 16ths"], patch: "plasticPluck" },
  },
};
export const SOUND_PROFILE_IDS = Object.keys(SOUND_PROFILES);

/** Patches whose Voice Mode is Mono or Unison — i.e. they collapse a chord to ONE note. Derived
 *  from the patch table so it can never drift out of sync. Used to keep polyphonic material
 *  (pad/chords) off a monophonic patch, which would silently drop chord notes. */
export const MONO_PATCHES: Set<string> = new Set(
  Object.entries(INSTRUMENT_PATCHES)
    .filter(([, moves]) => moves.some((m) =>
      m.aliases[0].includes("voice mode") && (m.item === "Mono" || m.item === "Unison")))
    .map(([id]) => id),
);

/** Human-friendly names for patch ids — shown in the Song Info sheet so each track names the
 *  exact patch it will load. Kept honest to the sound (matches the capture namer's vocabulary). */
export const PATCH_DISPLAY_NAMES: Record<string, string> = {
  acid303: "Acid 303", acidRubber: "Rubber Acid", moogLead: "Moog Lead", subBass: "Sub Bass",
  seqPluck: "Seq Pluck", pwmLead: "PWM Lead", superLead: "Supersaw", driftPad: "Drift Pad",
  glassBell: "Glass Bell", hooverRave: "Hoover", dreamKeys: "Dream Keys", darkDrone: "Dark Drone",
  feltEP: "Felt EP",
  plasticPluck: "Plastic Pluck", cosmicSweep: "Cosmic Sweep", funkClav: "Funk Clav",
  iceLead: "Ice Lead", warmBrass: "Warm Brass", crystalPluck: "Crystal Pluck",
  deepPulseBass: "Pulse Bass", reeseBass: "Reese", houseOrgan: "House Organ",
  sineWhistle: "Sine Whistle", tapeStrings: "Tape Strings", laserZap: "Laser Zap",
  glassChoir: "Glass Choir", industrialStab: "Industrial Stab", octaveRunner: "Octave Runner",
  junoPad: "Juno Pad", obPad: "OB Pad", warmPad: "Warm Pad", stab: "Stab", wash: "Dub Wash",
  keys: "Rhodes Keys", bell: "FM Bell", collisionMallet: "Mallet", tensionBow: "Bowed",
  electricRhodes: "Electric Piano",
  modelDBass: "Model D Bass", modelDLead: "Model D Lead", obxBrass: "OB-X Brass",
  prophet5Pad: "Prophet Pad", juno106Pad: "Juno Pad", sh101Bass: "SH-101 Bass",
  cs80Brass: "CS-80 Brass", jupiter8Pad: "Jupiter Pad", proOneLead: "Pro-One Lead",
  eminentStrings: "Eminent Strings", ms20Lead: "MS-20 Lead", taurusBass: "Taurus Sub",
  dubChordStab: "Dub Chord Stab", cathedralOrgan: "Cathedral Organ", duneFlute: "Dune Flute",
  wireLead: "Wire Lead", neonPluck: "Neon Pluck", abyssBass: "Abyss Bass",
  rubberBand: "Rubber Band", staticHaze: "Static Haze",
};
/** Primary ROLE per patch — used to prefix exported filenames (bass-…, lead-…) and to assert
 *  that recipes never put a patch on a part it wasn't designed for. acid303 is dual-natured
 *  (bassline AND acid sequence) — its primary label stays "bass". */
export const PATCH_ROLES: Record<string, "bass" | "lead" | "pad" | "keys" | "seq"> = {
  acid303: "bass", acidRubber: "bass", subBass: "bass", reeseBass: "bass", deepPulseBass: "bass",
  octaveRunner: "bass", abyssBass: "bass", rubberBand: "bass",
  modelDBass: "bass", sh101Bass: "bass", taurusBass: "bass",
  moogLead: "lead", pwmLead: "lead", superLead: "lead", hooverRave: "lead", iceLead: "lead",
  sineWhistle: "lead", laserZap: "lead", wireLead: "lead", duneFlute: "lead",
  modelDLead: "lead", proOneLead: "lead", ms20Lead: "lead",
  seqPluck: "seq", crystalPluck: "seq", plasticPluck: "seq", glassBell: "seq", neonPluck: "seq",
  driftPad: "pad", darkDrone: "pad", tapeStrings: "pad", glassChoir: "pad", cosmicSweep: "pad",
  warmPad: "pad", junoPad: "pad", obPad: "pad", staticHaze: "pad", wash: "pad",
  prophet5Pad: "pad", juno106Pad: "pad", jupiter8Pad: "pad", eminentStrings: "pad",
  dreamKeys: "keys", funkClav: "keys", houseOrgan: "keys", warmBrass: "keys", feltEP: "keys",
  industrialStab: "keys", dubChordStab: "keys", cathedralOrgan: "keys", stab: "keys", keys: "keys",
  obxBrass: "keys", cs80Brass: "keys",
  electricRhodes: "keys", bell: "seq", collisionMallet: "seq", tensionBow: "lead",
};
/** DEPRECATED — superseded by `patchInserts()`, which is the single source of truth for the
 *  effects in BOTH the .ablpresetbundle and the .adg (and for what Load Instruments puts on a
 *  Move track). Kept only because older probes reference it; do not wire it into new code.
 *
 *  Per-patch send-FX character for EXPORTED presets (.ablpresetbundle / .adg).
 *  `delayWet` 0 means "ship no delay device at all" — bass stays dry so the low end doesn't smear.
 *  Sixteenth values are Move/Live "SyncedSixteenth" indices: 1=1/16, 2=1/8, 3=1/8 dotted, 4=1/4.
 *  Reverb fields only reach the desktop .adg (Move has no per-track reverb device — it's a send). */
export interface PatchFx {
  delayWet: number;      // 0..1 dry/wet (0 = omit the device)
  delayFeedback: number; // 0..1
  delaySyncL: number;    // synced sixteenth index, left
  delaySyncR: number;    // synced sixteenth index, right (≠ L → ping-pong interest)
  reverbWet: number;     // 0..1 (.adg only)
  reverbDecay: number;   // ms
  reverbSize: number;    // 0..100
}
const FX_BY_ROLE: Record<string, PatchFx> = {
  // basses stay dry — delay on a sub is mud
  bass: { delayWet: 0, delayFeedback: 0.2, delaySyncL: 2, delaySyncR: 2, reverbWet: 0.04, reverbDecay: 700, reverbSize: 60 },
  // leads sing on a dotted-eighth
  lead: { delayWet: 0.26, delayFeedback: 0.36, delaySyncL: 3, delaySyncR: 2, reverbWet: 0.18, reverbDecay: 1800, reverbSize: 95 },
  // plucks/sequences: 1/16 into 1/8 dotted fills the gaps between notes
  seq: { delayWet: 0.24, delayFeedback: 0.34, delaySyncL: 1, delaySyncR: 3, reverbWet: 0.16, reverbDecay: 1600, reverbSize: 90 },
  // pads: slow, wide, mostly reverb — the delay just widens
  pad: { delayWet: 0.16, delayFeedback: 0.28, delaySyncL: 4, delaySyncR: 3, reverbWet: 0.3, reverbDecay: 3200, reverbSize: 110 },
  // keys/stabs: short slap so comping stays readable
  keys: { delayWet: 0.2, delayFeedback: 0.3, delaySyncL: 2, delaySyncR: 3, reverbWet: 0.14, reverbDecay: 1400, reverbSize: 85 },
  synth: { delayWet: 0.18, delayFeedback: 0.3, delaySyncL: 2, delaySyncR: 3, reverbWet: 0.12, reverbDecay: 1200, reverbSize: 80 },
};
/** Patches whose whole identity IS the effect — dub chords, ambient washes, rave stabs. */
const FX_OVERRIDES: Record<string, Partial<PatchFx>> = {
  dubChordStab: { delayWet: 0.42, delayFeedback: 0.62, delaySyncL: 3, delaySyncR: 4, reverbWet: 0.42, reverbDecay: 5200, reverbSize: 120 },
  darkDrone:    { delayWet: 0.3, delayFeedback: 0.55, delaySyncL: 4, delaySyncR: 3, reverbWet: 0.45, reverbDecay: 6000, reverbSize: 120 },
  wash:         { delayWet: 0.38, delayFeedback: 0.6, delaySyncL: 4, delaySyncR: 3, reverbWet: 0.5, reverbDecay: 6000, reverbSize: 120 },
  cosmicSweep:  { delayWet: 0.28, delayFeedback: 0.5, delaySyncL: 4, delaySyncR: 3, reverbWet: 0.45, reverbDecay: 5000, reverbSize: 120 },
  staticHaze:   { delayWet: 0.2, delayFeedback: 0.4, delaySyncL: 4, delaySyncR: 4, reverbWet: 0.5, reverbDecay: 6000, reverbSize: 120 },
  glassChoir:   { delayWet: 0.22, delayFeedback: 0.4, delaySyncL: 4, delaySyncR: 3, reverbWet: 0.42, reverbDecay: 4600, reverbSize: 115 },
  glassBell:    { delayWet: 0.3, delayFeedback: 0.4, delaySyncL: 3, delaySyncR: 1, reverbWet: 0.28, reverbDecay: 2600, reverbSize: 100 },
  crystalPluck: { delayWet: 0.3, delayFeedback: 0.4, delaySyncL: 1, delaySyncR: 3, reverbWet: 0.24, reverbDecay: 2200, reverbSize: 95 },
  seqPluck:     { delayWet: 0.28, delayFeedback: 0.38, delaySyncL: 1, delaySyncR: 3, reverbWet: 0.2, reverbDecay: 1800, reverbSize: 90 },
  hooverRave:   { delayWet: 0.24, delayFeedback: 0.34, delaySyncL: 3, delaySyncR: 2, reverbWet: 0.2, reverbDecay: 2000, reverbSize: 95 },
  laserZap:     { delayWet: 0.34, delayFeedback: 0.45, delaySyncL: 1, delaySyncR: 3, reverbWet: 0.2, reverbDecay: 1800, reverbSize: 90 },
  iceLead:      { delayWet: 0.3, delayFeedback: 0.42, delaySyncL: 3, delaySyncR: 2, reverbWet: 0.34, reverbDecay: 3400, reverbSize: 110 },
  sineWhistle:  { delayWet: 0.3, delayFeedback: 0.4, delaySyncL: 3, delaySyncR: 2, reverbWet: 0.3, reverbDecay: 2800, reverbSize: 105 },
  duneFlute:    { delayWet: 0.26, delayFeedback: 0.38, delaySyncL: 3, delaySyncR: 2, reverbWet: 0.36, reverbDecay: 3600, reverbSize: 110 },
  // a 303 wants a touch of space but never a rhythmic echo fighting the line
  acid303:      { delayWet: 0, reverbWet: 0.08, reverbDecay: 900 },
  acidRubber:   { delayWet: 0, reverbWet: 0.1, reverbDecay: 1100 },
};
/** The FX a patch should be exported with. Deterministic; role-driven with per-patch overrides. */
export function patchFx(patchId?: string): PatchFx {
  const base = FX_BY_ROLE[patchRole(patchId)] ?? FX_BY_ROLE.synth;
  const over = patchId ? FX_OVERRIDES[patchId] : undefined;
  return { ...base, ...(over ?? {}) };
}

/** An insert effect for an exported Move preset. `kind` must be one of the VERIFIED device kinds
 *  (see move-preset-templates.ts); `params` are that device's real parameter names, overriding the
 *  captured device's defaults. Move allows at most TWO inserts after the Drift rack. */
export interface MoveInsert { kind: string; params: Record<string, number | string | boolean> }

/** Helpers keeping the verified value conventions in one place. */
const revb = (wet: number, decayMs: number, size: number, preDelay = 2.5): MoveInsert => ({
  kind: "reverb",
  // MixDirect IS the Dry/Wet knob and holds the WET amount — measured from Live exports:
  // 45% wet -> 0.45, 12% wet -> 0.12. (An earlier reading of "dry = 1 - wet" came from an
  // export where the knob was never touched; 0.55 was merely the default.)
  // DecayTime is in MILLISECONDS (1.2 s -> 1200); Live's minimum is 200 ms.
  params: { Enabled: true, MixDirect: +wet.toFixed(4), MixReflect: 1, MixDiffuse: 1,
            DecayTime: Math.max(200, decayMs), RoomSize: size, PreDelay: preDelay,
            StereoSeparation: 100 },
});
const dly = (wet: number, fb: number, l: number, r: number): MoveInsert => ({
  kind: "delay",
  // SyncedSixteenth values are STRING enums ("1".."16"); 1=1/16, 2=1/8, 3=1/8 dotted, 4=1/4.
  // DelayLine_Link MUST be false or the right side just follows the left and the R value is
  // ignored (a real Live export with L=3/R=4 still had Link=true — the R was never heard).
  params: { Enabled: true, DryWet: wet, Feedback: fb, DelayLine_SyncL: true, DelayLine_SyncR: true,
            DelayLine_Link: false,
            DelayLine_SyncedSixteenthL: String(l), DelayLine_SyncedSixteenthR: String(r),
            DelayLine_PingPong: l !== r, Filter_On: true, Filter_Frequency: 1000, Filter_Bandwidth: 8 },
});
const sat = (driveDb: number, type = "Analog Clip", wet = 1, outDb = 0): MoveInsert => ({
  kind: "saturator",
  // Measured from a Live export: the Drive knob writes PreDrive (dB) and Output writes PostDrive
  // (dB) — BaseDrive stayed at 0 when Drive was set to +12, so it is NOT the Drive control.
  // Drive is compensated at the output so a hotter patch doesn't just get louder.
  params: { Enabled: true, PreDrive: driveDb, PostDrive: outDb || +(-driveDb * 0.5).toFixed(2),
            Type: type, DryWet: wet, ColorOn: true },
});
const cho = (mode: string, amount: number, rate: number, wet: number): MoveInsert => ({
  kind: "chorus",
  params: { Enabled: true, Mode: mode, Amount: amount, Rate: rate, DryWet: wet, Width: 1 },
});
const phs = (mode: string, amount: number, rateHz: number, fb: number, wet: number): MoveInsert => ({
  kind: "phaser",
  params: { Enabled: true, Mode: mode, Modulation_Amount: amount, Modulation_Frequency: rateHz,
            Feedback: fb, DryWet: wet },
});
const rdx = (bits: number, sampleRate: number, wet: number): MoveInsert => ({
  kind: "redux2",
  params: { Enabled: true, BitDepth: bits, SampleRate: sampleRate, DryWet: wet },
});
/** Channel EQ gains are LINEAR ratios (1.0 = 0 dB), not decibels — Live exported 1.0 for a flat EQ. */
const eqDb = (db: number) => +Math.pow(10, db / 20).toFixed(4);
const eq = (lowDb: number, midDb: number, highDb: number, midFreq = 1500): MoveInsert => ({
  kind: "channelEq",
  params: { Enabled: true, LowShelfGain: eqDb(lowDb), MidGain: eqDb(midDb),
            HighShelfGain: eqDb(highDb), MidFrequency: midFreq, HighpassOn: false, Gain: 1 },
});

/** The (max 2) insert effects a patch exports with, by role, with per-patch character overrides.
 *  Uses all seven Move-exportable effects; a patch that wants nothing gets an empty chain so the
 *  player still sees Move's "+" on both slots. */
const INSERTS_BY_ROLE: Record<string, MoveInsert[]> = {
  // basses: drive for weight, EQ to keep the sub defined — never a delay (it smears the low end)
  bass: [sat(6), eq(2, -2, 0, 900)],
  lead: [revb(0.18, 1800, 95), dly(0.26, 0.36, 3, 2)],
  seq: [revb(0.16, 1600, 90), dly(0.24, 0.34, 1, 3)],
  pad: [cho("Ensemble", 0.6, 0.6, 0.4), revb(0.3, 3200, 110)],
  keys: [revb(0.14, 1400, 85), dly(0.2, 0.3, 2, 3)],
  synth: [revb(0.12, 1200, 80), dly(0.18, 0.3, 2, 3)],
};
const INSERTS_BY_PATCH: Record<string, MoveInsert[]> = {
  // dub: the echo IS the instrument
  dubChordStab: [dly(0.42, 0.62, 3, 4), revb(0.42, 5200, 120, 15)],
  darkDrone: [dly(0.3, 0.55, 4, 3), revb(0.45, 6000, 120, 20)],
  wash: [dly(0.38, 0.6, 4, 3), revb(0.5, 6000, 120, 20)],
  // ambient/texture
  cosmicSweep: [cho("Ensemble", 0.7, 0.4, 0.5), revb(0.45, 5000, 120, 12)],
  staticHaze: [rdx(12, 22050, 0.35), revb(0.5, 6000, 120, 15)],   // tape-grade bit reduction
  glassChoir: [cho("Ensemble", 0.5, 0.5, 0.35), revb(0.42, 4600, 115)],
  tapeStrings: [cho("Classic", 0.55, 0.8, 0.4), revb(0.3, 3000, 105)],
  // 303s: a touch of space, never an echo fighting the line
  acid303: [sat(9), revb(0.08, 900, 60)],
  acidRubber: [sat(7), revb(0.1, 1100, 65)],
  // classic studies whose effect IS the sound
  juno106Pad: [cho("Ensemble", 0.75, 0.5, 0.5), revb(0.26, 2600, 105)],   // the Juno chorus, not optional
  eminentStrings: [phs("Phaser", 0.7, 0.12, 0.35, 0.5), revb(0.3, 3000, 110)], // Oxygène is the phaser
  ms20Lead: [sat(11, "Digital Clip"), dly(0.24, 0.36, 3, 2)],             // the MS-20 bites
  modelDBass: [sat(7), eq(2, -1, -2, 850)],
  modelDLead: [revb(0.16, 1500, 90), dly(0.22, 0.34, 3, 2)],
  sh101Bass: [sat(8), eq(2, 1, 0, 950)],
  taurusBass: [sat(4), eq(4, -4, -9, 650)],                               // pedals: all floor, no top
  proOneLead: [revb(0.18, 1700, 92), dly(0.24, 0.36, 3, 2)],
  obxBrass: [cho("Classic", 0.35, 0.7, 0.25), revb(0.22, 2000, 95)],
  cs80Brass: [cho("Ensemble", 0.45, 0.4, 0.3), revb(0.3, 3200, 110)],
  prophet5Pad: [cho("Classic", 0.5, 0.5, 0.35), revb(0.32, 3400, 110)],
  jupiter8Pad: [cho("Ensemble", 0.6, 0.35, 0.45), revb(0.36, 4000, 115)],
  // character voices
  hooverRave: [phs("Phaser", 0.55, 0.25, 0.4, 0.35), revb(0.2, 2000, 95)],
  reeseBass: [sat(10), phs("Phaser", 0.4, 0.12, 0.3, 0.3)],       // the classic reese phase-swirl
  industrialStab: [sat(12, "Digital Clip"), rdx(8, 16000, 0.4)],
  plasticPluck: [rdx(10, 24000, 0.3), dly(0.24, 0.34, 1, 3)],
  funkClav: [phs("Phaser", 0.35, 0.5, 0.25, 0.3), dly(0.2, 0.3, 2, 3)],
  subBass: [sat(4), eq(3, -3, -6, 800)],                           // sub: lift lows, cut the top
  abyssBass: [sat(3), eq(4, -4, -8, 700)],
  deepPulseBass: [sat(5), eq(2, -2, -3, 850)],
  rubberBand: [sat(8), eq(1, 2, 0, 1200)],
  octaveRunner: [sat(7), eq(1, 0, 1, 1000)],
  laserZap: [dly(0.34, 0.45, 1, 3), revb(0.2, 1800, 90)],
  glassBell: [dly(0.3, 0.4, 3, 1), revb(0.28, 2600, 100)],
  crystalPluck: [dly(0.3, 0.4, 1, 3), revb(0.24, 2200, 95)],
  iceLead: [revb(0.34, 3400, 110), dly(0.3, 0.42, 3, 2)],
  duneFlute: [cho("Classic", 0.4, 0.7, 0.3), revb(0.36, 3600, 110)],
  sineWhistle: [revb(0.3, 2800, 105), dly(0.3, 0.4, 3, 2)],
  houseOrgan: [cho("Ensemble", 0.5, 0.9, 0.35), revb(0.2, 1600, 85)],
  dreamKeys: [cho("Classic", 0.45, 0.6, 0.3), revb(0.22, 2000, 95)],
  feltEP: [revb(0.18, 1400, 60, 8)], // close room, a touch of pre-delay = "in the room"
  warmBrass: [cho("Ensemble", 0.5, 0.5, 0.3), revb(0.26, 2400, 100)],
  electricRhodes: [cho("Classic", 0.5, 0.7, 0.35), revb(0.2, 1800, 90)],
};
/** Verified Move device kind → the Live device that Load Instruments should place on the track.
 *  This is what keeps "what I hear in Live" identical to "what's inside the exported preset". */
export const MOVE_FX_TO_LIVE_DEVICE: Record<string, string> = {
  reverb: "Reverb", delay: "Delay", saturator: "Saturator", chorus: "Chorus-Ensemble",
  phaser: "Phaser-Flanger", redux2: "Redux", channelEq: "Channel EQ",
};
/** The Live-side effect chain implied by a patch's Move inserts (single source of truth). */
export function patchLiveEffects(patchId?: string): string[] {
  return patchInserts(patchId).map((i) => MOVE_FX_TO_LIVE_DEVICE[i.kind]).filter(Boolean);
}

/** Up to two verified insert effects for a patch. Deterministic. */
export function patchInserts(patchId?: string): MoveInsert[] {
  // NB: `patchId && …` would evaluate to "" for an empty-string id — use an explicit ternary.
  const chain = (patchId ? INSERTS_BY_PATCH[patchId] : undefined) ?? INSERTS_BY_ROLE[patchRole(patchId)] ?? INSERTS_BY_ROLE.synth;
  return chain.slice(0, 2); // Move's spec: a Drift preset carries at most two inserts
}

/** ---- Macro layout -------------------------------------------------------------------------
 *  On Move the eight dials ARE the instrument, so what's mapped decides whether a patch can be
 *  played or only listened to. Layout rule: macros 0–5 are the Drift controls that matter for the
 *  patch's ROLE, and 6–7 are the patch's two inserts — so every macro always targets a device the
 *  patch actually has. Names are short because Move's display is narrow. */
export interface MacroMap {
  name: string;                    // shown on the dial (keep ≤ 10 chars)
  device: "drift" | string;        // "drift", or a Move fx kind ("saturator"…) — always one the patch has
  param: string;                   // the device's real parameter name
}
/** The one control that matters most on each effect — what a player reaches for mid-jam. */
const FX_PRIMARY: Record<string, { param: string; name: string }> = {
  reverb: { param: "MixDirect", name: "Space" },
  delay: { param: "DryWet", name: "Echo" },
  saturator: { param: "PreDrive", name: "Drive" },
  chorus: { param: "Amount", name: "Width" },
  phaser: { param: "Modulation_Amount", name: "Sweep" },
  redux2: { param: "BitDepth", name: "Crush" },
  channelEq: { param: "HighShelfGain", name: "Tone" },
};
/** Drift macros 0–5 by role. A 303 wants glide and env-mod on hand; a pad wants attack/release. */
const DRIFT_MACROS_BY_ROLE: Record<string, MacroMap[]> = {
  bass: [
    { name: "Cutoff", device: "drift", param: "Filter_Frequency" },
    { name: "Reso", device: "drift", param: "Filter_Resonance" },
    { name: "Decay", device: "drift", param: "Envelope1_Decay" },
    { name: "Env Mod", device: "drift", param: "Filter_ModAmount1" },
    { name: "Glide", device: "drift", param: "Global_Glide" },
    { name: "Sub", device: "drift", param: "Mixer_OscillatorGain2" },
  ],
  lead: [
    { name: "Cutoff", device: "drift", param: "Filter_Frequency" },
    { name: "Reso", device: "drift", param: "Filter_Resonance" },
    { name: "Attack", device: "drift", param: "Envelope1_Attack" },
    { name: "Release", device: "drift", param: "Envelope1_Release" },
    { name: "Detune", device: "drift", param: "Oscillator2_Detune" },
    { name: "Vibrato", device: "drift", param: "Lfo_Amount" },
  ],
  seq: [
    { name: "Cutoff", device: "drift", param: "Filter_Frequency" },
    { name: "Reso", device: "drift", param: "Filter_Resonance" },
    { name: "Decay", device: "drift", param: "Envelope1_Decay" },
    { name: "Env Mod", device: "drift", param: "Filter_ModAmount1" },
    { name: "Shape", device: "drift", param: "Oscillator1_Shape" },
    { name: "Detune", device: "drift", param: "Oscillator2_Detune" },
  ],
  pad: [
    { name: "Cutoff", device: "drift", param: "Filter_Frequency" },
    { name: "Attack", device: "drift", param: "Envelope1_Attack" },
    { name: "Release", device: "drift", param: "Envelope1_Release" },
    { name: "Reso", device: "drift", param: "Filter_Resonance" },
    { name: "Detune", device: "drift", param: "Oscillator2_Detune" },
    { name: "Drift", device: "drift", param: "Lfo_Rate" },
  ],
  keys: [
    { name: "Cutoff", device: "drift", param: "Filter_Frequency" },
    { name: "Reso", device: "drift", param: "Filter_Resonance" },
    { name: "Decay", device: "drift", param: "Envelope1_Decay" },
    { name: "Release", device: "drift", param: "Envelope1_Release" },
    { name: "Shape", device: "drift", param: "Oscillator1_Shape" },
    { name: "Detune", device: "drift", param: "Oscillator2_Detune" },
  ],
};
/** The eight macros for a patch: six role-appropriate Drift controls, then one dial per insert. */
export function patchMacros(patchId?: string): MacroMap[] {
  const role = patchRole(patchId);
  const base = DRIFT_MACROS_BY_ROLE[role] ?? DRIFT_MACROS_BY_ROLE.lead;
  const out: MacroMap[] = [...base];
  for (const ins of patchInserts(patchId)) {
    const p = FX_PRIMARY[ins.kind];
    if (p) out.push({ name: p.name, device: ins.kind, param: p.param });
  }
  return out.slice(0, 8);
}

/** A track label that carries the patch it plays: "Move · Bass — Rubber Acid".
 *  The canonical BASE name is preserved as a prefix on purpose — every track lookup matches on
 *  the base (see trackBaseName), so renaming can never orphan a track or spawn duplicates.
 *  (The Extensions SDK has no Device.name setter, so the track is where the name can live.) */
export const TRACK_PATCH_SEP = " — ";
export function trackNameForPatch(baseName: string, patchId?: string): string {
  const nice = patchId ? PATCH_DISPLAY_NAMES[patchId] : undefined;
  return nice ? `${baseName}${TRACK_PATCH_SEP}${nice}` : baseName;
}
/** Strip a patch suffix back to the canonical track name. Safe on names that never had one. */
export function trackBaseName(name: string): string {
  const i = (name || "").indexOf(TRACK_PATCH_SEP);
  return i > 0 ? name.slice(0, i) : (name || "");
}

export function patchRole(patchId?: string): string {
  return (patchId && PATCH_ROLES[patchId]) || "synth";
}

/** The bank filename for a patch, so the sheet can name the rack to drag from Live's browser.
 *  Only Drift patches reach the bank — Live-only voices (Operator/Analog/Wavetable/…) have no
 *  exported rack, so they return undefined. */
export function rackFileName(patchId?: string): string | undefined {
  if (!patchId || !INSTRUMENT_PATCHES[patchId]) return undefined;
  const isDrift = INSTRUMENT_PATCHES[patchId].some((m) => m.aliases[0] === "osc 1 wave" || m.aliases[0] === "voice mode");
  if (!isDrift) return undefined;
  const nice = patchDisplayName(patchId);
  const slug = nice.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${patchRole(patchId)}-${slug}`;
}

export function patchDisplayName(patchId?: string): string {
  if (!patchId) return "—";
  return PATCH_DISPLAY_NAMES[patchId] ?? patchId;
}

/** Move mode: the four on-device tracks. Move's synth voice IS Drift, so every melodic
 *  track (Lead/Bass/Harmony) uses Drift with a Drift patch; Drums stays a Drum Rack (Move's
 *  drum voice). This keeps a generated Move set faithful to what the hardware actually runs. */
const MOVE_RECIPES: Record<"lead" | "bass" | "seq" | "chords" | "drums", DeviceRecipe> = {
  lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["Drift lead", "Filter Freq: opens", "Delay: 1/8 dotted", "Reverb: tail"], patch: "pwmLead" },
  bass: { instrument: "Drift", effects: ["Saturator"], macros: ["Drift sub", "Filter Freq: low", "Amp Decay: tight", "mono"], patch: "subBass" },
  seq: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["Drift sequence pluck", "Delay: 1/16", "Reverb: tail fills the gaps", "Filter: ride it live"], patch: "seqPluck" },
  chords: { instrument: "Drift", effects: ["Chorus-Ensemble", "Reverb"], macros: ["Drift poly pad", "Attack: slow", "Release: long", "Reverb: wide"], patch: "driftPad" },
  drums: { instrument: "Drum Rack", effects: ["Compressor"], macros: ["Move kit", "Compressor: glue"] },
};
/** Starter sound-profiles → Drift-only patch overrides for Move (Move's voice IS Drift, so
 *  a profile's character is expressed by choosing among the Drift patches). Keyed by the
 *  SOURCE part feeding the Move track. */
/** Starter sound-profiles → Drift-only TRANSLATIONS for Move. Move's voice is Drift, so:
 *  - if the profile already says Drift for a part, BOTH modes use exactly that patch
 *    (read directly from SOUND_PROFILES in moveRecipe — divergence is structurally impossible);
 *  - this table exists ONLY to translate the profile's NON-Drift instruments (Operator bells,
 *    Analog washes, Wavetable pads…) into the nearest Drift voice, or to voice a part the
 *    profile has no opinion on. Never duplicate a profile's Drift choice here. */
const MOVE_PROFILE_PATCHES: Record<string, Partial<Record<PartId, string>>> = {
  acidDub: { chords: "dubChordStab" },                                // Analog wash → dub stab
  berlinAnalogSeq: { pad: "prophet5Pad", chords: "tapeStrings" },     // Wavetable pad → a real poly study
  synthwaveNeon: { pad: "jupiter8Pad", chords: "obxBrass" },          // junoPad/stab → Jupiter + THE 80s brass
  tranceGlass: { pad: "jupiter8Pad" },                                // "OB Pad" → the lush 2-pole saw pad
  detroitEmotional: { lead: "glassBell", counterMelody: "glassBell", chords: "dreamKeys", pad: "prophet5Pad" }, // Operator bell / Analog stab
  jarreAirLead: { pad: "eminentStrings", chords: "cs80Brass" },       // Oxygène IS an Eminent 310 through a phaser
  jarreSequence: {},                                                  // all-Drift already
  dubChordHeavy: { chords: "dubChordStab", pad: "darkDrone" },        // THE dub chord → stab; pad stays drone
  glassAmbient: { lead: "iceLead", pad: "glassChoir", chords: "tapeStrings" }, // Tension bow / Wavetable
  cosmicFloat: { pad: "jupiter8Pad", chords: "cs80Brass" },           // Vangelis territory
  deepHouseVelvet: { chords: "dreamKeys", pad: "juno106Pad" },        // the Live side is literally a Juno pad
  brightBreaks: { chords: "dreamKeys" },                              // Analog stab → keys
};
/** Drift's oscillators have DIFFERENT wave lists — this bit us: an Osc 1 index written to Osc 2
 *  silently lands on the wrong shape. Verified by round-trip (we wrote 4 for Osc 2 intending
 *  "Saw"; Live exported "Rectangle" — which is exactly index 4 of the Osc 2 list below).
 *  Osc 1: seven shapes. Osc 2: five — no Shark Tooth, no Pulse (Pulse needs the Shape control,
 *  which only Osc 1 has). Always author by NAME and resolve the index through these tables. */
export const DRIFT_OSC1_WAVES = ["Sine", "Triangle", "Shark Tooth", "Saturated", "Saw", "Pulse", "Rectangle"] as const;
export const DRIFT_OSC2_WAVES = ["Sine", "Triangle", "Saturated", "Saw", "Rectangle"] as const;
/** Index of a wave NAME in the given oscillator's list, or -1 if that shape doesn't exist there. */
export function driftWaveIndex(osc: 1 | 2, name: string): number {
  const table: readonly string[] = osc === 1 ? DRIFT_OSC1_WAVES : DRIFT_OSC2_WAVES;
  return table.indexOf(name);
}

/** Generate a descriptive, sound-based name from captured Drift parameters (display-name →
 *  value pairs, as read from the SDK). Pure + deterministic so it can be unit-tested. Produces
 *  names like "Bright Saw Pluck", "Dark Mono Sub", "Wide Detuned Pad" — evocative but honest to
 *  what the knobs actually say. The extension guarantees uniqueness with a numeric suffix. */
export function describeDriftPatch(params: { name: string; value: number }[]): string {
  const get = (frag: string): number | undefined => {
    const p = params.find((x) => x.name.toLowerCase() === frag.toLowerCase())
      ?? params.find((x) => x.name.toLowerCase().includes(frag.toLowerCase()));
    return p?.value;
  };
  // Drift enum indices (confirmed): waves 0 Sine · 1 Triangle · 2 Shark Tooth · 3 Saturated ·
  // 4 Saw · 5 Pulse · 6 Rectangle; voice mode 0 Poly · 1 Mono · 2 Stereo · 3 Unison.
  const WAVE = ["Sine", "Triangle", "SharkTooth", "Saturated", "Saw", "Pulse", "Rectangle"];
  const wIdx = Math.round(get("osc 1 wave") ?? 4);
  const wave = WAVE[wIdx] ?? "Saw";
  const vm = Math.round(get("voice mode") ?? 0);
  const detune = Math.abs((get("osc 2 detune") ?? 0.5) - 0.5) * 14; // → semitones
  const osc2on = (get("osc 2 on") ?? 0) >= 0.5;

  // Filter + envelope shape (values are the SDK's normalized 0..1 for freq/time on this build).
  const cutoff01 = get("lp freq") ?? get("filter_frequency") ?? 0.6; // 0..1
  const decay01 = get("env 1 decay") ?? 0.4;
  const sustain01 = get("env 1 sustain") ?? 0.6;
  const attack01 = get("env 1 attack") ?? 0.0;
  const release01 = get("env 1 release") ?? 0.3;
  const res01 = get("lp res") ?? 0.2;

  // --- role: only claimed when the ENVELOPE makes it unambiguous. Bass-vs-lead is mostly about
  // played register (not in the patch), so we don't guess it — a sustaining tonal patch just gets
  // its timbre name. Pluck (short/no sustain) and Pad (slow attack / long release) ARE knowable. ---
  const glide = get("glide time") ?? get("glide") ?? 0;
  const plucky = sustain01 < 0.2 && decay01 < 0.6;
  const pad = attack01 > 0.35 || release01 > 0.6;
  let role: string;
  if (pad) role = "Pad";
  else if (plucky) role = "Pluck";
  // mono + glide is shared by leads AND 303 basses — register isn't in the patch, so never
  // claim "Lead". A squelchy gliding mono voice is honestly a "303"; otherwise stay neutral.
  else if (glide > 0.02 && vm === 1 && res01 > 0.6) role = "303";
  else role = "Synth";

  // --- adjectives, most characterful first, capped at two ---
  const adj: string[] = [];
  if (res01 > 0.7) adj.push("Squelch");
  else if (cutoff01 < 0.33) adj.push("Dark");
  else if (cutoff01 > 0.75) adj.push("Bright");
  if (vm === 3) adj.push("Super");
  else if (osc2on && detune > 0.18) adj.push("Detuned");
  else if (vm === 2) adj.push("Wide");
  if (adj.length < 2) {
    if (wave === "Pulse" || wave === "Rectangle") adj.push("Hollow");
    else if (wave === "Sine") adj.push("Pure");
    else if (wave === "Triangle") adj.push("Glassy");
    else if (wave === "Saturated") adj.push("Warm");
  }
  const waveWord = wave === "SharkTooth" ? "Shark" : wave;
  const parts = [...adj.slice(0, 2), role.includes(waveWord) ? "" : waveWord, role].filter(Boolean);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function moveRecipe(part: PartId, soundProfile?: string): DeviceRecipe {
  // External hardware beats any on-device voice: if the profile sends this part to
  // hardware, that recipe applies in Move Mode as well (no Drift is loaded over it).
  const prof = soundProfile ? SOUND_PROFILES[soundProfile]?.[part] : undefined;
  if (prof?.external) return prof;
  let base: DeviceRecipe;
  if (part === "piano") base = { instrument: "Drift", effects: ["Reverb"], macros: ["felt EP — soft hammers", "Reverb: room, close", "wide velocity: PLAY it"], patch: "feltEP" };
  else if (part === "lead" || part === "counterMelody") base = MOVE_RECIPES.lead;
  else if (part === "arp") base = MOVE_RECIPES.seq;   // a sequence pluck, not a PWM lead
  else if (part === "bass") base = MOVE_RECIPES.bass;
  else if (part === "drums") base = MOVE_RECIPES.drums;
  else base = MOVE_RECIPES.chords; // pad + chords → Drift poly pad
  let recipe = base;
  if (soundProfile) {
    // Single source of truth: a profile's Drift choice applies to BOTH modes verbatim.
    const prof = SOUND_PROFILES[soundProfile]?.[part];
    if (prof?.instrument === "Drift" && prof.patch) recipe = { ...base, patch: prof.patch };
    else {
      const translated = MOVE_PROFILE_PATCHES[soundProfile]?.[part];
      if (translated) recipe = { ...base, patch: translated };
    }
  }
  // VOICE-MODE SAFETY: pad/chords parts are POLYPHONIC (they play stacked chord notes). A mono
  // or unison patch would silently drop all but one note of every chord. If a profile/fallback
  // ever hands a polyphonic part a mono patch, substitute the neutral Drift poly pad instead.
  if ((part === "pad" || part === "chords") && recipe.patch && MONO_PATCHES.has(recipe.patch)) {
    recipe = { ...recipe, patch: "driftPad" };
  }
  // SINGLE SOURCE OF TRUTH for Move: the track's Drift IS the patch that gets exported, so the
  // track's effects must be the patch's own insert chain. Maintaining the two separately let them
  // drift apart — e.g. THE dub chord loaded Chorus+Reverb in Live while its preset carried the
  // Delay that defines the sound. Drums have no patch and keep their base chain.
  if (recipe.patch) {
    const eff = patchLiveEffects(recipe.patch);
    if (eff.length) recipe = { ...recipe, effects: eff };
  }
  return recipe;
}

/** Every built-in device name any recipe can request (for validation/tests). */
export const RECIPE_DEVICE_NAMES: string[] = (() => {
  const set = new Set<string>();
  for (const part of ["lead", "bass", "pad", "chords", "counterMelody", "arp", "drums"] as PartId[]) {
    const r = DEVICE_DEFAULT[part]; set.add(r.instrument); r.effects.forEach((e) => set.add(e));
  }
  for (const st of Object.keys(DEVICE_OVERRIDES) as StyleId[]) {
    const o = DEVICE_OVERRIDES[st]!;
    for (const part of Object.keys(o) as PartId[]) { const r = o[part]!; set.add(r.instrument); r.effects.forEach((e) => set.add(e)); }
  }
  return [...set];
})();

/** Plain-text / Markdown rendering of a song sheet — the reliable, webview-free
 *  way to read the info (written to a file next to the Set). */
export function songSheetMarkdown(s: SongSheet): string {
  const L: string[] = [];
  L.push(`# ${s.name}`);
  L.push("");
  L.push(`*MIDI Forge song sheet · ${s.createdAt} · ${s.moveMode ? "Ableton Move" : "Ableton Live"}*`);
  L.push("");
  L.push(`- **Genre:** ${s.styleLabel}`);
  L.push(`- **Key / Scale:** ${s.key}`);
  L.push(`- **Suggested BPM:** ${s.suggestedBpm}`);
  L.push(`- **Structure:** ${s.template}`);
  if (s.sectionPlan) L.push(`- **Bars per scene:** ${s.sectionPlan}`);
  L.push(`- **Progression:** ${s.progression}`);
  if (s.soundProfile) L.push(`- **Sound profile:** ${s.soundProfile}`);
  if (s.clipBars) L.push(`- **Clip length:** ${s.clipBars} bars (long evolving)`);
  L.push(`- **Song seed:** ${s.seed}`);
  L.push("");
  const st = s.story;
  if (st) {
    L.push(`## The idea`);
    L.push("");
    L.push(st.idea);
    L.push("");
    L.push(`## The style`);
    L.push("");
    L.push(st.style);
    L.push("");
    L.push(`## The sound`);
    L.push("");
    L.push(st.sound);
    L.push("");
    L.push(`## The arrangement`);
    L.push("");
    L.push(st.arrangement);
    if (st.sections.length) {
      L.push("");
      L.push(`| Scene | Bars | What it's for |`);
      L.push(`| --- | --- | --- |`);
      for (const sec of st.sections) L.push(`| ${sec.name} | ${sec.bars} | ${sec.note} |`);
    }
    L.push("");
    L.push(`## Playing it`);
    L.push("");
    L.push(st.performance);
    L.push("");
  }
  L.push(`## Instruments per track`);
  L.push("");
  L.push(`| Track | Instrument | Patch | Rack to drag | Tweak (macros) |`);
  L.push(`| --- | --- | --- | --- | --- |`);
  for (const t of s.tracks) L.push(`| ${t.track} | ${t.instrument} | **${t.patchName}** | ${t.rack ? `\`${t.rack}\`` : "—"} | ${(t.macros || []).join("; ")} |`);
  L.push("");
  L.push(`## Sound guide`);
  L.push("");
  for (const t of s.tracks) L.push(`- **${t.track}** (${t.patchName}): ${t.sound}`);
  L.push("");
  return L.join("\n");
}

// ---------- PRNG ----------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rng = () => number;
const chance = (r: Rng, p: number) => r() < p;
const pick = <T>(r: Rng, arr: T[]): T => arr[Math.floor(r() * arr.length)];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function rateBeats(rate: RateId): number {
  return rate === "1/4" ? 1 : rate === "1/8" ? 0.5 : rate === "1/16" ? 0.25 : 1 / 3;
}

/** Faster tempo -> shorter (more staccato) gate. Beats are tempo-independent, so
 *  this only shapes note *length*, not placement. */
function tempoGate(tempo: number | undefined): number {
  if (!tempo) return 1;
  return clamp(1.15 - (tempo - 90) * (0.35 / 60), 0.75, 1.2);
}

// ---------- scale helpers ----------
function scaleDegreeToMidi(deg: number, intervals: number[], root: number, octave: number): number {
  const len = intervals.length;
  const octShift = Math.floor(deg / len);
  const idx = ((deg % len) + len) % len;
  return root + (octave + 1) * 12 + intervals[idx] + octShift * 12;
}

/** Snap a MIDI pitch to the nearest pitch in root+scale (never moves > 6 st). */
function snapToScale(midi: number, intervals: number[], root: number): number {
  const pcSet = new Set(intervals.map((i) => (((root + i) % 12) + 12) % 12));
  for (let d = 0; d <= 6; d++) {
    if (pcSet.has((((midi - d) % 12) + 12) % 12)) return midi - d;
    if (pcSet.has((((midi + d) % 12) + 12) % 12)) return midi + d;
  }
  return midi;
}

function chordShapeDegrees(shape: ChordShape, rootDeg: number): number[] {
  switch (shape) {
    case "triad": return [rootDeg, rootDeg + 2, rootDeg + 4];
    case "seventh": return [rootDeg, rootDeg + 2, rootDeg + 4, rootDeg + 6];
    case "ninth": return [rootDeg, rootDeg + 2, rootDeg + 4, rootDeg + 6, rootDeg + 8];
    case "sus": return [rootDeg, rootDeg + 3, rootDeg + 4];
    case "add9": return [rootDeg, rootDeg + 2, rootDeg + 4, rootDeg + 8]; // Xtal color
  }
}

function humVel(r: Rng, base: number, humanize: number): number {
  const spread = (humanize / 100) * 28;
  return clamp(Math.round(base + (r() - 0.5) * spread), 1, 127);
}

// ---------- context ----------
interface Ctx {
  userHumanize?: number; // the dial as the user set it (cfg.humanize may be DNA-overridden)
  mix?: Record<DnaDim, number>; // v0.85 resolved per-dimension strengths
  rMotif?: () => number;        // v0.85 motif-bend randomness (song-seeded when locked)
  rRhythm?: () => number;       // v0.85 rhythmic-ornament randomness (song-seeded when locked)
  regOctave?: number;           // v0.85 interpolated base octave (register dimension)
  cfg: ForgeConfig;
  traits: StyleTraits;
  intervals: number[];
  r: Rng;
  totalBeats: number;
  step: number;
  prog: number[];
  swing: number;
  gate: number;
  dna?: MusicalDNA;
  strength: number;
}

function chordAt(ctx: Ctx, beat: number): number {
  const bar = Math.floor(beat / BEATS_PER_BAR);
  return ctx.prog[bar % ctx.prog.length];
}

/** Delay every other grid step for swing feel. */
function applySwing(t: number, step: number, swing: number): number {
  if (swing <= 0) return t;
  const idx = Math.round(t / step);
  return idx % 2 === 1 ? t + swing * step * 0.66 : t;
}

// ---------- parts ----------
function genChords(ctx: Ctx, sustained = false): ForgeNote[] {
  const { cfg, traits, intervals, r, gate } = ctx;
  const notes: ForgeNote[] = [];
  let prevUpper: number[] = [];
  let bandLo = 0, bandHi = 127; // register band set from the first voicing
  // Pad part always sustains; a rhythmic Chords part on a pad-style falls back
  // to a downbeat placement so it doesn't duplicate the Pad.
  const place: ChordPlacement = sustained
    ? traits.chordPlacement === "wash" ? "wash" : "pad"
    : traits.chordPlacement === "pad"
      ? "downbeat"
      : traits.chordPlacement;

  for (let bar = 0; bar < cfg.bars; bar++) {
    const rootDeg = ctx.prog[bar % ctx.prog.length];
    const degs = chordShapeDegrees(traits.chordShape, rootDeg);
    let voices = degs.map((d) => scaleDegreeToMidi(d, intervals, cfg.root, cfg.octave));

    // Voice leading (keyboard voicing): bass root sits an octave below, folded
    // into one octave band; each UPPER voice moves to the nearest octave
    // realization of its chord tone (matched by sorted position to the previous
    // voicing) and stays inside a register band so voicings don't drift. Minimal
    // motion + common tones is what makes progressions sound emotional on records.
    {
      const anchor = scaleDegreeToMidi(0, intervals, cfg.root, cfg.octave - 1);
      let rootPitch = voices[0] - 12;
      while (rootPitch < anchor) rootPitch += 12;
      while (rootPitch > anchor + 11) rootPitch -= 12;

      const upperTones = voices.slice(1);
      if (!prevUpper.length) {
        prevUpper = upperTones.slice().sort((a, b) => a - b);
        const center = prevUpper.reduce((s, v) => s + v, 0) / Math.max(1, prevUpper.length);
        bandLo = Math.round(center) - 9; bandHi = Math.round(center) + 9;
      } else {
        const targets = prevUpper;
        const placed = upperTones.map((v, i) => {
          const t = targets[Math.min(i, targets.length - 1)];
          let p = v;
          while (p - t > 6) p -= 12;
          while (t - p > 6) p += 12;
          // register band: never drift beyond ±8 of the original voicing center
          while (p > bandHi) p -= 12;
          while (p < bandLo) p += 12;
          return p;
        }).sort((a, b) => a - b);
        prevUpper = placed;
      }
      voices = [rootPitch, ...prevUpper];
    }

    // The Andalusian "magic note": on the v chord, raise its third to make a major
    // V (harmonic-minor dominant) — exempt from scale-lock so it survives.
    let chromaticIdx = -1;
    if (presetRaisesV(cfg.progressionPreset) && rootDeg % intervals.length === 4 && voices.length > 1) {
      voices = voices.map((v, i) => (i === 1 ? v + 1 : v));
      chromaticIdx = 1;
    }

    let hits: { at: number; dur: number; vel: number }[];
    if (place === "wash") {
      // atmospheric: soft whole-bar sustain, overlapping slightly into the next bar
      hits = [{ at: 0, dur: BEATS_PER_BAR * 1.05, vel: 56 }];
    } else if (place === "pad") {
      hits = [{ at: 0, dur: BEATS_PER_BAR, vel: 70 }];
    } else if (place === "stab") {
      hits = [];
      for (let b = 0; b < BEATS_PER_BAR; b++) {
        if (chance(r, 0.4 + cfg.density / 260)) hits.push({ at: b + 0.5, dur: 0.4, vel: 80 });
      }
      if (!hits.length) hits.push({ at: 0.5, dur: 0.4, vel: 80 });
    } else if (place === "swung") {
      hits = [{ at: 0, dur: 1.5, vel: 82 }];
      if (chance(r, 0.5 + cfg.density / 220)) hits.push({ at: 1.66, dur: 0.8, vel: 72 });
      if (chance(r, cfg.density / 180)) hits.push({ at: 2.5, dur: 1, vel: 70 });
    } else {
      hits = [{ at: 0, dur: 2, vel: 82 }];
      if (chance(r, cfg.density / 140)) hits.push({ at: 2.5, dur: 1, vel: 70 });
      if (chance(r, cfg.density / 220)) hits.push({ at: 3, dur: 1, vel: 66 });
    }

    for (const h of hits) {
      const start = applySwing(bar * BEATS_PER_BAR + h.at, 0.5, ctx.swing);
      voices.forEach((v, i) => {
        notes.push({
          pitch: v, startTime: start, duration: h.dur * gate,
          velocity: humVel(r, h.vel - (i === 0 ? 0 : 4), cfg.humanize),
          ...(i === chromaticIdx ? { keepChromatic: true } : {}),
        });
      });
    }
  }
  return notes;
}

function genBass(ctx: Ctx): ForgeNote[] {
  const { cfg, traits } = ctx;
  if (traits.bass === "acid") return genAcidBass(ctx);
  return genBassGeneric(ctx);
}

/**
 * TB-303 style acid bass. Faithful to the classic methodology:
 *  - 1/16 foundation, root-dominant
 *  - 30–50% of steps removed so the kick punches through (groove holes)
 *  - accents (high velocity) biased to offbeats and the step before a downbeat
 *  - octave jumps PAIRED with accents (staccato low root ↔ accented high octave)
 *  - slides: a slide note is held to overlap the next note (legato → portamento
 *    on a 303/Serum), and carries a `slide` marker
 *  - minimal pitch set: root, 5th, occasional ♭2, rare tritone for warehouse bite
 */
function genAcidBass(ctx: Ctx): ForgeNote[] {
  const { cfg, intervals, r, step, totalBeats, gate } = ctx;
  const oct = cfg.octave - 1; // root sits mid-band so accented octave jumps fit above it
  const nSteps = Math.max(1, Math.round(totalBeats / step));
  // rest 30–50%, a touch more as density drops (more groove holes when sparse)
  const restProb = clamp(0.30 + (100 - cfg.density) / 350, 0.30, 0.50);
  const len = intervals.length;

  type Cell = { play: boolean; rootDeg: number; deg: number; octUp: boolean; accent: boolean; tritone: boolean };
  const cells: Cell[] = [];
  for (let i = 0; i < nSteps; i++) {
    const t = i * step;
    const rootDeg = chordAt(ctx, t);
    const pos = ((t % 1) + 1) % 1; // 0, .25, .5, .75 within the beat
    const isDown = Math.abs(pos) < 1e-6;
    const isOff = Math.abs(pos - 0.5) < 1e-6;
    const isPre = Math.abs(pos - 0.75) < 1e-6; // the "a" leading into the next beat

    let play = !chance(r, restProb);
    if (isDown && chance(r, 0.35)) play = true; // keep a root pulse alive

    let deg = rootDeg, octUp = false, accent = false, tritone = false;
    if (play) {
      // accents love the offbeat and the pre-downbeat; downbeats stay flatter
      const accentBase = isOff ? 0.5 : isPre ? 0.42 : isDown ? 0.12 : 0.22;
      accent = chance(r, accentBase);
      if (accent && chance(r, 0.55)) {
        octUp = true; // octave jump paired with the accent
      } else {
        const p = r();
        if (p > 0.88) deg = rootDeg + 4;       // 5th
        else if (p > 0.80) deg = rootDeg + 1;  // ♭2 (diatonic in Phrygian; snapped otherwise)
        else if (p > 0.77) tritone = true;     // rare chromatic tritone — warehouse dissonance
        // else: stays on the root (root-dominant line)
      }
    }
    cells.push({ play, rootDeg, deg, octUp, accent, tritone });
  }

  // pitches first, so a slide only fires when it actually glides to a NEW pitch
  const pitchOf = (c: Cell) => c.tritone
    ? scaleDegreeToMidi(c.rootDeg, intervals, cfg.root, oct) + 6
    : scaleDegreeToMidi(c.deg + (c.octUp ? len : 0), intervals, cfg.root, oct);

  const notes: ForgeNote[] = [];
  for (let i = 0; i < nSteps; i++) {
    const c = cells[i];
    if (!c.play) continue;
    const t = i * step;
    let j = i + 1;
    while (j < nSteps && !cells[j].play) j++;
    const gap = j - i; // steps until the next note

    const basePitch = pitchOf(c);
    const nextPitch = j < nSteps ? pitchOf(cells[j]) : basePitch;
    // slide into an adjacent note only when the pitch actually changes (portamento)
    const slide = gap === 1 && nextPitch !== basePitch && chance(r, 0.4);
    let duration: number;
    if (slide) duration = step * 1.1;                                  // UN-gated: guarantees overlap → legato
    else if (gap === 1) duration = step * 0.55 * gate;                 // staccato 16th
    else duration = Math.min(step * gap * 0.9, step * (0.6 + gap * 0.5)) * gate; // ring into the gap

    notes.push({
      pitch: basePitch,
      startTime: applySwing(t, step, ctx.swing),
      duration,
      velocity: humVel(r, c.accent ? 124 : 88, cfg.humanize),
      ...(slide ? { slide: true } : {}),
      ...(c.tritone ? { keepChromatic: true } : {}),
    });
  }
  return notes;
}

function genBassGeneric(ctx: Ctx): ForgeNote[] {
  const { cfg, traits, intervals, r, step, totalBeats, gate } = ctx;
  const notes: ForgeNote[] = [];
  const oct = cfg.octave - 1;
  const mode = traits.bass;

  for (let t = 0; t + 1e-6 < totalBeats; t += step) {
    const rootDeg = chordAt(ctx, t);
    const posInBeat = t % 1;
    const onOffbeat = Math.abs(posInBeat - 0.5) < 1e-6;
    const onBeat = Math.abs(posInBeat) < 1e-6;

    let play = false, vel = 90, deg = rootDeg, dur = step * 0.85;

    if (mode === "offbeatRoll") {
      play = onOffbeat || (onBeat && chance(r, 0.25));
      if (onBeat) vel = 78;
    } else if (mode === "octave") {
      play = onBeat || onOffbeat;
      if (onOffbeat && chance(r, 0.6)) deg = rootDeg + intervals.length;
    } else if (mode === "walking") {
      play = onBeat || (onOffbeat && chance(r, 0.4));
      deg = rootDeg + pick(r, [0, 0, 2, 4, -1]);
      dur = step * 0.9;
    } else {
      play = chance(r, 0.3 + cfg.density / 240) && (onBeat || onOffbeat);
    }
    if (!play) continue;
    if (chance(r, (100 - cfg.density) / 400)) continue;

    if (mode === "offbeatRoll") {
      const roll = r();
      if (roll > 0.85) deg = rootDeg + intervals.length;
      else if (roll > 0.7) deg = rootDeg + 4;
    }

    const pitch = scaleDegreeToMidi(deg, intervals, cfg.root, oct);
    notes.push({
      pitch,
      startTime: applySwing(t, step, ctx.swing),
      duration: dur * gate,
      velocity: humVel(r, vel, cfg.humanize),
    });
  }
  return notes;
}

/** v0.76.1: motif → one-bar ostinato cell. Onsets come from cumulative durations (rhythm ORDER and
 *  spacing preserved); a step that is not an onset holds the previous chord-tone index, silent.
 *  Motifs longer than a bar wrap; shorter ones repeat to fill it. Pure and deterministic. */
export function buildMotifCell(m: Motif, stepsPerBar: number): { idx: number; oct: number; on: boolean }[] {
  const cell = Array.from({ length: stepsPerBar }, () => ({ idx: 0, oct: 0, on: false }));
  const total = Math.max(1, m.rhythm.reduce((a, b) => a + Math.max(1, b || 1), 0));
  let t = 0, lastIdx = 0;
  for (let pass = 0; pass < Math.max(1, Math.ceil(stepsPerBar / total)); pass++) {
    for (let j = 0; j < m.degrees.length; j++) {
      const at = t % stepsPerBar;
      const d = m.degrees[j];
      lastIdx = ((d % 4) + 4) % 4;
      if (t < stepsPerBar * (pass + 1)) cell[at] = { idx: lastIdx, oct: d >= 4 ? 1 : d < 0 ? 0 : 0, on: true };
      t += Math.max(1, m.rhythm[j] || 1);
    }
  }
  for (let i = 0; i < stepsPerBar; i++) if (!cell[i].on) cell[i].idx = i ? cell[i - 1].idx : lastIdx;
  return cell;
}

function genArp(ctx: Ctx): ForgeNote[] {
  const { cfg, traits, intervals, r, step, totalBeats, gate } = ctx;
  const notes: ForgeNote[] = [];

  // Evolving ostinato (Betrayal / Rubycon): one repeating cell; every 2 bars
  // exactly ONE step mutates (new chord tone, octave flip, or gate toggle).
  // Hypnosis through slow, audible change — the sequencer as a living thing.
  if (cfg.evolveSeq ?? traits.evolve) {
    const stepsPerBar = Math.max(1, Math.round(BEATS_PER_BAR / step));
    // SONG MOTIF STATE (v0.76): with a DNA the cell is derived from the SONG's motif with a
    // DNA-seeded RNG — identical in every scene — instead of a fresh random cell per section.
    // Motif degrees → chord-tone index, motif rhythm → which steps sound. Strength blends
    // toward a free cell (still DNA-seeded, so still the same in every scene).
    const useDna = !!ctx.dna && ctx.strength > 0;
    const dr = useDna ? mulberry32(((ctx.dna!.seed | 0) ^ 0x51ed270b) >>> 0) : r;
    // v0.76.1: key the cell off the SONG's canonical motif (never the scene-transformed copy) and
    // ignore scene density, so every scene shares one cell. Rhythm is preserved by ONSET: cumulative
    // motif durations decide which steps sound (and in what order), not a shuffled sum. Scene
    // development happens elsewhere (arp mutation every 2 bars, register, gate) — deliberately.
    const m = useDna ? (ctx.dna!.songMotif ?? ctx.dna!.motif) : undefined;
    const keep = useDna ? ctx.strength / 100 : 0;
    const canonical = m && m.degrees.length ? buildMotifCell(m, stepsPerBar) : null;
    // With a DNA the cell IS the canonical cell — no per-step blend (a blend re-introduced density
    // and scene dependence). The 2-bar single-step mutation below is the deliberate development.
    const rhyFlip = ctx.cfg.dnaMix?.rhythm == null ? 0 : clamp((100 - ctx.cfg.dnaMix.rhythm) / 200, 0, 0.5); // RHYTHM dimension (v0.85, only when set)
    const cell = canonical
      ? canonical.map((c, i) => (i > 0 && dr() < rhyFlip ? { ...c, on: !c.on } : { ...c }))
      : Array.from({ length: stepsPerBar }, () => ({ idx: Math.floor(dr() * 4), oct: dr() < 0.22 ? 1 : 0, on: dr() < 0.5 + cfg.density / 260 }));
    void keep;
    if (!cell.some((c) => c.on)) cell[0].on = true;

    const totalBars = Math.ceil(totalBeats / BEATS_PER_BAR);
    for (let bar = 0; bar < totalBars; bar++) {
      // mutate one step at each new 2-bar window (after the first)
      if (bar > 0 && bar % 2 === 0) { // one audible mutation per 2-bar window — the style's own evolution, kept at every strength
        const pos = Math.floor(r() * stepsPerBar);
        const kind = r();
        if (kind < 0.5) cell[pos].idx = (cell[pos].idx + 1 + Math.floor(r() * 3)) % 4;
        else if (kind < 0.8) cell[pos].oct = cell[pos].oct ? 0 : 1;
        else cell[pos].on = !cell[pos].on;
        if (!cell.some((c) => c.on)) cell[pos].on = true;
      }
      const barStart = bar * BEATS_PER_BAR;
      const rootDeg = chordAt(ctx, barStart);
      const chord = chordShapeDegrees(traits.chordShape, rootDeg).slice(0, 4);
      for (let s = 0; s < stepsPerBar; s++) {
        const c = cell[s];
        if (!c.on) continue;
        const t = barStart + s * step;
        if (t + 1e-6 >= totalBeats) break;
        const deg = chord[c.idx % chord.length] + c.oct * intervals.length;
        notes.push({
          pitch: scaleDegreeToMidi(deg, intervals, cfg.root, cfg.octave),
          startTime: applySwing(t, step, ctx.swing),
          duration: step * 0.9 * gate,
          velocity: humVel(r, s % 4 === 0 ? 92 : 80, cfg.humanize),
        });
      }
    }
    return notes;
  }

  const dirR = ctx.dna && ctx.strength > 0 ? mulberry32(((ctx.dna.seed | 0) ^ 0x2545f491) >>> 0) : r;
  const dir = pick(dirR, traits.arpDir);
  let i = 0, going = 1;

  for (let t = 0; t + 1e-6 < totalBeats; t += step) {
    if (chance(r, (100 - cfg.density) / 260)) continue;
    const rootDeg = chordAt(ctx, t);
    const chord = chordShapeDegrees(traits.chordShape, rootDeg).slice(0, 4);
    const pool = [...chord, ...chord.map((d) => d + intervals.length)];
    let idx: number;
    if (dir === "up") idx = i % pool.length;
    else if (dir === "down") idx = pool.length - 1 - (i % pool.length);
    else if (dir === "random") idx = Math.floor(r() * pool.length);
    else {
      idx = clamp(i, 0, pool.length - 1);
      if (idx >= pool.length - 1) going = -1;
      if (idx <= 0) going = 1;
    }
    idx = clamp(idx, 0, pool.length - 1);
    const pitch = scaleDegreeToMidi(pool[idx], intervals, cfg.root, cfg.octave);
    notes.push({
      pitch,
      startTime: applySwing(t, step, ctx.swing),
      duration: step * 0.9 * gate,
      velocity: humVel(r, 84, cfg.humanize),
    });
    i = dir === "updown" ? i + going : i + 1;
  }
  return notes;
}

/** Shared melodic-line generator. `role` shifts register/phrasing so a Lead and a
 *  Counter Melody don't collide: the counter sits lower, sparser and more legato. */
function genMelodicLine(ctx: Ctx, role: "lead" | "counter"): ForgeNote[] {
  const { cfg, traits, intervals, r, step, totalBeats, gate } = ctx;
  const notes: ForgeNote[] = [];
  const counter = role === "counter";
  const octShift = counter ? 0 : 1; // lead an octave above counter
  let deg = counter ? 2 : 0; // counter starts on the third for contrast
  const restBias = counter ? 0.18 : 0;
  const restP = clamp(0.55 - cfg.density / 200 + restBias, 0.08, 0.75);

  for (let t = 0; t + 1e-6 < totalBeats; t += step) {
    const strong = Math.abs(t % 1) < 1e-6;
    // counter favours the off-beats (call/response against the lead)
    if (counter && strong && chance(r, 0.35)) continue;
    if (!strong && chance(r, restP)) continue;
    const rootDeg = chordAt(ctx, t);
    const chordTones = chordShapeDegrees(traits.chordShape, rootDeg);
    if (strong || (counter && chance(r, 0.5))) {
      deg = chordTones.reduce((best, c) => (Math.abs(c - deg) < Math.abs(best - deg) ? c : best));
    } else {
      deg += pick(r, counter ? [-1, -1, 1, 1, -2, 2] : [-2, -1, -1, 1, 1, 2]);
    }
    deg = clamp(deg, -3, intervals.length + 3);
    const pitch = scaleDegreeToMidi(deg, intervals, cfg.root, cfg.octave + octShift);
    const long = (strong && chance(r, 0.4)) || counter;
    notes.push({
      pitch,
      startTime: applySwing(t, step, ctx.swing),
      duration: step * (long ? (counter ? 2.4 : 3) : 1.6) * gate,
      velocity: humVel(r, strong ? (counter ? 80 : 92) : counter ? 68 : 78, cfg.humanize),
    });
  }
  return notes;
}

/** Classical accompaniment figurations for the Piano part. "auto" resolves by genre. */
export type PianoFigure = "auto" | "broken" | "alberti" | "nocturne" | "ostinato" | "chorale";
export const PIANO_FIGURE_LABELS: Record<Exclude<PianoFigure, "auto">, string> = {
  broken: "Broken chords (open, pedalled)",
  alberti: "Alberti bass (Mozart)",
  nocturne: "Nocturne (Chopin — wide sweep)",
  ostinato: "Ostinato (minimalist 8ths)",
  chorale: "Chorale (block harmony)",
};
/** Genre → figuration. Spacious genres sweep; sequenced genres roll; soul genres stack. */
export function pianoFigureFor(style: StyleId, figure?: PianoFigure): Exclude<PianoFigure, "auto"> {
  if (figure && figure !== "auto") return figure;
  switch (style) {
    case "melodicTechno": case "dubTechno": case "ambient": return "nocturne";
    case "classicSeq": case "trance": case "acid": return "ostinato";
    case "deepHouse": case "breakbeat": return "alberti";
    case "detroit": case "synthwave": return "chorale";
    default: return "broken"; // lofi + anything future
  }
}

/** Piano — the song's idea voiced as a PIECE, in a real classical figuration.
 *  RH restates the DNA motif (ornament from the 2nd statement, octave lift on the last);
 *  LH plays one of five accompaniment figures resolved from the genre (or the user's dial):
 *    broken   — open pedalled arpeggio (root→5th→10th), long overlapping holds
 *    alberti  — Mozart's rocking eighths (root–5th–3rd–5th)
 *    nocturne — Chopin's wide left-hand sweep up the bar, blurred under the pedal
 *    ostinato — minimalist rolling eighths (Glass/Einaudi), accented in twos
 *    chorale  — block harmony: LH open fifth restrikes, RH melody harmonised beneath
 *  Wide velocity + gentle rubato throughout. cfg.pianoSparse => statement-only mode. */
function genPiano(ctx: Ctx): ForgeNote[] {
  const { cfg, intervals, r, totalBeats, prog, dna, strength } = ctx;
  const notes: ForgeNote[] = [];
  const bars = Math.max(1, Math.round(totalBeats / BEATS_PER_BAR));
  const sparse = !!cfg.pianoSparse;
  const figure = pianoFigureFor(cfg.style, cfg.pianoFigure);
  const rub = () => (r() - 0.5) * (figure === "nocturne" ? 0.06 : 0.04); // nocturne breathes more
  const vj = (v: number) => clamp(Math.round(v + (r() - 0.5) * 10), 1, 127);
  // A piano's hands live in a FIXED register, whatever octave the synth parts are tuned to.
  // Genres like acid set cfg.octave low for the 303 — inherited raw, the LH landed at
  // MIDI 21–33 where the Felt EP is inaudible mud. Clamp the base to a pianist's range and
  // guard the extremes (floor D1, ceiling ~E7) by octave-shifting, never by chromatic moves.
  const pOct = clamp(cfg.octave, 3, 4);
  const reg = (p: number) => { let x = p; while (x < 38) x += 12; while (x > 100) x -= 12; return x; };
  const deg2midi = (deg: number, oct: number) => reg(scaleDegreeToMidi(deg, intervals, cfg.root, oct));

  // The motif the RH restates: the song's DNA when identity is on, else a local
  // contour derived from this part's own seeded stream (still deterministic).
  const useDna = !!dna && strength > 0;
  let degrees = useDna ? dna!.motif.degrees.slice() : [0];
  let rhythm = useDna ? dna!.motif.rhythm.slice() : [2];
  if (!useDna) {
    for (let i = 1; i < 4; i++) degrees.push(clamp(degrees[i - 1] + pick(r, [-2, -1, 1, 1, 2]), 0, 6));
    rhythm = Array.from({ length: 4 }, () => pick(r, [1, 2, 2, 4]));
  }

  const stmtEvery = sparse ? 4 : 2; // a statement every N bars
  const lhOct = pOct - 1;
  // ostinato: let the pattern establish for one full cycle before the melody enters
  const rhStartBar = figure === "ostinato" && bars > stmtEvery && !sparse ? stmtEvery : 0;

  for (let bar = 0; bar < bars; bar++) {
    const barStart = bar * BEATS_PER_BAR;
    const rootDeg = prog[bar % prog.length];
    const isStmtBar = bar % stmtEvery === 0;

    // ---------------- LEFT HAND ----------------
    if (sparse) {
      if (isStmtBar) {
        notes.push({ pitch: deg2midi(rootDeg, lhOct), startTime: barStart, duration: BEATS_PER_BAR * Math.min(stmtEvery, bars - bar), velocity: vj(58) });
        notes.push({ pitch: deg2midi(rootDeg + 4, lhOct), startTime: barStart + rub() * 0.5, duration: BEATS_PER_BAR, velocity: vj(54) });
      }
    } else if (figure === "broken") {
      notes.push({ pitch: deg2midi(rootDeg, lhOct), startTime: barStart, duration: BEATS_PER_BAR, velocity: vj(66) });
      notes.push({ pitch: deg2midi(rootDeg + 4, lhOct), startTime: barStart + 1.5 + rub(), duration: BEATS_PER_BAR - 1.5, velocity: vj(60) });
      if (cfg.density >= 40) notes.push({ pitch: deg2midi(rootDeg + 9, lhOct), startTime: barStart + 2.5 + rub(), duration: BEATS_PER_BAR - 2.5, velocity: vj(62) });
    } else if (figure === "alberti") {
      // root–5th–3rd–5th rocking eighths; quarters when the section is thin
      const cell = [0, 4, 2, 4];
      const stepB = cfg.density >= 40 ? 0.5 : 1.0;
      for (let k = 0; k * stepB < BEATS_PER_BAR; k++) {
        const deg = rootDeg + cell[k % 4];
        const onBeat = (k * stepB) % 1 === 0;
        notes.push({ pitch: deg2midi(deg, lhOct), startTime: barStart + k * stepB + (k ? rub() * 0.5 : 0), duration: stepB * 0.92, velocity: vj(onBeat ? 64 : 56) });
      }
    } else if (figure === "nocturne") {
      // wide sweep up the bar — low root, then 5th, octave, 10th — everything held (pedal blur)
      const sweep: Array<[number, number, number, number]> = [ // [degOffset, octShift, at, vel]
        [0, -1, 0, 68], [4, 0, 0.5, 58], [7, 0, 1.0, 60], [9, 0, 1.5, 63],
      ];
      for (const [dOff, oShift, at, v] of sweep)
        notes.push({ pitch: deg2midi(rootDeg + dOff, lhOct + oShift), startTime: barStart + at + (at ? rub() : 0), duration: BEATS_PER_BAR - at, velocity: vj(v) });
      if (cfg.density >= 55) // a second crest late in the bar
        notes.push({ pitch: deg2midi(rootDeg + 11, lhOct), startTime: barStart + 2.5 + rub(), duration: BEATS_PER_BAR - 2.5, velocity: vj(56) });
    } else if (figure === "ostinato") {
      // rolling 6-note cycle over 8 eighths — the cycle drifts across the barline (Glass)
      const cyc = [0, 4, 7, 9, 7, 4];
      for (let k = 0; k < 8; k++) {
        const gIdx = bar * 8 + k; // GLOBAL index: the cycle never resets at the barline
        const deg = rootDeg + cyc[gIdx % 6];
        notes.push({ pitch: deg2midi(deg, lhOct), startTime: barStart + k * 0.5 + (k ? rub() * 0.5 : 0), duration: 0.56, velocity: vj(k % 4 === 0 ? 66 : k % 2 === 0 ? 58 : 52) });
      }
    } else { // chorale
      // open fifth restruck each half bar — the harmony lives in the RH stack
      for (const at of [0, 2]) {
        notes.push({ pitch: deg2midi(rootDeg, lhOct), startTime: barStart + at + (at ? rub() * 0.5 : 0), duration: 2.0, velocity: vj(at === 0 ? 66 : 58) });
        notes.push({ pitch: deg2midi(rootDeg + 4, lhOct), startTime: barStart + at + rub() * 0.5, duration: 2.0, velocity: vj(at === 0 ? 58 : 52) });
      }
    }

    // ---------------- RIGHT HAND ----------------
    if (!isStmtBar || bar < rhStartBar) continue;
    const stmtIdx = Math.floor(bar / stmtEvery);
    const lastStmt = bar + stmtEvery >= bars;
    const lift = lastStmt && bars > stmtEvery ? 12 : 0; // final restatement lifts an octave
    const rhythmScale = figure === "nocturne" ? 0.75 : 0.5; // nocturne sings longer
    let t = barStart + 0.5 + rub(); // breathe after the LH downbeat
    let prevDeg: number | null = null;
    for (let i = 0; i < degrees.length; i++) {
      const deg = rootDeg + degrees[i];
      const pitch = reg(deg2midi(deg, pOct + 1) + lift);
      const durBeats = Math.max(0.5, rhythm[i % rhythm.length] * rhythmScale);
      const pos = degrees.length <= 1 ? 0.5 : i / (degrees.length - 1);
      const vel = vj(76 + Math.round(32 * Math.sin(Math.PI * Math.min(1, pos * 1.15))));
      // alberti: classical passing eighth filling gaps of a third or more
      if (figure === "alberti" && prevDeg !== null && Math.abs(deg - prevDeg) >= 2 && cfg.density >= 50 && !sparse) {
        const mid = Math.round((deg + prevDeg) / 2);
        notes.push({ pitch: reg(deg2midi(mid, pOct + 1) + lift), startTime: Math.max(barStart, t - 0.28 + rub()), duration: 0.26, velocity: vj(vel - 16) });
      }
      // ornament: from the SECOND statement on, an upper-neighbour grace before the last tone
      if (i === degrees.length - 1 && stmtIdx > 0 && !sparse && cfg.density >= 50 && figure !== "chorale") {
        notes.push({ pitch: reg(deg2midi(deg + 1, pOct + 1) + lift), startTime: Math.max(barStart, t - 0.25 + rub()), duration: 0.22, velocity: vj(vel - 18) });
      }
      notes.push({ pitch, startTime: t, duration: durBeats * 1.3, velocity: vel }); // ×1.3 = pedal overlap
      // chorale: harmonise the melody — stack a 3rd and a 6th below inside the scale
      if (figure === "chorale" && !sparse) {
        notes.push({ pitch: reg(deg2midi(deg - 2, pOct + 1) + lift), startTime: t, duration: durBeats * 1.25, velocity: vj(vel - 14) });
        if (cfg.density >= 50) notes.push({ pitch: reg(deg2midi(deg - 5, pOct + 1) + lift), startTime: t + rub() * 0.3, duration: durBeats * 1.25, velocity: vj(vel - 20) });
      }
      prevDeg = deg;
      t += durBeats;
      if (t >= barStart + BEATS_PER_BAR * Math.min(stmtEvery, 2) - 0.25) break; // never crowd the next statement
    }
  }
  return notes;
}

function genDrums(ctx: Ctx): ForgeNote[] {
  const { cfg, traits, r, totalBeats } = ctx;
  // A starter's drumFeel overrides the style's default kit so starters sound distinct.
  const FEEL_TO_KIT: Record<DrumFeel, DrumKit> = {
    fourFloor: "fourFloor", breakbeat: "breakbeat", lofiSwing: "house",
    minimalDub: "sparse", acidJack: "electro", ambientNone: "none",
  };
  const kit = cfg.drumFeel ? FEEL_TO_KIT[cfg.drumFeel] : traits.drums;
  const D = { ...DRUM_MAP, ...(cfg.drumMap ?? {}) }; // real pad notes when available
  // Kit-aware note resolver: when a kit map is supplied, a role the kit can't place is
  // DROPPED (returns null) rather than firing an empty GM pad — except the essential
  // kick/snare/closedHat, which fall back to the nearest populated pad so the groove survives.
  const kitMode = cfg.drumMap != null;
  const populated = kitMode ? [...new Set(Object.values(cfg.drumMap!))] : [];
  const ESSENTIAL = new Set(["kick", "snare", "closedHat"]);
  const roleNote = (role: keyof typeof DRUM_MAP): number | null => {
    if (!kitMode) return DRUM_MAP[role];
    if (cfg.drumMap![role] !== undefined) return cfg.drumMap![role]!;
    if (ESSENTIAL.has(role)) return mapNoteToKit(DRUM_MAP[role], populated) ?? populated[0] ?? DRUM_MAP[role];
    return null; // non-essential role with no pad in this kit → drop
  };
  const notes: ForgeNote[] = [];
  const d = cfg.density / 100;
  const sw = ctx.swing;
  const push = (role: keyof typeof DRUM_MAP, at: number, vel: number, swung = false) => {
    const pitch = roleNote(role);
    if (pitch == null) return;
    notes.push({ pitch, startTime: swung ? applySwing(at, 0.25, sw) : at, duration: 0.1, velocity: vel });
  };

  for (let bar = 0; bar * BEATS_PER_BAR < totalBeats; bar++) {
    const base = bar * BEATS_PER_BAR;
    if (kit === "none") continue;

    if (kit === "fourFloor" || kit === "house") {
      for (let b = 0; b < 4; b++) push("kick", base + b, humVel(r, 112, cfg.humanize));
      push("clap", base + 1, humVel(r, 100, cfg.humanize));
      push("clap", base + 3, humVel(r, 100, cfg.humanize));
    } else if (kit === "electro") {
      [0, 0.75, 1.5, 2, 2.75, 3.5].forEach((p, i) => {
        if (i === 0 || i === 3 || chance(r, 0.5 + d * 0.4))
          push("kick", base + p, humVel(r, 110, cfg.humanize));
      });
      push("clap", base + 1, humVel(r, 98, cfg.humanize));
      push("clap", base + 3, humVel(r, 98, cfg.humanize));
    } else if (kit === "breakbeat") {
      push("kick", base + 0, humVel(r, 112, cfg.humanize));
      if (chance(r, 0.7)) push("kick", base + 1.75, humVel(r, 100, cfg.humanize), true);
      if (chance(r, 0.5)) push("kick", base + 2.5, humVel(r, 96, cfg.humanize), true);
      push("snare", base + 1, humVel(r, 108, cfg.humanize));
      push("snare", base + 3, humVel(r, 108, cfg.humanize));
      if (chance(r, d * 0.6)) push("snare", base + 3.75, humVel(r, 60, cfg.humanize), true);
    } else if (kit === "sparse") {
      for (let b = 0; b < 4; b++)
        if (chance(r, 0.45 + d * 0.45)) push("kick", base + b, humVel(r, 104, cfg.humanize));
    }

    const hatBusy = kit === "house" ? 0.95 : kit === "sparse" ? 0.2 : 0.6;
    for (let s = 0; s < 16; s++) {
      const at = base + s * 0.25;
      const off = s % 4 === 2;
      if (kit === "house" && off) push("openHat", at, humVel(r, 86, cfg.humanize), true);
      else if (off && chance(r, 0.4 + d * 0.4)) push("openHat", at, humVel(r, 82, cfg.humanize), true);
      else if (chance(r, 0.12 + d * hatBusy)) push("closedHat", at, humVel(r, off ? 88 : 62, cfg.humanize), true);
      if (kit === "house" && chance(r, d * 0.3)) push("shaker", at, humVel(r, 50, cfg.humanize), true);
    }

    if (chance(r, d * 0.5)) push("perc", base + pick(r, [1.5, 2.5, 3.5]), humVel(r, 58, cfg.humanize), true);
  }
  return notes;
}

// ---------- Kit-aware drum mapping ----------
// General-MIDI drum family groupings. When a loaded Drum Rack doesn't have a pad at the
// exact GM note a pattern wants, we remap to the nearest pad in the same family, or drop
// the hit if the family is empty — so a generated groove fits whatever kit is loaded.
export const DRUM_FAMILIES: number[][] = [
  [35, 36],                                   // kicks
  [37, 38, 39, 40],                           // snares / claps / rim
  [42, 44, 46],                               // hats (closed / pedal / open)
  [41, 43, 45, 47, 48, 50],                   // toms
  [49, 51, 52, 53, 55, 57, 59],               // ride / cymbals
  [54, 56, 58, 69, 70, 71, 75, 76, 77, 82],   // percussion / shakers
];
function drumFamily(note: number): number[] | null {
  return DRUM_FAMILIES.find((f) => f.includes(note)) ?? null;
}
/** Map a desired GM drum note onto the closest available pad in the loaded kit. Exact match
 *  wins; else the nearest note in the same family; else null (no pad — drop the hit). */
export function mapNoteToKit(note: number, populated: number[]): number | null {
  if (populated.includes(note)) return note;
  const fam = drumFamily(note);
  const inFam = fam ? populated.filter((p) => fam.includes(p)) : [];
  if (inFam.length) {
    return inFam.reduce((best, p) => (Math.abs(p - note) < Math.abs(best - note) ? p : best));
  }
  return null;
}
/** Remap generated drum notes onto the loaded kit's populated pads, dropping hits whose
 *  family has no pad. No-op when `populated` is empty (keeps the default GM map). */
export function remapDrumsToKit(notes: ForgeNote[], populated: number[]): ForgeNote[] {
  if (!populated || populated.length === 0) return notes;
  const uniq = [...new Set(populated)];
  const out: ForgeNote[] = [];
  for (const n of notes) {
    const to = mapNoteToKit(n.pitch, uniq);
    if (to != null) out.push(to === n.pitch ? n : { ...n, pitch: to });
  }
  return out;
}

/** Clamp notes into the clip, round pitch, ensure legal duration/velocity, sort. */
function cleanupNotes(notes: ForgeNote[], totalBeats: number): ForgeNote[] {
  return notes
    .map((n) => ({
      ...n,
      pitch: clamp(Math.round(n.pitch), 0, 127),
      startTime: clamp(n.startTime, 0, totalBeats),
      duration: Math.max(0.05, n.duration),
      velocity: clamp(Math.round(n.velocity ?? 100), 1, 127),
    }))
    .filter((n) => n.startTime < totalBeats - 1e-6)
    .map((n) => ({ ...n, duration: Math.min(n.duration, totalBeats - n.startTime) }))
    .sort((a, b) => a.startTime - b.startTime || a.pitch - b.pitch);
}

// ---------- mutation (variation of an existing clip) ----------
export type MutationType = "rhythm" | "melody" | "chords";

export interface MutateOpts {
  type: MutationType;
  root: number;
  scale: string;
  seed: number;
  amount: number; // 0..100
  lengthBeats: number;
  scaleLock: boolean;
}

/** Rhythm mutation: keep every pitch (multiset preserved), nudge onsets on a
 *  16th grid. "keep melody, change rhythm". */
function mutateRhythm(notes: ForgeNote[], o: MutateOpts): ForgeNote[] {
  const r = mulberry32((o.seed | 0) ^ 0x5678);
  const p = clamp(o.amount / 100, 0, 1);
  const grid = 0.25;
  const seen = new Set<string>();
  const out = notes.map((n) => {
    let st = Math.round(n.startTime / grid) * grid;
    if (chance(r, p)) {
      const shift = pick(r, [-2, -1, 1, 2]) * grid;
      st = clamp(st + shift, 0, Math.max(0, o.lengthBeats - grid));
    }
    // avoid stacking an identical pitch on an identical onset
    let key = `${n.pitch}@${st}`;
    let guard = 0;
    while (seen.has(key) && guard++ < 8) {
      st = clamp(st + grid, 0, Math.max(0, o.lengthBeats - grid));
      key = `${n.pitch}@${st}`;
    }
    seen.add(key);
    return { ...n, startTime: st };
  });
  return cleanupNotes(out, o.lengthBeats);
}

/** Melody mutation: keep every onset+duration, re-pitch some notes.
 *  "keep rhythm, change melody". */
function mutateMelody(notes: ForgeNote[], o: MutateOpts): ForgeNote[] {
  const intervals = SCALES[o.scale] ?? SCALES["Natural Minor"];
  const r = mulberry32((o.seed | 0) ^ 0x1234);
  const p = clamp((o.amount / 100) * 0.9, 0, 1);
  const out = notes.map((n) => {
    if (!chance(r, p)) return { ...n };
    let np = n.pitch + pick(r, [-4, -2, -2, 2, 2, 4]); // move a scale step or two
    np = o.scaleLock ? snapToScale(np, intervals, o.root) : np;
    return { ...n, pitch: clamp(np, 0, 127) };
  });
  return cleanupNotes(out, o.lengthBeats);
}

/** Chord mutation: keep onsets + durations (rhythm) and the lowest note of each
 *  chord (the bass); re-voice the upper notes within scale.
 *  "keep bass, keep rhythm, change chords". Monophonic notes are left alone. */
function mutateChords(notes: ForgeNote[], o: MutateOpts): ForgeNote[] {
  const intervals = SCALES[o.scale] ?? SCALES["Natural Minor"];
  const r = mulberry32((o.seed | 0) ^ 0x9abc);
  const amt = clamp(o.amount / 100, 0, 1);
  const groups = new Map<number, ForgeNote[]>();
  for (const n of notes) {
    const k = Math.round(n.startTime * 1000) / 1000;
    const g = groups.get(k);
    if (g) g.push(n); else groups.set(k, [n]);
  }
  const out: ForgeNote[] = [];
  for (const g of groups.values()) {
    if (g.length < 2) { out.push(...g.map((n) => ({ ...n }))); continue; }
    const sorted = [...g].sort((a, b) => a.pitch - b.pitch);
    const bass = sorted[0];
    out.push({ ...bass }); // keep the bass note untouched
    let prev = bass.pitch;
    for (let i = 1; i < sorted.length; i++) {
      const orig = sorted[i];
      let step = chance(r, 0.5 + amt * 0.3) ? 4 : 3; // major/minor-ish third
      if (chance(r, amt * 0.5)) step += 2; // add colour tones
      let np = snapToScale(prev + step, intervals, o.root);
      if (np <= prev) np = snapToScale(prev + 3, intervals, o.root);
      prev = np;
      out.push({ ...orig, pitch: clamp(np, 0, 127) });
    }
  }
  return cleanupNotes(out, o.lengthBeats);
}

export function mutate(notes: ForgeNote[], o: MutateOpts): ForgeNote[] {
  if (!notes.length) return [];
  switch (o.type) {
    case "rhythm": return mutateRhythm(notes, o);
    case "melody": return mutateMelody(notes, o);
    case "chords": return mutateChords(notes, o);
  }
}

// ==================================================================
// Musical DNA — the persistent identity shared across every generation
// ==================================================================

export interface Motif {
  degrees: number[]; // scale-degree offsets relative to the current chord root
  rhythm: number[]; // relative durations, in grid steps (>=1)
}

// Phrase structure — question (antecedent, open ending) / answer (consequent,
// resolves to tonic) / climax (peak) / cadence (strong final resolution).
export type PhraseFunction = "question" | "answer" | "climax" | "cadence";
export interface PhraseProfile { profile: PhraseFunction[]; barsPerPhrase: number; }

export interface MusicalDNA {
  /** v0.76.1: the song's canonical motif, untouched by scene development. The song builder sets
   *  it once; `motif` below may be the scene-transformed copy. genArp keys its cell off THIS. */
  songMotif?: Motif;
  version: 1;
  root: number;
  scale: string;
  style?: string; // genre the DNA was derived for (re-derive when the user changes it)
  progression: number[]; // scale-degree chord roots (0..len-1), one per bar, cycled
  motif: Motif;
  contour: number[]; // -1 / 0 / +1 melodic movement of the motif
  baseOctave: number; // register anchor
  groove: { swing: number; humanize: number; timing?: number[]; accent?: number[] }; // 16-step shared feel
  phrase?: PhraseProfile; // question/answer structure for the lead
  seed: number;
  /** MOTIF-IN (v0.72): the user's hand-authored motif, VERBATIM. When present, the lead plays
   *  these exact notes (developed per section by literal transforms) instead of re-synthesising
   *  a line from the analytic `motif`. Bass/chords/arp still accompany from the analytic DNA. */
  authored?: AuthoredMotif;
}

export interface AuthoredMotif {
  notes: ForgeNote[];      // exact pitch / startTime / duration / velocity, from the source clip
  lengthBeats: number;     // the source clip's loop length (statement period)
  sourcePart?: PartId;     // which part it was extracted from (defaults to lead)
}

const DEFAULT_PHRASE: PhraseProfile = {
  profile: ["question", "answer", "question", "climax"],
  barsPerPhrase: 1,
};

// Per-part register offset (octaves) from the DNA base octave.
const REGISTER_OFF: Record<PartId, number> = {
  lead: 1, counterMelody: 0, pad: 0, chords: 0, arp: 0, bass: -1, drums: 0, piano: 0,
};

/** Melodic movement of a degree sequence as -1/0/+1. */
export function contourOf(degrees: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < degrees.length; i++) {
    const d = degrees[i] - degrees[i - 1];
    out.push(d > 0 ? 1 : d < 0 ? -1 : 0);
  }
  return out;
}

/** Pure motif transforms — the vocabulary that keeps identity while evolving. */
export const motifOps = {
  transpose: (m: Motif, n: number): Motif => ({ degrees: m.degrees.map((d) => d + n), rhythm: m.rhythm }),
  invert: (m: Motif, axis = m.degrees[0]): Motif => ({ degrees: m.degrees.map((d) => 2 * axis - d), rhythm: m.rhythm }),
  retrograde: (m: Motif): Motif => ({ degrees: [...m.degrees].reverse(), rhythm: [...m.rhythm].reverse() }),
  augment: (m: Motif, f = 2): Motif => ({ degrees: m.degrees, rhythm: m.rhythm.map((r) => Math.max(1, Math.round(r * f))) }),
  diminish: (m: Motif, f = 2): Motif => ({ degrees: m.degrees, rhythm: m.rhythm.map((r) => Math.max(1, Math.round(r / f))) }),
  octaveShift: (m: Motif, oct: number, scaleLen: number): Motif => ({ degrees: m.degrees.map((d) => d + oct * scaleLen), rhythm: m.rhythm }),
  fragment: (m: Motif, k: number): Motif => ({ degrees: m.degrees.slice(0, Math.max(1, k)), rhythm: m.rhythm.slice(0, Math.max(1, k)) }),
  sequence: (m: Motif, step: number, times: number): Motif => {
    const degrees: number[] = [], rhythm: number[] = [];
    for (let i = 0; i < times; i++) { m.degrees.forEach((d) => degrees.push(d + step * i)); m.rhythm.forEach((r) => rhythm.push(r)); }
    return { degrees, rhythm };
  },
};

/** Absolute scale-degree of a MIDI pitch (octave contributes scale length). */
function midiToScaleDegree(pitch: number, intervals: number[], root: number): number {
  const snapped = snapToScale(pitch, intervals, root);
  const rel = snapped - root;
  const octave = Math.floor(rel / 12);
  const within = ((rel % 12) + 12) % 12;
  const idx = intervals.indexOf(within);
  return octave * intervals.length + (idx >= 0 ? idx : 0);
}

/** v0.85 HARMONY dimension: real interpolation, bar by bar. Each bar keeps the DNA's chord with
 *  probability h/100, else takes the same bar of a genre-pool progression. BOTH choices are
 *  seeded from the DNA only — every part in every scene gets the identical blended progression
 *  (a per-part seed here would make the bass and the chords disagree). Monotone: the set of DNA
 *  bars at h is a superset of the set at any lower h (one threshold per bar). */
export function blendProgression(dna: MusicalDNA, pool: number[][], harmony: number): number[] {
  if (harmony >= 100 || !pool.length) return dna.progression;
  const pr = mulberry32(((dna.seed | 0) ^ 0x68726d6e) >>> 0);
  const alt = pool[Math.floor(pr() * pool.length)];
  const len = Math.max(dna.progression.length, alt.length);
  return Array.from({ length: len }, (_, i) => (pr() < harmony / 100 ? dna.progression[i % dna.progression.length] : alt[i % alt.length]));
}

/** v0.84 — what to do with the stored DNA for this generate. Pure; the extension persists the result.
 *  - "keep":   stored DNA matches the song (seed/style/root/scale) → use as-is
 *  - "adopt":  stored DNA carries a MOTIF-IN (authored) for the same key → keep it, take the new
 *              seed/style (an extracted DNA is the user's music; a new starter must not erase it)
 *  - "rekey":  motif-in, but the key changed → fresh accompaniment for the new key, authored line
 *              carried across transposed by the nearest root delta
 *  - "derive": no stored DNA, or a derived one that no longer matches → derive fresh */
export function reconcileDNA(stored: MusicalDNA | null, want: { seed: number; style: StyleId; root: number; scale: string }): { dna: MusicalDNA; action: "keep" | "adopt" | "rekey" | "derive" } {
  const matches = (d: MusicalDNA) => d.seed === want.seed && d.style === want.style && d.root === want.root && d.scale === want.scale;
  if (stored && matches(stored)) return { dna: stored, action: "keep" };
  if (stored && stored.authored && stored.authored.notes.length) {
    if (stored.root === want.root && stored.scale === want.scale) return { dna: { ...stored, seed: want.seed, style: want.style }, action: "adopt" };
    const shift = ((((want.root - stored.root) % 12) + 18) % 12) - 6;
    const authored = { ...stored.authored, notes: stored.authored.notes.map((n) => ({ ...n, pitch: n.pitch + shift })) };
    return { dna: { ...deriveDNA(want.style, want.root, want.scale, want.seed), authored }, action: "rekey" };
  }
  return { dna: deriveDNA(want.style, want.root, want.scale, want.seed), action: "derive" };
}

/** Derive a fresh DNA from style + key (used when nothing has been extracted). */
export function deriveDNA(style: StyleId, root: number, scale: string, seed: number): MusicalDNA {
  const traits = STYLES[style] ?? STYLES.melodicTechno;
  // Mix style, scale and root into the seed so different genres/keys derive genuinely
  // different motifs even from the same song seed (fixes "every starter, same lead").
  let mixed = (seed | 0) >>> 0;
  for (const ch of style + "|" + scale) mixed = (Math.imul(mixed ^ ch.charCodeAt(0), 0x9e3779b1) >>> 0);
  mixed = (Math.imul(mixed ^ ((root + 1) * 2654435761), 0x85ebca77) >>> 0);
  const r = mulberry32(mixed ^ 0x0d0a);
  const progression = [...(traits.progressions[Math.floor(r() * traits.progressions.length)])];
  const len = 4;
  const degrees: number[] = [0];
  for (let i = 1; i < len; i++) degrees.push(clamp(degrees[i - 1] + pick(r, [-2, -1, 1, 1, 2, 2]), 0, 6));
  const rhythm = Array.from({ length: len }, () => pick(r, [1, 1, 2, 1, 2, 4]));
  // one shared 16-step feel: micro-timing (beats) + velocity accents, used by ALL parts
  const timing = Array.from({ length: 16 }, (_, i) => {
    const base = i % 2 === 1 ? 0.006 : -0.002; // offbeats a touch late
    return Math.round((base + (r() - 0.5) * 0.01) * 1000) / 1000;
  });
  const accent = Array.from({ length: 16 }, (_, i) => {
    const strong = i % 4 === 0 ? 8 : i % 2 === 0 ? 2 : -3; // downbeats loud, "e"/"a" soft
    return Math.round(strong + (r() - 0.5) * 6);
  });
  timing[0] = Math.max(0, timing[0]); // anchor the downbeat (never cross the bar line early)
  return {
    version: 1, root, scale, style, progression,
    motif: { degrees, rhythm }, contour: contourOf(degrees),
    baseOctave: 3, groove: { swing: Math.round(traits.swing * 100), humanize: 30, timing, accent },
    phrase: DEFAULT_PHRASE, seed,
  };
}

/** Extract a DNA fingerprint from an existing clip's notes. */
export function extractDNA(rawNotes: ForgeNote[], root: number, scale: string, seed: number): MusicalDNA {
  const intervals = SCALES[scale] ?? SCALES["Natural Minor"];
  const notes = [...rawNotes].sort((a, b) => a.startTime - b.startTime);
  if (!notes.length) return deriveDNA("melodicTechno", root, scale, seed);
  const maxEnd = Math.max(4, ...notes.map((n) => n.startTime + n.duration));
  const bars = Math.max(1, Math.round(maxEnd / BEATS_PER_BAR));
  const len = intervals.length;

  // progression: per-bar lowest note -> chord-root scale degree (0..len-1)
  const progression: number[] = [];
  for (let b = 0; b < bars; b++) {
    const inBar = notes.filter((n) => n.startTime >= b * BEATS_PER_BAR && n.startTime < (b + 1) * BEATS_PER_BAR);
    if (!inBar.length) { progression.push(progression.length ? progression[progression.length - 1] : 0); continue; }
    const low = inBar.reduce((a, n) => (n.pitch < a.pitch ? n : a));
    progression.push(((midiToScaleDegree(low.pitch, intervals, root) % len) + len) % len);
  }

  // motif: the first up-to-6 notes (bar 0 preferred), degrees relative to bar-0 root
  const firstBar = notes.filter((n) => n.startTime < BEATS_PER_BAR).slice(0, 6);
  const src = firstBar.length ? firstBar : notes.slice(0, 6);
  const anchor = progression[0] ?? 0;
  const degrees = src.map((n) => midiToScaleDegree(n.pitch, intervals, root) - anchor);
  const rhythm = src.map((n) => Math.max(1, Math.round(n.duration / 0.25)));

  // register + groove estimates
  const pitches = notes.map((n) => n.pitch).sort((a, b) => a - b);
  const median = pitches[Math.floor(pitches.length / 2)];
  const baseOctave = clamp(Math.round(median / 12) - 1, 1, 6);
  let gridDev = 0;
  for (const n of notes) { const q = Math.round(n.startTime / 0.25) * 0.25; gridDev += Math.abs(n.startTime - q); }
  const swing = clamp(Math.round((gridDev / notes.length) / 0.166 * 70), 0, 70);
  const vels = notes.map((n) => n.velocity ?? 100);
  const mean = vels.reduce((a, v) => a + v, 0) / vels.length;
  const std = Math.sqrt(vels.reduce((a, v) => a + (v - mean) ** 2, 0) / vels.length);
  const humanize = clamp(Math.round((std / 40) * 100), 0, 100);
  const gr = mulberry32((seed | 0) ^ 0x9e37);
  const timing = Array.from({ length: 16 }, (_, i) => Math.round(((i % 2 === 1 ? 0.006 : -0.002) + (gr() - 0.5) * 0.01) * 1000) / 1000);
  const accent = Array.from({ length: 16 }, (_, i) => Math.round((i % 4 === 0 ? 8 : i % 2 === 0 ? 2 : -3) + (gr() - 0.5) * 6));
  timing[0] = Math.max(0, timing[0]);

  // MOTIF-IN: keep the WHOLE line verbatim (up to 64 notes / 16 bars) — the lead will play it.
  const authoredNotes = notes.slice(0, 64).map((n) => ({
    pitch: clamp(Math.round(n.pitch), 0, 127), startTime: Math.max(0, n.startTime),
    duration: Math.max(0.05, n.duration), velocity: clamp(Math.round(n.velocity ?? 100), 1, 127),
  }));
  const authored: AuthoredMotif = { notes: authoredNotes, lengthBeats: bars * BEATS_PER_BAR };

  return {
    version: 1, root, scale,
    progression: progression.length ? progression : [0],
    motif: { degrees: degrees.length ? degrees : [0], rhythm: rhythm.length ? rhythm : [1] },
    contour: contourOf(degrees.length ? degrees : [0]),
    baseOctave, groove: { swing, humanize, timing, accent }, phrase: DEFAULT_PHRASE, seed,
    authored,
  };
}

// ---------------------------------------------------------------- authored-motif development

/** Literal transforms of an authored note list — the same narrative arc as sceneMotifTransform,
 *  applied to the user's ACTUAL notes rather than to abstract degrees. Every op keeps the
 *  statement period so the line stays phrase-aligned; pitches are snapped to scale afterwards
 *  where the op could leave the key (transposition). */
export const authoredOps = {
  /** first `frac` of the statement, by time (fragment) */
  fragment(a: AuthoredMotif, frac: number): AuthoredMotif {
    const cut = a.lengthBeats * clamp(frac, 0.25, 1);
    return { ...a, notes: a.notes.filter((n) => n.startTime < cut - 1e-6) };
  },
  /** octave lift/drop */
  octave(a: AuthoredMotif, oct: number): AuthoredMotif {
    return { ...a, notes: a.notes.map((n) => ({ ...n, pitch: clamp(n.pitch + 12 * oct, 0, 127) })) };
  },
  /** reversed in time */
  retrograde(a: AuthoredMotif): AuthoredMotif {
    const L = a.lengthBeats;
    return { ...a, notes: a.notes.map((n) => ({ ...n, startTime: Math.max(0, L - n.startTime - n.duration) })).sort((x, y) => x.startTime - y.startTime) };
  },
  /** half speed (augmentation) — statement takes twice as long; period doubles */
  augment(a: AuthoredMotif): AuthoredMotif {
    return { ...a, lengthBeats: a.lengthBeats * 2, notes: a.notes.map((n) => ({ ...n, startTime: n.startTime * 2, duration: n.duration * 2 })) };
  },
  /** double speed (diminution) — period halves */
  diminish(a: AuthoredMotif): AuthoredMotif {
    return { ...a, lengthBeats: a.lengthBeats / 2, notes: a.notes.map((n) => ({ ...n, startTime: n.startTime / 2, duration: n.duration / 2 })) };
  },
  /** transposed by `steps` scale degrees, snapped to the scale (sequence) */
  transpose(a: AuthoredMotif, steps: number, intervals: number[], root: number): AuthoredMotif {
    return { ...a, notes: a.notes.map((n) => {
      const deg = midiToScaleDegree(n.pitch, intervals, root) + steps;
      const oct = Math.floor(n.pitch / 12) - 1;
      const p = scaleDegreeToMidi(deg, intervals, root, oct);
      // keep it near the original register (scaleDegreeToMidi octave math can jump)
      let q = p; while (q - n.pitch > 6) q -= 12; while (n.pitch - q > 6) q += 12;
      return { ...n, pitch: clamp(q, 0, 127) };
    }) };
  },
  /** thinned: keep every note whose index passes `keep` (sparse statement) */
  thin(a: AuthoredMotif, keep: (i: number, n: ForgeNote) => boolean): AuthoredMotif {
    return { ...a, notes: a.notes.filter((n, i) => keep(i, n)) };
  },
};

/** The section → literal-transform map for an authored motif (mirrors sceneMotifTransform). */
export function sceneAuthoredTransform(section: string, a: AuthoredMotif, intervals: number[], root: number): AuthoredMotif {
  switch (section) {
    case "Intro": return authoredOps.fragment(a, 0.5);
    case "Build": return authoredOps.transpose(a, 1, intervals, root);
    case "Build 2": return authoredOps.transpose(a, 2, intervals, root);
    case "Main": case "Main 2": return a;                                     // YOUR line, verbatim
    case "Break": return authoredOps.fragment(a, 0.5);
    case "Drop": return authoredOps.octave(a, 1);
    case "Outro": return authoredOps.retrograde(a);
    case "Pulse": return authoredOps.fragment(a, 0.25);
    case "Layer 1": return authoredOps.fragment(a, 0.5);
    case "Layer 2": return authoredOps.transpose(a, 1, intervals, root);
    case "Layer 3": case "Peak": return a;
    case "Strip": return authoredOps.augment(a);
    case "Peak 2": return authoredOps.octave(a, 1);
    case "Fade": return authoredOps.diminish(authoredOps.fragment(a, 0.5));
    case "Groove": return authoredOps.thin(a, (i) => i % 2 === 0);
    case "Breakdown": return a;
    case "Lift": return authoredOps.transpose(a, 1, intervals, root);
    case "Groove 2": return a;
    default: return a;
  }
}

/** Tile an authored statement across `totalBeats`, humanised only as much as the config asks.
 *  Notes past the clip end are dropped; a statement that ends up empty falls back to the root. */
function genAuthoredLine(ctx: Ctx, a: AuthoredMotif, gain: number): ForgeNote[] {
  const { cfg, intervals, r, totalBeats } = ctx;
  const stmt = a; // section development is applied to dna.authored by the caller (see extension)
  const period = Math.max(0.25, stmt.lengthBeats);
  const out: ForgeNote[] = [];
  // The USER's humanize dial, not the DNA's extracted groove: ctx.cfg.humanize is overridden by
  // dna.groove.humanize when DNA is on (right for synthesised lines) — but the authored line
  // already IS the user's timing and dynamics. Zero means bit-exact.
  const hum = clamp(ctx.userHumanize ?? 0, 0, 100) / 100;
  const humT = hum * 0.02; // ±20 ms at full humanize
  for (let off = 0; off < totalBeats - 1e-6; off += period) {
    for (const n of stmt.notes) {
      const base = off + n.startTime;
      if (base >= totalBeats - 1e-6) continue;
      // jitter never drops a note: clamp to [0, end)
      const t = hum > 0 ? clamp(base + (r() - 0.5) * 2 * humT, 0, Math.max(0, totalBeats - 0.01)) : base;
      const dur = Math.min(n.duration, totalBeats - t);
      const vel = hum > 0 ? clamp(Math.round((n.velocity ?? 100) * gain + (r() - 0.5) * hum * 8), 1, 127) : clamp(Math.round((n.velocity ?? 100) * gain), 1, 127);
      out.push({ pitch: n.pitch, startTime: t, duration: dur, velocity: vel });
    }
  }
  if (!out.length) {
    const rootDeg = ctx.prog[0];
    out.push({ pitch: scaleDegreeToMidi(rootDeg, intervals, cfg.root, cfg.octave + 1), startTime: 0, duration: 1, velocity: 90 });
  }
  return out;
}

/** Map a Song section name to a motif transform — the narrative arc. */
export function sceneMotifTransform(section: string, motif: Motif, scaleLen: number): Motif {
  switch (section) {
    // classic arc: statement -> repeat -> vary -> fragment -> restate (Star Dancer)
    case "Intro": return motifOps.fragment(motif, Math.max(2, Math.ceil(motif.degrees.length / 2)));
    case "Build": return motifOps.sequence(motif, 1, 2);
    case "Build 2": return motifOps.sequence(motif, 2, 2);
    case "Main": case "Main 2": return motif;
    case "Break": return motifOps.fragment(motif, 2);
    case "Drop": return motifOps.octaveShift(motif, 1, scaleLen);
    case "Outro": return motifOps.retrograde(motif);
    // Berlin School: the motif emerges — fragment, grow, state, dissolve
    case "Pulse": return motifOps.fragment(motif, 2);
    case "Layer 1": return motifOps.fragment(motif, Math.max(2, Math.ceil(motif.degrees.length / 2)));
    case "Layer 2": return motifOps.sequence(motif, 1, 2);
    case "Layer 3": return motif;
    case "Peak": return motif;
    case "Strip": return motifOps.augment(motif); // the core, slowed and exposed (Winter)
    case "Peak 2": return motifOps.octaveShift(motif, 1, scaleLen);
    case "Fade": return motifOps.diminish(motifOps.fragment(motif, 2));
    // Anthem: the hook is exposed in the breakdown, lifted, then dropped in full
    case "Groove": return motifOps.fragment(motif, Math.max(2, motif.degrees.length - 1));
    case "Breakdown": return motif; // the anthem, stated plainly
    case "Lift": return motifOps.sequence(motif, 1, 2);
    case "Groove 2": return motif;
    default: return motif;
  }
}

function registerWindow(dna: MusicalDNA, part: PartId, root: number, octave?: number): [number, number] {
  const off = REGISTER_OFF[part] ?? 0;
  // v0.85 REGISTER dimension: `octave` is the interpolated centre (dialog octave ↔ DNA octave)
  const center = ((octave ?? dna.baseOctave) + off + 1) * 12 + root;
  return [center - 9, center + 16];
}

// Hard per-part MIDI range, always enforced, tracking the user's Octave setting.
// Prevents runaway notes (e.g. a phrase climax) from flying into octave 7.
const PART_OCT_OFF: Record<PartId, number> = { lead: 1, counterMelody: 0, pad: 0, chords: 0, arp: 1, bass: -1, drums: 0, piano: 0 };
const PART_SPAN: Record<PartId, [number, number]> = {
  lead: [-12, 18], counterMelody: [-12, 12], pad: [-14, 14],
  chords: [-14, 14], arp: [-10, 20], bass: [-10, 12], drums: [0, 0],
  piano: [-26, 26], // two hands: LH broken chords well below the RH melody
};
function partRange(part: PartId, root: number, octave: number): [number, number] {
  const center = (octave + (PART_OCT_OFF[part] ?? 0) + 1) * 12 + root;
  const [lo, hi] = PART_SPAN[part] ?? [-12, 12];
  return [clamp(center + lo, 0, 127), clamp(center + hi, 0, 127)];
}
function clampToRegister(pitch: number, lo: number, hi: number, intervals: number[], root: number): number {
  let p = pitch;
  while (p < lo) p += 12;
  while (p > hi) p -= 12;
  return snapToScale(p, intervals, root);
}

/**
 * Lay the DNA motif across the bars over the shared progression — with seeded,
 * identity-preserving variation so re-roll is never a no-op, even at DNA 100.
 * The variation (transform choice, octave placement, rhythmic displacement, note
 * skips/echoes) changes the surface while keeping the motif's pitch-classes, so
 * the idea stays recognizable. Stronger pitch transforms (invert) only kick in
 * as DNA identity drops.
 */
function genMotifLine(ctx: Ctx, role: "lead" | "counter"): ForgeNote[] {
  const { cfg, intervals, r, step, totalBeats, gate, dna } = ctx;
  if (!dna) return [];
  const counter = role === "counter";
  // MOTIF-IN: a hand-authored motif is played, not re-synthesised. The lead states it (developed
  // per section); the counter-melody answers with the analytic DNA below (never imitates it).
  if (!counter && dna.authored && dna.authored.notes.length && ctx.strength > 0) {
    return genAuthoredLine(ctx, dna.authored, 1.0);
  }

  // base material — set-preserving transforms keep identity intact
  let m = counter ? motifOps.invert(dna.motif) : dna.motif;
  // SONG MOTIF STATE (v0.76): the scene's development is decided ONCE by sceneMotifTransform
  // (the caller). The extra per-scene dice below used to re-randomise on top of it; they are
  // now scaled by (100 - strength) so at full strength the cell is stated exactly as given.
  const bendP = clamp((100 - ctx.strength) / 100, 0, 1);                                 // MOTIF dimension
  const rhyP = clamp((100 - (ctx.mix?.rhythm ?? ctx.strength)) / 100, 0, 1);            // RHYTHM dimension (v0.85)
  const rM = ctx.rMotif ?? r, rR = ctx.rRhythm ?? r;
  // Structural re-shaping of the cell (retrograde/fragment/repeat) only below strength 70;
  // above it the statement is literal and only ornaments (rests, echoes, octave) scale.
  const reshape = bendP > 0.3;
  const roll = reshape ? rM() : 1;
  if (reshape && roll < 0.24 * bendP) m = motifOps.retrograde(m);
  else if (reshape && roll < 0.40 * bendP) m = motifOps.fragment(m, Math.max(2, m.degrees.length - 1));
  else if (reshape && roll < 0.54 * bendP) m = motifOps.sequence(m, 0, 2); // repeat the cell (set-preserving)
  // (all base transforms preserve the motif's pitch-class set, so identity holds)

  const baseOct = cfg.octave + (counter ? 0 : 1);
  const literal = ctx.strength >= 70; // v0.76.1: the statement bar is protected in full
  const octJit = !literal && bendP > 0 && rM() < bendP ? pick(rM, [1, -1]) : 0;
  const skipP = 0.14 * rhyP, echoP = 0.12 * rhyP;

  const notes: ForgeNote[] = [];
  let bar = 0;
  for (let barStart = 0; barStart < totalBeats - 1e-6; barStart += BEATS_PER_BAR, bar++) {
    const rootDeg = ctx.prog[bar % ctx.prog.length];
    // bar 1 is the clean statement; later bars may displace only as strength drops
    const shift = (bar === 0 || !(rR() < rhyP)) ? 0 : pick(rR, [1, 2]) * step;
    let t = barStart + (counter ? step : 0) + shift;
    for (let j = 0; j < m.degrees.length; j++) {
      const durSteps = Math.max(1, m.rhythm[j] || 1);
      const dur = durSteps * step * gate;
      if (t + dur * 0.5 > barStart + BEATS_PER_BAR) break;
      if (bar > 0 && rR() < skipP) { t += durSteps * step; continue; } // seeded rest (never in the statement bar)
      const pitch = scaleDegreeToMidi(rootDeg + m.degrees[j], intervals, cfg.root, baseOct + octJit);
      notes.push({
        pitch, startTime: applySwing(t, step, ctx.swing), duration: dur,
        velocity: humVel(r, counter ? 78 : 92, cfg.humanize),
      });
      // seeded echo — same pitch, softer, an eighth later
      if (!(literal && bar === 0) && rR() < echoP && t + durSteps * step * 2 <= barStart + BEATS_PER_BAR) {
        notes.push({
          pitch, startTime: applySwing(t + durSteps * step, step, ctx.swing),
          duration: dur * 0.8, velocity: humVel(r, 66, cfg.humanize),
        });
      }
      t += durSteps * step;
    }
  }
  // never return an empty line (extremely unlikely, but guard the guarantee)
  if (!notes.length) {
    const rootDeg = ctx.prog[0];
    notes.push({ pitch: scaleDegreeToMidi(rootDeg, intervals, cfg.root, baseOct), startTime: 0, duration: step * gate, velocity: 90 });
  }
  return notes;
}

/** Per-section phrase structure for Song mode. */
export function sectionPhraseProfile(section: string): PhraseProfile {
  switch (section) {
    case "Intro": return { profile: ["question"], barsPerPhrase: 1 };
    case "Build": case "Build 2": return { profile: ["question", "answer"], barsPerPhrase: 1 };
    case "Main": case "Main 2": return { profile: ["question", "answer", "question", "climax"], barsPerPhrase: 1 };
    case "Break": return { profile: ["question", "cadence"], barsPerPhrase: 1 };
    case "Drop": return { profile: ["climax", "answer"], barsPerPhrase: 1 };
    case "Outro": return { profile: ["cadence"], barsPerPhrase: 1 };
    // Berlin School
    case "Pulse": case "Layer 1": case "Layer 2": return { profile: ["question"], barsPerPhrase: 1 };
    case "Layer 3": return { profile: ["question", "answer"], barsPerPhrase: 1 };
    case "Peak": case "Peak 2": return { profile: ["question", "answer", "question", "climax"], barsPerPhrase: 1 };
    case "Strip": return { profile: ["question", "cadence"], barsPerPhrase: 1 };
    case "Fade": return { profile: ["cadence"], barsPerPhrase: 1 };
    // Anthem
    case "Groove": case "Groove 2": return { profile: ["question", "answer"], barsPerPhrase: 1 };
    case "Breakdown": return { profile: ["question", "answer", "question", "climax"], barsPerPhrase: 1 };
    case "Lift": return { profile: ["question", "answer", "climax", "answer"], barsPerPhrase: 1 };
    default: return DEFAULT_PHRASE;
  }
}

/** Highest in-scale pitch at or below `hi`. */
function topScalePitch(hi: number, intervals: number[], root: number): number {
  const pcSet = new Set(intervals.map((i) => (((root + i) % 12) + 12) % 12));
  for (let p = hi; p > hi - 12; p--) if (pcSet.has(((p % 12) + 12) % 12)) return p;
  return hi;
}

/** Nearest MIDI pitch to `pitch` whose scale-degree index is `degIdx`. */
function nearestDegreePitch(pitch: number, degIdx: number, intervals: number[], root: number): number {
  const idx = clamp(degIdx, 0, intervals.length - 1);
  const targetPc = (((root + intervals[idx]) % 12) + 12) % 12;
  const below = pitch - ((((pitch - targetPc) % 12) + 12) % 12);
  const cands = [below, below + 12];
  return cands.reduce((a, b) => (Math.abs(b - pitch) < Math.abs(a - pitch) ? b : a));
}

/**
 * Shape a lead line into question/answer phrases:
 *  - question -> ending "hangs" on the 5th (open, half-cadence feel)
 *  - answer   -> ending resolves to the tonic, longer
 *  - cadence  -> strong final resolution to tonic, longest
 *  - climax   -> whole phrase up an octave, louder, ending on a high held tonic
 * Plus a gentle velocity build toward the climax phrase.
 */
function applyPhrasing(
  notes: ForgeNote[],
  phrase: PhraseProfile,
  intervals: number[],
  root: number,
  totalBeats: number,
  range: [number, number],
): ForgeNote[] {
  if (!notes.length) return notes;
  const out = notes.map((n) => ({ ...n }));
  const [, hi] = range;
  const ceiling = topScalePitch(hi, intervals, root); // the climax peak
  const plen = Math.max(1, phrase.barsPerPhrase) * BEATS_PER_BAR;
  const nPhrases = Math.max(1, Math.round(totalBeats / plen));

  // where is the climax phrase (for the energy build)?
  let climaxPhrase = -1;
  for (let p = 0; p < nPhrases; p++) if (phrase.profile[p % phrase.profile.length] === "climax") { climaxPhrase = p; break; }

  for (let p = 0; p < nPhrases; p++) {
    const fn = phrase.profile[p % phrase.profile.length];
    const start = p * plen, end = (p + 1) * plen;
    const idxs = out.map((n, i) => ({ n, i })).filter((x) => x.n.startTime >= start - 1e-6 && x.n.startTime < end - 1e-6).map((x) => x.i);
    if (!idxs.length) continue;

    // energy build toward the climax
    const gain = climaxPhrase >= 0
      ? (p <= climaxPhrase ? 0.82 + 0.18 * (p / Math.max(1, climaxPhrase)) : 0.9)
      : 1;
    for (const i of idxs) out[i].velocity = clamp(Math.round((out[i].velocity ?? 100) * gain), 1, 127);

    // climax: lift the phrase an octave (folded back into range later, preserving
    // pitch-classes so identity holds); only the ending is forced to the peak.
    if (fn === "climax") {
      for (const i of idxs) { out[i].pitch += 12; out[i].velocity = clamp((out[i].velocity ?? 100) + 16, 1, 127); }
    }

    // reshape the phrase-ending note(s) — all notes sharing the latest onset,
    // so an echo landing on the same beat can't defeat the cadence target.
    const maxStart = Math.max(...idxs.map((i) => out[i].startTime));
    const enders = idxs.filter((i) => Math.abs(out[i].startTime - maxStart) < 1e-6);
    for (const li of enders) {
      const endPitch = out[li].pitch;
      if (fn === "answer" || fn === "cadence") {
        out[li].pitch = nearestDegreePitch(endPitch, 0, intervals, root); // resolve to tonic
        out[li].duration *= fn === "cadence" ? 2.4 : 1.8;
      } else if (fn === "question") {
        out[li].pitch = nearestDegreePitch(endPitch, 4, intervals, root); // hang on the 5th
        out[li].duration *= 1.2;
      } else { // climax ending: the peak — highest in-scale note, held, loudest
        out[li].pitch = ceiling;
        out[li].duration *= 1.6;
        out[li].velocity = 127;
      }
    }
  }
  return out;
}

/**
 * Call & response counter melody: it "listens" to the lead and plays only in the
 * lead's rests, resolving each answer toward the chord tone. Uses the inverted
 * motif as its answering material when a DNA is active.
 */
function genCallResponse(ctx: Ctx, leadNotes: ForgeNote[]): ForgeNote[] {
  const { cfg, intervals, r, step, totalBeats, gate, dna } = ctx;
  const notes: ForgeNote[] = [];
  const sounding = (t: number) =>
    leadNotes.some((n) => t >= n.startTime - 1e-6 && t < n.startTime + n.duration - 1e-6);

  // collect the lead's rests as answer windows
  const gaps: [number, number][] = [];
  let gapStart: number | null = null;
  for (let t = 0; t < totalBeats - 1e-6; t += step) {
    const free = !sounding(t) && !sounding(t + step * 0.5);
    if (free && gapStart === null) gapStart = t;
    if (!free && gapStart !== null) { gaps.push([gapStart, t]); gapStart = null; }
  }
  if (gapStart !== null) gaps.push([gapStart, totalBeats]);

  const motif = dna ? motifOps.invert(dna.motif) : null;
  const octave = cfg.octave; // counter sits below the lead (lead = octave+1)

  for (const [gs, ge] of gaps) {
    const span = ge - gs;
    if (span < step * 1.5) continue; // too short to speak
    const maxNotes = Math.max(1, Math.floor(span / step));
    const count = Math.max(1, Math.min(maxNotes, Math.round((cfg.density / 100) * maxNotes)));
    let t = gs;
    for (let j = 0; j < count && t < ge - 1e-6; j++) {
      const bar = Math.floor(t / BEATS_PER_BAR);
      const rootDeg = ctx.prog[bar % ctx.prog.length];
      const isLast = j === count - 1 || t + step * 2 > ge;
      let deg: number;
      if (isLast) deg = rootDeg; // land on the chord tone — a resolved answer
      else if (motif) deg = rootDeg + motif.degrees[j % motif.degrees.length];
      else deg = rootDeg + pick(r, [0, 2, 4, -1, 1]);
      const pitch = scaleDegreeToMidi(deg, intervals, cfg.root, octave);
      const dur = Math.min(step * (isLast ? 2 : 1) * gate, ge - t);
      notes.push({
        pitch, startTime: applySwing(t, step, ctx.swing), duration: dur,
        velocity: humVel(r, isLast ? 82 : 70, cfg.humanize),
      });
      t += step;
      if (isLast) break;
    }
  }
  return notes;
}

/** Shared groove: every part gets the SAME 16-step micro-timing + accent, so the
 *  section breathes together. Deterministic (part of the song's identity). */
function applyGroove(notes: ForgeNote[], groove: MusicalDNA["groove"], depth: number): ForgeNote[] {
  if (!groove.timing || !groove.accent || depth <= 0) return notes;
  const k = clamp(depth, 0, 100) / 100;
  return notes.map((n) => {
    const idx = ((Math.round((n.startTime % BEATS_PER_BAR) / 0.25) % 16) + 16) % 16;
    return {
      ...n,
      startTime: n.startTime + (groove.timing![idx] || 0) * k,
      velocity: clamp(Math.round((n.velocity ?? 100) + (groove.accent![idx] || 0) * k), 1, 127),
    };
  });
}

/** Section energy scales dynamics for the build/release arc across a Song. */
function applyEnergy(notes: ForgeNote[], energy: number): ForgeNote[] {
  const e = clamp(energy, 0, 1);
  const vScale = 0.6 + 0.55 * e; // ~0.6 (soft) .. 1.15 (peak)
  return notes.map((n) => ({ ...n, velocity: clamp(Math.round((n.velocity ?? 100) * vScale), 1, 127) }));
}

/**
 * Hook discipline (Oxygène IV / Café del Mar / Knights of the Jaguar): shape the
 * lead into an AABA' form per 4-bar group — bar A stated, repeated exactly,
 * answered by a contrasting B, then restated. Bar A is compressed to a singable
 * span (~14 semitones) and guaranteed ONE signature leap (>=7 semitones). This is
 * what makes a lead memorable: repetition + one identifying gesture.
 */
function imposeHookForm(
  notes: ForgeNote[],
  intervals: number[],
  root: number,
  totalBeats: number,
): ForgeNote[] {
  if (!notes.length || totalBeats < 4 * BEATS_PER_BAR) return notes;
  const inBar = (b: number) => notes.filter((n) => n.startTime >= b * BEATS_PER_BAR - 1e-6 && n.startTime < (b + 1) * BEATS_PER_BAR - 1e-6);
  const shiftBar = (src: ForgeNote[], toBar: number, fromBar: number) =>
    src.map((n) => ({ ...n, startTime: n.startTime + (toBar - fromBar) * BEATS_PER_BAR }));

  const groups = Math.floor(totalBeats / (4 * BEATS_PER_BAR));
  const out: ForgeNote[] = [];
  for (let g = 0; g < groups; g++) {
    const b0 = g * 4;
    let A = inBar(b0).map((n) => ({ ...n }));
    if (!A.length) { out.push(...inBar(b0), ...inBar(b0 + 1), ...inBar(b0 + 2), ...inBar(b0 + 3)); continue; }

    // 1) compress A into a singable span (fold outliers by octaves)
    const center = A.reduce((s, n) => s + n.pitch, 0) / A.length;
    for (const n of A) {
      while (n.pitch - center > 9) n.pitch -= 12;
      while (center - n.pitch > 9) n.pitch += 12;
    }
    // 2) guarantee one signature leap (>=7 semitones between consecutive notes)
    A.sort((a, b) => a.startTime - b.startTime);
    let maxLeap = 0;
    for (let i = 1; i < A.length; i++) maxLeap = Math.max(maxLeap, Math.abs(A[i].pitch - A[i - 1].pitch));
    if (maxLeap < 7 && A.length >= 3) {
      const m = Math.floor(A.length / 2);
      A[m].pitch = snapToScale(A[m].pitch + 12, intervals, root);
    }

    // 3) B = A answered, staying in the family (Star Dancer): retrograde — same
    //    pitches, reversed order. Falls back to inversion if A is palindromic.
    const rev = [...A].map((n) => n.pitch).reverse();
    let B = A.map((n, i) => ({ ...n, pitch: rev[i], velocity: Math.max(1, (n.velocity ?? 100) - 6) }));
    if (B.every((n, i) => n.pitch === A[i].pitch)) {
      const axis = A[0].pitch;
      B = A.map((n) => ({ ...n, pitch: snapToScale(axis * 2 - n.pitch, intervals, root), velocity: Math.max(1, (n.velocity ?? 100) - 6) }));
    }

    out.push(...shiftBar(A, b0, b0));
    out.push(...shiftBar(A, b0 + 1, b0));
    out.push(...shiftBar(B, b0 + 2, b0));
    out.push(...shiftBar(A, b0 + 3, b0));
  }
  // leftover bars (non-multiple of 4) pass through untouched
  for (let b = groups * 4; b * BEATS_PER_BAR < totalBeats; b++) out.push(...inBar(b));
  return out;
}

// ---------- public API ----------
export interface ForgeResult {
  notes: ForgeNote[];
  lengthBeats: number;
  meta: { part: PartId; style: StyleId; styleLabel: string; scaleName: string; noteCount: number };
}

export function suggestRateForTempo(tempo?: number, fallback: RateId = "1/16"): RateId {
  if (!tempo) return fallback;
  if (tempo >= 140) return "1/8";
  if (tempo <= 85) return "1/16";
  return fallback;
}

// ---------- per-genre suggestions (advisory) ----------
export interface StyleHint { bpm: [number, number]; scales: string[]; note: string; }
export const STYLE_HINTS: Record<StyleId, StyleHint> = {
  melodicTechno: { bpm: [120, 126], scales: ["Natural Minor", "Dorian", "Harmonic Minor"], note: "Driving offbeat bass, emotive minor" },
  dubTechno: { bpm: [118, 125], scales: ["Natural Minor", "Dorian"], note: "Sparse offbeat stabs, deep space" },
  detroit: { bpm: [122, 130], scales: ["Dorian", "Natural Minor"], note: "Lush 7th chords, soulful syncopation" },
  ambient: { bpm: [60, 90], scales: ["Lydian", "Major", "Natural Minor"], note: "Slow evolving pads, drums optional" },
  classicSeq: { bpm: [120, 132], scales: ["Natural Minor", "Phrygian"], note: "Steady 16th sequences, Berlin school" },
  deepHouse: { bpm: [118, 124], scales: ["Dorian", "Natural Minor"], note: "Swung 7th/9th chords, warm" },
  acid: { bpm: [125, 135], scales: ["Minor Pentatonic", "Phrygian"], note: "303 bass focus, accents & slides" },
  trance: { bpm: [132, 140], scales: ["Natural Minor", "Harmonic Minor"], note: "Uplifting sus chords, rolling arps" },
  lofi: { bpm: [70, 90], scales: ["Dorian", "Major"], note: "Dusty swung breaks, jazzy 9ths" },
  synthwave: { bpm: [100, 118], scales: ["Natural Minor", "Major"], note: "80s octave bass, bright arps" },
  breakbeat: { bpm: [128, 140], scales: ["Natural Minor", "Dorian"], note: "Syncopated breaks, 7th stabs" },
};

// ---------- song builder (a clip per scene, intro -> outro) ----------
export interface SongSection { name: string; parts: PartId[]; densityMul: number; }
// ---------- Ableton Move mode ----------
// Move has four tracks. Move Mode collapses the seven Forge parts onto four stable
// tracks so a 4-instrument Move template lines up every time:
//   Move · Lead    ← lead, else counterMelody
//   Move · Bass    ← bass
//   Move · Harmony ← whichever the song uses, priority arp → chords → pad
//   Move · Drums   ← drums
export type MoveSlot = "lead" | "bass" | "harmony" | "drums" | "piano";
export const MOVE_SLOTS: MoveSlot[] = ["lead", "bass", "harmony", "drums", "piano"];
export const MOVE_SLOT_LABELS: Record<MoveSlot, string> = {
  lead: "Lead", bass: "Bass", harmony: "Harmony", drums: "Drums", piano: "Piano",
};

/** Map the parts available in a song to the four Move slots (null = empty track). */
export function resolveMoveTracks(available: PartId[]): Record<MoveSlot, PartId | null> {
  const has = (p: PartId) => available.includes(p);
  const used = new Set<PartId>();
  const take = (cands: PartId[]): PartId | null => {
    const hit = cands.find((p) => has(p) && !used.has(p)) ?? null;
    if (hit) used.add(hit);
    return hit;
  };
  // Assign in priority order without reusing a part. If a starter has no lead
  // (e.g. dub starters), promote another voice so all four Move tracks get material:
  // harmony keeps its natural source first, then lead falls back to whatever remains.
  const lead0 = take(["lead", "counterMelody"]);
  const harmony = take(["arp", "chords", "pad"]);
  const lead = lead0 ?? take(["arp", "pad", "chords"]);
  return {
    lead,
    bass: take(["bass"]),
    harmony,
    drums: take(["drums"]),
    // Piano never competes for the four core tracks: toggling it on ADDS a fifth
    // "Move · Piano" track (created only when the toggle is on).
    piano: take(["piano"]),
  };
}

const ALL_PARTS: PartId[] = ["lead", "bass", "pad", "chords", "counterMelody", "arp", "drums"];
const S = (name: string, parts: PartId[], densityMul: number): SongSection => ({ name, parts, densityMul });

export type SongTemplateId = "short" | "standard" | "long" | "berlin" | "anthem" | "sequence";
export const SONG_TEMPLATES: Record<SongTemplateId, SongSection[]> = {
  // "The sequence never leaves": eight scenes, ARP in every one. Built for a hardware sequence
  // that IS the song — the arrangement happens TO it (filter, floor in/out), never without it.
  // Uses the standard section names so every role/energy/phrase/cue map already understands it.
  sequence: [
    S("Intro", ["arp"], 0.45),
    S("Build", ["arp", "bass", "drums"], 0.6),
    S("Main", ["arp", "bass", "chords", "lead", "drums"], 0.95),
    S("Break", ["arp", "pad"], 0.5),                       // floor out — the sequence alone with a wash
    S("Main 2", ["arp", "bass", "chords", "lead", "counterMelody", "drums"], 1.0),
    S("Build 2", ["arp", "bass", "drums"], 0.7),           // stripped to the pulse, then…
    S("Drop", ["arp", "bass", "chords", "lead", "counterMelody", "drums"], 1.0),
    S("Outro", ["arp", "pad"], 0.4),
  ],
  short: [
    S("Intro", ["pad", "arp"], 0.5),
    S("Main", ALL_PARTS, 1.0),
    S("Break", ["pad", "lead", "chords"], 0.6),
    S("Outro", ["pad", "arp"], 0.4),
  ],
  standard: [
    S("Intro", ["pad", "arp"], 0.5),
    S("Build", ["pad", "arp", "bass", "chords"], 0.75),
    S("Main", ALL_PARTS, 1.0),
    S("Break", ["pad", "lead", "chords"], 0.6),
    S("Main 2", ALL_PARTS, 1.0),
    S("Outro", ["pad", "arp"], 0.4),
  ],
  long: [
    S("Intro", ["pad", "arp"], 0.5),
    S("Build", ["pad", "arp", "bass", "chords"], 0.75),
    S("Main", ALL_PARTS, 1.0),
    S("Break", ["pad", "lead", "chords"], 0.6),
    S("Main 2", ALL_PARTS, 1.0),
    S("Build 2", ["pad", "arp", "bass", "chords", "counterMelody"], 0.8),
    S("Drop", ALL_PARTS, 1.05),
    S("Outro", ["pad", "arp"], 0.4),
  ],
  // Berlin School (Rubycon / Halcyon / Belfast): strictly ADDITIVE — the sequence
  // starts alone and layers accumulate one per section toward the peak, then the
  // arrangement strips to its emotional core (Winter) and rebuilds.
  berlin: [
    S("Pulse", ["arp"], 0.6),
    S("Layer 1", ["arp", "bass"], 0.7),
    S("Layer 2", ["arp", "bass", "pad"], 0.8),
    S("Layer 3", ["arp", "bass", "pad", "chords", "drums"], 0.9),
    S("Peak", ALL_PARTS, 1.0),
    S("Strip", ["lead", "pad"], 0.45),
    S("Peak 2", ALL_PARTS, 1.0),
    S("Fade", ["arp", "pad"], 0.35),
  ],
  // Anthem (Knights of the Jaguar / Café del Mar): the groove establishes first,
  // then a breakdown EXPOSES the anthem lead over pads, lifts, and drops.
  anthem: [
    S("Intro", ["drums", "bass"], 0.6),
    S("Groove", ["drums", "bass", "arp", "chords"], 0.85),
    S("Breakdown", ["lead", "pad", "chords"], 0.55),
    S("Lift", ["lead", "pad", "chords", "arp"], 0.75),
    S("Drop", ALL_PARTS, 1.05),
    S("Groove 2", ALL_PARTS, 0.95),
    S("Outro", ["drums", "bass", "arp"], 0.5),
  ],
};

/** Musical role of a section, from its name (works across all templates). */
function sectionRole(name: string): "opener" | "builder" | "payoff" | "break" | "closer" | "riser" {
  const n = name.toLowerCase();
  if (/intro|pulse/.test(n)) return "opener";
  if (/lift/.test(n)) return "riser";
  if (/main|drop|peak|groove/.test(n)) return "payoff";
  if (/break|strip/.test(n)) return "break";
  if (/outro|fade/.test(n)) return "closer";
  if (/build|layer/.test(n)) return "builder";
  return "builder";
}

/** Where the Piano part plays across a song, per the user's placement dial.
 *  - intro:  the piece bookends the song (opener + closer sections)
 *  - breaks: the piece arrives at every breakdown (break-role sections)
 *  - motif:  everywhere — full in quiet sections, statement-only (sparse) in payoffs/risers
 *  - all:    everywhere, full treatment (section densityMul still scales it) */
export type PianoPlacement = "intro" | "breaks" | "motif" | "all";
export function pianoInSection(
  placement: PianoPlacement, sectionName: string, index: number, total: number,
): { plays: boolean; sparse: boolean } {
  const role = sectionRole(sectionName);
  const bookend = index === 0 || index === total - 1 || role === "opener" || role === "closer";
  switch (placement) {
    case "intro": return { plays: bookend, sparse: false };
    case "breaks": return { plays: role === "break", sparse: false };
    case "motif": return { plays: true, sparse: role === "payoff" || role === "riser" };
    case "all": return { plays: true, sparse: false };
  }
}

/** Logical bar count for a Song section — sections do NOT all need the same length. Payoff
 *  sections (Main/Drop/Peak/Groove) run longer; openers/breaks/closers are tighter; risers are
 *  short. Hypnotic genres get longer sections overall (more room to evolve); lo-fi stays short.
 *  All values are musical multiples of 4/8. Deterministic (role × style), so a song's arrangement
 *  is stable for a given template + style. */
const SECTION_BARS_BY_ROLE: Record<string, Record<string, number>> = {
  // opener builder payoff break closer riser
  hypnotic: { opener: 8, builder: 16, payoff: 32, break: 16, closer: 8, riser: 8 },
  standard: { opener: 8, builder: 8, payoff: 16, break: 8, closer: 8, riser: 4 },
  short: { opener: 4, builder: 8, payoff: 8, break: 8, closer: 4, riser: 4 },
};
/** Ableton Move clip limit (v0.78): Move clips top out at 16 bars. When the cap is on, every
 *  clip MFL writes — song scenes and long evolving clips alike — is clamped to 16. Pure. */
export const MOVE_MAX_BARS = 16;
export function capBarsForMove(bars: number, on: boolean): number {
  return on ? Math.max(1, Math.min(MOVE_MAX_BARS, bars)) : bars;
}

export function sectionBars(sectionName: string, style: StyleId): number {
  const HYPNOTIC = new Set<StyleId>(["dubTechno", "classicSeq", "melodicTechno", "ambient", "detroit"]);
  const cat = style === "lofi" ? "short" : HYPNOTIC.has(style) ? "hypnotic" : "standard";
  return SECTION_BARS_BY_ROLE[cat][sectionRole(sectionName)];
}

/** Per-section energy 0..1 for the build/release arc across a Song. */

// ============================================================================
// TRANSITION PLANNER (v0.77, P1-3)
// One plan per scene boundary, from (source, destination, energy delta, tension
// goal). The plan is applied to the LAST bar of each part's clip, consistently
// across parts, and it writes its own line into the scene's playing cue.
// ============================================================================
export type HarmonicPrep = "V" | "bVII" | null;
export interface TransitionPlan {
  from: string; to: string; delta: number; tension: number;
  /** melodic parts: 1–2 scale-step pickup notes into the next scene's first chord root */
  pickup: 0 | 1 | 2;
  /** beats of silence at the very end for non-pad, non-drum parts (a breath before a drop-out) */
  silence: 0 | 1 | 2;
  /** drums: fill length in beats (0 = none) and how hard */
  fill: { beats: 0 | 2 | 4; intensity: number };
  /** harmonic parts: re-voice the last bar toward the dominant (V) or the subtonic (bVII) */
  harmonicPrep: HarmonicPrep;
  /** automation cue for the performer (appended to the scene cue) */
  cue: string;
}

/** Tension goal for arriving at a scene: how much the arrival should feel "earned". */
export function sectionTension(section: string): number {
  switch (section) {
    case "Drop": case "Peak": case "Peak 2": case "Main 2": return 0.9;
    case "Main": case "Layer 3": case "Groove 2": case "Lift": return 0.7;
    case "Build": case "Build 2": case "Layer 2": case "Groove": return 0.5;
    case "Break": case "Breakdown": case "Strip": return 0.35;
    case "Outro": case "Fade": return 0.1;
    default: return 0.4;
  }
}

export function planTransition(from: string, to: string | null, style: StyleId): TransitionPlan | null {
  if (!to) return null;
  const eF = sectionEnergy(from), eT = sectionEnergy(to);
  const delta = eT - eF;
  const tension = sectionTension(to);
  const rising = delta > 0.12, falling = delta < -0.18;
  const bigRise = delta > 0.25;
  const modal = style === "dubTechno" || style === "ambient" || style === "classicSeq"; // bVII, not V
  const plan: TransitionPlan = {
    from, to, delta, tension,
    pickup: rising ? (bigRise ? 2 : 1) : 0,
    silence: falling ? (delta < -0.35 ? 2 : 1) : 0,
    fill: { beats: rising ? (bigRise ? 4 : 2) : 0, intensity: clamp(0.5 + delta, 0.3, 1) },
    harmonicPrep: tension >= 0.7 && rising ? (modal ? "bVII" : "V") : null,
    cue: "",
  };
  const bits: string[] = [];
  if (plan.harmonicPrep) bits.push(`last bar leans to ${plan.harmonicPrep} — let it want ${to}`);
  if (plan.pickup) bits.push(`${plan.pickup}-note pickup into the downbeat`);
  if (plan.fill.beats) bits.push(`${plan.fill.beats}-beat fill${bigRise ? ", hard" : ""}`);
  if (plan.silence) bits.push(`${plan.silence}-beat drop-out before ${to} — leave the reverb tail`);
  if (rising) bits.push("automation: filter/DCW closed through the last bar, open ON the downbeat");
  else if (falling) bits.push("automation: pull the filter down across the last bar; the space is the transition");
  plan.cue = bits.length ? `⇢ ${to}: ${bits.join("; ")}.` : "";
  return plan;
}

/** Apply a plan to one part's notes (pure). `nextRootDeg` is the scale degree of the next
 *  scene's first chord root (for pickups); `curRootDeg` the last bar's chord root. */
export function applyTransition(
  notes: ForgeNote[], plan: TransitionPlan | null, part: PartId, totalBeats: number,
  intervals: number[], root: number, octave: number, step: number, curRootDeg: number, nextRootDeg: number,
  authoredLead = false,
): ForgeNote[] {
  if (!plan || totalBeats < BEATS_PER_BAR * 2) return notes;
  // PRIORITY (v0.84): a hand-authored motif (motif-in) outranks the planner on the part that
  // plays it — the lead's line is never trimmed or given a pickup. Harmony still prepares.
  const protectedLine = authoredLead && part === "lead";
  if (part === "drums") {
    // v0.84: drums respect the drop-out (the fill only happens on rising plans, never with silence)
    if (!plan.silence) return notes;
    const cut = totalBeats - plan.silence;
    return notes.filter((n) => n.startTime < cut - 1e-6);
  }
  const barStart = totalBeats - BEATS_PER_BAR;
  let out = notes.slice();
  const harmonic = part === "chords" || part === "pad" || part === "bass" || part === "piano";
  const melodic = part === "lead" || part === "arp" || part === "counterMelody";

  // 1. harmonic preparation: re-voice the last bar toward V (+4 degrees) or bVII (−1 degree)
  if (plan.harmonicPrep && harmonic) {
    // v0.84: target the V / bVII OF THE DESTINATION's first chord, not a shift of whatever the
    // last bar happened to hold. Each note keeps its interval above the current chord root and
    // is re-rooted on the target, so the voicing SHAPE survives and the root is right.
    const target = nextRootDeg + (plan.harmonicPrep === "V" ? 4 : -1);
    out = out.map((n) => {
      if (n.startTime < barStart - 1e-6) return n;
      const deg = midiToScaleDegree(n.pitch, intervals, root);
      return { ...n, pitch: scaleDegreeToMidi(deg - curRootDeg + target, intervals, root, -1) };
    });
  }
  // 2. silence: cut everything that starts in the final `silence` beats (pads keep ringing)
  if (plan.silence && part !== "pad" && !protectedLine) {
    const cut = totalBeats - plan.silence;
    out = out.filter((n) => n.startTime < cut - 1e-6).map((n) =>
      n.startTime + n.duration > cut ? { ...n, duration: Math.max(0.1, cut - n.startTime) } : n);
  }
  // 3. pickup: the last 1–2 steps walk up (or down) into the next scene's chord root
  if (plan.pickup && melodic && !plan.silence && !protectedLine) {
    const target = nextRootDeg + intervals.length * 1; // an octave above the root degree — top-line register
    const lastOn = totalBeats - step * plan.pickup;
    out = out.filter((n) => n.startTime < lastOn - 1e-6).map((n) =>
      n.startTime + n.duration > lastOn ? { ...n, duration: Math.max(0.1, lastOn - n.startTime) } : n);
    const from = target - plan.pickup; // step-wise approach from below
    for (let k = 0; k < plan.pickup; k++) {
      out.push({ pitch: scaleDegreeToMidi(from + k, intervals, root, octave), startTime: lastOn + k * step,
        duration: step * 0.85, velocity: 96 + k * 10 });
    }
  }
  return out;
}

/** v0.83: WHO PLAYS in a scene — one function, used by the song builder AND the Performance
 *  Sheet, so the sheet can never describe a scene the clips don't contain. Template parts ∩
 *  the song's palette; when a scene asks for a role the palette can't supply (25 starters had
 *  silent Intro/Outro this way — template wants pad+arp, starter has chords+bass+lead+drums),
 *  the nearest available part of the same ROLE stands in: harmony pad→chords→arp, melody
 *  arp→lead→counterMelody. A scene is never empty if the palette isn't. */
export function scenePlays(sectionParts: PartId[], palette: PartId[]): PartId[] {
  const pal = new Set(palette);
  const plays = sectionParts.filter((p) => pal.has(p));
  const HARM: PartId[] = ["pad", "chords", "arp"], MEL: PartId[] = ["arp", "lead", "counterMelody"];
  const wantsHarm = sectionParts.some((p) => HARM.includes(p)), hasHarm = plays.some((p) => HARM.includes(p));
  if (wantsHarm && !hasHarm) { const sub = HARM.find((p) => pal.has(p)); if (sub) plays.push(sub); }
  const wantsMel = sectionParts.some((p) => MEL.includes(p)), hasMel = plays.some((p) => MEL.includes(p));
  if (wantsMel && !hasMel) { const sub = MEL.find((p) => pal.has(p) && !plays.includes(p)); if (sub) plays.push(sub); }
  if (!plays.length) { const sub = palette.find((p) => p !== "drums") ?? palette[0]; if (sub) plays.push(sub); }
  return ALL_PARTS.concat(["piano" as PartId]).filter((p) => plays.includes(p));
}

export function sectionEnergy(section: string): number {
  switch (section) {
    case "Intro": return 0.30;
    case "Build": return 0.55;
    case "Main": return 0.80;
    case "Break": return 0.42;
    case "Main 2": return 0.88;
    case "Build 2": return 0.72;
    case "Drop": return 1.0;
    case "Outro": return 0.22;
    // Berlin School — additive climb, strip, rebuild
    case "Pulse": return 0.35;
    case "Layer 1": return 0.5;
    case "Layer 2": return 0.62;
    case "Layer 3": return 0.78;
    case "Peak": return 1.0;
    case "Strip": return 0.4;
    case "Peak 2": return 1.0;
    case "Fade": return 0.2;
    // Anthem — groove, expose, lift, drop
    case "Groove": return 0.75;
    case "Breakdown": return 0.5;
    case "Lift": return 0.7;
    case "Groove 2": return 0.85;
    default: return 0.7;
  }
}

/** Deterministic per-(section, part) seed from a single song seed. */
export function sectionSeed(songSeed: number, sectionIdx: number, part: PartId): number {
  const p = ALL_PARTS.indexOf(part) + 1;
  let h = (songSeed | 0) >>> 0;
  h = (Math.imul(h ^ (sectionIdx + 1), 0x9e3779b1) >>> 0);
  h = (Math.imul(h ^ p, 0x85ebca77) >>> 0);
  return h % 1000000;
}


/** SONG MOTIF STATE (v0.76): continuous identity ↔ evolution. The line is already the song's
 *  motif; `strength` (0..100) decides how much of it is allowed to bend. Anchors — the first
 *  note of every bar and every downbeat — are never touched, so the cell stays recognisable;
 *  a share of the remaining notes take a one-step scale neighbour. Deterministic per scene
 *  (section RNG), so re-rolls are stable and a lower strength evolves MORE, never differently. */
function evolveLine(ctx: Ctx, notes: ForgeNote[], strength: number): ForgeNote[] {
  const bend = clamp((100 - strength) / 100, 0, 1) * 0.6;
  if (bend <= 0 || !notes.length) return notes;
  const { intervals, cfg } = ctx;
  const r = ctx.rMotif ?? ctx.r;
  const seenBar = new Set<number>();
  return notes.map((n) => {
    const bar = Math.floor(n.startTime / BEATS_PER_BAR);
    const firstOfBar = !seenBar.has(bar); seenBar.add(bar);
    const downbeat = Math.abs(n.startTime % 1) < 1e-6;
    if (bar === 0 && strength >= 70) return n; // v0.76.1: statement bar untouchable in the literal band
    if (firstOfBar || downbeat || !chance(r, bend)) return n;
    const dir = r() < 0.5 ? -1 : 1;
    const deg = midiToScaleDegree(n.pitch, intervals, cfg.root);
    return { ...n, pitch: scaleDegreeToMidi(deg + dir, intervals, cfg.root, -1) };
  });
}

export function generate(cfg: ForgeConfig): ForgeResult {
  const traits = STYLES[cfg.style] ?? STYLES.melodicTechno;
  const intervals = SCALES[cfg.scale] ?? SCALES["Natural Minor"];
  const r = mulberry32((cfg.seed | 0) ^ 0x9e3779b9);
  const totalBeats = Math.max(1, cfg.bars) * BEATS_PER_BAR;
  const step = rateBeats(cfg.rate);

  const dna = cfg.dna;
  const strength = clamp(cfg.strength ?? 0, 0, 100);
  const useDna = !!dna && strength > 0;

  // Shared progression is the cheapest, strongest identity signal: when a DNA is
  // active every part draws the SAME harmony instead of picking its own.
  // Precedence: explicitly chosen preset > DNA > genre pool.
  const presetProg = presetProgression(cfg.progressionPreset, intervals);
  // v0.85 PER-DIMENSION DNA STRENGTH — every dimension interpolates between the song's DNA
  // (100) and the free generator (0). Absent dims follow the master `strength`.
  // Absent dims reproduce pre-0.85 EXACTLY: harmony & groove were 100% DNA whenever the DNA was
  // on, motif & rhythm followed strength, and the motif line sat at the dialog's octave (reg 0).
  const mix = Object.fromEntries(DNA_DIMS.map((d) => [d, clamp(cfg.dnaMix?.[d] ?? DNA_DIM_DEFAULT(d, strength), 0, 100)])) as Record<DnaDim, number>;
  const prog = presetProg ?? (useDna ? blendProgression(dna!, traits.progressions, mix.harmony) : pick(r, traits.progressions));
  const freeSwing = cfg.swing > 0 ? cfg.swing / 100 : traits.swing;
  const g = mix.groove / 100;
  const swing = useDna ? freeSwing + (dna!.groove.swing / 100 - freeSwing) * g : freeSwing;
  const humanizeSrc = useDna ? { ...cfg, humanize: Math.round(cfg.humanize + (dna!.groove.humanize - cfg.humanize) * g) } : cfg;
  const gate = traits.gate * tempoGate(cfg.tempo);
  const salt = ((cfg.sceneSalt ?? 0) * 0x9e3779b1) >>> 0;
  const songR = (k: number) => mulberry32((((dna?.seed ?? 0) | 0) ^ k ^ salt) >>> 0);
  const rMotif = useDna && cfg.dnaLocks?.motif ? songR(0x6d6f7469) : r;
  const rRhythm = useDna && cfg.dnaLocks?.rhythm ? songR(0x72687974) : r;
  const regOctave = useDna ? cfg.octave + (dna!.baseOctave - cfg.octave) * (mix.register / 100) : cfg.octave; // fractional: centre moves smoothly

  // ctx.strength is the MOTIF dimension from here on (literal band, bends, arp cell all follow it)
  const ctx: Ctx = { cfg: humanizeSrc, traits, intervals, r, totalBeats, step, prog, swing, gate, dna, strength: mix.motif, userHumanize: cfg.humanize,
    mix, rMotif, rRhythm, regOctave };

  // MOTIF-IN: is this the lead playing a hand-authored motif verbatim? Then the identity-
  // preserving post-processors below (register clamps, hook form, phrasing, scale lock, groove
  // re-timing) must NOT touch it — they exist to shape SYNTHESISED lines. Energy stays: the
  // section should still breathe under the user's notes.
  const authoredLead = cfg.part === "lead" && useDna && !!dna!.authored && dna!.authored.notes.length > 0 && strength > 0;
  let notes: ForgeNote[];
  switch (cfg.part) {
    case "chords": notes = genChords(ctx, false); break;
    case "pad": notes = genChords(ctx, true); break;
    case "bass": notes = genBass(ctx); break;
    case "arp": notes = genArp(ctx); break;
    case "lead":
      // MOTIF-IN: an authored line is played DETERMINISTICALLY (no strength dice) — the whole
      // point is that the user's notes are the song. Strength still governs the accompaniment.
      if (authoredLead) notes = genMotifLine(ctx, "lead");
      // SONG MOTIF STATE (v0.76): with a DNA the lead ALWAYS speaks the song's motif — no
      // per-scene coin flip. Strength is now a continuous evolution amount (see evolveLine),
      // so a scene never abandons the cell; it bends it.
      else notes = useDna ? evolveLine(ctx, genMotifLine(ctx, "lead"), mix.motif) : genMelodicLine(ctx, "lead");
      break;
    case "counterMelody":
      if (cfg.leadNotes && cfg.leadNotes.length) {
        notes = genCallResponse(ctx, cfg.leadNotes);
        if (!notes.length) notes = genMelodicLine(ctx, "counter"); // lead left no gaps
      } else {
        notes = useDna ? evolveLine(ctx, genMotifLine(ctx, "counter"), mix.motif) : genMelodicLine(ctx, "counter");
      }
      break;
    case "piano": notes = genPiano(ctx); break;
    case "drums": notes = genDrums(ctx); break;
    default:
      // Fail LOUDLY at the source. Without this an unknown part id (e.g. the pre-rename
      // "melody") left `notes` undefined and crashed later in cleanupNotes with a cryptic error.
      throw new Error(`generate(): unknown part "${String(cfg.part)}" — expected one of ${Object.keys(PART_LABELS).join(", ")}`);
  }

  // Register identity: keep monophonic parts in their DNA octave band (kills wild
  // jumps). Chords/pad keep their voicing; BASS is exempt so its octave jumps
  // survive — the hard per-part range below still keeps it sane.
  const MONO_REGISTER: PartId[] = ["lead", "counterMelody", "bass", "arp"];
  const DNA_REGISTER: PartId[] = ["lead", "counterMelody", "arp"];
  if (useDna && DNA_REGISTER.includes(cfg.part) && !authoredLead) {
    const [lo, hi] = registerWindow(dna!, cfg.part, cfg.root, regOctave);
    notes = notes.map((n) => ({ ...n, pitch: clampToRegister(n.pitch, lo, hi, intervals, cfg.root) }));
  }

  const range = partRange(cfg.part, cfg.root, cfg.octave);

  // Hook discipline (AABA'): state, repeat, answer, restate — before phrasing so
  // cadences still land per-bar on top of the form.
  if (cfg.part === "lead" && (cfg.hookMode ?? traits.hook) && !authoredLead) {
    notes = imposeHookForm(notes, intervals, cfg.root, totalBeats);
  }

  // Phrase structure (question/answer) shapes the lead's cadences + climax.
  if (useDna && cfg.part === "lead" && dna!.phrase && !authoredLead) {
    notes = applyPhrasing(notes, dna!.phrase, intervals, cfg.root, totalBeats, range);
  }

  // Hard per-part octave range — enforced for monophonic parts (chords/pad keep
  // their voicing). Catches any runaway and keeps each part in a sane register.
  if (MONO_REGISTER.includes(cfg.part) && !authoredLead) {
    notes = notes.map((n) => ({ ...n, pitch: clampToRegister(n.pitch, range[0], range[1], intervals, cfg.root) }));
  }

  if (cfg.scaleLock && !authoredLead) {
    notes = notes.map((n) =>
      cfg.part === "drums" || n.keepChromatic ? n : { ...n, pitch: snapToScale(n.pitch, intervals, cfg.root) },
    );
  }

  // Section energy (build/release) then the shared groove feel — both applied to
  // EVERY part so the section moves and breathes together.
  if (cfg.energy != null) notes = applyEnergy(notes, cfg.energy);
  if (useDna && !authoredLead) notes = applyGroove(notes, dna!.groove, (cfg.grooveDepth ?? 55) * (mix.groove / 100)); // v0.85 GROOVE dimension

  // Transition fill (drums): the last bar builds a rising snare fill into the next,
  // higher-energy section — the classic "arranged by a human" cue.
  // ---- Long-clip musicality (bars >= 32) ----------------------------------
  const totalBarsAll = Math.round(totalBeats / BEATS_PER_BAR);
  if (totalBarsAll >= 32) {
    const dr = mulberry32((cfg.seed | 0) ^ 0xd41f7); // fresh PRNG: deterministic, independent of generator consumption
    const finalThird = totalBeats * (2 / 3);
    if (cfg.part === "bass" && notes.length) {
      // Slow register drift: in the final third, ~35% of bass notes lift an octave —
      // the hypnotic anchor keeps its rhythm, but the register slowly opens up.
      notes = notes.map((n) => {
        if (n.startTime < finalThird || n.pitch == null) return n;
        return dr() < 0.35 ? { ...n, pitch: n.pitch + 12 } : n;
      });
    }
    if (cfg.part === "pad" && notes.length) {
      // Voicing widening: in the final third, double each chord's top note an octave up
      // (soft velocity) so the pad blooms as the clip evolves.
      const byOnset = new Map<number, ForgeNote[]>();
      for (const n of notes) {
        if (n.startTime < finalThird || n.pitch == null) continue;
        const k = Math.round(n.startTime * 1000);
        (byOnset.get(k) ?? byOnset.set(k, []).get(k)!).push(n);
      }
      const added: ForgeNote[] = [];
      for (const group of byOnset.values()) {
        if (dr() > 0.6) continue; // widen ~60% of late chords, not all
        const top = group.reduce((a, b) => ((b.pitch ?? -1) > (a.pitch ?? -1) ? b : a));
        if (top.pitch != null && top.pitch + 12 <= 108) {
          added.push({ ...top, pitch: top.pitch + 12, velocity: clamp(Math.round((top.velocity ?? 90) * 0.7), 1, 127) });
        }
      }
      notes = notes.concat(added);
    }
    if (cfg.part === "drums" && notes.length && totalBarsAll >= 24) {
      // Mid-clip fills: a light snare build in the last beat of every 16th bar keeps long
      // payoff sections alive. Skips the final bar (fillAtEnd owns that) and skips kits
      // with no snare content (ambient/none kits generate no notes anyway).
      const D = { ...DRUM_MAP, ...(cfg.drumMap ?? {}) };
      const pop = cfg.drumMap != null ? [...new Set(Object.values(cfg.drumMap))] : [];
      const snareN = cfg.drumMap != null ? (mapNoteToKit(DRUM_MAP.snare, pop) ?? D.snare) : D.snare;
      for (let bar = 16; bar < totalBarsAll; bar += 16) {
        if (bar >= totalBarsAll - 1) break; // never the final bar
        const beatStart = bar * BEATS_PER_BAR - 1; // last beat before the boundary
        for (let s = 0; s < 4; s++) {
          if (s === 0 && dr() < 0.4) continue; // sparse start
          notes.push({ pitch: snareN, startTime: beatStart + s * 0.25, duration: 0.09, velocity: clamp(58 + s * 9, 1, 127) });
        }
      }
    }
  }

  if (cfg.fillAtEnd && cfg.part === "drums" && totalBeats >= BEATS_PER_BAR) {
    const D = { ...DRUM_MAP, ...(cfg.drumMap ?? {}) };
    // Kit-aware: fills only use kick/snare (essentials) — resolve to nearest populated pad.
    const pop = cfg.drumMap != null ? [...new Set(Object.values(cfg.drumMap))] : [];
    const kickN = cfg.drumMap != null ? (mapNoteToKit(DRUM_MAP.kick, pop) ?? D.kick) : D.kick;
    const snareN = cfg.drumMap != null ? (mapNoteToKit(DRUM_MAP.snare, pop) ?? D.snare) : D.snare;
    const barStart = totalBeats - BEATS_PER_BAR;
    // clear the fill zone (last 2 beats) of hats so the fill reads clearly
    notes = notes.filter((n) => !(n.startTime >= barStart + 2 - 1e-6 && (n.pitch === D.closedHat || n.pitch === D.openHat)));
    const fb = cfg.fillBeats ?? 2, fi = clamp(cfg.fillIntensity ?? 0.7, 0.3, 1);
    const fStart = barStart + (BEATS_PER_BAR - fb), steps = fb * 4;
    if (fb === 4) notes = notes.filter((n) => !(n.startTime >= barStart - 1e-6 && (n.pitch === D.closedHat || n.pitch === D.openHat)));
    for (let s = 0; s < steps; s++) {
      const t = fStart + s * 0.25;
      if (s >= steps / 4 || chance(r, 0.6)) { // sparse start, solid finish — a build
        notes.push({ pitch: snareN, startTime: t, duration: 0.1, velocity: clamp(Math.round((56 + s * (64 / steps)) * (0.6 + fi * 0.5)), 1, 127) });
      }
    }
    notes.push({ pitch: kickN, startTime: totalBeats - 0.25, duration: 0.1, velocity: 118 }); // launch kick
  }

  // Final cadence (melodic parts): the song ENDS — last note resolves to the tonic,
  // held to the bar line, and the whole final bar fades.
  if (cfg.finalCadence && cfg.part !== "drums" && notes.length && totalBeats >= BEATS_PER_BAR) {
    const barStart = totalBeats - BEATS_PER_BAR;
    // fade the final bar
    notes = notes.map((n) => {
      if (n.startTime < barStart - 1e-6) return n;
      const k = 1 - 0.55 * ((n.startTime - barStart) / BEATS_PER_BAR);
      return { ...n, velocity: clamp(Math.round((n.velocity ?? 100) * k), 1, 127) };
    });
    // resolve every voice sounding at the final onset to a chord-of-I tone, held out
    const lastOnset = Math.max(...notes.map((n) => n.startTime));
    notes = notes.map((n) => {
      if (Math.abs(n.startTime - lastOnset) > 1e-6) return n;
      const resolved = cfg.part === "chords" || cfg.part === "pad"
        ? n.pitch // chords keep their voicing; the bass voice already carries the root
        : nearestDegreePitch(n.pitch, 0, intervals, cfg.root);
      return { ...n, pitch: resolved, duration: Math.max(n.duration, totalBeats - n.startTime), keepChromatic: false };
    });
    // the bass explicitly lands on the tonic
    if (cfg.part === "bass") {
      const last = notes.reduce((a, n) => (n.startTime > a.startTime ? n : a));
      last.pitch = nearestDegreePitch(last.pitch, 0, intervals, cfg.root);
    }
  }

  notes = cleanupNotes(notes, totalBeats);

  return {
    notes,
    lengthBeats: totalBeats,
    meta: {
      part: cfg.part, style: cfg.style, styleLabel: traits.label,
      scaleName: cfg.scale, noteCount: notes.length,
    },
  };
}

export const _internal = { scaleDegreeToMidi, snapToScale, rateBeats, mulberry32, tempoGate, applySwing };
