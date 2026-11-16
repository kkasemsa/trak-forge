#!/bin/zsh
# Xcode Cloud: runs after the repository is cloned, before Xcode resolves packages.
# The app is a web app wrapped with Capacitor, so the Mac in the cloud needs Node to
# build www/ and sync it into the Xcode project (CapApp-SPM points at node_modules).
set -euo pipefail

echo "Installing Node"
brew install node@22 >/dev/null 2>&1 || brew install node >/dev/null 2>&1 || true
export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
node --version
npm --version

cd "$CI_PRIMARY_REPOSITORY_PATH"
echo "Installing packages"
npm ci --no-fund --no-audit

echo "Building the app files"
node scripts/build-app.mjs
npx cap sync ios

# Build number: Xcode Cloud's own counter, so every build uploads with a new number.
if [[ -n "${CI_BUILD_NUMBER:-}" ]]; then
  echo "CURRENT_PROJECT_VERSION = $CI_BUILD_NUMBER" >> ios/App/local.xcconfig
fi
echo "local.xcconfig:"; cat ios/App/local.xcconfig
