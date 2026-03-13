import { useState, useRef, useEffect } from 'react'
import { Trash2 } from 'lucide-react'

const STICKY_COLORS = [
  { bg: '#fef08a', text: '#713f12' }, // yellow
  { bg: '#bbf7d0', text: '#14532d' }, // green
  { bg: '#bfdbfe', text: '#1e3a5f' }, // blue
  { bg: '#fecdd3', text: '#881337' }, // pink
  { bg: '#e9d5ff', text: '#581c87' }, // purple
  { bg: '#fed7aa', text: '#7c2d12' }, // orange
]

export default function StickyNoteNode({ data, selected }) {
  const { text, colorIndex = 0, onTextChange, onColorChange, onDelete } = data
  const [editing, setEditing] = useState(!text)
  const [hovered, setHovered] = useState(false)
  const textareaRef = useRef(null)
  const color = STICKY_COLORS[colorIndex % STICKY_COLORS.length]

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      if (!text) textareaRef.current.select()
    }
  }, [editing])

  function handleBlur() {
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') setEditing(false)
  }

  function cycleColor(e) {
    e.stopPropagation()
    onColorChange?.((colorIndex + 1) % STICKY_COLORS.length)
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Toolbar */}
      {(hovered || selected) && !editing && (
        <div className="absolute -top-9 left-0 flex gap-1">
          <button
            onClick={cycleColor}
            className="p-1 rounded-md bg-black/40 backdrop-blur-sm border border-white/10 cursor-pointer transition-colors"
          >
            <div className="w-3 h-3 rounded-full" style={{ background: STICKY_COLORS[(colorIndex + 1) % STICKY_COLORS.length].bg }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.() }}
            className="p-1 rounded-md bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:text-error cursor-pointer transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      <div
        className="rounded-lg shadow-md cursor-grab"
        style={{
          width: 200,
          minHeight: 160,
          backgroundColor: color.bg,
          padding: 16,
        }}
        onDoubleClick={() => setEditing(true)}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            value={text || ''}
            onChange={(e) => onTextChange?.(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none resize-none w-full h-full"
            style={{
              color: color.text,
              fontSize: 14,
              fontFamily: 'inherit',
              lineHeight: 1.5,
              minHeight: 128,
            }}
            placeholder="Type here..."
          />
        ) : (
          <div
            className="whitespace-pre-wrap cursor-text"
            style={{
              color: color.text,
              fontSize: 14,
              lineHeight: 1.5,
              minHeight: 128,
            }}
          >
            {text || 'Double-click to edit'}
          </div>
        )}
      </div>
    </div>
  )
}
