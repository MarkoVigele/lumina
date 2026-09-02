import {
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Dices,
  Sparkles,
  Magnet,
  Wind,
  Hand,
  Scissors,
  Bomb,
  Heart,
  Paintbrush,
  PanelRight,
  CircleDot,
  Undo2,
  Redo2,
} from 'lucide-react'
import { Tool } from '../engine/types'
import { useLumina } from '../state/store'
import type { ToolId } from '../engine/types'
import { HoverKbd } from './controls'

const TOOLS: { id: ToolId; name: string; hint: string; icon: typeof Magnet }[] = [
  { id: Tool.Attract, name: 'Ziehen', hint: '1', icon: Magnet },
  { id: Tool.Repel, name: 'Stoßen', hint: '2', icon: Wind },
  { id: Tool.Throw, name: 'Werfen', hint: '3', icon: Hand },
  { id: Tool.Cut, name: 'Schneiden', hint: '4', icon: Scissors },
  { id: Tool.Explode, name: 'Explosion', hint: '5', icon: Bomb },
  { id: Tool.Heal, name: 'Heilen', hint: '6', icon: Heart },
  { id: Tool.Paint, name: 'Malen', hint: '7', icon: Paintbrush },
]

export function Toolbar({
  paused,
  onPause,
  onReset,
  onClear,
  onRandom,
  onEvolve,
  onRecord,
  recording,
}: {
  paused: boolean
  onPause: () => void
  onReset: () => void
  onClear: () => void
  onRandom: () => void
  onEvolve: () => void
  onRecord: () => void
  recording: boolean
}) {
  const tool = useLumina((s) => s.params.interaction.tool)
  const setSection = useLumina((s) => s.setSection)
  const panelOpen = useLumina((s) => s.panelOpen)
  const setPanelOpen = useLumina((s) => s.setPanelOpen)
  const canUndo = useLumina((s) => s.past.length > 0)
  const canRedo = useLumina((s) => s.future.length > 0)
  const undo = useLumina((s) => s.undo)
  const redo = useLumina((s) => s.redo)

  return (
    <div className="lumina-toolbar pointer-events-auto flex max-w-full flex-nowrap items-center justify-around gap-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e13]/72 px-1 py-1 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl max-md:w-full md:justify-start md:gap-1.5 md:overflow-visible md:px-2 md:py-1.5">
      <button
        type="button"
        title="Rückgängig (Strg+Z)"
        className="lumina-icon max-md:hidden"
        disabled={!canUndo}
        onClick={undo}
      >
        <Undo2 size={16} />
      </button>
      <button
        type="button"
        title="Wiederholen (Strg+Y)"
        className="lumina-icon max-md:hidden"
        disabled={!canRedo}
        onClick={redo}
      >
        <Redo2 size={16} />
      </button>
      <span className="mx-1 hidden h-6 w-px shrink-0 bg-white/10 md:block" />
      {TOOLS.map((t) => {
        const Icon = t.icon
        const active = tool === t.id
        return (
          <button
            key={t.id}
            type="button"
            title={`${t.name} (${t.hint})`}
            onClick={() => setSection('interaction', { tool: t.id })}
            className={`group relative lumina-icon ${
              active ? 'bg-white/16 text-white' : 'text-white/55 hover:bg-white/8 hover:text-white/80'
            }`}
          >
            <Icon size={16} />
            <HoverKbd keys={t.hint} />
          </button>
        )
      })}
      <span className="mx-0.5 h-6 w-px shrink-0 bg-white/10 md:mx-1" />
      <button type="button" title="Pause (Leertaste)" className="group lumina-icon" onClick={onPause}>
        {paused ? <Play size={16} /> : <Pause size={16} />}
        <HoverKbd keys="␣" />
      </button>
      <button type="button" title="Reset (R)" className="group lumina-icon max-md:hidden" onClick={onReset}>
        <RotateCcw size={16} />
        <HoverKbd keys="R" />
      </button>
      <button type="button" title="Leeren (C)" className="group lumina-icon max-md:hidden" onClick={onClear}>
        <Trash2 size={16} />
        <HoverKbd keys="C" />
      </button>
      <button type="button" title="Zufall (X)" className="group lumina-icon max-md:hidden" onClick={onRandom}>
        <Dices size={16} />
        <HoverKbd keys="X" />
      </button>
      <button type="button" title="Evolve (V)" className="group lumina-icon max-md:hidden" onClick={onEvolve}>
        <Sparkles size={16} />
        <HoverKbd keys="V" />
      </button>
      <button
        type="button"
        title="Aufnahme"
        className={`lumina-icon max-md:hidden ${recording ? 'text-rose-300' : ''}`}
        onClick={onRecord}
      >
        <CircleDot size={16} />
      </button>
      <button
        type="button"
        title="Einstellungen"
        className={`group lumina-icon ${panelOpen ? 'text-white' : ''}`}
        onClick={() => setPanelOpen(!panelOpen)}
      >
        <PanelRight size={16} />
        <HoverKbd keys="H" />
      </button>
    </div>
  )
}
