#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "Lumina · Test anlegen"
echo "Neue Spielwiese von hier. Stabil bleibt unberührt."
echo ""
lumina_version new-test --ask
