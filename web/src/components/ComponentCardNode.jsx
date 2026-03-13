import { useState } from 'react'
import { Trash2, ExternalLink, GripVertical } from 'lucide-react'
import ComponentPreview from './ComponentPreview'

export default function ComponentCardNode({ data, dragging }) {
  const { component, pack, onDelete, width } = data
  const [hovered, setHovered] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function handleDelete(e) {
    e.stopPropagation()
    setDeleting(true)
    setTimeout(() => onDelete(), 350)
  }

  const toolbarW = 40

  return (
    <div
      className={deleting ? 'card-deleting' : ''}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        marginLeft: -(toolbarW + 8),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left toolbar — outside the card */}
      <div
        className={`flex flex-col gap-1.5 shrink-0 transition-opacity duration-150 ${hovered || dragging ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ width: toolbarW }}
      >
        <div
            className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 transition-colors flex items-center justify-center drag-handle"
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
          >
            <GripVertical size={14} className="text-white/80" />
          </div>
        {component.sourceUrl && (
          <a
            href={component.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white transition-colors flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} />
          </a>
        )}
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:text-error cursor-pointer transition-colors flex items-center justify-center"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Card */}
      <div
        className={`min-w-0 rounded-2xl overflow-hidden border bg-foreground transition-all duration-200 ${dragging
          ? 'border-primary/50 shadow-2xl shadow-primary/10 scale-[1.02]'
          : 'border-border shadow-lg shadow-black/20 hover:border-copy-lighter/30 hover:shadow-xl hover:shadow-black/30'
          }`}
        style={{ width }}
      >
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ pointerEvents: dragging ? 'none' : 'auto' }}
        >
          <ComponentPreview
            html={component.html}
            background={component.background}
            capturedWidth={component.capturedWidth}
            minHeight={0}
          />
        </div>
      </div>
    </div>
  )
}
