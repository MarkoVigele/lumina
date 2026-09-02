import type { ReactNode } from 'react'

export function Group({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-[16px] bg-white/[0.05] ring-1 ring-white/8">
      {title && (
        <p className="truncate px-3.5 pt-2.5 pb-0.5 font-ui text-[11px] font-medium tracking-wide text-white/38">{title}</p>
      )}
      <div className="divide-y divide-white/6">{children}</div>
    </div>
  )
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="min-w-0 px-3.5 py-2">{children}</div>
}

/** Fine-tuning drawer. Lives inside a Group, after the few primary rows. */
export function Details({
  label = 'Fein einstellen',
  children,
}: {
  label?: string
  children: ReactNode
}) {
  return (
    <details className="group/details">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2 font-ui text-[12px] text-white/42 marker:content-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.03] hover:text-white/64">
        <span>{label}</span>
        <span className="text-[11px] text-white/28 transition-transform group-open/details:rotate-180">▾</span>
      </summary>
      <div className="divide-y divide-white/6 border-t border-white/6">{children}</div>
    </details>
  )
}

export function Hint({ text }: { text?: string }) {
  if (!text) return null
  return <p className="mt-1.5 font-ui text-[11px] leading-snug text-white/34">{text}</p>
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format,
  defaultValue,
  disabled,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
  defaultValue?: number
  disabled?: boolean
  hint?: string
}) {
  return (
    <label
      className={`block ${disabled ? 'opacity-45' : ''}`}
      title={disabled ? hint : defaultValue !== undefined ? 'Doppelklick setzt den Standard zurück' : undefined}
    >
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className={`font-ui text-[13px] ${disabled ? 'text-white/42' : 'text-white/78'}`}>{label}</span>
        <span className="font-ui text-[11px] tabular-nums text-white/36">
          {format ? format(value) : value.toFixed(step < 1 ? 2 : 0)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          if (disabled) return
          onChange(Number(e.target.value))
        }}
        onDoubleClick={() => {
          if (disabled || defaultValue === undefined) return
          onChange(defaultValue)
        }}
        className="lumina-range"
      />
      <Hint text={hint} />
    </label>
  )
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="font-ui text-[13px] text-white/78">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-ui text-[11px] text-white/32">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded-full border border-white/12 bg-transparent p-0"
        />
      </span>
    </label>
  )
}

export function MixRow({
  label,
  on,
  mix,
  defaultMix,
  onToggle,
  onMix,
}: {
  label: string
  on: boolean
  mix: number
  defaultMix: number
  onToggle: (on: boolean) => void
  onMix: (mix: number) => void
}) {
  return (
    <div>
      <Toggle label={label} checked={on} onChange={onToggle} />
      {on && (
        <div className="mt-2">
          <Slider label="Anteil" value={mix} min={0} max={1} defaultValue={defaultMix} onChange={onMix} />
        </div>
      )}
    </div>
  )
}

export function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex min-w-[1.1rem] items-center justify-center rounded-[5px] bg-black/55 px-1 py-px font-ui text-[9px] font-medium leading-none text-white/70 ring-1 ring-white/16 backdrop-blur-sm">
      {children}
    </kbd>
  )
}

/** Tiny key on a `group` icon — only visible while hovered or focused. Hidden on touch. */
export function HoverKbd({ keys }: { keys?: string }) {
  if (!keys) return null
  return (
    <span className="lumina-kbd-hint pointer-events-none absolute -right-0.5 -top-0.5 z-10 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
      <Kbd>{keys}</Kbd>
    </span>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
  disabled,
  hint,
  shortcut,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  hint?: string
  shortcut?: string
}) {
  const title = disabled ? hint : shortcut ? `${label} (${shortcut})` : undefined
  return (
    <div>
      <label
        title={title}
        className={`flex min-h-[28px] items-center justify-between gap-3 ${disabled ? 'opacity-45' : ''}`}
      >
        <span className={`inline-flex items-center gap-1.5 font-ui text-[13px] ${disabled ? 'text-white/42' : 'text-white/78'}`}>
          {label}
          {shortcut && (
            <span className="lumina-kbd-hint">
              <Kbd>{shortcut}</Kbd>
            </span>
          )}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-disabled={disabled || undefined}
          disabled={disabled}
          title={title}
          onClick={() => {
            if (disabled) return
            onChange(!checked)
          }}
          className={`relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors ${
            disabled ? 'cursor-not-allowed' : ''
          } ${checked ? 'bg-[#6ee7b7]' : 'bg-white/14'}`}
        >
          <span
            className={`absolute top-[3px] left-[3px] block h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform ${
              checked ? 'translate-x-[20px]' : 'translate-x-0'
            }`}
          />
        </button>
      </label>
      <Hint text={hint} />
    </div>
  )
}

export function Select({
  label,
  value,
  options,
  onChange,
  disabled,
  hint,
}: {
  label: string
  value: string
  options: { id: string; name: string }[]
  onChange: (v: string) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <label className={`block ${disabled ? 'opacity-45' : ''}`}>
      <span className={`mb-1.5 block font-ui text-[13px] ${disabled ? 'text-white/42' : 'text-white/78'}`}>{label}</span>
      <select
        value={value}
        disabled={disabled}
        title={disabled ? hint : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[12px] border-0 bg-black/25 px-3 py-2.5 font-ui text-[13px] text-white/84 outline-none ring-1 ring-white/8 disabled:cursor-not-allowed"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <Hint text={hint} />
    </label>
  )
}

export function ChipRow({
  value,
  options,
  onChange,
  disabled,
  hint,
}: {
  value: string
  options: { id: string; name: string; dot?: string }[]
  onChange: (v: string) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <div>
      <div className={`flex flex-wrap gap-1.5 ${disabled ? 'opacity-45' : ''}`}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={disabled}
            title={disabled ? hint : undefined}
            onClick={() => {
              if (disabled) return
              onChange(o.id)
            }}
            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3.5 py-1.5 font-ui text-[12px] disabled:cursor-not-allowed ${
              value === o.id
                ? 'bg-white/90 text-[#14161c]'
                : 'bg-white/8 text-white/62 hover:bg-white/12 disabled:hover:bg-white/8'
            }`}
          >
            {o.dot && (
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: o.dot, boxShadow: value === o.id ? `0 0 6px ${o.dot}` : undefined }}
              />
            )}
            {o.name}
          </button>
        ))}
      </div>
      <Hint text={hint} />
    </div>
  )
}
