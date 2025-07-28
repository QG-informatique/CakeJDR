'use client'

import React from 'react'

// Small component handling YouTube player controls.

interface MusicPanelProps {
  ytUrl: string
  setYtUrl: (url: string) => void
  isPlaying: boolean
  handleSubmit: () => void
  handlePlayPause: () => void
  volume: number
  setVolume: (v: number) => void
}

const MusicPanel: React.FC<MusicPanelProps> = ({
  ytUrl,
  setYtUrl,
  isPlaying,
  handleSubmit,
  handlePlayPause,
  volume,
  setVolume,
}) => (
  <div className="absolute bottom-3 right-40 z-40 bg-black/70 border border-white/10 rounded-2xl shadow-lg p-4 min-w-[250px] max-w-[340px] backdrop-blur-xl">
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Lien YouTube"
        value={ytUrl}
        onChange={e => setYtUrl(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-black/40 text-white border border-white/20 placeholder:text-white/40"
      />
      <button
        onClick={handleSubmit}
        className="rounded-xl px-3 py-2 text-xs font-semibold shadow border-none bg-blue-600 text-white hover:bg-blue-700"
      >
        Charger la musique
      </button>
      <div className="flex items-center justify-between mt-1">
        <button
          onClick={handlePlayPause}
          className="rounded-xl px-3 py-2 text-xs font-semibold shadow border-none bg-black/30 text-white/90 hover:bg-purple-600 hover:text-white"
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Lecture'}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={e => setVolume(parseInt(e.target.value, 10))}
          className="ml-2 flex-1"
        />
      </div>
    </div>
  </div>
)

export default MusicPanel
