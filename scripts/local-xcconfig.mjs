// Reads and updates ios/App/local.xcconfig: the app's version, build number, and signing team.
// The file isn't committed, so these per-machine values never conflict with `git pull`.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LOCAL_XCCONFIG = join(dirname(fileURLToPath(import.meta.url)), '../ios/App/local.xcconfig');

export function readLocal() {
  const values = {};
  if (!existsSync(LOCAL_XCCONFIG)) return values;
  for (const line of readFileSync(LOCAL_XCCONFIG, 'utf8').split('\n')) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m) values[m[1]] = m[2];
  }
  return values;
}

export function updateLocal(changes) {
  const values = { ...readLocal(), ...changes };
  const body = Object.entries(values).map(([k, v]) => `${k} = ${v}`).join('\n');
  writeFileSync(LOCAL_XCCONFIG, `// Written by npm run app:sync and npm run ios:team. Not committed.\n${body}\n`);
}

const PBXPROJ = join(dirname(fileURLToPath(import.meta.url)), '../ios/App/App.xcodeproj/project.pbxproj');

// When the Team is picked in Xcode, Xcode saves it in the project file. Move it to local.xcconfig
// so the project file matches git again. Returns the team ID that was moved, or null.
export function adoptTeamFromProject() {
  if (!existsSync(PBXPROJ)) return null;
  const src = readFileSync(PBXPROJ, 'utf8');
  const m = /DEVELOPMENT_TEAM = "?([A-Z0-9]{10})"?;/.exec(src);
  if (!m) return null;
  writeFileSync(PBXPROJ, src.replace(/\n\t*DEVELOPMENT_TEAM = [^;]*;/g, ''));
  updateLocal({ DEVELOPMENT_TEAM: m[1] });
  return m[1];
}
