"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Landing page: simply redirect to the login/menu screen.
export default function HomePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/menu')
  }, [router])
  return null
}
