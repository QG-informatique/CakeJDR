'use client'
import { FC, useState, useRef, useEffect } from 'react'

const COLORS = [
  '#e11d48','#1d4ed8','#16a34a','#f59e0b','#d946ef',
  '#0d9488','#f97316','#a3a3a3','#ffffff','#000000'
]

interface Props {
  color: string
  onChange: (c: string) => void
  /**
   * Optionnel : taille du bouton déclencheur (par défaut 28)
   */
  size?: number
}

const ProfileColorPicker: FC<Props> = ({ color, onChange, size = 28 }) => {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Fermer si clic en dehors
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [open])

  const triggerSize = `${size}px`

  const handlePick = (c: string) => {
    onChange(c)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative inline-flex items-center">
      {/* Bouton principal */}
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className={`
          group relative flex-shrink-0
          rounded-full border
          transition
          focus:outline-none focus:ring-2 focus:ring-white/30
          hover:shadow
        `}
        style={{
          width: triggerSize,
          height: triggerSize,
          background: color,
          borderColor: 'rgba(255,255,255,0.35)',
          boxShadow: '0 2px 6px -2px rgba(0,0,0,0.5)'
        }}
        title="Changer la couleur du profil"
      >
        {/* Petit chevron / indicateur */}
        <span
          className={`
            absolute -bottom-1 left-1/2 -translate-x-1/2
            text-[9px] leading-none font-semibold text-white
            opacity-75 group-hover:opacity-100
            transition
            select-none
          `}
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
        >
          {open ? '-' : '+'}
        </span>
      </button>

      {/* Palette déroulante */}
      <div
        className={`
          absolute top-1/2 left-full
          -translate-y-1/2 ml-2
          flex items-center gap-2
          transition-all duration-250
          ${open
            ? 'opacity-100 translate-x-0 pointer-events-auto'
            : 'opacity-0 -translate-x-2 pointer-events-none'}
        `}
        style={{
          padding: open ? '6px 10px' : 0,
          background: open ? 'rgba(25,30,45,0.55)' : 'transparent',
            backdropFilter: open ? 'blur(6px)' : 'none',
          border: open ? '1px solid rgba(180,200,255,0.18)' : '1px solid transparent',
          borderRadius: 9999,
          boxShadow: open ? '0 4px 18px -6px rgba(0,0,0,0.55)' : 'none'
        }}
      >
        {COLORS.map(c => {
          const active = color.toLowerCase() === c.toLowerCase()
          return (
            <button
              key={c}
              onClick={() => handlePick(c)}
              className={`
                w-6 h-6 rounded-full border
                transition transform
                ${active
                  ? 'border-white ring-2 ring-white/70 scale-110'
                  : 'border-white/30 hover:border-white/70 hover:scale-110'}
              `}
              style={{ background: c }}
              aria-label={`Couleur ${c}`}
            />
          )
        })}

        {/* Bouton couleur personnalisée */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="
            w-6 h-6 rounded-full border border-dashed border-white/40
            text-[11px] font-bold text-white/70
            hover:border-white/70 hover:text-white
            flex items-center justify-center
            transition
          "
          title="Couleur personnalisée"
        >
          +
        </button>
        <input
          ref={inputRef}
          type="color"
          value={color}
          onChange={e => handlePick(e.target.value)}
          className="hidden"
        />
      </div>
    </div>
  )
}

export default ProfileColorPicker
