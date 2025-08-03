'use client'

import { FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  player: string
  type: string
  show: boolean
}

const RollAnnouncement: FC<Props> = ({ player, type, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded text-sm pointer-events-none"
      >
        ✨ {player} lance un {type}...
      </motion.div>
    )}
  </AnimatePresence>
)

export default RollAnnouncement
