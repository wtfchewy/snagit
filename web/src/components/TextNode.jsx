import { useState, useRef, useEffect } from 'react'
import { Trash2 } from 'lucide-react'

export default function TextNode({ data, selected }) {
  const { text, onTextChange, onDelete, fontSize = 16 } = data
  const [editing, setEditing] = useState(!text)
  const [hovered, setHovered] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [editing])

  function handleBlur() {
    setEditing(false)
    if (!text?.trim()) onDelete?.()
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setEditing(false)
      if (!text?.trim()) onDelete?.()
    }
    // Allow Enter for newlines with Shift, submit on plain Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      setEditing(false)
      if (!text?.trim()) onDelete?.()
    }
  }

  return (
    <div
      className="relative group"
      style={{ minWidth: 60, minHeight: 24 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={() => setEditing(true)}
    >
      {/* Delete button */}
      {(hovered || selected) && !editing && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.() }}
          className="absolute -top-8 -right-1 p-1 rounded-md bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:text-error cursor-pointer transition-colors"
        >
          <Trash2 size={12} />
        </button>
      )}

      {editing ? (
        <textarea
          ref={textareaRef}
          value={text || ''}
          onChange={(e) => onTextChange?.(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none resize-none text-copy w-full"
          style={{
            fontSize,
            fontFamily: 'inherit',
            lineHeight: 1.4,
            minWidth: 120,
            minHeight: 32,
            caretColor: 'var(--color-primary)',
          }}
          rows={1}
          // Auto-resize
          onInput={(e) => {
            e.target.style.height = 'auto'
            e.target.style.height = e.target.scrollHeight + 'px'
          }}
        />
      ) : (
        <div
          className="text-copy cursor-text whitespace-pre-wrap"
          style={{ fontSize, lineHeight: 1.4, minWidth: 60 }}
        >
          {text || 'Double-click to edit'}
        </div>
      )}
    </div>
  )
}
