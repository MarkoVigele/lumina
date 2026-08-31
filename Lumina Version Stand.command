#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "Lumina · Wo bin ich?"
echo ""
node scripts/version.mjs status
lumina_wait
