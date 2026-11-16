// Preset names. The SEQTRAK has no screen and never shows a sound's name; the catalogue does.
import { PRESETS } from '../data/presets.js';

// number: catalogue number (1-based), which is CurrentSound + 1.
export function preset(number) {
  const row = number ? PRESETS[number - 1] : null;
  return row ? { number, name: row[0], category: row[1], engine: row[2] } : null;
}
