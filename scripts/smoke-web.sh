#!/usr/bin/env bash
# REF-413：委托根 package.json smoke:web
set -euo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)"
pnpm smoke:web
