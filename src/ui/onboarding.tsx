import { motion } from 'framer-motion'
import { useLumina } from '../state/store'

export function Onboarding() {
  const hints = useLumina((s) => s.hints)
  const setHints = useLumina((s) => s.setHints)
  if (!hints) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="pointer-events-auto max-w-md rounded-2xl border border-white/10 bg-[#0c0e13]/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl"
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
  )
}
