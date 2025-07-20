"use client"
import { FC } from 'react'

const COLORS = [
  '#e11d48','#1d4ed8','#16a34a','#f59e0b','#d946ef',
  '#0d9488','#f97316','#a3a3a3','#ffffff','#000000'
]

interface Props {
  color: string
  onChange: (c: string) => void
}

const ProfileColorPicker: FC<Props> = ({ color, onChange }) => (
  <div className="flex items-center gap-1">
    {COLORS.map(c => (
      <button
        key={c}
        onClick={() => onChange(c)}
        className={`w-6 h-6 rounded-full border-2 ${
          color === c ? 'border-white scale-110' : 'border-gray-400'
        }`}
        style={{ backgroundColor: c }}
        aria-label={c}
      />
    ))}
    <input
      type="color"
      value={color}
      onChange={e => onChange(e.target.value)}
      className="w-6 h-6 rounded border-2 border-gray-400 cursor-pointer p-0"
    />
  </div>
)

export default ProfileColorPicker
