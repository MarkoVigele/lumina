# Lumina

Eine interaktive 2D-Partikel- und Rauchsimulation. Weich, hochauflösend und nicht fotorealistisch — eher ein digitales Kunstwerk als eine Physik-Demo.

Lumina hält visuelle Qualität, Farbe, Physik, Schwarm-KI, Interaktion, kreative Modi und ein volles Einstellungs-/Preset-/Save-System auf derselben Ebene.

## Lokal starten — ohne Terminal

Im Finder liegen Doppelklick-Shortcuts im Projektordner (`Projekte/lumina`), analog zu Aether.

### Server

| Datei | Wirkung |
| --- | --- |
| **Lumina starten.command** | Startet den Server unter [http://127.0.0.1:45219](http://127.0.0.1:45219) |
| **Lumina stoppen.command** | Beendet den Server |
| **Lumina updaten.command** | Holt die neueste Version (`git pull`) und installiert Abhängigkeiten |
| **Lumina neu starten.command** | Stoppt, aktualisiert, startet und öffnet den Browser |

### Versionen — Tests und Schnappschüsse

Stabil bleibt `main`. Testversionen sind eigene Git-Branches (`test-…`). Gesicherte Stände sind Tags (`stand-…`). **Test anlegen** nimmt offene Dateien mit. **Stabil / Test laden / Stand laden** stoppen bei ungespeicherten Dateien und listen sie. Im Finder kannst du sie merken (Stash) und trotzdem wechseln. `.DS_Store` und ähnliche Reste blockieren nicht.

Wenn ich auf einer Testversion arbeiten soll, reicht eine Nachricht mit Name und Wunsch, zum Beispiel: `Bitte auf Test „KI“ arbeiten. Ich will, dass die Schwärme stärker wirken.` Die Version kannst du vorher anlegen oder ich lege sie an.

| Datei | Wirkung |
| --- | --- |
| **Lumina Version Stand.command** | Zeigt, wo du gerade bist, plus eine Kurzliste der anderen Dateien |
| **Lumina Version Stabil.command** | Zurück auf die sichere Hauptversion |
| **Lumina Version Test anlegen.command** | Neue Spielwiese von hier (Stabil bleibt unberührt) |
| **Lumina Version Test laden.command** | Eine vorhandene Spielwiese laden und den Server neu starten |
| **Lumina Version Stand sichern.command** | Aktuellen Code-Stand merken, wie ein Foto |
| **Lumina Version Stand laden.command** | Einen gemerkten Stand öffnen. Darauf weiterbauen: danach **Test anlegen** |

Beim ersten Doppelklick auf **starten** werden fehlende `node_modules` automatisch installiert. macOS fragt beim ersten Mal, ob die Datei geöffnet werden darf — mit Rechtsklick → Öffnen bestätigen.

In Cursor geht dasselbe über `Tasks: Run Task` oder im Terminal:

```bash
npm run starten
npm run stoppen
npm run updaten
npm run neustart
npm run version:stand
npm run version:stabil
npm run version:test-anlegen -- ki
npm run version:test-laden -- test-ki
npm run version:stand-sichern -- guter-stand
npm run version:stand-laden -- stand-guter-stand
```

## Was du tun kannst

- Maus oder Finger ziehen: anziehen, abstoßen, werfen, schneiden, explodieren, heilen, Farbe auftragen
- Doppelklick oder Werkzeug **Explosion**: weiche Stoßwelle plus Funken
- Rechtsklick oder Alt+Ziehen: Kamera schwenken, Mausrad zoomen
- Presets mischen: eine Szene unter Szenen, die Palette unabhängig unter Farbe
- Acht Save-Slots, Favoriten, Autosave, Export/Import als JSON

### Tastatur

| Taste | Aktion |
| --- | --- |
| `Leertaste` | Pause |
| `1`–`7` | Werkzeuge |
| `[` `]` | Pinsel kleiner / größer |
| `F` | Form ein/aus |
| `E` | Explosion ein/aus |
| `K` | KI weiter (Aus / Schwarm / Agenten) |
| `V` | Evolve (DNA mutieren) |
| `R` | Szene neu aufbauen |
| `C` | Leeren |
| `X` | Zufällige Presets |
| `H` | Panel ein/aus |
| `Entf` | Gewählten Emitter entfernen |
| `Ctrl/Cmd+Z` | Rückgängig (20 Schritte) |
| `Ctrl/Cmd+Y` oder `Shift+Z` | Wiederholen |
| `Ctrl/Cmd+S` | Slot 1 speichern |
| `Ctrl/Cmd+L` | Slot 1 laden |

Szenen liegen in vier Gruppen: Nur das Feld, Feld und Explosion, Form hält, Form und KI. Jede Karte zeigt Plaketten für Feld, Form, KI und Explosion. Farbpaletten liegen im Reiter Farbe.

Die Reiter folgen der Lesart: Form hält, Physik bewegt, Emitter speit, KI denkt, Explosion reißt, Farbe malt. Pro Karte stehen oben drei bis fünf starke Hebel. **Fein einstellen** öffnet die Feinarbeit — Schwelle, Boids-Regeln, Drehung, Glow, Leistung.

Emitter starten leer. **Auf die Fläche setzen**, dann klicken. Eine gesetzte Quelle lässt sich ziehen und im Reiter Emitter einstellen. Das Feld atmet weiter von allein.

## Einstellungen und wer sie besitzt

Regler, die gerade keine Wirkung haben, sind ausgegraut. Darunter steht, warum — und was du tun musst, damit sie wieder gehen.

- **Form an + Falte über 0,55:** Schwerkraft, Wind und Turbulenz übernimmt die Form. Dämpfung, Auftrieb, Teilchen und Mischung bleiben wach. Falte senken oder Form aus.
- **KI aus:** nur das Feld. Persönlichkeit, Stärke und Regeln ruhen. Schwarm oder Agenten einschalten.
- **KI auf Schwarm/Agenten + hohe Falte:** die KI-Regler bleiben verstellbar, wirken aber gedämpft.
- **Explosion aus:** Einschlag und Trümmer ruhen. Explosion einschalten oder eine Vorlage wählen.
- **Form aus:** alle Formregler außer Körper an. Eine Form-Vorlage schaltet den Körper ein.
- **Selbst wechseln aus:** Pause dazwischen und Zufällige Reihenfolge ruhen.
- **Zug zu niedrig:** Umkreisen hat keine Bahn.
- **Standbild:** Zeitmaß hat keine Wirkung.
- **Spuren aus:** Spur-Länge ruht. Nach rechts bleibt die Spur länger; stillstehende Teilchen malen keine grauen Dauerflecken.

Farbe: Primär → Sekundär → Akzent als RGB-Band. **Tempo** färbt langsam Primär und schnell Akzent. Palette drehen verschiebt das ganze Band, Farb-Turbulenz würfelt nur die Position darauf.
- **Nachbearbeitung aus:** chromatische Aberration ruht.
- **VSync an:** FPS-Limit ruht, der Browser bestimmt den Takt.

Wind X/Y: Doppelklick setzt auf 0 (Mitte), nicht auf den Szenenstandard.

## Architektur

Der gesamte Zustand liegt in einem Parameter-Objekt (`SimParams`): Physik, Farbe, Schwarm, Kreativ, Interaktion, Grafik, Kamera. Die Simulation arbeitet auf typisierten Arrays, Spatial Hashing für Nachbarn/Kollisionen, Curl-Noise für Rauch, Boids plus Predator-Prey und DNA-Tausch.

```
src/engine/     Simulation, Renderer, Noise, Parameter
src/state/      Zustand, Presets, Saves
src/ui/         Dunkles Live-Panel und Werkzeuge
```

## Technik

Vite, React, TypeScript, Tailwind, Zustand, Framer Motion. Die Darstellung läuft auf Canvas 2D mit weichen Sprites, Spuren, Glow und optionaler chromatischer Aberration.

## Entwicklung

```bash
npm install
npm run dev
```

Build: `npm run build` · Vorschau: `npm run preview`
