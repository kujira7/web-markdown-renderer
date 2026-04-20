#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERSION="$(node -p "require('./package.json').version")"
ZIP_PATH="dist/web-markdown-renderer-${VERSION}.zip"

rm -rf dist
mkdir -p dist

zip -r "$ZIP_PATH" \
  manifest.json \
  background.js \
  content.js \
  renderer.js \
  viewer.css \
  icons \
  vendor \
  LICENSE

echo "$ZIP_PATH"
