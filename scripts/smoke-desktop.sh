#!/usr/bin/env bash
# REF-413：委托根 package.json smoke:desktop
set -euo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)"
pnpm smoke:desktop
