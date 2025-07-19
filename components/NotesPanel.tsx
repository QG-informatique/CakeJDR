'use client'
import { useState, useEffect } from 'react'

interface Props {
  edit: boolean
  value: string
  onChange: (txt: string) => void
}

export default function NotesPanel({ edit, value, onChange }: Props) {
  const [local, setLocal] = useState(value || '')

  useEffect(() => setLocal(value || ''), [value])


  const handleBlur = () => {
    onChange(local)
  }

  return (
    <div className="p-2">
      {edit ? (
        <textarea
          className="w-full h-40 bg-white text-black p-2 rounded border"
          value={local}
          onChange={e => setLocal(e.target.value)}
          onBlur={handleBlur}
        />
      ) : (
        <pre className="whitespace-pre-wrap bg-gray-200 dark:bg-gray-700 p-2 rounded" style={{ minHeight: '160px' }}>{local}</pre>
      )}
    </div>
  )
}
