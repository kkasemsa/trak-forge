// Generated from forge/engine.ts by scripts/build-engine.mjs. Do not edit.

// forge/engine.ts
var PART_LABELS = {
  lead: "Lead",
  bass: "Bass",
  pad: "Pad",
  chords: "Chords",
  counterMelody: "Counter Melody",
  piano: "Piano",
  arp: "Arp",
  drums: "Drums"
};
var DNA_DIMS = ["harmony", "motif", "rhythm", "groove", "register"];
var DNA_DIM_DEFAULT = (d, strength) => d === "harmony" || d === "groove" || d === "register" ? 100 : strength;
var SCALES = {
  "Natural Minor": [0, 2, 3, 5, 7, 8, 10],
  Major: [0, 2, 4, 5, 7, 9, 11],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11],
  "Minor Pentatonic": [0, 3, 5, 7, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10]
};
var NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B"
];
var BEATS_PER_BAR = 4;
var DRUM_MAP = {
  kick: 36,
  snare: 38,
  clap: 39,
  closedHat: 42,
  openHat: 46,
  ride: 51,
  perc: 37,
  shaker: 70
};
var STYLES = {
  melodicTechno: {
    label: "Melodic Techno",
    progressions: [[0, 5, 2, 6], [0, 6, 5, 4], [0, 3, 6, 4], [5, 6, 0, 0]],
    chordShape: "triad",
    chordPlacement: "downbeat",
    bass: "offbeatRoll",
    arpDir: ["up", "down", "updown"],
    drums: "fourFloor",
    swing: 0,
    defaultRate: "1/16",
    gate: 1,
    hook: true
  },
  dubTechno: {
    label: "Dub Techno",
    progressions: [[0, 3], [0, 4], [0, 5]],
    chordShape: "triad",
    chordPlacement: "stab",
    bass: "rootAnchor",
    arpDir: ["up", "updown"],
    drums: "sparse",
    swing: 0,
    defaultRate: "1/8",
    gate: 0.9
  },
  detroit: {
    label: "Detroit",
    progressions: [[0, 3, 4, 5], [0, 5, 3, 4], [5, 3, 0, 4], [5, 6, 0, 0]],
    chordShape: "seventh",
    chordPlacement: "swung",
    bass: "rootAnchor",
    arpDir: ["up", "updown"],
    drums: "fourFloor",
    swing: 0.08,
    defaultRate: "1/16",
    gate: 1,
    hook: true
  },
  ambient: {
    label: "Ambient",
    progressions: [[0, 5, 3, 4], [0, 4, 5, 3], [0, 5, 0, 4]],
    chordShape: "add9",
    chordPlacement: "wash",
    bass: "rootAnchor",
    arpDir: ["updown", "up"],
    drums: "sparse",
    swing: 0,
    defaultRate: "1/8",
    gate: 1.6
  },
  classicSeq: {
    label: "Classic Sequence",
    progressions: [[0, 4, 5, 3], [0, 5, 3, 4]],
    chordShape: "triad",
    chordPlacement: "downbeat",
    bass: "octave",
    arpDir: ["up"],
    drums: "electro",
    swing: 0,
    defaultRate: "1/16",
    gate: 0.95,
    evolve: true
  },
  deepHouse: {
    label: "Deep House",
    progressions: [[1, 4, 0, 5], [0, 3, 5, 4], [5, 4, 3, 0]],
    chordShape: "seventh",
    chordPlacement: "swung",
    bass: "offbeatRoll",
    arpDir: ["up", "updown"],
    drums: "house",
    swing: 0.14,
    defaultRate: "1/16",
    gate: 1
  },
  acid: {
    label: "Acid",
    progressions: [[0, 0, 0, 3], [0, 3, 0, 5]],
    chordShape: "triad",
    chordPlacement: "stab",
    bass: "acid",
    arpDir: ["up", "random"],
    drums: "fourFloor",
    swing: 0.04,
    defaultRate: "1/16",
    gate: 0.8,
    evolve: true
  },
  trance: {
    label: "Trance",
    progressions: [[0, 5, 3, 4], [0, 3, 4, 5], [0, 5, 2, 6]],
    chordShape: "sus",
    chordPlacement: "downbeat",
    bass: "offbeatRoll",
    arpDir: ["up", "updown"],
    drums: "fourFloor",
    swing: 0,
    defaultRate: "1/16",
    gate: 0.9,
    hook: true
  },
  lofi: {
    label: "Lo-Fi",
    progressions: [[1, 4, 0, 3], [0, 5, 1, 4], [3, 5, 0, 4]],
    chordShape: "ninth",
    chordPlacement: "swung",
    bass: "walking",
    arpDir: ["updown", "random"],
    drums: "breakbeat",
    swing: 0.26,
    defaultRate: "1/8",
    gate: 1.1
  },
  synthwave: {
    label: "Synthwave",
    progressions: [[0, 5, 3, 4], [5, 3, 0, 4]],
    chordShape: "triad",
    chordPlacement: "downbeat",
    bass: "octave",
    arpDir: ["up"],
    drums: "electro",
    swing: 0,
    defaultRate: "1/16",
    gate: 1,
    hook: true,
    evolve: true
  },
  breakbeat: {
    label: "Breakbeat",
    progressions: [[0, 3, 0, 5], [0, 5, 3, 4]],
    chordShape: "seventh",
    chordPlacement: "stab",
    bass: "rootAnchor",
    arpDir: ["up", "random"],
    drums: "breakbeat",
    swing: 0.1,
    defaultRate: "1/16",
    gate: 0.9
  }
};
var PROGRESSION_PRESETS = [
  { id: "auto", label: "Auto (genre)", mood: "let the genre pick" },
  { id: "royalRoad", label: "Royal Road", mood: "bittersweet lift, yearning", major: [3, 4, 2, 5], minor: [5, 6, 4, 0] },
  { id: "axis", label: "Axis", mood: "anthemic, hopeful", major: [0, 4, 5, 3], minor: [0, 5, 2, 6] },
  { id: "andalusian", label: "Andalusian", mood: "dramatic descent, inevitability", minor: [0, 6, 5, 4], raiseV: true },
  { id: "epicRise", label: "Epic Rise", mood: "heroic build", major: [3, 4, 0, 0], minor: [5, 6, 0, 0] },
  { id: "doowop", label: "Doo-wop", mood: "nostalgic warmth", major: [0, 5, 3, 4], minor: [0, 5, 3, 4] },
  { id: "pachelbel", label: "Pachelbel", mood: "stately, wistful (8-bar cycle)", major: [0, 4, 5, 2, 3, 0, 3, 4] },
  { id: "static", label: "Static (one chord)", mood: "hypnotic, dub / Berlin", major: [0], minor: [0] }
];
function scaleIsMajor(intervals) {
  return (intervals[2] ?? 4) === 4;
}
function presetProgression(presetId, intervals) {
  if (!presetId || presetId === "auto") return null;
  const p = PROGRESSION_PRESETS.find((x) => x.id === presetId);
  if (!p) return null;
  const major = scaleIsMajor(intervals);
  const len = intervals.length;
  if (major && p.major) return p.major;
  if (!major && p.minor) return p.minor;
  if (major && p.minor) return p.minor.map((d) => (d + 5) % len);
  if (!major && p.major) return p.major.map((d) => (d + 2) % len);
  return null;
}
function presetRaisesV(presetId) {
  return !!PROGRESSION_PRESETS.find((x) => x.id === presetId)?.raiseV;
}
function starterClipBars(s) {
  if (s.clipBars && s.clipBars > 0) return Math.min(64, s.clipBars);
  const t = s.tags ?? [];
  const LONG_STYLES = /* @__PURE__ */ new Set(["dubTechno", "classicSeq", "melodicTechno", "ambient", "detroit"]);
  if (s.songLength === "berlin") return 64;
  if (t.includes("long-form") && LONG_STYLES.has(s.style)) return 48;
  if (t.includes("hypnotic") || t.includes("long-form")) return 32;
  return 0;
}
function isLongStarter(s) {
  return starterClipBars(s) >= 16;
}
var ALL_MEL = ["lead", "bass", "pad", "chords", "counterMelody", "arp", "drums"];
var SONG_STARTERS = [
  {
    id: "berlinCathedral",
    name: "Berlin Cathedral",
    desc: "Vast, hypnotic Berlin-School sequence that slowly evolves and layers into a cathedral of sound. Rubycon / Ricochet territory.",
    style: "classicSeq",
    scale: "Natural Minor",
    bpm: 124,
    rate: "1/16",
    progression: "static",
    songLength: "berlin",
    strength: 95,
    grooveDepth: 70,
    swing: 0,
    density: 70,
    octave: 3,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "pad", "chords", "lead", "drums"],
    soundProfile: "berlinAnalogSeq"
  },
  {
    id: "detroitSoul",
    name: "Detroit Soul",
    desc: "Warm, swung Detroit techno \u2014 lush 7th chords over a soulful turnaround with a singable hook. Soulful and a little melancholy.",
    style: "detroit",
    scale: "Dorian",
    bpm: 126,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 75,
    grooveDepth: 60,
    swing: 8,
    density: 70,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ALL_MEL,
    soundProfile: "detroitEmotional"
  },
  {
    id: "ibizaSunset",
    name: "Ibiza Sunset",
    desc: "Anthemic melodic trance with an exposed breakdown and a big lift. Caf\xE9 del Mar at golden hour.",
    style: "trance",
    scale: "Natural Minor",
    bpm: 138,
    rate: "1/16",
    progression: "auto",
    songLength: "anthem",
    strength: 80,
    grooveDepth: 45,
    swing: 0,
    density: 75,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ALL_MEL,
    soundProfile: "tranceGlass"
  },
  {
    id: "deepHypnosis",
    name: "Deep Hypnosis",
    desc: "Dub-techno dread: one chord, deep space, sparse offbeat stabs, heavy shared groove. Basic Channel on downers.",
    style: "dubTechno",
    scale: "Natural Minor",
    bpm: 122,
    rate: "1/16",
    progression: "static",
    songLength: "long",
    strength: 90,
    grooveDepth: 85,
    swing: 0,
    density: 42,
    octave: 3,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "pad", "chords", "arp", "drums"],
    soundProfile: "dubChordHeavy"
  },
  {
    id: "melancholyMachine",
    name: "Melancholy Machine",
    desc: "Emotional melodic techno on the dramatic Andalusian cadence (with its raised-V magic note). Call-and-response leads that ache.",
    style: "melodicTechno",
    scale: "Natural Minor",
    bpm: 124,
    rate: "1/16",
    progression: "andalusian",
    songLength: "standard",
    strength: 85,
    grooveDepth: 60,
    swing: 0,
    density: 68,
    octave: 3,
    hook: false,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ALL_MEL,
    soundProfile: "detroitEmotional"
  },
  {
    id: "acidRain",
    name: "Acid Rain",
    desc: "Squelchy 303 acid in Phrygian \u2014 an evolving single-line sequence that mutates bar by bar over a relentless four-floor kick.",
    style: "acid",
    scale: "Phrygian",
    bpm: 130,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 70,
    grooveDepth: 55,
    swing: 4,
    density: 78,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "arp", "lead", "drums"],
    soundProfile: "acidDub"
  },
  {
    id: "cosmicVoyage",
    name: "Cosmic Voyage",
    desc: "Weightless ambient drift: add9 wash chords, whole-bar sustains, almost no percussion. Xtal / Music for Airports.",
    style: "ambient",
    scale: "Lydian",
    bpm: 72,
    rate: "1/8",
    progression: "auto",
    songLength: "long",
    strength: 60,
    grooveDepth: 30,
    swing: 0,
    density: 40,
    octave: 3,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["pad", "chords", "lead", "arp"],
    soundProfile: "cosmicFloat"
  },
  {
    id: "anthemRising",
    name: "Anthem Rising",
    desc: "Heroic melodic techno built to peak \u2014 a rising progression, hook lead, hard energy arc into a Drop. Fists-in-the-air stuff.",
    style: "melodicTechno",
    scale: "Natural Minor",
    bpm: 126,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 82,
    grooveDepth: 65,
    swing: 0,
    density: 76,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ALL_MEL,
    soundProfile: "tranceGlass"
  },
  {
    id: "midnightDrive",
    name: "Midnight Drive",
    desc: "Neon synthwave cruise: steady octave bass, catchy hook, evolving arp, doo-wop nostalgia. Drive soundtrack at 2am.",
    style: "synthwave",
    scale: "Natural Minor",
    bpm: 118,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 78,
    grooveDepth: 50,
    swing: 0,
    density: 70,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "chords", "arp", "pad", "drums"],
    soundProfile: "synthwaveNeon"
  },
  {
    id: "smokyBasement",
    name: "Smoky Basement",
    desc: "Late-night lo-fi: dusty swung drums, mellow keys, sparse and warm. Head-nod tempo, no urgency.",
    style: "lofi",
    scale: "Dorian",
    bpm: 84,
    rate: "1/8T",
    progression: "auto",
    songLength: "short",
    strength: 70,
    grooveDepth: 70,
    swing: 16,
    density: 55,
    octave: 3,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: false,
    parts: ["chords", "bass", "lead", "drums"],
    soundProfile: "deepHouseVelvet"
  },
  {
    id: "warehouseRave",
    name: "Warehouse Rave",
    desc: "Peak-time breakbeat energy: chopped drums, stabby chords, a big driving melodic sweep. Prodigy-adjacent.",
    style: "breakbeat",
    scale: "Natural Minor",
    bpm: 134,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 72,
    grooveDepth: 55,
    swing: 0,
    density: 82,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ALL_MEL,
    soundProfile: "brightBreaks"
  },
  {
    id: "starlightDisco",
    name: "Starlight Disco",
    desc: "Deep-house shimmer: rolling offbeat bass, lush pads, four-floor warmth and a rolling groove. Sunrise on the dancefloor.",
    style: "deepHouse",
    scale: "Natural Minor",
    bpm: 123,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 76,
    grooveDepth: 62,
    swing: 6,
    density: 74,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ALL_MEL,
    soundProfile: "organHouse"
  },
  {
    id: "phrygianTemple",
    name: "Phrygian Temple",
    desc: "Dark ritual techno: one droning chord in Phrygian, Berlin layering, incense and shadow. Hypnosis with an edge.",
    style: "melodicTechno",
    scale: "Phrygian",
    bpm: 126,
    rate: "1/16",
    progression: "static",
    songLength: "berlin",
    strength: 92,
    grooveDepth: 68,
    swing: 0,
    density: 66,
    octave: 2,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "pad", "chords", "lead", "drums"],
    soundProfile: "berlinAnalogSeq"
  },
  {
    id: "goldenHour",
    name: "Golden Hour",
    desc: "Warm major-key deep house with a nostalgic turnaround \u2014 optimistic, rooftop-at-sunset energy.",
    style: "deepHouse",
    scale: "Major",
    bpm: 120,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 72,
    grooveDepth: 58,
    swing: 8,
    density: 70,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ALL_MEL,
    soundProfile: "deepHouseVelvet"
  },
  {
    id: "stormWarning",
    name: "Storm Warning",
    desc: "Aggressive breakbeat drama on the Andalusian descent \u2014 chopped drums under an inevitable falling cadence. Tension weather.",
    style: "breakbeat",
    scale: "Natural Minor",
    bpm: 136,
    rate: "1/16",
    progression: "andalusian",
    songLength: "anthem",
    strength: 78,
    grooveDepth: 60,
    swing: 0,
    density: 84,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ALL_MEL,
    soundProfile: "jungleReese"
  },
  {
    id: "glassGarden",
    name: "Glass Garden",
    desc: "Delicate music-box ambient: slow add9 washes, fragile and crystalline. For rainy windows.",
    style: "ambient",
    scale: "Major",
    bpm: 76,
    rate: "1/8",
    progression: "auto",
    songLength: "long",
    strength: 65,
    grooveDepth: 25,
    swing: 0,
    density: 45,
    octave: 4,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["pad", "chords", "lead", "arp"],
    soundProfile: "glassAmbient"
  },
  {
    id: "nightTrain",
    name: "Night Train",
    desc: "Rolling long-form Detroit on the Axis loop \u2014 a steady machine glide with soulful 7ths, city lights streaking past.",
    style: "detroit",
    scale: "Natural Minor",
    bpm: 124,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 80,
    grooveDepth: 64,
    swing: 8,
    density: 72,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ALL_MEL,
    soundProfile: "electroFunk"
  },
  {
    id: "solarFlare",
    name: "Solar Flare",
    desc: "Exotic uplift: Harmonic-Minor trance with a soaring build, breakdown to a blazing hook. Dramatic and a little dangerous.",
    style: "trance",
    scale: "Harmonic Minor",
    bpm: 140,
    rate: "1/16",
    progression: "auto",
    songLength: "anthem",
    strength: 84,
    grooveDepth: 48,
    swing: 0,
    density: 78,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ALL_MEL,
    soundProfile: "tranceGlass"
  },
  {
    id: "tangerinePulse",
    name: "Tangerine Pulse",
    desc: "Classic Berlin pulse: hypnotic 16th-note sequence, slow harmonic movement, minimal drums, long-form evolution.",
    style: "classicSeq",
    scale: "Natural Minor",
    bpm: 118,
    rate: "1/16",
    progression: "static",
    songLength: "berlin",
    strength: 94,
    grooveDepth: 55,
    swing: 0,
    density: 64,
    octave: 3,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "pad", "chords", "lead"],
    soundProfile: "berlinAnalogSeq"
  },
  {
    id: "oxygeneMemory",
    name: "Oxygene Memory",
    desc: "Airy cosmic synth lead over soft minor harmony, with AABA hook shape and wide spacious phrasing.",
    style: "synthwave",
    scale: "Natural Minor",
    bpm: 96,
    rate: "1/8",
    progression: "auto",
    songLength: "standard",
    strength: 82,
    grooveDepth: 35,
    swing: 0,
    density: 58,
    octave: 4,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "counterMelody", "pad", "chords", "arp"],
    soundProfile: "jarreAirLead"
  },
  {
    id: "arilWinter",
    name: "Aril Winter",
    desc: "Melancholic Detroit machine soul: restrained drums, emotional minor movement, simple hook, deep late-night pulse.",
    style: "detroit",
    scale: "Dorian",
    bpm: 123,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 84,
    grooveDepth: 68,
    swing: 8,
    density: 62,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "bass", "pad", "chords", "counterMelody", "drums"],
    soundProfile: "detroitEmotional"
  },
  {
    id: "motorikDawn",
    name: "Motorik Dawn",
    desc: "Steady motorik electronic groove with simple bass motion, bright repeating motifs, and gradual sunrise energy.",
    style: "classicSeq",
    scale: "Major",
    bpm: 116,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 76,
    grooveDepth: 50,
    swing: 0,
    density: 66,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "chords", "lead", "drums"],
    soundProfile: "berlinAnalogSeq"
  },
  {
    id: "rainyNeon",
    name: "Rainy Neon",
    desc: "Sad neon synthwave: minor nostalgia, soft hook, octave bass, wet pads, and cinematic night-drive mood.",
    style: "synthwave",
    scale: "Natural Minor",
    bpm: 108,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 80,
    grooveDepth: 45,
    swing: 0,
    density: 64,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "bass", "pad", "chords", "arp", "drums"],
    soundProfile: "synthwaveNeon"
  },
  {
    id: "minimalSignal",
    name: "Minimal Signal",
    desc: "Minimal techno starter with only bass, drums, chord stabs, and one evolving signal motif.",
    style: "dubTechno",
    scale: "Natural Minor",
    bpm: 126,
    rate: "1/16",
    progression: "static",
    songLength: "standard",
    strength: 88,
    grooveDepth: 78,
    swing: 0,
    density: 46,
    octave: 3,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "chords", "arp", "drums"],
    soundProfile: "dubChordHeavy"
  },
  {
    id: "acidTemple",
    name: "Acid Temple",
    desc: "Phrygian acid ritual: 303-style bass, sparse lead fragments, dark modal pressure, and warehouse tension.",
    style: "acid",
    scale: "Phrygian",
    bpm: 132,
    rate: "1/16",
    progression: "static",
    songLength: "berlin",
    strength: 86,
    grooveDepth: 62,
    swing: 4,
    density: 74,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "arp", "lead", "drums"],
    soundProfile: "acidDub"
  },
  {
    id: "floatingShrine",
    name: "Floating Shrine",
    desc: "Slow sacred ambient: Lydian glow, gentle lead phrases, long add9 pads, and almost no rhythmic pressure.",
    style: "ambient",
    scale: "Lydian",
    bpm: 68,
    rate: "1/8",
    progression: "auto",
    songLength: "long",
    strength: 70,
    grooveDepth: 20,
    swing: 0,
    density: 38,
    octave: 4,
    hook: false,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["pad", "chords", "lead", "counterMelody", "arp"],
    soundProfile: "glassAmbient"
  },
  {
    id: "acidDawn",
    name: "Acid Dawn",
    desc: "Brighter, hopeful acid: a squelchy 303 line in natural minor rising toward the light, open hats, a warmer filter.",
    style: "acid",
    scale: "Natural Minor",
    bpm: 128,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 68,
    grooveDepth: 52,
    swing: 2,
    density: 74,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "arp", "lead", "drums"],
    soundProfile: "acidChrome"
  },
  {
    id: "squelchFunk",
    name: "Squelch Funk",
    desc: "Funky swung acid: a rubbery 303 bass with real bounce, Dorian brightness, ghost-note hats. Chicago jack.",
    style: "acid",
    scale: "Dorian",
    bpm: 124,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 66,
    grooveDepth: 70,
    swing: 14,
    density: 72,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "arp", "chords", "drums"],
    soundProfile: "acidChrome"
  },
  {
    id: "warehouse303",
    name: "Warehouse 303",
    desc: "Hard peak-time acid: relentless resonant 303, pounding kick, dense and aggressive, built to a drop. Sweat on the walls.",
    style: "acid",
    scale: "Phrygian",
    bpm: 136,
    rate: "1/16",
    progression: "auto",
    songLength: "anthem",
    strength: 78,
    grooveDepth: 58,
    swing: 0,
    density: 86,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "arp", "lead", "drums"],
    soundProfile: "acidChrome"
  },
  {
    id: "liquidAcid",
    name: "Liquid Acid",
    desc: "Deep hypnotic acid: one static drone, a slow-mutating 303, dubby space and heavy groove. Long-form trance-out.",
    style: "acid",
    scale: "Natural Minor",
    bpm: 122,
    rate: "1/16",
    progression: "static",
    songLength: "long",
    strength: 88,
    grooveDepth: 78,
    swing: 0,
    density: 58,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "arp", "pad", "drums"],
    soundProfile: "acidDub"
  },
  {
    id: "northernSignal",
    name: "Northern Signal",
    desc: "Cold melodic techno with a clear emotional hook, restrained drums, and a slow-blooming Nordic atmosphere.",
    style: "melodicTechno",
    scale: "Dorian",
    bpm: 124,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 84,
    grooveDepth: 58,
    swing: 0,
    density: 62,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ALL_MEL,
    tags: ["emotional", "hypnotic", "long-form"],
    moveFriendly: true,
    drumFeel: "fourFloor",
    soundProfile: "detroitEmotional"
  },
  {
    id: "redPlanetSequence",
    name: "Red Planet Sequence",
    desc: "Dry desert Berlin sequence: pulsing bass, slow filter movement, sparse lead fragments, and a long hypnotic build.",
    style: "classicSeq",
    scale: "Phrygian",
    bpm: 120,
    rate: "1/16",
    progression: "static",
    songLength: "berlin",
    strength: 92,
    grooveDepth: 62,
    swing: 0,
    density: 68,
    octave: 2,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "pad", "lead", "drums"],
    tags: ["sequence", "hypnotic", "long-form", "dark"],
    moveFriendly: false,
    drumFeel: "minimalDub",
    soundProfile: "berlinAnalogSeq"
  },
  {
    id: "chromeHearts",
    name: "Chrome Hearts",
    desc: "Emotional Detroit electro-soul with metallic bells, warm bass, and a simple repeated lead motif.",
    style: "detroit",
    scale: "Dorian",
    bpm: 121,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 78,
    grooveDepth: 66,
    swing: 10,
    density: 60,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "bass", "chords", "counterMelody", "drums"],
    tags: ["emotional", "detroit", "soulful"],
    moveFriendly: true,
    drumFeel: "fourFloor",
    soundProfile: "detroitEmotional"
  },
  {
    id: "iceCavern",
    name: "Ice Cavern",
    desc: "Dark ambient techno atmosphere: frozen pads, minimal pulse, distant lead echoes, and no obvious anthem shape.",
    style: "ambient",
    scale: "Natural Minor",
    bpm: 88,
    rate: "1/8",
    progression: "static",
    songLength: "long",
    strength: 82,
    grooveDepth: 35,
    swing: 0,
    density: 42,
    octave: 3,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["pad", "chords", "lead", "arp"],
    tags: ["ambient", "dark", "minimal-drums", "long-form"],
    moveFriendly: false,
    drumFeel: "ambientNone",
    soundProfile: "glassAmbient"
  },
  {
    id: "afterhoursDub",
    name: "Afterhours Dub",
    desc: "Very deep dub-techno: one chord, sub pressure, filtered drums, and long tape-delay space.",
    style: "dubTechno",
    scale: "Natural Minor",
    bpm: 118,
    rate: "1/16",
    progression: "static",
    songLength: "long",
    strength: 90,
    grooveDepth: 82,
    swing: 2,
    density: 38,
    octave: 2,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "chords", "pad", "drums"],
    tags: ["dub", "hypnotic", "minimal-drums", "long-form"],
    moveFriendly: true,
    drumFeel: "minimalDub",
    soundProfile: "dubChordHeavy"
  },
  {
    id: "neonRunner",
    name: "Neon Runner",
    desc: "Fast synthwave chase cue: octave bass, bright arp, short hook, and energetic night-drive momentum.",
    style: "synthwave",
    scale: "Natural Minor",
    bpm: 128,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 76,
    grooveDepth: 52,
    swing: 0,
    density: 78,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "chords", "arp", "drums"],
    tags: ["retro", "energetic", "hook"],
    moveFriendly: true,
    drumFeel: "fourFloor",
    soundProfile: "synthwaveNeon"
  },
  {
    id: "brokenSunrise",
    name: "Broken Sunrise",
    desc: "Melodic breakbeat with hopeful chords, chopped drums, and a bright emotional hook.",
    style: "breakbeat",
    scale: "Major",
    bpm: 132,
    rate: "1/16",
    progression: "auto",
    songLength: "anthem",
    strength: 74,
    grooveDepth: 60,
    swing: 4,
    density: 80,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ALL_MEL,
    tags: ["breaks", "emotional", "hook", "energetic"],
    moveFriendly: false,
    drumFeel: "breakbeat",
    soundProfile: "brightBreaks"
  },
  {
    id: "slowOrbit",
    name: "Slow Orbit",
    desc: "Slow cosmic electronica: gentle sequence, soft bass, floating lead, and gradual orbital motion.",
    style: "classicSeq",
    scale: "Lydian",
    bpm: 92,
    rate: "1/8",
    progression: "auto",
    songLength: "long",
    strength: 76,
    grooveDepth: 40,
    swing: 0,
    density: 50,
    octave: 3,
    hook: false,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["arp", "bass", "pad", "lead"],
    tags: ["sequence", "cosmic", "chill", "long-form"],
    moveFriendly: true,
    drumFeel: "ambientNone",
    soundProfile: "cosmicFloat"
  },
  {
    id: "velvetWarehouse",
    name: "Velvet Warehouse",
    desc: "Soft but driving deep-house groove with warm chords, sidechained pads, and a late-night club feel.",
    style: "deepHouse",
    scale: "Dorian",
    bpm: 122,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 74,
    grooveDepth: 72,
    swing: 10,
    density: 66,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "pad", "chords", "drums"],
    tags: ["club", "deep-house", "warm"],
    moveFriendly: true,
    drumFeel: "fourFloor",
    soundProfile: "deepHouseVelvet"
  },
  {
    id: "cometTail",
    name: "Comet Tail",
    desc: "Uplifting trance with a cleaner, less aggressive build: glassy arp, wide pads, and a long melodic tail.",
    style: "trance",
    scale: "Natural Minor",
    bpm: 136,
    rate: "1/16",
    progression: "auto",
    songLength: "anthem",
    strength: 80,
    grooveDepth: 44,
    swing: 0,
    density: 72,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ALL_MEL,
    tags: ["trance", "uplifting", "hook", "energetic"],
    moveFriendly: false,
    drumFeel: "fourFloor",
    soundProfile: "tranceGlass"
  },
  // ---- v0.31: acid expansion ----
  {
    id: "chromeWasp",
    name: "Chrome Wasp",
    desc: "Hard fast acid: stinging 303 accents, metallic bell fragments, relentless jacking kick \u2014 peak-time venom.",
    style: "acid",
    scale: "Natural Minor",
    bpm: 138,
    rate: "1/16",
    progression: "static",
    songLength: "standard",
    strength: 86,
    grooveDepth: 74,
    swing: 0,
    density: 78,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "arp", "lead", "drums"],
    tags: ["acid", "hard", "energetic"],
    moveFriendly: true,
    drumFeel: "acidJack",
    soundProfile: "acidChrome"
  },
  {
    id: "basementJack",
    name: "Basement Jack",
    desc: "Chicago jack-house acid: swung 303, clap-heavy groove, sweaty low-ceiling club energy.",
    style: "acid",
    scale: "Dorian",
    bpm: 124,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 78,
    grooveDepth: 80,
    swing: 12,
    density: 70,
    octave: 2,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "arp", "chords", "drums"],
    tags: ["acid", "club", "jack"],
    moveFriendly: true,
    drumFeel: "acidJack",
    soundProfile: "acidChrome"
  },
  {
    id: "tealShadows",
    name: "Teal Shadows",
    desc: "Deep dub-acid: slow 303 pressure inside chord fog, filtered drums, cavernous late-night space.",
    style: "acid",
    scale: "Natural Minor",
    bpm: 119,
    rate: "1/16",
    progression: "static",
    songLength: "long",
    strength: 90,
    grooveDepth: 78,
    swing: 2,
    density: 46,
    octave: 2,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "chords", "pad", "drums"],
    tags: ["acid", "dub", "hypnotic", "long-form"],
    moveFriendly: true,
    drumFeel: "minimalDub",
    soundProfile: "acidDub",
    clipBars: 48
  },
  {
    id: "acidPilgrim",
    name: "Acid Pilgrim",
    desc: "Slow eastern acid: Harmonic-Minor 303 chant, droning pad, patient hypnotic procession.",
    style: "acid",
    scale: "Harmonic Minor",
    bpm: 112,
    rate: "1/16",
    progression: "static",
    songLength: "long",
    strength: 88,
    grooveDepth: 66,
    swing: 0,
    density: 55,
    octave: 2,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "arp", "pad", "drums"],
    tags: ["acid", "hypnotic", "long-form", "eastern"],
    moveFriendly: false,
    drumFeel: "fourFloor",
    soundProfile: "acidDub",
    clipBars: 48
  },
  {
    id: "acidMeadow",
    name: "Acid Meadow",
    desc: "Pastoral melodic acid: Lydian 303 lines that sing instead of bite, bright pads, open-air festival dawn.",
    style: "acid",
    scale: "Lydian",
    bpm: 126,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 76,
    grooveDepth: 62,
    swing: 0,
    density: 66,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["bass", "arp", "lead", "pad", "drums"],
    tags: ["acid", "melodic", "uplifting"],
    moveFriendly: true,
    drumFeel: "fourFloor",
    soundProfile: "acidChrome"
  },
  {
    id: "voltagePrayer",
    name: "Voltage Prayer",
    desc: "Berlin acid ritual: one 303 phrase mutating for an hour, monastic pads, the long hypnotic yes.",
    style: "acid",
    scale: "Phrygian",
    bpm: 122,
    rate: "1/16",
    progression: "static",
    songLength: "berlin",
    strength: 94,
    grooveDepth: 70,
    swing: 0,
    density: 60,
    octave: 2,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "arp", "pad", "drums"],
    tags: ["acid", "hypnotic", "long-form", "dark"],
    moveFriendly: false,
    drumFeel: "fourFloor",
    soundProfile: "acidDub"
  },
  // ---- v0.31: other genres ----
  {
    id: "midnightFunk",
    name: "Midnight Funk",
    desc: "Detroit electro-funk: rubbery bass, syncopated machine drums, neon-lit boogie chords.",
    style: "detroit",
    scale: "Dorian",
    bpm: 116,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 76,
    grooveDepth: 84,
    swing: 14,
    density: 68,
    octave: 2,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["bass", "chords", "lead", "counterMelody", "drums"],
    tags: ["funk", "club", "groove"],
    moveFriendly: true,
    drumFeel: "breakbeat",
    soundProfile: "electroFunk"
  },
  {
    id: "rustBelt",
    name: "Rust Belt",
    desc: "Industrial sequence techno: corroded pulse, grinding low end, sparks of lead over factory-floor drums.",
    style: "classicSeq",
    scale: "Phrygian",
    bpm: 128,
    rate: "1/16",
    progression: "static",
    songLength: "long",
    strength: 90,
    grooveDepth: 58,
    swing: 0,
    density: 72,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "lead", "drums"],
    tags: ["dark", "hypnotic", "long-form", "industrial"],
    moveFriendly: false,
    drumFeel: "fourFloor",
    soundProfile: "industrialSeq"
  },
  {
    id: "paperLanterns",
    name: "Paper Lanterns",
    desc: "Warm lo-fi drift: dusty keys, soft swing, small hours and warm rain on the window.",
    style: "lofi",
    scale: "Major",
    bpm: 82,
    rate: "1/8",
    progression: "doowop",
    songLength: "short",
    strength: 70,
    grooveDepth: 74,
    swing: 16,
    density: 52,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: false,
    parts: ["chords", "bass", "lead", "drums"],
    tags: ["chill", "warm", "night"],
    moveFriendly: true,
    drumFeel: "lofiSwing",
    soundProfile: "deepHouseVelvet"
  },
  {
    id: "duskHighway",
    name: "Dusk Highway",
    desc: "Darker synthwave cruise: minor-key octave bass, slow neon arps, taillights disappearing into fog.",
    style: "synthwave",
    scale: "Dorian",
    bpm: 118,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 78,
    grooveDepth: 56,
    swing: 0,
    density: 64,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "pad", "arp", "drums"],
    tags: ["retro", "dark", "night-drive"],
    moveFriendly: true,
    drumFeel: "fourFloor",
    soundProfile: "synthwaveNeon"
  },
  {
    id: "morningRitual",
    name: "Morning Ritual",
    desc: "Sunrise deep house: gentle major chords, patient groove, coffee-and-balcony optimism.",
    style: "deepHouse",
    scale: "Major",
    bpm: 120,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 72,
    grooveDepth: 70,
    swing: 8,
    density: 60,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["chords", "bass", "pad", "lead", "drums"],
    tags: ["chill", "warm", "sunrise"],
    moveFriendly: true,
    drumFeel: "fourFloor",
    soundProfile: "organHouse"
  },
  {
    id: "jungleGlass",
    name: "Jungle Glass",
    desc: "Fast glassy breaks: chopped drums under crystalline melodic fragments \u2014 precision chaos.",
    style: "breakbeat",
    scale: "Minor Pentatonic",
    bpm: 158,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 78,
    grooveDepth: 64,
    swing: 0,
    density: 82,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "bass", "pad", "arp", "drums"],
    tags: ["breaks", "energetic", "glassy"],
    moveFriendly: false,
    drumFeel: "breakbeat",
    soundProfile: "jungleReese"
  },
  // ---- D MINI showcase family (v0.67): four tracks each, ONE goes to the hardware.
  {
    id: "dminiDoctorBass",
    name: "Doctor Bass",
    desc: "Detroit soul with the D MINI as the bass engine \u2014 Unison saws, tight envelope, Contour doing the talking. The showcase: what three VCOs in the low end actually mean.",
    style: "detroit",
    scale: "Dorian",
    bpm: 122,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 70,
    grooveDepth: 60,
    swing: 8,
    density: 62,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "chords", "drums"],
    soundProfile: "dminiBass",
    tags: ["hardware", "d mini", "bass"],
    moveFriendly: true
  },
  {
    id: "dminiSoloFlight",
    name: "Solo Flight",
    desc: "Melodic techno with the D MINI singing lead \u2014 full Unison stack, wide Detune, Contour Decay ON so lines ring. The showcase: the classic Moog voice above a modern floor.",
    style: "melodicTechno",
    scale: "Natural Minor",
    bpm: 124,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 78,
    grooveDepth: 55,
    swing: 4,
    density: 60,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "pad", "drums"],
    soundProfile: "dminiLead",
    tags: ["hardware", "d mini", "lead"],
    moveFriendly: true
  },
  {
    id: "dminiFilterBreathes",
    name: "The Filter Breathes",
    desc: "Berlin School around a hypnotic eight-note sequence into the D MINI \u2014 and the ENTIRE performance is one knob: Cutoff, closed to open and back. Notes never change; your hand is the arrangement.",
    style: "classicSeq",
    scale: "Dorian",
    root: 4,
    bpm: 122,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 75,
    grooveDepth: 50,
    swing: 0,
    density: 70,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "lead", "drums"],
    soundProfile: "dminiFilter",
    tags: ["hardware", "d mini", "filter", "berlin"],
    moveFriendly: true
  },
  {
    id: "dminiGlideworks",
    name: "Glideworks",
    desc: "Acid floor with the D MINI gliding above the 303 \u2014 legato lines smeared by the Glide knob while Emphasis makes the filter vocal. The showcase: portamento as melody.",
    style: "acid",
    scale: "Phrygian",
    bpm: 128,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 68,
    grooveDepth: 55,
    swing: 4,
    density: 72,
    octave: 2,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "arp", "drums"],
    soundProfile: "dminiGlide",
    tags: ["hardware", "d mini", "glide", "acid"],
    moveFriendly: true
  },
  {
    id: "dminiRingChamber",
    name: "Ring Chamber",
    desc: "Dub techno with the D MINI in RING mode \u2014 inharmonic metal stabs into long delay, retuned live with the Detune knob. The showcase: the mode nobody uses, in the genre that loves it.",
    style: "dubTechno",
    scale: "Natural Minor",
    bpm: 118,
    rate: "1/8",
    progression: "auto",
    songLength: "standard",
    strength: 60,
    grooveDepth: 60,
    swing: 6,
    density: 45,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "chords", "bass", "drums"],
    soundProfile: "dminiRing",
    tags: ["hardware", "d mini", "ring mod", "dub"],
    moveFriendly: true
  },
  {
    id: "dminiDeepCurrent",
    name: "Deep Current",
    desc: "Ambient drone with the D MINI holding the floor \u2014 Triangle Unison with slow Detune beating, six-second swells, everything ringing on. The showcase: one held note as a living thing.",
    style: "ambient",
    scale: "Natural Minor",
    bpm: 72,
    rate: "1/8",
    progression: "static",
    songLength: "standard",
    strength: 55,
    grooveDepth: 35,
    swing: 0,
    density: 35,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: false,
    parts: ["bass", "pad", "lead", "drums"],
    soundProfile: "dminiDrone",
    tags: ["hardware", "d mini", "drone", "ambient"],
    moveFriendly: true
  },
  {
    id: "dminiThreeVoices",
    name: "Three Voices",
    desc: "Synthwave chords from the D MINI's three-voice paraphony \u2014 one shared envelope, staccato blocks, saws in POLY mode. The showcase: what 'paraphonic' actually sounds like, used on purpose.",
    style: "synthwave",
    scale: "Natural Minor",
    bpm: 106,
    rate: "1/8",
    progression: "auto",
    songLength: "standard",
    strength: 65,
    grooveDepth: 45,
    swing: 2,
    density: 55,
    octave: 3,
    hook: true,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["chords", "bass", "lead", "drums"],
    soundProfile: "dminiPoly",
    tags: ["hardware", "d mini", "paraphonic", "retro"],
    moveFriendly: true
  },
  // ---- Waldorf Protein showcase family (v0.68): four tracks each, ONE to the hardware.
  {
    id: "proteinLivingMatter",
    name: "Living Matter",
    desc: "Melodic techno built on the wavetable move itself \u2014 a resonant table sweeping under a pad while the floor pulses. The showcase: wave position as the living centre of a song.",
    style: "melodicTechno",
    scale: "Natural Minor",
    bpm: 124,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 74,
    grooveDepth: 55,
    swing: 4,
    density: 58,
    octave: 3,
    hook: true,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "pad", "drums"],
    soundProfile: "proteinSweep",
    tags: ["hardware", "protein", "wavetable"],
    moveFriendly: true
  },
  {
    id: "proteinHuckabyDeep",
    name: "Huckaby Deep",
    desc: "Deep house in the Microwave lineage \u2014 the Protein's 8-bit ASIC bass holding the floor the way Detroit's deep-house masters used the original. The showcase: low-octave aliasing as warmth.",
    style: "deepHouse",
    scale: "Dorian",
    bpm: 120,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 66,
    grooveDepth: 65,
    swing: 10,
    density: 60,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "chords", "drums"],
    soundProfile: "proteinBass",
    tags: ["hardware", "protein", "bass", "deep house"],
    moveFriendly: true
  },
  {
    id: "proteinItSpeaks",
    name: "It Speaks",
    desc: "Breaks with the Protein's speech wavetables as the voice \u2014 a lead that forms vowels as the Wave knob moves. The showcase: the strangest tables in the ROM, played like a singer.",
    style: "breakbeat",
    scale: "Phrygian",
    bpm: 132,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 70,
    grooveDepth: 60,
    swing: 6,
    density: 62,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "arp", "drums"],
    soundProfile: "proteinSpeech",
    tags: ["hardware", "protein", "speech", "breaks"],
    moveFriendly: true
  },
  {
    id: "proteinFourFaces",
    name: "Four Faces",
    desc: "Detroit soul where every chord stab lands on a DIFFERENT layer \u2014 mallet, formant, glass, brass, rotating round-robin. The showcase: four timbres, one part, no hands.",
    style: "detroit",
    scale: "Dorian",
    bpm: 121,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 68,
    grooveDepth: 60,
    swing: 8,
    density: 58,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: true,
    energyArc: true,
    parts: ["chords", "bass", "lead", "drums"],
    soundProfile: "proteinRobin",
    tags: ["hardware", "protein", "round robin", "layers"],
    moveFriendly: true
  },
  {
    id: "proteinAgedCircuits",
    name: "Aged Circuits",
    desc: "Ambient where the patch grows old in real time \u2014 the Flavor knob and de-calibrated filters slowly ruining a pristine pad, beautifully. The showcase: imperfection as the arrangement.",
    style: "ambient",
    scale: "Natural Minor",
    bpm: 68,
    rate: "1/8",
    progression: "static",
    songLength: "standard",
    strength: 55,
    grooveDepth: 35,
    swing: 0,
    density: 35,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: false,
    parts: ["pad", "bass", "lead", "drums"],
    soundProfile: "proteinFlavor",
    tags: ["hardware", "protein", "flavor", "ambient"],
    moveFriendly: true
  },
  {
    id: "proteinDustAndDirt",
    name: "Dust & Dirt",
    desc: "Lo-fi keys with the ring-dirt engaged \u2014 an e-piano table with rust in its overtones, velocity opening the wavetable. The showcase: the Dirt section as character, not damage.",
    style: "lofi",
    scale: "Dorian",
    bpm: 84,
    rate: "1/8",
    progression: "auto",
    songLength: "standard",
    strength: 60,
    grooveDepth: 70,
    swing: 14,
    density: 50,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["chords", "bass", "lead", "drums"],
    soundProfile: "proteinDirt",
    tags: ["hardware", "protein", "dirt", "lofi"],
    moveFriendly: true
  },
  {
    id: "proteinGlassReactor",
    name: "Glass Reactor",
    desc: "Trance around a glittering PPG-glass sequence \u2014 velocity opens the wavetable so the arp sparkles unevenly, like light through moving water. The showcase: the table the whole lineage is famous for.",
    style: "trance",
    scale: "Natural Minor",
    bpm: 138,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 76,
    grooveDepth: 50,
    swing: 0,
    density: 74,
    octave: 3,
    hook: true,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "lead", "drums"],
    soundProfile: "proteinGlass",
    tags: ["hardware", "protein", "ppg", "trance"],
    moveFriendly: true
  },
  // ---- D MINI showcase collection (v0.69): 20 more, living in their genre families,
  // tagged "d mini" (+ "qi" when the Walrus Qi is in the chain, "top pick" for the channel five).
  {
    id: "dminiMidnightAutobahn",
    name: "Midnight Autobahn",
    desc: "Driving through Germany at 2 AM under endless highway lights \u2014 the classic Berlin School showcase. The D MINI lead evolves for the whole ride: filter sweeps, touches of glide, Qi delay stretching the lane markers.",
    style: "classicSeq",
    scale: "Minor Pentatonic",
    root: 4,
    bpm: 126,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 74,
    grooveDepth: 50,
    swing: 0,
    density: 66,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "lead", "drums"],
    soundProfile: "dminiLead",
    tags: ["hardware", "d mini", "qi", "berlin", "tangerine dream", "top pick"],
    moveFriendly: true
  },
  {
    id: "dminiFilterNeverStops",
    name: "The Filter Never Stops",
    desc: "Minimal analog techno where the filter is the main performer \u2014 cutoff, resonance, and envelope amount doing everything melody usually does, over a sequence that never blinks.",
    style: "dubTechno",
    scale: "Dorian",
    root: 2,
    bpm: 122,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 62,
    grooveDepth: 55,
    swing: 4,
    density: 60,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "chords", "drums"],
    soundProfile: "dminiFilter",
    tags: ["hardware", "d mini", "minimal", "moog", "top pick"],
    moveFriendly: true
  },
  {
    id: "dminiOneNoteJourney",
    name: "One Note Journey",
    desc: "An entire performance built from one note \u2014 oscillator blending and timbre evolution as the whole composition, Ciani-style. Educational, hypnotic, and every knob move is on camera.",
    style: "ambient",
    scale: "Natural Minor",
    root: 9,
    bpm: 110,
    rate: "1/8",
    progression: "static",
    songLength: "standard",
    strength: 50,
    grooveDepth: 35,
    swing: 0,
    density: 35,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: false,
    parts: ["bass", "pad", "lead", "drums"],
    soundProfile: "dminiDrone",
    tags: ["hardware", "d mini", "qi", "one note", "suzanne ciani", "top pick"],
    moveFriendly: true
  },
  {
    id: "dminiBassEater",
    name: "Bass That Eats Speakers",
    desc: "Driving techno with massive analog bass shaking the room \u2014 why people buy a Minimoog-style synth in the first place. Brikha-school melody in the machines above; pure weight below.",
    style: "detroit",
    scale: "Natural Minor",
    root: 5,
    bpm: 130,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 68,
    grooveDepth: 55,
    swing: 4,
    density: 68,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "chords", "drums"],
    soundProfile: "dminiBass",
    tags: ["hardware", "d mini", "aril brikha", "top pick"],
    moveFriendly: true
  },
  {
    id: "dminiBladeRunnerSunset",
    name: "Blade Runner Sunset",
    desc: "Flying above a neon city at sunset \u2014 cinematic synthwave with an expressive portamento lead in the Vangelis tradition, every phrase arriving on a slide through Qi haze.",
    style: "synthwave",
    scale: "Natural Minor",
    root: 1,
    bpm: 96,
    rate: "1/8",
    progression: "auto",
    songLength: "standard",
    strength: 70,
    grooveDepth: 45,
    swing: 2,
    density: 52,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "pad", "drums"],
    soundProfile: "dminiGlide",
    tags: ["hardware", "d mini", "qi", "cinematic", "vangelis"],
    moveFriendly: true
  },
  {
    id: "dminiAcidNo303",
    name: "Acid Without a 303",
    desc: "Proof the D MINI can growl like acid \u2014 resonance high, envelopes fast, the ladder filter snapping where a 303 would squelch. Hardfloor energy at 132.",
    style: "acid",
    scale: "Phrygian",
    root: 4,
    bpm: 132,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 64,
    grooveDepth: 55,
    swing: 4,
    density: 74,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "arp", "drums"],
    soundProfile: "dminiBass",
    tags: ["hardware", "d mini", "hardfloor"],
    moveFriendly: true
  },
  {
    id: "dminiThreeOscillators",
    name: "Three Oscillators",
    desc: "The analog showcase, built layer by layer \u2014 one VCO, then two, then all three with detune blooming. The arrangement IS the lesson: what each oscillator adds, heard in order.",
    style: "classicSeq",
    scale: "Minor Pentatonic",
    root: 7,
    bpm: 118,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 66,
    grooveDepth: 45,
    swing: 0,
    density: 58,
    octave: 3,
    hook: true,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "chords", "drums"],
    soundProfile: "dminiLead",
    tags: ["hardware", "d mini", "minimoog", "educational"],
    moveFriendly: true
  },
  {
    id: "dminiSciFiSignals",
    name: "Vintage Sci-Fi Signals",
    desc: "The soundtrack to a 70s sci-fi film that never existed \u2014 noise, ring textures, and modulation as transmissions from somewhere, Jarre-adjacent, harmonic minor for the unease.",
    style: "synthwave",
    scale: "Harmonic Minor",
    root: 2,
    bpm: 100,
    rate: "1/8",
    progression: "auto",
    songLength: "standard",
    strength: 58,
    grooveDepth: 45,
    swing: 0,
    density: 48,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "chords", "bass", "drums"],
    soundProfile: "dminiRing",
    tags: ["hardware", "d mini", "qi", "sci-fi", "jarre"],
    moveFriendly: true
  },
  {
    id: "dmini1974Meets2026",
    name: "1974 Meets 2026",
    desc: "Vintage analog transformed into modern melodic techno \u2014 the Bodzin thesis: a 50-year-old voice, a present-tense arrangement, filter performance and delay bridging the decades.",
    style: "melodicTechno",
    scale: "Natural Minor",
    root: 11,
    bpm: 124,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 78,
    grooveDepth: 55,
    swing: 4,
    density: 62,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "pad", "drums"],
    soundProfile: "dminiLead",
    tags: ["hardware", "d mini", "qi", "bodzin", "top pick"],
    moveFriendly: true
  },
  {
    id: "dminiAnalogMeditation",
    name: "Analog Meditation",
    desc: "A calm sunrise over distant mountains \u2014 ambient Berlin in the Steve Roach lineage, the drone breathing through slow filter movement, nothing in a hurry, nothing wasted.",
    style: "ambient",
    scale: "Dorian",
    root: 9,
    bpm: 90,
    rate: "1/8",
    progression: "static",
    songLength: "standard",
    strength: 52,
    grooveDepth: 35,
    swing: 0,
    density: 35,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: false,
    parts: ["bass", "pad", "lead", "drums"],
    soundProfile: "dminiDrone",
    tags: ["hardware", "d mini", "qi", "steve roach", "meditation"],
    moveFriendly: true
  },
  {
    id: "dminiMoogMountain",
    name: "Moog Mountain",
    desc: "Climbing a mountain with analog power \u2014 melodic techno around a thick mono lead in the B\xE4umel register: patient, inevitable, and heavier with every switchback.",
    style: "melodicTechno",
    scale: "Dorian",
    root: 5,
    bpm: 128,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 74,
    grooveDepth: 55,
    swing: 4,
    density: 64,
    octave: 3,
    hook: true,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "pad", "drums"],
    soundProfile: "dminiLead",
    tags: ["hardware", "d mini", "patrice baumel"],
    moveFriendly: true
  },
  {
    id: "dminiResonanceRitual",
    name: "Resonance Ritual",
    desc: "A hypnotic ritual built around resonance \u2014 minimal techno where the Emphasis knob is the shaman, whistling over a sequence that repeats until repetition becomes the point.",
    style: "dubTechno",
    scale: "Dorian",
    root: 4,
    bpm: 123,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 58,
    grooveDepth: 60,
    swing: 6,
    density: 56,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "chords", "drums"],
    soundProfile: "dminiFilter",
    tags: ["hardware", "d mini", "minimal", "villalobos", "ritual"],
    moveFriendly: true
  },
  {
    id: "dminiNeonMonolith",
    name: "Neon Monolith",
    desc: "A glowing monolith awakens at night \u2014 dark synthwave with the D MINI as a menacing lead, Perturbator-black, square-edged and slow to forgive.",
    style: "synthwave",
    scale: "Natural Minor",
    root: 0,
    bpm: 118,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 68,
    grooveDepth: 50,
    swing: 0,
    density: 58,
    octave: 3,
    hook: true,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "chords", "drums"],
    soundProfile: "dminiLead",
    tags: ["hardware", "d mini", "qi", "dark", "perturbator"],
    moveFriendly: true
  },
  {
    id: "dminiWarmVoltage",
    name: "Warm Voltage",
    desc: "Vintage circuits glowing on a rainy evening \u2014 chill electronica in Mixolydian, Boards-of-Canada warm, the paraphonic D MINI holding soft chords like an old radio holds a station.",
    style: "lofi",
    scale: "Mixolydian",
    root: 7,
    bpm: 108,
    rate: "1/8",
    progression: "auto",
    songLength: "standard",
    strength: 58,
    grooveDepth: 70,
    swing: 12,
    density: 48,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: false,
    parts: ["chords", "bass", "lead", "drums"],
    soundProfile: "dminiPoly",
    tags: ["hardware", "d mini", "qi", "boards of canada", "warm"],
    moveFriendly: true
  },
  {
    id: "dminiAnalogHorizon",
    name: "Analog Horizon",
    desc: "Watching the sunrise from a cliff edge \u2014 progressive melodic with an emotional lead melody in the B\xF6hmer school: wide Unison, long phrases, the kind of line the crowd films.",
    style: "melodicTechno",
    scale: "Natural Minor",
    root: 2,
    bpm: 126,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 80,
    grooveDepth: 50,
    swing: 2,
    density: 60,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "pad", "drums"],
    soundProfile: "dminiLead",
    tags: ["hardware", "d mini", "qi", "ben bohmer", "emotional"],
    moveFriendly: true
  },
  {
    id: "dminiLadderDreams",
    name: "Ladder Dreams",
    desc: "Exploring the legendary ladder filter \u2014 deep techno as a guided tour of the transistor ladder's character: where it purrs, where it bites, where it swallows its own bass.",
    style: "dubTechno",
    scale: "Natural Minor",
    root: 6,
    bpm: 125,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 60,
    grooveDepth: 55,
    swing: 4,
    density: 58,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "pad", "drums"],
    soundProfile: "dminiFilter",
    tags: ["hardware", "d mini", "ladder filter", "minimoog"],
    moveFriendly: true
  },
  {
    id: "dminiShadowOscillator",
    name: "Shadow Oscillator",
    desc: "Machines awaken in an abandoned factory \u2014 industrial electronica with an aggressive oscillator mix, Reznor-jagged, the ring stabs hitting like dropped sheet metal.",
    style: "breakbeat",
    scale: "Phrygian",
    root: 11,
    bpm: 128,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 62,
    grooveDepth: 55,
    swing: 4,
    density: 66,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "chords", "bass", "drums"],
    soundProfile: "dminiRing",
    tags: ["hardware", "d mini", "industrial", "reznor"],
    moveFriendly: true
  },
  {
    id: "dminiSunsetResonance",
    name: "Sunset Resonance",
    desc: "A peaceful evening beside the ocean \u2014 downtempo ambient where smooth resonance sweeps roll in like the tide, Eno-patient, each one slightly different, none of them urgent.",
    style: "ambient",
    scale: "Dorian",
    root: 4,
    bpm: 95,
    rate: "1/8",
    progression: "static",
    songLength: "standard",
    strength: 52,
    grooveDepth: 40,
    swing: 0,
    density: 38,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: false,
    parts: ["bass", "pad", "lead", "drums"],
    soundProfile: "dminiDrone",
    tags: ["hardware", "d mini", "qi", "eno", "ocean"],
    moveFriendly: true
  },
  {
    id: "dminiPulseGenerator",
    name: "Pulse Generator",
    desc: "A vintage sequencer powers an endless groove \u2014 Berlin techno at 134 in the Schulze machine-room: fast sequences, small filter tweaks, momentum as the only argument.",
    style: "classicSeq",
    scale: "Minor Pentatonic",
    root: 9,
    bpm: 134,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 66,
    grooveDepth: 45,
    swing: 0,
    density: 76,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "lead", "drums"],
    soundProfile: "dminiFilter",
    tags: ["hardware", "d mini", "klaus schulze", "sequencer"],
    moveFriendly: true
  },
  {
    id: "dminiEndlessVoltage",
    name: "Endless Voltage",
    desc: "Electricity flows forever through analog circuits \u2014 Berlin School as a long evolving sequence, Tangerine-Dream-endless, the Qi feeding the filter's slow story back to itself.",
    style: "classicSeq",
    scale: "Natural Minor",
    root: 4,
    bpm: 124,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 70,
    grooveDepth: 45,
    swing: 0,
    density: 64,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "pad", "drums"],
    soundProfile: "dminiFilter",
    tags: ["hardware", "d mini", "qi", "berlin", "tangerine dream"],
    moveFriendly: true
  },
  // ---- D MINI × ACID (v0.71): four more, each a different D MINI capability inside acid.
  {
    id: "dminiSelfOscillate",
    name: "Self-Oscillate",
    desc: "Acid where the D MINI's ladder filter sings its own note \u2014 Emphasis pushed to the self-oscillation edge so Cutoff becomes a second melody whistling over the 303. The showcase: resonance as an instrument.",
    style: "acid",
    scale: "Phrygian",
    root: 9,
    bpm: 130,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 62,
    grooveDepth: 55,
    swing: 4,
    density: 70,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "bass", "arp", "drums"],
    soundProfile: "dminiEmphasis",
    tags: ["hardware", "d mini", "acid", "resonance", "self-oscillation"],
    moveFriendly: true
  },
  {
    id: "dminiLadderAcid",
    name: "Ladder Acid",
    desc: "No 303 at all \u2014 the D MINI IS the acid line. Unison saws, snappy decay, Contour doing the env-mod squelch on a Moog ladder: rounder, meaner, and with the low end a diode filter can't give. The showcase: the D MINI as bass synth.",
    style: "acid",
    scale: "Natural Minor",
    root: 2,
    bpm: 128,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 66,
    grooveDepth: 55,
    swing: 2,
    density: 74,
    octave: 2,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["bass", "arp", "lead", "drums"],
    soundProfile: "dminiAcidBass",
    tags: ["hardware", "d mini", "acid", "bass", "no 303", "top pick"],
    moveFriendly: true
  },
  {
    id: "dminiWobbleAcid",
    name: "Wobble Acid",
    desc: "Acid with the D MINI's Filter Mod switch as the show \u2014 the LFO on the ladder filter, rate riding from 1/8 to 1/16 to free-run over a straight 303 floor. The showcase: the modulation section nobody touches.",
    style: "acid",
    scale: "Phrygian",
    root: 4,
    bpm: 130,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 60,
    grooveDepth: 55,
    swing: 4,
    density: 68,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "arp", "drums"],
    soundProfile: "dminiFilterMod",
    tags: ["hardware", "d mini", "acid", "filter mod", "lfo", "wobble"],
    moveFriendly: true
  },
  {
    id: "dminiSlowAcid",
    name: "Slow Acid",
    desc: "Acid at 118 \u2014 the D MINI's Glide as portamento over a rubbery 303, Phrygian and patient. Slower means every slide is heard whole; the D MINI's smear becomes the hook. The showcase: acid you can watch.",
    style: "acid",
    scale: "Phrygian",
    root: 7,
    bpm: 118,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 62,
    grooveDepth: 60,
    swing: 6,
    density: 64,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "bass", "arp", "drums"],
    soundProfile: "dminiGlide",
    tags: ["hardware", "d mini", "acid", "glide", "slow"],
    moveFriendly: true
  },
  // ---- D MINI × SEQUENCE STAR (v0.73): the D MINI runs the sequence in ALL EIGHT scenes.
  {
    id: "dminiPerpetual",
    name: "Perpetual",
    desc: "Acid where the D MINI sequence never leaves \u2014 all eight scenes, one line, and Cutoff IS the arrangement: closed and growling alone in the Intro, wide open over the full floor at the Drop. The star: a sequence you can't stop watching.",
    style: "acid",
    scale: "Phrygian",
    root: 4,
    bpm: 128,
    rate: "1/16",
    progression: "static",
    songLength: "sequence",
    strength: 70,
    grooveDepth: 50,
    swing: 2,
    density: 78,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "chords", "lead", "drums"],
    soundProfile: "dminiSeqAcid",
    tags: ["hardware", "d mini", "acid", "sequence", "star", "all scenes", "top pick"],
    moveFriendly: true
  },
  {
    id: "dminiSquelchEngine",
    name: "Squelch Engine",
    desc: "Faster, meaner acid \u2014 134 with the D MINI sequence driving every scene, Emphasis riding the squelch edge and Contour snapping accents. The floor comes and goes; the engine doesn't. The star: relentless.",
    style: "acid",
    scale: "Natural Minor",
    root: 9,
    bpm: 134,
    rate: "1/16",
    progression: "static",
    songLength: "sequence",
    strength: 66,
    grooveDepth: 50,
    swing: 0,
    density: 82,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "chords", "lead", "drums"],
    soundProfile: "dminiSeqAcid",
    tags: ["hardware", "d mini", "acid", "sequence", "star", "all scenes"],
    moveFriendly: true
  },
  {
    id: "dminiPhrygianMachine",
    name: "Phrygian Machine",
    desc: "Acid at 126 in E Phrygian \u2014 the D MINI sequence hypnotic and dark in all eight scenes, the flat second giving every repeat its menace. Cutoff opens across the song like a door. The star: the pattern as a place you live in.",
    style: "acid",
    scale: "Phrygian",
    root: 4,
    bpm: 126,
    rate: "1/16",
    progression: "static",
    songLength: "sequence",
    strength: 72,
    grooveDepth: 55,
    swing: 4,
    density: 76,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "chords", "lead", "drums"],
    soundProfile: "dminiSeqAcid",
    tags: ["hardware", "d mini", "acid", "sequence", "star", "all scenes", "phrygian"],
    moveFriendly: true
  },
  {
    id: "dminiGrooveGalaxy",
    name: "Groove Galaxy",
    desc: "Brikha-school Detroit \u2014 the D MINI runs a round, legato, MELODIC sequence in every scene while soulful sevenths and a second voice arrive above it. Octave mode, low resonance, notes ringing into each other. The star: a sequence that's a tune.",
    style: "detroit",
    scale: "Dorian",
    root: 5,
    bpm: 124,
    rate: "1/16",
    progression: "auto",
    songLength: "sequence",
    strength: 74,
    grooveDepth: 60,
    swing: 6,
    density: 70,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["arp", "bass", "chords", "lead", "counterMelody", "drums"],
    soundProfile: "dminiSeqBrikha",
    tags: ["hardware", "d mini", "detroit", "aril brikha", "sequence", "star", "all scenes", "top pick"],
    moveFriendly: true
  },
  {
    id: "dminiDeepBlue",
    name: "Deep Blue",
    desc: "Detroit melodic techno at 122 \u2014 the D MINI sequence as the emotional constant, Dorian and warm, Decay lengthening in the Break until the steps become a chord. Everything else is weather. The star: patience with a pulse.",
    style: "detroit",
    scale: "Dorian",
    root: 2,
    bpm: 122,
    rate: "1/16",
    progression: "auto",
    songLength: "sequence",
    strength: 76,
    grooveDepth: 60,
    swing: 6,
    density: 66,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["arp", "bass", "chords", "lead", "counterMelody", "drums"],
    soundProfile: "dminiSeqBrikha",
    tags: ["hardware", "d mini", "detroit", "aril brikha", "sequence", "star", "all scenes"],
    moveFriendly: true
  },
  {
    id: "dminiArtOfVibration",
    name: "Art of Vibration",
    desc: "The Brikha thesis at 128 \u2014 a D MINI sequence so melodic it carries the song alone, then keeps carrying it when the soul chords and the second voice pile on. Detune breathes at Build 2. The star: the sequence as the melody's engine.",
    style: "detroit",
    scale: "Natural Minor",
    root: 7,
    bpm: 128,
    rate: "1/16",
    progression: "auto",
    songLength: "sequence",
    strength: 74,
    grooveDepth: 55,
    swing: 4,
    density: 72,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["arp", "bass", "chords", "lead", "counterMelody", "drums"],
    soundProfile: "dminiSeqBrikha",
    tags: ["hardware", "d mini", "detroit", "aril brikha", "sequence", "star", "all scenes"],
    moveFriendly: true
  },
  // ---- Behringer CZ-1 MINI showcases (v0.74): phase distortion, not subtractive —
  // DCW (adds harmonics) is the arrangement knob where D MINI uses Cutoff (removes them).
  {
    id: "cz1SeqCathedral",
    name: "CZ Cathedral",
    desc: "Berlin School sequence where the CZ-1 MINI's phase distortion IS the arrangement \u2014 DCW opening from a closed pulse to a fully harmonic drive across all eight scenes, Jarre / Tangerine Dream territory built on digital oscillators instead of analog ones. The star: DCW doing the job Cutoff does on the D MINI sequence-stars, but by adding harmonics rather than subtracting them.",
    style: "classicSeq",
    scale: "Natural Minor",
    bpm: 122,
    rate: "1/16",
    progression: "static",
    songLength: "sequence",
    strength: 88,
    grooveDepth: 65,
    swing: 0,
    density: 68,
    octave: 3,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "bass", "chords", "lead", "drums"],
    soundProfile: "cz1SeqPulse",
    tags: ["hardware", "cz-1 mini", "sequence", "star", "all scenes", "jarre", "berlin", "phase distortion", "top pick"],
    moveFriendly: true
  },
  {
    id: "cz1EnsembleGlow",
    name: "Ensemble Glow",
    desc: "Warm Detroit soul voiced through the CZ-1 MINI's LINE 1+2 stack \u2014 the architecture itself is the showcase, not one knob: two phase-distortion lines detuned into a single glowing EP/string hybrid chord voice, the sound that made this synthesis method a mid-80s pop staple.",
    style: "detroit",
    scale: "Dorian",
    bpm: 124,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 78,
    grooveDepth: 58,
    swing: 6,
    density: 66,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["chords", "bass", "lead", "drums"],
    soundProfile: "cz1LineStack",
    tags: ["hardware", "cz-1 mini", "detroit", "line stack", "dual line", "retro"],
    moveFriendly: true
  },
  {
    id: "cz1MetalDrift",
    name: "Metal Drift",
    desc: "Dub techno with the CZ-1 MINI's DETUNE pushed to dissonance \u2014 two phase-distortion lines beating against each other for a clangorous, inharmonic lead, sent into long delay feedback. The showcase: the parameter everyone sets to a few cents for chorus, used instead for deliberate metal.",
    style: "dubTechno",
    scale: "Natural Minor",
    bpm: 122,
    rate: "1/16",
    progression: "static",
    songLength: "long",
    strength: 86,
    grooveDepth: 78,
    swing: 0,
    density: 40,
    octave: 3,
    hook: false,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "chords", "bass", "drums"],
    soundProfile: "cz1RingDrift",
    tags: ["hardware", "cz-1 mini", "dub", "detune", "dissonance", "long-form", "hypnotic"],
    moveFriendly: true
  },
  // ---- CZ-1 MINI × HOOKS (v0.75): catchy first. The CZ line's actual history is mid-80s pop
  // earworms — E-piano, bell and brass hooks — so these put the hardware on the hook part.
  {
    id: "cz1TineAnthem",
    name: "Tine Anthem",
    desc: "Synthwave anthem with the CZ-1 MINI's electric piano as THE hook \u2014 the bright-to-mellow tine strike that defined mid-80s pop, exposed alone in the Breakdown and carried back on OB-X pads at the Drop. The hook repeats unchanged every time: recognisable by the second chorus. The showcase: the sound the CZ was famous for, used the way it was famous.",
    style: "synthwave",
    scale: "Natural Minor",
    root: 9,
    bpm: 118,
    rate: "1/8",
    progression: "auto",
    songLength: "anthem",
    strength: 82,
    grooveDepth: 45,
    swing: 0,
    density: 62,
    octave: 4,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "chords", "bass", "pad", "arp", "drums"],
    soundProfile: "cz1TineHook",
    tags: ["hardware", "cz-1 mini", "hook", "80s pop", "e-piano", "anthem", "top pick"],
    moveFriendly: true
  },
  {
    id: "cz1BellAnthem",
    name: "Glass Anthem",
    desc: "Melodic trance at 132 with the CZ-1 MINI's glass bell on the topline \u2014 a ringing, inharmonic hook over a rolling sub, washed in hall. The bell goes pure and exposed in the Breakdown (Detune pulled in), then shimmers wide again at the Drop. The showcase: the CZ's other signature voice, written to be sung back.",
    style: "trance",
    scale: "Natural Minor",
    root: 4,
    bpm: 132,
    rate: "1/16",
    progression: "auto",
    songLength: "anthem",
    strength: 84,
    grooveDepth: 42,
    swing: 0,
    density: 70,
    octave: 4,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "chords", "bass", "arp", "pad", "drums"],
    soundProfile: "cz1BellHook",
    tags: ["hardware", "cz-1 mini", "hook", "bell", "trance", "anthem"],
    moveFriendly: true
  },
  {
    id: "cz1StabHook",
    name: "Stab Hook",
    desc: "80s synthwave where the CZ-1 MINI's brass STABS are the hook \u2014 the notes never change, the rhythm of the hits is the earworm, and one control (DCW rate) flips the section from swell to hard hit. A singable topline rides on top; the stabs are what you leave humming. The showcase: rhythm as melody.",
    style: "synthwave",
    scale: "Dorian",
    root: 2,
    bpm: 116,
    rate: "1/8",
    progression: "auto",
    songLength: "standard",
    strength: 78,
    grooveDepth: 55,
    swing: 4,
    density: 64,
    octave: 3,
    hook: true,
    phrase: false,
    callResponse: true,
    energyArc: true,
    parts: ["chords", "lead", "bass", "drums"],
    soundProfile: "cz1BrassStab",
    tags: ["hardware", "cz-1 mini", "hook", "brass", "stab", "retro"],
    moveFriendly: true
  },
  {
    id: "cz1ReedSong",
    name: "Reed Song",
    desc: "Melodic techno with the CZ-1 MINI as a reedy, vocal lead \u2014 call-and-response phrases with a delayed vibrato that makes it sound played, not programmed; a bell counter-melody answers behind it. Built for a hook you can whistle. The showcase: the phase-distortion reed as a singer.",
    style: "melodicTechno",
    scale: "Natural Minor",
    root: 7,
    bpm: 124,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 84,
    grooveDepth: 58,
    swing: 0,
    density: 66,
    octave: 4,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "counterMelody", "chords", "bass", "drums"],
    soundProfile: "cz1ReedTopline",
    tags: ["hardware", "cz-1 mini", "hook", "reed", "vocal", "call and response"],
    moveFriendly: true
  },
  // ---- v0.79: ten more songs, aimed at the thinner genres (Trance, Deep House, Lo-fi,
  // Breakbeat, Ambient) plus two hook-first Detroit/Berlin entries. All Move-friendly.
  {
    id: "tranceOpenSky",
    name: "Open Sky",
    desc: "Uplifting trance at 138 with a wide supersaw-style pad and a bell hook that only appears at the Drop \u2014 the Breakdown is pad and lead alone, long enough to feel the room hold its breath.",
    style: "trance",
    scale: "Natural Minor",
    root: 2,
    bpm: 138,
    rate: "1/16",
    progression: "auto",
    songLength: "anthem",
    strength: 84,
    grooveDepth: 40,
    swing: 0,
    density: 72,
    octave: 4,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "chords", "bass", "arp", "pad", "drums"],
    soundProfile: "tranceGlass",
    tags: ["trance", "uplifting", "anthem", "hook"],
    moveFriendly: true
  },
  {
    id: "tranceNightDrive",
    name: "Night Drive 132",
    desc: "Progressive trance, darker and slower than Open Sky: a rolling offbeat bass, plucked arp, and a lead that phrases in long question-answer pairs across eight bars.",
    style: "trance",
    scale: "Dorian",
    root: 9,
    bpm: 132,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 82,
    grooveDepth: 48,
    swing: 0,
    density: 66,
    octave: 4,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "arp", "bass", "pad", "drums"],
    soundProfile: "tranceGlass",
    tags: ["trance", "progressive", "long-form", "hook"],
    moveFriendly: true
  },
  {
    id: "houseSaltAir",
    name: "Salt Air",
    desc: "Deep house at 121 with organ stabs on the offs and a warm, slow-moving chord bed \u2014 the kind of track that runs the same groove for six minutes and never gets boring because the bass keeps answering the organ.",
    style: "deepHouse",
    scale: "Dorian",
    root: 5,
    bpm: 121,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 74,
    grooveDepth: 62,
    swing: 8,
    density: 60,
    octave: 3,
    hook: true,
    phrase: false,
    callResponse: true,
    energyArc: true,
    parts: ["chords", "bass", "lead", "drums"],
    soundProfile: "organHouse",
    tags: ["deep house", "organ", "groove", "hook"],
    moveFriendly: true
  },
  {
    id: "houseLateCheckout",
    name: "Late Checkout",
    desc: "Slow deep house at 118 \u2014 dusty chords, a sub that sits still, a lead that only speaks in the Break. For the hour after the club, not the club.",
    style: "deepHouse",
    scale: "Major",
    root: 7,
    bpm: 118,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 72,
    grooveDepth: 66,
    swing: 10,
    density: 52,
    octave: 3,
    hook: false,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["chords", "bass", "lead", "pad", "drums"],
    soundProfile: "deepHouseVelvet",
    tags: ["deep house", "slow", "afterhours"],
    moveFriendly: true
  },
  {
    id: "lofiRainWindow",
    name: "Rain Window",
    desc: "Lo-fi at 78 with a Lydian lift \u2014 soft keys, a bass that walks, and a lead that hums one four-note idea over and over, slightly differently each pass.",
    style: "lofi",
    scale: "Lydian",
    root: 0,
    bpm: 78,
    rate: "1/8T",
    progression: "auto",
    songLength: "short",
    strength: 76,
    grooveDepth: 72,
    swing: 18,
    density: 50,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: false,
    parts: ["chords", "bass", "lead", "drums"],
    soundProfile: "deepHouseVelvet",
    tags: ["lo-fi", "keys", "hook"],
    moveFriendly: true
  },
  {
    id: "lofiTapeLoop",
    name: "Tape Loop",
    desc: "Lo-fi at 88, Minor Pentatonic, built like a sampled loop: a two-chord vamp, a bass that repeats exactly, and drums with heavy swing. The point is that it doesn't change.",
    style: "lofi",
    scale: "Minor Pentatonic",
    root: 4,
    bpm: 88,
    rate: "1/8",
    progression: "auto",
    songLength: "short",
    strength: 90,
    grooveDepth: 75,
    swing: 20,
    density: 48,
    octave: 3,
    hook: false,
    phrase: false,
    callResponse: false,
    energyArc: false,
    parts: ["chords", "bass", "drums"],
    soundProfile: "deepHouseVelvet",
    tags: ["lo-fi", "loop", "hypnotic"],
    moveFriendly: true
  },
  {
    id: "breaksNeonRain",
    name: "Neon Rain",
    desc: "Breakbeat at 134 with a Reese bass and a bright hook lead \u2014 a rave anthem with the drums doing the storytelling: the fill into each Main is where the song actually turns.",
    style: "breakbeat",
    scale: "Natural Minor",
    root: 7,
    bpm: 134,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 80,
    grooveDepth: 55,
    swing: 0,
    density: 68,
    octave: 4,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "bass", "chords", "drums"],
    soundProfile: "jungleReese",
    tags: ["breakbeat", "rave", "hook"],
    moveFriendly: true
  },
  {
    id: "breaksHalfLight",
    name: "Half Light",
    desc: "Slow breaks at 112 \u2014 halftime feel, a wide pad and a lead that leaves space. Trip-hop adjacent without the samples.",
    style: "breakbeat",
    scale: "Phrygian",
    root: 2,
    bpm: 112,
    rate: "1/8",
    progression: "auto",
    songLength: "standard",
    strength: 74,
    grooveDepth: 68,
    swing: 6,
    density: 46,
    octave: 3,
    hook: false,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "bass", "pad", "drums"],
    soundProfile: "brightBreaks",
    tags: ["breakbeat", "halftime", "dark"],
    moveFriendly: true
  },
  {
    id: "ambientTideTables",
    name: "Tide Tables",
    desc: "Ambient at 70 with no drums \u2014 a glass pad, a bass that changes once a bar, and a lead that arrives in the second half and repeats a three-note cell until the Fade. Sunrise music.",
    style: "ambient",
    scale: "Major",
    root: 9,
    bpm: 70,
    rate: "1/4",
    progression: "auto",
    songLength: "long",
    strength: 86,
    grooveDepth: 20,
    swing: 0,
    density: 34,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["pad", "bass", "lead"],
    soundProfile: "glassAmbient",
    tags: ["ambient", "no drums", "long-form", "hook"],
    moveFriendly: true
  },
  {
    id: "detroitHighRise",
    name: "High Rise",
    desc: "Detroit at 126 with the hook in the CHORDS \u2014 a stab pattern that never changes its notes, only its rhythm per section, over a bass that funks against it. Sung-back stabs, Underground-Resistance energy without the rage.",
    style: "detroit",
    scale: "Dorian",
    root: 4,
    bpm: 126,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 86,
    grooveDepth: 60,
    swing: 4,
    density: 64,
    octave: 3,
    hook: true,
    phrase: false,
    callResponse: true,
    energyArc: true,
    parts: ["chords", "bass", "lead", "drums"],
    soundProfile: "detroitEmotional",
    tags: ["detroit", "stabs", "hook"],
    moveFriendly: true
  },
  // ---- v0.81: Jean-Michel Jarre, six ways. Not one "Jarre" — six distinct records' habits.
  {
    id: "jarreEquinoxSeq",
    name: "\xC9quinoxe Machine",
    desc: "\xC9quinoxe-era Jarre: a bright staccato ostinato that never stops, Eminent strings through a phaser, and a PWM lead that sings a four-bar tune you can whistle over the top. The sequence is the star \u2014 it runs in every scene.",
    style: "classicSeq",
    scale: "Natural Minor",
    root: 2,
    bpm: 126,
    rate: "1/16",
    progression: "static",
    songLength: "sequence",
    strength: 90,
    grooveDepth: 40,
    swing: 0,
    density: 70,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["arp", "lead", "pad", "chords", "bass", "drums"],
    soundProfile: "jarreSequence",
    tags: ["jarre", "berlin", "sequence", "star", "all scenes", "hook", "top pick"],
    moveFriendly: true
  },
  {
    id: "jarreMagneticFields",
    name: "Magnetic Fields",
    desc: "Faster, brighter Jarre at 132 \u2014 the sequence in Dorian so it lifts instead of broods, brass stabs on the changes, and a lead that only arrives at the Main and then owns the second half. Fairlight-era energy without the samples.",
    style: "classicSeq",
    scale: "Dorian",
    root: 7,
    bpm: 132,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 86,
    grooveDepth: 42,
    swing: 0,
    density: 72,
    octave: 3,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["arp", "lead", "chords", "pad", "bass", "drums"],
    soundProfile: "jarreSequence",
    tags: ["jarre", "berlin", "long-form", "hook", "bright"],
    moveFriendly: true
  },
  {
    id: "jarreOxygeneNight",
    name: "Oxyg\xE8ne Night",
    desc: "The slow Oxyg\xE8ne side at 88: phased strings breathing in whole notes, a rhythm-box pulse, and a lead that states one melancholy phrase and answers itself in echoes. Space, then more space.",
    style: "ambient",
    scale: "Natural Minor",
    root: 9,
    bpm: 88,
    rate: "1/8",
    progression: "auto",
    songLength: "long",
    strength: 84,
    grooveDepth: 30,
    swing: 0,
    density: 44,
    octave: 4,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "counterMelody", "pad", "chords", "bass", "drums"],
    soundProfile: "jarreAirLead",
    tags: ["jarre", "oxygene", "ambient", "long-form", "hook"],
    moveFriendly: true
  },
  {
    id: "jarreGrandRendezVous",
    name: "Grand Rendez-Vous",
    desc: "The Rendez-Vous grandeur: huge brass-choir pads, a heroic lead over a slow harmonic rhythm, the anthem template so the Breakdown strips to pad and lead and the Drop brings the sequence back underneath. Stadium Jarre.",
    style: "synthwave",
    scale: "Major",
    root: 0,
    bpm: 104,
    rate: "1/8",
    progression: "auto",
    songLength: "anthem",
    strength: 84,
    grooveDepth: 35,
    swing: 0,
    density: 62,
    octave: 4,
    hook: true,
    phrase: true,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "chords", "pad", "arp", "bass", "drums"],
    soundProfile: "jarreAirLead",
    tags: ["jarre", "rendez-vous", "anthem", "hook", "major"],
    moveFriendly: true
  },
  {
    id: "jarreLaserHarp",
    name: "Laser Harp",
    desc: "Fourth Rendez-Vous energy at 120: a fanfare hook on the lead, staccato brass answering it, a driving sequence under both. The hook is stated plainly every time \u2014 it's a fanfare, not a solo.",
    style: "synthwave",
    scale: "Major",
    root: 5,
    bpm: 120,
    rate: "1/16",
    progression: "auto",
    songLength: "standard",
    strength: 88,
    grooveDepth: 45,
    swing: 0,
    density: 68,
    octave: 4,
    hook: true,
    phrase: false,
    callResponse: true,
    energyArc: true,
    parts: ["lead", "chords", "arp", "bass", "drums"],
    soundProfile: "jarreSequence",
    tags: ["jarre", "rendez-vous", "fanfare", "hook"],
    moveFriendly: true
  },
  {
    id: "jarreChronologie",
    name: "Chronologie",
    desc: "Jarre meets the dancefloor at 130 \u2014 the Chronologie 4 move: a trance pulse, a sequence with a rave-era shuffle, and a lead hook that resolves up to the fifth every eight bars. The most club-ready thing here.",
    style: "trance",
    scale: "Natural Minor",
    root: 4,
    bpm: 130,
    rate: "1/16",
    progression: "auto",
    songLength: "long",
    strength: 86,
    grooveDepth: 46,
    swing: 4,
    density: 70,
    octave: 4,
    hook: true,
    phrase: true,
    callResponse: false,
    energyArc: true,
    parts: ["lead", "arp", "chords", "bass", "pad", "drums"],
    soundProfile: "jarreSequence",
    tags: ["jarre", "trance", "chronologie", "long-form", "hook"],
    moveFriendly: true
  }
];
var STYLE_FAMILY = {
  classicSeq: "Berlin School",
  detroit: "Detroit",
  dubTechno: "Dub Techno",
  melodicTechno: "Melodic Techno",
  acid: "Acid Techno",
  // default; the groove/melodic side is re-homed to Acid House below
  trance: "Trance",
  deepHouse: "Deep House",
  synthwave: "Synthwave",
  breakbeat: "Breakbeat",
  ambient: "Ambient",
  lofi: "Lo-fi"
};
var STARTER_FAMILY_ORDER = ["Berlin School", "Detroit", "Dub Techno", "Melodic Techno", "Acid House", "Acid Techno", "Trance", "Deep House", "Synthwave", "Breakbeat", "Ambient", "Lo-fi"];
var FAMILY_OVERRIDE = {
  squelchFunk: "Acid House",
  basementJack: "Acid House",
  acidMeadow: "Acid House",
  acidDawn: "Acid House",
  dminiSlowAcid: "Acid House"
};
var INFLUENCES = {
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
  "patrice baumel": "Patrice B\xE4umel",
  "ben bohmer": "Ben B\xF6hmer",
  "hardfloor": "Hardfloor",
  "perturbator": "Perturbator",
  "reznor": "Trent Reznor"
};
function starterInfluences(s) {
  return (s.tags || []).filter((t) => INFLUENCES[t]).map((t) => INFLUENCES[t]);
}
var STARTER_FAMILY = Object.fromEntries(
  SONG_STARTERS.map((s) => [s.id, FAMILY_OVERRIDE[s.id] ?? STYLE_FAMILY[s.style] ?? "Ambient"])
);
function resolveStarter(id, seed) {
  if (id === "surprise") {
    const r = mulberry32((seed | 0) ^ 24293);
    const base = SONG_STARTERS[Math.floor(r() * SONG_STARTERS.length)];
    return { ...base, id: "surprise", name: "Surprise", desc: `\u{1F3B2} ${base.name}: ${base.desc}` };
  }
  return SONG_STARTERS.find((s) => s.id === id) ?? null;
}
function songName(seed) {
  const r = mulberry32((seed | 0) ^ 20727);
  const adj = ["Obsidian", "Crimson", "Iron", "Silent", "Hollow", "Distant", "Frozen", "Molten", "Velvet", "Ashen", "Cobalt", "Amber", "Pale", "Endless", "Sacred", "Phantom", "Electric", "Lunar", "Solar", "Northern", "Buried", "Golden", "Violet", "Static", "Midnight", "Fractured", "Gilded", "Sunken"];
  const noun = ["Drift", "Vessel", "Meridian", "Pulse", "Signal", "Cathedral", "Horizon", "Descent", "Aurora", "Threshold", "Circuit", "Tide", "Ember", "Mirage", "Spire", "Echo", "Current", "Void", "Halo", "Machine", "Requiem", "Passage", "Bloom", "Frequency", "Monolith", "Lantern", "Cascade", "Reverie"];
  return adj[Math.floor(r() * adj.length)] + " " + noun[Math.floor(r() * noun.length)];
}
var GUIDE_DEFAULT = {
  piano: "Drift \u2014 felt EP: soft triangle keys, dark lid, quiet sub; the song's motif as a piece",
  lead: "Drift \u2014 mono saw lead, medium filter env, ping-pong delay",
  bass: "Drift \u2014 saw bass, tight decay, LP filter ~400 Hz, slight drive",
  pad: "Wavetable \u2014 warm 2-osc pad, slow attack, chorus + long reverb",
  chords: "Analog \u2014 poly stab, fast decay, a touch of chorus",
  counterMelody: "Operator \u2014 soft square, short delay, sits behind the lead",
  arp: "Drift \u2014 bright pluck, short decay, 1/8 delay 30% wet",
  drums: "Drum Rack \u2014 909-style kit, light bus compression"
};
var SOUND_GUIDE = {
  melodicTechno: {
    lead: "Drift \u2014 detuned saw lead, LP env + resonance, dotted-8th delay (Tale Of Us energy)",
    bass: "Drift/Operator \u2014 rolling offbeat saw bass, tight AMP decay, saturator",
    pad: "Wavetable \u2014 dark evolving pad, slow LFO on wavetable position, big hall",
    chords: "Analog \u2014 plucked minor stabs, short release, sidechain to kick",
    counterMelody: "Operator \u2014 glassy FM keys, low velocity, 1/4 delay",
    arp: "Drift \u2014 hypnotic 16th pluck, filter slowly opening across sections",
    drums: "Drum Rack \u2014 rumbling kick (long tail), tight claps, shaker 16ths"
  },
  dubTechno: {
    lead: "Operator \u2014 muted FM tone drowned in delay + spring-style reverb",
    bass: "Drift \u2014 deep sine/triangle sub, very short, mono",
    pad: "Wavetable \u2014 grey washed pad, HP at 200 Hz, huge reverb 100% wet send",
    chords: "Analog \u2014 THE dub chord: minor stab into filtered ping-pong delay, echoes forever",
    counterMelody: "Operator \u2014 sparse echo blips",
    arp: "Drift \u2014 dark 16th tick, mostly filtered away",
    drums: "Drum Rack \u2014 dusty 909, hats soft, everything through a gentle LP"
  },
  detroit: {
    lead: "Operator \u2014 bell-ish FM lead (Knights strings: try Strings ensemble rack), soulful vibrato",
    bass: "Drift \u2014 round finger-style bass, swung, slight portamento",
    pad: "Wavetable \u2014 lush string machine pad, ensemble chorus",
    chords: "Analog \u2014 7th-chord stabs, swung, phaser slow",
    counterMelody: "Operator \u2014 muted trumpet-ish FM, call-and-response",
    arp: "Drift \u2014 bright hi-string pluck",
    drums: "Drum Rack \u2014 909 with swung hats, rimshot accents"
  },
  ambient: {
    lead: "Wavetable \u2014 airy whistle/flute tone, glide, long release, shimmer reverb",
    bass: "Drift \u2014 barely-there sub swell, slow attack",
    pad: "Wavetable \u2014 2 detuned wavetables, 4s attack, granular-ish motion, cathedral reverb",
    chords: "Analog \u2014 add9 washes, slow attack, tremolo very slow",
    counterMelody: "Operator \u2014 music-box tine, sparse",
    arp: "Drift \u2014 soft harp pluck, generous delay feedback",
    drums: "Drum Rack \u2014 brushed textures or none at all"
  },
  classicSeq: {
    lead: "Drift \u2014 resonant PWM lead \xE0 la Tangerine Dream, portamento on",
    bass: "Drift \u2014 punchy octave sequence bass, tight, slight drive",
    pad: "Wavetable \u2014 choir-ish pad, slow phaser",
    chords: "Analog \u2014 organ-ish sustained triads",
    counterMelody: "Operator \u2014 secondary sequence voice, detuned from the arp",
    arp: "Drift \u2014 THE sequence: square/saw mix, 16ths, filter rides the whole song",
    drums: "Drum Rack \u2014 CR-78/electro kit, restrained"
  },
  deepHouse: {
    lead: "Operator \u2014 muted EP lead, soft velocity",
    bass: "Drift \u2014 deep rolling sub with a rubbery attack click",
    pad: "Wavetable \u2014 warm jazzy pad, gentle chorus",
    chords: "Analog \u2014 Rhodes-style 7th stabs, swung, LP filter",
    counterMelody: "Operator \u2014 vibes/marimba-ish FM, sparse",
    arp: "Drift \u2014 silky pluck, low in the mix",
    drums: "Drum Rack \u2014 909 four-floor, open hat offbeats, ride ghost notes"
  },
  acid: {
    lead: "Drift \u2014 screaming resonant saw, envelope mod full (or a 303 clone on this track)",
    bass: "Drift \u2014 303: saw, high resonance, env-mod, accent + glide (the evolving line IS the song)",
    pad: "Wavetable \u2014 thin background haze, keep out of the way",
    chords: "Analog \u2014 rare metallic stabs",
    counterMelody: "Operator \u2014 secondary acid blips, heavily delayed",
    arp: "Drift \u2014 clicky 16th ticker",
    drums: "Drum Rack \u2014 hard 909, crunchy hats, clap layered"
  },
  trance: {
    lead: "Drift \u2014 supersaw-style detuned lead, wide, sidechained, big reverb (the anthem voice)",
    bass: "Drift \u2014 offbeat saw bass, tight LP, mono",
    pad: "Wavetable \u2014 uplifting supersaw pad, slow attack",
    chords: "Analog \u2014 sus-chord plucks, gated feel",
    counterMelody: "Operator \u2014 crystal counter-line, upper register",
    arp: "Drift \u2014 driving 16th pluck, delay throw",
    drums: "Drum Rack \u2014 909, long crash tails, rolling 16th hats"
  },
  lofi: {
    lead: "Operator \u2014 dusty EP melody, low velocity, wow/flutter (Echo device)",
    bass: "Drift \u2014 soft round bass, no click",
    pad: "Wavetable \u2014 tape-warble pad, vinyl crackle layer",
    chords: "Analog \u2014 jazzy 7/9 keys through a LP + saturator",
    counterMelody: "Operator \u2014 hummed-melody stand-in, very quiet",
    arp: "Drift \u2014 kalimba-ish pluck",
    drums: "Drum Rack \u2014 dusty breaks kit, swung, low-passed"
  },
  synthwave: {
    lead: "Drift \u2014 brassy PWM lead, glide, gated reverb",
    bass: "Drift \u2014 driving octave bass, chorus, tight",
    pad: "Wavetable \u2014 huge 80s polysynth pad, ensemble chorus",
    chords: "Analog \u2014 power triads, gated",
    counterMelody: "Operator \u2014 DX-style bells",
    arp: "Drift \u2014 sparkling 16th arp, delay",
    drums: "Drum Rack \u2014 LinnDrum/gated-snare kit"
  },
  breakbeat: {
    lead: "Drift \u2014 rave hoover/stab lead, pitch-bent",
    bass: "Drift \u2014 reese-ish detuned bass, LP moves",
    pad: "Wavetable \u2014 dark strings pad",
    chords: "Analog \u2014 rave piano/stab chords, bright",
    counterMelody: "Operator \u2014 vocal-chop stand-in blips",
    arp: "Drift \u2014 festival pluck, wide",
    drums: "Drum Rack \u2014 chopped break kit (the star): layered snares, crash accents"
  }
};
var STYLE_STORY = {
  melodicTechno: "Melodic techno lives in the tension between a machine pulse and a human melody. The groove never lets go; the emotion arrives in the filter and the reverb tail, not in a chorus. Think Bodzin, Brikha \u2014 hypnotic first, pretty second.",
  dubTechno: "Dub techno is about space and decay. One chord, drenched in delay feedback, breathing against a soft kick. The chord isn't the event \u2014 the *echo* of the chord is. Basic Channel, Deepchord: the mix desk is the instrument.",
  detroit: "Detroit techno is soul played by machines. Bell melodies and 7th chords carry real melancholy over a stubbornly mechanical kick. It's optimistic and sad at once \u2014 Atkins, May, the future as it was imagined in 1988.",
  ambient: "Ambient is weather, not narrative. There's no beat to follow, so the ear falls into texture and slow harmonic drift. It has to reward both close listening and total inattention \u2014 Eno's test.",
  classicSeq: "Berlin School is the sequencer as protagonist. One 16th-note line runs for the whole piece; the composition happens *to* it \u2014 filter opening, notes added, octaves shifting. Tangerine Dream, Schulze: patience is the technique.",
  deepHouse: "Deep house is warmth and swing. Rhodes 7ths, a bass that walks rather than pounds, and a shuffle that makes the grid feel human. It's a groove you sink into, not one that hits you.",
  acid: "Acid is one squelching machine line \u2014 the 303 \u2014 and everyone else getting out of its way. The melody *is* the filter movement. Res up, cutoff riding, accent and glide doing the singing. The line evolves; nothing else needs to.",
  trance: "Trance is the long emotional arc: tension coiled over 32 bars, released in a supersaw payoff. Its honesty is in the build \u2014 the breakdown has to earn the drop, or it's just loud.",
  lofi: "Lo-fi is imperfection as comfort. Detuned keys, tape wobble, a swung kit that's slightly late. The dust is the point \u2014 polish it and the feeling dies.",
  synthwave: "Synthwave is nostalgia for a decade that never quite happened. Octave bass runs, gated drums, neon leads with too much reverb \u2014 sincere, not ironic.",
  breakbeat: "Breakbeat is broken momentum. The kick lands where you don't expect and the groove pulls forward. Energy comes from the gaps, not the density."
};
var SECTION_NOTE = {
  Intro: "State the idea bare. Filter mostly closed, few elements \u2014 let the listener lean in.",
  Build: "Add one element, not three. Open the filter a little. Tension comes from restraint.",
  Main: "The idea at full size. This is the section the track is *about* \u2014 ride the filter here.",
  Break: "Take the floor away. Drop the drums, let the tails and reverb breathe. The reset that makes Main 2 land.",
  "Main 2": "Same idea, more weight. Add the counter-element you held back. Never a new idea \u2014 a fuller one.",
  "Build 2": "Coil it again, tighter and shorter than the first build. The listener knows what's coming.",
  Drop: "Maximum commitment. Everything in, filter wide. Short \u2014 leave before it gets boring.",
  Outro: "Undo the intro. Strip back element by element, let the last echo decay into nothing."
};
var GENRE_CUES = {
  melodicTechno: {
    Intro: "Only {harm} and a filtered {bass}. **{harm} filter at 30%** \u2014 the chords are a rumour. Nothing else in.",
    Build: "Bring {drums} in on bar 1, hats only until bar 9. **Open {harm}'s filter 30 \u2192 55%** across the section.",
    Main: "Full floor. **{lead} carries the idea** \u2014 ride its filter with the 8-bar phrases; sends up 20% on the last bar of each 8.",
    Break: "Mute {drums} on the downbeat. **{harm} + reverb send to 60%** \u2014 the chords finally breathe. Last 4 bars: pull the send back down.",
    "Main 2": "Everything back, one notch bigger: **{lead} filter 10% wider than Main**, {bass} unmuted on bar 1 with the kick.",
    "Build 2": "Cut {bass} for 8 bars \u2014 tension by absence. **{lead} filter climbing** to wide open by the last bar.",
    Drop: "**Filters wide, sends low, everything in.** The idea at full size. Don't add \u2014 commit.",
    Outro: "Mute {lead} first, then {drums} at bar 5. **{harm} filter closing 100 \u2192 30%** \u2014 end where you began."
  },
  dubTechno: {
    Intro: "Kick and a closed {harm} chord. **{harm} filter 25%, delay send 40%** \u2014 the chord is a shape in fog.",
    Build: "Hats in. **Nudge the delay feedback up 10%** \u2014 the tails start to overlap. Nothing melodic yet.",
    Main: "The chord finds its pulse. **{harm} filter 25 \u2194 45% in slow waves**, 8 bars per breath. This IS the song.",
    Break: "Kick out. **Delay feedback to 70%** \u2014 the chord repeats into itself. Let it smear for 8, then pull feedback down.",
    "Main 2": "Kick back. **{harm} filter waves 5% wider**; {bass} sub unmuted for weight.",
    "Build 2": "Hi-pass {bass} out slowly \u2014 **the floor thins under the chord.** Delay send creeping up.",
    Drop: "**{harm} filter to 60%** \u2014 the brightest the chord ever gets. Feedback down so it stays clear.",
    Outro: "Kick out at bar 1. **Delay feedback up, dry signal down** \u2014 the chord dissolves into its own echoes."
  },
  detroit: {
    Intro: "Kick, hats, {bass}. **{bass} filter 40%** \u2014 feel the pocket before anything sings.",
    Build: "**{harm} stabs enter, filter 50%** \u2014 short, on the off-beats. Snare in on bar 9.",
    Main: "Full groove. **{lead} answers the stabs** \u2014 keep it sparse; the space IS Detroit. Ride {harm}'s send for the phrase-ends.",
    Break: "Kick and {bass} out. **{harm} + reverb send 50%** \u2014 the stabs float. Bring the kick back on the last beat.",
    "Main 2": "The soul section: **{harm} filter 10% wider, stabs a touch longer** \u2014 everything back, warmer.",
    "Build 2": "Snare rolls in {drums}; **{lead} filter climbing** \u2014 the payoff is owed.",
    Drop: "**Full groove, filters open** \u2014 but keep the space. Detroit's climax is confidence, not clutter.",
    Outro: "Strip in reverse: {lead} out, {harm} out, {bass} filter closing \u2014 **the kick leaves last.**"
  },
  ambient: {
    Intro: "Only {harm}. **Filter 20%, reverb send 60%** \u2014 the pad exists before it has a shape. Wait a full scene.",
    Build: "**{harm} filter 20 \u2192 40%** across the whole scene, one continuous breath. {bass} enters, barely.",
    Main: "The idea at rest. **{lead} enters mid-scene, filter low** \u2014 a distant bell. Nothing else moves; time does.",
    Break: "Nothing new \u2014 take away instead: **{bass} out, {harm} send to 80%.** The reset that makes return mean something.",
    "Main 2": "{bass} back. **{lead} filter 15% wider** \u2014 the bell is a little closer.",
    "Build 2": "The one lean-forward: **{harm} filter to 55%**, sends steady.",
    Drop: "The fullest the piece gets \u2014 **{harm} filter 60%, {lead} present.** Still nothing sudden.",
    Outro: "**Every filter closing over 8 bars, sends up** \u2014 the pad returns to a rumour, then to nothing."
  },
  classicSeq: {
    Intro: "{harm} sequence only, **filter 25%** \u2014 rhythm without pitch. Sit on your hands.",
    Build: "Kick in on bar 1. **{harm} filter 25 \u2192 40%**, one continuous creep \u2014 if anyone sees you move, you moved too fast.",
    Main: "**{harm} filter 40 \u2192 60%** over the scene, micro-oscillating with the phrase. {lead} drifts long tones above.",
    Break: "Kick out. **{harm} resonance up 20%** \u2014 the sequence whistles its own melody. The only resonance move in the piece.",
    "Main 2": "Resonance back down; **{harm} filter 40 \u2192 70%** \u2014 familiar ground, higher altitude.",
    "Build 2": "**70 \u2192 85%** in 16 bars \u2014 faster than before feels urgent. The sequence starts to shout.",
    Drop: "**{harm} filter wide open, HOLD.** Every harmonic lit. The payoff for the patience is simply all of it.",
    Outro: "One unbroken fall, **wide open \u2192 25%**, all 8 bars. End where you began."
  },
  deepHouse: {
    Intro: "Kick and swung hats. **{bass} filter 35%** \u2014 the pocket first, always.",
    Build: "**{harm} chords enter, filter 45%**, on the twos and fours. Let it swing before anything else.",
    Main: "The room. **Micro-moves only** \u2014 {bass} filter \xB15% with the phrases, like a fader you're pretending not to touch.",
    Break: "Kick out. **{harm} + reverb send 45%** \u2014 the chords hang. Deep house breaks are warm, not empty.",
    "Main 2": "The fullest it gets: **{bass} filter 50%, {harm} a touch brighter.** The climax is a warm room, not a drop.",
    "Build 2": "**{harm} filter to 60%** \u2014 a little more light in the room.",
    Drop: "Deep house doesn't drop \u2014 **hold Main 2's warmth and lean in.** Sends up 10%.",
    Outro: "**{bass} filter back to 35%** over 8 bars \u2014 the track leaves the way it arrived, still grooving."
  },
  acid: {
    Intro: "Kick and {bass} squelch, **{bass} filter 25%, resonance 50%** \u2014 the 303 line closed, growling.",
    Build: "**{bass} filter to 40%.** The squelch appears. Hats in on bar 9.",
    Main: "**{bass} filter 40 \u2194 60% in 2-bar waves, resonance 60%** \u2014 the 303 move, your hand. Everything else stays out of its way.",
    Break: "Kick out. **{bass} resonance to 80%, filter 30%** \u2014 thin, whistling growl. The tension bar.",
    "Main 2": "Kick back on the downbeat. **{bass} filter 45 \u2194 65%, resonance 65%** \u2014 the full-fat groove.",
    "Build 2": "**{bass} filter climbing 65 \u2192 75%** \u2014 the growl becomes a bark.",
    Drop: "**{bass} filter 80%, resonance 75%** \u2014 the biggest squelch of the set. Sixteen bars, no mercy.",
    Outro: "**{bass} filter 80 \u2192 25%** in one fall \u2014 the line submerges. End when it's a pulse again."
  },
  trance: {
    Intro: "Kick, {bass} pumping root\u2013fifth. **{harm} filter 40%** \u2014 the arp glints in half-light.",
    Build: "**{harm} filter 40 \u2192 60%** in one smooth ramp with the riser. Commit.",
    Main: "Hold 60%. **{lead} theme enters** \u2014 the arp does the work, you keep the pocket. Micro-dips at phrase turnarounds.",
    Break: "Floor out. **{harm} filter to 45%, reverb send 60%** \u2014 the arp exposed, almost music-box.",
    "Main 2": "Back to 60%, {bass} pumping. **The ear knows the Drop is owed \u2014 don't spend it early.**",
    "Build 2": "**Delay send DOWN to 15%** \u2014 dry arp suddenly close and small, a held breath \u2014 while {harm} filter creeps to 70%.",
    Drop: "Everything at once: **{harm} filter 90%, resonance up, sends back to 40%.** Pure light. The thumbnail frame.",
    Outro: "**{harm} filter 90 \u2192 40%**, resonance home \u2014 the reactor cooling. Let the last delay repeats be the last thing alive."
  },
  lofi: {
    Intro: "Kick and sub, swung. **{harm} keys filter 40%** \u2014 dusty lid. Nod twice.",
    Build: "Keys enter behind the beat. **Touch nothing** \u2014 the velocities do the work.",
    Main: "**{harm} filter to 50%** as the section lifts. Behind the beat, always.",
    Break: "Kick out. **{harm} + reverb send 50%** \u2014 the keys ache in the space. Swing keeps it human.",
    "Main 2": "Kick back. **{harm} filter easing to 45%** \u2014 coming home, but the ear remembers the space.",
    "Build 2": "**{harm} filter 55%** \u2014 a last lean into the light.",
    Drop: "Lo-fi doesn't drop \u2014 **hold Main 2 and let the dust settle in the mix.**",
    Outro: "Last chords, **{harm} filter drifting to 35%.** End with the softest chord of the take."
  },
  synthwave: {
    Intro: "{bass} pulse and gated {drums}. **{harm} filter 40%** \u2014 the neon flickers on.",
    Build: "**{harm} chords enter, filter 50%**, staccato blocks. Snare on bar 9.",
    Main: "**{lead} theme, filter 60%** \u2014 sing it. {harm} blocks tight; the space between stabs is the groove.",
    Break: "Kick out. **{harm} one long held chord, reverb send 60%** \u2014 let it decay completely.",
    "Main 2": "Blocks return. **{harm} filter 50 \u2192 65%** \u2014 the chorus lift; all voices bloom together.",
    "Build 2": "Snare rolls; **{lead} filter climbing** \u2014 the sunset is owed.",
    Drop: "**Filters open, gated reverb up** \u2014 the widescreen moment. Hold it.",
    Outro: "Staccato echoes thinning, then **a single held final chord, {harm} filter easing to 40%.** One breath out."
  },
  breakbeat: {
    Intro: "Breaks and sub only. **{lead} filter 25%**, waiting.",
    Build: "**{lead} enters, filter 40%** \u2014 short phrases. Establish the speaker before the speech.",
    Main: "**{lead} filter 40 \u2194 60% every 4-bar phrase** \u2014 conversation with the breaks. Let the delay stack.",
    Break: "Half-time floor. **{lead} one long low note, filter 55%, reverb send 60%** \u2014 the creepiest 8 bars.",
    "Main 2": "Full breaks. **{lead} filter changes every 2 bars** \u2014 agitated now; short phrases, not paragraphs.",
    "Build 2": "**{lead} filter to 75%**, snare rolls in {drums} \u2014 the voice pushes forward.",
    Drop: "**{lead} filter 70%, delay send 50%** \u2014 full projection, phrases overlapping. Then out.",
    Outro: "One final phrase, then **{lead} filter slowly to 0%** while the delay repeats \u2014 the voice loses its language."
  }
};
var PROFILE_CUES = {
  dminiSeqAcid: {
    Intro: "Sequence alone. **Cutoff 2.5, Emphasis 6.5** \u2014 closed, growling, hypnotic. Nothing else. Let it repeat until it stops being repetition.",
    Build: "Kick and sub in. **Cutoff to 3.5** \u2014 the squelch appears under the floor. Two-bar waves, small.",
    Main: "Full floor. **Cutoff 4 \u2194 5.5 in 2-bar waves**, Contour 7 snapping. Everything else stays OUT of the sequence's way.",
    Break: "Floor gone, chords hold. **Cutoff 3, Emphasis 8** \u2014 the sequence thin and whistling over the chords. The tension bar.",
    "Main 2": "Floor back on the downbeat. **Cutoff 5, Emphasis 7** \u2014 the full-fat groove. Contour to 8 for accents.",
    "Build 2": "Stripped to arp + kick + sub. **Cutoff climbing 5 \u2192 6**, Emphasis 7.5 \u2014 the growl brightens into a bark.",
    Drop: "**Cutoff 6.5, Emphasis 8** \u2014 the biggest the sequence gets. Sixteen bars, no mercy, no second idea.",
    Outro: "Floor out, chords fade. **Cutoff 6.5 \u2192 2.5** in one unbroken fall \u2014 the sequence submerges. End when it's a pulse."
  },
  dminiSeqBrikha: {
    Intro: "Sequence alone. **Cutoff 3.5, Decay 3.5** \u2014 round, legato, already melodic. Let the room learn the pattern.",
    Build: "Kick and warm bass in. **Cutoff to 4** \u2014 a little light on the sequence. Hats on bar 9.",
    Main: "The soul section: chords and the melodic answer arrive. **Cutoff 4 \u2192 5 over 32 bars**, one long arc \u2014 the sequence blooms under the melody.",
    Break: "Floor gone, chords only. **Decay (25) to 5** \u2014 the steps ring into each other, the sequence turns to a chord. Cutoff 4.",
    "Main 2": "Everything back, one notch bigger. **Cutoff 5 \u2192 5.5, Decay back to 3.5** \u2014 the machine returns, warmer.",
    "Build 2": "Stripped to arp + kick + bass. **Detune (11) to 5.6** \u2014 the beat quickens; anticipation without density.",
    Drop: "**Cutoff 6, Detune back to 5.3** \u2014 the fullest, cleanest statement of the sequence, melody singing above it. The payoff is clarity.",
    Outro: "Floor out, chords fade. **Cutoff 6 \u2192 3.5, Decay to 5** \u2014 the sequence softens into a memory of itself."
  },
  // ---- CZ-1 MINI × HOOKS (v0.75): every cue is a CZ-1 MINI move; the hook itself stays untouched.
  cz1TineHook: {
    Intro: "Drums and bass only \u2014 the CZ is silent. **Filter Cutoff (CC89) preset to 72**, Chorus on, hands off. Let the room want the hook before it hears it.",
    Groove: "Arp and OB-X pads in. Still no CZ. **Nothing to touch** \u2014 this scene exists so the Breakdown lands.",
    Breakdown: "Floor out. **The tine hook, alone, over the pad.** Cutoff (CC89) 45 \u2014 darker, closer. Play it exactly as written; recognisability is the whole point.",
    Lift: "Arp back under the hook. **Cutoff (CC89) 45 \u2192 72 across the scene** \u2014 the tine brightens as the room fills. Same notes.",
    Drop: "Everything. **Cutoff 72, Chorus Amount (CC92) to 30** \u2014 the hook at full width over OB-X pads. Do not vary the hook; vary nothing but the width.",
    "Groove 2": "One notch down. **Chorus Amount back to 20.** The hook keeps repeating; the audience is singing it now.",
    Outro: "Arp, bass, drums thin out. **Cutoff (CC89) 72 \u2192 40** on the last hook statement \u2014 the tine sinks into the dark it came from."
  },
  cz1BellHook: {
    Intro: "Drums and rolling sub. CZ silent. **Detune Fine (CC12) preset to 12**, H90 hall ready. Anticipation.",
    Groove: "Arp pluck and sidechained stabs in. **Still no bell.** Filter the arp dark so the top of the mix is empty \u2014 that space is the bell's.",
    Breakdown: "Floor out. **The bell hook, alone, Detune Fine (CC12) 12 \u2192 4** \u2014 the shimmer collapses to a pure ring. Exposed, simple, sung.",
    Lift: "Arp returns under it. **Detune Fine 4 \u2192 12 over the scene** \u2014 the bell widens back to shimmer as the energy climbs.",
    Drop: "Everything, 132, full. **Detune Fine 12, Cutoff (CC89) 85** \u2014 the bell at its widest and brightest, hook unchanged, hall wide open.",
    "Groove 2": "Same hook, one layer thinner. **Cutoff (CC89) to 78** \u2014 a shade softer so the second Drop can be brighter.",
    Outro: "Floor out, sub and arp fade. **Last hook statement into a long hall tail** \u2014 let the ring finish itself. No fade on the CZ."
  },
  cz1BrassStab: {
    Intro: "Stabs alone sketch the rhythm. **DCW1 RA stage 1 (CC73) 25 \u2014 swell stabs**, soft-edged. The rhythm is the hook: establish it, don't decorate it.",
    Build: "Bass in. **CC73 to 40** \u2014 stabs sharpen. Same rhythm, same notes.",
    Main: "Topline arrives over the stabs. **CC73 70 \u2014 hard 80s hits.** The stabs now punch; the lead sings above them.",
    Break: "Lead over the stabs, **CC73 25** \u2014 swell again, breathing. The rhythm you've been hearing is now the only harmony.",
    "Main 2": "**CC73 70.** Everything back. If you change anything, change ONLY the stab attack \u2014 never the pattern.",
    Outro: "Stabs alone, **CC73 25**, fading. End on one swell stab held past the last bar."
  },
  cz1ReedTopline: {
    Intro: "Chords alone. CZ silent. **Vibrato Depth (CC6) preset to 20, Delay (CC7) 35** \u2014 the reed is set to sound played, not programmed.",
    Build: "Bass and chords settle the floor. **Reed enters on the last 4 bars** \u2014 one question phrase, Depth 20, restrained.",
    Main: "Call and response: reed asks, bell counter-melody answers. **Vibrato Depth (CC6) 20 on phrases, 35 on the held hook notes** \u2014 expression lives in the wobble.",
    Break: "Floor out. **Reed alone over the chords, Depth 35, longer notes** \u2014 the hook stated slow, like a singer taking the bridge.",
    "Main 2": "Everything. **Depth back to 20 \u2014 cleaner, the hook stated plainly** so it's whistleable. Let the bell answer breathe.",
    Outro: "Chords fade. **One final held reed note, Depth 40, Delay 35** \u2014 the vibrato arrives late and carries it out."
  },
  dminiEmphasis: {
    Intro: "**Emphasis 6, Cutoff 3.** The whistle is barely there \u2014 a hint of feedback under the 303.",
    Build: "**Emphasis to 7.5.** The filter starts to sing its own note. Play SHORT \u2014 let the ring finish each phrase.",
    Main: "**Emphasis 8**, and now Cutoff IS pitch: **sweep 2.5 \u2194 4** to play the whistle as a second melody over the sequence.",
    Break: "**Emphasis 9 \u2014 self-oscillation.** Floor drops; you're playing a pure sine with the Cutoff knob. Slow, deliberate, alone.",
    "Main 2": "Back to **Emphasis 8**; trade fours with the 303 \u2014 it squelches, you whistle back.",
    "Build 2": "**Emphasis 8.5, Cutoff creeping up** \u2014 the ring tightens toward a scream.",
    Drop: "**Emphasis 9, Cutoff 5** \u2014 full scream over the full floor. Eight bars max, then pull back \u2014 nobody survives more.",
    Outro: "**Emphasis falling 9 \u2192 6** as Cutoff closes \u2014 the whistle dies into the sequence, then the sequence dies."
  },
  dminiAcidBass: {
    Intro: "**Cutoff 2, Emphasis 6.5.** The D MINI IS the acid line \u2014 closed, growling under the kick. Feel it, don't hear it.",
    Build: "**Cutoff to 3.5.** The squelch appears \u2014 Contour 7 doing what a 303's env mod does. Nothing else moves.",
    Main: "**Cutoff 4\u20135**, working the knob in 2-bar waves. This IS the 303 move on a Moog filter \u2014 rounder, meaner, more low end.",
    Break: "**Cutoff to 2.5, Emphasis 8** \u2014 thin, hollow, whistling growl with the floor gone. The tension bar.",
    "Main 2": "**Cutoff 5, Emphasis 7** \u2014 the full-fat groove. Contour to 8 for the accents.",
    "Build 2": "**Cutoff climbing 5 \u2192 6**, Emphasis 7.5 \u2014 the growl brightens into a bark.",
    Drop: "**Cutoff 6, Emphasis 8** \u2014 the biggest acid bass a ladder filter makes. Sixteen bars, no mercy.",
    Outro: "**Cutoff 6 \u2192 2** in one fall \u2014 the line submerges. End when it's a pulse again."
  },
  dminiFilterMod: {
    Intro: "**Filter Mod ON, LFO Rate 3, Mod Depth 3** \u2014 a shallow, slow wobble on a held note. Under the radar.",
    Build: "**Mod Depth to 5.** The wobble is now audible as rhythm \u2014 a second sequencer inside the sound.",
    Main: "**LFO Rate to 1/8-ish (4).** Locked-feeling wobble against the 303. Ride Cutoff 3.5 \u2194 5 to move the wobble's centre.",
    Break: "**LFO Rate down to 1 \u2014 slow sweep**, Mod Depth 8. The wobble becomes a tide. Floor gone; let it wash.",
    "Main 2": "**LFO Rate back to 4, Depth 6.** Familiar wobble; now push **Emphasis to 6.5** \u2014 the LFO sweeps a sharper peak.",
    "Build 2": "**LFO Rate to 6 (1/16-ish)** \u2014 the wobble doubles; tension by density.",
    Drop: "**LFO Rate 8 \u2014 free-run**, Depth 8, Emphasis 7 \u2014 the ladder filter as a ring modulator. The chaos payoff.",
    Outro: "**Depth to 0** over 8 bars \u2014 the wobble slows into stillness; a plain held note, then nothing."
  },
  dminiBass: {
    Intro: "**Cutoff to 2.5** before launch \u2014 the bass enters as pure weight. Check the three VCOs are in tune while it's dark.",
    Build: "Ease **Cutoff to 3.5** (home) across the first 8 bars. Hands off Contour \u2014 save it.",
    Main: "Home groove. Every 8th bar push **Contour to 7\u20138 for two beats** and let go \u2014 that snap is your accent.",
    Break: "Pull **Cutoff to 2**; the keys own the room. Last 4 bars: one slow rise toward 4.",
    "Main 2": "The payoff: **Cutoff 4\u20135, Contour parked at 7.** Biggest the bass gets. If it distorts, that's correct.",
    "Build 2": "Cutoff climbing **4.5 \u2192 5.5** \u2014 the floor tightens before it drops.",
    Drop: "**Cutoff 5, Contour 8** \u2014 the heaviest four bars of the set, then hold.",
    Outro: "Ride **Cutoff down to closed** over all 8 bars. Contour Decay OFF: the last note stops dead. End ON the stop."
  },
  dminiLead: {
    Intro: "Lead rests \u2014 **tuning ritual**: check the three VCOs against the sub while nobody hears.",
    Build: "First fragments \u2014 play them **plain, zero vibrato**. Restraint now makes the Break land.",
    Main: "Full theme. **Mod-wheel vibrato only on phrase-ending notes** \u2014 a singer, not a siren. Cutoff home at 6.",
    Break: "The star moment: **open Cutoff to 7**, long tones, full vibrato \u2014 let each ring on the ON decay.",
    "Main 2": "Theme returns. **Nudge Detune to 6.5** \u2014 the stack widens, the return feels bigger without playing louder.",
    "Build 2": "Drop the left hand an octave; **Cutoff 6.5** \u2014 the lead thickens before the payoff.",
    Drop: "**Cutoff 7, Detune 6.5**, full vibrato \u2014 the vocal solo of the set.",
    Outro: "One final phrase, hands off. The tail outlives the last drum hit \u2014 **the ring is the ending.** Detune back to 6."
  },
  dminiFilter: {
    Intro: "**Cutoff 2.** The sequence is a shadow \u2014 rhythm without pitch. Sit on your hands.",
    Build: "One continuous creep, **2 \u2192 3**, spread across all 16 bars. If anyone sees you move, you moved too fast.",
    Main: "**3 \u2192 4.5** over 32 bars. Micro-oscillate \xB10.2 with the phrase \u2014 but always trending open.",
    Break: "Fall back to **3** and raise **Emphasis to 6\u20137** \u2014 the resonant peak becomes the melody. The ONLY Emphasis move.",
    "Main 2": "Emphasis back to **5**, then climb **3 \u2192 5.5**. Familiar ground, higher altitude.",
    "Build 2": "**5.5 \u2192 6.5.** Faster now \u2014 a point and a half in 16 bars feels urgent. The filter starts to shout.",
    Drop: "**7 \u2014 wide open** and HOLD. Every harmonic fully lit for a full minute. The payoff is simply: all of it.",
    Outro: "One unbroken fall, **7 \u2192 2**, all 8 bars. End where you began: rhythm without pitch, then silence."
  },
  dminiGlide: {
    Intro: "**Glide 0.** Stepped, dry, mechanical \u2014 establish 'normal' so its dissolution means something.",
    Build: "**Glide to 1.5.** Only the large intervals smear; small steps still snap.",
    Main: "**Glide 3.** Everything slides. Add vowels \u2014 tiny **Cutoff wiggles (4 \u2194 5)** in time with the 303's filter.",
    Break: "**Glide 5.** Fully smeared \u2014 pitch becomes trajectory. Play WIDE intervals; the journey is the note.",
    "Main 2": "Ease to **Glide 4** so the theme is recognisable again; keep Emphasis 6 singing.",
    "Build 2": "**Glide 5, Cutoff creeping to 5.5** \u2014 the lines lean into each other.",
    Drop: "**Glide 5.5, Emphasis 6.5** \u2014 the whole line is one continuous bend.",
    Outro: "**Glide 6** on the final phrase \u2014 the last note sets off and the song ends before it arrives. End mid-slide."
  },
  dminiRing: {
    Intro: "Silence from the hardware. Set **Detune 5**; one test hit off-mic \u2014 find tonight's bell.",
    Build: "One stab every 2 bars on the AND of 3. **Duck Cutoff to 3 between hits** so every stab arrives out of darkness.",
    Main: "Call & response with the dub chord. Sweep **Detune 4 \u2192 6 over 8 bars**, then back \u2014 bell \u2192 gong \u2192 bell.",
    Break: "The extremes: **Detune 2, then 8** \u2014 broken glass, sheet metal. A sound-design solo; the ugly positions are the point.",
    "Main 2": "Settle at **Detune 5.5** and go SPARSER than Main. After the Break's chaos, restraint reads as mastery.",
    "Build 2": "Stabs every bar now, **Cutoff rising to 6** \u2014 the metal brightens.",
    Drop: "**Detune 6, Cutoff 6.5** \u2014 stabs on every downbeat into maximum Qi feedback.",
    Outro: "One final stab on bar 1, then **turn Detune in slow motion toward 5** while the Qi rings it out. Fade the pedal, not the synth."
  },
  dminiDrone: {
    Intro: "Hold the root. Attack at 6 \u2014 the drone **takes ~5 s to exist**; let the fade-in be the downbeat. Then nothing.",
    Build: "One full breath: **Cutoff 2.5 \u2192 4 \u2192 2.5** across the whole scene. Watch the pad, not the knob.",
    Main: "Move to the **fifth** for this scene (release the root fully first \u2014 the ON decay carries the crossfade). Slow Cutoff breaths.",
    Break: "Back on the root. **Nudge Detune to 5.5** \u2014 the beating quickens; agitated water. Loudest thing in the piece.",
    "Main 2": "**Detune back to 5.2** in slow motion (30 s of travel). Alternate root and fifth every 16 bars.",
    "Build 2": "Cutoff breath **2.5 \u2192 4.5** \u2014 the one time the drone leans forward.",
    Drop: "**Cutoff 4.5, Detune 5.4** \u2014 the fullest the drone ever gets. Still nothing sudden.",
    Outro: "Release on bar 1 and touch nothing. Contour Decay ON: **the tail IS the outro** \u2014 the song ends when the drone decides."
  },
  dminiPoly: {
    Intro: "Sub and drums only. Rest hands on the keys and **count** \u2014 the pocket starts soon.",
    Build: "**Two-note dyads**, staccato. Withholding the third voice now makes the Main an arrival.",
    Main: "Full **three-voice triads**. All three pitches share one bloom. Tight releases \u2014 the silence between stabs is the groove.",
    Break: "Hold **ONE chord** and let it decay completely \u2014 8 bars, one gesture. Three voices dying as one.",
    "Main 2": "Blocks return. **Open Cutoff 5 \u2192 6.5** \u2014 in POLY the filter opens on ALL voices at once; that collective bloom is the lift.",
    "Build 2": "Dyads again, faster, **Decay to 6** \u2014 tension through thinning, not adding.",
    Drop: "**Cutoff 7, full triads on every hit** \u2014 the shared envelope at maximum.",
    Outro: "Staccato echoes thin to dyads, then a **single held final chord** with Cutoff easing to 4. Three voices, one breath out."
  },
  proteinSweep: {
    Intro: "Pad enters at **Wave 20%** \u2014 soft glass. Let Env 3's bloom be the only motion.",
    Build: "Creep **Wave 20 \u2192 35%** across the section. If you can hear yourself sweeping, slow down.",
    Main: "Hold around **40%**; the envelope's per-note sweep does the work. Small \xB15% strokes with the phrases.",
    Break: "Fall back to **20%** \u2014 still water while the floor drops out.",
    "Main 2": "The one great journey: **20 \u2192 80% across the full scene**, THROUGH the resonant ridge. This is the climax.",
    "Build 2": "Hold **80%** \u2014 the strange thin frames at the table's end.",
    Drop: "**Wave 90%** and Cutoff up \u2014 the table fully lit.",
    Outro: "Stay past the ridge; let the last chord release through Env 3. **End in the weird part of the table.**"
  },
  proteinBass: {
    Intro: "**Cutoff 30%.** Bass and kick find each other \u2014 adjust nothing until you feel it lock.",
    Build: "Ease to **35%** as the chords arrive. The aliasing halo is now audible \u2014 that's the Microwave saying hello.",
    Main: "Home. **Micro-moves only (\xB13%)**, riding the 8-bar phrases like a fader you're pretending not to touch.",
    Break: "Pull **Cutoff Track to ~20%** \u2014 high bass notes go woolly and distant. Restore before the section ends.",
    "Main 2": "The fullest it gets: **Cutoff 45%**. In deep house the climax is a warm room, not a drop.",
    "Build 2": "**Cutoff 40%**, Dirt nudged to 15% \u2014 a little more hair on the low end.",
    Drop: "**Cutoff 45%, Dirt 15%** \u2014 the room at its warmest.",
    Outro: "Back to **30%** over 8 bars \u2014 the track leaves the way it arrived, still grooving."
  },
  proteinSpeech: {
    Intro: "Park **Wave at your darkest vowel (~25%)** and wait \u2014 the voice should arrive like someone entering the room.",
    Build: "First short phrases, one vowel. **Don't move the knob yet** \u2014 establish the speaker before the speech.",
    Main: "Conversation: **new Wave position every 4-bar phrase** \u2014 25 / 45 / 60 / back. Let the delay stack syllables into almost-words.",
    Break: "Half-time floor. Park on an **open vowel (~55%)** and hold one long low note \u2014 the LFO makes it moan.",
    "Main 2": "Faster diction: **vowel change every 2 bars**. Agitated now \u2014 short phrases; panic, not paragraphs.",
    "Build 2": "Vowels every bar, **Cutoff up to 75%** \u2014 the voice pushes forward.",
    Drop: "**Wave 60\u201370%, delay Amount 50%** \u2014 the voice at full projection, syllables overlapping.",
    Outro: "One final phrase, then sweep **Wave slowly to 0%** while the delay repeats \u2014 the voice loses its language. End on the machine."
  },
  proteinRobin: {
    Intro: "Kit and bass. **Solo-check all four layers** once more \u2014 the rotation only works if the weights agree.",
    Build: "Stabs begin. Listen for the cycle \u2014 mallet, formant, glass, brass \u2014 and **count its period against the 4-bar phrase**.",
    Main: "The lead answers the rotation. Your discipline: **touch nothing.** Folded hands next to a synth that keeps changing colour IS the show.",
    Break: "Rotation fully audible for the first time. If you must move, **reverb Amount to 45%** \u2014 four timbres in one room.",
    "Main 2": "The sanctioned move: **each layer's Cutoff up ~10%**, as a set. The whole rotation brightens together.",
    "Build 2": "Reverb back to 30%; stabs faster \u2014 **the rotation cycles quicker on its own.**",
    Drop: "Hands off. **Every stab a different face**, brightened \u2014 let the round robin run the payoff.",
    Outro: "Stabs thin. The last four chords land on four different faces \u2014 **let whichever falls on the final chord be the ending.**"
  },
  proteinFlavor: {
    Intro: "**Flavor 0%.** Digitally perfect \u2014 sterile on purpose. Let them trust the machine before you break it.",
    Build: "**Flavor 10%.** Something is very slightly wrong and no one can say what. Play the same chord twice; hear the voices disagree.",
    Main: "**Flavor 25%.** The wobble is character now \u2014 tape-like, warm. Long root/fifth holds; nothing else.",
    Break: "**Flavor 40%.** With floor gone, the aging IS the content. This is the portrait shot.",
    "Main 2": "**Flavor 55%, then 65%** halfway through. Old now \u2014 lovely and unreliable. Hold chords longer than feels safe.",
    "Build 2": "**Flavor 70%** \u2014 the pitch breathes visibly.",
    Drop: "**Flavor 75%** \u2014 as old as it gets. Let the instability finish the chords for you.",
    Outro: "Final chord, release \u2014 and as the tail fades, **reload the saved pristine slot**. One young clean chord. End on the memory."
  },
  proteinDirt: {
    Intro: "Kit and sub. **Dirt at 10%**, waiting.",
    Build: "Keys enter behind the beat. Generated velocities do the work \u2014 **listen for louder chords opening the table.** Touch nothing.",
    Main: "**Dirt to 25%** as the section lifts \u2014 the rust steps forward, pitched a fifth up.",
    Break: "Re-voice the rust: **retune Osc 2 to +3** \u2014 the fifth turns sour. **Dirt to 40%**, its one visit to the ceiling.",
    "Main 2": "**Osc 2 back to +7, Dirt easing to 20%** \u2014 coming home, but the ear remembers the sour version.",
    "Build 2": "**Dirt 30%** \u2014 a last lean into the grit.",
    Drop: "**Dirt 35%, Osc 2 +7** \u2014 the dust at its densest, still musical.",
    Outro: "Last chords, **Dirt drifting to 10%**. The dust settles \u2014 literally. End with the softest chord of the take."
  },
  proteinGlass: {
    Intro: "**Cutoff 55%.** The sequence glints in half-light \u2014 the accents already open the table.",
    Build: "To **Cutoff 70%** in one smooth ramp with the riser. Commit.",
    Main: "Hold 70%. The glass does the work; you keep the pocket. **Micro-dips (\u22125%) at phrase turnarounds.**",
    Break: "Floor out, glass exposed. **Cutoff to 60%** \u2014 closer, almost music-box.",
    "Main 2": "Back to **70%**. The ear knows the Drop is owed. Don't spend it early.",
    "Build 2": "The trick: **delay Amount to 15%** \u2014 dry glass suddenly close and small \u2014 while Cutoff creeps to 75%.",
    Drop: "Everything at once: **Cutoff 85%, Resonance 45%, delay back to 40%.** Pure light. The thumbnail frame.",
    Outro: "Resonance home to 25%, **Cutoff falling 85 \u2192 55%** \u2014 the reactor cooling. Let the last repeats be the last thing alive."
  }
};
var PROFILE_PERFORMANCE = {
  proteinSweep: "**The Wave knob is the pad.** Set Env 3 to carry the slow sweep on every note, then override it by hand at section changes \u2014 pull position back to 20% entering Breaks, push toward 80% into the Drop. The table's resonant ridge around the middle is your sweet spot; linger there.",
  proteinBass: "**Huckaby discipline: Cutoff and nothing else.** The 8-bit aliasing does the harmonic work in octaves 1\u20132 \u2014 resist the urge to add. Ride Cutoff 30\u201345% with the sections; in the Break, pull Cutoff Track down so high notes go woolly. Save the patch to a slot before the jam \u2014 the Protein remembers, use it.",
  proteinSpeech: "**Make it talk.** Vowels live between 20% and 70% of the wave position \u2014 move the knob BETWEEN phrases, not during, so each phrase speaks a different syllable. LFO 1 keeps a slow undercurrent; your hand does the diction. In the Break, park at an open-vowel spot and let it moan over the half-time floor.",
  proteinRobin: "**Hands off \u2014 that's the study.** Four layers rotate under a static part; your discipline is NOT touching it while the round robin shimmers. Your one move: in Main 2, nudge each layer's Cutoff up ~10% (they're matched, so the rotation brightens as a set). If a layer sticks out, fix its level, not its tone.",
  proteinFlavor: "**Flavor is the clock.** Start at 0% \u2014 pristine, digital, still. Add roughly 10% per section, never during a phrase. By the Outro (~70%) the pad wobbles like a 40-year-old machine, and THAT decay is the piece. The de-calibrated filters mean every chord voices slightly differently: play the same chord twice and listen for the difference.",
  proteinDirt: "**Dirt is seasoning, played in ranges.** 10% verses, 25\u201340% when the section lifts \u2014 past 50% it stops being dust and becomes distortion, which is a different song. Osc 2's tuning sets WHICH rust you hear: +7 is churchy, +3 is sour, unison is tremolo. Retune between sections, land back on +7 to come home.",
  proteinGlass: "**Velocity already plays the glitter \u2014 you play the frame.** Cutoff follows the energy arc (55% Intro \u2192 70% Mains \u2192 85% Drop); push Resonance to 45% ONLY at the Drop, where the sequence turns to pure light. In Build 2, pull the delay Amount down so the dry glass sounds suddenly close \u2014 then let it bloom back for the payoff.",
  dminiSeqAcid: "**The sequence never leaves \u2014 you are the arrangement.** The D MINI runs the same acid line in all eight scenes; what changes is Cutoff (15) (2.5 closed \u2192 6.5 open across the song), Emphasis (16) (6.5 \u2192 8 at the Drop), and what the floor is doing around it. Never touch the notes. Never add a second idea. Cutoff is the composition.",
  dminiSeqBrikha: "**The sequence never leaves \u2014 and it's melodic.** Octave mode, low Emphasis, longer Decay: the D MINI's line is a tune, not a growl. Cutoff (15) moves in long arcs (a whole scene per move); Decay (25) is your second dial \u2014 longer turns the sequence into a chord, shorter back into a machine. The Drop is clarity, not size.",
  dminiEmphasis: "**Emphasis (16) is the melody.** Between 6 and 9 the ladder filter goes from a whistle under the sound to a pure sine on top of it \u2014 and once it self-oscillates, Cutoff plays PITCH. Keep the MIDI short and let the ring speak between notes; play the whistle against the 303's squelch, never with it.",
  dminiAcidBass: "**You are the acid line.** No 303 in this song \u2014 the D MINI's ladder filter does the squelch: Contour (17) is your env-mod, Cutoff (15) is the knob, Emphasis (16) sets the bite. Work Cutoff in 2-bar waves like a 303 player would, and save the Emphasis push for the Drop. Louder low end than any 303 \u2014 mind your monitors.",
  dminiFilterMod: "**LFO Rate is your instrument.** Filter Mod ON puts the LFO on the ladder; Mod Depth (28) is how much, LFO Rate is how fast. Near 1/8 it locks to the groove; near 1/16 it doubles; free-run turns the filter into a ring modulator. Move the rate BETWEEN phrases so each section has its own wobble.",
  dminiBass: "**The D MINI is your bass.** Set the panel per the track's knob list, then perform with two fingers: Cutoff (15) creeps from 3.5 toward 5 as sections build, and Contour (17) is your accent \u2014 push it for the Drop, pull it back for Breaks. Keep Emphasis low; the weight IS the show.",
  dminiLead: "**The D MINI is your lead voice.** Mod-wheel vibrato is the phrase-ending \u2014 none in the Intro, full singer's vibrato by the Break. Ride Cutoff (15) with the energy arc and drop your left hand an octave in Main 2: Unison detune does the rest.",
  dminiFilter: "**The song is one knob.** The sequence never changes \u2014 Cutoff (15) closed at 2 through the Intro, opening ~1 point per section to ~7 at the Peak, then closing again for the Fade. Emphasis (16) to 6\u20137 ONLY in the Strip, where the resonance becomes the melody. Do not touch anything else; that discipline is the piece.",
  dminiGlide: "**Glide is the melody.** Start with Glide near 0 \u2014 dry, stepped. Raise it a point per section: by the Peak, lines smear into each other and the pitch never fully arrives. Emphasis (16) at 6 keeps the filter vocal; small Cutoff moves read as vowels.",
  dminiRing: "**Detune (11) is your instrument.** In RING mode it retunes the whole inharmonic spectrum \u2014 sweep it slowly and the stabs morph from bell to gong to broken glass. Play sparse hits, let your Qi delay do the repeats, and duck Cutoff between phrases so every stab arrives out of darkness.",
  dminiDrone: "**Hold one note and live there.** The drone breathes through Cutoff (15) between 2 and 4 \u2014 a full section per sweep, never faster. Nudge Detune (11) \xB10.3 for the beating to speed and slow. Contour Decay (23) stays ON: when you finally release, the tail is the ending.",
  dminiPoly: "**Respect the shared envelope.** Three voices, one contour \u2014 legato re-triggers steal the envelope from held notes, so play staccato block chords and let Decay (25) make the space. Open Cutoff (15) for the chorus sections; in POLY mode the filter opens on ALL voices at once, and that bloom is the drama."
};
function buildSongStory(o) {
  const starter = o.starterId ? SONG_STARTERS.find((s) => s.id === o.starterId) : void 0;
  const preset = PROGRESSION_PRESETS.find((p) => p.id === o.progressionPreset);
  const traits = STYLES[o.style] ?? STYLES.melodicTechno;
  const isStatic = preset?.id === "static" || (preset?.label ?? "").toLowerCase().includes("static");
  const ideaBits = [];
  if (starter?.desc) ideaBits.push(starter.desc);
  const engine = o.parts.includes("bass") && traits.bass === "acid" ? "the 303 line is the engine \u2014 everything else is weather around it" : o.parts.includes("arp") ? "the sequence is the engine \u2014 the composition happens to it, not around it" : o.parts.includes("chords") || o.parts.includes("pad") ? "the chord and its decay are the engine \u2014 the space around it does the work" : "the groove itself is the engine";
  ideaBits.push(`In ${o.key} at ${o.bpm} BPM, ${engine}.`);
  ideaBits.push(isStatic ? "The harmony is static on purpose: one chord, so the ear stops tracking changes and starts hearing texture. That's the hypnosis." : `Harmony moves as ${preset?.label ?? "a genre-typical progression"} \u2014 enough motion to breathe, not enough to distract.`);
  if (o.clipBars && o.clipBars >= 16) {
    ideaBits.push(`Clips run ${o.clipBars} bars so the evolution happens *inside* the loop \u2014 by the final third the bass lifts an octave and the pad doubles up top. Long-form, not looped.`);
  }
  const named = o.tracks.filter((t) => t.patch && t.part !== "drums");
  const externals = o.tracks.filter((t) => (t.instrument || "").includes("MIDI out"));
  const soundBits = [];
  if (externals.length) soundBits.push("One voice is HARDWARE \u2014 the reason this song exists:");
  for (const t of externals) soundBits.push(`\xB7 **${t.track}** \u2014 ${(t.instrument || "").replace(/\s*\(MIDI out\)\s*$/, "")} (external hardware; MIDI out, no device loaded \u2014 panel settings on the card)`);
  const rest = externals.length ? "Every other part" : "Each part";
  if (o.moveMode) soundBits.push(`Everything ${externals.length ? "else " : ""}is Drift (Move's only voice), so the identity comes from patch design rather than instrument choice:`);
  else soundBits.push(`${rest} gets the instrument that suits it:`);
  for (const t of named) {
    soundBits.push(`\xB7 **${t.track}** \u2014 ${t.patchName}${o.moveMode ? "" : ` on ${t.instrument}`}`);
  }
  const drums = o.tracks.find((t) => t.part === "drums");
  if (drums) soundBits.push(`\xB7 **${drums.track}** \u2014 ${starter?.drumFeel ? `${starter.drumFeel} feel` : "kit per style"}`);
  const tpl = o.templateId ? SONG_TEMPLATES[o.templateId] : void 0;
  const cueMap = o.soundProfile && PROFILE_CUES[o.soundProfile] || null;
  const genreCues = GENRE_CUES[o.style] || null;
  const trackFor = (part) => o.tracks.find((t) => t.part === part)?.track ?? null;
  const nameOf = (parts, fallback) => {
    for (const p of parts) {
      const t = trackFor(p);
      if (t) return t;
    }
    return fallback;
  };
  const subs = {
    "{lead}": nameOf(["lead", "counterMelody", "piano"], "the lead"),
    "{bass}": nameOf(["bass"], "the bass"),
    "{harm}": nameOf(["chords", "pad", "arp", "piano"], "the harmony"),
    "{drums}": nameOf(["drums"], "the drums")
  };
  const fill = (txt) => txt.replace(/\{(lead|bass|harm|drums)\}/g, (m) => subs[m] ?? m);
  const sections = (tpl ?? []).map((s) => ({
    name: s.name,
    plays: scenePlays(s.parts, o.parts),
    bars: capBarsForMove(sectionBars(s.name, o.style), !!o.moveBars16),
    note: SECTION_NOTE[s.name] ?? "Carry the idea forward.",
    // the playing cue for THIS scene: hardware showcase score first, else the genre score
    cue: cueMap?.[s.name] ?? (genreCues?.[s.name] ? fill(genreCues[s.name]) : "")
  }));
  for (let i = 0; i < sections.length - 1; i++) {
    const plan = planTransition(sections[i].name, sections[i + 1].name, o.style);
    if (plan?.cue) sections[i].cue = (sections[i].cue ? sections[i].cue + " " : "") + plan.cue;
  }
  const totalBars = sections.reduce((a, b) => a + b.bars, 0);
  const mins = totalBars ? totalBars * 4 * 60 / o.bpm / 60 : 0;
  const arrangement = tpl ? `${sections.length} scenes, ${totalBars} bars \u2014 roughly ${mins.toFixed(1)} minutes at ${o.bpm} BPM. The arc is energy, not novelty: every section is the same idea seen from a different distance. Launch scenes in order, or jump Main \u2194 Break live.` : "Single scene \u2014 one clip per part. Build the arrangement by hand, or re-generate in Song mode for a full scene plan.";
  const perfBits = [];
  if (o.soundProfile && PROFILE_PERFORMANCE[o.soundProfile]) perfBits.push(PROFILE_PERFORMANCE[o.soundProfile]);
  const extT = o.tracks.find((t) => (t.instrument || "").includes("MIDI out"));
  if (extT) {
    const hw = (extT.instrument || "").replace(/\s*\(MIDI out\)\s*$/, "");
    perfBits.push(`**${extT.track}** carries NO Live instrument \u2014 route its MIDI Out to the ${hw} (channel 1) and monitor the hardware's audio. The panel settings are on the track's card above.`);
  }
  const bassT = o.tracks.find((t) => t.part === "bass");
  if (bassT && traits.bass === "acid") perfBits.push(`Ride the **filter cutoff and resonance on ${bassT.track}** \u2014 that's the performance. The 303 line doesn't change; your hand makes it sing.`);
  else if (bassT) perfBits.push(`Keep **${bassT.track}** steady \u2014 it's the floor, not the show.`);
  const padT = o.tracks.find((t) => t.part === "pad" || t.part === "chords");
  if (padT) perfBits.push(`Use the **Delay/Reverb sends on ${padT.track}** as an instrument \u2014 feedback up in the Break, back down before Main 2.`);
  const arpT = o.tracks.find((t) => t.part === "arp");
  if (arpT) perfBits.push(`**${arpT.track}** is your tension dial: filter it down in Intro, wide open by Drop.`);
  perfBits.push("Judge it by ear on the hardware, not by the numbers here \u2014 if a section feels long, it is.");
  return {
    idea: ideaBits.join(" "),
    style: STYLE_STORY[o.style] ?? STYLE_STORY.melodicTechno,
    sound: soundBits.join("\n"),
    arrangement,
    performance: perfBits.join(" "),
    sections
  };
}
function buildSongSheet(o) {
  const traits = STYLES[o.style] ?? STYLES.melodicTechno;
  const hint = STYLE_HINTS[o.style];
  const bpm = o.suggestedBpm ?? (hint ? Math.round((hint.bpm[0] + hint.bpm[1]) / 2) : 122);
  const preset = PROGRESSION_PRESETS.find((p) => p.id === o.progressionPreset);
  const tplNames = {
    short: "Short (4 sections)",
    standard: "Standard (6 sections)",
    long: "Long (8 sections)",
    berlin: "Berlin School (additive, 8 sections)",
    anthem: "Anthem (breakdown-led, 7 sections)",
    sequence: "Sequence (star in all 8 scenes)"
  };
  const guide = SOUND_GUIDE[o.style] ?? {};
  const activeParts = [...ALL_PARTS, "piano"].filter((p) => o.parts.includes(p));
  const moveSlotSource = {};
  if (o.moveMode) {
    const slotMap = resolveMoveTracks(activeParts);
    for (const slot of MOVE_SLOTS) if (slotMap[slot]) moveSlotSource[slot] = slotMap[slot];
  }
  const rows = [];
  if (o.moveMode) {
    for (const slot of MOVE_SLOTS) {
      const part = moveSlotSource[slot];
      if (!part) continue;
      const recipe = moveRecipe(part, o.soundProfile);
      rows.push({
        part,
        track: `Move \xB7 ${MOVE_SLOT_LABELS[slot]}`,
        instrument: recipe.instrument,
        patch: recipe.patch,
        patchName: patchDisplayName(recipe.patch),
        rack: rackFileName(recipe.patch),
        sound: `${recipe.instrument} \u2014 ${guide[part] ?? GUIDE_DEFAULT[part]}`,
        macros: recipe.macros
      });
    }
  } else {
    for (const p of activeParts) {
      const recipe = deviceRecipe(o.style, p, o.soundProfile);
      rows.push({
        part: p,
        track: `Forge \xB7 ${PART_LABELS[p]}`,
        instrument: recipe.instrument,
        patch: recipe.patch,
        patchName: patchDisplayName(recipe.patch),
        rack: rackFileName(recipe.patch),
        sound: guide[p] ?? GUIDE_DEFAULT[p],
        macros: recipe.macros
      });
    }
  }
  return {
    name: songName(o.seed),
    styleId: o.style,
    styleLabel: traits.label,
    key: `${NOTE_NAMES[(o.root % 12 + 12) % 12]} ${o.scale}`,
    suggestedBpm: bpm,
    template: o.templateId ? tplNames[o.templateId] ?? o.templateId : "Clip generate (one scene)",
    sectionPlan: o.templateId && SONG_TEMPLATES[o.templateId] ? SONG_TEMPLATES[o.templateId].map((s) => `${s.name} ${capBarsForMove(sectionBars(s.name, o.style), !!o.moveBars16)}`).join(" \xB7 ") : void 0,
    progression: preset && preset.id !== "auto" ? `${preset.label} \u2014 ${preset.mood}` : "Genre pool (auto)",
    seed: o.seed,
    createdAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " "),
    moveMode: !!o.moveMode,
    soundProfile: o.soundProfile,
    clipBars: o.clipBars && o.clipBars >= 16 ? o.clipBars : void 0,
    starterId: o.starterId,
    tracks: rows,
    story: buildSongStory({
      seed: o.seed,
      style: o.style,
      key: `${NOTE_NAMES[(o.root % 12 + 12) % 12]} ${o.scale}`,
      bpm,
      templateId: o.templateId,
      progressionPreset: o.progressionPreset,
      parts: activeParts,
      moveMode: o.moveMode,
      moveBars16: !!o.moveBars16,
      soundProfile: o.soundProfile,
      clipBars: o.clipBars,
      starterId: o.starterId,
      tracks: rows
    })
  };
}
var DEVICE_DEFAULT = {
  lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["Filter Freq: open slowly", "Resonance: mid", "Delay: 1/8 dotted", "Reverb: long tail"], patch: "pwmLead" },
  bass: { instrument: "Drift", effects: ["Saturator"], macros: ["Filter Freq: low\u2013mid", "Amp Decay: tight", "Saturator Drive: +", "Sub: mono"], patch: "subBass" },
  pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["Attack: slow", "Release: long", "Chorus: wide", "Reverb: cathedral"], patch: "warmPad" },
  chords: { instrument: "Analog", effects: ["Chorus-Ensemble", "Reverb"], macros: ["Amp Decay: short (stab)", "Filter Freq: mid", "Chorus: light", "sidechain to kick"], patch: "stab" },
  counterMelody: { instrument: "Operator", effects: ["Delay"], macros: ["low velocity", "Delay: 1/4", "sit behind the lead"], patch: "keys" },
  arp: { instrument: "Drift", effects: ["Delay"], macros: ["Amp Decay: pluck", "Filter Freq: rides across sections", "Delay: 30% wet"], patch: "seqPluck" },
  piano: { instrument: "Drift", effects: ["Reverb"], macros: ["felt EP \u2014 soft hammers", "Reverb: room, close", "wide velocity: PLAY it"], patch: "feltEP" },
  drums: { instrument: "Drum Rack", effects: ["Compressor"], macros: ["Compressor: bus glue", "kick: long tail", "hats: tight"] }
};
var DEVICE_OVERRIDES = {
  melodicTechno: {
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["Filter Freq: opens across the arc", "Resonance: mid-high", "Delay: 1/8 dotted", "Reverb: big hall (Tale Of Us)"], patch: "moogLead" },
    chords: { instrument: "Analog", effects: ["Compressor", "Reverb"], macros: ["Amp Decay: pluck", "sidechain to kick", "Reverb: lush"], patch: "stab" },
    drums: { instrument: "Drum Rack", effects: ["Compressor", "Saturator"], macros: ["Compressor: pump", "Saturator Drive: warm", "kick: long rumble"] }
  },
  dubTechno: {
    chords: { instrument: "Analog", effects: ["Delay", "Reverb"], macros: ["THE dub chord", "Delay: long feedback", "Reverb: 100% send", "Filter Freq: down"], patch: "wash" },
    pad: { instrument: "Wavetable", effects: ["Auto Filter", "Reverb"], macros: ["Auto Filter: HP ~200 Hz", "Reverb: huge", "wash it out"], patch: "warmPad" },
    drums: { instrument: "Drum Rack", effects: ["Auto Filter", "Compressor"], macros: ["Auto Filter: gentle LP", "Compressor: glue", "dusty 909"] }
  },
  detroit: {
    counterMelody: { instrument: "Collision", effects: ["Delay", "Reverb"], macros: ["wooden mallet (Marimba resonator)", "Delay: 1/8", "Reverb: wide"], patch: "collisionMallet" },
    lead: { instrument: "Operator", effects: ["Chorus-Ensemble", "Delay"], macros: ["FM bell tone", "Chorus: ensemble", "vibrato: subtle", "Delay: 1/8"], patch: "bell" },
    chords: { instrument: "Analog", effects: ["Phaser-Flanger"], macros: ["7th-chord stabs", "Phaser: slow", "swing"], patch: "stab" }
  },
  ambient: {
    counterMelody: { instrument: "Tension", effects: ["Reverb", "Delay"], macros: ["bowed string (Bow exciter)", "Reverb: infinite", "Delay: dotted"], patch: "tensionBow" },
    lead: { instrument: "Wavetable", effects: ["Reverb", "Delay"], macros: ["Attack: slow", "Release: very long", "Reverb: shimmer", "glide on"], patch: "warmPad" },
    pad: { instrument: "Wavetable", effects: ["Reverb", "Delay"], macros: ["Attack: 4s", "wavetable position: slow LFO", "Reverb: cathedral 100%"], patch: "warmPad" },
    chords: { instrument: "Analog", effects: ["Reverb"], macros: ["add9 wash", "Attack: slow", "Reverb: infinite"], patch: "wash" }
  },
  classicSeq: {
    arp: { instrument: "Drift", effects: ["Auto Filter", "Delay"], macros: ["THE sequence", "Auto Filter: ride cutoff whole song", "Resonance: +", "Delay: 1/16"], patch: "seqPluck" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["PWM lead (Tangerine Dream)", "Portamento: on", "Delay: sync"], patch: "pwmLead" }
  },
  acid: {
    bass: { instrument: "Drift", effects: ["Overdrive", "Auto Filter"], macros: ["Filter Cutoff: low\u2013mid", "Resonance: high", "Env Amount: high", "Overdrive Drive: +", "Filter Env: sweep on accents"], patch: "acid303" },
    arp: { instrument: "Drift", effects: ["Auto Filter", "Delay"], macros: ["Resonance: high", "Auto Filter: env-mod", "clicky 16ths"], patch: "acid303" },
    drums: { instrument: "Drum Rack", effects: ["Overdrive", "Compressor"], macros: ["Overdrive: crunch the hats", "Compressor: hard", "909 kit"] }
  },
  trance: {
    lead: { instrument: "Drift", effects: ["Reverb", "Delay"], macros: ["supersaw: detune wide", "sidechain", "Reverb: big", "Delay: throw"], patch: "superLead" },
    pad: { instrument: "Wavetable", effects: ["Reverb"], macros: ["Attack: slow", "uplifting (OB-Xa bloom)", "Reverb: huge"], patch: "obPad" }
  },
  lofi: {
    counterMelody: { instrument: "Electric", effects: ["Chorus-Ensemble", "Delay"], macros: ["Rhodes EP (warm tines)", "Chorus: warm", "Delay: 1/4"], patch: "electricRhodes" },
    chords: { instrument: "Analog", effects: ["Saturator", "Auto Filter"], macros: ["jazzy 7/9 keys", "Saturator: tape", "Auto Filter: LP roll-off", "wow/flutter"], patch: "keys" },
    drums: { instrument: "Drum Rack", effects: ["Auto Filter", "Saturator"], macros: ["Auto Filter: LP (dusty)", "Saturator: tape", "swing", "vinyl feel"] }
  },
  synthwave: {
    lead: { instrument: "Drift", effects: ["Reverb", "Delay"], macros: ["brassy PWM", "gated reverb", "glide", "Delay: sync"], patch: "pwmLead" },
    pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["80s poly (Juno-106)", "Chorus: wide ensemble", "Reverb: gated"], patch: "junoPad" }
  },
  breakbeat: {
    drums: { instrument: "Drum Rack", effects: ["Saturator", "Glue Compressor"], macros: ["chopped break (the star)", "Saturator: grit", "Glue: smash the bus", "crash accents"] }
  },
  deepHouse: {
    counterMelody: { instrument: "Electric", effects: ["Chorus-Ensemble"], macros: ["Rhodes stab (warm tines)", "Chorus: light"], patch: "electricRhodes" },
    chords: { instrument: "Analog", effects: ["Chorus-Ensemble", "Reverb"], macros: ["Rhodes-style 7ths", "swing", "Chorus: warm", "LP filter"], patch: "keys" },
    pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["warm jazzy pad (Juno-106)", "gentle chorus"], patch: "junoPad" }
  }
};
var SAFE_PARAM_TARGETS = [
  { device: "Overdrive", aliases: ["drive"], target01: 0.35 },
  { device: "Overdrive", aliases: ["dry/wet", "dry / wet"], target01: 0.6 },
  { device: "Saturator", aliases: ["drive"], target01: 0.3 },
  { device: "Reverb", aliases: ["dry/wet", "dry / wet"], target01: 0.28 },
  { device: "Delay", aliases: ["dry/wet", "dry / wet"], target01: 0.3 },
  { device: "Chorus-Ensemble", aliases: ["dry/wet", "amount"], target01: 0.4 },
  { device: "Compressor", aliases: ["dry/wet"], target01: 1 }
];
var INSTRUMENT_PATCHES = {
  // === Drift patches (SDK display names: LP Res / LP Freq / Osc 1 Wave / Env 1 * / Voice Mode) ===
  // TB-303.
  // === Drift patches — authored in REAL units (LP Freq 20–20000 Hz linear; env times
  // 0–60 s linear; Osc 2 Detune ±7 SEMITONES; LP Mod Amt ±1 so t01 0.5 = zero). ===
  acid303: [
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["glide time", "glide"], seconds: 0.06 },
    // 303 slide ~60 ms (legato+mono)
    { aliases: ["lp freq"], hz: 420 },
    // squelch base — env opens from here
    { aliases: ["lp res"], target01: 0.78 },
    { aliases: ["lp mod amt 1"], target01: 0.85 },
    // ±1 range → +0.70 env→filter
    { aliases: ["env 1 attack"], seconds: 1e-3 },
    { aliases: ["env 1 decay"], seconds: 0.35 },
    { aliases: ["env 1 sustain"], target01: 0.85 },
    // amp stays; the FILTER env plinks
    { aliases: ["env 1 release"], seconds: 0.08 },
    { aliases: ["env 2 attack"], seconds: 1e-3 },
    // mod env = the 303 filter plink
    { aliases: ["env 2 decay"], seconds: 0.28 },
    { aliases: ["env 2 sustain"], target01: 0 }
  ],
  moogLead: [
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Shark Tooth", value: 2 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5086 },
    // ±7 st → +0.12 st (chorus width, NOT an interval)
    { aliases: ["osc 2 gain"], target01: 0.35 },
    // 0–1.995 → ≈0.70
    { aliases: ["glide time", "glide"], seconds: 0.09 },
    { aliases: ["lp freq"], hz: 2200 },
    { aliases: ["lp res"], target01: 0.3 },
    { aliases: ["lp mod amt 1"], target01: 0.7 },
    // → +0.40
    { aliases: ["env 1 attack"], seconds: 5e-3 },
    { aliases: ["env 1 decay"], seconds: 0.4 },
    { aliases: ["env 1 sustain"], target01: 0.55 },
    { aliases: ["env 1 release"], seconds: 0.25 }
  ],
  subBass: [
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Saturated", value: 3 },
    // sine+harmonics: reads on small speakers
    { aliases: ["lp freq"], hz: 350 },
    { aliases: ["lp res"], target01: 0.12 },
    { aliases: ["env 1 attack"], seconds: 2e-3 },
    { aliases: ["env 1 decay"], seconds: 0.4 },
    { aliases: ["env 1 sustain"], target01: 0.7 },
    { aliases: ["env 1 release"], seconds: 0.12 }
    // short — no low-end mud between notes
  ],
  seqPluck: [
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 1 gain"], target01: 0.72 },
    // ≈ unity (screenshot: 0.5 ≈ −6 dB, max ≈ +6) — transient voices vanish at default
    { aliases: ["lp freq"], hz: 1400 },
    { aliases: ["lp res"], target01: 0.5 },
    { aliases: ["lp mod amt 1"], target01: 0.75 },
    // → +0.50
    { aliases: ["env 1 attack"], seconds: 1e-3 },
    { aliases: ["env 1 decay"], seconds: 0.22 },
    // Berlin-school pluck
    { aliases: ["env 1 sustain"], target01: 0.05 },
    { aliases: ["env 1 release"], seconds: 0.15 }
  ],
  pwmLead: [
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.45 },
    // pulse width (true 0–1)
    { aliases: ["osc 1 shape mod amt", "osc 1 shape mod"], target01: 0.675 },
    // ±1 → +0.35 PWM depth
    { aliases: ["lfo rate"], hz: 0.6 },
    // slow PWM movement (0.17–1700 Hz linear!)
    { aliases: ["glide time", "glide"], seconds: 0.12 },
    { aliases: ["lp freq"], hz: 3e3 },
    { aliases: ["lp res"], target01: 0.35 },
    { aliases: ["env 1 sustain"], target01: 0.7 },
    { aliases: ["env 1 release"], seconds: 0.3 }
  ],
  superLead: [
    { aliases: ["voice mode"], item: "Unison", value: 3 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.487 },
    // −0.18 st against unison spread
    { aliases: ["osc 2 gain"], target01: 0.4 },
    // ≈0.80
    { aliases: ["lp freq"], hz: 6e3 },
    { aliases: ["lp res"], target01: 0.2 },
    { aliases: ["env 1 attack"], seconds: 3e-3 },
    { aliases: ["env 1 sustain"], target01: 0.75 },
    { aliases: ["env 1 release"], seconds: 0.5 }
  ],
  // Drift pad/chord — for Move mode Harmony (Move runs Drift natively) and Drift-only sets.
  driftPad: [
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["lp freq"], hz: 1800 },
    { aliases: ["lp res"], target01: 0.1 },
    { aliases: ["env 1 attack"], seconds: 0.9 },
    // blooms within a beat, not 24 s
    { aliases: ["env 1 decay"], seconds: 2 },
    { aliases: ["env 1 sustain"], target01: 0.85 },
    { aliases: ["env 1 release"], seconds: 2.8 }
  ],
  // === v0.33 Drift expansion — 10 more voices so starters stop sharing sounds ===
  glassBell: [
    // Detroit-style bell: triangle ping, fast decay, wide open filter
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 1 gain"], target01: 0.72 },
    // ≈ unity (screenshot: 0.5 ≈ −6 dB, max ≈ +6) — transient voices vanish at default
    { aliases: ["lp freq"], hz: 9e3 },
    { aliases: ["lp res"], target01: 0.15 },
    { aliases: ["env 1 attack"], seconds: 1e-3 },
    { aliases: ["env 1 decay"], seconds: 0.9 },
    { aliases: ["env 1 sustain"], target01: 0 },
    { aliases: ["env 1 release"], seconds: 0.7 }
  ],
  hooverRave: [
    // rave stab: saturated + detuned pulse layer, unison, mid growl
    { aliases: ["voice mode"], item: "Unison", value: 3 },
    { aliases: ["osc 1 wave"], item: "Saturated", value: 3 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Rectangle", value: 4 },
    { aliases: ["osc 2 detune"], target01: 0.4786 },
    // −0.30 st growl
    { aliases: ["osc 2 gain"], target01: 0.45 },
    { aliases: ["lp freq"], hz: 2600 },
    { aliases: ["lp res"], target01: 0.35 },
    { aliases: ["env 1 attack"], seconds: 5e-3 },
    { aliases: ["env 1 decay"], seconds: 0.5 },
    { aliases: ["env 1 sustain"], target01: 0.6 },
    { aliases: ["env 1 release"], seconds: 0.18 }
  ],
  dreamKeys: [
    // soft triangle keys — lo-fi / deep-house chords
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["lp freq"], hz: 2500 },
    { aliases: ["lp res"], target01: 0.08 },
    { aliases: ["env 1 attack"], seconds: 0.05 },
    { aliases: ["env 1 decay"], seconds: 1.2 },
    { aliases: ["env 1 sustain"], target01: 0.5 },
    { aliases: ["env 1 release"], seconds: 0.6 }
  ],
  feltEP: [
    // felt EP — the Piano part's voice: soft hammers, dark lid, motif-carrier
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Sine", value: 0 },
    { aliases: ["osc 2 octave", "osc 2 oct"], value: -1 },
    // sub an octave down = body
    { aliases: ["osc 2 detune"], target01: 0.5 },
    // sub sine: detune MUST be 0 (±7 st range → 0.5)
    { aliases: ["osc 2 gain"], target01: 0.32 },
    // felt warmth, never dominant
    { aliases: ["lp freq"], hz: 2600 },
    // the felt "lid" — dark but PRESENT in a mix
    { aliases: ["lp res"], target01: 0.06 },
    { aliases: ["lp mod amt 1"], target01: 0.68 },
    // hammer brightness rides the mod env
    { aliases: ["env 1 attack"], seconds: 3e-3 },
    // soft hammer, not a pluck click
    { aliases: ["env 1 decay"], seconds: 2.4 },
    // piano-length natural decay
    { aliases: ["env 1 sustain"], target01: 0.34 },
    // holds its place under pads
    { aliases: ["env 1 release"], seconds: 0.5 },
    // half-pedal tail
    { aliases: ["env 2 attack"], seconds: 1e-3 },
    // mod env = the hammer transient
    { aliases: ["env 2 decay"], seconds: 0.7 },
    { aliases: ["env 2 sustain"], target01: 0 }
  ],
  darkDrone: [
    // dub drone pad: two barely-detuned saws under a 600 Hz lid
    { aliases: ["voice mode"], item: "Stereo", value: 2 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5057 },
    // +0.08 st slow beat
    { aliases: ["osc 2 gain"], target01: 0.4 },
    { aliases: ["lp freq"], hz: 600 },
    { aliases: ["lp res"], target01: 0.2 },
    { aliases: ["env 1 attack"], seconds: 1.5 },
    { aliases: ["env 1 sustain"], target01: 1 },
    { aliases: ["env 1 release"], seconds: 3.5 }
  ],
  plasticPluck: [
    // electro pluck: rectangle snap for Detroit electro / funk lines
    { aliases: ["osc 1 wave"], item: "Rectangle", value: 6 },
    { aliases: ["osc 1 gain"], target01: 0.72 },
    // ≈ unity (screenshot: 0.5 ≈ −6 dB, max ≈ +6) — transient voices vanish at default
    { aliases: ["lp freq"], hz: 2200 },
    { aliases: ["lp res"], target01: 0.4 },
    { aliases: ["lp mod amt 1"], target01: 0.7 },
    // → +0.40 snap
    { aliases: ["env 1 attack"], seconds: 1e-3 },
    { aliases: ["env 1 decay"], seconds: 0.12 },
    { aliases: ["env 1 sustain"], target01: 0 },
    { aliases: ["env 1 release"], seconds: 0.1 }
  ],
  acidRubber: [
    // 303 variant: PULSE core — rubbery squelch, faster plink than acid303
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.3 },
    { aliases: ["glide time", "glide"], seconds: 0.055 },
    { aliases: ["lp freq"], hz: 380 },
    { aliases: ["lp res"], target01: 0.85 },
    { aliases: ["lp mod amt 1"], target01: 0.88 },
    // → +0.76
    { aliases: ["env 1 attack"], seconds: 1e-3 },
    { aliases: ["env 1 sustain"], target01: 0.85 },
    { aliases: ["env 1 release"], seconds: 0.07 },
    { aliases: ["env 2 attack"], seconds: 1e-3 },
    { aliases: ["env 2 decay"], seconds: 0.18 },
    { aliases: ["env 2 sustain"], target01: 0 }
  ],
  cosmicSweep: [
    // evolving pulse pad: slow PWM drift for cosmic/ambient beds
    { aliases: ["voice mode"], item: "Stereo", value: 2 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.5 },
    { aliases: ["osc 1 shape mod amt", "osc 1 shape mod"], target01: 0.7 },
    // ±1 → +0.40
    { aliases: ["lfo rate"], hz: 0.25 },
    // very slow drift
    { aliases: ["lp freq"], hz: 1400 },
    { aliases: ["lp res"], target01: 0.15 },
    { aliases: ["env 1 attack"], seconds: 1.2 },
    { aliases: ["env 1 sustain"], target01: 0.9 },
    { aliases: ["env 1 release"], seconds: 3 }
  ],
  funkClav: [
    // narrow-pulse clav: tight funk comping (Midnight Funk) — POLY so it can comp chords
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 gain"], target01: 0.72 },
    // ≈ unity (screenshot: 0.5 ≈ −6 dB, max ≈ +6) — transient voices vanish at default
    { aliases: ["osc 1 shape"], target01: 0.15 },
    // narrow = clavy
    { aliases: ["lp freq"], hz: 3200 },
    { aliases: ["lp res"], target01: 0.55 },
    { aliases: ["env 1 attack"], seconds: 1e-3 },
    { aliases: ["env 1 decay"], seconds: 0.18 },
    { aliases: ["env 1 sustain"], target01: 0.1 },
    { aliases: ["env 1 release"], seconds: 0.09 }
  ],
  iceLead: [
    // thin icy lead: triangle + high-passed body for ambient/ice starters
    { aliases: ["voice mode"], item: "Stereo", value: 2 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 2 detune"], target01: 0.5143 },
    // +0.20 st shimmer
    { aliases: ["osc 2 gain"], target01: 0.3 },
    { aliases: ["hp freq"], hz: 320 },
    // thin the body — icy
    { aliases: ["lp freq"], hz: 8e3 },
    { aliases: ["lp res"], target01: 0.2 },
    { aliases: ["env 1 attack"], seconds: 0.03 },
    { aliases: ["env 1 sustain"], target01: 0.65 },
    { aliases: ["env 1 release"], seconds: 1.2 }
  ],
  warmBrass: [
    // analog brass swell: saturated + saw layer, slow-ish attack (synthwave)
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saturated", value: 3 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.4893 },
    // −0.15 st
    { aliases: ["osc 2 gain"], target01: 0.38 },
    { aliases: ["lp freq"], hz: 1600 },
    { aliases: ["lp res"], target01: 0.18 },
    { aliases: ["lp mod amt 1"], target01: 0.65 },
    // → +0.30 brass blossom
    { aliases: ["env 1 attack"], seconds: 0.08 },
    { aliases: ["env 1 decay"], seconds: 0.8 },
    { aliases: ["env 1 sustain"], target01: 0.7 },
    { aliases: ["env 1 release"], seconds: 0.35 }
  ],
  // === v0.36 expansion — 10 more voices, wired into profiles/starters ===
  crystalPluck: [
    // trance/emotional pluck: triangle ping with a shimmer tail
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 1 gain"], target01: 0.72 },
    // ≈ unity (screenshot: 0.5 ≈ −6 dB, max ≈ +6) — transient voices vanish at default
    { aliases: ["lp freq"], hz: 4500 },
    { aliases: ["lp res"], target01: 0.45 },
    { aliases: ["lp mod amt 1"], target01: 0.725 },
    // → +0.45
    { aliases: ["env 1 attack"], seconds: 1e-3 },
    { aliases: ["env 1 decay"], seconds: 0.28 },
    { aliases: ["env 1 sustain"], target01: 0 },
    { aliases: ["env 1 release"], seconds: 0.4 }
  ],
  deepPulseBass: [
    // hollow pulse bass — the dub-techno low end
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.35 },
    { aliases: ["lp freq"], hz: 500 },
    { aliases: ["lp res"], target01: 0.18 },
    { aliases: ["env 1 attack"], seconds: 2e-3 },
    { aliases: ["env 1 decay"], seconds: 0.35 },
    { aliases: ["env 1 sustain"], target01: 0.65 },
    { aliases: ["env 1 release"], seconds: 0.1 }
  ],
  reeseBass: [
    // jungle/breaks reese: unison + wide-ish twin saws under a low lid
    { aliases: ["voice mode"], item: "Unison", value: 3 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5214 },
    // +0.30 st — the reese beat
    { aliases: ["osc 2 gain"], target01: 0.45 },
    { aliases: ["lp freq"], hz: 550 },
    { aliases: ["lp res"], target01: 0.15 },
    { aliases: ["env 1 attack"], seconds: 4e-3 },
    { aliases: ["env 1 sustain"], target01: 0.9 },
    { aliases: ["env 1 release"], seconds: 0.15 }
  ],
  houseOrgan: [
    // two sines an octave apart, organ gate — disco/deep house
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Sine", value: 0 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Sine", value: 0 },
    { aliases: ["osc 2 oct"], value: 1 },
    // +1 octave drawbar
    { aliases: ["osc 2 gain"], target01: 0.3 },
    { aliases: ["lp freq"], hz: 8e3 },
    { aliases: ["lp res"], target01: 0.05 },
    { aliases: ["env 1 attack"], seconds: 3e-3 },
    { aliases: ["env 1 sustain"], target01: 1 },
    { aliases: ["env 1 release"], seconds: 0.06 }
    // organ gate
  ],
  sineWhistle: [
    // pure sine lead with glide — floating melodies, sunrise house
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Sine", value: 0 },
    { aliases: ["glide time", "glide"], seconds: 0.08 },
    { aliases: ["lp freq"], hz: 1e4 },
    { aliases: ["lp res"], target01: 0.1 },
    { aliases: ["env 1 attack"], seconds: 0.02 },
    { aliases: ["env 1 sustain"], target01: 0.8 },
    { aliases: ["env 1 release"], seconds: 0.25 }
  ],
  tapeStrings: [
    // Berlin-school string machine: twin saws, slow bow, mid lid
    { aliases: ["voice mode"], item: "Stereo", value: 2 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5071 },
    // +0.10 st ensemble
    { aliases: ["osc 2 gain"], target01: 0.35 },
    { aliases: ["lp freq"], hz: 2800 },
    { aliases: ["lp res"], target01: 0.12 },
    { aliases: ["env 1 attack"], seconds: 0.45 },
    { aliases: ["env 1 decay"], seconds: 1.5 },
    { aliases: ["env 1 sustain"], target01: 0.8 },
    { aliases: ["env 1 release"], seconds: 1.6 }
  ],
  laserZap: [
    // techno zap: near-closed filter kicked open by a 90 ms envelope
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 1 gain"], target01: 0.72 },
    // ≈ unity (screenshot: 0.5 ≈ −6 dB, max ≈ +6) — transient voices vanish at default
    { aliases: ["lp freq"], hz: 260 },
    { aliases: ["lp res"], target01: 0.7 },
    { aliases: ["lp mod amt 1"], target01: 0.95 },
    // → +0.90 zap
    { aliases: ["env 1 attack"], seconds: 1e-3 },
    { aliases: ["env 1 decay"], seconds: 0.18 },
    { aliases: ["env 1 sustain"], target01: 0 },
    { aliases: ["env 1 release"], seconds: 0.08 },
    { aliases: ["env 2 attack"], seconds: 1e-3 },
    { aliases: ["env 2 decay"], seconds: 0.09 },
    { aliases: ["env 2 sustain"], target01: 0 }
  ],
  glassChoir: [
    // airy twin-triangle choir pad, thinned with HP — trance breakdowns, ice
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 2 on"], item: "On", value: 1 },
    { aliases: ["osc 2 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 2 detune"], target01: 0.5086 },
    // +0.12 st
    { aliases: ["osc 2 gain"], target01: 0.3 },
    { aliases: ["hp freq"], hz: 200 },
    { aliases: ["lp freq"], hz: 6e3 },
    { aliases: ["lp res"], target01: 0.1 },
    { aliases: ["env 1 attack"], seconds: 1.4 },
    { aliases: ["env 1 sustain"], target01: 0.9 },
    { aliases: ["env 1 release"], seconds: 2.4 }
  ],
  industrialStab: [
    // corroded saturated stab for warehouse/industrial sequence work
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    // POLY: it comps chord stabs
    { aliases: ["osc 1 wave"], item: "Saturated", value: 3 },
    { aliases: ["lp freq"], hz: 1200 },
    { aliases: ["lp res"], target01: 0.45 },
    { aliases: ["lp mod amt 1"], target01: 0.75 },
    // → +0.50
    { aliases: ["env 1 attack"], seconds: 1e-3 },
    { aliases: ["env 1 decay"], seconds: 0.3 },
    { aliases: ["env 1 sustain"], target01: 0.2 },
    { aliases: ["env 1 release"], seconds: 0.12 }
  ],
  octaveRunner: [
    // tight pulse bass for synthwave octave lines
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.4 },
    { aliases: ["lp freq"], hz: 900 },
    { aliases: ["lp res"], target01: 0.3 },
    { aliases: ["env 1 attack"], seconds: 1e-3 },
    { aliases: ["env 1 decay"], seconds: 0.25 },
    { aliases: ["env 1 sustain"], target01: 0.4 },
    { aliases: ["env 1 release"], seconds: 0.08 }
  ],
  // === v0.44 additions ===
  dubChordStab: [
    // THE dub chord as a Drift voice: dark, saturated, short bloom, poly
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saturated", value: 3 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.52 },
    // +0.28 st chorus width
    { aliases: ["osc 2 gain"], target01: 0.35 },
    { aliases: ["lp freq"], hz: 750 },
    // dark, opens with velocity/filter rides
    { aliases: ["lp res"], target01: 0.35 },
    { aliases: ["env 1 attack"], seconds: 4e-3 },
    { aliases: ["env 1 decay"], seconds: 0.5 },
    { aliases: ["env 1 sustain"], target01: 0.25 },
    { aliases: ["env 1 release"], seconds: 0.45 }
    // tail feeds the delay/reverb sends
  ],
  cathedralOrgan: [
    // pulse + octave-up sine: hollow organ for house/ambient chords, poly
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.5 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Sine", value: 0 },
    { aliases: ["osc 2 oct"], value: 1 },
    // the octave drawbar
    { aliases: ["osc 2 gain"], target01: 0.4 },
    { aliases: ["lp freq"], hz: 2600 },
    { aliases: ["env 1 attack"], seconds: 0.02 },
    { aliases: ["env 1 sustain"], target01: 0.9 },
    { aliases: ["env 1 release"], seconds: 0.25 }
  ],
  duneFlute: [
    // breathy triangle+noise lead: airy, melancholic, poly for gentle doubles
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["noise on"], target01: 1 },
    { aliases: ["noise level"], target01: 0.18 },
    // the breath
    { aliases: ["lp freq"], hz: 3200 },
    { aliases: ["env 1 attack"], seconds: 0.06 },
    // soft speak
    { aliases: ["env 1 sustain"], target01: 0.8 },
    { aliases: ["env 1 release"], seconds: 0.3 },
    { aliases: ["lfo rate"], hz: 5.2 },
    // gentle vibrato
    { aliases: ["lfo amount"], target01: 0.06 }
  ],
  wireLead: [
    // shark-tooth mono lead: thin, wiry, cuts through dub fog without width
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Shark Tooth", value: 2 },
    { aliases: ["lp freq"], hz: 1800 },
    { aliases: ["lp res"], target01: 0.45 },
    { aliases: ["env 1 attack"], seconds: 2e-3 },
    { aliases: ["env 1 decay"], seconds: 0.4 },
    { aliases: ["env 1 sustain"], target01: 0.6 },
    { aliases: ["env 1 release"], seconds: 0.12 }
  ],
  neonPluck: [
    // bright saw pluck with LFO shimmer: trance/synthwave sequences, poly
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 1 gain"], target01: 0.72 },
    // transient voice: needs ~unity
    { aliases: ["lp freq"], hz: 2400 },
    { aliases: ["lp res"], target01: 0.3 },
    { aliases: ["env 1 attack"], seconds: 1e-3 },
    { aliases: ["env 1 decay"], seconds: 0.22 },
    { aliases: ["env 1 sustain"], target01: 0 },
    { aliases: ["env 1 release"], seconds: 0.1 },
    { aliases: ["lfo rate"], hz: 0.35 },
    // slow neon flicker on the filter
    { aliases: ["lfo amount"], target01: 0.12 }
  ],
  abyssBass: [
    // pure sine sub with a saturated whisper: the deepest floor, mono
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Sine", value: 0 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saturated", value: 2 },
    { aliases: ["osc 2 gain"], target01: 0.15 },
    // just a whisper of harmonics
    { aliases: ["osc 2 detune"], target01: 0.5 },
    // sub layers stay at 0 detune
    { aliases: ["lp freq"], hz: 300 },
    { aliases: ["env 1 attack"], seconds: 2e-3 },
    { aliases: ["env 1 decay"], seconds: 0.3 },
    { aliases: ["env 1 sustain"], target01: 0.7 },
    { aliases: ["env 1 release"], seconds: 0.06 }
  ],
  rubberBand: [
    // rectangle bounce bass: short, elastic, electro-funk pocket, mono
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Rectangle", value: 6 },
    { aliases: ["lp freq"], hz: 650 },
    { aliases: ["lp res"], target01: 0.5 },
    { aliases: ["env 1 attack"], seconds: 1e-3 },
    { aliases: ["env 1 decay"], seconds: 0.16 },
    // the bounce
    { aliases: ["env 1 sustain"], target01: 0.1 },
    { aliases: ["env 1 release"], seconds: 0.05 }
  ],
  // === v0.63: classic-synth studies =========================================================
  // Drift is a 2-oscillator synth with one multimode filter, so these are STUDIES of the
  // originals' behaviour, not emulations: what made each machine recognisable, expressed in
  // Drift's terms. Filter Type is the main untouched lever — II for the steeper/darker ladder
  // character (Moog, Prophet Rev3, SH/Pro-One), I for the gentler 2-pole voices (Oberheim SEM,
  // CS-80, Jupiter, string machines). If a patch sounds inverted, that switch is the first thing
  // to flip — it's the one judgement here I can't verify by ear.
  modelDBass: [
    // Minimoog Model D: three oscs in reality; Drift gets two saws, one an octave down.
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    // the Model D is monophonic by nature
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 oct"], value: -1 },
    // the classic "osc 2 an octave below"
    // A real Model D detunes this oscillator and that beating IS the fatness — but an octave-down
    // layer beating in a techno low end is mud on a big system. Weight here, fatness in the lead.
    { aliases: ["osc 2 detune"], target01: 0.5 },
    { aliases: ["osc 2 gain"], target01: 0.62 },
    { aliases: ["lp type"], item: "II", value: 1 },
    // ladder-ish: steep and warm
    { aliases: ["lp freq"], hz: 380 },
    { aliases: ["lp res"], target01: 0.32 },
    // Moog res thickens before it whistles
    { aliases: ["lp mod amt 1"], target01: 0.55 },
    { aliases: ["env 1 attack"], seconds: 2e-3 },
    { aliases: ["env 1 decay"], seconds: 0.28 },
    { aliases: ["env 1 sustain"], target01: 0.55 },
    { aliases: ["env 1 release"], seconds: 0.1 },
    { aliases: ["env 2 attack"], seconds: 1e-3 },
    { aliases: ["env 2 decay"], seconds: 0.35 },
    { aliases: ["env 2 sustain"], target01: 0 },
    { aliases: ["glide time"], seconds: 0.04 }
  ],
  modelDLead: [
    // the same machine pushed up: brighter, more res, longer glide — the Berlin lead
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5143 },
    // +0.2 st beating = the fatness
    { aliases: ["osc 2 gain"], target01: 0.7 },
    { aliases: ["lp type"], item: "II", value: 1 },
    { aliases: ["lp freq"], hz: 1200 },
    { aliases: ["lp res"], target01: 0.42 },
    { aliases: ["lp mod amt 1"], target01: 0.45 },
    { aliases: ["env 1 attack"], seconds: 4e-3 },
    { aliases: ["env 1 decay"], seconds: 0.5 },
    { aliases: ["env 1 sustain"], target01: 0.7 },
    { aliases: ["env 1 release"], seconds: 0.18 },
    { aliases: ["glide time"], seconds: 0.09 }
  ],
  obxBrass: [
    // Oberheim OB-X: two saws through a 2-pole SEM filter. THE 80s brass stab.
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    // brass is chordal — Poly (8 on Move)
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5129 },
    // +0.18 st
    { aliases: ["osc 2 gain"], target01: 0.7 },
    { aliases: ["lp type"], item: "I", value: 0 },
    // 2-pole SEM: gentler slope, more air
    { aliases: ["lp freq"], hz: 1400 },
    { aliases: ["lp res"], target01: 0.22 },
    { aliases: ["lp mod amt 1"], target01: 0.6 },
    // the brass "blat" is the filter env
    { aliases: ["env 1 attack"], seconds: 0.03 },
    { aliases: ["env 1 decay"], seconds: 0.5 },
    { aliases: ["env 1 sustain"], target01: 0.75 },
    { aliases: ["env 1 release"], seconds: 0.25 },
    { aliases: ["env 2 attack"], seconds: 0.02 },
    { aliases: ["env 2 decay"], seconds: 0.4 },
    { aliases: ["env 2 sustain"], target01: 0.2 }
  ],
  prophet5Pad: [
    // Prophet-5 Rev3: Curtis 4-pole, saw + a squarer second osc, slow bloom
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Rectangle", value: 4 },
    // osc 2 has no Pulse — Rectangle is the stand-in
    { aliases: ["osc 2 detune"], target01: 0.5179 },
    // +0.25 st
    { aliases: ["osc 2 gain"], target01: 0.6 },
    { aliases: ["lp type"], item: "II", value: 1 },
    { aliases: ["lp freq"], hz: 1100 },
    { aliases: ["lp res"], target01: 0.28 },
    { aliases: ["env 1 attack"], seconds: 0.6 },
    { aliases: ["env 1 decay"], seconds: 1.2 },
    { aliases: ["env 1 sustain"], target01: 0.8 },
    { aliases: ["env 1 release"], seconds: 1.8 },
    { aliases: ["lfo rate"], hz: 4.6 },
    { aliases: ["lfo amount"], target01: 0.04 }
    // barely-there vibrato
  ],
  juno106Pad: [
    // Juno-106: ONE pulse DCO + a square sub, an HPF, and that chorus doing the work
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.5 },
    { aliases: ["osc 1 shape mod amt"], target01: 0.25 },
    // slow PWM — the Juno shimmer
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Rectangle", value: 4 },
    { aliases: ["osc 2 oct"], value: -1 },
    // the sub
    { aliases: ["osc 2 detune"], target01: 0.5 },
    // sub NEVER detunes — it would beat
    { aliases: ["osc 2 gain"], target01: 0.45 },
    { aliases: ["hp freq"], hz: 120 },
    // the Juno's HPF thins the low end
    { aliases: ["lp freq"], hz: 2200 },
    { aliases: ["lp res"], target01: 0.2 },
    { aliases: ["env 1 attack"], seconds: 0.5 },
    { aliases: ["env 1 decay"], seconds: 1 },
    { aliases: ["env 1 sustain"], target01: 0.85 },
    { aliases: ["env 1 release"], seconds: 1.5 },
    { aliases: ["lfo rate"], hz: 0.45 },
    { aliases: ["lfo amount"], target01: 0.12 }
  ],
  sh101Bass: [
    // SH-101: saw + square sub, one filter, no nonsense. Electro/acid bass.
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Rectangle", value: 4 },
    { aliases: ["osc 2 oct"], value: -1 },
    { aliases: ["osc 2 detune"], target01: 0.5 },
    // sub stays dead centre
    { aliases: ["osc 2 gain"], target01: 0.5 },
    { aliases: ["lp type"], item: "II", value: 1 },
    { aliases: ["lp freq"], hz: 520 },
    { aliases: ["lp res"], target01: 0.45 },
    { aliases: ["lp mod amt 1"], target01: 0.7 },
    { aliases: ["env 1 attack"], seconds: 1e-3 },
    { aliases: ["env 1 decay"], seconds: 0.18 },
    { aliases: ["env 1 sustain"], target01: 0.25 },
    { aliases: ["env 1 release"], seconds: 0.06 },
    { aliases: ["env 2 attack"], seconds: 1e-3 },
    { aliases: ["env 2 decay"], seconds: 0.22 },
    { aliases: ["env 2 sustain"], target01: 0 },
    { aliases: ["glide time"], seconds: 0.02 }
  ],
  cs80Brass: [
    // Yamaha CS-80: HP+LP per voice, slow swell, ever-present vibrato. Vangelis.
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5157 },
    // +0.22 st
    { aliases: ["osc 2 gain"], target01: 0.75 },
    { aliases: ["hp freq"], hz: 90 },
    // the CS-80's high-pass stage
    { aliases: ["lp type"], item: "I", value: 0 },
    { aliases: ["lp freq"], hz: 1600 },
    { aliases: ["lp res"], target01: 0.18 },
    { aliases: ["env 1 attack"], seconds: 0.09 },
    // the swell, not a stab
    { aliases: ["env 1 decay"], seconds: 0.8 },
    { aliases: ["env 1 sustain"], target01: 0.8 },
    { aliases: ["env 1 release"], seconds: 0.5 },
    { aliases: ["lfo rate"], hz: 5.5 },
    { aliases: ["lfo amount"], target01: 0.05 }
  ],
  jupiter8Pad: [
    // Jupiter-8: two detuned saws, 2-pole option, unhurried. Lush by design.
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5214 },
    // +0.3 st — wide but still one note
    { aliases: ["osc 2 gain"], target01: 0.8 },
    { aliases: ["lp type"], item: "I", value: 0 },
    { aliases: ["lp freq"], hz: 1800 },
    { aliases: ["lp res"], target01: 0.25 },
    { aliases: ["env 1 attack"], seconds: 0.8 },
    { aliases: ["env 1 decay"], seconds: 1.5 },
    { aliases: ["env 1 sustain"], target01: 0.85 },
    { aliases: ["env 1 release"], seconds: 2.2 }
  ],
  proOneLead: [
    // Sequential Pro-One: pulse + saw, aggressive filter env, glide. The mono lead.
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Pulse", value: 5 },
    { aliases: ["osc 1 shape"], target01: 0.35 },
    // narrow pulse = hollow and reedy
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5107 },
    { aliases: ["osc 2 gain"], target01: 0.65 },
    { aliases: ["lp type"], item: "II", value: 1 },
    { aliases: ["lp freq"], hz: 1400 },
    { aliases: ["lp res"], target01: 0.5 },
    { aliases: ["lp mod amt 1"], target01: 0.65 },
    { aliases: ["env 1 attack"], seconds: 5e-3 },
    { aliases: ["env 1 decay"], seconds: 0.4 },
    { aliases: ["env 1 sustain"], target01: 0.6 },
    { aliases: ["env 1 release"], seconds: 0.15 },
    { aliases: ["glide time"], seconds: 0.06 }
  ],
  eminentStrings: [
    // Eminent 310 — Jarre's Oxygène strings. The machine is plain; the PHASER is the sound.
    { aliases: ["voice mode"], item: "Poly", value: 0 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Saw", value: 3 },
    { aliases: ["osc 2 detune"], target01: 0.5229 },
    // +0.32 st ensemble shimmer
    { aliases: ["osc 2 gain"], target01: 0.9 },
    { aliases: ["lp type"], item: "I", value: 0 },
    { aliases: ["lp freq"], hz: 2600 },
    { aliases: ["lp res"], target01: 0.1 },
    // string machines barely filter
    { aliases: ["env 1 attack"], seconds: 0.35 },
    { aliases: ["env 1 decay"], seconds: 1 },
    { aliases: ["env 1 sustain"], target01: 0.9 },
    { aliases: ["env 1 release"], seconds: 1.2 }
  ],
  ms20Lead: [
    // Korg MS-20: the filter screams. Saturated osc, resonance near the edge.
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Saturated", value: 3 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Rectangle", value: 4 },
    { aliases: ["osc 2 detune"], target01: 0.5071 },
    { aliases: ["osc 2 gain"], target01: 0.55 },
    { aliases: ["lp type"], item: "II", value: 1 },
    { aliases: ["lp freq"], hz: 900 },
    { aliases: ["lp res"], target01: 0.75 },
    // on the edge of self-oscillation
    { aliases: ["lp mod amt 1"], target01: 0.8 },
    { aliases: ["env 1 attack"], seconds: 2e-3 },
    { aliases: ["env 1 decay"], seconds: 0.3 },
    { aliases: ["env 1 sustain"], target01: 0.5 },
    { aliases: ["env 1 release"], seconds: 0.1 },
    { aliases: ["glide time"], seconds: 0.03 }
  ],
  taurusBass: [
    // Moog Taurus pedals: almost no harmonics, all weight. Dub/Berlin floor.
    { aliases: ["voice mode"], item: "Mono", value: 1 },
    { aliases: ["osc 1 wave"], item: "Saw", value: 4 },
    { aliases: ["osc 1 oct"], value: -1 },
    { aliases: ["osc 2 on"], target01: 1 },
    { aliases: ["osc 2 wave"], item: "Sine", value: 0 },
    { aliases: ["osc 2 oct"], value: -1 },
    { aliases: ["osc 2 detune"], target01: 0.5 },
    // sub layer: zero detune
    { aliases: ["osc 2 gain"], target01: 0.7 },
    { aliases: ["lp type"], item: "II", value: 1 },
    { aliases: ["lp freq"], hz: 180 },
    // almost everything removed
    { aliases: ["lp res"], target01: 0.2 },
    { aliases: ["env 1 attack"], seconds: 5e-3 },
    { aliases: ["env 1 decay"], seconds: 0.6 },
    { aliases: ["env 1 sustain"], target01: 0.8 },
    { aliases: ["env 1 release"], seconds: 0.3 },
    { aliases: ["glide time"], seconds: 0.05 }
  ],
  staticHaze: [
    // noise-forward airy pad: tape hiss turned into weather, stereo
    { aliases: ["voice mode"], item: "Stereo", value: 2 },
    { aliases: ["osc 1 wave"], item: "Triangle", value: 1 },
    { aliases: ["osc 1 gain"], target01: 0.4 },
    { aliases: ["noise on"], target01: 1 },
    { aliases: ["noise level"], target01: 0.45 },
    // the haze IS the sound
    { aliases: ["lp freq"], hz: 1400 },
    { aliases: ["env 1 attack"], seconds: 1.2 },
    { aliases: ["env 1 sustain"], target01: 0.85 },
    { aliases: ["env 1 release"], seconds: 2.5 }
  ],
  // === Wavetable patches (Flt 1 Freq / Flt 1 Res / Amp Attack..Release) ===
  junoPad: [
    { aliases: ["amp attack"], target01: 0.3 },
    { aliases: ["amp sustain"], target01: 0.85 },
    { aliases: ["amp release"], target01: 0.55 },
    { aliases: ["flt 1 freq"], target01: 0.6 },
    { aliases: ["flt 1 res"], target01: 0.12 }
  ],
  obPad: [
    { aliases: ["amp attack"], target01: 0.5 },
    { aliases: ["amp sustain"], target01: 0.9 },
    { aliases: ["amp release"], target01: 0.65 },
    { aliases: ["flt 1 freq"], target01: 0.68 },
    { aliases: ["flt 1 res"], target01: 0.2 }
  ],
  warmPad: [
    { aliases: ["amp attack"], target01: 0.45 },
    { aliases: ["amp sustain"], target01: 0.8 },
    { aliases: ["amp release"], target01: 0.6 },
    { aliases: ["flt 1 freq"], target01: 0.65 }
  ],
  // === Analog patches (F1 Freq / F1 Resonance / AEG1 Attack..Rel) ===
  stab: [
    { aliases: ["aeg1 attack"], target01: 0.02 },
    { aliases: ["aeg1 decay"], target01: 0.35 },
    { aliases: ["aeg1 sustain"], target01: 0.3 },
    { aliases: ["aeg1 rel"], target01: 0.25 },
    { aliases: ["f1 freq"], target01: 0.55 },
    { aliases: ["f1 resonance"], target01: 0.25 }
  ],
  wash: [
    { aliases: ["aeg1 attack"], target01: 0.6 },
    { aliases: ["aeg1 sustain"], target01: 0.85 },
    { aliases: ["aeg1 rel"], target01: 0.75 }
  ],
  // === keys: applied on BOTH Analog and Operator, so it lists names for each ===
  keys: [
    { aliases: ["aeg1 attack", "ae attack"], target01: 0.08 },
    { aliases: ["aeg1 decay", "ae decay"], target01: 0.5 },
    { aliases: ["aeg1 sustain", "ae sustain"], target01: 0.45 },
    { aliases: ["tone"], target01: 0.4 }
  ],
  // === Operator patch (Ae Attack..Release / Filter Freq / Filter Res / Tone) ===
  bell: [
    { aliases: ["ae attack"], target01: 0.02 },
    { aliases: ["ae decay"], target01: 0.6 },
    { aliases: ["ae sustain"], target01: 0.25 },
    { aliases: ["ae release"], target01: 0.5 },
    { aliases: ["tone"], target01: 0.6 },
    { aliases: ["filter freq"], target01: 0.6 }
  ],
  // === Physical-model instruments (Collision/Tension/Electric) — no filter/ADSR; these
  //     select the resonator/exciter voice and a couple of tone controls, real names only. ===
  // Collision: bright wooden mallet for Detroit counter-melodies.
  collisionMallet: [
    { aliases: ["res 1 type"], item: "Marimba", value: 1 },
    { aliases: ["res 1 decay"], target01: 0.55 },
    { aliases: ["mallet stiffness"], target01: 0.62 },
    { aliases: ["res 1 brightness"], target01: 0.62 }
  ],
  // Tension: bowed sustained string for Ambient counter-melodies.
  tensionBow: [
    { aliases: ["exciter type"], item: "Bow", value: 0 },
    { aliases: ["filter freq"], target01: 0.72 },
    { aliases: ["string decay"], target01: 0.8 }
  ],
  // Electric: warm Rhodes EP for Lo-Fi / Deep House counter-melodies.
  electricRhodes: [
    { aliases: ["f tine vol"], target01: 0.45 },
    { aliases: ["f tine color"], target01: 0.5 },
    { aliases: ["damp tone"], target01: 0.5 }
  ]
};
function deviceRecipe(style, part, soundProfile) {
  if (soundProfile && SOUND_PROFILES[soundProfile]?.[part]) return SOUND_PROFILES[soundProfile][part];
  return DEVICE_OVERRIDES[style]?.[part] ?? DEVICE_DEFAULT[part];
}
var SOUND_PROFILES = {
  // ---- Waldorf Protein showcase profiles (v0.68) --------------------------------
  // ONE part per song goes to the Protein (external — no device loaded; MIDI Out to the
  // hardware). Protein pots have no printed scale, so values are % of knob travel /
  // display values; wavetables are named by CHARACTER — scroll and pick by ear.
  proteinSweep: {
    pad: {
      instrument: "Waldorf Protein (MIDI out)",
      effects: [],
      external: "Protein",
      patch: void 0,
      macros: ["Layer: single", "Osc 1: a resonant-sweep wavetable (classic MW1 territory)", "Osc 2: same table, Wave offset +15%", "Wave position: start 20%", "Env 3 \u2192 Wave: +60%, slow attack ~2s", "Cutoff: 55%, Resonance: 20%", "Env Amount: +25%", "FX: reverb, Amount 40%", "PERFORM: the Wave knob \u2014 the sweep IS the pad"]
    },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sparse fragments above the sweeping table"], patch: "modelDLead" }
  },
  proteinBass: {
    bass: {
      instrument: "Waldorf Protein (MIDI out)",
      effects: [],
      external: "Protein",
      patch: void 0,
      macros: ["Layer: single", "Osc 1: a hollow/formant table, low position ~10%", "Osc 2: OFF (or -12 sub, table pos 0%)", "Play octave 1\u20132: the ASIC aliasing IS the warmth", "Cutoff: 35%, Cutoff Track: 50%", "Resonance: 15%", "Env Amount: +20%, fast decay", "Dirt: 10% (subtle)", "PERFORM: Cutoff and nothing else \u2014 Huckaby discipline"]
    },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["rare bell fragments, deep-house sparse"], patch: "glassBell" }
  },
  proteinSpeech: {
    lead: {
      instrument: "Waldorf Protein (MIDI out)",
      effects: [],
      external: "Protein",
      patch: void 0,
      macros: ["Layer: single", "Osc 1: a SPEECH wavetable", "Osc 2: algorithmic table, quiet (-30%)", "Wave position: 30% \u2014 vowels live 20\u201370%", "LFO 1 \u2192 Wave: slow triangle, \xB120%", "Cutoff: 65%, Resonance: 30%", "Env: medium attack 80ms, long release", "FX: delay, Amount 35%", "PERFORM: Wave position by hand = making it talk"]
    },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["reese-adjacent weight under the voice"], patch: "subBass" }
  },
  proteinRobin: {
    chords: {
      instrument: "Waldorf Protein (MIDI out)",
      effects: [],
      external: "Protein",
      patch: void 0,
      macros: ["Multi: 4 LAYERS in ROUND ROBIN \u2014 the showcase", "Layer 1: mallet table \xB7 Layer 2: formant \xB7 Layer 3: glass \xB7 Layer 4: soft brass", "Use Load Layer to pull each from factory presets", "Match Cutoff ~50% + envelope shapes across layers", "Every stab lands on the NEXT layer \u2014 the chord shimmers between four faces", "Match layer LEVELS by ear (solo each; equal loudness)", "FX: shared reverb 30%", "PERFORM: nothing \u2014 let the round robin do it; that's the point"]
    },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["emotional Detroit fragments over the rotation"], patch: "modelDLead" }
  },
  proteinFlavor: {
    pad: {
      instrument: "Waldorf Protein (MIDI out)",
      effects: [],
      external: "Protein",
      patch: void 0,
      macros: ["Layer: 2 layers, same warm table, detuned \xB17 cents", "Wave position: 45%, no wave modulation \u2014 stillness", "Cutoff: 45%, slow attack ~3s, long release", "FLAVOR: start 0% \u2014 the knob is the performance", "Filter de-calibration: enable (aged-hardware drift)", "FX: reverb, Amount 55%", "Save the pristine version to a slot FIRST \u2014 you will want to come home", "PERFORM: Flavor 0 \u2192 70% across the song \u2014 the patch grows old in real time"]
    },
    lead: { instrument: "Drift", effects: ["Reverb", "Delay"], macros: ["distant bowed echoes"], patch: "glassBell" }
  },
  proteinDirt: {
    chords: {
      instrument: "Waldorf Protein (MIDI out)",
      effects: [],
      external: "Protein",
      patch: void 0,
      macros: ["Layer: single", "Osc 1: e-piano/mallet-ish table, position 35%", "DIRT: type ring (osc1\xD7osc2), amount 20% \u2014 the showcase", "Osc 2: tuned +7 semitones (the ring interval)", "Cutoff: 40% \u2014 dusty lid", "Env: soft attack 30ms, medium decay", "FX: modulation (chorus-ish), Amount 30%", "Velocity \u2192 Wave: +15% (harder = brighter dust)", "PERFORM: Dirt amount 10\u201340% per section; Osc 2 tune = re-voicing the rust"]
    },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["hazy topline, behind the beat"], patch: "pwmLead" }
  },
  proteinGlass: {
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["anthem fragments over the glass"], patch: "pwmLead" },
    arp: {
      instrument: "Waldorf Protein (MIDI out)",
      effects: [],
      external: "Protein",
      patch: void 0,
      macros: ["Layer: single", "Osc 1: a GLASSY PPG-style table, position 60%", "Osc 2: same family, +12 semitones, -20% level", "Velocity \u2192 Wave: +25% \u2014 the sequence glitters unevenly", "Cutoff: 70%, Resonance: 25%", "Env: instant attack, decay ~250ms, no sustain", "Cutoff Track: 70% (highs ring brighter)", "FX: delay 1/16, Amount 40%", "PERFORM: Cutoff rides the arc; at the Drop push Resonance to 45%"]
    },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["trance floor, root-fifth pump"], patch: "subBass" }
  },
  dminiEmphasis: {
    lead: {
      instrument: "Behringer D MINI (MIDI out)",
      effects: [],
      external: "D MINI",
      patch: void 0,
      macros: ["Mode (10): Octave", "Detune (11): 5", "Waveform (12): Saw", "Scale (13): 8'", "Noise Level (14): 0", "Cutoff (15): 3", "Emphasis (16): 8 \u2014 the showcase: self-oscillation edge", "Contour (17): 5", "Filter Mod (18): OFF", "Attack (24): 0", "Decay (25): 2.5", "Sustain (26): 0", "Contour Decay (23): OFF", "Osc Mod (27): OFF", "Trigger Sync: on", "PERFORM: Emphasis 6 \u2194 9 is the melody; Cutoff whistles the pitch"]
    },
    bass: { instrument: "Drift", effects: ["Saturator", "Auto Filter"], macros: ["the 303 keeps the floor while the D MINI screams above"], patch: "acidRubber" }
  },
  dminiAcidBass: {
    bass: {
      instrument: "Behringer D MINI (MIDI out)",
      effects: [],
      external: "D MINI",
      patch: void 0,
      macros: ["Mode (10): Unison", "Detune (11): 5 \u2014 dead centre, no beat", "Waveform (12): Saw", "Scale (13): 16'", "Noise Level (14): 0", "Cutoff (15): 2 \u2014 closed to start", "Emphasis (16): 6.5", "Contour (17): 7 \u2014 the squelch", "Filter Mod (18): OFF", "Attack (24): 0", "Decay (25): 2 \u2014 short, snappy", "Sustain (26): 0", "Contour Decay (23): OFF", "Osc Mod (27): OFF", "Trigger Sync: on", "PERFORM: Cutoff 2 \u2192 6 and back; Emphasis 6.5 \u2192 8 at the Drop"]
    },
    arp: { instrument: "Drift", effects: ["Delay"], macros: ["thin sixteenth stabs above the growl \u2014 never busy"], patch: "seqPluck" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["rare fragments"], patch: "modelDLead" }
  },
  dminiFilterMod: {
    lead: {
      instrument: "Behringer D MINI (MIDI out)",
      effects: [],
      external: "D MINI",
      patch: void 0,
      macros: ["Mode (10): Unison", "Detune (11): 5.5", "Waveform (12): Square", "Scale (13): 8'", "Noise Level (14): 0", "Cutoff (15): 4", "Emphasis (16): 5", "Contour (17): 4", "Filter Mod (18): ON \u2014 the showcase: LFO on the ladder", "LFO Rate: 3 \u2014 sync-ish to 1/8 at 130", "LFO Wave: square", "Mod Depth (28): 6", "Attack (24): 0", "Decay (25): 3", "Sustain (26): 4", "Contour Decay (23): OFF", "PERFORM: LFO Rate is your instrument \u2014 1/8 \u2192 1/16 \u2192 free-run"]
    },
    bass: { instrument: "Drift", effects: ["Saturator", "Auto Filter"], macros: ["straight 303 floor under the wobble"], patch: "acidRubber" }
  },
  // ---- D MINI × SEQUENCE STAR (v0.73): the arp IS the D MINI, in every scene ------------
  dminiSeqAcid: {
    arp: {
      instrument: "Behringer D MINI (MIDI out)",
      effects: [],
      external: "D MINI",
      patch: void 0,
      macros: ["Mode (10): Unison", "Detune (11): 5 \u2014 dead centre", "Waveform (12): Saw", "Scale (13): 8'", "Noise Level (14): 0", "Cutoff (15): 2.5 \u2014 start closed", "Emphasis (16): 6.5 \u2014 the squelch edge", "Contour (17): 7", "Filter Mod (18): OFF", "Attack (24): 0", "Decay (25): 2 \u2014 snappy", "Sustain (26): 0", "Contour Decay (23): OFF", "Osc Mod (27): OFF", "Trigger Sync: on", "PERFORM: Cutoff is the arrangement \u2014 2.5 \u2192 6.5 across the song; Emphasis to 8 for the Drop"]
    },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["clean sub, root only \u2014 never competes with the sequence"], patch: "subBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["rare answers in the gaps"], patch: "modelDLead" },
    chords: { instrument: "Drift", effects: ["Reverb"], macros: ["stabs on the offs, filtered dark"], patch: "dubChordStab" }
  },
  dminiSeqBrikha: {
    arp: {
      instrument: "Behringer D MINI (MIDI out)",
      effects: [],
      external: "D MINI",
      patch: void 0,
      macros: ["Mode (10): Octave", "Detune (11): 5.3 \u2014 a breath of beat", "Waveform (12): Saw", "Scale (13): 8'", "Noise Level (14): 0", "Cutoff (15): 3.5", "Emphasis (16): 3 \u2014 round, never squelchy", "Contour (17): 4", "Filter Mod (18): OFF", "Attack (24): 0", "Decay (25): 3.5 \u2014 notes ring into each other", "Sustain (26): 2", "Contour Decay (23): OFF", "Osc Mod (27): OFF", "Trigger Sync: off \u2014 legato steps overlap", "PERFORM: Cutoff 3.5 \u2192 6 in long arcs; Decay (25) is your second dial \u2014 longer = more melody, shorter = more machine"]
    },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["warm, mid-forward \u2014 the emotional floor"], patch: "modelDBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["the melodic answer \u2014 Brikha's second voice"], patch: "modelDLead" },
    chords: { instrument: "Drift", effects: ["Reverb"], macros: ["soulful sustained sevenths, wide"], patch: "dreamKeys" },
    counterMelody: { instrument: "Drift", effects: ["Delay"], macros: ["a shadow of the sequence, an octave up, quiet"], patch: "pwmLead" }
  },
  // ---- Behringer D MINI showcase profiles (v0.67) -------------------------------
  // ONE part per song goes out to the hardware (external — no device is loaded on that
  // track; route its MIDI Out to the D MINI). Macros are panel settings, knobs 0–10,
  // control numbers per the Quick Start Guide — same conventions as your patch booklet.
  dminiBass: {
    bass: {
      instrument: "Behringer D MINI (MIDI out)",
      effects: [],
      external: "D MINI",
      patch: void 0,
      macros: ["Mode (10): Unison", "Detune (11): 5.5 \u2014 a hair of beat", "Waveform (12): Saw", "Cutoff (15): 3.5", "Emphasis (16): 2", "Contour (17): 6 \u2014 the character knob", "Attack (24): 0.5", "Decay (25): 4.5", "Sustain (26): 3", "Contour Decay (23): OFF \u2014 notes stop dead", "Scale (13): 16'", "Noise Level (14): 0", "Filter Mod (18): OFF", "Osc Mod (27): OFF", "Trigger Sync: off"]
    },
    chords: { instrument: "Drift", effects: ["Reverb"], macros: ["soulful stabs behind the hardware"], patch: "dreamKeys" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sparse fragments \u2014 leave the low end to the hardware"], patch: "modelDLead" }
  },
  dminiLead: {
    lead: {
      instrument: "Behringer D MINI (MIDI out)",
      effects: [],
      external: "D MINI",
      patch: void 0,
      macros: ["Mode (10): Unison \u2014 all three VCOs", "Detune (11): 6 \u2014 wide and proud", "Waveform (12): Saw", "Cutoff (15): 6", "Emphasis (16): 4", "Contour (17): 5", "Attack (24): 1", "Decay (25): 5.5", "Sustain (26): 6", "Contour Decay (23): ON \u2014 lines ring", "Scale (13): 8'", "Noise Level (14): 0", "Filter Mod (18): OFF", "Osc Mod (27): ON \u2014 mod wheel = vibrato", "Mod Depth (28): 1"]
    },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["stay out of the lead's way"], patch: "subBass" }
  },
  dminiFilter: {
    arp: {
      instrument: "Behringer D MINI (MIDI out)",
      effects: [],
      external: "D MINI",
      patch: void 0,
      macros: ["Mode (10): Octave", "Detune (11): 5 \u2014 centre", "Waveform (12): Saw", "Cutoff (15): START AT 2 \u2014 the whole song lives in this knob", "Emphasis (16): 5", "Contour (17): 3", "Attack (24): 0", "Decay (25): 3", "Sustain (26): 4", "Contour Decay (23): OFF", "Scale (13): 8'", "Noise Level (14): 0", "Filter Mod (18): OFF", "Osc Mod (27): OFF", "Trigger Sync: off"]
    },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["pulsing floor under the sequence"], patch: "modelDBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["rare long tones over the breathing filter"], patch: "pwmLead" }
  },
  dminiGlide: {
    lead: {
      instrument: "Behringer D MINI (MIDI out)",
      effects: [],
      external: "D MINI",
      patch: void 0,
      macros: ["Mode (10): Unison", "Glide: 4 \u2014 the showcase; legato notes slide", "Waveform (12): Saw", "Cutoff (15): 4.5", "Emphasis (16): 6 \u2014 vocal", "Contour (17): 5.5", "Attack (24): 0.5", "Decay (25): 4", "Sustain (26): 5", "Scale (13): 8'", "Noise Level (14): 0", "Filter Mod (18): OFF", "Osc Mod (27): OFF"]
    },
    bass: { instrument: "Drift", effects: ["Saturator", "Auto Filter"], macros: ["the 303 keeps squelching below"], patch: "acidRubber" }
  },
  dminiRing: {
    lead: {
      instrument: "Behringer D MINI (MIDI out)",
      effects: [],
      external: "D MINI",
      patch: void 0,
      macros: ["Mode (10): RING \u2014 the showcase: metallic inharmonics", "Detune (11): PLAY THIS \u2014 it retunes the ring spectrum", "Waveform (12): Square", "Cutoff (15): 5", "Emphasis (16): 3", "Contour (17): 4", "Attack (24): 0", "Decay (25): 3.5", "Sustain (26): 2", "Send the audio into your Qi delay \u2014 ring + long feedback = dub metal", "Scale (13): 8'", "Noise Level (14): 0", "Filter Mod (18): OFF", "Osc Mod (27): OFF"]
    },
    chords: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["the dub chord answers the ring hits"], patch: "dubChordStab" }
  },
  dminiDrone: {
    bass: {
      instrument: "Behringer D MINI (MIDI out)",
      effects: [],
      external: "D MINI",
      patch: void 0,
      macros: ["Mode (10): Unison", "Detune (11): 5.2 \u2014 slow beating, alive", "Waveform (12): Triangle", "Cutoff (15): 2.5", "Emphasis (16): 4", "Contour (17): 2", "Attack (24): 6 \u2014 swells in", "Decay (25): 8", "Sustain (26): 8", "Contour Decay (23): ON \u2014 everything rings on", "Scale (13): 32'", "Noise Level (14): 0.5 \u2014 air", "Noise Type: pink", "Filter Mod (18): ON \u2014 slow LFO breath", "LFO Rate: 0.5", "LFO Wave: triangle"]
    },
    pad: { instrument: "Drift", effects: ["Reverb"], macros: ["weather above the drone"], patch: "darkDrone" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["distant bell fragments, minutes apart"], patch: "glassBell" }
  },
  dminiPoly: {
    chords: {
      instrument: "Behringer D MINI (MIDI out)",
      effects: [],
      external: "D MINI",
      patch: void 0,
      macros: ["Mode (10): POLY \u2014 3-voice paraphonic, the showcase", "Detune (11): 5", "Waveform (12): Saw", "Cutoff (15): 5", "Emphasis (16): 2", "Contour (17): 4", "Attack (24): 2", "Decay (25): 5", "Sustain (26): 5", "ONE shared envelope for all three voices \u2014 play staccato blocks, not legato lines", "Scale (13): 8'", "Noise Level (14): 0", "Filter Mod (18): OFF", "Osc Mod (27): OFF", "Trigger Sync: on \u2014 chords retrigger together"]
    },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["clean sub under the paraphony"], patch: "subBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["retro topline answering the block chords"], patch: "pwmLead" }
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
    arp: {
      instrument: "Behringer CZ-1 MINI (MIDI out)",
      effects: [],
      external: "CZ-1 MINI",
      patch: void 0,
      macros: [
        "Line Select: 1 (single line \u2014 keep the transient tight for a driving pulse)",
        "DCO 1 \u2014 WF1 / WF2: Square / Resonance I (Saw)",
        "DCW1 LV stage 1 (CC65): START AT 15 \u2014 the whole song lives in this value",
        "DCW1 RA stage 1 (CC73): 85 \u2014 fast open, snappy per hit",
        "DCA1: fast attack, short release (see Patch Booklet: Sequencer Bloop)",
        "Filter Cutoff (CC89): 60, Resonance (CC90): 15",
        "Chorus: OFF \u2014 keep the pulse dry and cutting",
        "PERFORM: DCW1 LV stage 1 (CC65) is your arrangement knob \u2014 15 \u2192 80 across the song. This is the phase-distortion counterpart to the D MINI sequence-stars' Cutoff move: harmonics ADDED instead of subtracted, same dramatic arc."
      ]
    },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["clean sub, root only \u2014 never competes with the sequence"], patch: "subBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["rare answers in the gaps, Jarre-adjacent air"], patch: "pwmLead" },
    chords: { instrument: "Drift", effects: ["Reverb"], macros: ["stabs on the offs, filtered dark"], patch: "dubChordStab" }
  },
  cz1LineStack: {
    chords: {
      instrument: "Behringer CZ-1 MINI (MIDI out)",
      effects: [],
      external: "CZ-1 MINI",
      patch: void 0,
      macros: [
        "Line Select: 1+2 \u2014 the showcase: two phase-distortion lines stacked, not one knob",
        "DCO 1 & 2 \u2014 WF1 / WF2: Saw / Resonance II (Triangle) on both lines",
        "DCW1/2 LV stage 1: ~90, falling to ~35 by SUS (bright strike \u2192 mellow body \u2014 see Patch Booklet: Bright EP)",
        "DCA1/2: fast attack, natural decay, no long tail",
        "Detune Fine (CC12): 6\u201310 \u2014 width from the second line, not a chorus pedal",
        "Filter Cutoff (CC89): 72, Resonance (CC90): 15",
        "Chorus Rate (CC91): 25, Amount (CC92): 20",
        "PERFORM: there's no single arrangement knob here \u2014 the character IS the two-line stack. If you want one live move, ride Chorus Amount (CC92) for width, or nudge Detune Fine (CC12) a few cents for slow beating."
      ]
    },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["warm, stays out of the stack's low-mid"], patch: "subBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sparse answers above the chord voice"], patch: "modelDLead" }
  },
  cz1RingDrift: {
    lead: {
      instrument: "Behringer CZ-1 MINI (MIDI out)",
      effects: [],
      external: "CZ-1 MINI",
      patch: void 0,
      macros: [
        "Line Select: 1+2",
        "DCO 1 & 2 \u2014 WF1 / WF2: Resonance III (Trapezoid) / Double Sine, both lines \u2014 inharmonic, and legal (original CZ hardware would not pair two Resonance waveforms)",
        "Detune Polarity (CC9): 1, OCT (CC10): 0",
        "Detune NOTE (CC11): PLAY THIS \u2014 semitones of dissonance; wide = more clangorous (see Patch Booklet: Ring Mod Metallic)",
        "Detune Fine (CC12): 30 \u2014 extra beating on top of the semitone spread",
        "Filter Cutoff (CC89): 60, Resonance (CC90): 40, LFO Wave: Square, Rate: 30, Depth: 40",
        "Send the audio into your Qi delay / H90 \u2014 the beating plus feedback = dub metal, same trick as the D MINI's Ring mode",
        "PERFORM: Detune NOTE (CC11) is your instrument here \u2014 start near 0 (in tune, hidden) and widen through the song for the metallic showcase."
      ]
    },
    chords: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["the dub chord answers the CZ hits"], patch: "dubChordStab" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["clean sub anchor under the dissonance"], patch: "subBass" }
  },
  // ---- CZ-1 MINI × HOOKS (v0.75): the CZ series' real-world identity was catchy mid-80s
  // pop — E-piano hooks, bell toplines, brass stabs. These four put the hardware on the
  // part that carries the earworm, with hook/phrase/callResponse driving the writing.
  cz1TineHook: {
    lead: {
      instrument: "Behringer CZ-1 MINI (MIDI out)",
      effects: [],
      external: "CZ-1 MINI",
      patch: void 0,
      macros: [
        "Line Select: 1+2 \u2014 tine strike on line 1, body on line 2 (see Patch Booklet: Bright EP)",
        "DCO 1 & 2 \u2014 WF1 / WF2: Saw / Resonance II (Triangle)",
        "DCW1 LV stage 1 (CC65): 95, falling to ~35 by SUS \u2014 the bright-to-mellow collapse IS the tine",
        "DCW1 RA stage 1 (CC73): 90 \u2014 instant strike",
        "DCA1: fast attack, medium decay, short release \u2014 every hook note lands and clears",
        "Detune Fine (CC12): 8 \u2014 width, not chorus",
        "Filter Cutoff (CC89): 72, Resonance (CC90): 18",
        "Chorus Rate (CC91): 25, Amount (CC92): 20",
        "PERFORM: nothing during the hook \u2014 let it be recognisable every time. Between hooks, pull Filter Cutoff (CC89) to 45 for the Breakdown and open it back at the Lift."
      ]
    },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["round 80s sub, follows the root"], patch: "subBass" },
    chords: { instrument: "Analog", effects: ["Chorus-Ensemble", "Reverb"], macros: ["OB-X style pads under the tine hook"], patch: "obxBrass" },
    pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["wide glassy bed for the Breakdown"], patch: "warmPad" }
  },
  cz1BellHook: {
    lead: {
      instrument: "Behringer CZ-1 MINI (MIDI out)",
      effects: [],
      external: "CZ-1 MINI",
      patch: void 0,
      macros: [
        "Line Select: 1+2 \u2014 detuned for shimmer (see Patch Booklet: Glass Bell)",
        "DCO 1 & 2 \u2014 WF1 / WF2: Resonance II (Triangle) / Double Sine",
        "DCW1 LV stage 1 (CC65): 99 \u2192 20 by SUS \u2014 full inharmonic strike, then a clean ring",
        "DCA1: instant attack, LONG END rate \u2014 the ring is the hook's sustain",
        "Detune Fine (CC12): 12 \u2014 shimmer, just short of clang",
        "Filter Cutoff (CC89): 85, Resonance (CC90): 8",
        "Chorus Rate (CC91): 15, Amount (CC92): 18",
        "PERFORM: Detune Fine (CC12) 12 \u2192 4 into the Breakdown (the bell goes pure and exposed), back to 12 at the Drop. Send to your H90 hall \u2014 this hook is meant to be washed."
      ]
    },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["trance sub, tight and rolling"], patch: "subBass" },
    chords: { instrument: "Analog", effects: ["Chorus-Ensemble", "Reverb"], macros: ["sidechained anthem stabs"], patch: "stab" },
    arp: { instrument: "Drift", effects: ["Delay"], macros: ["16th pluck underneath, filtered dark so the bell owns the top"], patch: "seqPluck" }
  },
  cz1BrassStab: {
    chords: {
      instrument: "Behringer CZ-1 MINI (MIDI out)",
      effects: [],
      external: "CZ-1 MINI",
      patch: void 0,
      macros: [
        "Line Select: 1+2 \u2014 small-section width (see Patch Booklet: Swell Stab)",
        "DCO 1 & 2 \u2014 WF1 / WF2: Saw / Square",
        "DCW1 LV stage 1 (CC65): 90; DCW1 RA stage 1 (CC73): 25 \u2014 SLOW open: the brass tongue",
        "DCA1: medium attack, held sustain, short release \u2014 a stab, not a pad",
        "Detune Fine (CC12): 14 \u2014 the section",
        "Filter Cutoff (CC89): 80, Resonance (CC90): 12",
        "Chorus Rate (CC91): 30, Amount (CC92): 25",
        "PERFORM: DCW1 RA stage 1 (CC73) is the character \u2014 25 for a swell stab, 70 for a hard 80s hit. Switch between them per section; the hook is the rhythm of the stabs, so keep the notes identical."
      ]
    },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["singable topline over the stabs"], patch: "pwmLead" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["octave-jumping synthwave bass"], patch: "subBass" }
  },
  cz1ReedTopline: {
    lead: {
      instrument: "Behringer CZ-1 MINI (MIDI out)",
      effects: [],
      external: "CZ-1 MINI",
      patch: void 0,
      macros: [
        "Line Select: 1 (see Patch Booklet: Reed Lead)",
        "DCO 1 \u2014 WF1 / WF2: Resonance III (Trapezoid) / Saw \u2014 the nasal formant",
        "DCW1 LV stage 1 (CC65): 70, SUS 60 \u2014 steady, present, no swell",
        "DCA1: quick attack, held sustain, medium release \u2014 legato-friendly",
        "Vibrato Wave (CC2): Triangle, Rate (CC3): 45, Depth (CC6): 20, Delay (CC7): 35 \u2014 the delayed wobble is what makes it a player, not a preset",
        "Filter Cutoff (CC89): 75, Resonance (CC90): 15",
        "PERFORM: Vibrato Depth (CC6) is your expression \u2014 20 on the verse phrases, 35 on the hook's held notes. Mod wheel (CC1) if you'd rather play it."
      ]
    },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["warm, mid-forward floor"], patch: "modelDBass" },
    chords: { instrument: "Drift", effects: ["Reverb"], macros: ["soulful sevenths answering the reed"], patch: "dreamKeys" },
    counterMelody: { instrument: "Operator", effects: ["Delay"], macros: ["bell answer, low velocity, behind the reed"], patch: "bell" }
  },
  // Jarre-style airy analog lead over a sequence.
  jarreAirLead: {
    lead: { instrument: "Drift", effects: ["Reverb", "Delay"], macros: ["airy PWM lead (Oxyg\xE8ne)", "Reverb: wide", "Delay: sync"], patch: "pwmLead" },
    pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["glassy cosmic pad", "Chorus: wide", "Reverb: huge"], patch: "warmPad" }
  },
  // Jarre, the SEQUENCE side (Équinoxe / Magnetic Fields / Chronologie): a bright staccato
  // ostinato, Eminent-through-phaser strings, CS-80-style brass chords, PWM lead on top.
  jarreSequence: {
    arp: { instrument: "Drift", effects: ["Delay"], macros: ["staccato ARP-2600 style pluck, short gate", "Delay: 1/8 dotted, low feedback \u2014 the Jarre echo"], patch: "seqPluck" },
    lead: { instrument: "Drift", effects: ["Reverb", "Delay"], macros: ["airy PWM lead, sings in 4-bar phrases", "Reverb: wide", "Delay: sync"], patch: "pwmLead" },
    pad: { instrument: "Drift", effects: ["Phaser", "Reverb"], macros: ["Eminent strings \u2014 the PHASER is the sound"], patch: "eminentStrings" },
    chords: { instrument: "Drift", effects: ["Chorus-Ensemble", "Reverb"], macros: ["CS-80-style brass swells on the changes"], patch: "cs80Brass" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["round, octave-jumping sequencer bass"], patch: "subBass" }
  },
  // Emotional Detroit — FM bells + warm sub.
  detroitEmotional: {
    lead: { instrument: "Operator", effects: ["Chorus-Ensemble", "Delay", "Reverb"], macros: ["FM bell, singing", "Chorus: ensemble", "Delay: 1/8", "Reverb: lush"], patch: "bell" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["warm round sub", "Saturator: gentle"], patch: "subBass" },
    chords: { instrument: "Analog", effects: ["Chorus-Ensemble", "Reverb"], macros: ["soulful 7th stabs", "sidechain"], patch: "stab" },
    arp: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["emotional shimmer seq"], patch: "crystalPluck" }
  },
  // Berlin analog sequence — the arp/seq is the star.
  berlinAnalogSeq: {
    arp: { instrument: "Drift", effects: ["Auto Filter", "Delay", "Reverb"], macros: ["THE sequence", "Auto Filter: slow ride", "Resonance: mid-high", "Delay: 1/16"], patch: "seqPluck" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["pulsing analog bass", "mono"], patch: "modelDBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sparse fragments", "Delay: dotted"], patch: "modelDLead" }
  },
  // Dub-techno with the chord front and centre.
  dubChordHeavy: {
    chords: { instrument: "Analog", effects: ["Auto Filter", "Delay", "Reverb"], macros: ["THE dub chord", "Delay: long feedback", "Reverb: 100%", "Filter: down"], patch: "wash" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["dub pedal weight"], patch: "taurusBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sparse dark fragments"], patch: "moogLead" }
  },
  // Soft glass ambient.
  glassAmbient: {
    pad: { instrument: "Wavetable", effects: ["Reverb", "Delay"], macros: ["frozen glass pad", "Attack: 4s", "Reverb: cathedral"], patch: "warmPad" },
    lead: { instrument: "Tension", effects: ["Reverb", "Delay"], macros: ["distant bowed echoes", "Reverb: infinite"], patch: "tensionBow" }
  },
  // Cosmic floating sequence.
  cosmicFloat: {
    arp: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["gentle floating seq", "Delay: 1/8", "Reverb: wide"], patch: "seqPluck" },
    pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["soft orbital pad"], patch: "warmPad" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["thin floating lead"], patch: "iceLead" },
    counterMelody: { instrument: "Drift", effects: ["Delay"], macros: ["distant whistle answers"], patch: "sineWhistle" }
  },
  // Bright neon synthwave.
  synthwaveNeon: {
    lead: { instrument: "Drift", effects: ["Reverb", "Delay"], macros: ["bright saw lead", "gated reverb", "Delay: sync"], patch: "superLead" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["octave synth bass"], patch: "octaveRunner" },
    pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["80s poly", "Chorus: wide"], patch: "junoPad" }
  },
  // Warm velvet deep house.
  deepHouseVelvet: {
    chords: { instrument: "Analog", effects: ["Chorus-Ensemble", "Reverb"], macros: ["warm Rhodes 7ths", "swing"], patch: "keys" },
    pad: { instrument: "Wavetable", effects: ["Chorus-Ensemble", "Reverb"], macros: ["velvet pad", "sidechain"], patch: "junoPad" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["soft whistle motif"], patch: "sineWhistle" }
  },
  // Glassy uplifting trance.
  tranceGlass: {
    lead: { instrument: "Drift", effects: ["Reverb", "Delay"], macros: ["supersaw, big", "sidechain", "Reverb: huge"], patch: "superLead" },
    pad: { instrument: "Wavetable", effects: ["Reverb"], macros: ["wide glassy pad (OB-Xa)"], patch: "obPad" },
    arp: { instrument: "Drift", effects: ["Delay"], macros: ["crystal 16ths", "sidechain"], patch: "crystalPluck" }
  },
  // Bright emotional breaks.
  brightBreaks: {
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["92 hoover hook", "Delay: 1/8"], patch: "hooverRave" },
    chords: { instrument: "Analog", effects: ["Chorus-Ensemble", "Reverb"], macros: ["bright major chords"], patch: "stab" },
    bass: { instrument: "Drift", effects: ["Saturator", "Auto Filter"], macros: ["reese undertow"], patch: "reeseBass" },
    arp: { instrument: "Drift", effects: ["Delay"], macros: ["crystal fragments"], patch: "crystalPluck" }
  },
  // Metallic chrome acid — 303 bass under FM-bell fragments.
  acidChrome: {
    bass: { instrument: "Drift", effects: ["Saturator", "Auto Filter"], macros: ["303 squelch, chrome-bright", "Saturator: hard", "Auto Filter: ride the res"], patch: "acid303" },
    arp: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["tight 16th seq", "Delay: 1/16"], patch: "seqPluck" },
    counterMelody: { instrument: "Drift", effects: ["Delay"], macros: ["zap answers"], patch: "laserZap" },
    lead: { instrument: "Operator", effects: ["Delay", "Reverb"], macros: ["metallic bell fragments", "Reverb: plate"], patch: "bell" }
  },
  // Deep dub-acid — 303 pressure inside a chord-heavy fog.
  acidDub: {
    bass: { instrument: "Drift", effects: ["Saturator", "Auto Filter"], macros: ["slow 303, low cutoff", "opens over the night"], patch: "acidRubber" },
    chords: { instrument: "Analog", effects: ["Auto Filter", "Delay", "Reverb"], macros: ["THE dub chord", "Delay: long feedback"], patch: "wash" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sparse dark fragments"], patch: "moogLead" },
    pad: { instrument: "Drift", effects: ["Reverb"], macros: ["dark fog pad"], patch: "darkDrone" }
  },
  // Industrial sequence — corroded stabs over a deep pulse low end (Rust Belt).
  industrialSeq: {
    chords: { instrument: "Drift", effects: ["Saturator", "Delay"], macros: ["corroded stab", "Saturator: grind"], patch: "industrialStab" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["deep pulse pressure"], patch: "deepPulseBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sparks over the floor"], patch: "moogLead" },
    arp: { instrument: "Drift", effects: ["Auto Filter", "Delay"], macros: ["relentless 16ths"], patch: "seqPluck" }
  },
  // Jungle/breaks reese — reese low end under crystalline fragments (Jungle Glass, Storm Warning).
  jungleReese: {
    bass: { instrument: "Drift", effects: ["Saturator", "Auto Filter"], macros: ["THE reese", "Auto Filter: slow sweep"], patch: "reeseBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["crystal fragments"], patch: "crystalPluck" },
    chords: { instrument: "Drift", effects: ["Reverb"], macros: ["airy choir bed"], patch: "glassChoir" },
    pad: { instrument: "Drift", effects: ["Reverb"], macros: ["thin high pad"], patch: "glassChoir" }
  },
  // Organ house — two-sine drawbar chords + whistle lead (Morning Ritual, Starlight Disco).
  organHouse: {
    chords: { instrument: "Drift", effects: ["Chorus-Ensemble", "Compressor"], macros: ["organ gate chords", "sidechain"], patch: "houseOrgan" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["sine whistle motif"], patch: "sineWhistle" },
    pad: { instrument: "Drift", effects: ["Chorus-Ensemble", "Reverb"], macros: ["soft key bed"], patch: "dreamKeys" }
  },
  // Detroit electro-funk — clav comping + rubbery electro pluck (Midnight Funk).
  electroFunk: {
    chords: { instrument: "Drift", effects: ["Chorus-Ensemble", "Compressor"], macros: ["narrow-pulse clav comping", "tight and dry"], patch: "funkClav" },
    counterMelody: { instrument: "Drift", effects: ["Delay"], macros: ["rubbery electro pluck", "Delay: 1/8"], patch: "plasticPluck" },
    bass: { instrument: "Drift", effects: ["Saturator"], macros: ["round funk sub"], patch: "subBass" },
    lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["bell motif, singing"], patch: "glassBell" },
    arp: { instrument: "Drift", effects: ["Delay"], macros: ["rubbery 16ths"], patch: "plasticPluck" }
  }
};
var SOUND_PROFILE_IDS = Object.keys(SOUND_PROFILES);
var MONO_PATCHES = new Set(
  Object.entries(INSTRUMENT_PATCHES).filter(([, moves]) => moves.some((m) => m.aliases[0].includes("voice mode") && (m.item === "Mono" || m.item === "Unison"))).map(([id]) => id)
);
var PATCH_DISPLAY_NAMES = {
  acid303: "Acid 303",
  acidRubber: "Rubber Acid",
  moogLead: "Moog Lead",
  subBass: "Sub Bass",
  seqPluck: "Seq Pluck",
  pwmLead: "PWM Lead",
  superLead: "Supersaw",
  driftPad: "Drift Pad",
  glassBell: "Glass Bell",
  hooverRave: "Hoover",
  dreamKeys: "Dream Keys",
  darkDrone: "Dark Drone",
  feltEP: "Felt EP",
  plasticPluck: "Plastic Pluck",
  cosmicSweep: "Cosmic Sweep",
  funkClav: "Funk Clav",
  iceLead: "Ice Lead",
  warmBrass: "Warm Brass",
  crystalPluck: "Crystal Pluck",
  deepPulseBass: "Pulse Bass",
  reeseBass: "Reese",
  houseOrgan: "House Organ",
  sineWhistle: "Sine Whistle",
  tapeStrings: "Tape Strings",
  laserZap: "Laser Zap",
  glassChoir: "Glass Choir",
  industrialStab: "Industrial Stab",
  octaveRunner: "Octave Runner",
  junoPad: "Juno Pad",
  obPad: "OB Pad",
  warmPad: "Warm Pad",
  stab: "Stab",
  wash: "Dub Wash",
  keys: "Rhodes Keys",
  bell: "FM Bell",
  collisionMallet: "Mallet",
  tensionBow: "Bowed",
  electricRhodes: "Electric Piano",
  modelDBass: "Model D Bass",
  modelDLead: "Model D Lead",
  obxBrass: "OB-X Brass",
  prophet5Pad: "Prophet Pad",
  juno106Pad: "Juno Pad",
  sh101Bass: "SH-101 Bass",
  cs80Brass: "CS-80 Brass",
  jupiter8Pad: "Jupiter Pad",
  proOneLead: "Pro-One Lead",
  eminentStrings: "Eminent Strings",
  ms20Lead: "MS-20 Lead",
  taurusBass: "Taurus Sub",
  dubChordStab: "Dub Chord Stab",
  cathedralOrgan: "Cathedral Organ",
  duneFlute: "Dune Flute",
  wireLead: "Wire Lead",
  neonPluck: "Neon Pluck",
  abyssBass: "Abyss Bass",
  rubberBand: "Rubber Band",
  staticHaze: "Static Haze"
};
var PATCH_ROLES = {
  acid303: "bass",
  acidRubber: "bass",
  subBass: "bass",
  reeseBass: "bass",
  deepPulseBass: "bass",
  octaveRunner: "bass",
  abyssBass: "bass",
  rubberBand: "bass",
  modelDBass: "bass",
  sh101Bass: "bass",
  taurusBass: "bass",
  moogLead: "lead",
  pwmLead: "lead",
  superLead: "lead",
  hooverRave: "lead",
  iceLead: "lead",
  sineWhistle: "lead",
  laserZap: "lead",
  wireLead: "lead",
  duneFlute: "lead",
  modelDLead: "lead",
  proOneLead: "lead",
  ms20Lead: "lead",
  seqPluck: "seq",
  crystalPluck: "seq",
  plasticPluck: "seq",
  glassBell: "seq",
  neonPluck: "seq",
  driftPad: "pad",
  darkDrone: "pad",
  tapeStrings: "pad",
  glassChoir: "pad",
  cosmicSweep: "pad",
  warmPad: "pad",
  junoPad: "pad",
  obPad: "pad",
  staticHaze: "pad",
  wash: "pad",
  prophet5Pad: "pad",
  juno106Pad: "pad",
  jupiter8Pad: "pad",
  eminentStrings: "pad",
  dreamKeys: "keys",
  funkClav: "keys",
  houseOrgan: "keys",
  warmBrass: "keys",
  feltEP: "keys",
  industrialStab: "keys",
  dubChordStab: "keys",
  cathedralOrgan: "keys",
  stab: "keys",
  keys: "keys",
  obxBrass: "keys",
  cs80Brass: "keys",
  electricRhodes: "keys",
  bell: "seq",
  collisionMallet: "seq",
  tensionBow: "lead"
};
var FX_BY_ROLE = {
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
  synth: { delayWet: 0.18, delayFeedback: 0.3, delaySyncL: 2, delaySyncR: 3, reverbWet: 0.12, reverbDecay: 1200, reverbSize: 80 }
};
var FX_OVERRIDES = {
  dubChordStab: { delayWet: 0.42, delayFeedback: 0.62, delaySyncL: 3, delaySyncR: 4, reverbWet: 0.42, reverbDecay: 5200, reverbSize: 120 },
  darkDrone: { delayWet: 0.3, delayFeedback: 0.55, delaySyncL: 4, delaySyncR: 3, reverbWet: 0.45, reverbDecay: 6e3, reverbSize: 120 },
  wash: { delayWet: 0.38, delayFeedback: 0.6, delaySyncL: 4, delaySyncR: 3, reverbWet: 0.5, reverbDecay: 6e3, reverbSize: 120 },
  cosmicSweep: { delayWet: 0.28, delayFeedback: 0.5, delaySyncL: 4, delaySyncR: 3, reverbWet: 0.45, reverbDecay: 5e3, reverbSize: 120 },
  staticHaze: { delayWet: 0.2, delayFeedback: 0.4, delaySyncL: 4, delaySyncR: 4, reverbWet: 0.5, reverbDecay: 6e3, reverbSize: 120 },
  glassChoir: { delayWet: 0.22, delayFeedback: 0.4, delaySyncL: 4, delaySyncR: 3, reverbWet: 0.42, reverbDecay: 4600, reverbSize: 115 },
  glassBell: { delayWet: 0.3, delayFeedback: 0.4, delaySyncL: 3, delaySyncR: 1, reverbWet: 0.28, reverbDecay: 2600, reverbSize: 100 },
  crystalPluck: { delayWet: 0.3, delayFeedback: 0.4, delaySyncL: 1, delaySyncR: 3, reverbWet: 0.24, reverbDecay: 2200, reverbSize: 95 },
  seqPluck: { delayWet: 0.28, delayFeedback: 0.38, delaySyncL: 1, delaySyncR: 3, reverbWet: 0.2, reverbDecay: 1800, reverbSize: 90 },
  hooverRave: { delayWet: 0.24, delayFeedback: 0.34, delaySyncL: 3, delaySyncR: 2, reverbWet: 0.2, reverbDecay: 2e3, reverbSize: 95 },
  laserZap: { delayWet: 0.34, delayFeedback: 0.45, delaySyncL: 1, delaySyncR: 3, reverbWet: 0.2, reverbDecay: 1800, reverbSize: 90 },
  iceLead: { delayWet: 0.3, delayFeedback: 0.42, delaySyncL: 3, delaySyncR: 2, reverbWet: 0.34, reverbDecay: 3400, reverbSize: 110 },
  sineWhistle: { delayWet: 0.3, delayFeedback: 0.4, delaySyncL: 3, delaySyncR: 2, reverbWet: 0.3, reverbDecay: 2800, reverbSize: 105 },
  duneFlute: { delayWet: 0.26, delayFeedback: 0.38, delaySyncL: 3, delaySyncR: 2, reverbWet: 0.36, reverbDecay: 3600, reverbSize: 110 },
  // a 303 wants a touch of space but never a rhythmic echo fighting the line
  acid303: { delayWet: 0, reverbWet: 0.08, reverbDecay: 900 },
  acidRubber: { delayWet: 0, reverbWet: 0.1, reverbDecay: 1100 }
};
function patchFx(patchId) {
  const base = FX_BY_ROLE[patchRole(patchId)] ?? FX_BY_ROLE.synth;
  const over = patchId ? FX_OVERRIDES[patchId] : void 0;
  return { ...base, ...over ?? {} };
}
var revb = (wet, decayMs, size, preDelay = 2.5) => ({
  kind: "reverb",
  // MixDirect IS the Dry/Wet knob and holds the WET amount — measured from Live exports:
  // 45% wet -> 0.45, 12% wet -> 0.12. (An earlier reading of "dry = 1 - wet" came from an
  // export where the knob was never touched; 0.55 was merely the default.)
  // DecayTime is in MILLISECONDS (1.2 s -> 1200); Live's minimum is 200 ms.
  params: {
    Enabled: true,
    MixDirect: +wet.toFixed(4),
    MixReflect: 1,
    MixDiffuse: 1,
    DecayTime: Math.max(200, decayMs),
    RoomSize: size,
    PreDelay: preDelay,
    StereoSeparation: 100
  }
});
var dly = (wet, fb, l, r) => ({
  kind: "delay",
  // SyncedSixteenth values are STRING enums ("1".."16"); 1=1/16, 2=1/8, 3=1/8 dotted, 4=1/4.
  // DelayLine_Link MUST be false or the right side just follows the left and the R value is
  // ignored (a real Live export with L=3/R=4 still had Link=true — the R was never heard).
  params: {
    Enabled: true,
    DryWet: wet,
    Feedback: fb,
    DelayLine_SyncL: true,
    DelayLine_SyncR: true,
    DelayLine_Link: false,
    DelayLine_SyncedSixteenthL: String(l),
    DelayLine_SyncedSixteenthR: String(r),
    DelayLine_PingPong: l !== r,
    Filter_On: true,
    Filter_Frequency: 1e3,
    Filter_Bandwidth: 8
  }
});
var sat = (driveDb, type = "Analog Clip", wet = 1, outDb = 0) => ({
  kind: "saturator",
  // Measured from a Live export: the Drive knob writes PreDrive (dB) and Output writes PostDrive
  // (dB) — BaseDrive stayed at 0 when Drive was set to +12, so it is NOT the Drive control.
  // Drive is compensated at the output so a hotter patch doesn't just get louder.
  params: {
    Enabled: true,
    PreDrive: driveDb,
    PostDrive: outDb || +(-driveDb * 0.5).toFixed(2),
    Type: type,
    DryWet: wet,
    ColorOn: true
  }
});
var cho = (mode, amount, rate, wet) => ({
  kind: "chorus",
  params: { Enabled: true, Mode: mode, Amount: amount, Rate: rate, DryWet: wet, Width: 1 }
});
var phs = (mode, amount, rateHz, fb, wet) => ({
  kind: "phaser",
  params: {
    Enabled: true,
    Mode: mode,
    Modulation_Amount: amount,
    Modulation_Frequency: rateHz,
    Feedback: fb,
    DryWet: wet
  }
});
var rdx = (bits, sampleRate, wet) => ({
  kind: "redux2",
  params: { Enabled: true, BitDepth: bits, SampleRate: sampleRate, DryWet: wet }
});
var eqDb = (db) => +Math.pow(10, db / 20).toFixed(4);
var eq = (lowDb, midDb, highDb, midFreq = 1500) => ({
  kind: "channelEq",
  params: {
    Enabled: true,
    LowShelfGain: eqDb(lowDb),
    MidGain: eqDb(midDb),
    HighShelfGain: eqDb(highDb),
    MidFrequency: midFreq,
    HighpassOn: false,
    Gain: 1
  }
});
var INSERTS_BY_ROLE = {
  // basses: drive for weight, EQ to keep the sub defined — never a delay (it smears the low end)
  bass: [sat(6), eq(2, -2, 0, 900)],
  lead: [revb(0.18, 1800, 95), dly(0.26, 0.36, 3, 2)],
  seq: [revb(0.16, 1600, 90), dly(0.24, 0.34, 1, 3)],
  pad: [cho("Ensemble", 0.6, 0.6, 0.4), revb(0.3, 3200, 110)],
  keys: [revb(0.14, 1400, 85), dly(0.2, 0.3, 2, 3)],
  synth: [revb(0.12, 1200, 80), dly(0.18, 0.3, 2, 3)]
};
var INSERTS_BY_PATCH = {
  // dub: the echo IS the instrument
  dubChordStab: [dly(0.42, 0.62, 3, 4), revb(0.42, 5200, 120, 15)],
  darkDrone: [dly(0.3, 0.55, 4, 3), revb(0.45, 6e3, 120, 20)],
  wash: [dly(0.38, 0.6, 4, 3), revb(0.5, 6e3, 120, 20)],
  // ambient/texture
  cosmicSweep: [cho("Ensemble", 0.7, 0.4, 0.5), revb(0.45, 5e3, 120, 12)],
  staticHaze: [rdx(12, 22050, 0.35), revb(0.5, 6e3, 120, 15)],
  // tape-grade bit reduction
  glassChoir: [cho("Ensemble", 0.5, 0.5, 0.35), revb(0.42, 4600, 115)],
  tapeStrings: [cho("Classic", 0.55, 0.8, 0.4), revb(0.3, 3e3, 105)],
  // 303s: a touch of space, never an echo fighting the line
  acid303: [sat(9), revb(0.08, 900, 60)],
  acidRubber: [sat(7), revb(0.1, 1100, 65)],
  // classic studies whose effect IS the sound
  juno106Pad: [cho("Ensemble", 0.75, 0.5, 0.5), revb(0.26, 2600, 105)],
  // the Juno chorus, not optional
  eminentStrings: [phs("Phaser", 0.7, 0.12, 0.35, 0.5), revb(0.3, 3e3, 110)],
  // Oxygène is the phaser
  ms20Lead: [sat(11, "Digital Clip"), dly(0.24, 0.36, 3, 2)],
  // the MS-20 bites
  modelDBass: [sat(7), eq(2, -1, -2, 850)],
  modelDLead: [revb(0.16, 1500, 90), dly(0.22, 0.34, 3, 2)],
  sh101Bass: [sat(8), eq(2, 1, 0, 950)],
  taurusBass: [sat(4), eq(4, -4, -9, 650)],
  // pedals: all floor, no top
  proOneLead: [revb(0.18, 1700, 92), dly(0.24, 0.36, 3, 2)],
  obxBrass: [cho("Classic", 0.35, 0.7, 0.25), revb(0.22, 2e3, 95)],
  cs80Brass: [cho("Ensemble", 0.45, 0.4, 0.3), revb(0.3, 3200, 110)],
  prophet5Pad: [cho("Classic", 0.5, 0.5, 0.35), revb(0.32, 3400, 110)],
  jupiter8Pad: [cho("Ensemble", 0.6, 0.35, 0.45), revb(0.36, 4e3, 115)],
  // character voices
  hooverRave: [phs("Phaser", 0.55, 0.25, 0.4, 0.35), revb(0.2, 2e3, 95)],
  reeseBass: [sat(10), phs("Phaser", 0.4, 0.12, 0.3, 0.3)],
  // the classic reese phase-swirl
  industrialStab: [sat(12, "Digital Clip"), rdx(8, 16e3, 0.4)],
  plasticPluck: [rdx(10, 24e3, 0.3), dly(0.24, 0.34, 1, 3)],
  funkClav: [phs("Phaser", 0.35, 0.5, 0.25, 0.3), dly(0.2, 0.3, 2, 3)],
  subBass: [sat(4), eq(3, -3, -6, 800)],
  // sub: lift lows, cut the top
  abyssBass: [sat(3), eq(4, -4, -8, 700)],
  deepPulseBass: [sat(5), eq(2, -2, -3, 850)],
  rubberBand: [sat(8), eq(1, 2, 0, 1200)],
  octaveRunner: [sat(7), eq(1, 0, 1, 1e3)],
  laserZap: [dly(0.34, 0.45, 1, 3), revb(0.2, 1800, 90)],
  glassBell: [dly(0.3, 0.4, 3, 1), revb(0.28, 2600, 100)],
  crystalPluck: [dly(0.3, 0.4, 1, 3), revb(0.24, 2200, 95)],
  iceLead: [revb(0.34, 3400, 110), dly(0.3, 0.42, 3, 2)],
  duneFlute: [cho("Classic", 0.4, 0.7, 0.3), revb(0.36, 3600, 110)],
  sineWhistle: [revb(0.3, 2800, 105), dly(0.3, 0.4, 3, 2)],
  houseOrgan: [cho("Ensemble", 0.5, 0.9, 0.35), revb(0.2, 1600, 85)],
  dreamKeys: [cho("Classic", 0.45, 0.6, 0.3), revb(0.22, 2e3, 95)],
  feltEP: [revb(0.18, 1400, 60, 8)],
  // close room, a touch of pre-delay = "in the room"
  warmBrass: [cho("Ensemble", 0.5, 0.5, 0.3), revb(0.26, 2400, 100)],
  electricRhodes: [cho("Classic", 0.5, 0.7, 0.35), revb(0.2, 1800, 90)]
};
var MOVE_FX_TO_LIVE_DEVICE = {
  reverb: "Reverb",
  delay: "Delay",
  saturator: "Saturator",
  chorus: "Chorus-Ensemble",
  phaser: "Phaser-Flanger",
  redux2: "Redux",
  channelEq: "Channel EQ"
};
function patchLiveEffects(patchId) {
  return patchInserts(patchId).map((i) => MOVE_FX_TO_LIVE_DEVICE[i.kind]).filter(Boolean);
}
function patchInserts(patchId) {
  const chain = (patchId ? INSERTS_BY_PATCH[patchId] : void 0) ?? INSERTS_BY_ROLE[patchRole(patchId)] ?? INSERTS_BY_ROLE.synth;
  return chain.slice(0, 2);
}
var FX_PRIMARY = {
  reverb: { param: "MixDirect", name: "Space" },
  delay: { param: "DryWet", name: "Echo" },
  saturator: { param: "PreDrive", name: "Drive" },
  chorus: { param: "Amount", name: "Width" },
  phaser: { param: "Modulation_Amount", name: "Sweep" },
  redux2: { param: "BitDepth", name: "Crush" },
  channelEq: { param: "HighShelfGain", name: "Tone" }
};
var DRIFT_MACROS_BY_ROLE = {
  bass: [
    { name: "Cutoff", device: "drift", param: "Filter_Frequency" },
    { name: "Reso", device: "drift", param: "Filter_Resonance" },
    { name: "Decay", device: "drift", param: "Envelope1_Decay" },
    { name: "Env Mod", device: "drift", param: "Filter_ModAmount1" },
    { name: "Glide", device: "drift", param: "Global_Glide" },
    { name: "Sub", device: "drift", param: "Mixer_OscillatorGain2" }
  ],
  lead: [
    { name: "Cutoff", device: "drift", param: "Filter_Frequency" },
    { name: "Reso", device: "drift", param: "Filter_Resonance" },
    { name: "Attack", device: "drift", param: "Envelope1_Attack" },
    { name: "Release", device: "drift", param: "Envelope1_Release" },
    { name: "Detune", device: "drift", param: "Oscillator2_Detune" },
    { name: "Vibrato", device: "drift", param: "Lfo_Amount" }
  ],
  seq: [
    { name: "Cutoff", device: "drift", param: "Filter_Frequency" },
    { name: "Reso", device: "drift", param: "Filter_Resonance" },
    { name: "Decay", device: "drift", param: "Envelope1_Decay" },
    { name: "Env Mod", device: "drift", param: "Filter_ModAmount1" },
    { name: "Shape", device: "drift", param: "Oscillator1_Shape" },
    { name: "Detune", device: "drift", param: "Oscillator2_Detune" }
  ],
  pad: [
    { name: "Cutoff", device: "drift", param: "Filter_Frequency" },
    { name: "Attack", device: "drift", param: "Envelope1_Attack" },
    { name: "Release", device: "drift", param: "Envelope1_Release" },
    { name: "Reso", device: "drift", param: "Filter_Resonance" },
    { name: "Detune", device: "drift", param: "Oscillator2_Detune" },
    { name: "Drift", device: "drift", param: "Lfo_Rate" }
  ],
  keys: [
    { name: "Cutoff", device: "drift", param: "Filter_Frequency" },
    { name: "Reso", device: "drift", param: "Filter_Resonance" },
    { name: "Decay", device: "drift", param: "Envelope1_Decay" },
    { name: "Release", device: "drift", param: "Envelope1_Release" },
    { name: "Shape", device: "drift", param: "Oscillator1_Shape" },
    { name: "Detune", device: "drift", param: "Oscillator2_Detune" }
  ]
};
function patchMacros(patchId) {
  const role = patchRole(patchId);
  const base = DRIFT_MACROS_BY_ROLE[role] ?? DRIFT_MACROS_BY_ROLE.lead;
  const out = [...base];
  for (const ins of patchInserts(patchId)) {
    const p = FX_PRIMARY[ins.kind];
    if (p) out.push({ name: p.name, device: ins.kind, param: p.param });
  }
  return out.slice(0, 8);
}
var TRACK_PATCH_SEP = " \u2014 ";
function trackNameForPatch(baseName, patchId) {
  const nice = patchId ? PATCH_DISPLAY_NAMES[patchId] : void 0;
  return nice ? `${baseName}${TRACK_PATCH_SEP}${nice}` : baseName;
}
function trackBaseName(name) {
  const i = (name || "").indexOf(TRACK_PATCH_SEP);
  return i > 0 ? name.slice(0, i) : name || "";
}
function patchRole(patchId) {
  return patchId && PATCH_ROLES[patchId] || "synth";
}
function rackFileName(patchId) {
  if (!patchId || !INSTRUMENT_PATCHES[patchId]) return void 0;
  const isDrift = INSTRUMENT_PATCHES[patchId].some((m) => m.aliases[0] === "osc 1 wave" || m.aliases[0] === "voice mode");
  if (!isDrift) return void 0;
  const nice = patchDisplayName(patchId);
  const slug = nice.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${patchRole(patchId)}-${slug}`;
}
function patchDisplayName(patchId) {
  if (!patchId) return "\u2014";
  return PATCH_DISPLAY_NAMES[patchId] ?? patchId;
}
var MOVE_RECIPES = {
  lead: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["Drift lead", "Filter Freq: opens", "Delay: 1/8 dotted", "Reverb: tail"], patch: "pwmLead" },
  bass: { instrument: "Drift", effects: ["Saturator"], macros: ["Drift sub", "Filter Freq: low", "Amp Decay: tight", "mono"], patch: "subBass" },
  seq: { instrument: "Drift", effects: ["Delay", "Reverb"], macros: ["Drift sequence pluck", "Delay: 1/16", "Reverb: tail fills the gaps", "Filter: ride it live"], patch: "seqPluck" },
  chords: { instrument: "Drift", effects: ["Chorus-Ensemble", "Reverb"], macros: ["Drift poly pad", "Attack: slow", "Release: long", "Reverb: wide"], patch: "driftPad" },
  drums: { instrument: "Drum Rack", effects: ["Compressor"], macros: ["Move kit", "Compressor: glue"] }
};
var MOVE_PROFILE_PATCHES = {
  acidDub: { chords: "dubChordStab" },
  // Analog wash → dub stab
  berlinAnalogSeq: { pad: "prophet5Pad", chords: "tapeStrings" },
  // Wavetable pad → a real poly study
  synthwaveNeon: { pad: "jupiter8Pad", chords: "obxBrass" },
  // junoPad/stab → Jupiter + THE 80s brass
  tranceGlass: { pad: "jupiter8Pad" },
  // "OB Pad" → the lush 2-pole saw pad
  detroitEmotional: { lead: "glassBell", counterMelody: "glassBell", chords: "dreamKeys", pad: "prophet5Pad" },
  // Operator bell / Analog stab
  jarreAirLead: { pad: "eminentStrings", chords: "cs80Brass" },
  // Oxygène IS an Eminent 310 through a phaser
  jarreSequence: {},
  // all-Drift already
  dubChordHeavy: { chords: "dubChordStab", pad: "darkDrone" },
  // THE dub chord → stab; pad stays drone
  glassAmbient: { lead: "iceLead", pad: "glassChoir", chords: "tapeStrings" },
  // Tension bow / Wavetable
  cosmicFloat: { pad: "jupiter8Pad", chords: "cs80Brass" },
  // Vangelis territory
  deepHouseVelvet: { chords: "dreamKeys", pad: "juno106Pad" },
  // the Live side is literally a Juno pad
  brightBreaks: { chords: "dreamKeys" }
  // Analog stab → keys
};
var DRIFT_OSC1_WAVES = ["Sine", "Triangle", "Shark Tooth", "Saturated", "Saw", "Pulse", "Rectangle"];
var DRIFT_OSC2_WAVES = ["Sine", "Triangle", "Saturated", "Saw", "Rectangle"];
function driftWaveIndex(osc, name) {
  const table = osc === 1 ? DRIFT_OSC1_WAVES : DRIFT_OSC2_WAVES;
  return table.indexOf(name);
}
function describeDriftPatch(params) {
  const get = (frag) => {
    const p = params.find((x) => x.name.toLowerCase() === frag.toLowerCase()) ?? params.find((x) => x.name.toLowerCase().includes(frag.toLowerCase()));
    return p?.value;
  };
  const WAVE = ["Sine", "Triangle", "SharkTooth", "Saturated", "Saw", "Pulse", "Rectangle"];
  const wIdx = Math.round(get("osc 1 wave") ?? 4);
  const wave = WAVE[wIdx] ?? "Saw";
  const vm = Math.round(get("voice mode") ?? 0);
  const detune = Math.abs((get("osc 2 detune") ?? 0.5) - 0.5) * 14;
  const osc2on = (get("osc 2 on") ?? 0) >= 0.5;
  const cutoff01 = get("lp freq") ?? get("filter_frequency") ?? 0.6;
  const decay01 = get("env 1 decay") ?? 0.4;
  const sustain01 = get("env 1 sustain") ?? 0.6;
  const attack01 = get("env 1 attack") ?? 0;
  const release01 = get("env 1 release") ?? 0.3;
  const res01 = get("lp res") ?? 0.2;
  const glide = get("glide time") ?? get("glide") ?? 0;
  const plucky = sustain01 < 0.2 && decay01 < 0.6;
  const pad = attack01 > 0.35 || release01 > 0.6;
  let role;
  if (pad) role = "Pad";
  else if (plucky) role = "Pluck";
  else if (glide > 0.02 && vm === 1 && res01 > 0.6) role = "303";
  else role = "Synth";
  const adj = [];
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
function moveRecipe(part, soundProfile) {
  const prof = soundProfile ? SOUND_PROFILES[soundProfile]?.[part] : void 0;
  if (prof?.external) return prof;
  let base;
  if (part === "piano") base = { instrument: "Drift", effects: ["Reverb"], macros: ["felt EP \u2014 soft hammers", "Reverb: room, close", "wide velocity: PLAY it"], patch: "feltEP" };
  else if (part === "lead" || part === "counterMelody") base = MOVE_RECIPES.lead;
  else if (part === "arp") base = MOVE_RECIPES.seq;
  else if (part === "bass") base = MOVE_RECIPES.bass;
  else if (part === "drums") base = MOVE_RECIPES.drums;
  else base = MOVE_RECIPES.chords;
  let recipe = base;
  if (soundProfile) {
    const prof2 = SOUND_PROFILES[soundProfile]?.[part];
    if (prof2?.instrument === "Drift" && prof2.patch) recipe = { ...base, patch: prof2.patch };
    else {
      const translated = MOVE_PROFILE_PATCHES[soundProfile]?.[part];
      if (translated) recipe = { ...base, patch: translated };
    }
  }
  if ((part === "pad" || part === "chords") && recipe.patch && MONO_PATCHES.has(recipe.patch)) {
    recipe = { ...recipe, patch: "driftPad" };
  }
  if (recipe.patch) {
    const eff = patchLiveEffects(recipe.patch);
    if (eff.length) recipe = { ...recipe, effects: eff };
  }
  return recipe;
}
var RECIPE_DEVICE_NAMES = (() => {
  const set = /* @__PURE__ */ new Set();
  for (const part of ["lead", "bass", "pad", "chords", "counterMelody", "arp", "drums"]) {
    const r = DEVICE_DEFAULT[part];
    set.add(r.instrument);
    r.effects.forEach((e) => set.add(e));
  }
  for (const st of Object.keys(DEVICE_OVERRIDES)) {
    const o = DEVICE_OVERRIDES[st];
    for (const part of Object.keys(o)) {
      const r = o[part];
      set.add(r.instrument);
      r.effects.forEach((e) => set.add(e));
    }
  }
  return [...set];
})();
function songSheetMarkdown(s) {
  const L = [];
  L.push(`# ${s.name}`);
  L.push("");
  L.push(`*MIDI Forge song sheet \xB7 ${s.createdAt} \xB7 ${s.moveMode ? "Ableton Move" : "Ableton Live"}*`);
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
  for (const t of s.tracks) L.push(`| ${t.track} | ${t.instrument} | **${t.patchName}** | ${t.rack ? `\`${t.rack}\`` : "\u2014"} | ${(t.macros || []).join("; ")} |`);
  L.push("");
  L.push(`## Sound guide`);
  L.push("");
  for (const t of s.tracks) L.push(`- **${t.track}** (${t.patchName}): ${t.sound}`);
  L.push("");
  return L.join("\n");
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var chance = (r, p) => r() < p;
var pick = (r, arr) => arr[Math.floor(r() * arr.length)];
var clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function rateBeats(rate) {
  return rate === "1/4" ? 1 : rate === "1/8" ? 0.5 : rate === "1/16" ? 0.25 : 1 / 3;
}
function tempoGate(tempo) {
  if (!tempo) return 1;
  return clamp(1.15 - (tempo - 90) * (0.35 / 60), 0.75, 1.2);
}
function scaleDegreeToMidi(deg, intervals, root, octave) {
  const len = intervals.length;
  const octShift = Math.floor(deg / len);
  const idx = (deg % len + len) % len;
  return root + (octave + 1) * 12 + intervals[idx] + octShift * 12;
}
function snapToScale(midi, intervals, root) {
  const pcSet = new Set(intervals.map((i) => ((root + i) % 12 + 12) % 12));
  for (let d = 0; d <= 6; d++) {
    if (pcSet.has(((midi - d) % 12 + 12) % 12)) return midi - d;
    if (pcSet.has(((midi + d) % 12 + 12) % 12)) return midi + d;
  }
  return midi;
}
function chordShapeDegrees(shape, rootDeg) {
  switch (shape) {
    case "triad":
      return [rootDeg, rootDeg + 2, rootDeg + 4];
    case "seventh":
      return [rootDeg, rootDeg + 2, rootDeg + 4, rootDeg + 6];
    case "ninth":
      return [rootDeg, rootDeg + 2, rootDeg + 4, rootDeg + 6, rootDeg + 8];
    case "sus":
      return [rootDeg, rootDeg + 3, rootDeg + 4];
    case "add9":
      return [rootDeg, rootDeg + 2, rootDeg + 4, rootDeg + 8];
  }
}
function humVel(r, base, humanize) {
  const spread = humanize / 100 * 28;
  return clamp(Math.round(base + (r() - 0.5) * spread), 1, 127);
}
function chordAt(ctx, beat) {
  const bar = Math.floor(beat / BEATS_PER_BAR);
  return ctx.prog[bar % ctx.prog.length];
}
function applySwing(t, step, swing) {
  if (swing <= 0) return t;
  const idx = Math.round(t / step);
  return idx % 2 === 1 ? t + swing * step * 0.66 : t;
}
function genChords(ctx, sustained = false) {
  const { cfg, traits, intervals, r, gate } = ctx;
  const notes = [];
  let prevUpper = [];
  let bandLo = 0, bandHi = 127;
  const place = sustained ? traits.chordPlacement === "wash" ? "wash" : "pad" : traits.chordPlacement === "pad" ? "downbeat" : traits.chordPlacement;
  for (let bar = 0; bar < cfg.bars; bar++) {
    const rootDeg = ctx.prog[bar % ctx.prog.length];
    const degs = chordShapeDegrees(traits.chordShape, rootDeg);
    let voices = degs.map((d) => scaleDegreeToMidi(d, intervals, cfg.root, cfg.octave));
    {
      const anchor = scaleDegreeToMidi(0, intervals, cfg.root, cfg.octave - 1);
      let rootPitch = voices[0] - 12;
      while (rootPitch < anchor) rootPitch += 12;
      while (rootPitch > anchor + 11) rootPitch -= 12;
      const upperTones = voices.slice(1);
      if (!prevUpper.length) {
        prevUpper = upperTones.slice().sort((a, b) => a - b);
        const center = prevUpper.reduce((s, v) => s + v, 0) / Math.max(1, prevUpper.length);
        bandLo = Math.round(center) - 9;
        bandHi = Math.round(center) + 9;
      } else {
        const targets = prevUpper;
        const placed = upperTones.map((v, i) => {
          const t = targets[Math.min(i, targets.length - 1)];
          let p = v;
          while (p - t > 6) p -= 12;
          while (t - p > 6) p += 12;
          while (p > bandHi) p -= 12;
          while (p < bandLo) p += 12;
          return p;
        }).sort((a, b) => a - b);
        prevUpper = placed;
      }
      voices = [rootPitch, ...prevUpper];
    }
    let chromaticIdx = -1;
    if (presetRaisesV(cfg.progressionPreset) && rootDeg % intervals.length === 4 && voices.length > 1) {
      voices = voices.map((v, i) => i === 1 ? v + 1 : v);
      chromaticIdx = 1;
    }
    let hits;
    if (place === "wash") {
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
          pitch: v,
          startTime: start,
          duration: h.dur * gate,
          velocity: humVel(r, h.vel - (i === 0 ? 0 : 4), cfg.humanize),
          ...i === chromaticIdx ? { keepChromatic: true } : {}
        });
      });
    }
  }
  return notes;
}
function genBass(ctx) {
  const { cfg, traits } = ctx;
  if (traits.bass === "acid") return genAcidBass(ctx);
  return genBassGeneric(ctx);
}
function genAcidBass(ctx) {
  const { cfg, intervals, r, step, totalBeats, gate } = ctx;
  const oct = cfg.octave - 1;
  const nSteps = Math.max(1, Math.round(totalBeats / step));
  const restProb = clamp(0.3 + (100 - cfg.density) / 350, 0.3, 0.5);
  const len = intervals.length;
  const cells = [];
  for (let i = 0; i < nSteps; i++) {
    const t = i * step;
    const rootDeg = chordAt(ctx, t);
    const pos = (t % 1 + 1) % 1;
    const isDown = Math.abs(pos) < 1e-6;
    const isOff = Math.abs(pos - 0.5) < 1e-6;
    const isPre = Math.abs(pos - 0.75) < 1e-6;
    let play = !chance(r, restProb);
    if (isDown && chance(r, 0.35)) play = true;
    let deg = rootDeg, octUp = false, accent = false, tritone = false;
    if (play) {
      const accentBase = isOff ? 0.5 : isPre ? 0.42 : isDown ? 0.12 : 0.22;
      accent = chance(r, accentBase);
      if (accent && chance(r, 0.55)) {
        octUp = true;
      } else {
        const p = r();
        if (p > 0.88) deg = rootDeg + 4;
        else if (p > 0.8) deg = rootDeg + 1;
        else if (p > 0.77) tritone = true;
      }
    }
    cells.push({ play, rootDeg, deg, octUp, accent, tritone });
  }
  const pitchOf = (c) => c.tritone ? scaleDegreeToMidi(c.rootDeg, intervals, cfg.root, oct) + 6 : scaleDegreeToMidi(c.deg + (c.octUp ? len : 0), intervals, cfg.root, oct);
  const notes = [];
  for (let i = 0; i < nSteps; i++) {
    const c = cells[i];
    if (!c.play) continue;
    const t = i * step;
    let j = i + 1;
    while (j < nSteps && !cells[j].play) j++;
    const gap = j - i;
    const basePitch = pitchOf(c);
    const nextPitch = j < nSteps ? pitchOf(cells[j]) : basePitch;
    const slide = gap === 1 && nextPitch !== basePitch && chance(r, 0.4);
    let duration;
    if (slide) duration = step * 1.1;
    else if (gap === 1) duration = step * 0.55 * gate;
    else duration = Math.min(step * gap * 0.9, step * (0.6 + gap * 0.5)) * gate;
    notes.push({
      pitch: basePitch,
      startTime: applySwing(t, step, ctx.swing),
      duration,
      velocity: humVel(r, c.accent ? 124 : 88, cfg.humanize),
      ...slide ? { slide: true } : {},
      ...c.tritone ? { keepChromatic: true } : {}
    });
  }
  return notes;
}
function genBassGeneric(ctx) {
  const { cfg, traits, intervals, r, step, totalBeats, gate } = ctx;
  const notes = [];
  const oct = cfg.octave - 1;
  const mode = traits.bass;
  for (let t = 0; t + 1e-6 < totalBeats; t += step) {
    const rootDeg = chordAt(ctx, t);
    const posInBeat = t % 1;
    const onOffbeat = Math.abs(posInBeat - 0.5) < 1e-6;
    const onBeat = Math.abs(posInBeat) < 1e-6;
    let play = false, vel = 90, deg = rootDeg, dur = step * 0.85;
    if (mode === "offbeatRoll") {
      play = onOffbeat || onBeat && chance(r, 0.25);
      if (onBeat) vel = 78;
    } else if (mode === "octave") {
      play = onBeat || onOffbeat;
      if (onOffbeat && chance(r, 0.6)) deg = rootDeg + intervals.length;
    } else if (mode === "walking") {
      play = onBeat || onOffbeat && chance(r, 0.4);
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
      velocity: humVel(r, vel, cfg.humanize)
    });
  }
  return notes;
}
function buildMotifCell(m, stepsPerBar) {
  const cell = Array.from({ length: stepsPerBar }, () => ({ idx: 0, oct: 0, on: false }));
  const total = Math.max(1, m.rhythm.reduce((a, b) => a + Math.max(1, b || 1), 0));
  let t = 0, lastIdx = 0;
  for (let pass = 0; pass < Math.max(1, Math.ceil(stepsPerBar / total)); pass++) {
    for (let j = 0; j < m.degrees.length; j++) {
      const at = t % stepsPerBar;
      const d = m.degrees[j];
      lastIdx = (d % 4 + 4) % 4;
      if (t < stepsPerBar * (pass + 1)) cell[at] = { idx: lastIdx, oct: d >= 4 ? 1 : d < 0 ? 0 : 0, on: true };
      t += Math.max(1, m.rhythm[j] || 1);
    }
  }
  for (let i = 0; i < stepsPerBar; i++) if (!cell[i].on) cell[i].idx = i ? cell[i - 1].idx : lastIdx;
  return cell;
}
function genArp(ctx) {
  const { cfg, traits, intervals, r, step, totalBeats, gate } = ctx;
  const notes = [];
  if (cfg.evolveSeq ?? traits.evolve) {
    const stepsPerBar = Math.max(1, Math.round(BEATS_PER_BAR / step));
    const useDna = !!ctx.dna && ctx.strength > 0;
    const dr = useDna ? mulberry32(((ctx.dna.seed | 0) ^ 1374496523) >>> 0) : r;
    const m = useDna ? ctx.dna.songMotif ?? ctx.dna.motif : void 0;
    const keep = useDna ? ctx.strength / 100 : 0;
    const canonical = m && m.degrees.length ? buildMotifCell(m, stepsPerBar) : null;
    const rhyFlip = ctx.cfg.dnaMix?.rhythm == null ? 0 : clamp((100 - ctx.cfg.dnaMix.rhythm) / 200, 0, 0.5);
    const cell = canonical ? canonical.map((c, i2) => i2 > 0 && dr() < rhyFlip ? { ...c, on: !c.on } : { ...c }) : Array.from({ length: stepsPerBar }, () => ({ idx: Math.floor(dr() * 4), oct: dr() < 0.22 ? 1 : 0, on: dr() < 0.5 + cfg.density / 260 }));
    void keep;
    if (!cell.some((c) => c.on)) cell[0].on = true;
    const totalBars = Math.ceil(totalBeats / BEATS_PER_BAR);
    for (let bar = 0; bar < totalBars; bar++) {
      if (bar > 0 && bar % 2 === 0) {
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
          velocity: humVel(r, s % 4 === 0 ? 92 : 80, cfg.humanize)
        });
      }
    }
    return notes;
  }
  const dirR = ctx.dna && ctx.strength > 0 ? mulberry32(((ctx.dna.seed | 0) ^ 625341585) >>> 0) : r;
  const dir = pick(dirR, traits.arpDir);
  let i = 0, going = 1;
  for (let t = 0; t + 1e-6 < totalBeats; t += step) {
    if (chance(r, (100 - cfg.density) / 260)) continue;
    const rootDeg = chordAt(ctx, t);
    const chord = chordShapeDegrees(traits.chordShape, rootDeg).slice(0, 4);
    const pool = [...chord, ...chord.map((d) => d + intervals.length)];
    let idx;
    if (dir === "up") idx = i % pool.length;
    else if (dir === "down") idx = pool.length - 1 - i % pool.length;
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
      velocity: humVel(r, 84, cfg.humanize)
    });
    i = dir === "updown" ? i + going : i + 1;
  }
  return notes;
}
function genMelodicLine(ctx, role) {
  const { cfg, traits, intervals, r, step, totalBeats, gate } = ctx;
  const notes = [];
  const counter = role === "counter";
  const octShift = counter ? 0 : 1;
  let deg = counter ? 2 : 0;
  const restBias = counter ? 0.18 : 0;
  const restP = clamp(0.55 - cfg.density / 200 + restBias, 0.08, 0.75);
  for (let t = 0; t + 1e-6 < totalBeats; t += step) {
    const strong = Math.abs(t % 1) < 1e-6;
    if (counter && strong && chance(r, 0.35)) continue;
    if (!strong && chance(r, restP)) continue;
    const rootDeg = chordAt(ctx, t);
    const chordTones = chordShapeDegrees(traits.chordShape, rootDeg);
    if (strong || counter && chance(r, 0.5)) {
      deg = chordTones.reduce((best, c) => Math.abs(c - deg) < Math.abs(best - deg) ? c : best);
    } else {
      deg += pick(r, counter ? [-1, -1, 1, 1, -2, 2] : [-2, -1, -1, 1, 1, 2]);
    }
    deg = clamp(deg, -3, intervals.length + 3);
    const pitch = scaleDegreeToMidi(deg, intervals, cfg.root, cfg.octave + octShift);
    const long = strong && chance(r, 0.4) || counter;
    notes.push({
      pitch,
      startTime: applySwing(t, step, ctx.swing),
      duration: step * (long ? counter ? 2.4 : 3 : 1.6) * gate,
      velocity: humVel(r, strong ? counter ? 80 : 92 : counter ? 68 : 78, cfg.humanize)
    });
  }
  return notes;
}
var PIANO_FIGURE_LABELS = {
  broken: "Broken chords (open, pedalled)",
  alberti: "Alberti bass (Mozart)",
  nocturne: "Nocturne (Chopin \u2014 wide sweep)",
  ostinato: "Ostinato (minimalist 8ths)",
  chorale: "Chorale (block harmony)"
};
function pianoFigureFor(style, figure) {
  if (figure && figure !== "auto") return figure;
  switch (style) {
    case "melodicTechno":
    case "dubTechno":
    case "ambient":
      return "nocturne";
    case "classicSeq":
    case "trance":
    case "acid":
      return "ostinato";
    case "deepHouse":
    case "breakbeat":
      return "alberti";
    case "detroit":
    case "synthwave":
      return "chorale";
    default:
      return "broken";
  }
}
function genPiano(ctx) {
  const { cfg, intervals, r, totalBeats, prog, dna, strength } = ctx;
  const notes = [];
  const bars = Math.max(1, Math.round(totalBeats / BEATS_PER_BAR));
  const sparse = !!cfg.pianoSparse;
  const figure = pianoFigureFor(cfg.style, cfg.pianoFigure);
  const rub = () => (r() - 0.5) * (figure === "nocturne" ? 0.06 : 0.04);
  const vj = (v) => clamp(Math.round(v + (r() - 0.5) * 10), 1, 127);
  const pOct = clamp(cfg.octave, 3, 4);
  const reg = (p) => {
    let x = p;
    while (x < 38) x += 12;
    while (x > 100) x -= 12;
    return x;
  };
  const deg2midi = (deg, oct) => reg(scaleDegreeToMidi(deg, intervals, cfg.root, oct));
  const useDna = !!dna && strength > 0;
  let degrees = useDna ? dna.motif.degrees.slice() : [0];
  let rhythm = useDna ? dna.motif.rhythm.slice() : [2];
  if (!useDna) {
    for (let i = 1; i < 4; i++) degrees.push(clamp(degrees[i - 1] + pick(r, [-2, -1, 1, 1, 2]), 0, 6));
    rhythm = Array.from({ length: 4 }, () => pick(r, [1, 2, 2, 4]));
  }
  const stmtEvery = sparse ? 4 : 2;
  const lhOct = pOct - 1;
  const rhStartBar = figure === "ostinato" && bars > stmtEvery && !sparse ? stmtEvery : 0;
  for (let bar = 0; bar < bars; bar++) {
    const barStart = bar * BEATS_PER_BAR;
    const rootDeg = prog[bar % prog.length];
    const isStmtBar = bar % stmtEvery === 0;
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
      const cell = [0, 4, 2, 4];
      const stepB = cfg.density >= 40 ? 0.5 : 1;
      for (let k = 0; k * stepB < BEATS_PER_BAR; k++) {
        const deg = rootDeg + cell[k % 4];
        const onBeat = k * stepB % 1 === 0;
        notes.push({ pitch: deg2midi(deg, lhOct), startTime: barStart + k * stepB + (k ? rub() * 0.5 : 0), duration: stepB * 0.92, velocity: vj(onBeat ? 64 : 56) });
      }
    } else if (figure === "nocturne") {
      const sweep = [
        // [degOffset, octShift, at, vel]
        [0, -1, 0, 68],
        [4, 0, 0.5, 58],
        [7, 0, 1, 60],
        [9, 0, 1.5, 63]
      ];
      for (const [dOff, oShift, at, v] of sweep)
        notes.push({ pitch: deg2midi(rootDeg + dOff, lhOct + oShift), startTime: barStart + at + (at ? rub() : 0), duration: BEATS_PER_BAR - at, velocity: vj(v) });
      if (cfg.density >= 55)
        notes.push({ pitch: deg2midi(rootDeg + 11, lhOct), startTime: barStart + 2.5 + rub(), duration: BEATS_PER_BAR - 2.5, velocity: vj(56) });
    } else if (figure === "ostinato") {
      const cyc = [0, 4, 7, 9, 7, 4];
      for (let k = 0; k < 8; k++) {
        const gIdx = bar * 8 + k;
        const deg = rootDeg + cyc[gIdx % 6];
        notes.push({ pitch: deg2midi(deg, lhOct), startTime: barStart + k * 0.5 + (k ? rub() * 0.5 : 0), duration: 0.56, velocity: vj(k % 4 === 0 ? 66 : k % 2 === 0 ? 58 : 52) });
      }
    } else {
      for (const at of [0, 2]) {
        notes.push({ pitch: deg2midi(rootDeg, lhOct), startTime: barStart + at + (at ? rub() * 0.5 : 0), duration: 2, velocity: vj(at === 0 ? 66 : 58) });
        notes.push({ pitch: deg2midi(rootDeg + 4, lhOct), startTime: barStart + at + rub() * 0.5, duration: 2, velocity: vj(at === 0 ? 58 : 52) });
      }
    }
    if (!isStmtBar || bar < rhStartBar) continue;
    const stmtIdx = Math.floor(bar / stmtEvery);
    const lastStmt = bar + stmtEvery >= bars;
    const lift = lastStmt && bars > stmtEvery ? 12 : 0;
    const rhythmScale = figure === "nocturne" ? 0.75 : 0.5;
    let t = barStart + 0.5 + rub();
    let prevDeg = null;
    for (let i = 0; i < degrees.length; i++) {
      const deg = rootDeg + degrees[i];
      const pitch = reg(deg2midi(deg, pOct + 1) + lift);
      const durBeats = Math.max(0.5, rhythm[i % rhythm.length] * rhythmScale);
      const pos = degrees.length <= 1 ? 0.5 : i / (degrees.length - 1);
      const vel = vj(76 + Math.round(32 * Math.sin(Math.PI * Math.min(1, pos * 1.15))));
      if (figure === "alberti" && prevDeg !== null && Math.abs(deg - prevDeg) >= 2 && cfg.density >= 50 && !sparse) {
        const mid = Math.round((deg + prevDeg) / 2);
        notes.push({ pitch: reg(deg2midi(mid, pOct + 1) + lift), startTime: Math.max(barStart, t - 0.28 + rub()), duration: 0.26, velocity: vj(vel - 16) });
      }
      if (i === degrees.length - 1 && stmtIdx > 0 && !sparse && cfg.density >= 50 && figure !== "chorale") {
        notes.push({ pitch: reg(deg2midi(deg + 1, pOct + 1) + lift), startTime: Math.max(barStart, t - 0.25 + rub()), duration: 0.22, velocity: vj(vel - 18) });
      }
      notes.push({ pitch, startTime: t, duration: durBeats * 1.3, velocity: vel });
      if (figure === "chorale" && !sparse) {
        notes.push({ pitch: reg(deg2midi(deg - 2, pOct + 1) + lift), startTime: t, duration: durBeats * 1.25, velocity: vj(vel - 14) });
        if (cfg.density >= 50) notes.push({ pitch: reg(deg2midi(deg - 5, pOct + 1) + lift), startTime: t + rub() * 0.3, duration: durBeats * 1.25, velocity: vj(vel - 20) });
      }
      prevDeg = deg;
      t += durBeats;
      if (t >= barStart + BEATS_PER_BAR * Math.min(stmtEvery, 2) - 0.25) break;
    }
  }
  return notes;
}
function genDrums(ctx) {
  const { cfg, traits, r, totalBeats } = ctx;
  const FEEL_TO_KIT = {
    fourFloor: "fourFloor",
    breakbeat: "breakbeat",
    lofiSwing: "house",
    minimalDub: "sparse",
    acidJack: "electro",
    ambientNone: "none"
  };
  const kit = cfg.drumFeel ? FEEL_TO_KIT[cfg.drumFeel] : traits.drums;
  const D = { ...DRUM_MAP, ...cfg.drumMap ?? {} };
  const kitMode = cfg.drumMap != null;
  const populated = kitMode ? [...new Set(Object.values(cfg.drumMap))] : [];
  const ESSENTIAL = /* @__PURE__ */ new Set(["kick", "snare", "closedHat"]);
  const roleNote = (role) => {
    if (!kitMode) return DRUM_MAP[role];
    if (cfg.drumMap[role] !== void 0) return cfg.drumMap[role];
    if (ESSENTIAL.has(role)) return mapNoteToKit(DRUM_MAP[role], populated) ?? populated[0] ?? DRUM_MAP[role];
    return null;
  };
  const notes = [];
  const d = cfg.density / 100;
  const sw = ctx.swing;
  const push = (role, at, vel, swung = false) => {
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
var DRUM_FAMILIES = [
  [35, 36],
  // kicks
  [37, 38, 39, 40],
  // snares / claps / rim
  [42, 44, 46],
  // hats (closed / pedal / open)
  [41, 43, 45, 47, 48, 50],
  // toms
  [49, 51, 52, 53, 55, 57, 59],
  // ride / cymbals
  [54, 56, 58, 69, 70, 71, 75, 76, 77, 82]
  // percussion / shakers
];
function drumFamily(note) {
  return DRUM_FAMILIES.find((f) => f.includes(note)) ?? null;
}
function mapNoteToKit(note, populated) {
  if (populated.includes(note)) return note;
  const fam = drumFamily(note);
  const inFam = fam ? populated.filter((p) => fam.includes(p)) : [];
  if (inFam.length) {
    return inFam.reduce((best, p) => Math.abs(p - note) < Math.abs(best - note) ? p : best);
  }
  return null;
}
function remapDrumsToKit(notes, populated) {
  if (!populated || populated.length === 0) return notes;
  const uniq = [...new Set(populated)];
  const out = [];
  for (const n of notes) {
    const to = mapNoteToKit(n.pitch, uniq);
    if (to != null) out.push(to === n.pitch ? n : { ...n, pitch: to });
  }
  return out;
}
function cleanupNotes(notes, totalBeats) {
  return notes.map((n) => ({
    ...n,
    pitch: clamp(Math.round(n.pitch), 0, 127),
    startTime: clamp(n.startTime, 0, totalBeats),
    duration: Math.max(0.05, n.duration),
    velocity: clamp(Math.round(n.velocity ?? 100), 1, 127)
  })).filter((n) => n.startTime < totalBeats - 1e-6).map((n) => ({ ...n, duration: Math.min(n.duration, totalBeats - n.startTime) })).sort((a, b) => a.startTime - b.startTime || a.pitch - b.pitch);
}
function mutateRhythm(notes, o) {
  const r = mulberry32((o.seed | 0) ^ 22136);
  const p = clamp(o.amount / 100, 0, 1);
  const grid = 0.25;
  const seen = /* @__PURE__ */ new Set();
  const out = notes.map((n) => {
    let st = Math.round(n.startTime / grid) * grid;
    if (chance(r, p)) {
      const shift = pick(r, [-2, -1, 1, 2]) * grid;
      st = clamp(st + shift, 0, Math.max(0, o.lengthBeats - grid));
    }
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
function mutateMelody(notes, o) {
  const intervals = SCALES[o.scale] ?? SCALES["Natural Minor"];
  const r = mulberry32((o.seed | 0) ^ 4660);
  const p = clamp(o.amount / 100 * 0.9, 0, 1);
  const out = notes.map((n) => {
    if (!chance(r, p)) return { ...n };
    let np = n.pitch + pick(r, [-4, -2, -2, 2, 2, 4]);
    np = o.scaleLock ? snapToScale(np, intervals, o.root) : np;
    return { ...n, pitch: clamp(np, 0, 127) };
  });
  return cleanupNotes(out, o.lengthBeats);
}
function mutateChords(notes, o) {
  const intervals = SCALES[o.scale] ?? SCALES["Natural Minor"];
  const r = mulberry32((o.seed | 0) ^ 39612);
  const amt = clamp(o.amount / 100, 0, 1);
  const groups = /* @__PURE__ */ new Map();
  for (const n of notes) {
    const k = Math.round(n.startTime * 1e3) / 1e3;
    const g = groups.get(k);
    if (g) g.push(n);
    else groups.set(k, [n]);
  }
  const out = [];
  for (const g of groups.values()) {
    if (g.length < 2) {
      out.push(...g.map((n) => ({ ...n })));
      continue;
    }
    const sorted = [...g].sort((a, b) => a.pitch - b.pitch);
    const bass = sorted[0];
    out.push({ ...bass });
    let prev = bass.pitch;
    for (let i = 1; i < sorted.length; i++) {
      const orig = sorted[i];
      let step = chance(r, 0.5 + amt * 0.3) ? 4 : 3;
      if (chance(r, amt * 0.5)) step += 2;
      let np = snapToScale(prev + step, intervals, o.root);
      if (np <= prev) np = snapToScale(prev + 3, intervals, o.root);
      prev = np;
      out.push({ ...orig, pitch: clamp(np, 0, 127) });
    }
  }
  return cleanupNotes(out, o.lengthBeats);
}
function mutate(notes, o) {
  if (!notes.length) return [];
  switch (o.type) {
    case "rhythm":
      return mutateRhythm(notes, o);
    case "melody":
      return mutateMelody(notes, o);
    case "chords":
      return mutateChords(notes, o);
  }
}
var DEFAULT_PHRASE = {
  profile: ["question", "answer", "question", "climax"],
  barsPerPhrase: 1
};
var REGISTER_OFF = {
  lead: 1,
  counterMelody: 0,
  pad: 0,
  chords: 0,
  arp: 0,
  bass: -1,
  drums: 0,
  piano: 0
};
function contourOf(degrees) {
  const out = [];
  for (let i = 1; i < degrees.length; i++) {
    const d = degrees[i] - degrees[i - 1];
    out.push(d > 0 ? 1 : d < 0 ? -1 : 0);
  }
  return out;
}
var motifOps = {
  transpose: (m, n) => ({ degrees: m.degrees.map((d) => d + n), rhythm: m.rhythm }),
  invert: (m, axis = m.degrees[0]) => ({ degrees: m.degrees.map((d) => 2 * axis - d), rhythm: m.rhythm }),
  retrograde: (m) => ({ degrees: [...m.degrees].reverse(), rhythm: [...m.rhythm].reverse() }),
  augment: (m, f = 2) => ({ degrees: m.degrees, rhythm: m.rhythm.map((r) => Math.max(1, Math.round(r * f))) }),
  diminish: (m, f = 2) => ({ degrees: m.degrees, rhythm: m.rhythm.map((r) => Math.max(1, Math.round(r / f))) }),
  octaveShift: (m, oct, scaleLen) => ({ degrees: m.degrees.map((d) => d + oct * scaleLen), rhythm: m.rhythm }),
  fragment: (m, k) => ({ degrees: m.degrees.slice(0, Math.max(1, k)), rhythm: m.rhythm.slice(0, Math.max(1, k)) }),
  sequence: (m, step, times) => {
    const degrees = [], rhythm = [];
    for (let i = 0; i < times; i++) {
      m.degrees.forEach((d) => degrees.push(d + step * i));
      m.rhythm.forEach((r) => rhythm.push(r));
    }
    return { degrees, rhythm };
  }
};
function midiToScaleDegree(pitch, intervals, root) {
  const snapped = snapToScale(pitch, intervals, root);
  const rel = snapped - root;
  const octave = Math.floor(rel / 12);
  const within = (rel % 12 + 12) % 12;
  const idx = intervals.indexOf(within);
  return octave * intervals.length + (idx >= 0 ? idx : 0);
}
function blendProgression(dna, pool, harmony) {
  if (harmony >= 100 || !pool.length) return dna.progression;
  const pr = mulberry32(((dna.seed | 0) ^ 1752329582) >>> 0);
  const alt = pool[Math.floor(pr() * pool.length)];
  const len = Math.max(dna.progression.length, alt.length);
  return Array.from({ length: len }, (_, i) => pr() < harmony / 100 ? dna.progression[i % dna.progression.length] : alt[i % alt.length]);
}
function reconcileDNA(stored, want) {
  const matches = (d) => d.seed === want.seed && d.style === want.style && d.root === want.root && d.scale === want.scale;
  if (stored && matches(stored)) return { dna: stored, action: "keep" };
  if (stored && stored.authored && stored.authored.notes.length) {
    if (stored.root === want.root && stored.scale === want.scale) return { dna: { ...stored, seed: want.seed, style: want.style }, action: "adopt" };
    const shift = ((want.root - stored.root) % 12 + 18) % 12 - 6;
    const authored = { ...stored.authored, notes: stored.authored.notes.map((n) => ({ ...n, pitch: n.pitch + shift })) };
    return { dna: { ...deriveDNA(want.style, want.root, want.scale, want.seed), authored }, action: "rekey" };
  }
  return { dna: deriveDNA(want.style, want.root, want.scale, want.seed), action: "derive" };
}
function deriveDNA(style, root, scale, seed) {
  const traits = STYLES[style] ?? STYLES.melodicTechno;
  let mixed = (seed | 0) >>> 0;
  for (const ch of style + "|" + scale) mixed = Math.imul(mixed ^ ch.charCodeAt(0), 2654435761) >>> 0;
  mixed = Math.imul(mixed ^ (root + 1) * 2654435761, 2246822519) >>> 0;
  const r = mulberry32(mixed ^ 3338);
  const progression = [...traits.progressions[Math.floor(r() * traits.progressions.length)]];
  const len = 4;
  const degrees = [0];
  for (let i = 1; i < len; i++) degrees.push(clamp(degrees[i - 1] + pick(r, [-2, -1, 1, 1, 2, 2]), 0, 6));
  const rhythm = Array.from({ length: len }, () => pick(r, [1, 1, 2, 1, 2, 4]));
  const timing = Array.from({ length: 16 }, (_, i) => {
    const base = i % 2 === 1 ? 6e-3 : -2e-3;
    return Math.round((base + (r() - 0.5) * 0.01) * 1e3) / 1e3;
  });
  const accent = Array.from({ length: 16 }, (_, i) => {
    const strong = i % 4 === 0 ? 8 : i % 2 === 0 ? 2 : -3;
    return Math.round(strong + (r() - 0.5) * 6);
  });
  timing[0] = Math.max(0, timing[0]);
  return {
    version: 1,
    root,
    scale,
    style,
    progression,
    motif: { degrees, rhythm },
    contour: contourOf(degrees),
    baseOctave: 3,
    groove: { swing: Math.round(traits.swing * 100), humanize: 30, timing, accent },
    phrase: DEFAULT_PHRASE,
    seed
  };
}
function extractDNA(rawNotes, root, scale, seed) {
  const intervals = SCALES[scale] ?? SCALES["Natural Minor"];
  const notes = [...rawNotes].sort((a, b) => a.startTime - b.startTime);
  if (!notes.length) return deriveDNA("melodicTechno", root, scale, seed);
  const maxEnd = Math.max(4, ...notes.map((n) => n.startTime + n.duration));
  const bars = Math.max(1, Math.round(maxEnd / BEATS_PER_BAR));
  const len = intervals.length;
  const progression = [];
  for (let b = 0; b < bars; b++) {
    const inBar = notes.filter((n) => n.startTime >= b * BEATS_PER_BAR && n.startTime < (b + 1) * BEATS_PER_BAR);
    if (!inBar.length) {
      progression.push(progression.length ? progression[progression.length - 1] : 0);
      continue;
    }
    const low = inBar.reduce((a, n) => n.pitch < a.pitch ? n : a);
    progression.push((midiToScaleDegree(low.pitch, intervals, root) % len + len) % len);
  }
  const firstBar = notes.filter((n) => n.startTime < BEATS_PER_BAR).slice(0, 6);
  const src = firstBar.length ? firstBar : notes.slice(0, 6);
  const anchor = progression[0] ?? 0;
  const degrees = src.map((n) => midiToScaleDegree(n.pitch, intervals, root) - anchor);
  const rhythm = src.map((n) => Math.max(1, Math.round(n.duration / 0.25)));
  const pitches = notes.map((n) => n.pitch).sort((a, b) => a - b);
  const median = pitches[Math.floor(pitches.length / 2)];
  const baseOctave = clamp(Math.round(median / 12) - 1, 1, 6);
  let gridDev = 0;
  for (const n of notes) {
    const q = Math.round(n.startTime / 0.25) * 0.25;
    gridDev += Math.abs(n.startTime - q);
  }
  const swing = clamp(Math.round(gridDev / notes.length / 0.166 * 70), 0, 70);
  const vels = notes.map((n) => n.velocity ?? 100);
  const mean = vels.reduce((a, v) => a + v, 0) / vels.length;
  const std = Math.sqrt(vels.reduce((a, v) => a + (v - mean) ** 2, 0) / vels.length);
  const humanize = clamp(Math.round(std / 40 * 100), 0, 100);
  const gr = mulberry32((seed | 0) ^ 40503);
  const timing = Array.from({ length: 16 }, (_, i) => Math.round(((i % 2 === 1 ? 6e-3 : -2e-3) + (gr() - 0.5) * 0.01) * 1e3) / 1e3);
  const accent = Array.from({ length: 16 }, (_, i) => Math.round((i % 4 === 0 ? 8 : i % 2 === 0 ? 2 : -3) + (gr() - 0.5) * 6));
  timing[0] = Math.max(0, timing[0]);
  const authoredNotes = notes.slice(0, 64).map((n) => ({
    pitch: clamp(Math.round(n.pitch), 0, 127),
    startTime: Math.max(0, n.startTime),
    duration: Math.max(0.05, n.duration),
    velocity: clamp(Math.round(n.velocity ?? 100), 1, 127)
  }));
  const authored = { notes: authoredNotes, lengthBeats: bars * BEATS_PER_BAR };
  return {
    version: 1,
    root,
    scale,
    progression: progression.length ? progression : [0],
    motif: { degrees: degrees.length ? degrees : [0], rhythm: rhythm.length ? rhythm : [1] },
    contour: contourOf(degrees.length ? degrees : [0]),
    baseOctave,
    groove: { swing, humanize, timing, accent },
    phrase: DEFAULT_PHRASE,
    seed,
    authored
  };
}
var authoredOps = {
  /** first `frac` of the statement, by time (fragment) */
  fragment(a, frac) {
    const cut = a.lengthBeats * clamp(frac, 0.25, 1);
    return { ...a, notes: a.notes.filter((n) => n.startTime < cut - 1e-6) };
  },
  /** octave lift/drop */
  octave(a, oct) {
    return { ...a, notes: a.notes.map((n) => ({ ...n, pitch: clamp(n.pitch + 12 * oct, 0, 127) })) };
  },
  /** reversed in time */
  retrograde(a) {
    const L = a.lengthBeats;
    return { ...a, notes: a.notes.map((n) => ({ ...n, startTime: Math.max(0, L - n.startTime - n.duration) })).sort((x, y) => x.startTime - y.startTime) };
  },
  /** half speed (augmentation) — statement takes twice as long; period doubles */
  augment(a) {
    return { ...a, lengthBeats: a.lengthBeats * 2, notes: a.notes.map((n) => ({ ...n, startTime: n.startTime * 2, duration: n.duration * 2 })) };
  },
  /** double speed (diminution) — period halves */
  diminish(a) {
    return { ...a, lengthBeats: a.lengthBeats / 2, notes: a.notes.map((n) => ({ ...n, startTime: n.startTime / 2, duration: n.duration / 2 })) };
  },
  /** transposed by `steps` scale degrees, snapped to the scale (sequence) */
  transpose(a, steps, intervals, root) {
    return { ...a, notes: a.notes.map((n) => {
      const deg = midiToScaleDegree(n.pitch, intervals, root) + steps;
      const oct = Math.floor(n.pitch / 12) - 1;
      const p = scaleDegreeToMidi(deg, intervals, root, oct);
      let q = p;
      while (q - n.pitch > 6) q -= 12;
      while (n.pitch - q > 6) q += 12;
      return { ...n, pitch: clamp(q, 0, 127) };
    }) };
  },
  /** thinned: keep every note whose index passes `keep` (sparse statement) */
  thin(a, keep) {
    return { ...a, notes: a.notes.filter((n, i) => keep(i, n)) };
  }
};
function sceneAuthoredTransform(section, a, intervals, root) {
  switch (section) {
    case "Intro":
      return authoredOps.fragment(a, 0.5);
    case "Build":
      return authoredOps.transpose(a, 1, intervals, root);
    case "Build 2":
      return authoredOps.transpose(a, 2, intervals, root);
    case "Main":
    case "Main 2":
      return a;
    // YOUR line, verbatim
    case "Break":
      return authoredOps.fragment(a, 0.5);
    case "Drop":
      return authoredOps.octave(a, 1);
    case "Outro":
      return authoredOps.retrograde(a);
    case "Pulse":
      return authoredOps.fragment(a, 0.25);
    case "Layer 1":
      return authoredOps.fragment(a, 0.5);
    case "Layer 2":
      return authoredOps.transpose(a, 1, intervals, root);
    case "Layer 3":
    case "Peak":
      return a;
    case "Strip":
      return authoredOps.augment(a);
    case "Peak 2":
      return authoredOps.octave(a, 1);
    case "Fade":
      return authoredOps.diminish(authoredOps.fragment(a, 0.5));
    case "Groove":
      return authoredOps.thin(a, (i) => i % 2 === 0);
    case "Breakdown":
      return a;
    case "Lift":
      return authoredOps.transpose(a, 1, intervals, root);
    case "Groove 2":
      return a;
    default:
      return a;
  }
}
function genAuthoredLine(ctx, a, gain) {
  const { cfg, intervals, r, totalBeats } = ctx;
  const stmt = a;
  const period = Math.max(0.25, stmt.lengthBeats);
  const out = [];
  const hum = clamp(ctx.userHumanize ?? 0, 0, 100) / 100;
  const humT = hum * 0.02;
  for (let off = 0; off < totalBeats - 1e-6; off += period) {
    for (const n of stmt.notes) {
      const base = off + n.startTime;
      if (base >= totalBeats - 1e-6) continue;
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
function sceneMotifTransform(section, motif, scaleLen) {
  switch (section) {
    // classic arc: statement -> repeat -> vary -> fragment -> restate (Star Dancer)
    case "Intro":
      return motifOps.fragment(motif, Math.max(2, Math.ceil(motif.degrees.length / 2)));
    case "Build":
      return motifOps.sequence(motif, 1, 2);
    case "Build 2":
      return motifOps.sequence(motif, 2, 2);
    case "Main":
    case "Main 2":
      return motif;
    case "Break":
      return motifOps.fragment(motif, 2);
    case "Drop":
      return motifOps.octaveShift(motif, 1, scaleLen);
    case "Outro":
      return motifOps.retrograde(motif);
    // Berlin School: the motif emerges — fragment, grow, state, dissolve
    case "Pulse":
      return motifOps.fragment(motif, 2);
    case "Layer 1":
      return motifOps.fragment(motif, Math.max(2, Math.ceil(motif.degrees.length / 2)));
    case "Layer 2":
      return motifOps.sequence(motif, 1, 2);
    case "Layer 3":
      return motif;
    case "Peak":
      return motif;
    case "Strip":
      return motifOps.augment(motif);
    // the core, slowed and exposed (Winter)
    case "Peak 2":
      return motifOps.octaveShift(motif, 1, scaleLen);
    case "Fade":
      return motifOps.diminish(motifOps.fragment(motif, 2));
    // Anthem: the hook is exposed in the breakdown, lifted, then dropped in full
    case "Groove":
      return motifOps.fragment(motif, Math.max(2, motif.degrees.length - 1));
    case "Breakdown":
      return motif;
    // the anthem, stated plainly
    case "Lift":
      return motifOps.sequence(motif, 1, 2);
    case "Groove 2":
      return motif;
    default:
      return motif;
  }
}
function registerWindow(dna, part, root, octave) {
  const off = REGISTER_OFF[part] ?? 0;
  const center = ((octave ?? dna.baseOctave) + off + 1) * 12 + root;
  return [center - 9, center + 16];
}
var PART_OCT_OFF = { lead: 1, counterMelody: 0, pad: 0, chords: 0, arp: 1, bass: -1, drums: 0, piano: 0 };
var PART_SPAN = {
  lead: [-12, 18],
  counterMelody: [-12, 12],
  pad: [-14, 14],
  chords: [-14, 14],
  arp: [-10, 20],
  bass: [-10, 12],
  drums: [0, 0],
  piano: [-26, 26]
  // two hands: LH broken chords well below the RH melody
};
function partRange(part, root, octave) {
  const center = (octave + (PART_OCT_OFF[part] ?? 0) + 1) * 12 + root;
  const [lo, hi] = PART_SPAN[part] ?? [-12, 12];
  return [clamp(center + lo, 0, 127), clamp(center + hi, 0, 127)];
}
function clampToRegister(pitch, lo, hi, intervals, root) {
  let p = pitch;
  while (p < lo) p += 12;
  while (p > hi) p -= 12;
  return snapToScale(p, intervals, root);
}
function genMotifLine(ctx, role) {
  const { cfg, intervals, r, step, totalBeats, gate, dna } = ctx;
  if (!dna) return [];
  const counter = role === "counter";
  if (!counter && dna.authored && dna.authored.notes.length && ctx.strength > 0) {
    return genAuthoredLine(ctx, dna.authored, 1);
  }
  let m = counter ? motifOps.invert(dna.motif) : dna.motif;
  const bendP = clamp((100 - ctx.strength) / 100, 0, 1);
  const rhyP = clamp((100 - (ctx.mix?.rhythm ?? ctx.strength)) / 100, 0, 1);
  const rM = ctx.rMotif ?? r, rR = ctx.rRhythm ?? r;
  const reshape = bendP > 0.3;
  const roll = reshape ? rM() : 1;
  if (reshape && roll < 0.24 * bendP) m = motifOps.retrograde(m);
  else if (reshape && roll < 0.4 * bendP) m = motifOps.fragment(m, Math.max(2, m.degrees.length - 1));
  else if (reshape && roll < 0.54 * bendP) m = motifOps.sequence(m, 0, 2);
  const baseOct = cfg.octave + (counter ? 0 : 1);
  const literal = ctx.strength >= 70;
  const octJit = !literal && bendP > 0 && rM() < bendP ? pick(rM, [1, -1]) : 0;
  const skipP = 0.14 * rhyP, echoP = 0.12 * rhyP;
  const notes = [];
  let bar = 0;
  for (let barStart = 0; barStart < totalBeats - 1e-6; barStart += BEATS_PER_BAR, bar++) {
    const rootDeg = ctx.prog[bar % ctx.prog.length];
    const shift = bar === 0 || !(rR() < rhyP) ? 0 : pick(rR, [1, 2]) * step;
    let t = barStart + (counter ? step : 0) + shift;
    for (let j = 0; j < m.degrees.length; j++) {
      const durSteps = Math.max(1, m.rhythm[j] || 1);
      const dur = durSteps * step * gate;
      if (t + dur * 0.5 > barStart + BEATS_PER_BAR) break;
      if (bar > 0 && rR() < skipP) {
        t += durSteps * step;
        continue;
      }
      const pitch = scaleDegreeToMidi(rootDeg + m.degrees[j], intervals, cfg.root, baseOct + octJit);
      notes.push({
        pitch,
        startTime: applySwing(t, step, ctx.swing),
        duration: dur,
        velocity: humVel(r, counter ? 78 : 92, cfg.humanize)
      });
      if (!(literal && bar === 0) && rR() < echoP && t + durSteps * step * 2 <= barStart + BEATS_PER_BAR) {
        notes.push({
          pitch,
          startTime: applySwing(t + durSteps * step, step, ctx.swing),
          duration: dur * 0.8,
          velocity: humVel(r, 66, cfg.humanize)
        });
      }
      t += durSteps * step;
    }
  }
  if (!notes.length) {
    const rootDeg = ctx.prog[0];
    notes.push({ pitch: scaleDegreeToMidi(rootDeg, intervals, cfg.root, baseOct), startTime: 0, duration: step * gate, velocity: 90 });
  }
  return notes;
}
function sectionPhraseProfile(section) {
  switch (section) {
    case "Intro":
      return { profile: ["question"], barsPerPhrase: 1 };
    case "Build":
    case "Build 2":
      return { profile: ["question", "answer"], barsPerPhrase: 1 };
    case "Main":
    case "Main 2":
      return { profile: ["question", "answer", "question", "climax"], barsPerPhrase: 1 };
    case "Break":
      return { profile: ["question", "cadence"], barsPerPhrase: 1 };
    case "Drop":
      return { profile: ["climax", "answer"], barsPerPhrase: 1 };
    case "Outro":
      return { profile: ["cadence"], barsPerPhrase: 1 };
    // Berlin School
    case "Pulse":
    case "Layer 1":
    case "Layer 2":
      return { profile: ["question"], barsPerPhrase: 1 };
    case "Layer 3":
      return { profile: ["question", "answer"], barsPerPhrase: 1 };
    case "Peak":
    case "Peak 2":
      return { profile: ["question", "answer", "question", "climax"], barsPerPhrase: 1 };
    case "Strip":
      return { profile: ["question", "cadence"], barsPerPhrase: 1 };
    case "Fade":
      return { profile: ["cadence"], barsPerPhrase: 1 };
    // Anthem
    case "Groove":
    case "Groove 2":
      return { profile: ["question", "answer"], barsPerPhrase: 1 };
    case "Breakdown":
      return { profile: ["question", "answer", "question", "climax"], barsPerPhrase: 1 };
    case "Lift":
      return { profile: ["question", "answer", "climax", "answer"], barsPerPhrase: 1 };
    default:
      return DEFAULT_PHRASE;
  }
}
function topScalePitch(hi, intervals, root) {
  const pcSet = new Set(intervals.map((i) => ((root + i) % 12 + 12) % 12));
  for (let p = hi; p > hi - 12; p--) if (pcSet.has((p % 12 + 12) % 12)) return p;
  return hi;
}
function nearestDegreePitch(pitch, degIdx, intervals, root) {
  const idx = clamp(degIdx, 0, intervals.length - 1);
  const targetPc = ((root + intervals[idx]) % 12 + 12) % 12;
  const below = pitch - ((pitch - targetPc) % 12 + 12) % 12;
  const cands = [below, below + 12];
  return cands.reduce((a, b) => Math.abs(b - pitch) < Math.abs(a - pitch) ? b : a);
}
function applyPhrasing(notes, phrase, intervals, root, totalBeats, range) {
  if (!notes.length) return notes;
  const out = notes.map((n) => ({ ...n }));
  const [, hi] = range;
  const ceiling = topScalePitch(hi, intervals, root);
  const plen = Math.max(1, phrase.barsPerPhrase) * BEATS_PER_BAR;
  const nPhrases = Math.max(1, Math.round(totalBeats / plen));
  let climaxPhrase = -1;
  for (let p = 0; p < nPhrases; p++) if (phrase.profile[p % phrase.profile.length] === "climax") {
    climaxPhrase = p;
    break;
  }
  for (let p = 0; p < nPhrases; p++) {
    const fn = phrase.profile[p % phrase.profile.length];
    const start = p * plen, end = (p + 1) * plen;
    const idxs = out.map((n, i) => ({ n, i })).filter((x) => x.n.startTime >= start - 1e-6 && x.n.startTime < end - 1e-6).map((x) => x.i);
    if (!idxs.length) continue;
    const gain = climaxPhrase >= 0 ? p <= climaxPhrase ? 0.82 + 0.18 * (p / Math.max(1, climaxPhrase)) : 0.9 : 1;
    for (const i of idxs) out[i].velocity = clamp(Math.round((out[i].velocity ?? 100) * gain), 1, 127);
    if (fn === "climax") {
      for (const i of idxs) {
        out[i].pitch += 12;
        out[i].velocity = clamp((out[i].velocity ?? 100) + 16, 1, 127);
      }
    }
    const maxStart = Math.max(...idxs.map((i) => out[i].startTime));
    const enders = idxs.filter((i) => Math.abs(out[i].startTime - maxStart) < 1e-6);
    for (const li of enders) {
      const endPitch = out[li].pitch;
      if (fn === "answer" || fn === "cadence") {
        out[li].pitch = nearestDegreePitch(endPitch, 0, intervals, root);
        out[li].duration *= fn === "cadence" ? 2.4 : 1.8;
      } else if (fn === "question") {
        out[li].pitch = nearestDegreePitch(endPitch, 4, intervals, root);
        out[li].duration *= 1.2;
      } else {
        out[li].pitch = ceiling;
        out[li].duration *= 1.6;
        out[li].velocity = 127;
      }
    }
  }
  return out;
}
function genCallResponse(ctx, leadNotes) {
  const { cfg, intervals, r, step, totalBeats, gate, dna } = ctx;
  const notes = [];
  const sounding = (t) => leadNotes.some((n) => t >= n.startTime - 1e-6 && t < n.startTime + n.duration - 1e-6);
  const gaps = [];
  let gapStart = null;
  for (let t = 0; t < totalBeats - 1e-6; t += step) {
    const free = !sounding(t) && !sounding(t + step * 0.5);
    if (free && gapStart === null) gapStart = t;
    if (!free && gapStart !== null) {
      gaps.push([gapStart, t]);
      gapStart = null;
    }
  }
  if (gapStart !== null) gaps.push([gapStart, totalBeats]);
  const motif = dna ? motifOps.invert(dna.motif) : null;
  const octave = cfg.octave;
  for (const [gs, ge] of gaps) {
    const span = ge - gs;
    if (span < step * 1.5) continue;
    const maxNotes = Math.max(1, Math.floor(span / step));
    const count = Math.max(1, Math.min(maxNotes, Math.round(cfg.density / 100 * maxNotes)));
    let t = gs;
    for (let j = 0; j < count && t < ge - 1e-6; j++) {
      const bar = Math.floor(t / BEATS_PER_BAR);
      const rootDeg = ctx.prog[bar % ctx.prog.length];
      const isLast = j === count - 1 || t + step * 2 > ge;
      let deg;
      if (isLast) deg = rootDeg;
      else if (motif) deg = rootDeg + motif.degrees[j % motif.degrees.length];
      else deg = rootDeg + pick(r, [0, 2, 4, -1, 1]);
      const pitch = scaleDegreeToMidi(deg, intervals, cfg.root, octave);
      const dur = Math.min(step * (isLast ? 2 : 1) * gate, ge - t);
      notes.push({
        pitch,
        startTime: applySwing(t, step, ctx.swing),
        duration: dur,
        velocity: humVel(r, isLast ? 82 : 70, cfg.humanize)
      });
      t += step;
      if (isLast) break;
    }
  }
  return notes;
}
function applyGroove(notes, groove, depth) {
  if (!groove.timing || !groove.accent || depth <= 0) return notes;
  const k = clamp(depth, 0, 100) / 100;
  return notes.map((n) => {
    const idx = (Math.round(n.startTime % BEATS_PER_BAR / 0.25) % 16 + 16) % 16;
    return {
      ...n,
      startTime: n.startTime + (groove.timing[idx] || 0) * k,
      velocity: clamp(Math.round((n.velocity ?? 100) + (groove.accent[idx] || 0) * k), 1, 127)
    };
  });
}
function applyEnergy(notes, energy) {
  const e = clamp(energy, 0, 1);
  const vScale = 0.6 + 0.55 * e;
  return notes.map((n) => ({ ...n, velocity: clamp(Math.round((n.velocity ?? 100) * vScale), 1, 127) }));
}
function imposeHookForm(notes, intervals, root, totalBeats) {
  if (!notes.length || totalBeats < 4 * BEATS_PER_BAR) return notes;
  const inBar = (b) => notes.filter((n) => n.startTime >= b * BEATS_PER_BAR - 1e-6 && n.startTime < (b + 1) * BEATS_PER_BAR - 1e-6);
  const shiftBar = (src, toBar, fromBar) => src.map((n) => ({ ...n, startTime: n.startTime + (toBar - fromBar) * BEATS_PER_BAR }));
  const groups = Math.floor(totalBeats / (4 * BEATS_PER_BAR));
  const out = [];
  for (let g = 0; g < groups; g++) {
    const b0 = g * 4;
    let A = inBar(b0).map((n) => ({ ...n }));
    if (!A.length) {
      out.push(...inBar(b0), ...inBar(b0 + 1), ...inBar(b0 + 2), ...inBar(b0 + 3));
      continue;
    }
    const center = A.reduce((s, n) => s + n.pitch, 0) / A.length;
    for (const n of A) {
      while (n.pitch - center > 9) n.pitch -= 12;
      while (center - n.pitch > 9) n.pitch += 12;
    }
    A.sort((a, b) => a.startTime - b.startTime);
    let maxLeap = 0;
    for (let i = 1; i < A.length; i++) maxLeap = Math.max(maxLeap, Math.abs(A[i].pitch - A[i - 1].pitch));
    if (maxLeap < 7 && A.length >= 3) {
      const m = Math.floor(A.length / 2);
      A[m].pitch = snapToScale(A[m].pitch + 12, intervals, root);
    }
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
  for (let b = groups * 4; b * BEATS_PER_BAR < totalBeats; b++) out.push(...inBar(b));
  return out;
}
function suggestRateForTempo(tempo, fallback = "1/16") {
  if (!tempo) return fallback;
  if (tempo >= 140) return "1/8";
  if (tempo <= 85) return "1/16";
  return fallback;
}
var STYLE_HINTS = {
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
  breakbeat: { bpm: [128, 140], scales: ["Natural Minor", "Dorian"], note: "Syncopated breaks, 7th stabs" }
};
var MOVE_SLOTS = ["lead", "bass", "harmony", "drums", "piano"];
var MOVE_SLOT_LABELS = {
  lead: "Lead",
  bass: "Bass",
  harmony: "Harmony",
  drums: "Drums",
  piano: "Piano"
};
function resolveMoveTracks(available) {
  const has = (p) => available.includes(p);
  const used = /* @__PURE__ */ new Set();
  const take = (cands) => {
    const hit = cands.find((p) => has(p) && !used.has(p)) ?? null;
    if (hit) used.add(hit);
    return hit;
  };
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
    piano: take(["piano"])
  };
}
var ALL_PARTS = ["lead", "bass", "pad", "chords", "counterMelody", "arp", "drums"];
var S = (name, parts, densityMul) => ({ name, parts, densityMul });
var SONG_TEMPLATES = {
  // "The sequence never leaves": eight scenes, ARP in every one. Built for a hardware sequence
  // that IS the song — the arrangement happens TO it (filter, floor in/out), never without it.
  // Uses the standard section names so every role/energy/phrase/cue map already understands it.
  sequence: [
    S("Intro", ["arp"], 0.45),
    S("Build", ["arp", "bass", "drums"], 0.6),
    S("Main", ["arp", "bass", "chords", "lead", "drums"], 0.95),
    S("Break", ["arp", "pad"], 0.5),
    // floor out — the sequence alone with a wash
    S("Main 2", ["arp", "bass", "chords", "lead", "counterMelody", "drums"], 1),
    S("Build 2", ["arp", "bass", "drums"], 0.7),
    // stripped to the pulse, then…
    S("Drop", ["arp", "bass", "chords", "lead", "counterMelody", "drums"], 1),
    S("Outro", ["arp", "pad"], 0.4)
  ],
  short: [
    S("Intro", ["pad", "arp"], 0.5),
    S("Main", ALL_PARTS, 1),
    S("Break", ["pad", "lead", "chords"], 0.6),
    S("Outro", ["pad", "arp"], 0.4)
  ],
  standard: [
    S("Intro", ["pad", "arp"], 0.5),
    S("Build", ["pad", "arp", "bass", "chords"], 0.75),
    S("Main", ALL_PARTS, 1),
    S("Break", ["pad", "lead", "chords"], 0.6),
    S("Main 2", ALL_PARTS, 1),
    S("Outro", ["pad", "arp"], 0.4)
  ],
  long: [
    S("Intro", ["pad", "arp"], 0.5),
    S("Build", ["pad", "arp", "bass", "chords"], 0.75),
    S("Main", ALL_PARTS, 1),
    S("Break", ["pad", "lead", "chords"], 0.6),
    S("Main 2", ALL_PARTS, 1),
    S("Build 2", ["pad", "arp", "bass", "chords", "counterMelody"], 0.8),
    S("Drop", ALL_PARTS, 1.05),
    S("Outro", ["pad", "arp"], 0.4)
  ],
  // Berlin School (Rubycon / Halcyon / Belfast): strictly ADDITIVE — the sequence
  // starts alone and layers accumulate one per section toward the peak, then the
  // arrangement strips to its emotional core (Winter) and rebuilds.
  berlin: [
    S("Pulse", ["arp"], 0.6),
    S("Layer 1", ["arp", "bass"], 0.7),
    S("Layer 2", ["arp", "bass", "pad"], 0.8),
    S("Layer 3", ["arp", "bass", "pad", "chords", "drums"], 0.9),
    S("Peak", ALL_PARTS, 1),
    S("Strip", ["lead", "pad"], 0.45),
    S("Peak 2", ALL_PARTS, 1),
    S("Fade", ["arp", "pad"], 0.35)
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
    S("Outro", ["drums", "bass", "arp"], 0.5)
  ]
};
function sectionRole(name) {
  const n = name.toLowerCase();
  if (/intro|pulse/.test(n)) return "opener";
  if (/lift/.test(n)) return "riser";
  if (/main|drop|peak|groove/.test(n)) return "payoff";
  if (/break|strip/.test(n)) return "break";
  if (/outro|fade/.test(n)) return "closer";
  if (/build|layer/.test(n)) return "builder";
  return "builder";
}
function pianoInSection(placement, sectionName, index, total) {
  const role = sectionRole(sectionName);
  const bookend = index === 0 || index === total - 1 || role === "opener" || role === "closer";
  switch (placement) {
    case "intro":
      return { plays: bookend, sparse: false };
    case "breaks":
      return { plays: role === "break", sparse: false };
    case "motif":
      return { plays: true, sparse: role === "payoff" || role === "riser" };
    case "all":
      return { plays: true, sparse: false };
  }
}
var SECTION_BARS_BY_ROLE = {
  // opener builder payoff break closer riser
  hypnotic: { opener: 8, builder: 16, payoff: 32, break: 16, closer: 8, riser: 8 },
  standard: { opener: 8, builder: 8, payoff: 16, break: 8, closer: 8, riser: 4 },
  short: { opener: 4, builder: 8, payoff: 8, break: 8, closer: 4, riser: 4 }
};
var MOVE_MAX_BARS = 16;
function capBarsForMove(bars, on) {
  return on ? Math.max(1, Math.min(MOVE_MAX_BARS, bars)) : bars;
}
function sectionBars(sectionName, style) {
  const HYPNOTIC = /* @__PURE__ */ new Set(["dubTechno", "classicSeq", "melodicTechno", "ambient", "detroit"]);
  const cat = style === "lofi" ? "short" : HYPNOTIC.has(style) ? "hypnotic" : "standard";
  return SECTION_BARS_BY_ROLE[cat][sectionRole(sectionName)];
}
function sectionTension(section) {
  switch (section) {
    case "Drop":
    case "Peak":
    case "Peak 2":
    case "Main 2":
      return 0.9;
    case "Main":
    case "Layer 3":
    case "Groove 2":
    case "Lift":
      return 0.7;
    case "Build":
    case "Build 2":
    case "Layer 2":
    case "Groove":
      return 0.5;
    case "Break":
    case "Breakdown":
    case "Strip":
      return 0.35;
    case "Outro":
    case "Fade":
      return 0.1;
    default:
      return 0.4;
  }
}
function planTransition(from, to, style) {
  if (!to) return null;
  const eF = sectionEnergy(from), eT = sectionEnergy(to);
  const delta = eT - eF;
  const tension = sectionTension(to);
  const rising = delta > 0.12, falling = delta < -0.18;
  const bigRise = delta > 0.25;
  const modal = style === "dubTechno" || style === "ambient" || style === "classicSeq";
  const plan = {
    from,
    to,
    delta,
    tension,
    pickup: rising ? bigRise ? 2 : 1 : 0,
    silence: falling ? delta < -0.35 ? 2 : 1 : 0,
    fill: { beats: rising ? bigRise ? 4 : 2 : 0, intensity: clamp(0.5 + delta, 0.3, 1) },
    harmonicPrep: tension >= 0.7 && rising ? modal ? "bVII" : "V" : null,
    cue: ""
  };
  const bits = [];
  if (plan.harmonicPrep) bits.push(`last bar leans to ${plan.harmonicPrep} \u2014 let it want ${to}`);
  if (plan.pickup) bits.push(`${plan.pickup}-note pickup into the downbeat`);
  if (plan.fill.beats) bits.push(`${plan.fill.beats}-beat fill${bigRise ? ", hard" : ""}`);
  if (plan.silence) bits.push(`${plan.silence}-beat drop-out before ${to} \u2014 leave the reverb tail`);
  if (rising) bits.push("automation: filter/DCW closed through the last bar, open ON the downbeat");
  else if (falling) bits.push("automation: pull the filter down across the last bar; the space is the transition");
  plan.cue = bits.length ? `\u21E2 ${to}: ${bits.join("; ")}.` : "";
  return plan;
}
function applyTransition(notes, plan, part, totalBeats, intervals, root, octave, step, curRootDeg, nextRootDeg, authoredLead = false) {
  if (!plan || totalBeats < BEATS_PER_BAR * 2) return notes;
  const protectedLine = authoredLead && part === "lead";
  if (part === "drums") {
    if (!plan.silence) return notes;
    const cut = totalBeats - plan.silence;
    return notes.filter((n) => n.startTime < cut - 1e-6);
  }
  const barStart = totalBeats - BEATS_PER_BAR;
  let out = notes.slice();
  const harmonic = part === "chords" || part === "pad" || part === "bass" || part === "piano";
  const melodic = part === "lead" || part === "arp" || part === "counterMelody";
  if (plan.harmonicPrep && harmonic) {
    const target = nextRootDeg + (plan.harmonicPrep === "V" ? 4 : -1);
    out = out.map((n) => {
      if (n.startTime < barStart - 1e-6) return n;
      const deg = midiToScaleDegree(n.pitch, intervals, root);
      return { ...n, pitch: scaleDegreeToMidi(deg - curRootDeg + target, intervals, root, -1) };
    });
  }
  if (plan.silence && part !== "pad" && !protectedLine) {
    const cut = totalBeats - plan.silence;
    out = out.filter((n) => n.startTime < cut - 1e-6).map((n) => n.startTime + n.duration > cut ? { ...n, duration: Math.max(0.1, cut - n.startTime) } : n);
  }
  if (plan.pickup && melodic && !plan.silence && !protectedLine) {
    const target = nextRootDeg + intervals.length * 1;
    const lastOn = totalBeats - step * plan.pickup;
    out = out.filter((n) => n.startTime < lastOn - 1e-6).map((n) => n.startTime + n.duration > lastOn ? { ...n, duration: Math.max(0.1, lastOn - n.startTime) } : n);
    const from = target - plan.pickup;
    for (let k = 0; k < plan.pickup; k++) {
      out.push({
        pitch: scaleDegreeToMidi(from + k, intervals, root, octave),
        startTime: lastOn + k * step,
        duration: step * 0.85,
        velocity: 96 + k * 10
      });
    }
  }
  return out;
}
function scenePlays(sectionParts, palette) {
  const pal = new Set(palette);
  const plays = sectionParts.filter((p) => pal.has(p));
  const HARM = ["pad", "chords", "arp"], MEL = ["arp", "lead", "counterMelody"];
  const wantsHarm = sectionParts.some((p) => HARM.includes(p)), hasHarm = plays.some((p) => HARM.includes(p));
  if (wantsHarm && !hasHarm) {
    const sub = HARM.find((p) => pal.has(p));
    if (sub) plays.push(sub);
  }
  const wantsMel = sectionParts.some((p) => MEL.includes(p)), hasMel = plays.some((p) => MEL.includes(p));
  if (wantsMel && !hasMel) {
    const sub = MEL.find((p) => pal.has(p) && !plays.includes(p));
    if (sub) plays.push(sub);
  }
  if (!plays.length) {
    const sub = palette.find((p) => p !== "drums") ?? palette[0];
    if (sub) plays.push(sub);
  }
  return ALL_PARTS.concat(["piano"]).filter((p) => plays.includes(p));
}
function sectionEnergy(section) {
  switch (section) {
    case "Intro":
      return 0.3;
    case "Build":
      return 0.55;
    case "Main":
      return 0.8;
    case "Break":
      return 0.42;
    case "Main 2":
      return 0.88;
    case "Build 2":
      return 0.72;
    case "Drop":
      return 1;
    case "Outro":
      return 0.22;
    // Berlin School — additive climb, strip, rebuild
    case "Pulse":
      return 0.35;
    case "Layer 1":
      return 0.5;
    case "Layer 2":
      return 0.62;
    case "Layer 3":
      return 0.78;
    case "Peak":
      return 1;
    case "Strip":
      return 0.4;
    case "Peak 2":
      return 1;
    case "Fade":
      return 0.2;
    // Anthem — groove, expose, lift, drop
    case "Groove":
      return 0.75;
    case "Breakdown":
      return 0.5;
    case "Lift":
      return 0.7;
    case "Groove 2":
      return 0.85;
    default:
      return 0.7;
  }
}
function sectionSeed(songSeed, sectionIdx, part) {
  const p = ALL_PARTS.indexOf(part) + 1;
  let h = (songSeed | 0) >>> 0;
  h = Math.imul(h ^ sectionIdx + 1, 2654435761) >>> 0;
  h = Math.imul(h ^ p, 2246822519) >>> 0;
  return h % 1e6;
}
function evolveLine(ctx, notes, strength) {
  const bend = clamp((100 - strength) / 100, 0, 1) * 0.6;
  if (bend <= 0 || !notes.length) return notes;
  const { intervals, cfg } = ctx;
  const r = ctx.rMotif ?? ctx.r;
  const seenBar = /* @__PURE__ */ new Set();
  return notes.map((n) => {
    const bar = Math.floor(n.startTime / BEATS_PER_BAR);
    const firstOfBar = !seenBar.has(bar);
    seenBar.add(bar);
    const downbeat = Math.abs(n.startTime % 1) < 1e-6;
    if (bar === 0 && strength >= 70) return n;
    if (firstOfBar || downbeat || !chance(r, bend)) return n;
    const dir = r() < 0.5 ? -1 : 1;
    const deg = midiToScaleDegree(n.pitch, intervals, cfg.root);
    return { ...n, pitch: scaleDegreeToMidi(deg + dir, intervals, cfg.root, -1) };
  });
}
function generate(cfg) {
  const traits = STYLES[cfg.style] ?? STYLES.melodicTechno;
  const intervals = SCALES[cfg.scale] ?? SCALES["Natural Minor"];
  const r = mulberry32((cfg.seed | 0) ^ 2654435769);
  const totalBeats = Math.max(1, cfg.bars) * BEATS_PER_BAR;
  const step = rateBeats(cfg.rate);
  const dna = cfg.dna;
  const strength = clamp(cfg.strength ?? 0, 0, 100);
  const useDna = !!dna && strength > 0;
  const presetProg = presetProgression(cfg.progressionPreset, intervals);
  const mix = Object.fromEntries(DNA_DIMS.map((d) => [d, clamp(cfg.dnaMix?.[d] ?? DNA_DIM_DEFAULT(d, strength), 0, 100)]));
  const prog = presetProg ?? (useDna ? blendProgression(dna, traits.progressions, mix.harmony) : pick(r, traits.progressions));
  const freeSwing = cfg.swing > 0 ? cfg.swing / 100 : traits.swing;
  const g = mix.groove / 100;
  const swing = useDna ? freeSwing + (dna.groove.swing / 100 - freeSwing) * g : freeSwing;
  const humanizeSrc = useDna ? { ...cfg, humanize: Math.round(cfg.humanize + (dna.groove.humanize - cfg.humanize) * g) } : cfg;
  const gate = traits.gate * tempoGate(cfg.tempo);
  const salt = (cfg.sceneSalt ?? 0) * 2654435761 >>> 0;
  const songR = (k) => mulberry32((((dna?.seed ?? 0) | 0) ^ k ^ salt) >>> 0);
  const rMotif = useDna && cfg.dnaLocks?.motif ? songR(1836020841) : r;
  const rRhythm = useDna && cfg.dnaLocks?.rhythm ? songR(1919449460) : r;
  const regOctave = useDna ? cfg.octave + (dna.baseOctave - cfg.octave) * (mix.register / 100) : cfg.octave;
  const ctx = {
    cfg: humanizeSrc,
    traits,
    intervals,
    r,
    totalBeats,
    step,
    prog,
    swing,
    gate,
    dna,
    strength: mix.motif,
    userHumanize: cfg.humanize,
    mix,
    rMotif,
    rRhythm,
    regOctave
  };
  const authoredLead = cfg.part === "lead" && useDna && !!dna.authored && dna.authored.notes.length > 0 && strength > 0;
  let notes;
  switch (cfg.part) {
    case "chords":
      notes = genChords(ctx, false);
      break;
    case "pad":
      notes = genChords(ctx, true);
      break;
    case "bass":
      notes = genBass(ctx);
      break;
    case "arp":
      notes = genArp(ctx);
      break;
    case "lead":
      if (authoredLead) notes = genMotifLine(ctx, "lead");
      else notes = useDna ? evolveLine(ctx, genMotifLine(ctx, "lead"), mix.motif) : genMelodicLine(ctx, "lead");
      break;
    case "counterMelody":
      if (cfg.leadNotes && cfg.leadNotes.length) {
        notes = genCallResponse(ctx, cfg.leadNotes);
        if (!notes.length) notes = genMelodicLine(ctx, "counter");
      } else {
        notes = useDna ? evolveLine(ctx, genMotifLine(ctx, "counter"), mix.motif) : genMelodicLine(ctx, "counter");
      }
      break;
    case "piano":
      notes = genPiano(ctx);
      break;
    case "drums":
      notes = genDrums(ctx);
      break;
    default:
      throw new Error(`generate(): unknown part "${String(cfg.part)}" \u2014 expected one of ${Object.keys(PART_LABELS).join(", ")}`);
  }
  const MONO_REGISTER = ["lead", "counterMelody", "bass", "arp"];
  const DNA_REGISTER = ["lead", "counterMelody", "arp"];
  if (useDna && DNA_REGISTER.includes(cfg.part) && !authoredLead) {
    const [lo, hi] = registerWindow(dna, cfg.part, cfg.root, regOctave);
    notes = notes.map((n) => ({ ...n, pitch: clampToRegister(n.pitch, lo, hi, intervals, cfg.root) }));
  }
  const range = partRange(cfg.part, cfg.root, cfg.octave);
  if (cfg.part === "lead" && (cfg.hookMode ?? traits.hook) && !authoredLead) {
    notes = imposeHookForm(notes, intervals, cfg.root, totalBeats);
  }
  if (useDna && cfg.part === "lead" && dna.phrase && !authoredLead) {
    notes = applyPhrasing(notes, dna.phrase, intervals, cfg.root, totalBeats, range);
  }
  if (MONO_REGISTER.includes(cfg.part) && !authoredLead) {
    notes = notes.map((n) => ({ ...n, pitch: clampToRegister(n.pitch, range[0], range[1], intervals, cfg.root) }));
  }
  if (cfg.scaleLock && !authoredLead) {
    notes = notes.map(
      (n) => cfg.part === "drums" || n.keepChromatic ? n : { ...n, pitch: snapToScale(n.pitch, intervals, cfg.root) }
    );
  }
  if (cfg.energy != null) notes = applyEnergy(notes, cfg.energy);
  if (useDna && !authoredLead) notes = applyGroove(notes, dna.groove, (cfg.grooveDepth ?? 55) * (mix.groove / 100));
  const totalBarsAll = Math.round(totalBeats / BEATS_PER_BAR);
  if (totalBarsAll >= 32) {
    const dr = mulberry32((cfg.seed | 0) ^ 868855);
    const finalThird = totalBeats * (2 / 3);
    if (cfg.part === "bass" && notes.length) {
      notes = notes.map((n) => {
        if (n.startTime < finalThird || n.pitch == null) return n;
        return dr() < 0.35 ? { ...n, pitch: n.pitch + 12 } : n;
      });
    }
    if (cfg.part === "pad" && notes.length) {
      const byOnset = /* @__PURE__ */ new Map();
      for (const n of notes) {
        if (n.startTime < finalThird || n.pitch == null) continue;
        const k = Math.round(n.startTime * 1e3);
        (byOnset.get(k) ?? byOnset.set(k, []).get(k)).push(n);
      }
      const added = [];
      for (const group of byOnset.values()) {
        if (dr() > 0.6) continue;
        const top = group.reduce((a, b) => (b.pitch ?? -1) > (a.pitch ?? -1) ? b : a);
        if (top.pitch != null && top.pitch + 12 <= 108) {
          added.push({ ...top, pitch: top.pitch + 12, velocity: clamp(Math.round((top.velocity ?? 90) * 0.7), 1, 127) });
        }
      }
      notes = notes.concat(added);
    }
    if (cfg.part === "drums" && notes.length && totalBarsAll >= 24) {
      const D = { ...DRUM_MAP, ...cfg.drumMap ?? {} };
      const pop = cfg.drumMap != null ? [...new Set(Object.values(cfg.drumMap))] : [];
      const snareN = cfg.drumMap != null ? mapNoteToKit(DRUM_MAP.snare, pop) ?? D.snare : D.snare;
      for (let bar = 16; bar < totalBarsAll; bar += 16) {
        if (bar >= totalBarsAll - 1) break;
        const beatStart = bar * BEATS_PER_BAR - 1;
        for (let s = 0; s < 4; s++) {
          if (s === 0 && dr() < 0.4) continue;
          notes.push({ pitch: snareN, startTime: beatStart + s * 0.25, duration: 0.09, velocity: clamp(58 + s * 9, 1, 127) });
        }
      }
    }
  }
  if (cfg.fillAtEnd && cfg.part === "drums" && totalBeats >= BEATS_PER_BAR) {
    const D = { ...DRUM_MAP, ...cfg.drumMap ?? {} };
    const pop = cfg.drumMap != null ? [...new Set(Object.values(cfg.drumMap))] : [];
    const kickN = cfg.drumMap != null ? mapNoteToKit(DRUM_MAP.kick, pop) ?? D.kick : D.kick;
    const snareN = cfg.drumMap != null ? mapNoteToKit(DRUM_MAP.snare, pop) ?? D.snare : D.snare;
    const barStart = totalBeats - BEATS_PER_BAR;
    notes = notes.filter((n) => !(n.startTime >= barStart + 2 - 1e-6 && (n.pitch === D.closedHat || n.pitch === D.openHat)));
    const fb = cfg.fillBeats ?? 2, fi = clamp(cfg.fillIntensity ?? 0.7, 0.3, 1);
    const fStart = barStart + (BEATS_PER_BAR - fb), steps = fb * 4;
    if (fb === 4) notes = notes.filter((n) => !(n.startTime >= barStart - 1e-6 && (n.pitch === D.closedHat || n.pitch === D.openHat)));
    for (let s = 0; s < steps; s++) {
      const t = fStart + s * 0.25;
      if (s >= steps / 4 || chance(r, 0.6)) {
        notes.push({ pitch: snareN, startTime: t, duration: 0.1, velocity: clamp(Math.round((56 + s * (64 / steps)) * (0.6 + fi * 0.5)), 1, 127) });
      }
    }
    notes.push({ pitch: kickN, startTime: totalBeats - 0.25, duration: 0.1, velocity: 118 });
  }
  if (cfg.finalCadence && cfg.part !== "drums" && notes.length && totalBeats >= BEATS_PER_BAR) {
    const barStart = totalBeats - BEATS_PER_BAR;
    notes = notes.map((n) => {
      if (n.startTime < barStart - 1e-6) return n;
      const k = 1 - 0.55 * ((n.startTime - barStart) / BEATS_PER_BAR);
      return { ...n, velocity: clamp(Math.round((n.velocity ?? 100) * k), 1, 127) };
    });
    const lastOnset = Math.max(...notes.map((n) => n.startTime));
    notes = notes.map((n) => {
      if (Math.abs(n.startTime - lastOnset) > 1e-6) return n;
      const resolved = cfg.part === "chords" || cfg.part === "pad" ? n.pitch : nearestDegreePitch(n.pitch, 0, intervals, cfg.root);
      return { ...n, pitch: resolved, duration: Math.max(n.duration, totalBeats - n.startTime), keepChromatic: false };
    });
    if (cfg.part === "bass") {
      const last = notes.reduce((a, n) => n.startTime > a.startTime ? n : a);
      last.pitch = nearestDegreePitch(last.pitch, 0, intervals, cfg.root);
    }
  }
  notes = cleanupNotes(notes, totalBeats);
  return {
    notes,
    lengthBeats: totalBeats,
    meta: {
      part: cfg.part,
      style: cfg.style,
      styleLabel: traits.label,
      scaleName: cfg.scale,
      noteCount: notes.length
    }
  };
}
var _internal = { scaleDegreeToMidi, snapToScale, rateBeats, mulberry32, tempoGate, applySwing };
export {
  DNA_DIMS,
  DNA_DIM_DEFAULT,
  DRIFT_OSC1_WAVES,
  DRIFT_OSC2_WAVES,
  DRUM_FAMILIES,
  DRUM_MAP,
  FAMILY_OVERRIDE,
  INFLUENCES,
  INSTRUMENT_PATCHES,
  MONO_PATCHES,
  MOVE_FX_TO_LIVE_DEVICE,
  MOVE_MAX_BARS,
  MOVE_SLOTS,
  MOVE_SLOT_LABELS,
  NOTE_NAMES,
  PART_LABELS,
  PATCH_DISPLAY_NAMES,
  PATCH_ROLES,
  PIANO_FIGURE_LABELS,
  PROFILE_CUES,
  PROGRESSION_PRESETS,
  RECIPE_DEVICE_NAMES,
  SAFE_PARAM_TARGETS,
  SCALES,
  SONG_STARTERS,
  SONG_TEMPLATES,
  SOUND_GUIDE,
  SOUND_PROFILE_IDS,
  STARTER_FAMILY,
  STARTER_FAMILY_ORDER,
  STYLES,
  STYLE_FAMILY,
  STYLE_HINTS,
  TRACK_PATCH_SEP,
  _internal,
  applyTransition,
  authoredOps,
  blendProgression,
  buildMotifCell,
  buildSongSheet,
  buildSongStory,
  capBarsForMove,
  contourOf,
  deriveDNA,
  describeDriftPatch,
  deviceRecipe,
  driftWaveIndex,
  extractDNA,
  generate,
  isLongStarter,
  mapNoteToKit,
  motifOps,
  moveRecipe,
  mutate,
  patchDisplayName,
  patchFx,
  patchInserts,
  patchLiveEffects,
  patchMacros,
  patchRole,
  pianoFigureFor,
  pianoInSection,
  planTransition,
  presetProgression,
  presetRaisesV,
  rackFileName,
  rateBeats,
  reconcileDNA,
  remapDrumsToKit,
  resolveMoveTracks,
  resolveStarter,
  sceneAuthoredTransform,
  sceneMotifTransform,
  scenePlays,
  sectionBars,
  sectionEnergy,
  sectionPhraseProfile,
  sectionSeed,
  sectionTension,
  songName,
  songSheetMarkdown,
  starterClipBars,
  starterInfluences,
  suggestRateForTempo,
  trackBaseName,
  trackNameForPatch
};
