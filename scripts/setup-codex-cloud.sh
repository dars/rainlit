#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

node -e 'if (Number(process.versions.node.split(".")[0]) < 22) { console.error("Node.js 22 or newer is required."); process.exit(1); }'
npm ci
npm run typecheck
node tests/rain-character.mjs
node tests/rain-resolution.mjs
node tests/cafe-exit.mjs
node tests/owner-transition.mjs
npm run build
