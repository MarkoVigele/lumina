import type { ReactNode } from 'react'
import { SCENE_CARDS, SCENE_GROUPS } from '../state/presets'
import { Group, Row } from './controls'

function Pill({ on, children }: { on?: boolean; children: ReactNode }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-ui text-[10px] ${
        on === false ? 'bg-white/4 text-white/28' : 'bg-white/12 text-white/74'
      }`}
    >
      {children}
    </span>
  )
}

export function SceneOverview({
  activeId,
  onPick,
}: {
  activeId: string | null
  onPick: (id: string) => void
}) {
  return (
    <>
      <p className="px-1 font-ui text-[12px] text-white/40">
        Vier Arten. Jede Szene bringt Takt und Farbe mit.
      </p>
      {SCENE_GROUPS.map((group) => {
        const cards = SCENE_CARDS.filter((c) => c.group === group.id)
        if (!cards.length) return null
        return (
          <Group key={group.id} title={group.title}>
            <Row>
              <p className="mb-2 hidden font-ui text-[11px] leading-snug text-white/34 md:block">{group.blurb}</p>
              <div className="grid grid-cols-1 gap-2">
                {cards.map((card) => {
                  const active = activeId === card.id
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => onPick(card.id)}
                      className={`rounded-[12px] px-3 py-2 text-left ring-1 ${
                        active ? 'bg-white/14 ring-white/22' : 'bg-black/20 ring-white/6 hover:bg-white/6'
                      }`}
                    >
                      <p className="font-ui text-[13px] text-white/90">{card.name}</p>
                      <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full">
                        {card.swatch.map((tone, i) => (
                          <span key={`${card.id}-${i}`} className="flex-1" style={{ background: tone }} />
                        ))}
                      </div>
                      <div className="mt-1.5 hidden flex-wrap gap-1 md:flex">
                        <Pill on={card.field}>{card.field ? 'Feld' : 'Feld aus'}</Pill>
                        <Pill on={card.form}>{card.form ? card.formName ?? 'Form' : 'Form aus'}</Pill>
                        <Pill>KI {card.intel}</Pill>
                        <Pill on={card.knall}>{card.knall ? 'Explosion' : 'Explosion aus'}</Pill>
                        <Pill>{card.time}</Pill>
                        <Pill>{card.colorName}</Pill>
                      </div>
                      <p className="mt-1 hidden font-ui text-[11px] leading-snug text-white/40 md:block">{card.note}</p>
                    </button>
                  )
                })}
              </div>
            </Row>
          </Group>
        )
      })}
    </>
  )
}
