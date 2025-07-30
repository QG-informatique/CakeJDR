'use client'
import React, { useState, useEffect, useRef } from 'react'
import CakeLogo from '@/components/ui/CakeLogo'
import { useT } from '@/lib/useT'

const PROFILE_KEY = 'jdr_profile'
const CUBE_SIZE = 200
const LOGO_GAP = 56 // distance (px) entre le bas du logo et le HAUT du cube

type FaceType = 'input' | 'button' | 'pips'
interface FaceDef { rotX: number; rotY: number; type: FaceType; value?: number }

// --- Helpers pips ---
function pipPattern(v: number) {
  const c = { r:1, c:1 }
  const corners = [{r:0,c:0},{r:0,c:2},{r:2,c:0},{r:2,c:2}]
  const mids = [{r:0,c:1},{r:2,c:1}]
  switch(v){
    case 1: return [c]
    case 2: return [corners[0], corners[3]]
    case 3: return [corners[0], c, corners[3]]
    case 4: return corners
    case 5: return [...corners, c]
    case 6: return [...corners, ...mids]
    default: return []
  }
}
function DicePips({ value, size }: { value:number; size:number }) {
  const dotSize = size * 0.14
  const gap = (size - 3 * dotSize)/4
  return (
    <div style={{ position:'relative', width:size, height:size, pointerEvents:'none' }} aria-label={`Face ${value}`}>
      {pipPattern(value).map((d,i)=>{
        const top = gap + d.r*(dotSize+gap)
        const left= gap + d.c*(dotSize+gap)
        return (
          <div key={i} style={{
            position:'absolute', top, left, width:dotSize, height:dotSize,
            borderRadius:'50%',
            background:'radial-gradient(circle at 30% 30%, #fff, #bbb 70%)',
            boxShadow:'0 0 4px rgba(255,255,255,0.4), inset 0 0 3px rgba(0,0,0,0.7)',
            filter:'drop-shadow(0 2px 2px rgba(0,0,0,0.6))'
          }}/>
        )
      })}
    </div>
  )
}

export default function Login({ onLogin }: { onLogin:(p:string)=>void }) {
  // -- Ajout d'un état mounted pour éviter le flash du cube --
  const [mounted, setMounted] = useState(false)
  const t = useT()
  useEffect(() => {
    setMounted(true)
  }, [])

  const [pseudo, setPseudo] = useState('')
  const [error, setError] = useState<string|null>(null)
  const [rotation, setRotation] = useState({ x:0, y:0 })
  const draggingRef = useRef(false)
  const origin = useRef({ x:0, y:0 })
  const velocity = useRef({ x:0, y:0 })
  const frame = useRef<number | null>(null)

  useEffect(()=>{
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (raw) setPseudo(JSON.parse(raw).pseudo || '')
    } catch {}
  },[])

  const handleLogin = () => {
    const name = pseudo.trim()
    if(!name){ setError(t('chooseName')); return }
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
    const profile = {
      ...saved,
      pseudo:name,
      color: saved.color || '#1d4ed8',
      isMJ: saved.isMJ ?? false,
      loggedIn:true
    }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    window.dispatchEvent(new Event('jdr_profile_change'))
    setError(null)
    onLogin(name)
  }

  const onPointerDown = (e:React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = true
    origin.current = { x:e.clientX, y:e.clientY }
    velocity.current = { x:0, y:0 }
    if(frame.current) cancelAnimationFrame(frame.current)
  }
  const onPointerMove = (e:React.PointerEvent) => {
    if(!draggingRef.current) return
    const dx = e.clientX - origin.current.x
    const dy = e.clientY - origin.current.y
    setRotation(r => ({ x: r.x - dy * 0.4, y: r.y + dx * 0.4 }))
    velocity.current = { x: dx * 0.4, y: dy * 0.4 }
    origin.current = { x:e.clientX, y:e.clientY }
  }
  const onPointerUp = () => {
    draggingRef.current = false
    const decay = () => {
      velocity.current.x *= 0.95
      velocity.current.y *= 0.95
      if(Math.abs(velocity.current.x) < 0.01 && Math.abs(velocity.current.y) < 0.01) return
      setRotation(r => ({ x: r.x - velocity.current.y, y: r.y + velocity.current.x }))
      frame.current = requestAnimationFrame(decay)
    }
    frame.current = requestAnimationFrame(decay)
  }

  const faces: FaceDef[] = [
    { rotX:0, rotY:0,   type:'input',  value:6 },
    { rotX:0, rotY:90,  type:'pips',   value:5 },
    { rotX:0, rotY:180, type:'button', value:1 },
    { rotX:0, rotY:-90, type:'pips',   value:2 },
    { rotX:90, rotY:0,  type:'pips',   value:3 },
    { rotX:-90,rotY:0,  type:'pips',   value:4 }
  ]

  return (
    // [NOTE] Ce composant ne génère PAS de "ronds transparents" !
    <div
      className="absolute"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
      }}
    >
      <div style={{ position:'relative', width: CUBE_SIZE, height: CUBE_SIZE }}>
        {/* Logo au-dessus */}
        <div
          style={{
            position:'absolute',
            bottom: CUBE_SIZE + LOGO_GAP,
            left:'50%',
            transform:'translateX(-50%)',
            pointerEvents:'none'
          }}
        >
          <CakeLogo xl showText={false} className="scale-[1.25]" />
        </div>

        {/* CUBE 3D */}
        <div style={{ width:CUBE_SIZE, height:CUBE_SIZE, perspective:600, pointerEvents:'auto' }}>
          {/* Correction principale : cube caché tant que !mounted */}
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{
              width:CUBE_SIZE,
              height:CUBE_SIZE,
              transformStyle:'preserve-3d',
              transform:`rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              cursor: draggingRef.current ? 'grabbing' : 'grab',
              position:'relative',
              userSelect:'none',
              // On masque le cube tant que mounted === false
             opacity: mounted ? 1 : 0,
transition: 'opacity 0.4s ease, transform 0.3s ease'

            }}
          >
            {faces.map(({ rotX, rotY, type, value }, idx) => (
              <div
                key={idx}
                style={{
                  position:'absolute',
                  width:CUBE_SIZE,
                  height:CUBE_SIZE,
                  background:'linear-gradient(145deg,#181818,#0f0f0f)',
                  border:'4px solid #D6336C',
                  borderRadius:'16px',
                  boxShadow:'0 4px 10px rgba(0,0,0,0.6), inset 0 0 12px rgba(214,51,108,0.15)',
                  transform:`rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${CUBE_SIZE/2}px)`,
                  backfaceVisibility:'hidden',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center'
                }}
              >
                {type === 'input' && (
                  <input
                    value={pseudo}
                    onChange={e => setPseudo(e.target.value)}
                    placeholder={t('username')}
                    className="px-2 py-1 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                    style={{
                      width: CUBE_SIZE * 0.6,
                      textAlign:'center',
                      userSelect:'text',
                      pointerEvents:'auto'
                    }}
                  />
                )}
                {type === 'button' && (
                  <button
                    onClick={handleLogin}
                    className="bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded font-semibold shadow"
                    style={{ pointerEvents:'auto' }}
                  >
                    {t('enter')}
                  </button>
                )}
                {type === 'pips' && value && (
                  <DicePips value={value} size={CUBE_SIZE} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Message d'erreur sous le cube */}
        {error && (
          <div
            style={{
              position:'absolute',
              top: CUBE_SIZE + 12,
              width:'100%',
              textAlign:'center',
              pointerEvents:'none'
            }}
          >
            <p className="text-pink-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
