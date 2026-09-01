# Lumina auf dem Mac

Wir starten vom Finder. Ein Doppelklick reicht.

Beim ersten Mal fragt macOS nach. Dann Rechtsklick → Öffnen.

## Server

| Datei | Wirkung |
| --- | --- |
| `Lumina starten.command` | Server unter http://127.0.0.1:45219 |
| `Lumina stoppen.command` | Server beenden |
| `Lumina updaten.command` | Holt den Stand (`git pull`) und die Abhängigkeiten |
| `Lumina neu starten.command` | Stoppt, holt, startet und öffnet den Browser |

Fehlende `node_modules` legt **starten** selbst an.

## Versionen

Stabil bleibt `main`. Tests sind Branches `test-…`. Gesicherte Stände sind Tags `stand-…`.

| Datei | Wirkung |
| --- | --- |
| `Lumina Version Stand.command` | Zeigt, wo wir sind |
| `Lumina Version Stabil.command` | Zurück auf die Hauptversion |
| `Lumina Version Test anlegen.command` | Neue Spielwiese von hier |
| `Lumina Version Test laden.command` | Eine vorhandene Spielwiese laden |
| `Lumina Version Stand sichern.command` | Aktuellen Stand merken |
| `Lumina Version Stand laden.command` | Einen gemerkten Stand öffnen |

**Test anlegen** nimmt offene Dateien mit. **Stabil**, **Test laden** und **Stand laden** bleiben stehen, wenn Dateien ungespeichert sind. Im Dialog können wir merken (Stash) und trotzdem wechseln. `.DS_Store` blockiert nicht.

## Terminal

Dasselbe geht mit `npm run starten`, `npm run stoppen`, `npm run updaten` und `npm run neustart`.

Versionen: `npm run version:stand`, `version:stabil`, `version:test-anlegen`, `version:test-laden`, `version:stand-sichern`, `version:stand-laden`.
