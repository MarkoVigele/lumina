import { useMemo, useRef, useState } from 'react'
import {
  SlidersHorizontal,
  Palette,
  Brain,
  Sparkles,
  MousePointer2,
  Monitor,
  Save,
  Layers,
  Bomb,
  Box,
  Radio,
  Undo2,
  Redo2,
  MoreHorizontal,
} from 'lucide-react'
import { COLOR_PRESETS, EXPLOSION_PRESETS, MIX_PRESETS, SHAPE_PRESETS } from '../state/presets'
import { ColorPaletteGrid } from './color-palettes'
import { EmitterPanel } from './emitters'
import { SceneOverview } from './scenes'
import { SHAPE_LABEL, SHAPE_ORDER } from '../engine/shapes'
import { QUALITY_LABEL, useLumina } from '../state/store'
import { exportSnapshot, importSnapshot, makeSnapshot } from '../state/saves'
import { DEFAULT_PARAMS } from '../engine/params'
import { EdgeMode, GradientMode, Intelligence, kiDrives, Mood, Quality, TimeMode, Tool, visibleIntelligence } from '../engine/types'
import type { IntelligenceId } from '../engine/types'
import type { ShapeId } from '../engine/types'
import { ChipRow, ColorField, Details, Group, HoverKbd, MixRow, Row, Select, Slider, Toggle } from './controls'
import {
  HINT,
  chromaHint,
  formOwnsField,
  formPulls,
  fpsLimitHint,
  kaleidoHint,
  kiHint,
  kiLocked,
  timeScaleHint,
  trailHint,
} from './gates'

const LIVE_FORM = '#6ee7b7'
const LIVE_EXPLOSION = '#ff9b6e'
const LIVE_KI: Record<IntelligenceId, string | undefined> = {
  [Intelligence.Off]: undefined,
  [Intelligence.Physics]: undefined,
  [Intelligence.Swarm]: '#5fd4c8',
  [Intelligence.Creative]: '#c9a4ff',
}

const INTEL = [
  { id: String(Intelligence.Off), name: 'Aus' },
  { id: String(Intelligence.Swarm), name: 'Schwarm', dot: LIVE_KI[Intelligence.Swarm] },
  { id: String(Intelligence.Creative), name: 'Agenten', dot: LIVE_KI[Intelligence.Creative] },
]

const MOODS = [
  { id: Mood.Calm, name: 'Ruhig' },
  { id: Mood.Curious, name: 'Neugierig' },
  { id: Mood.Tense, name: 'Anspannend' },
  { id: Mood.Joyful, name: 'Freudig' },
  { id: Mood.Melancholic, name: 'Melancholisch' },
]

const TIMES = [
  { id: TimeMode.Play, name: 'Spiel' },
  { id: TimeMode.Slow, name: 'Zeitlupe' },
  { id: TimeMode.Reverse, name: 'Rückwärts' },
  { id: TimeMode.Freeze, name: 'Halt' },
  { id: TimeMode.Lapse, name: 'Raffer' },
]

const GRADS = [
  { id: GradientMode.Age, name: 'Alter', note: 'Jung trägt Primär, alt wandert zum Akzent' },
  { id: GradientMode.Speed, name: 'Tempo', note: 'Langsam Primär, schnell Akzent. An der Form sitzen viele still und bleiben Primär.' },
  { id: GradientMode.Energy, name: 'Energie', note: 'Ruhig Primär, aufgeladen Akzent' },
  { id: GradientMode.Collision, name: 'Kollision', note: 'Unberührt Primär, nach Stößen Akzent' },
  { id: GradientMode.Noise, name: 'Rauschen', note: 'Der Ort färbt, unabhängig von Tempo oder Alter' },
]

const MOOD_NOTE: Record<string, string> = {
  [Mood.Calm]: 'Langsamer, weicher, etwas entsättigt',
  [Mood.Curious]: 'Leicht schneller, sucht mehr',
  [Mood.Tense]: 'Tempo hoch, mehr Abstand, knackiger',
  [Mood.Joyful]: 'Lebendig, etwas satter',
  [Mood.Melancholic]: 'Sehr langsam, gedämpfte Farbe',
}

const PERSONA = [
  { id: 'gentle', name: 'Sanft' },
  { id: 'guarded', name: 'Vorsichtig' },
  { id: 'explorer', name: 'Entdecker' },
  { id: 'hive', name: 'Schwarmherz' },
  { id: 'hunter', name: 'Jäger' },
  { id: 'poet', name: 'Poet' },
  { id: 'vortex', name: 'Wirbel' },
  { id: 'dancer', name: 'Tänzer' },
  { id: 'storm', name: 'Sturm' },
]

const EDGES = [
  { id: EdgeMode.Bounce, name: 'Abprallen' },
  { id: EdgeMode.Wrap, name: 'Wiederholen' },
  { id: EdgeMode.Leave, name: 'Durchgehen' },
  { id: EdgeMode.Fade, name: 'Auflösen' },
]

const TOOLS = [
  { id: Tool.Attract, name: 'Ziehen' },
  { id: Tool.Repel, name: 'Stoßen' },
  { id: Tool.Throw, name: 'Werfen' },
  { id: Tool.Cut, name: 'Schneiden' },
  { id: Tool.Explode, name: 'Explosion' },
  { id: Tool.Heal, name: 'Heilen' },
  { id: Tool.Paint, name: 'Malen' },
]

const TABS = [
  { id: 'presets', name: 'Szenen', icon: Layers },
  { id: 'shape', name: 'Form', icon: Box, shortcut: 'F', shortcutHint: 'Form ein/aus' },
  { id: 'physics', name: 'Physik', icon: SlidersHorizontal },
  { id: 'emitters', name: 'Emitter', icon: Radio },
  { id: 'swarm', name: 'KI', icon: Brain, shortcut: 'K', shortcutHint: 'KI weiter' },
  { id: 'explosion', name: 'Explosion', icon: Bomb, shortcut: 'E', shortcutHint: 'Explosion ein/aus' },
  { id: 'color', name: 'Farbe', icon: Palette },
  { id: 'creative', name: 'Kreativ', icon: Sparkles },
  { id: 'interact', name: 'Geste', icon: MousePointer2 },
  { id: 'graphics', name: 'Grafik', icon: Monitor },
  { id: 'saves', name: 'Saves', icon: Save },
] as const

type TabId = (typeof TABS)[number]['id']

const PRIMARY_IDS = ['presets', 'shape', 'physics', 'swarm'] as const
const MORE_IDS = ['emitters', 'explosion', 'color', 'creative', 'interact', 'graphics', 'saves'] as const
const PRIMARY_TABS = TABS.filter((item) => (PRIMARY_IDS as readonly string[]).includes(item.id))
const MORE_TABS = TABS.filter((item) => (MORE_IDS as readonly string[]).includes(item.id))

const TRAIL_MIN = 0.12
const TRAIL_MAX = 0.85
const trailLength = (fade: number) => TRAIL_MAX + TRAIL_MIN - fade
const trailFade = (length: number) => TRAIL_MAX + TRAIL_MIN - length

export function ControlPanel({
  fps,
  particles,
  frameMs,
  memoryMb,
}: {
  fps: number
  particles: number
  frameMs: number
  memoryMb: number | null
}) {
  const store = useLumina()
  const { params } = store
  const tab = (TABS.some((item) => item.id === store.panelTab) ? store.panelTab : 'presets') as TabId
  const setTab = (id: TabId) => store.setPanelTab(id)
  const [saveName, setSaveName] = useState('Meine Szene')
  const lastMore = useRef<TabId>('emitters')
  const onMore = (MORE_IDS as readonly string[]).includes(tab)
  if (onMore) lastMore.current = tab
  const d = DEFAULT_PARAMS
  const form = params.shape ?? d.shape
  const exp = params.explosion ?? d.explosion
  const fieldLocked = formOwnsField(form)
  const fieldHint = fieldLocked ? HINT.formField : undefined
  const formOff = !form.enabled
  const formHint = formOff ? HINT.formOff : undefined
  const cycleHint = formOff ? HINT.formOff : form.autoCycle ? undefined : HINT.formCycle
  const orbitHint = formOff ? HINT.formOff : formPulls(form) ? undefined : HINT.formOrbit
  const knallOff = !exp.enabled
  const knallHint = knallOff ? HINT.knallOff : undefined
  const swarmLocked = kiLocked(params.swarm)
  const swarmHint = kiHint(params.swarm, form)
  const tempoHint = timeScaleHint(params.creative)
  const mirrorHint = kaleidoHint(params.creative)
  const fadeHint = trailHint(params.graphics)
  const fringeHint = chromaHint(params.graphics)
  const limitHint = fpsLimitHint(params.graphics)

  const colorNote = useMemo(
    () => COLOR_PRESETS.find((p) => p.id === store.colorPresetId)?.note,
    [store.colorPresetId],
  )
  const explosionNote = useMemo(
    () => EXPLOSION_PRESETS.find((p) => p.id === store.explosionPresetId)?.note,
    [store.explosionPresetId],
  )
  const shapeNote = useMemo(
    () => SHAPE_PRESETS.find((p) => p.id === store.shapePresetId)?.note,
    [store.shapePresetId],
  )
  const mixNote = useMemo(
    () => MIX_PRESETS.find((p) => p.id === store.mixPresetId)?.note,
    [store.mixPresetId],
  )

  const liveOf = (id: string) => {
    if (id === 'shape') return form.enabled ? LIVE_FORM : undefined
    if (id === 'explosion') return exp.enabled ? LIVE_EXPLOSION : undefined
    if (id === 'swarm') return LIVE_KI[params.swarm.intelligence]
    if (id === 'emitters') return params.emitters?.items.some((em) => em.enabled) ? '#f3b27a' : undefined
    return undefined
  }

  const resetTab = () => {
    if (tab === 'presets') store.resetAll()
    else if (tab === 'physics') store.resetSection('physics')
    else if (tab === 'explosion') store.resetSection('explosion')
    else if (tab === 'shape') store.resetSection('shape')
    else if (tab === 'emitters') store.resetSection('emitters')
    else if (tab === 'color') store.resetSection('color')
    else if (tab === 'swarm') store.resetSection('swarm')
    else if (tab === 'creative') store.resetSection('creative')
    else if (tab === 'interact') store.resetSection('interaction')
    else if (tab === 'graphics') store.resetSection('graphics')
  }

  return (
    <aside className="pointer-events-auto flex h-full w-full max-md:max-h-[48dvh] max-md:flex-col overflow-hidden rounded-t-[22px] border border-white/10 bg-[#16181e]/82 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl md:w-[min(100vw-24px,460px)] md:rounded-[22px]">
      <nav className="flex shrink-0 items-stretch justify-around gap-0.5 border-b border-white/8 bg-black/20 px-1 py-1 md:hidden">
        {PRIMARY_TABS.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          const live = liveOf(item.id)
          return (
            <button
              key={item.id}
              type="button"
              title={item.name}
              aria-label={item.name}
              onClick={() => setTab(item.id)}
              className={`relative flex h-11 min-w-11 flex-1 flex-col items-center justify-center rounded-[12px] ${
                active ? 'bg-white/12 text-white' : live ? 'text-white/72' : 'text-white/42'
              }`}
            >
              <Icon size={18} strokeWidth={1.75} style={live && !active ? { color: live } : undefined} />
              {live && (
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: live, boxShadow: `0 0 7px ${live}` }}
                  aria-hidden
                />
              )}
            </button>
          )
        })}
        <button
          type="button"
          title="Mehr"
          aria-label="Mehr"
          onClick={() => setTab(lastMore.current)}
          className={`relative flex h-11 min-w-11 flex-1 flex-col items-center justify-center rounded-[12px] ${
            onMore ? 'bg-white/12 text-white' : 'text-white/42'
          }`}
        >
          <MoreHorizontal size={18} strokeWidth={1.75} />
        </button>
      </nav>
      {onMore && (
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/8 px-2 py-1.5 md:hidden">
          {MORE_TABS.map((item) => {
            const active = tab === item.id
            const live = liveOf(item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 font-ui text-[12px] ${
                  active ? 'bg-white/90 text-[#14161c]' : 'bg-white/8 text-white/62'
                }`}
              >
                {item.name}
                {live && (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: live, boxShadow: active ? `0 0 6px ${live}` : undefined }}
                    aria-hidden
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      <nav className="hidden w-[92px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-white/8 bg-black/20 px-1.5 py-2 md:flex">
        {TABS.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          const shortcut = 'shortcut' in item ? item.shortcut : undefined
          const live = liveOf(item.id)
          const title =
            'shortcut' in item && item.shortcut
              ? `${item.name} · ${item.shortcutHint} (${item.shortcut})`
              : item.name
          return (
            <button
              key={item.id}
              type="button"
              title={title}
              onClick={() => setTab(item.id)}
              className={`group relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[14px] px-1 ${
                active
                  ? 'bg-white/12 text-white'
                  : live
                    ? 'text-white/72 hover:bg-white/6 hover:text-white/88'
                    : 'text-white/42 hover:bg-white/6 hover:text-white/70'
              }`}
            >
              <Icon size={18} strokeWidth={1.75} style={live && !active ? { color: live } : undefined} />
              <span className="flex items-center gap-1">
                <span className="font-ui text-[10px] font-medium">{item.name}</span>
                {live && (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: live, boxShadow: `0 0 7px ${live}` }}
                    aria-hidden
                  />
                )}
              </span>
              <HoverKbd keys={shortcut} />
            </button>
          )
        })}
      </nav>

      <div className="flex min-w-0 min-h-0 flex-1 flex-col">
        <header className="flex items-start justify-between gap-3 px-4 pt-2.5 pb-2 md:pt-3.5">
          <div>
            <p className="font-display text-[18px] leading-none tracking-tight text-white/94 md:text-[22px]">Lumina</p>
            <p className="mt-1 font-ui text-[11px] text-white/38">{TABS.find((t) => t.id === tab)?.name}</p>
            {params.graphics.showPerf !== false && (
              <div className="mt-2 hidden flex-wrap gap-2.5 font-ui text-[10px] tabular-nums text-white/32 md:flex">
                <span>{fps.toFixed(0)} fps</span>
                <span>{particles}</span>
                <span>{frameMs.toFixed(1)} ms</span>
                {memoryMb != null && <span>{memoryMb.toFixed(0)} MB</span>}
              </div>
            )}
          </div>
          <div className="mt-0.5 hidden flex-wrap justify-end gap-1.5 md:flex">
            <button
              type="button"
              className="lumina-btn"
              title="Rückgängig (Strg+Z)"
              disabled={store.past.length === 0}
              onClick={() => store.undo()}
            >
              <Undo2 size={13} />
              Rückgängig
            </button>
            <button
              type="button"
              className="lumina-btn"
              title="Wiederholen (Strg+Y)"
              disabled={store.future.length === 0}
              onClick={() => store.redo()}
            >
              <Redo2 size={13} />
              Wiederholen
            </button>
            {tab !== 'saves' && (
              <button type="button" className="lumina-btn" onClick={resetTab}>
                Standard
              </button>
            )}
          </div>
          {tab !== 'saves' && (
            <button type="button" className="lumina-btn md:hidden" onClick={resetTab}>
              Standard
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-4">
          {tab === 'presets' && (
            <SceneOverview activeId={store.behaviorPresetId} onPick={(id) => store.applyBehavior(id)} />
          )}

          {tab === 'emitters' && <EmitterPanel />}

          {tab === 'physics' && (
            <>
              <p className="px-1 font-ui text-[12px] text-white/40">
                Feld und Dichte. Form mit hoher Falte übernimmt Schwerkraft, Wind und Turbulenz.
              </p>
              <Group title="Feld">
                <Row><Slider label="Schwerkraft" value={params.physics.gravity} min={-40} max={120} step={1} defaultValue={d.physics.gravity} disabled={fieldLocked} hint={fieldHint} onChange={(gravity) => store.setSection('physics', { gravity })} /></Row>
                <Row><Slider label="Dämpfung" value={params.physics.damping} min={0.9} max={0.999} step={0.001} defaultValue={d.physics.damping} onChange={(damping) => store.setSection('physics', { damping })} /></Row>
                <Row><Slider label="Turbulenz" value={params.physics.turbulence} min={0} max={160} step={1} defaultValue={d.physics.turbulence} disabled={fieldLocked} hint={fieldHint} onChange={(turbulence) => store.setSection('physics', { turbulence })} /></Row>
                <Row><Slider label="Auftrieb" value={params.physics.buoyancy} min={0} max={140} step={1} defaultValue={d.physics.buoyancy} onChange={(buoyancy) => store.setSection('physics', { buoyancy })} /></Row>
                <Details>
                  <Row><Slider label="Wind X" value={params.physics.windX} min={-140} max={140} step={1} defaultValue={0} disabled={fieldLocked} hint={fieldHint} onChange={(windX) => store.setSection('physics', { windX })} /></Row>
                  <Row><Slider label="Wind Y" value={params.physics.windY} min={-140} max={140} step={1} defaultValue={0} disabled={fieldLocked} hint={fieldHint} onChange={(windY) => store.setSection('physics', { windY })} /></Row>
                  <Row><Slider label="Rauschskala" value={params.physics.turbulenceScale} min={0.0004} max={0.008} step={0.0001} format={(v) => v.toFixed(4)} defaultValue={d.physics.turbulenceScale} disabled={fieldLocked} hint={fieldHint} onChange={(turbulenceScale) => store.setSection('physics', { turbulenceScale })} /></Row>
                </Details>
              </Group>
              <Group title="Dichte">
                <Row><Slider label="Größe" value={params.physics.size} min={3} max={40} step={0.5} defaultValue={d.physics.size} onChange={(size) => store.setSection('physics', { size })} /></Row>
                <Row><Slider label="Lebensdauer" value={params.physics.lifetime} min={0.6} max={16} step={0.1} defaultValue={d.physics.lifetime} onChange={(lifetime) => store.setSection('physics', { lifetime })} /></Row>
                <Row><Slider label="Spawn-Rate" value={params.physics.spawnRate} min={0} max={220} step={1} defaultValue={d.physics.spawnRate} onChange={(spawnRate) => store.setSection('physics', { spawnRate })} /></Row>
                <Details label="Kollision und Rand">
                  <Row><Slider label="Größenstreuung" value={params.physics.sizeJitter} min={0} max={1.2} defaultValue={d.physics.sizeJitter} onChange={(sizeJitter) => store.setSection('physics', { sizeJitter })} /></Row>
                  <Row><Slider label="Kollisionsradius" value={params.physics.collisionRadius} min={2} max={28} step={0.5} defaultValue={d.physics.collisionRadius} onChange={(collisionRadius) => store.setSection('physics', { collisionRadius })} /></Row>
                  <Row><Slider label="Rückprall" value={params.physics.collisionRestitution} min={0} max={1} defaultValue={d.physics.collisionRestitution} onChange={(collisionRestitution) => store.setSection('physics', { collisionRestitution })} /></Row>
                  <Row><Slider label="Sekundärfunken" value={params.physics.secondarySparks} min={0} max={1} defaultValue={d.physics.secondarySparks} onChange={(secondarySparks) => store.setSection('physics', { secondarySparks })} /></Row>
                  <Row>
                    <ChipRow value={params.physics.edgeMode ?? EdgeMode.Wrap} options={EDGES} onChange={(edgeMode) => store.setSection('physics', { edgeMode: edgeMode as typeof params.physics.edgeMode })} />
                  </Row>
                  {(params.physics.edgeMode ?? EdgeMode.Wrap) === EdgeMode.Bounce && (
                    <Row><Slider label="Wandfeder" value={params.physics.wallBounce} min={0} max={1} defaultValue={d.physics.wallBounce} onChange={(wallBounce) => store.setSection('physics', { wallBounce })} /></Row>
                  )}
                </Details>
              </Group>
              <Group title="Mischung">
                <Row>
                  <ChipRow
                    value={store.mixPresetId ?? ''}
                    options={MIX_PRESETS.map((p) => ({ id: p.id, name: p.name }))}
                    onChange={(id) => store.applyMix(id)}
                  />
                  {mixNote && <p className="mt-2 font-ui text-[11px] text-white/36">{mixNote}</p>}
                </Row>
                <Details label="Anteile">
                  <Row>
                    <MixRow
                      label="Rauch"
                      on={params.physics.onSmoke !== false}
                      mix={params.physics.mixSmoke}
                      defaultMix={d.physics.mixSmoke}
                      onToggle={(onSmoke) => store.setSection('physics', { onSmoke })}
                      onMix={(mixSmoke) => store.setSection('physics', { mixSmoke })}
                    />
                  </Row>
                  <Row>
                    <MixRow
                      label="Glut"
                      on={params.physics.onEmbers !== false}
                      mix={params.physics.mixEmbers}
                      defaultMix={d.physics.mixEmbers}
                      onToggle={(onEmbers) => store.setSection('physics', { onEmbers })}
                      onMix={(mixEmbers) => store.setSection('physics', { mixEmbers })}
                    />
                  </Row>
                  <Row>
                    <MixRow
                      label="Funken"
                      on={params.physics.onSparks !== false}
                      mix={params.physics.mixSparks}
                      defaultMix={d.physics.mixSparks}
                      onToggle={(onSparks) => store.setSection('physics', { onSparks })}
                      onMix={(mixSparks) => store.setSection('physics', { mixSparks })}
                    />
                  </Row>
                  <Row>
                    <MixRow
                      label="Staub"
                      on={params.physics.onDust !== false}
                      mix={params.physics.mixDust}
                      defaultMix={d.physics.mixDust}
                      onToggle={(onDust) => store.setSection('physics', { onDust })}
                      onMix={(mixDust) => store.setSection('physics', { mixDust })}
                    />
                  </Row>
                  <Row>
                    <MixRow
                      label="Energie"
                      on={params.physics.onEnergy !== false}
                      mix={params.physics.mixEnergy}
                      defaultMix={d.physics.mixEnergy}
                      onToggle={(onEnergy) => store.setSection('physics', { onEnergy })}
                      onMix={(mixEnergy) => store.setSection('physics', { mixEnergy })}
                    />
                  </Row>
                  <Row>
                    <MixRow
                      label="Weiche Blobs"
                      on={params.physics.onBlobs !== false}
                      mix={params.physics.mixBlobs}
                      defaultMix={d.physics.mixBlobs}
                      onToggle={(onBlobs) => store.setSection('physics', { onBlobs })}
                      onMix={(mixBlobs) => store.setSection('physics', { mixBlobs })}
                    />
                  </Row>
                </Details>
              </Group>
            </>
          )}

          {tab === 'explosion' && (
              <>
                <p className="px-1 font-ui text-[12px] text-white/40">
                  Harte Stöße reißen auf. Taste E. Eine Vorlage schaltet ein.
                </p>
                <Group title="Einschlag">
                  <Row>
                    <Toggle
                      label="Explosion an"
                      shortcut="E"
                      checked={exp.enabled}
                      onChange={(enabled) => store.setSection('explosion', { enabled })}
                    />
                  </Row>
                  <Row>
                    <ChipRow
                      value={store.explosionPresetId ?? ''}
                      options={EXPLOSION_PRESETS.map((p) => ({ id: p.id, name: p.name }))}
                      onChange={(id) => store.applyExplosion(id)}
                    />
                    {explosionNote && <p className="mt-2 font-ui text-[11px] text-white/36">{explosionNote}</p>}
                  </Row>
                  <Row>
                    <Slider
                      label="Kraft"
                      value={exp.force}
                      min={0}
                      max={3}
                      defaultValue={d.explosion.force}
                      disabled={knallOff}
                      hint={knallHint}
                      onChange={(force) => store.setSection('explosion', { force })}
                    />
                  </Row>
                  <Row>
                    <Slider
                      label="Radius"
                      value={exp.radius}
                      min={24}
                      max={260}
                      step={1}
                      defaultValue={d.explosion.radius}
                      disabled={knallOff}
                      hint={knallHint}
                      onChange={(radius) => store.setSection('explosion', { radius })}
                    />
                  </Row>
                  <Row>
                    <Slider
                      label="Blitz"
                      value={exp.flash}
                      min={0}
                      max={2}
                      defaultValue={d.explosion.flash}
                      disabled={knallOff}
                      hint={knallHint}
                      onChange={(flash) => store.setSection('explosion', { flash })}
                    />
                  </Row>
                  <Details label="Trümmer">
                    <Row>
                      <Slider
                        label="Schwelle"
                        value={exp.threshold}
                        min={8}
                        max={120}
                        step={1}
                        defaultValue={d.explosion.threshold}
                        disabled={knallOff}
                        hint={knallHint}
                        onChange={(threshold) => store.setSection('explosion', { threshold })}
                      />
                    </Row>
                    <Row>
                      <Slider
                        label="Funken"
                        value={exp.sparks}
                        min={0}
                        max={2}
                        defaultValue={d.explosion.sparks}
                        disabled={knallOff}
                        hint={knallHint}
                        onChange={(sparks) => store.setSection('explosion', { sparks })}
                      />
                    </Row>
                    <Row>
                      <Slider
                        label="Splitter"
                        value={exp.shatter}
                        min={0}
                        max={1}
                        defaultValue={d.explosion.shatter}
                        disabled={knallOff}
                        hint={knallHint}
                        onChange={(shatter) => store.setSection('explosion', { shatter })}
                      />
                    </Row>
                    <Row>
                      <Slider
                        label="Kettenreaktion"
                        value={exp.chain}
                        min={0}
                        max={1}
                        defaultValue={d.explosion.chain}
                        disabled={knallOff}
                        hint={knallHint}
                        onChange={(chain) => store.setSection('explosion', { chain })}
                      />
                    </Row>
                  </Details>
                </Group>
              </>
          )}

          {tab === 'shape' && (
              <>
                <p className="px-1 font-ui text-[12px] text-white/40">
                  Drahtgitter, kein echtes 3D. Zug holt, Falte hält, Umkreisen braucht etwas Zug. Taste F.
                </p>
                <Group title="Körper">
                  <Row>
                    <Toggle
                      label="Körper an"
                      shortcut="F"
                      checked={form.enabled}
                      onChange={(enabled) => store.setSection('shape', { enabled })}
                    />
                  </Row>
                  <Row>
                    <ChipRow
                      value={store.shapePresetId ?? ''}
                      options={SHAPE_PRESETS.map((p) => ({ id: p.id, name: p.name }))}
                      onChange={(id) => store.applyShape(id)}
                    />
                    {shapeNote && <p className="mt-2 font-ui text-[11px] text-white/36">{shapeNote}</p>}
                  </Row>
                  <Row>
                    <ChipRow
                      value={form.shape}
                      options={SHAPE_ORDER.map((id) => ({ id, name: SHAPE_LABEL[id] }))}
                      disabled={formOff}
                      hint={formHint}
                      onChange={(shape) => store.setSection('shape', { shape: shape as ShapeId })}
                    />
                  </Row>
                </Group>
                <Group title="Halt">
                  <Row>
                    <Slider
                      label="Zug"
                      value={form.attract}
                      min={0}
                      max={3}
                      defaultValue={d.shape.attract}
                      disabled={formOff}
                      hint={formHint}
                      onChange={(attract) => store.setSection('shape', { attract })}
                    />
                  </Row>
                  <Row>
                    <Slider
                      label="Falten"
                      value={form.fold}
                      min={0}
                      max={1}
                      defaultValue={d.shape.fold}
                      disabled={formOff}
                      hint={formHint}
                      onChange={(fold) => store.setSection('shape', { fold })}
                    />
                  </Row>
                  <Row>
                    <Slider
                      label="Umkreisen"
                      value={form.orbit}
                      min={0}
                      max={2}
                      defaultValue={0}
                      disabled={formOff || !formPulls(form)}
                      hint={orbitHint}
                      onChange={(orbit) => store.setSection('shape', { orbit })}
                    />
                  </Row>
                  <Row>
                    <Slider
                      label="Größe"
                      value={form.scale}
                      min={80}
                      max={640}
                      step={1}
                      defaultValue={d.shape.scale}
                      disabled={formOff}
                      hint={formHint}
                      onChange={(scale) => store.setSection('shape', { scale })}
                    />
                  </Row>
                  <Details label="Wechsel">
                    <Row>
                      <Toggle
                        label="Selbst wechseln"
                        checked={form.autoCycle}
                        disabled={formOff}
                        hint={formHint}
                        onChange={(autoCycle) => store.setSection('shape', { autoCycle })}
                      />
                    </Row>
                    <Row>
                      <Toggle
                        label="Zufällige Reihenfolge"
                        checked={form.randomOrder}
                        disabled={formOff || !form.autoCycle}
                        hint={cycleHint}
                        onChange={(randomOrder) => store.setSection('shape', { randomOrder })}
                      />
                    </Row>
                    <Row>
                      <Slider
                        label="Morph-Dauer"
                        value={form.switchSpeed}
                        min={0.3}
                        max={8}
                        defaultValue={d.shape.switchSpeed}
                        disabled={formOff}
                        hint={formHint}
                        onChange={(switchSpeed) => store.setSection('shape', { switchSpeed })}
                      />
                    </Row>
                    <Row>
                      <Slider
                        label="Pause dazwischen"
                        value={form.switchHold}
                        min={1}
                        max={20}
                        defaultValue={d.shape.switchHold}
                        disabled={formOff || !form.autoCycle}
                        hint={cycleHint}
                        onChange={(switchHold) => store.setSection('shape', { switchHold })}
                      />
                    </Row>
                  </Details>
                  <Details label="Bewegung und Bild">
                    <Row>
                      <Slider
                        label="Drehung X"
                        value={form.spinX}
                        min={-1.4}
                        max={1.4}
                        defaultValue={0}
                        disabled={formOff}
                        hint={formHint}
                        onChange={(spinX) => store.setSection('shape', { spinX })}
                      />
                    </Row>
                    <Row>
                      <Slider
                        label="Drehung Y"
                        value={form.spinY}
                        min={-1.4}
                        max={1.4}
                        defaultValue={0}
                        disabled={formOff}
                        hint={formHint}
                        onChange={(spinY) => store.setSection('shape', { spinY })}
                      />
                    </Row>
                    <Row>
                      <Slider
                        label="Drehung Z"
                        value={form.spinZ}
                        min={-1.4}
                        max={1.4}
                        defaultValue={0}
                        disabled={formOff}
                        hint={formHint}
                        onChange={(spinZ) => store.setSection('shape', { spinZ })}
                      />
                    </Row>
                    <Row>
                      <Slider
                        label="Schweben"
                        value={form.wander}
                        min={0}
                        max={1.5}
                        defaultValue={0}
                        disabled={formOff}
                        hint={formHint}
                        onChange={(wander) => store.setSection('shape', { wander })}
                      />
                    </Row>
                    <Row>
                      <Slider
                        label="Treiben"
                        value={form.drift}
                        min={0}
                        max={1.5}
                        defaultValue={0}
                        disabled={formOff}
                        hint={formHint}
                        onChange={(drift) => store.setSection('shape', { drift })}
                      />
                    </Row>
                    <Row>
                      <Slider
                        label="Atmen"
                        value={form.pulse}
                        min={0}
                        max={1.5}
                        defaultValue={0}
                        disabled={formOff}
                        hint={formHint}
                        onChange={(pulse) => store.setSection('shape', { pulse })}
                      />
                    </Row>
                    <Row>
                      <Slider
                        label="Tiefe"
                        value={form.perspective}
                        min={0}
                        max={1.4}
                        defaultValue={d.shape.perspective}
                        disabled={formOff}
                        hint={formHint}
                        onChange={(perspective) => store.setSection('shape', { perspective })}
                      />
                    </Row>
                    <Row>
                      <Slider
                        label="Gitter"
                        value={form.ghost}
                        min={0}
                        max={1}
                        defaultValue={d.shape.ghost}
                        disabled={formOff}
                        hint={formHint}
                        onChange={(ghost) => store.setSection('shape', { ghost })}
                      />
                    </Row>
                    <Row>
                      <Slider
                        label="Tiefenfall"
                        value={form.depthFade}
                        min={0}
                        max={1}
                        defaultValue={d.shape.depthFade}
                        disabled={formOff}
                        hint={formHint}
                        onChange={(depthFade) => store.setSection('shape', { depthFade })}
                      />
                    </Row>
                  </Details>
                </Group>
              </>
          )}

          {tab === 'color' && (
            <>
              <p className="px-1 font-ui text-[12px] text-white/40">
                Drei Töne als Band, kein Regenbogen. Szenen bringen eine Palette mit — hier überschreibst du sie.
              </p>
              <Group title="Vorlagen">
                <Row>
                  <ColorPaletteGrid
                    activeId={store.colorPresetId}
                    note={colorNote}
                    onPick={(id) => store.applyColor(id)}
                  />
                </Row>
              </Group>
              <Group title="Band">
                <Row>
                  <ChipRow value={params.color.gradientMode} options={GRADS} onChange={(gradientMode) => store.setSection('color', { gradientMode: gradientMode as typeof params.color.gradientMode })} />
                  <p className="mt-2 font-ui text-[11px] leading-snug text-white/34">
                    {GRADS.find((g) => g.id === params.color.gradientMode)?.note}
                  </p>
                </Row>
                <Row><ColorField label="Primär" value={params.color.primary} onChange={(primary) => store.setSection('color', { primary })} /></Row>
                <Row><ColorField label="Sekundär" value={params.color.secondary} onChange={(secondary) => store.setSection('color', { secondary })} /></Row>
                <Row><ColorField label="Akzent" value={params.color.accent} onChange={(accent) => store.setSection('color', { accent })} /></Row>
                <Details>
                  <Row><ColorField label="Glow" value={params.color.glow} onChange={(glow) => store.setSection('color', { glow })} /></Row>
                  <Row><ColorField label="Hintergrund" value={params.color.background} onChange={(background) => store.setSection('color', { background })} /></Row>
                  <Row><Slider label="Sättigung" value={params.color.saturation} min={0} max={1.6} defaultValue={d.color.saturation} onChange={(saturation) => store.setSection('color', { saturation })} /></Row>
                  <Row><Slider label="Helligkeit" value={params.color.brightness} min={0.2} max={1.4} defaultValue={d.color.brightness} onChange={(brightness) => store.setSection('color', { brightness })} /></Row>
                  <Row><Slider label="Palette drehen" value={params.color.hueShift} min={-140} max={180} step={1} defaultValue={d.color.hueShift} onChange={(hueShift) => store.setSection('color', { hueShift })} /></Row>
                  <Row>
                    <Slider label="Farb-Turbulenz" value={params.color.colorTurbulence} min={0} max={1} defaultValue={d.color.colorTurbulence} onChange={(colorTurbulence) => store.setSection('color', { colorTurbulence })} />
                    <p className="mt-1.5 font-ui text-[11px] leading-snug text-white/34">
                      Würfelt nur die Position auf dem Band.
                    </p>
                  </Row>
                </Details>
              </Group>
            </>
          )}

          {tab === 'swarm' && (
            <>
              <p className="px-1 font-ui text-[12px] text-white/40">
                Aus ist nur das Feld. K schaltet Schwarm oder Agenten dazu.
              </p>
              <Group title="Modus">
                <Row>
                  <ChipRow
                    value={String(visibleIntelligence(params.swarm.intelligence))}
                    options={INTEL}
                    onChange={(v) => store.setSection('swarm', { intelligence: Number(v) as typeof params.swarm.intelligence })}
                  />
                </Row>
                <Row>
                  <Select label="Persönlichkeit" value={params.swarm.personality} options={PERSONA} disabled={swarmLocked} hint={swarmHint} onChange={(personality) => store.setSection('swarm', { personality })} />
                </Row>
                <Row><Slider label="KI-Stärke" value={params.swarm.strength ?? 1} min={0} max={2} defaultValue={d.swarm.strength} disabled={!kiDrives(params.swarm.intelligence)} hint={!kiDrives(params.swarm.intelligence) ? HINT.kiOff : formOwnsField(form) ? HINT.kiForm : undefined} onChange={(strength) => store.setSection('swarm', { strength })} /></Row>
                <Row><Slider label="Max. Tempo" value={params.swarm.maxSpeed} min={20} max={240} step={1} defaultValue={d.swarm.maxSpeed} hint={formOwnsField(form) ? HINT.kiForm : undefined} onChange={(maxSpeed) => store.setSection('swarm', { maxSpeed })} /></Row>
                <Details label="Regeln">
                  <Row><Slider label="Orbit" value={params.swarm.orbit ?? 0} min={0} max={2} defaultValue={d.swarm.orbit} disabled={swarmLocked} hint={swarmHint} onChange={(orbit) => store.setSection('swarm', { orbit })} /></Row>
                  <Row><Slider label="Puls" value={params.swarm.pulse ?? 0} min={0} max={2} defaultValue={d.swarm.pulse} disabled={swarmLocked} hint={swarmHint} onChange={(pulse) => store.setSection('swarm', { pulse })} /></Row>
                  <Row><Slider label="Separation" value={params.swarm.separation} min={0} max={2} defaultValue={d.swarm.separation} disabled={swarmLocked} hint={swarmHint} onChange={(separation) => store.setSection('swarm', { separation })} /></Row>
                  <Row><Slider label="Alignment" value={params.swarm.alignment} min={0} max={2} defaultValue={d.swarm.alignment} disabled={swarmLocked} hint={swarmHint} onChange={(alignment) => store.setSection('swarm', { alignment })} /></Row>
                  <Row><Slider label="Cohesion" value={params.swarm.cohesion} min={0} max={2} defaultValue={d.swarm.cohesion} disabled={swarmLocked} hint={swarmHint} onChange={(cohesion) => store.setSection('swarm', { cohesion })} /></Row>
                  <Row><Slider label="Hindernisflucht" value={params.swarm.avoidance} min={0} max={2} defaultValue={d.swarm.avoidance} disabled={swarmLocked} hint={swarmHint} onChange={(avoidance) => store.setSection('swarm', { avoidance })} /></Row>
                  <Row><Slider label="Zielsuche" value={params.swarm.seek} min={0} max={2} defaultValue={d.swarm.seek} disabled={swarmLocked} hint={swarmHint} onChange={(seek) => store.setSection('swarm', { seek })} /></Row>
                  <Row><Slider label="Wahrnehmung" value={params.swarm.perception} min={20} max={180} step={1} defaultValue={d.swarm.perception} disabled={swarmLocked} hint={swarmHint} onChange={(perception) => store.setSection('swarm', { perception })} /></Row>
                  <Row><Toggle label="Räuber und Beute" checked={params.swarm.predatorPrey} disabled={swarmLocked} hint={swarmHint} onChange={(predatorPrey) => store.setSection('swarm', { predatorPrey })} /></Row>
                  <Row><Toggle label="Mehrere Schwärme" checked={params.swarm.multiSwarm} disabled={swarmLocked} hint={swarmHint} onChange={(multiSwarm) => store.setSection('swarm', { multiSwarm })} /></Row>
                </Details>
              </Group>
            </>
          )}

          {tab === 'creative' && (
            <>
              <p className="px-1 font-ui text-[12px] text-white/40">
                Stimmung und Zeit färben das Tempo. Erbe ändert Größe und Farbe.
              </p>
              <Group title="Klima">
                <Row>
                  <ChipRow value={params.creative.mood} options={MOODS} onChange={(mood) => store.setSection('creative', { mood: mood as typeof params.creative.mood })} />
                  <p className="mt-2 font-ui text-[11px] leading-snug text-white/34">{MOOD_NOTE[params.creative.mood]}</p>
                </Row>
                <Row><ChipRow value={params.creative.timeMode} options={TIMES} onChange={(timeMode) => store.setSection('creative', { timeMode: timeMode as typeof params.creative.timeMode })} /></Row>
                <Row><Slider label="Zeitmaß" value={params.creative.timeScale} min={-2} max={3} step={0.05} defaultValue={d.creative.timeScale} disabled={Boolean(tempoHint)} hint={tempoHint} onChange={(timeScale) => store.setSection('creative', { timeScale })} /></Row>
                <Row>
                  <Toggle
                    label="Auto-Evolve"
                    checked={params.creative.evolvePulse > 0.5}
                    onChange={(on) => store.setSection('creative', { evolvePulse: on ? 1 : 0 })}
                  />
                </Row>
                <Details label="Spiegel, Erbe, Feld">
                  <Row>
                    <Slider label="Symmetrie" value={params.creative.symmetry} min={1} max={8} step={1} defaultValue={d.creative.symmetry} onChange={(symmetry) => store.setSection('creative', { symmetry })} />
                    <p className="mt-1.5 font-ui text-[11px] leading-snug text-white/34">Der Pinsel erscheint mehrfach um die Mitte.</p>
                  </Row>
                  <Row><Toggle label="Kaleidoskop" checked={params.creative.kaleidoscope} hint={params.creative.kaleidoscope ? mirrorHint : undefined} onChange={(kaleidoscope) => store.setSection('creative', { kaleidoscope })} /></Row>
                  <Row>
                    <Toggle
                      label="DNA bei Kollision"
                      checked={params.creative.inheritOnCollision}
                      onChange={(inheritOnCollision) => store.setSection('creative', { inheritOnCollision })}
                    />
                  </Row>
                  <Row>
                    <Slider label="Mutation" value={params.creative.mutationRate} min={0} max={0.6} defaultValue={d.creative.mutationRate} onChange={(mutationRate) => store.setSection('creative', { mutationRate })} />
                    <p className="mt-1.5 font-ui text-[11px] leading-snug text-white/34">
                      DNA und Taste V. Wie stark sie aus der Reihe tanzen.
                    </p>
                  </Row>
                  <Row>
                    <Toggle label="Reaktive Umwelt" checked={params.creative.reactiveEnv} onChange={(reactiveEnv) => store.setSection('creative', { reactiveEnv })} />
                    <p className="mt-1.5 font-ui text-[11px] leading-snug text-white/34">
                      Das Feld atmet vom Zentrum — unabhängig von Form und Wind.
                    </p>
                  </Row>
                </Details>
              </Group>
            </>
          )}

          {tab === 'interact' && (
            <Group title="Zeiger">
              <Row>
                <p className="mb-2 font-ui text-[11px] leading-snug text-white/34">
                  Links ist das Werkzeug oben. Rechts klickt die zweite Geste.
                </p>
                <Select label="Rechtsklick" value={params.interaction.rightTool ?? Tool.Explode} options={TOOLS} onChange={(rightTool) => store.setSection('interaction', { rightTool: rightTool as typeof params.interaction.rightTool })} />
              </Row>
              <Row><Slider label="Pinselgröße" value={params.interaction.brushSize} min={24} max={320} step={1} defaultValue={d.interaction.brushSize} onChange={(brushSize) => store.setSection('interaction', { brushSize })} /></Row>
              <Row><Slider label="Stärke" value={params.interaction.brushStrength} min={0.15} max={3} defaultValue={d.interaction.brushStrength} onChange={(brushStrength) => store.setSection('interaction', { brushStrength })} /></Row>
            </Group>
          )}

          {tab === 'graphics' && (
            <Group title="Bild">
              <Row>
                <ChipRow value={params.graphics.quality} options={Object.values(Quality).map((id) => ({ id, name: QUALITY_LABEL[id] }))} onChange={(quality) => store.setQuality(quality as typeof params.graphics.quality)} />
              </Row>
              <Row><Toggle label="Glow" checked={params.graphics.glow} onChange={(glow) => store.setSection('graphics', { glow })} /></Row>
              <Row><Toggle label="Spuren" checked={params.graphics.trails} onChange={(trails) => store.setSection('graphics', { trails })} /></Row>
              <Row>
                <Slider
                  label="Spur-Länge"
                  value={trailLength(params.graphics.trailFade)}
                  min={TRAIL_MIN}
                  max={TRAIL_MAX}
                  defaultValue={trailLength(d.graphics.trailFade)}
                  disabled={Boolean(fadeHint)}
                  hint={fadeHint}
                  onChange={(length) => store.setSection('graphics', { trailFade: trailFade(length) })}
                />
              </Row>
              <Row><Slider label="Partikel-Limit" value={params.graphics.particleCap} min={400} max={7000} step={50} defaultValue={d.graphics.particleCap} onChange={(particleCap) => store.setSection('graphics', { particleCap })} /></Row>
              <Details label="Bild und Leistung">
                <Row><Toggle label="Weiche Partikel" checked={params.graphics.softParticles} onChange={(softParticles) => store.setSection('graphics', { softParticles })} /></Row>
                <Row><Toggle label="Post-Effekte" checked={params.graphics.postEffects} onChange={(postEffects) => store.setSection('graphics', { postEffects })} /></Row>
                <Row><Toggle label="Chromatische Aberration" checked={params.graphics.chromaticAberration} disabled={Boolean(fringeHint)} hint={fringeHint} onChange={(chromaticAberration) => store.setSection('graphics', { chromaticAberration })} /></Row>
                <Row><Slider label="Auflösung" value={params.graphics.resolutionScale} min={0.5} max={1.25} step={0.05} defaultValue={d.graphics.resolutionScale} onChange={(resolutionScale) => store.setSection('graphics', { resolutionScale })} /></Row>
                <Row><Slider label="FPS-Limit" value={params.graphics.fpsLimit} min={24} max={120} step={1} defaultValue={d.graphics.fpsLimit} disabled={Boolean(limitHint)} hint={limitHint} onChange={(fpsLimit) => store.setSection('graphics', { fpsLimit })} /></Row>
                <Row><Toggle label="VSync (Browser)" checked={params.graphics.vsync} onChange={(vsync) => store.setSection('graphics', { vsync })} /></Row>
                <Row><Toggle label="FPS- und Speicheranzeige" checked={params.graphics.showPerf !== false} onChange={(showPerf) => store.setSection('graphics', { showPerf })} /></Row>
              </Details>
            </Group>
          )}

          {tab === 'saves' && (
            <>
              <Group title="Neu">
                <Row>
                  <input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="w-full rounded-[12px] bg-black/25 px-3 py-2.5 font-ui text-[13px] text-white/84 outline-none ring-1 ring-white/8"
                    placeholder="Name"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="lumina-btn" onClick={() => store.saveAsNew(saveName || 'Meine Szene')}>Neu sichern</button>
                    <button type="button" className="lumina-btn" onClick={() => store.restoreAutosave()}>Autosave</button>
                    <button
                      type="button"
                      className="lumina-btn"
                      onClick={() => {
                        const snap = makeSnapshot(saveName, store.params, store.behaviorPresetId, store.colorPresetId)
                        const blob = new Blob([exportSnapshot(snap)], { type: 'application/json' })
                        const a = document.createElement('a')
                        a.href = URL.createObjectURL(blob)
                        a.download = `${saveName.replace(/\s+/g, '-').toLowerCase()}.lumina.json`
                        a.click()
                      }}
                    >
                      Export
                    </button>
                    <label className="lumina-btn cursor-pointer">
                      Import
                      <input
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          void file.text().then((text) => {
                            const snap = importSnapshot(text)
                            store.loadSnapshotParams(snap.params, snap.behaviorPresetId, snap.colorPresetId)
                          })
                        }}
                      />
                    </label>
                  </div>
                </Row>
              </Group>
              <Group title="Slots">
                {store.slots.map((slot) => (
                  <Row key={slot.id}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-ui text-[13px] text-white/82">
                        {slot.snapshot?.name ?? `Leer ${slot.id + 1}`}
                        {slot.snapshot?.favorite ? ' ★' : ''}
                      </p>
                      <div className="flex gap-1">
                        <button type="button" className="lumina-mini" onClick={() => store.saveToSlot(slot.id, saveName)}>Sichern</button>
                        <button type="button" className="lumina-mini" disabled={!slot.snapshot} onClick={() => store.loadSlot(slot.id)}>Laden</button>
                        <button type="button" className="lumina-mini" disabled={!slot.snapshot} onClick={() => store.favoriteSlot(slot.id)}>★</button>
                        <button type="button" className="lumina-mini" disabled={!slot.snapshot} onClick={() => store.deleteSlot(slot.id)}>×</button>
                      </div>
                    </div>
                    {slot.snapshot && (
                      <p className="mt-1 font-ui text-[10px] text-white/28">{new Date(slot.snapshot.savedAt).toLocaleString('de-DE')}</p>
                    )}
                  </Row>
                ))}
              </Group>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
