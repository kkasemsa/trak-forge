// Compiles forge/engine.ts (the MIDI FORGE Live generator, copied unchanged from the extension's
// source) to js/forge/engine.js, which the app and the tests import. Run after updating engine.ts:
//   npm run engine
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
await build({
  entryPoints: [join(root, 'forge/engine.ts')],
  outfile: join(root, 'js/forge/engine.js'),
  bundle: true,
  format: 'esm',
  target: 'es2020',
  banner: { js: '// Generated from forge/engine.ts by scripts/build-engine.mjs. Do not edit.' },
});
console.log('js/forge/engine.js written');
