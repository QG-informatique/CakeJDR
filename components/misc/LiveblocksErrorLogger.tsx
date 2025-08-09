'use client'
import { useEffect } from 'react'
import { useStatus } from '@liveblocks/react'

export default function LiveblocksErrorLogger() {
  const status = useStatus()
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && status === 'disconnected') {
      console.error('[Liveblocks] connection lost')
    }
  }, [status])
  return null
}
