// Preset names. The SEQTRAK has no screen and never shows a sound's name; the catalogue does.
import { PRESETS } from '../data/presets.js';

// number: catalogue number (1-based), which is CurrentSound + 1.
export function preset(number) {
  const row = number ? PRESETS[number - 1] : null;
  return row ? { number, name: row[0], category: row[1], engine: row[2] } : null;
}

// Which sound engine a part uses: parts 0-6 are drum tracks, 7-8 the two AWM2 synths, 9 the DX.
export const engineOf = part => (part <= 6 ? 'Drum' : part <= 8 ? 'Synth' : part === 9 ? 'DX' : null);

// Every preset a part can load, in catalogue order.
export function presetsFor(part) {
  const engine = engineOf(part);
  const out = [];
  PRESETS.forEach((row, i) => { if (row[2] === engine) out.push({ number: i + 1, name: row[0], category: row[1] }); });
  return out;
}
