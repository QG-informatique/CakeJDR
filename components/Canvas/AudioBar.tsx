import React from 'react'

type Props = {
  ytUrl: string
  setYtUrl: (val: string) => void
  ytId: string
  setYtId: (id: string) => void
  isPlaying: boolean
  setIsPlaying: (b: boolean) => void
  playerRef: React.MutableRefObject<any>
  volume: number
  setVolume: (val: number) => void
}

export default function AudioBar({
  ytUrl, setYtUrl, ytId, setYtId, isPlaying, setIsPlaying, playerRef, volume, setVolume
}: Props) {

  const handleYtSubmit = () => {
    const match = ytUrl.match(/(?:youtube\.com.*v=|youtu\.be\/)([^&\n?#]+)/)
    if (match) {
      setYtId(match[1])
      setIsPlaying(true)
    }
  }
  const handlePlayPause = () => {
    const player = playerRef.current
    if (!player) return
    if (isPlaying) player.pauseVideo()
    else player.playVideo()
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="absolute bottom-2 right-14 z-30 bg-white/90 dark:bg-gray-800 p-3 rounded shadow-md w-64 pointer-events-auto">
      <input
        type="text"
        placeholder="Lien YouTube"
        value={ytUrl}
        onChange={(e) => setYtUrl(e.target.value)}
        className="w-full px-2 py-1 rounded border text-black"
      />
      <button onClick={handleYtSubmit} className="w-full bg-blue-500 text-white px-2 py-1 mt-2 rounded">
        Charger
      </button>
      <div className="flex items-center justify-between mt-2">
        <button onClick={handlePlayPause} className="bg-gray-600 text-white px-3 py-1 rounded">
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(parseInt(e.target.value, 10))}
          className="ml-2 flex-1"
        />
      </div>
    </div>
  )
}
