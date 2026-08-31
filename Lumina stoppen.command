#!/bin/zsh
cd "$(dirname "$0")"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

npm run stoppen
echo ""
echo "Fertig. Dieses Fenster kannst du schließen."
echo "Taste zum Beenden …"
read -r
