'use client'
import { Bold, Italic, Underline, Strikethrough, Code } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  type TextFormatType,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import type { LexicalEditor } from 'lexical'

function isTextFormatActivePersistent(
  editor: LexicalEditor,
  format: TextFormatType,
) {
  return editor.getEditorState().read(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return false
    // Keep format active even with collapsed selection
    return selection.hasFormat(format)
  })
}

export default function CustomInlineSection() {
  const [editor] = useLexicalComposerContext()
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      forceUpdate(v => v + 1)
    })
  }, [editor])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supportsTextFormat = (editor as any)._commands.has(FORMAT_TEXT_COMMAND)
  if (!supportsTextFormat) return null

  const buttons = [
    { format: 'bold' as TextFormatType, Icon: Bold, label: 'Bold' },
    { format: 'italic' as TextFormatType, Icon: Italic, label: 'Italic' },
    { format: 'underline' as TextFormatType, Icon: Underline, label: 'Underline' },
    { format: 'strikethrough' as TextFormatType, Icon: Strikethrough, label: 'Strikethrough' },
    { format: 'code' as TextFormatType, Icon: Code, label: 'Inline code' },
  ]

  return (
    <>
      {buttons.map(({ format, Icon, label }) => {
        const active = isTextFormatActivePersistent(editor, format)
        return (
          <button
            key={format}
            type="button"
            aria-label={label}
            className={`toolbar-btn${active ? ' active' : ''}`}
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)}
          >
            <Icon size={16} />
          </button>
        )
      })}
    </>
  )
}
