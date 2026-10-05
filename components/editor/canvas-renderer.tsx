'use client'

import React, { useRef, useState } from 'react'
import { DesignData, DesignElement, TextElement } from '@/types/domain'

interface CanvasRendererProps {
  design: DesignData
  selectedElementId: string | null
  zoom: number
  onSelectElement?: (id: string | null) => void
  onUpdateElementPosition?: (id: string, x: number, y: number) => void
  isInteractive?: boolean
}

export function CanvasRenderer({
  design,
  selectedElementId,
  zoom,
  onSelectElement,
  onUpdateElementPosition,
  isInteractive = true,
}: CanvasRendererProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number; elX: number; elY: number } | null>(null)

  const { width, height } = design.canvas

  const handleMouseDown = (e: React.MouseEvent, el: DesignElement) => {
    if (!isInteractive || el.permissions.locked || !el.permissions.movable) return
    e.stopPropagation()
    onSelectElement?.(el.id)
    setDraggingId(el.id)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elX: el.x,
      elY: el.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !dragStart || !onUpdateElementPosition) return
    const dx = (e.clientX - dragStart.x) / zoom
    const dy = (e.clientY - dragStart.y) / zoom
    const newX = Math.round(dragStart.elX + dx)
    const newY = Math.round(dragStart.elY + dy)
    onUpdateElementPosition(draggingId, newX, newY)
  }

  const handleMouseUp = () => {
    setDraggingId(null)
    setDragStart(null)
  }

  const sortedElements = [...design.elements].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <div
      ref={canvasRef}
      className="relative select-none shadow-2xl transition-transform origin-center"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: design.background.color || '#ffffff',
        transform: `scale(${zoom})`,
      }}
      onClick={() => onSelectElement?.(null)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Bleed & Safe Margin Guides (Visual print cues) */}
      <div
        className="absolute inset-0 pointer-events-none border border-dashed border-red-300/40"
        title="Print Bleed Area"
      />
      <div
        className="absolute pointer-events-none border border-emerald-400/20"
        style={{
          inset: '16px',
        }}
        title="Safe Design Margin"
      />

      {/* Render Design Elements */}
      {sortedElements.map((el) => {
        if (!el.permissions.visible) return null
        const isSelected = selectedElementId === el.id

        return (
          <div
            key={el.id}
            onClick={(e) => {
              e.stopPropagation()
              onSelectElement?.(el.id)
            }}
            onMouseDown={(e) => handleMouseDown(e, el)}
            className={`absolute transition-shadow ${
              el.permissions.movable && !el.permissions.locked && isInteractive
                ? 'cursor-move'
                : 'cursor-pointer'
            } ${isSelected ? 'ring-2 ring-[#e26f5b] ring-offset-1' : ''}`}
            style={{
              left: `${el.x}px`,
              top: `${el.y}px`,
              width: `${el.width}px`,
              height: `${el.height}px`,
              opacity: el.opacity ?? 1,
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              zIndex: el.zIndex,
            }}
          >
            {/* Shape Element */}
            {el.type === 'shape' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: el.fill,
                  border: el.stroke ? `${el.strokeWidth || 1}px solid ${el.stroke}` : undefined,
                  borderRadius: el.shapeType === 'circle' ? '50%' : '0px',
                }}
              />
            )}

            {/* Text Element */}
            {el.type === 'text' && (
              <div
                style={{
                  fontFamily: (el as TextElement).fontFamily || 'Inter, sans-serif',
                  fontSize: `${(el as TextElement).fontSize}px`,
                  fontWeight: (el as TextElement).fontWeight || 400,
                  color: (el as TextElement).fill || '#000000',
                  textAlign: (el as TextElement).textAlign || 'left',
                  lineHeight: (el as TextElement).lineHeight || 1.3,
                  letterSpacing: (el as TextElement).letterSpacing ? `${(el as TextElement).letterSpacing}px` : undefined,
                  whiteSpace: 'pre-wrap',
                  userSelect: 'none',
                  width: '100%',
                  height: '100%',
                }}
              >
                {(el as TextElement).text}
              </div>
            )}

            {/* Image / Logo Element */}
            {(el.type === 'image' || el.type === 'logo') && (
              <img
                src={el.src}
                alt={el.name}
                className="w-full h-full object-contain pointer-events-none"
              />
            )}

            {/* Selection Handles indicator */}
            {isSelected && (
              <>
                <span className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-[#e26f5b] rounded-sm shadow-xs" />
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-[#e26f5b] rounded-sm shadow-xs" />
                <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-[#e26f5b] rounded-sm shadow-xs" />
                <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-[#e26f5b] rounded-sm shadow-xs" />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
