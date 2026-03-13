import { useRef, useState, useEffect, useCallback } from 'react'
import { MousePointer2, Type, StickyNote, Pencil, Undo2, Trash2 } from 'lucide-react'

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'sticky', icon: StickyNote, label: 'Sticky Note' },
  { id: 'draw', icon: Pencil, label: 'Draw' },
]

const drawColors = ['#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7']

export default function CanvasToolbar({ activeTool, onToolChange, drawColor, onDrawColorChange, onUndoStroke, onClearStrokes, hasStrokes }) {
  const toolsRef = useRef(null)
  const [sliderStyle, setSliderStyle] = useState({ opacity: 0 })
  const [hoveredTool, setHoveredTool] = useState(null)

  const moveSlider = useCallback((el) => {
    if (!el || !toolsRef.current) {
      setSliderStyle((s) => ({ ...s, opacity: 0 }))
      return
    }
    const container = toolsRef.current.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    setSliderStyle({
      top: rect.top - container.top,
      left: rect.left - container.left,
      width: rect.width,
      height: rect.height,
      opacity: 1,
    })
  }, [])

  useEffect(() => {
    if (!toolsRef.current) return
    const active = toolsRef.current.querySelector('[data-tool-active="true"]')
    moveSlider(active)
  }, [activeTool, moveSlider])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="flex items-center gap-1 bg-foreground/90 backdrop-blur-md px-2 py-1.5 rounded-xl border border-border shadow-lg shadow-black/30 pointer-events-auto">
        <div className="relative flex items-center" ref={toolsRef}>
          <div
            className="absolute rounded-lg bg-primary pointer-events-none transition-all duration-200 ease-out"
            style={sliderStyle}
          />
          {tools.map((tool) => {
            const Icon = tool.icon
            const isActive = activeTool === tool.id
            const isHovered = hoveredTool === tool.id
            return (
              <button
                key={tool.id}
                data-tool-active={isActive}
                onClick={() => onToolChange(tool.id)}
                onMouseEnter={(e) => {
                  setHoveredTool(tool.id)
                  moveSlider(e.currentTarget)
                }}
                onMouseLeave={() => {
                  setHoveredTool(null)
                  const active = toolsRef.current?.querySelector('[data-tool-active="true"]')
                  moveSlider(active)
                }}
                title={tool.label}
                className={`relative p-2 rounded-lg cursor-pointer border-none bg-transparent transition-colors duration-200 ${
                  isHovered || (isActive && !hoveredTool)
                    ? 'text-primary-content'
                    : 'text-copy-lighter'
                }`}
              >
                <Icon size={18} />
              </button>
            )
          })}
        </div>

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
