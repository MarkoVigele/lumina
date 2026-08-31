#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "Lumina · Test oeffnen"
echo "Lädt eine vorhandene Spielwiese."
echo ""
lumina_version open-test --ask
