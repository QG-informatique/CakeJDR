'use client'
import { Toolbar } from '@liveblocks/react-lexical'
import { FORMAT_TEXT_COMMAND, $getSelection, $isRangeSelection } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import type { LexicalEditor } from 'lexical'

function isTextFormatActivePersistent(editor: LexicalEditor, format: string) {
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
        icon={<Toolbar.BoldIcon />}
        shortcut="Mod-B"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        active={isTextFormatActivePersistent(editor, 'bold')}
      />
      <Toolbar.Toggle
        name="Italic"
        icon={<Toolbar.ItalicIcon />}
        shortcut="Mod-I"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        active={isTextFormatActivePersistent(editor, 'italic')}
      />
      <Toolbar.Toggle
        name="Underline"
        icon={<Toolbar.UnderlineIcon />}
        shortcut="Mod-U"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        active={isTextFormatActivePersistent(editor, 'underline')}
      />
      <Toolbar.Toggle
        name="Strikethrough"
        icon={<Toolbar.StrikethroughIcon />}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        active={isTextFormatActivePersistent(editor, 'strikethrough')}
      />
      <Toolbar.Toggle
        name="Inline code"
        icon={<Toolbar.CodeIcon />}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
        active={isTextFormatActivePersistent(editor, 'code')}
      />
    </>
  )
}
