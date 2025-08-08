import { useEffect } from 'react'

export default function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  active: boolean,
  onEscape?: () => void
) {
  useEffect(() => {
    if (!active || !containerRef.current) return
    const container = containerRef.current
    const selectors =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(selectors)
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onEscape?.()
        return
      }
      if (e.key !== 'Tab' || focusable.length === 0) return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          ;(last || first).focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          ;(first || last).focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [active, containerRef, onEscape])
}

