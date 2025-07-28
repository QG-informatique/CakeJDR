import { Canvas, useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface Props {
  show: boolean
  result: number | null
  diceType: number
  onFinish?: () => void
}

const FACE_ROTATIONS: [number, number, number][] = [
  [0, 0, 0],
  [Math.PI / 2, 0, 0],
  [-Math.PI / 2, 0, 0],
  [0, Math.PI / 2, 0],
  [0, -Math.PI / 2, 0],
  [0, Math.PI, 0]
]

type Phase = 'rolling' | 'orient' | 'done'

function Dice({ result, onSettled }: { result: number; onSettled: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [phase, setPhase] = useState<Phase>('rolling')
  const [speed, setSpeed] = useState(12)
  const target = FACE_ROTATIONS[(result - 1) % 6]

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (phase === 'rolling') {
      mesh.rotation.x += speed * delta
      mesh.rotation.y += speed * delta * 0.7
      mesh.rotation.z += speed * delta * 0.5
      setSpeed((s) => s * 0.96)
      if (speed < 2) setPhase('orient')
    } else if (phase === 'orient') {
      mesh.rotation.x += (target[0] - mesh.rotation.x) * 0.1
      mesh.rotation.y += (target[1] - mesh.rotation.y) * 0.1
      mesh.rotation.z += (target[2] - mesh.rotation.z) * 0.1
      const d =
        Math.abs(target[0] - mesh.rotation.x) +
        Math.abs(target[1] - mesh.rotation.y) +
        Math.abs(target[2] - mesh.rotation.z)
      if (d < 0.01) {
        setPhase('done')
        onSettled()
      }
    }
  })

  const faceData: { position: [number, number, number]; rotation: [number, number, number] }[] = [
    { position: [0, 0.51, 0], rotation: [-Math.PI / 2, 0, 0] },
    { position: [0, -0.51, 0], rotation: [Math.PI / 2, 0, 0] },
    { position: [0, 0, 0.51], rotation: [0, 0, 0] },
    { position: [0, 0, -0.51], rotation: [0, Math.PI, 0] },
    { position: [0.51, 0, 0], rotation: [0, -Math.PI / 2, 0] },
    { position: [-0.51, 0, 0], rotation: [0, Math.PI / 2, 0] }
  ]

  return (
    <motion.mesh ref={meshRef} scale={1.2}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="white" />
      {faceData.map((f, idx) => (
        <Text
          key={idx}
          position={f.position}
          rotation={f.rotation}
          fontSize={0.4}
          color="black"
        >
          {result}
        </Text>
      ))}
    </motion.mesh>
  )
}

export default function FancyDice({ show, result, diceType, onFinish }: Props) {
  const [visible, setVisible] = useState(false)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (show && result !== null) {
      setVisible(true)
    }
  }, [show, result])

  const handleSettled = () => {
    setSettled(true)
    setTimeout(() => {
      setVisible(false)
      onFinish?.()
    }, 2500)
  }

  if (!visible || result === null) return null

  const isCrit = result === diceType
  const isFail = result === 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]"
    >
      <motion.div
        animate={
          settled && isFail
            ? { x: [0, -10, 10, -10, 10, 0], backgroundColor: '#fca5a5' }
            : {}
        }
        className={isCrit ? 'p-2 rounded-xl bg-yellow-200/80' : ''}
      >
        <Canvas style={{ width: 200, height: 200 }}>
          <ambientLight intensity={0.8} />
          <pointLight position={[5, 5, 5]} />
          <Dice result={result} onSettled={handleSettled} />
        </Canvas>
      </motion.div>
      {settled && isCrit && (
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 0.8 }}
          className="absolute"
        >
          <div className="w-32 h-32 rounded-full bg-yellow-300/50 blur-xl"></div>
        </motion.div>
      )}
    </motion.div>
  )
}
