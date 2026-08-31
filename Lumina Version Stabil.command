#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "Lumina · Stabil"
echo "Wechselt zurück auf die sichere Hauptversion (main)."
echo ""
lumina_version stable --ask
