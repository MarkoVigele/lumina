#!/bin/zsh
cd "$(dirname "$0")"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

npm run updaten
echo ""
echo "Fertig. Danach Lumina starten.command ausführen."
echo "Taste zum Beenden …"
read -r
