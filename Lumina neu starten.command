#!/bin/zsh
cd "$(dirname "$0")"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

PORT=45219
URL="http://127.0.0.1:${PORT}"

echo "1/3  Lumina wird gestoppt …"
npm run stoppen
sleep 0.5

echo ""
echo "2/3  Update (git pull + npm install) …"
npm run updaten || {
  echo "Update fehlgeschlagen. Fenster offen lassen und prüfen."
  echo "Taste zum Beenden …"
  read -r
  exit 1
}

if [ ! -d node_modules ]; then
  echo "Abhängigkeiten fehlen — installiere …"
  npm install || exit 1
fi

echo ""
echo "3/3  Start unter ${URL}"
echo "Dieses Fenster offen lassen. Zum Beenden: Lumina stoppen.command"
echo ""
(sleep 1.5 && open "${URL}") &
npm run dev
