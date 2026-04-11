'use client'

import { Markdown } from '@tiptap/markdown'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef } from 'react'

import { cn } from '#/lib/utils'

type MarkdownTextareaProps = Readonly<{
  value: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}>

/**
 * WYSIWYG editor with markdown round-trip (TipTap + @tiptap/markdown).
 * Styled to match {@link Textarea} — no slash menu, tables, or image upload.
 */
export function MarkdownTextarea({
  value,
  onChange,
  id,
  placeholder = 'Write something…',
  disabled = false,
  className,
}: MarkdownTextareaProps) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Markdown.configure({
        markedOptions: { gfm: true },
      }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
      }),
    ],
    content: value,
    contentType: 'markdown',
    editable: !disabled,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: cn(
          'md-tiptap-editor min-h-[inherit] w-full max-w-none outline-none',
          'prose prose-sm dark:prose-invert',
          'prose-p:my-1 prose-p:leading-relaxed prose-headings:font-semibold',
          'prose-headings:my-2 prose-headings:text-foreground',
          'prose-ul:my-1 prose-ol:my-1 prose-li:my-0',
          'prose-strong:font-semibold',
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current(ed.getMarkdown())
    },
  })

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.setEditable(!disabled)
  }, [disabled, editor])

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const current = editor.getMarkdown()
    if (current === value) return
    editor.commands.setContent(value, { contentType: 'markdown', emitUpdate: false })
  }, [value, editor])

  return (
    <div
      className={cn(
        'md-tiptap field-sizing-content flex w-full resize-none rounded-md border border-input bg-input/20 px-2 py-2 text-sm transition-colors md:text-xs/relaxed',
        'outline-none focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30',
        'dark:bg-input/30',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className,
      )}
    >
      <EditorContent editor={editor} className="w-full min-h-[inherit] [&_.ProseMirror]:min-h-[inherit]" />
    </div>
  )
}
