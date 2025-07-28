'use client'
import { FC } from 'react'

const SmallSpinner: FC<{ className?: string }> = ({ className = '' }) => (
  <span
    className={`inline-block w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin ${className}`}
  />
)

export default SmallSpinner
