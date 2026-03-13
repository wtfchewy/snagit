import { MousePointer2, Type, StickyNote, Pencil, Undo2, Trash2 } from 'lucide-react'

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'sticky', icon: StickyNote, label: 'Sticky Note' },
  { id: 'draw', icon: Pencil, label: 'Draw' },
]

const drawColors = ['#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7']

export default function CanvasToolbar({ activeTool, onToolChange, drawColor, onDrawColorChange, onUndoStroke, onClearStrokes, hasStrokes }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="flex items-center gap-1 bg-foreground/90 backdrop-blur-md px-2 py-1.5 rounded-xl border border-border shadow-lg shadow-black/30 pointer-events-auto">
        {tools.map((tool) => {
          const Icon = tool.icon
          const isActive = activeTool === tool.id
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              title={tool.label}
              className={`p-2 rounded-lg cursor-pointer border-none transition-all ${
                isActive
                  ? 'bg-primary text-primary-content'
                  : 'bg-transparent text-copy-lighter hover:text-copy hover:bg-background'
              }`}
            >
              <Icon size={18} />
            </button>
          )
        })}

        {/* Draw color picker — visible when draw tool active */}
        {activeTool === 'draw' && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            {drawColors.map((c) => (
              <button
                key={c}
                onClick={() => onDrawColorChange(c)}
                className="p-1 rounded-md cursor-pointer border-none bg-transparent transition-transform"
                style={{ transform: drawColor === c ? 'scale(1.3)' : 'scale(1)' }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor: c,
                    borderColor: drawColor === c ? 'var(--color-copy)' : 'transparent',
                  }}
                />
              </button>
            ))}
            <div className="w-px h-6 bg-border mx-1" />
            <button
              onClick={onUndoStroke}
              disabled={!hasStrokes}
              title="Undo last stroke"
              className="p-2 rounded-lg cursor-pointer border-none bg-transparent text-copy-lighter hover:text-copy hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={onClearStrokes}
              disabled={!hasStrokes}
              title="Clear all drawings"
              className="p-2 rounded-lg cursor-pointer border-none bg-transparent text-copy-lighter hover:text-error hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
