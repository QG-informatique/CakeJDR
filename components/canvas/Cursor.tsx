'use client'
import { motion } from 'framer-motion'

export default function Cursor({ x, y, color, name }: { x:number; y:number; color:string; name?:string }) {
  return (
    <motion.div
      className="absolute top-0 left-0 pointer-events-none z-20"
      initial={{ x, y }}
      animate={{ x, y }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        {name && (
          <span className="ml-1 text-xs font-semibold" style={{ color }}>
            {name}
          </span>
        )}
      </div>
    </motion.div>
  )
}
