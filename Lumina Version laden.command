#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "Lumina · Stand laden"
echo "Öffnet einen zuvor gesicherten Schnappschuss."
echo ""
lumina_version load --ask
