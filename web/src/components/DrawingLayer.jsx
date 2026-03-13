import { useState, useCallback, useRef } from 'react'
import { useReactFlow, useViewport } from '@xyflow/react'

function simplifyPath(points, tolerance = 1.5) {
  if (points.length < 3) return points
  const result = [points[0]]
  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1]
    const dx = points[i].x - prev.x
    const dy = points[i].y - prev.y
    if (Math.sqrt(dx * dx + dy * dy) > tolerance) {
      result.push(points[i])
    }
  }
  result.push(points[points.length - 1])
  return result
}

function pointsToPath(points) {
  if (points.length < 2) return ''
  const simplified = simplifyPath(points)
  let d = `M ${simplified[0].x} ${simplified[0].y}`
  for (let i = 1; i < simplified.length - 1; i++) {
    const cx = (simplified[i].x + simplified[i + 1].x) / 2
    const cy = (simplified[i].y + simplified[i + 1].y) / 2
    d += ` Q ${simplified[i].x} ${simplified[i].y} ${cx} ${cy}`
  }
  const last = simplified[simplified.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}

export default function DrawingLayer({ strokes, onStrokeAdd, color = '#ffffff', strokeWidth = 2, active }) {
  const [currentPoints, setCurrentPoints] = useState([])
  const isDrawing = useRef(false)
  const { screenToFlowPosition } = useReactFlow()
  const { x: vx, y: vy, zoom } = useViewport()

  const toFlowCoords = useCallback((e) => {
    return screenToFlowPosition({ x: e.clientX, y: e.clientY })
  }, [screenToFlowPosition])

  const handlePointerDown = useCallback((e) => {
    if (!active) return
    e.stopPropagation()
    e.preventDefault()
    isDrawing.current = true
    const pt = toFlowCoords(e)
    setCurrentPoints([pt])
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [active, toFlowCoords])

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing.current) return
    e.stopPropagation()
    const pt = toFlowCoords(e)
    setCurrentPoints((prev) => [...prev, pt])
  }, [toFlowCoords])

  const handlePointerUp = useCallback((e) => {
    if (!isDrawing.current) return
    isDrawing.current = false
    if (currentPoints.length > 1) {
      onStrokeAdd?.({ points: currentPoints, color, strokeWidth })
    }
    setCurrentPoints([])
  }, [currentPoints, color, strokeWidth, onStrokeAdd])

  return (
    <svg
      className="react-flow__drawing-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: active ? 'all' : 'none',
        cursor: active ? 'crosshair' : 'default',
        zIndex: active ? 5 : 0,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <g transform={`translate(${vx}, ${vy}) scale(${zoom})`}>
        {/* Completed strokes */}
        {strokes.map((stroke, i) => (
          <path
            key={i}
            d={pointsToPath(stroke.points)}
            fill="none"
            stroke={stroke.color}
            strokeWidth={stroke.strokeWidth / zoom}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {/* Current stroke being drawn */}
        {currentPoints.length > 1 && (
          <path
            d={pointsToPath(currentPoints)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth / zoom}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </g>
    </svg>
  )
}
