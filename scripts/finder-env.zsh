export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

PORT=45219
URL="http://127.0.0.1:${PORT}"

lumina_wait() {
  echo ""
  echo "Taste zum Schließen …"
  read -r
}

lumina_start_dev() {
  if [ ! -d node_modules ]; then
    echo "Abhängigkeiten fehlen — installiere einmalig …"
    npm install || return 1
  fi
  echo ""
  echo "Lumina startet unter ${URL}"
  echo "Dieses Fenster offen lassen. Zum Beenden: Lumina stoppen.command"
  echo ""
  (sleep 1.5 && open "${URL}") &
  npm run dev
}

# 0 = fertig, nichts starten
# 2 = abgebrochen
# 10 = Version gewechselt, Server neu starten
# sonst Fehler
lumina_version() {
  node scripts/version.mjs "$@"
  local code=$?
  if [ $code -eq 2 ]; then
    lumina_wait
    exit 0
  fi
  if [ $code -eq 10 ]; then
    lumina_start_dev
    exit $?
  fi
  if [ $code -ne 0 ]; then
    lumina_wait
    exit $code
  fi
  lumina_wait
  exit 0
}
