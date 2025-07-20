import { FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
/* eslint-disable @typescript-eslint/no-explicit-any */

type Props = {
  dice: string
  setDice: (dice: string) => void
  onLevelUp: () => void
  processing?: boolean
  lastStat?: string | null
  lastGain?: number | null
  animKey?: number   // <= AJOUT
}

const DICE_OPTIONS = [
  { value: 'd4', label: 'D4' },
  { value: 'd6', label: 'D6' },
  { value: 'd20', label: 'D20' }
]

// Helper pour trouver la valeur max du dé
function getDiceMax(dice: string) {
  const m = dice.match(/d(\d+)/i)
  if (m) return parseInt(m[1])
  return 1
}

const sparks = Array.from({ length: 7 })

const LevelUpPanel: FC<Props> = ({
  dice,
  setDice,
  onLevelUp,
  processing,
  lastGain,
  animKey,    // <= AJOUT
}) => {
  const diceMax = getDiceMax(dice)
  const isMin = lastGain === 1
  const isMax = lastGain === diceMax

  // Styles dynamiques (inchangé)
  let textColor = 'text-green-300'
  let bgGlow = 'bg-green-400'
  let shadow = '0 0 48px 20px #34d399, 0 0 200px 120px #34d39977'
  let stroke = '#fff'
  let pulse = 'animate-pulse'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let extraEffect: any = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let motionTransition: any = { duration: 0.85, type: 'tween' }

  if (isMax) {
    textColor = 'text-yellow-300'
    bgGlow = 'bg-yellow-400'
    shadow = '0 0 68px 24px #ffd600, 0 0 220px 150px #fff17677'
    stroke = '#e0b800'
    pulse = ''
    extraEffect = { rotate: [0, 6, -6, 3, 0] }
    motionTransition = { duration: 1.25, type: 'tween' }
  } else if (isMin) {
    textColor = 'text-red-400'
    bgGlow = 'bg-red-500'
    shadow = '0 0 48px 16px #f87171, 0 0 140px 100px #f8717177'
    stroke = '#700'
    pulse = 'animate-bounce'
    extraEffect = { scale: [1, 0.98, 1.08, 0.96, 1], x: [0, 6, -6, 0] }
    motionTransition = { duration: 1.05, type: 'tween' }
  }

  return (
    <div className="mt-5 relative">
      <label className="block mb-1">Type de dé :</label>
      <select
        value={dice}
        onChange={e => setDice(e.target.value)}
        className="w-full mb-2 p-1 border rounded bg-white text-black dark:bg-gray-700 dark:text-white"
        disabled={processing}
      >
        {DICE_OPTIONS.map(d => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
      </select>
      <div className="flex justify-center mt-2">
        <button
          onClick={onLevelUp}
          disabled={processing}
          className="bg-blue-600/80 hover:bg-blue-600 text-white font-semibold px-4 py-1.5 rounded-md shadow disabled:opacity-50"
        >
          {processing ? 'Lancement...' : 'Lancer Level Up'}
        </button>
      </div>

      <AnimatePresence>
        {lastGain !== null && (
          <motion.div
            key={animKey}  // <= C'EST ICI QUE ÇA CHANGE TOUT !
            initial={{ opacity: 0, y: 44, scale: 0.72 }}
            animate={{
              opacity: 1,
              y: -26,
              scale: isMax ? 1.27 : 1.13,
              ...extraEffect
            }}
            exit={{
              opacity: 0,
              y: -68,
              scale: isMax ? 1.35 : 1.20,
            }}
            transition={motionTransition}
            className="absolute left-1/2 -translate-x-1/2 top-[44%] pointer-events-none select-none"
            style={{ zIndex: 100 }}
          >
            <motion.div
              initial={{ opacity: 0.45, scale: 0.8 }}
              animate={{ opacity: 0.11, scale: isMax ? 2.7 : 2.2 }}
              exit={{ opacity: 0, scale: isMax ? 3 : 2.6 }}
              transition={{ duration: isMax || isMin ? 1 : 0.88 }}
              className={`absolute inset-0 rounded-2xl blur-2xl ${bgGlow}`}
              style={{ zIndex: 1, boxShadow: shadow }}
            />
            {isMax && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                {sparks.map((_, i) => {
                  const angle = (i / sparks.length) * 2 * Math.PI
                  const radius = 54
                  const x = Math.cos(angle) * radius
                  const y = Math.sin(angle) * radius
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.4, 1.15, 0.9],
                        x,
                        y
                      }}
                      exit={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
                      transition={{
                        duration: 0.95,
                        delay: 0.08 + i * 0.045,
                        type: "tween"
                      }}
                      className="w-5 h-5"
                      style={{ zIndex: 21 }}
                    >
                      <div className="w-full h-full rounded-full bg-yellow-300 opacity-70 blur-[1.5px] shadow-lg border-2 border-yellow-100" />
                    </motion.div>
                  )
                })}
              </div>
            )}
            <motion.span
              initial={{ scale: 1, textShadow: '0 0 0 #fff' }}
              animate={{
                scale: [1, isMax ? 1.45 : 1.23, isMax ? 1.32 : 1.09],
                textShadow: [
                  isMax
                    ? '0 0 34px #ffd600, 0 0 120px #ffe066'
                    : isMin
                      ? '0 0 18px #fa5252, 0 0 48px #ef4444'
                      : '0 0 14px #38FFC0, 0 0 40px #00FFA3'
                ]
              }}
              exit={{
                scale: isMax ? 1.37 : 1.15,
                opacity: 0,
                textShadow: '0 0 0 #fff'
              }}
              transition={{ duration: isMax || isMin ? 1.03 : 0.85, type: 'tween' }}
              className={`relative z-10 text-5xl font-black tracking-wider drop-shadow-[0_4px_20px_rgba(0,0,0,0.55)] ${textColor} ${pulse}`}
              style={{
                WebkitTextStroke: `2px ${stroke}`,
                filter: isMax
                  ? 'drop-shadow(0 0 22px #fff9c4)'
                  : isMin
                    ? 'drop-shadow(0 0 10px #f87171)'
                    : 'drop-shadow(0 0 10px #38FFC0)'
              }}
            >
              +{lastGain}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LevelUpPanel
