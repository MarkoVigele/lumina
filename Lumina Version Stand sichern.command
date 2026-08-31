#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "Lumina · Stand sichern"
echo "Merkt den aktuellen Code wie ein Foto. Du kannst später genau hierher zurück."
echo ""
lumina_version save --ask
