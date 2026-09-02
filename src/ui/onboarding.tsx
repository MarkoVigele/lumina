import { motion } from 'framer-motion'
import { useLumina } from '../state/store'

export function Onboarding() {
  const hints = useLumina((s) => s.hints)
  const setHints = useLumina((s) => s.setHints)
  if (!hints) return null

  return (
    <>
      <div className="pointer-events-auto flex max-w-[min(100%,20rem)] items-center gap-2 rounded-full border border-white/10 bg-[#0c0e13]/70 px-3 py-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur-md md:hidden">
        <p className="min-w-0 truncate font-ui text-[12px] text-white/72">Ziehen bewegt das Feld.</p>
        <button type="button" className="lumina-btn h-8 shrink-0 px-2.5" onClick={() => setHints(false)}>
          OK
        </button>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto hidden max-w-md rounded-2xl border border-white/10 bg-[#0c0e13]/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl md:block"
      >
        <p className="font-display text-[26px] leading-tight text-white/92">Ein stilles Feld, das atmet.</p>
        <p className="mt-2 font-ui text-[13px] leading-relaxed text-white/58">
          Ziehe mit der Maus oder dem Finger. Halten zieht oder malt, Doppelklick lässt die Szene aufblühen.
          Szenen und Farben bleiben getrennt. Emitter setzt du unter Emitter — standardmäßig ist keine Quelle da.
        </p>
        <ul className="mt-3 space-y-1 font-ui text-[12px] text-white/45">
          <li>Leertaste pausiert · R setzt neu · V evolviert DNA · K wechselt die KI</li>
          <li>1–7 wechselt das Werkzeug · Doppelklick auf einen Regler setzt ihn zurück</li>
          <li>Mausrad ändert den Pinsel · Rechtsklick nutzt das zweite Werkzeug</li>
        </ul>
        <button type="button" className="lumina-btn mt-4" onClick={() => setHints(false)}>
          Verstanden
        </button>
      </motion.div>
    </>
  )
}
