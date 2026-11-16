// Sets your Apple Developer team for signing, in ios/App/local.xcconfig (not committed), so the
// Xcode project file stays unchanged and `git pull` never conflicts.
//   npm run ios:team -- ABCDE12345   set it by ID (developer.apple.com/account, Membership details)
//   npm run ios:team                 after picking the Team in Xcode, move it out of the project file
import { adoptTeamFromProject, readLocal, updateLocal } from './local-xcconfig.mjs';

const arg = (process.argv[2] || '').trim().toUpperCase();
const moved = adoptTeamFromProject();
if (arg) {
  if (!/^[A-Z0-9]{10}$/.test(arg)) {
    console.error('A team ID is 10 letters and digits, for example: npm run ios:team -- ABCDE12345');
    process.exit(1);
  }
  updateLocal({ DEVELOPMENT_TEAM: arg });
  console.log(`Apple team ${arg} saved in ios/App/local.xcconfig.`);
} else if (moved) {
  console.log(`Apple team ${moved} moved from the Xcode project to ios/App/local.xcconfig.`);
} else if (readLocal().DEVELOPMENT_TEAM) {
  console.log(`Apple team ${readLocal().DEVELOPMENT_TEAM} is already set in ios/App/local.xcconfig.`);
} else {
  console.error('No team set. Either pick your Team in Xcode (App target > Signing & Capabilities) and run');
  console.error('npm run ios:team again, or give the ID: npm run ios:team -- ABCDE12345');
  process.exit(1);
}
