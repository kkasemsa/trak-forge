// Builds www/, the folder Capacitor copies into the iPad app, and stamps the app version.
// Run through `npm run app:sync`, which then runs `cap sync ios`.
import { cpSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { updateLocal, adoptTeamFromProject } from './local-xcconfig.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');

// The web app: page, styles, scripts and icons.
const FILES = ['index.html', 'css', 'js', 'icons'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const f of FILES) cpSync(join(root, f), join(out, f), { recursive: true });

// Capacitor's core runtime is a single ES module. js/transport.js imports it only inside the app.
mkdirSync(join(out, 'js/vendor'), { recursive: true });
cpSync(join(root, 'node_modules/@capacitor/core/dist/index.js'), join(out, 'js/vendor/capacitor-core.js'));

// App Store version = app version; build number = commit count, so every upload gets a new one.
// They go in ios/App/local.xcconfig (not committed), so the Xcode project file doesn't change.
const version = readFileSync(join(root, 'js/version.js'), 'utf8').match(/VERSION = '([^']+)'/)[1];
let build = null;
try {
  build = execSync('git rev-list --count HEAD', { cwd: root }).toString().trim();
} catch { /* not a git checkout: keep the build number already set */ }
updateLocal({ MARKETING_VERSION: version, ...(build ? { CURRENT_PROJECT_VERSION: build } : {}) });
const team = adoptTeamFromProject();
if (team) console.log(`Apple team ${team} moved to ios/App/local.xcconfig`);

console.log(`www/ built: version ${version}${build ? `, build ${build}` : ''}`);
