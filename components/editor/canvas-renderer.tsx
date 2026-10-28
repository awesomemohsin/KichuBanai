'use client'

import React, { useRef, useState, useEffect } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  Edit3,
  ImageIcon,
  Italic,
  Layers,
  Minus,
  Plus,
  Trash2,
  Unlink,
  Upload,
} from 'lucide-react'
import { DesignData, DesignElement, TextElement, SvgElement } from '@/types/domain'
import { FontPicker } from './font-picker'
import { renderFormattedRichText, toggleTextBold, toggleTextItalic } from '@/lib/editor/editor-utils'

type ResizeHandle = 'nw' | 'ne' | 'se' | 'sw' | 'e' | 'w' | 'n' | 's'

interface CanvasRendererProps {
  design: DesignData
  selectedElementId: string | null
  zoom: number
  onSelectElement?: (id: string | null) => void
  onUpdateElementPosition?: (id: string, x: number, y: number) => void
  onUpdateElement?: (id: string, updates: Partial<DesignElement>) => void
  onUpdateMultiplePositions?: (updates: { id: string; x: number; y: number }[]) => void
  onDuplicateElement?: (id: string) => void
  onDeleteElement?: (id: string) => void
  onToggleGroup?: (id: string) => void
  onReplaceImage?: (id: string, file: File) => void
  isInteractive?: boolean
}

interface DragState {
  id: string
  startX: number
  startY: number
  elX: number
  elY: number
  groupPositions?: { id: string; startX: number; startY: number }[]
}

interface ResizeState {
  id: string
  handle: ResizeHandle
  startX: number
  startY: number
  initialX: number
  initialY: number
  initialWidth: number
  initialHeight: number
  initialFontSize: number
  isText: boolean
}

export function CanvasRenderer({
  design,
  selectedElementId,
  zoom,
  onSelectElement,
  onUpdateElementPosition,
  onUpdateElement,
  onUpdateMultiplePositions,
  onDuplicateElement,
  onDeleteElement,
  onToggleGroup,
  onReplaceImage,
  isInteractive = true,
}: CanvasRendererProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const imageFileInputRef = useRef<HTMLInputElement>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [inlineTextValue, setInlineTextValue] = useState<string>('')
  const [previewFont, setPreviewFont] = useState<string | null>(null)
  const inlineTextareaRef = useRef<HTMLTextAreaElement>(null)

  const { width, height } = design.canvas

  // When entering inline text editing, focus and select textarea without jumping/scrolling
  useEffect(() => {
    if (editingTextId && inlineTextareaRef.current) {
      inlineTextareaRef.current.focus({ preventScroll: true })
      // Put cursor at end of text
      const len = inlineTextareaRef.current.value.length
      inlineTextareaRef.current.setSelectionRange(len, len)
    }
  }, [editingTextId])

  // Keep inlineTextValue in sync if updated from external controls (top bar / side inspector)
  useEffect(() => {
    if (editingTextId) {
      const el = design.elements.find((item) => item.id === editingTextId) as TextElement | undefined
      if (el && el.text !== inlineTextValue) {
        setInlineTextValue(el.text)
      }
    }
  }, [design.elements, editingTextId])

  // Global mouse move & up listeners for smooth drag & resize across the window
  useEffect(() => {
    if (!dragState && !resizeState) return

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (dragState) {
        const dx = (e.clientX - dragState.startX) / zoom
        const dy = (e.clientY - dragState.startY) / zoom

        // Move entire group together if element belongs to a group
        if (dragState.groupPositions && dragState.groupPositions.length > 1 && onUpdateMultiplePositions) {
          const updates = dragState.groupPositions.map((item) => ({
            id: item.id,
            x: Math.round(item.startX + dx),
            y: Math.round(item.startY + dy),
          }))
          onUpdateMultiplePositions(updates)
        } else {
          const newX = Math.round(dragState.elX + dx)
          const newY = Math.round(dragState.elY + dy)
          if (onUpdateElementPosition) {
            onUpdateElementPosition(dragState.id, newX, newY)
          } else if (onUpdateElement) {
            onUpdateElement(dragState.id, { x: newX, y: newY })
          }
        }
      } else if (resizeState && onUpdateElement) {
        const dx = (e.clientX - resizeState.startX) / zoom
        const dy = (e.clientY - resizeState.startY) / zoom
        const { handle, initialX, initialY, initialWidth, initialHeight, initialFontSize, isText } = resizeState

        let newX = initialX
        let newY = initialY
        let newWidth = initialWidth
        let newHeight = initialHeight
        let newFontSize = initialFontSize

        if (handle === 'e') {
          newWidth = Math.max(30, Math.round(initialWidth + dx))
        } else if (handle === 'w') {
          newWidth = Math.max(30, Math.round(initialWidth - dx))
          newX = Math.round(initialX + (initialWidth - newWidth))
        } else if (handle === 's') {
          newHeight = Math.max(20, Math.round(initialHeight + dy))
        } else if (handle === 'n') {
          newHeight = Math.max(20, Math.round(initialHeight - dy))
          newY = Math.round(initialY + (initialHeight - newHeight))
        } else if (handle === 'se') {
          newWidth = Math.max(30, Math.round(initialWidth + dx))
          newHeight = Math.max(20, Math.round(initialHeight + dy))
          if (isText && initialWidth > 0) {
            const ratio = newWidth / initialWidth
            newFontSize = Math.max(8, Math.min(240, Math.round(initialFontSize * ratio)))
            newHeight = Math.max(20, Math.round(initialHeight * ratio))
          }
        } else if (handle === 'sw') {
          newWidth = Math.max(30, Math.round(initialWidth - dx))
          newX = Math.round(initialX + (initialWidth - newWidth))
          newHeight = Math.max(20, Math.round(initialHeight + dy))
          if (isText && initialWidth > 0) {
            const ratio = newWidth / initialWidth
            newFontSize = Math.max(8, Math.min(240, Math.round(initialFontSize * ratio)))
            newHeight = Math.max(20, Math.round(initialHeight * ratio))
          }
        } else if (handle === 'ne') {
          newWidth = Math.max(30, Math.round(initialWidth + dx))
          newHeight = Math.max(20, Math.round(initialHeight - dy))
          newY = Math.round(initialY + (initialHeight - newHeight))
          if (isText && initialWidth > 0) {
            const ratio = newWidth / initialWidth
            newFontSize = Math.max(8, Math.min(240, Math.round(initialFontSize * ratio)))
            newHeight = Math.max(20, Math.round(initialHeight * ratio))
          }
        } else if (handle === 'nw') {
          newWidth = Math.max(30, Math.round(initialWidth - dx))
          newX = Math.round(initialX + (initialWidth - newWidth))
          newHeight = Math.max(20, Math.round(initialHeight - dy))
          newY = Math.round(initialY + (initialHeight - newHeight))
          if (isText && initialWidth > 0) {
            const ratio = newWidth / initialWidth
            newFontSize = Math.max(8, Math.min(240, Math.round(initialFontSize * ratio)))
            newHeight = Math.max(20, Math.round(initialHeight * ratio))
          }
        }

        const updates: Partial<DesignElement> = {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        }
        if (isText) {
          ;(updates as Partial<TextElement>).fontSize = newFontSize
        }
        onUpdateElement(resizeState.id, updates)
      }
    }

    const handleWindowMouseUp = () => {
      setDragState(null)
      setResizeState(null)
    }

    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
    }
  }, [dragState, resizeState, zoom, onUpdateElementPosition, onUpdateElement, onUpdateMultiplePositions])

  // Drag start on element (handles group awareness)
  const handleElementMouseDown = (e: React.MouseEvent, el: DesignElement) => {
    if (!isInteractive || el.permissions.locked || !el.permissions.movable) return
    if (editingTextId === el.id) return // Don't drag while actively typing
    e.stopPropagation()
    onSelectElement?.(el.id)

    const isGrouped = !!el.groupId
    const groupElements = isGrouped
      ? design.elements.filter((item) => item.groupId === el.groupId).map((item) => ({ id: item.id, startX: item.x, startY: item.y }))
      : undefined

    setDragState({
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      elX: el.x,
      elY: el.y,
      groupPositions: groupElements,
    })
  }

  // Resize start on handle
  const handleResizeStart = (e: React.MouseEvent, el: DesignElement, handle: ResizeHandle) => {
    if (!isInteractive || el.permissions.locked || !el.permissions.resizable) return
    e.stopPropagation()
    e.preventDefault()
    setResizeState({
      id: el.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: el.x,
      initialY: el.y,
      initialWidth: el.width,
      initialHeight: el.height,
      initialFontSize: (el as TextElement).fontSize || 24,
      isText: el.type === 'text',
    })
  }

  // Start inline text editing
  const handleStartInlineEdit = (el: TextElement) => {
    if (!isInteractive || el.permissions.locked || !el.permissions.editable) return
    setEditingTextId(el.id)
    setInlineTextValue(el.text)
  }

  // Commit inline text editing
  const handleCommitInlineEdit = () => {
    if (!editingTextId) return
    if (onUpdateElement) {
      onUpdateElement(editingTextId, { text: inlineTextValue } as any)
    }
    setEditingTextId(null)
  }

  // Handle Logo / Image replacement from file picker
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedElementId) return

    if (onReplaceImage) {
      onReplaceImage(selectedElementId, file)
    } else {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        onUpdateElement?.(selectedElementId, {
          src: dataUrl,
          name: file.name.slice(0, 16),
        } as any)
      }
      reader.readAsDataURL(file)
    }
    // Reset file input
    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = ''
    }
  }

  const selectedElement = design.elements.find((el) => el.id === selectedElementId)
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
      onClick={() => {
        if (editingTextId) {
          handleCommitInlineEdit()
        }
        onSelectElement?.(null)
      }}
    >
      {/* Hidden File Input for Logo / Image Replacement */}
      <input
        type="file"
        ref={imageFileInputRef}
        accept="image/*,.svg"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Background Image / Art if specified */}
      {design.background.image && (
        <img
          src={design.background.image}
          alt="Canvas Background"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          style={{ opacity: design.background.opacity ?? 1 }}
        />
      )}

      {/* Bleed & Safe Margin Guides (Visual print cues) */}
      <div
        className="absolute inset-0 pointer-events-none border border-dashed border-red-300/40"
        title="Print Bleed Area"
      />
      <div
        className="absolute pointer-events-none border border-emerald-400/20"
        style={{ inset: '16px' }}
        title="Safe Design Margin"
      />

      {/* Render Design Elements */}
      {sortedElements.map((el) => {
        if (!el.permissions.visible) return null

        // Non-interactive background or locked element
        const isLockedOrBackground =
          el.permissions.locked ||
          !el.permissions.editable ||
          el.id.includes('bg') ||
          el.name.toLowerCase().includes('background') ||
          el.name.toLowerCase().includes('vector curves')

        if (isLockedOrBackground) {
          return (
            <div
              key={el.id}
              className="absolute pointer-events-none select-none"
              style={{
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.width}px`,
                minHeight: `${el.height}px`,
                zIndex: el.zIndex,
                opacity: el.opacity ?? 1,
              }}
            >
              {el.type === 'shape' && (
                <div
                  style={{
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    backgroundColor: el.fill,
                    border: el.stroke ? `${el.strokeWidth || 1}px solid ${el.stroke}` : undefined,
                    borderRadius: el.shapeType === 'circle' ? '50%' : '0px',
                  }}
                />
              )}
              {el.type === 'svg' && (
                <div
                  className="w-full h-full pointer-events-none select-none overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: (el as SvgElement).svgContent }}
                />
              )}
              {(el.type === 'image' || el.type === 'logo') && (
                <img
                  src={el.src}
                  alt={el.name}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              )}
            </div>
          )
        }

        const isSelected = selectedElementId === el.id
        const isEditingThis = editingTextId === el.id
        const isPartOfSelectedGroup =
          selectedElement?.groupId && el.groupId === selectedElement.groupId

        return (
          <div
            key={el.id}
            onClick={(e) => {
              e.stopPropagation()
              onSelectElement?.(el.id)
            }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              if (el.type === 'text') {
                handleStartInlineEdit(el as TextElement)
              } else if (el.type === 'image' || el.type === 'logo') {
                imageFileInputRef.current?.click()
              }
            }}
            onMouseDown={(e) => handleElementMouseDown(e, el)}
            className={`absolute transition-shadow ${
              el.permissions.movable && !el.permissions.locked && isInteractive && !isEditingThis
                ? 'cursor-move'
                : 'cursor-pointer'
            } ${
              isSelected
                ? 'ring-2 ring-[#e26f5b] ring-offset-1'
                : isPartOfSelectedGroup
                ? 'ring-1.5 ring-dashed ring-[#e26f5b]/60'
                : ''
            }`}
            style={{
              left: `${el.x}px`,
              top: `${el.y}px`,
              width: `${el.width}px`,
              minHeight: `${el.height}px`,
              opacity: el.opacity ?? 1,
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              zIndex: isSelected ? 99 : el.zIndex,
              boxSizing: 'border-box',
            }}
          >
            {/* Group Badge Indicator */}
            {el.groupId && isSelected && (
              <span className="absolute -top-5 left-0 text-[9px] bg-[#242322] text-white px-1.5 py-0.5 rounded-sm font-medium flex items-center gap-1 shadow-xs pointer-events-none">
                <Layers className="w-2.5 h-2.5 text-[#e26f5b]" />
                <span>Grouped</span>
              </span>
            )}

            {/* Shape Element */}
            {el.type === 'shape' && (
              <div
                style={{
                  width: '100%',
                  height: `${el.height}px`,
                  backgroundColor: el.fill,
                  border: el.stroke ? `${el.strokeWidth || 1}px solid ${el.stroke}` : undefined,
                  borderRadius: el.shapeType === 'circle' ? '50%' : '0px',
                }}
              />
            )}

            {/* SVG Vector Graphic Element */}
            {el.type === 'svg' && (
              <div
                className="w-full h-full pointer-events-none select-none overflow-hidden"
                dangerouslySetInnerHTML={{ __html: (el as SvgElement).svgContent }}
              />
            )}

            {/* Text Element */}
            {el.type === 'text' && (
              <>
                {isEditingThis ? (
                  /* In-place Direct Typing (Clean & Transparent - No White Popup Box) */
                  <textarea
                    ref={inlineTextareaRef}
                    value={inlineTextValue}
                    onChange={(e) => {
                      const val = e.target.value
                      setInlineTextValue(val)
                      onUpdateElement?.(el.id, { text: val } as any)
                    }}
                    onBlur={handleCommitInlineEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        handleCommitInlineEdit()
                      }
                    }}
                    style={{
                      fontFamily: (isSelected && previewFont) ? previewFont : ((el as TextElement).fontFamily || "'Inter', sans-serif"),
                      fontSize: `${(el as TextElement).fontSize}px`,
                      fontWeight: (el as TextElement).fontWeight || 400,
                      fontStyle: (el as TextElement).fontStyle || 'normal',
                      color: (el as TextElement).fill || '#000000',
                      textAlign: (el as TextElement).textAlign || 'left',
                      lineHeight: (el as TextElement).lineHeight || 1.3,
                      letterSpacing: (el as TextElement).letterSpacing ? `${(el as TextElement).letterSpacing}px` : undefined,
                      width: '100%',
                      minHeight: `${el.height}px`,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      padding: '0px',
                      margin: '0px',
                      boxShadow: 'none',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      boxSizing: 'border-box',
                      caretColor: '#e26f5b',
                    }}
                  />
                ) : (
                  /* Display Text */
                  <div
                    style={{
                      fontFamily: (isSelected && previewFont) ? previewFont : ((el as TextElement).fontFamily || "'Inter', sans-serif"),
                      fontSize: `${(el as TextElement).fontSize}px`,
                      fontWeight: (el as TextElement).fontWeight || 400,
                      fontStyle: (el as TextElement).fontStyle || 'normal',
                      color: (el as TextElement).fill || '#000000',
                      textAlign: (el as TextElement).textAlign || 'left',
                      lineHeight: (el as TextElement).lineHeight || 1.3,
                      letterSpacing: (el as TextElement).letterSpacing ? `${(el as TextElement).letterSpacing}px` : undefined,
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      userSelect: 'text',
                      width: '100%',
                      minHeight: `${el.height}px`,
                      boxSizing: 'border-box',
                    }}
                  >
                    {renderFormattedRichText(
                      (el as TextElement).text,
                      (el as TextElement).fontWeight,
                      (el as TextElement).fontStyle
                    )}
                  </div>
                )}
              </>
            )}

            {/* Image / Logo Element */}
            {(el.type === 'image' || el.type === 'logo') && (
              <div className="relative w-full h-full">
                <img
                  src={el.src}
                  alt={el.name}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              </div>
            )}

            {/* Interactive Resize Handles when selected */}
            {isSelected && !isEditingThis && el.permissions.resizable && !el.permissions.locked && (
              <>
                {/* 4 Corner Handles for Proportional Sizing */}
                <div
                  onMouseDown={(e) => handleResizeStart(e, el, 'nw')}
                  className="absolute -top-2 -left-2 w-3.5 h-3.5 bg-white border-2 border-[#e26f5b] rounded-xs shadow-sm cursor-nwse-resize hover:scale-125 transition-transform z-20"
                  title="Drag to resize size"
                />
                <div
                  onMouseDown={(e) => handleResizeStart(e, el, 'ne')}
                  className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-white border-2 border-[#e26f5b] rounded-xs shadow-sm cursor-nesw-resize hover:scale-125 transition-transform z-20"
                  title="Drag to resize size"
                />
                <div
                  onMouseDown={(e) => handleResizeStart(e, el, 'sw')}
                  className="absolute -bottom-2 -left-2 w-3.5 h-3.5 bg-white border-2 border-[#e26f5b] rounded-xs shadow-sm cursor-nesw-resize hover:scale-125 transition-transform z-20"
                  title="Drag to resize size"
                />
                <div
                  onMouseDown={(e) => handleResizeStart(e, el, 'se')}
                  className="absolute -bottom-2 -right-2 w-3.5 h-3.5 bg-white border-2 border-[#e26f5b] rounded-xs shadow-sm cursor-nwse-resize hover:scale-125 transition-transform z-20"
                  title="Drag to resize size"
                />

                {/* 2 Edge Handles for Width Control & Wrapping */}
                <div
                  onMouseDown={(e) => handleResizeStart(e, el, 'w')}
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-5 bg-white border border-[#e26f5b] rounded-xs shadow-xs cursor-ew-resize hover:scale-115 transition-transform z-20"
                  title="Adjust width"
                />
                <div
                  onMouseDown={(e) => handleResizeStart(e, el, 'e')}
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-5 bg-white border border-[#e26f5b] rounded-xs shadow-xs cursor-ew-resize hover:scale-115 transition-transform z-20"
                  title="Adjust width"
                />
              </>
            )}
          </div>
        )
      })}

      {/* Canva-style Contextual Toolbar for Selected Element - Stays visible always */}
      {selectedElement && isInteractive && (!selectedElement.permissions.locked || selectedElement.permissions.editable) && (
        <div
          className="absolute flex items-center gap-1.5 text-white p-1 px-2 rounded-lg shadow-2xl text-xs border border-white/10 select-none duration-75"
          style={{
            left: `${Math.max(10, Math.min(width - 340, selectedElement.x))}px`,
            top: `${selectedElement.y > 52 ? selectedElement.y - 48 : selectedElement.y + selectedElement.height + 12}px`,
            backgroundColor: '#242322',
            opacity: 1,
            zIndex: 9999,
          }}
          onMouseDown={(e) => {
            // Prevent mousedown from stealing focus or dropping text selection
            e.stopPropagation()
            e.preventDefault()
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* TEXT CONTROLS */}
          {selectedElement.type === 'text' && (
            <>
              {/* Inline Edit Trigger */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={() => {
                  if (editingTextId === selectedElement.id) {
                    handleCommitInlineEdit()
                  } else {
                    handleStartInlineEdit(selectedElement as TextElement)
                  }
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded font-medium text-[11px] cursor-pointer transition-colors ${
                  editingTextId === selectedElement.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#e26f5b] hover:bg-[#b84d3b] text-white'
                }`}
                title={editingTextId === selectedElement.id ? 'Done typing' : 'Click to type directly'}
              >
                <Edit3 className="w-3 h-3" />
                <span>{editingTextId === selectedElement.id ? 'Done' : 'Type'}</span>
              </button>

              <span className="w-px h-4 bg-white/20" />

              {(() => {
                const toolbarLeft = Math.max(10, Math.min(width - 340, selectedElement.x))
                const toolbarTop = selectedElement.y > 52 ? selectedElement.y - 48 : selectedElement.y + selectedElement.height + 12
                const targetY = Math.max(10, Math.min(height - 400, selectedElement.y - 40))

                return (
                  <FontPicker
                    selectedFont={(selectedElement as TextElement).fontFamily || 'Inter'}
                    onSelectFont={(family) => {
                      setPreviewFont(null)
                      onUpdateElement?.(selectedElement.id, { fontFamily: family } as any)
                    }}
                    onPreviewFont={(family) => {
                      setPreviewFont(family)
                    }}
                    onRevertFont={() => {
                      setPreviewFont(null)
                    }}
                    compact={true}
                    customDropdownStyle={{
                      position: 'absolute',
                      left: `${width + 16 - toolbarLeft}px`,
                      top: `${targetY - toolbarTop}px`,
                      width: '280px',
                      maxHeight: '400px',
                    }}
                  />
                )
              })()}

              <span className="w-px h-4 bg-white/20" />

              {/* Font Size Decrement (-) / Increment (+) */}
              <div className="flex items-center gap-1 bg-white/10 rounded px-1 py-0.5">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => {
                    const currentSize = (selectedElement as TextElement).fontSize || 24
                    const newSize = Math.max(8, currentSize - 2)
                    onUpdateElement?.(selectedElement.id, { fontSize: newSize } as any)
                  }}
                  className="p-1 hover:bg-white/20 rounded text-white cursor-pointer"
                  title="Decrease font size (-2px)"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <span className="text-[11px] font-bold min-w-[24px] text-center">
                  {(selectedElement as TextElement).fontSize}
                </span>

                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => {
                    const currentSize = (selectedElement as TextElement).fontSize || 24
                    const newSize = Math.min(240, currentSize + 2)
                    onUpdateElement?.(selectedElement.id, { fontSize: newSize } as any)
                  }}
                  className="p-1 hover:bg-white/20 rounded text-white cursor-pointer"
                  title="Increase font size (+2px)"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Bold Toggle - Formats highlighted text or toggles element weight */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={() => {
                  toggleTextBold(
                    selectedElement as TextElement,
                    (id, updates) => onUpdateElement?.(id, updates as any),
                    inlineTextareaRef
                  )
                }}
                className={`p-1.5 rounded cursor-pointer transition-colors ${
                  (selectedElement as TextElement).fontWeight === 700 ||
                  (selectedElement as TextElement).fontWeight === 'bold' ||
                  (selectedElement as TextElement).text.includes('**')
                    ? 'bg-white/30 text-white font-bold'
                    : 'hover:bg-white/10 text-white/70'
                }`}
                title="Bold marked word (or toggle bold for text)"
              >
                <Bold className="w-3 h-3" />
              </button>

              {/* Italic Toggle - Formats highlighted text or toggles element style */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={() => {
                  toggleTextItalic(
                    selectedElement as TextElement,
                    (id, updates) => onUpdateElement?.(id, updates as any),
                    inlineTextareaRef
                  )
                }}
                className={`p-1.5 rounded cursor-pointer transition-colors ${
                  (selectedElement as TextElement).fontStyle === 'italic' ||
                  (selectedElement as TextElement).text.includes('*')
                    ? 'bg-white/30 text-white font-bold'
                    : 'hover:bg-white/10 text-white/70'
                }`}
                title="Italic marked word (or toggle italic)"
              >
                <Italic className="w-3 h-3" />
              </button>

              {/* Text Alignment */}
              <div className="flex items-center gap-0.5 bg-white/10 rounded p-0.5">
                <button
                  type="button"
                  onClick={() => onUpdateElement?.(selectedElement.id, { textAlign: 'left' } as any)}
                  className={`p-1 rounded cursor-pointer ${
                    (selectedElement as TextElement).textAlign === 'left' || !(selectedElement as TextElement).textAlign
                      ? 'bg-white/30 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateElement?.(selectedElement.id, { textAlign: 'center' } as any)}
                  className={`p-1 rounded cursor-pointer ${
                    (selectedElement as TextElement).textAlign === 'center'
                      ? 'bg-white/30 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateElement?.(selectedElement.id, { textAlign: 'right' } as any)}
                  className={`p-1 rounded cursor-pointer ${
                    (selectedElement as TextElement).textAlign === 'right'
                      ? 'bg-white/30 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Align Right"
                >
                  <AlignRight className="w-3 h-3" />
                </button>
              </div>

              {/* Text Color Picker */}
              <label
                className="w-5 h-5 rounded-full border border-white/30 cursor-pointer overflow-hidden shadow-xs shrink-0 flex items-center justify-center"
                style={{ backgroundColor: (selectedElement as TextElement).fill || '#000000' }}
                title="Change Text Color"
              >
                <input
                  type="color"
                  value={(selectedElement as TextElement).fill || '#000000'}
                  onChange={(e) => onUpdateElement?.(selectedElement.id, { fill: e.target.value } as any)}
                  className="opacity-0 w-0 h-0 cursor-pointer"
                />
              </label>
            </>
          )}

          {/* IMAGE / LOGO CONTROLS */}
          {(selectedElement.type === 'image' || selectedElement.type === 'logo') && (
            <button
              type="button"
              onClick={() => imageFileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#e26f5b] hover:bg-[#b84d3b] text-white text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap transition-colors"
              title="Upload new file to replace this logo or image"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{selectedElement.type === 'logo' || selectedElement.id.includes('logo') ? 'Change Logo' : 'Change Image'}</span>
            </button>
          )}

          {/* SHAPE CONTROLS */}
          {selectedElement.type === 'shape' && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] text-white/70">Color:</span>
              <label
                className="w-5 h-5 rounded-full border border-white/30 cursor-pointer overflow-hidden shadow-xs shrink-0"
                style={{ backgroundColor: selectedElement.fill || '#e6aa8f' }}
                title="Fill Color"
              >
                <input
                  type="color"
                  value={selectedElement.fill || '#e6aa8f'}
                  onChange={(e) => onUpdateElement?.(selectedElement.id, { fill: e.target.value } as any)}
                  className="opacity-0 w-0 h-0 cursor-pointer"
                />
              </label>
            </div>
          )}

          <span className="w-px h-4 bg-white/20" />

          {/* GROUP / UNGROUP BUTTON */}
          <button
            type="button"
            onClick={() => onToggleGroup?.(selectedElement.id)}
            className={`flex items-center gap-1 px-1.5 py-1 rounded text-[11px] cursor-pointer transition-colors ${
              selectedElement.groupId
                ? 'bg-[#e26f5b]/80 hover:bg-[#e26f5b] text-white'
                : 'hover:bg-white/20 text-white/80 hover:text-white'
            }`}
            title={selectedElement.groupId ? 'Ungroup items' : 'Group items together'}
          >
            {selectedElement.groupId ? <Unlink className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
            <span>{selectedElement.groupId ? 'Ungroup' : 'Group'}</span>
          </button>

          <span className="w-px h-4 bg-white/20" />

          {/* Duplicate & Delete Buttons */}
          <button
            type="button"
            onClick={() => onDuplicateElement?.(selectedElement.id)}
            className="p-1.5 hover:bg-white/20 rounded text-white/80 hover:text-white cursor-pointer"
            title="Duplicate element"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteElement?.(selectedElement.id)}
            className="p-1.5 hover:bg-red-500/40 rounded text-red-300 hover:text-red-200 cursor-pointer"
            title="Hide / Delete element"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
