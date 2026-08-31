import { COLOR_PRESETS } from '../state/presets'

export function ColorPaletteGrid({
  activeId,
  note,
  onPick,
}: {
  activeId: string | null
  note?: string
  onPick: (id: string) => void
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {COLOR_PRESETS.map((p) => {
          const active = activeId === p.id
          return (
            <button
              key={p.id}
              type="button"
              title={p.note}
              onClick={() => onPick(p.id)}
              className={`overflow-hidden rounded-[12px] text-left ring-1 ${
                active ? 'ring-white/30' : 'ring-white/6 hover:ring-white/14'
              }`}
            >
              <div className="flex h-6">
                <span className="flex-1" style={{ background: p.color.primary }} />
                <span className="flex-1" style={{ background: p.color.secondary }} />
                <span className="flex-1" style={{ background: p.color.accent }} />
              </div>
              <p className="truncate px-1.5 py-1 font-ui text-[10px] text-white/82">{p.name}</p>
            </button>
          )
        })}
      </div>
      {note && <p className="mt-2 font-ui text-[11px] text-white/36">{note}</p>}
    </>
  )
}
