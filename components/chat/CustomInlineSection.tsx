'use client'
import { Toolbar } from '@liveblocks/react-lexical'
import { Icon } from '@liveblocks/react-ui'
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supportsTextFormat = (editor as any)._commands.has(FORMAT_TEXT_COMMAND)
  if (!supportsTextFormat) return null
  return (
    <>
      <Toolbar.Toggle
        name="Bold"
        icon={<Icon.Bold />}
        shortcut="Mod-B"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        active={isTextFormatActivePersistent(editor, 'bold' as TextFormatType)}
      />
      <Toolbar.Toggle
        name="Italic"
        icon={<Icon.Italic />}
        shortcut="Mod-I"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        active={isTextFormatActivePersistent(editor, 'italic' as TextFormatType)}
      />
      <Toolbar.Toggle
        name="Underline"
        icon={<Icon.Underline />}
        shortcut="Mod-U"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        active={isTextFormatActivePersistent(editor, 'underline' as TextFormatType)}
      />
      <Toolbar.Toggle
        name="Strikethrough"
        icon={<Icon.Strikethrough />}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        active={isTextFormatActivePersistent(editor, 'strikethrough' as TextFormatType)}
      />
      <Toolbar.Toggle
        name="Inline code"
        icon={<Icon.Code />}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
        active={isTextFormatActivePersistent(editor, 'code' as TextFormatType)}
      />
    </>
  )
}
