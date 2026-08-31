import { EmitterMix, type Emitter, type EmitterMixId } from '../engine/types'
import { emittersOf, MAX_EMITTERS } from '../engine/emitters'
import { useLumina } from '../state/store'
import { ChipRow, Details, Group, Row, Slider, Toggle } from './controls'

const MIX = [
  { id: EmitterMix.Field, name: 'Feld' },
  { id: EmitterMix.Smoke, name: 'Rauch' },
  { id: EmitterMix.Embers, name: 'Glut' },
  { id: EmitterMix.Sparks, name: 'Funken' },
  { id: EmitterMix.Dust, name: 'Staub' },
  { id: EmitterMix.Energy, name: 'Energie' },
  { id: EmitterMix.Blobs, name: 'Blobs' },
]

function labelOf(items: Emitter[], em: Emitter): string {
  return `Quelle ${items.findIndex((item) => item.id === em.id) + 1}`
}

export function EmitterPanel() {
  const store = useLumina()
  const items = emittersOf(store.params)
  const selected = items.find((em) => em.id === store.selectedEmitterId) ?? null
  const full = items.length >= MAX_EMITTERS

  return (
    <>
      <p className="px-1 font-ui text-[12px] text-white/40">
        Quellen auf der Fläche. Standard ist keine. Klick auf eine Quelle öffnet sie. Ziehen verschiebt.
      </p>
      <Group title="Quellen">
        <Row>
          {items.length === 0 ? (
            <p className="font-ui text-[13px] leading-snug text-white/48">
              Noch kein Emitter. Das Feld atmet weiter von allein.
            </p>
          ) : (
            <ChipRow
              value={selected?.id ?? ''}
              options={items.map((em) => ({
                id: em.id,
                name: labelOf(items, em),
                dot: em.enabled ? '#f3b27a' : undefined,
              }))}
              onChange={(id) => store.selectEmitter(id)}
            />
          )}
        </Row>
        <Row>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`lumina-btn ${store.placeMode ? 'bg-white/16 text-white' : ''}`}
              disabled={full}
              onClick={() => store.setPlaceMode(!store.placeMode)}
            >
              {store.placeMode ? 'Klick auf die Fläche …' : 'Auf die Fläche setzen'}
            </button>
            {selected && (
              <button type="button" className="lumina-btn" onClick={() => store.removeEmitter(selected.id)}>
                Entfernen
              </button>
            )}
          </div>
          {full && <p className="mt-2 font-ui text-[11px] text-white/34">Höchstens {MAX_EMITTERS} Quellen.</p>}
          {store.placeMode && (
            <p className="mt-2 font-ui text-[11px] text-white/40">Nächster Klick auf das Bild setzt eine Quelle.</p>
          )}
        </Row>
      </Group>
      {selected ? (
        <Group title={labelOf(items, selected)}>
          <Row>
            <Toggle
              label="Quelle an"
              checked={selected.enabled}
              onChange={(enabled) => store.patchEmitter(selected.id, { enabled })}
            />
          </Row>
          <Row>
            <Slider
              label="Rate"
              value={selected.rate}
              min={0}
              max={160}
              step={1}
              defaultValue={48}
              onChange={(rate) => store.patchEmitter(selected.id, { rate })}
            />
          </Row>
          <Row>
            <Slider
              label="Richtung"
              value={selected.heading}
              min={-180}
              max={180}
              step={1}
              defaultValue={-90}
              onChange={(heading) => store.patchEmitter(selected.id, { heading })}
            />
          </Row>
          <Row>
            <Slider
              label="Fächer"
              value={selected.cone}
              min={0}
              max={160}
              step={1}
              defaultValue={36}
              onChange={(cone) => store.patchEmitter(selected.id, { cone })}
            />
          </Row>
          <Row>
            <Slider
              label="Tempo"
              value={selected.speed}
              min={0}
              max={720}
              step={1}
              defaultValue={160}
              onChange={(speed) => store.patchEmitter(selected.id, { speed })}
            />
          </Row>
          <Row>
            <ChipRow
              value={selected.mix}
              options={MIX}
              onChange={(mix) => store.patchEmitter(selected.id, { mix: mix as EmitterMixId })}
            />
            <p className="mt-2 font-ui text-[11px] text-white/34">
              Feld folgt der Physik-Mischung. Eine Sorte kommt nur aus dieser Quelle — Rauch, Funken, Glut siehst du als Strahl.
            </p>
          </Row>
          <Details>
            <Row>
              <Slider
                label="Streung"
                value={selected.spread}
                min={0}
                max={80}
                step={1}
                defaultValue={16}
                onChange={(spread) => store.patchEmitter(selected.id, { spread })}
              />
            </Row>
            <Row>
              <Slider
                label="Größe"
                value={selected.size}
                min={0.4}
                max={2.2}
                defaultValue={1}
                onChange={(size) => store.patchEmitter(selected.id, { size })}
              />
            </Row>
            <Row>
              <Slider
                label="Leben"
                value={selected.life}
                min={0.35}
                max={2}
                defaultValue={1}
                onChange={(life) => store.patchEmitter(selected.id, { life })}
              />
            </Row>
          </Details>
        </Group>
      ) : (
        items.length > 0 && (
          <p className="px-1 font-ui text-[12px] text-white/36">Wähle eine Quelle oder klicke sie auf der Fläche.</p>
        )
      )}
    </>
  )
}
