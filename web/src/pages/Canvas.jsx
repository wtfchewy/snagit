import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { MousePointerClick, PackagePlus, Chrome, ExternalLink } from 'lucide-react'
import { ReactFlow, Background, Controls, applyNodeChanges, useReactFlow, ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../contexts/AuthContext'
import { getAllComponents, getPacks, deleteComponent } from '../store'
import ComponentCardNode from '../components/ComponentCardNode'
import TextNode from '../components/TextNode'
import StickyNoteNode from '../components/StickyNoteNode'
import DrawingLayer from '../components/DrawingLayer'
import CanvasToolbar from '../components/CanvasToolbar'

const GAP = 32
const FALLBACK_W = 360
const FALLBACK_H = 240
const PREVIEW_PAD = 48

const nodeTypes = {
  componentCard: ComponentCardNode,
  text: TextNode,
  stickyNote: StickyNoteNode,
}

function layoutCards(components, maxRowWidth) {
  const positions = []
  let x = GAP
  let y = GAP
  let rowHeight = 0

  for (const comp of components) {
    const w = comp.capturedWidth || FALLBACK_W
    const iframeW = w + PREVIEW_PAD
    const scale = Math.min(w / iframeW, 1)
    const h = ((comp.capturedHeight || FALLBACK_H) + PREVIEW_PAD) * scale

    if (x + w > maxRowWidth && x > GAP) {
      x = GAP
      y += rowHeight + GAP
      rowHeight = 0
    }

    positions.push({ id: comp.id, x, y, w, h })
    rowHeight = Math.max(rowHeight, h)
    x += w + GAP
  }

  return positions
}

function CanvasInner({ filterPack, filterSite }) {
  const { user } = useAuth()
  const { screenToFlowPosition } = useReactFlow()
  const [components, setComponents] = useState([])
  const [packs, setPacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [nodes, setNodes] = useState([])
  const [whiteboardNodes, setWhiteboardNodes] = useState([])
  const [strokes, setStrokes] = useState([])
  const [activeTool, setActiveTool] = useState('select')
  const [drawColor, setDrawColor] = useState('#ffffff')
  const draggedNodeIds = useRef(new Set())

  async function load() {
    const [c, p] = await Promise.all([
      getAllComponents(user.uid),
      getPacks(user.uid),
    ])
    setComponents(c)
    setPacks(p)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [user])

  const packMap = useMemo(() => {
    const m = {}
    packs.forEach((p) => { m[p.id] = p })
    return m
  }, [packs])

  const filtered = useMemo(() => components.filter((comp) => {
    if (filterPack && comp.packId !== filterPack) return false
    if (filterSite) {
      try {
        const host = new URL(comp.sourceUrl || '').hostname
        if (host !== filterSite) return false
      } catch {
        return false
      }
    }
    return true
  }), [components, filterPack, filterSite])

  const handleDelete = useCallback(async (compId) => {
    await deleteComponent(user.uid, compId)
    draggedNodeIds.current.delete(compId)
    load()
  }, [user])

  // Build component card nodes
  useEffect(() => {
    const basePositions = layoutCards(filtered, Math.max(window.innerWidth * 3, 4000))

    setNodes((prevNodes) => {
      const prevMap = {}
      prevNodes.forEach((n) => { prevMap[n.id] = n })

      return filtered.map((comp, i) => {
        const base = basePositions[i]
        const wasDragged = draggedNodeIds.current.has(comp.id)
        const prev = prevMap[comp.id]

        const position = wasDragged && prev
          ? prev.position
          : { x: base.x, y: base.y }

        return {
          id: comp.id,
          type: 'componentCard',
          position,
          data: {
            component: comp,
            pack: packMap[comp.packId],
            onDelete: () => handleDelete(comp.id),
            width: base.w,
          },
          dragHandle: '.drag-handle',
          style: { width: base.w + 48 + 8 },
        }
      })
    })
  }, [filtered, packMap, handleDelete])

  // Whiteboard node helpers
  const deleteWhiteboardNode = useCallback((nodeId) => {
    setWhiteboardNodes((prev) => prev.filter((n) => n.id !== nodeId))
  }, [])

  const updateWhiteboardNodeData = useCallback((nodeId, updates) => {
    setWhiteboardNodes((prev) =>
      prev.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n)
    )
  }, [])

  const addTextNode = useCallback((position) => {
    const id = `text-${uuidv4()}`
    setWhiteboardNodes((prev) => [...prev, {
      id,
      type: 'text',
      position,
      data: {
        text: '',
        fontSize: 16,
        onTextChange: (text) => updateWhiteboardNodeData(id, { text }),
        onDelete: () => deleteWhiteboardNode(id),
      },
    }])
  }, [updateWhiteboardNodeData, deleteWhiteboardNode])

  const addStickyNote = useCallback((position) => {
    const id = `sticky-${uuidv4()}`
    setWhiteboardNodes((prev) => [...prev, {
      id,
      type: 'stickyNote',
      position,
      data: {
        text: '',
        colorIndex: 0,
        onTextChange: (text) => updateWhiteboardNodeData(id, { text }),
        onColorChange: (colorIndex) => updateWhiteboardNodeData(id, { colorIndex }),
        onDelete: () => deleteWhiteboardNode(id),
      },
    }])
  }, [updateWhiteboardNodeData, deleteWhiteboardNode])

  // Click on canvas to place text/sticky
  const onPaneClick = useCallback((e) => {
    if (activeTool === 'text') {
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addTextNode(position)
      setActiveTool('select')
    } else if (activeTool === 'sticky') {
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addStickyNote(position)
      setActiveTool('select')
    }
  }, [activeTool, screenToFlowPosition, addTextNode, addStickyNote])

  // Combined nodes
  const allNodes = useMemo(() => [...nodes, ...whiteboardNodes], [nodes, whiteboardNodes])

  const onNodesChange = useCallback((changes) => {
    const componentIds = new Set(nodes.map((n) => n.id))
    const componentChanges = []
    const whiteboardChanges = []

    for (const c of changes) {
      if (c.type === 'position' && c.dragging) {
        draggedNodeIds.current.add(c.id)
      }
      if (componentIds.has(c.id)) {
        componentChanges.push(c)
      } else {
        whiteboardChanges.push(c)
      }
    }

    if (componentChanges.length) {
      setNodes((nds) => applyNodeChanges(componentChanges, nds))
    }
    if (whiteboardChanges.length) {
      setWhiteboardNodes((nds) => applyNodeChanges(whiteboardChanges, nds))
    }
  }, [nodes])

  const handleStrokeAdd = useCallback((stroke) => {
    setStrokes((prev) => [...prev, stroke])
  }, [])

  const handleUndoStroke = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1))
  }, [])

  const handleClearStrokes = useCallback(() => {
    setStrokes([])
  }, [])

  // Keyboard shortcut: Escape → select, V → select, T → text, S → sticky, D → draw
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't intercept when typing in an input
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable) return
      switch (e.key.toLowerCase()) {
        case 'escape':
        case 'v': setActiveTool('select'); break
        case 't': setActiveTool('text'); break
        case 's': if (!e.metaKey && !e.ctrlKey) setActiveTool('sticky'); break
        case 'd': setActiveTool('draw'); break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const toolClass = activeTool !== 'select' ? `canvas-tool-${activeTool}` : ''

  return (
    <div className={`fixed inset-0 ${toolClass}`}>
      <ReactFlow
        nodes={allNodes}
        edges={[]}
        onNodesChange={onNodesChange}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        panOnDrag={activeTool !== 'draw'}
        zoomOnScroll={activeTool !== 'draw'}
        panOnScroll={activeTool !== 'draw'}
        nodesDraggable={activeTool === 'select'}
        nodesConnectable={false}
        elementsSelectable={activeTool === 'select'}
      >
        <Background variant="dots" gap={32} size={1} color="var(--color-border)" />
        <Controls showInteractive={false} />
        <DrawingLayer
          strokes={strokes}
          onStrokeAdd={handleStrokeAdd}
          color={drawColor}
          strokeWidth={2}
          active={activeTool === 'draw'}
        />
      </ReactFlow>

      <CanvasToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        drawColor={drawColor}
        onDrawColorChange={setDrawColor}
        onUndoStroke={handleUndoStroke}
        onClearStrokes={handleClearStrokes}
        hasStrokes={strokes.length > 0}
      />

      {/* Empty state overlay */}
      {filtered.length === 0 && whiteboardNodes.length === 0 && !loading && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center text-center fade-in-up pointer-events-auto" style={{ width: 360 }}>
            <img src="/logo.svg" alt="" className="h-15 drop-shadow-lg mb-4" />
            <p className="text-copy-lighter text-[13px] mb-8">
              {filterPack || filterSite
                ? 'No components match this filter'
                : 'Get started in 3 easy steps'}
            </p>

            {!filterPack && !filterSite && (
              <div className="w-full flex flex-col gap-3 text-left">
                <a
                  href="https://chromewebstore.google.com/detail/backpack/epeogfhiemohndkcagldkgechfjfbfhj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 rounded-xl bg-primary hover:bg-primary/80 transition-colors no-underline group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-content/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Chrome size={18} className="text-primary-content" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-primary-content">Install the Chrome Extension</p>
                      <ExternalLink size={11} className="text-primary-content opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[11px] text-primary-content mt-0.5 leading-relaxed">
                      Add Snagit to Chrome from the Web Store
                    </p>
                  </div>
                </a>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-foreground/80 border border-border">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <PackagePlus size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-copy">Create a Pack</p>
                    <p className="text-[11px] text-copy-lighter mt-0.5 leading-relaxed">
                      Open the extension and create a pack to organize your components
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-foreground/80 border border-border">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MousePointerClick size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-copy">Pick Components</p>
                    <p className="text-[11px] text-copy-lighter mt-0.5 leading-relaxed">
                      Click "Pick Component" on any website and select elements to save
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Canvas({ filterPack, filterSite }) {
  return (
    <ReactFlowProvider>
      <CanvasInner filterPack={filterPack} filterSite={filterSite} />
    </ReactFlowProvider>
  )
}
