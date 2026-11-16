#!/usr/bin/env bash
# One-time Mac setup for the iPad app: checks your tools, installs packages,
# builds the app files, and opens the project in Xcode.
#   npm run ios:setup                 check, build, open Xcode
#   npm run ios:setup -- ABCDE12345   same, and set your Apple team ID
set -euo pipefail
cd "$(dirname "$0")/.."

ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n    → %s\n' "$1" "$2"; exit 1; }
note() { printf '  \033[33m!\033[0m %s\n    → %s\n' "$1" "$2"; }

echo "Checking your Mac"
[[ "$(uname)" == "Darwin" ]] || fail "This isn't a Mac" "iPad apps can only be built on macOS."

command -v node >/dev/null || fail "Node.js isn't installed" "Install the LTS version (22 or newer) from https://nodejs.org"
major=$(node -p 'process.versions.node.split(".")[0]')
(( major >= 22 )) || fail "Node $(node -v) is too old" "Install the LTS version (22 or newer) from https://nodejs.org"
ok "Node $(node -v)"

dev=$(xcode-select -p 2>/dev/null || true)
[[ -n "$dev" ]] || fail "Xcode isn't set up" "Install Xcode from the App Store and open it once."
[[ "$dev" != *CommandLineTools* ]] || fail "Your Mac points at the Command Line Tools, not Xcode" "Run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
xcodebuild -version >/dev/null 2>&1 || fail "Xcode isn't ready" "Open Xcode once and accept the license, or run: sudo xcodebuild -license accept"
xcodebuild -checkFirstLaunchStatus >/dev/null 2>&1 || fail "Xcode hasn't finished its first-launch setup" "Run: sudo xcodebuild -runFirstLaunch"
ok "$(xcodebuild -version | head -1)"
xcodebuild -showsdks 2>/dev/null | grep -q iphoneos || fail "The iOS platform isn't installed in Xcode" "Open Xcode > Settings > Components and install iOS."
ok "iOS platform installed"

if [[ $# -ge 1 ]]; then
  echo "Setting your Apple team"
  node scripts/set-team.mjs "$1"
fi

echo "Installing packages"
npm install --no-fund --no-audit

echo "Building the app files"
npm run --silent app:sync

if ! grep -qs "DEVELOPMENT_TEAM = " ios/App/local.xcconfig ios/App/app.xcconfig; then
  note "No Apple team set yet" "In Xcode click App (blue icon, top of the left sidebar) > Signing & Capabilities > Team and pick your Apple ID, then run: npm run ios:team"
fi

echo "Opening Xcode"
npx cap open ios
ok "Done. Plug in your iPad, pick it at the top of Xcode, and press ▶ (Run)."
