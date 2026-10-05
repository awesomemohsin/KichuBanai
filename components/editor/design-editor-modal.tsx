'use client'

import React, { useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  Cloud,
  Copy,
  Download,
  Eye,
  EyeOff,
  Grid2X2,
  Layers3,
  LayoutTemplate,
  Lock,
  MoreHorizontal,
  Move,
  Palette,
  Plus,
  Printer,
  Redo2,
  Trash2,
  Type,
  Undo2,
  Unlock,
  Upload,
  X,
} from 'lucide-react'
import { useEditorStore } from '@/lib/editor/editor-store'
import { CanvasRenderer } from './canvas-renderer'
import { DownloadModal } from './download-modal'
import { PrintOrderDialog } from '../orders/print-order-dialog'
import { DEFAULT_TEMPLATES } from '@/lib/templates/template-registry'
import { DesignElement, TextElement } from '@/types/domain'

interface DesignEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onOrderSuccess: (order: any) => void
}

export function DesignEditorModal({ isOpen, onClose, onOrderSuccess }: DesignEditorModalProps) {
  const {
    design,
    metadata,
    selectedElementId,
    activeTool,
    editorMode,
    zoom,
    saveStatus,
    past,
    future,
    loadFromTemplate,
    setEditorMode,
    setActiveTool,
    setZoom,
    selectElement,
    updateElement,
    updateQuickEditField,
    addElement,
    deleteElement,
    duplicateElement,
    toggleLock,
    toggleVisibility,
    reorderLayer,
    undo,
    redo,
    saveDesign,
  } = useEditorStore()

  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)

  if (!isOpen) return null

  const selectedElement = design.elements.find((el) => el.id === selectedElementId)

  // Extract quick edit fields from current design
  const quickEditElements = design.elements.filter(
    (el) => (el as TextElement).quickEditKey && el.permissions.editable
  ) as TextElement[]

  const handleAddText = () => {
    const newText: TextElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      name: 'Custom Heading',
      text: 'New Headline',
      fontFamily: 'Inter',
      fontSize: 36,
      fontWeight: 700,
      fill: '#242322',
      textAlign: 'left',
      x: 100,
      y: 150,
      width: 400,
      height: 50,
      zIndex: design.elements.length + 1,
      permissions: {
        editable: true,
        movable: true,
        resizable: true,
        rotatable: false,
        deletable: true,
        locked: false,
        required: false,
        visible: true,
      },
    }
    addElement(newText)
  }

  const handleAddShape = (shapeType: 'rectangle' | 'circle') => {
    const newShape: DesignElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      name: shapeType === 'circle' ? 'Circle Accent' : 'Decorative Box',
      shapeType,
      x: 120,
      y: 120,
      width: 180,
      height: shapeType === 'circle' ? 180 : 100,
      fill: '#e6aa8f',
      zIndex: design.elements.length + 1,
      permissions: {
        editable: false,
        movable: true,
        resizable: true,
        rotatable: false,
        deletable: true,
        locked: false,
        required: false,
        visible: true,
      },
    }
    addElement(newShape)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      const newImg: DesignElement = {
        id: `img-${Date.now()}`,
        type: 'image',
        name: file.name.slice(0, 16),
        src: dataUrl,
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        zIndex: design.elements.length + 1,
        permissions: {
          editable: false,
          movable: true,
          resizable: true,
          rotatable: false,
          deletable: true,
          replaceable: true,
          locked: false,
          required: false,
          visible: true,
        },
      }
      addElement(newImg)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="modal-layer">
      <div className="editor-window flex flex-col">
        {/* Topbar */}
        <header className="editor-topbar">
          <div className="editor-brand">
            <button onClick={onClose} aria-label="Close editor" className="cursor-pointer">
              <ArrowLeft className="w-4 h-4 text-[#817e79]" />
            </button>
            <img src="/favicon.png" alt="KichuBanai" className="w-5 h-5 object-contain" />
            <strong>KichuBanai</strong>
            <span className="editor-divider" />
            <input
              value={metadata.title}
              onChange={(e) => useEditorStore.setState({ metadata: { ...metadata, title: e.target.value } })}
              className="text-xs font-semibold text-[#3d3a36] bg-transparent border-0 outline-none w-48 truncate"
            />
          </div>

          <div className="editor-actions">
            <button
              onClick={() => saveDesign()}
              className="saved-status bg-transparent border-0 cursor-pointer"
              title="Click to save design draft"
            >
              <Cloud className="w-3.5 h-3.5 text-[#e26f5b]" />
              <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved changes' : 'Saved'}</span>
            </button>

            <button
              className="icon-button cursor-pointer disabled:opacity-30"
              onClick={undo}
              disabled={past.length === 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 />
            </button>
            <button
              className="icon-button cursor-pointer disabled:opacity-30"
              onClick={redo}
              disabled={future.length === 0}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 />
            </button>

            <button
              className="outline-button small cursor-pointer"
              onClick={() => setPrintDialogOpen(true)}
            >
              <Printer className="w-3.5 h-3.5 text-[#e26f5b]" />
              <span>Order Print</span>
            </button>

            <button
              className="coral-button small cursor-pointer"
              onClick={() => setDownloadModalOpen(true)}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </header>

        {/* Editor Body */}
        <div className="editor-body flex-1 overflow-hidden">
          {/* Tool Selector Bar */}
          <aside className="editor-tools">
            <button
              className={`editor-tool cursor-pointer ${activeTool === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveTool('templates')}
            >
              <LayoutTemplate />
              <span>Templates</span>
            </button>
            <button
              className={`editor-tool cursor-pointer ${activeTool === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTool('text')}
            >
              <Type />
              <span>Text</span>
            </button>
            <button
              className={`editor-tool cursor-pointer ${activeTool === 'uploads' ? 'active' : ''}`}
              onClick={() => setActiveTool('uploads')}
            >
              <Upload />
              <span>Uploads</span>
            </button>
            <button
              className={`editor-tool cursor-pointer ${activeTool === 'elements' ? 'active' : ''}`}
              onClick={() => setActiveTool('elements')}
            >
              <Grid2X2 />
              <span>Elements</span>
            </button>
            <button
              className={`editor-tool cursor-pointer ${activeTool === 'styles' ? 'active' : ''}`}
              onClick={() => setActiveTool('styles')}
            >
              <Palette />
              <span>Colors</span>
            </button>
            <div className="editor-tool-spacer" />
          </aside>

          {/* Configuration Panel */}
          <aside className="editor-panel overflow-y-auto">
            <div className="panel-heading">
              <div>
                <h3 className="text-sm font-bold text-[#20201f]">
                  {editorMode === 'quick' ? 'Quick Edit' : 'Design Tools'}
                </h3>
                <p className="text-[10px] text-[#817e79] m-0 mb-3">
                  {editorMode === 'quick'
                    ? 'Beginner-friendly: type below to update design.'
                    : 'Full control over layers, typography & styles.'}
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="mode-toggle">
              <button
                type="button"
                className={editorMode === 'quick' ? 'selected' : ''}
                onClick={() => setEditorMode('quick')}
              >
                Quick Edit
              </button>
              <button
                type="button"
                className={editorMode === 'full' ? 'selected' : ''}
                onClick={() => setEditorMode('full')}
              >
                Full Edit
              </button>
            </div>

            {/* Quick Edit UI */}
            {editorMode === 'quick' ? (
              <div className="quick-fields space-y-3">
                {quickEditElements.map((el) => (
                  <label key={el.id} className="block text-[10px] font-bold text-[#6e6861]">
                    {el.quickEditLabel || el.name}
                    {el.text.includes('\n') ? (
                      <textarea
                        value={el.text}
                        rows={3}
                        onChange={(e) => updateQuickEditField(el.quickEditKey!, e.target.value)}
                        className="w-full p-2 mt-1 text-xs bg-[#faf9f7] border border-[#e4e1dc] rounded-md outline-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={el.text}
                        onChange={(e) => updateQuickEditField(el.quickEditKey!, e.target.value)}
                        className="w-full h-8 px-2 mt-1 text-xs bg-[#faf9f7] border border-[#e4e1dc] rounded-md outline-none"
                      />
                    )}
                  </label>
                ))}

                {/* Upload logo placeholder */}
                <div>
                  <span className="block text-[10px] font-bold text-[#6e6861] mb-1">Company / Studio Logo</span>
                  <label className="upload-field cursor-pointer flex items-center gap-2">
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    <span className="logo-placeholder">✦</span>
                    <span className="text-[11px] text-[#716d67] font-medium">Replace / Add Logo</span>
                    <Upload className="w-3.5 h-3.5 text-[#817e79] ml-auto" />
                  </label>
                </div>
              </div>
            ) : (
              /* Full Edit Panel */
              <div className="space-y-5 text-xs">
                {/* Active Tool Specific Options */}
                {activeTool === 'templates' && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[#817e79] uppercase">Switch Template</span>
                    <div className="space-y-2">
                      {DEFAULT_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.metadata.id}
                          onClick={() => loadFromTemplate(tpl)}
                          className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                            metadata.templateId === tpl.metadata.id
                              ? 'bg-white border-[#e26f5b] shadow-xs'
                              : 'bg-[#faf9f7] border-[#e4e1dc] hover:bg-white'
                          }`}
                        >
                          <div>
                            <strong className="block text-xs text-[#20201f]">{tpl.metadata.title}</strong>
                            <small className="text-[#817e79]">{tpl.metadata.category} · {tpl.metadata.sizeLabel}</small>
                          </div>
                          <span>{tpl.metadata.icon}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTool === 'text' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-[#817e79] uppercase">Add Typography</span>
                    <button
                      onClick={handleAddText}
                      className="w-full py-2.5 rounded-md bg-[#242322] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Text Heading
                    </button>
                  </div>
                )}

                {activeTool === 'uploads' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-[#817e79] uppercase">Upload Images & Logos</span>
                    <label className="w-full p-6 border-2 border-dashed border-[#cfc9c1] rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#faf9f7] hover:bg-white text-center">
                      <Upload className="w-5 h-5 text-[#e26f5b]" />
                      <span className="text-xs font-semibold text-[#20201f]">Click to upload file</span>
                      <small className="text-[10px] text-[#817e79]">PNG, JPG, WEBP, or SVG</small>
                      <input type="file" accept="image/*,.svg" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                )}

                {activeTool === 'elements' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-[#817e79] uppercase">Add Vector Shapes</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAddShape('rectangle')}
                        className="p-3 border border-[#e4e1dc] rounded-md bg-[#faf9f7] hover:bg-white font-semibold flex flex-col items-center gap-1 cursor-pointer"
                      >
                        <div className="w-6 h-4 bg-[#e26f5b] rounded-xs" />
                        <span className="text-[10px]">Rectangle</span>
                      </button>
                      <button
                        onClick={() => handleAddShape('circle')}
                        className="p-3 border border-[#e4e1dc] rounded-md bg-[#faf9f7] hover:bg-white font-semibold flex flex-col items-center gap-1 cursor-pointer"
                      >
                        <div className="w-5 h-5 bg-[#e26f5b] rounded-full" />
                        <span className="text-[10px]">Circle</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeTool === 'styles' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-[#817e79] uppercase">Canvas Palette</span>
                    <div className="flex flex-wrap gap-2">
                      {['#f8f7f4', '#ffffff', '#e6aa8f', '#ef826c', '#a8b59d', '#c9b8dd', '#e6d2b6', '#8caab0', '#242322'].map((color) => (
                        <button
                          key={color}
                          onClick={() => useEditorStore.setState({ design: { ...design, background: { color } } })}
                          className="w-7 h-7 rounded-full border border-black/10 cursor-pointer shadow-xs"
                          style={{ backgroundColor: color }}
                          title={`Background ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Element Properties */}
                {selectedElement && (
                  <div className="pt-3 border-t border-[#e4e1dc] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-[#817e79] uppercase">Selected Element</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => duplicateElement(selectedElement.id)}
                          className="p-1 text-[#817e79] hover:text-[#20201f]"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteElement(selectedElement.id)}
                          className="p-1 text-[#817e79] hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {selectedElement.type === 'text' && (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-semibold text-[#6e6861]">
                          Text
                          <input
                            type="text"
                            value={(selectedElement as TextElement).text}
                            onChange={(e) => updateElement(selectedElement.id, { text: e.target.value } as any)}
                            className="w-full h-8 px-2 mt-0.5 text-xs bg-white border border-[#e4e1dc] rounded-md outline-none"
                          />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block text-[10px] font-semibold text-[#6e6861]">
                            Size
                            <input
                              type="number"
                              value={(selectedElement as TextElement).fontSize}
                              onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) } as any)}
                              className="w-full h-8 px-2 mt-0.5 text-xs bg-white border border-[#e4e1dc] rounded-md outline-none"
                            />
                          </label>
                          <label className="block text-[10px] font-semibold text-[#6e6861]">
                            Color
                            <input
                              type="color"
                              value={(selectedElement as TextElement).fill}
                              onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value } as any)}
                              className="w-full h-8 px-1 mt-0.5 bg-white border border-[#e4e1dc] rounded-md outline-none cursor-pointer"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Layer Hierarchy List (Rule 12 & 22) */}
                <div className="pt-3 border-t border-[#e4e1dc] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#817e79] uppercase flex items-center gap-1">
                      <Layers3 className="w-3 h-3" /> Layers ({design.elements.length})
                    </span>
                  </div>

                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {[...design.elements].reverse().map((el) => {
                      const isSelected = selectedElementId === el.id
                      return (
                        <div
                          key={el.id}
                          onClick={() => selectElement(el.id)}
                          className={`p-1.5 rounded-md flex items-center justify-between text-[11px] cursor-pointer ${
                            isSelected ? 'bg-amber-100/60 font-semibold text-[#20201f]' : 'hover:bg-[#f2f0ec] text-[#6e6861]'
                          }`}
                        >
                          <span className="truncate max-w-[120px]">{el.name}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleLock(el.id)
                              }}
                              className="p-0.5 text-[#817e79] hover:text-[#20201f]"
                            >
                              {el.permissions.locked ? <Lock className="w-3 h-3 text-red-500" /> : <Unlock className="w-3 h-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleVisibility(el.id)
                              }}
                              className="p-0.5 text-[#817e79] hover:text-[#20201f]"
                            >
                              {el.permissions.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-gray-400" />}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Interactive Canvas Stage */}
          <div className="canvas-area flex-1 flex flex-col bg-[#e9e6e1] overflow-hidden">
            {/* Canvas Toolbar */}
            <div className="canvas-toolbar flex justify-between items-center px-4 bg-white border-b border-[#e4e1dc]">
              <div className="canvas-tool-group flex items-center gap-1">
                <button
                  className="icon-button small cursor-pointer disabled:opacity-30"
                  onClick={undo}
                  disabled={past.length === 0}
                  title="Undo"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  className="icon-button small cursor-pointer disabled:opacity-30"
                  onClick={redo}
                  disabled={future.length === 0}
                  title="Redo"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
                <span className="toolbar-divider" />
                {selectedElement && (
                  <>
                    <button
                      className="p-1 px-2 rounded-md hover:bg-gray-100 text-[11px] font-semibold text-[#6e6861] flex items-center gap-1 cursor-pointer"
                      onClick={() => duplicateElement(selectedElement.id)}
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicate
                    </button>
                    <button
                      className="p-1 px-2 rounded-md hover:bg-gray-100 text-[11px] font-semibold text-red-600 flex items-center gap-1 cursor-pointer"
                      onClick={() => deleteElement(selectedElement.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </>
                )}
              </div>

              {/* Zoom Selector */}
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6e6861]">
                <span>Zoom:</span>
                <select
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-7 px-2 bg-[#faf9f7] border border-[#e4e1dc] rounded-md outline-none text-xs"
                >
                  <option value={0.5}>50%</option>
                  <option value={0.65}>65%</option>
                  <option value={0.8}>80%</option>
                  <option value={1}>100%</option>
                  <option value={1.25}>125%</option>
                </select>
              </div>
            </div>

            {/* Stage Viewport */}
            <div className="canvas-stage flex-1 overflow-auto flex items-center justify-center p-8">
              <CanvasRenderer
                design={design}
                selectedElementId={selectedElementId}
                zoom={zoom}
                onSelectElement={selectElement}
                onUpdateElementPosition={(id, x, y) => updateElement(id, { x, y } as any)}
                isInteractive={true}
              />
            </div>

            {/* Canvas Footer Bar */}
            <div className="canvas-footer flex items-center justify-between px-4 bg-white border-t border-[#e4e1dc] text-[10px] text-[#817e79]">
              <div className="flex items-center gap-3">
                <span>
                  Canvas: {design.canvas.width} × {design.canvas.height} px ({design.canvas.orientation})
                </span>
                <span className="footer-separator" />
                <span>Bleed: {design.canvas.bleedMm || 3}mm</span>
                <span className="footer-separator" />
                <span className="text-emerald-700 font-semibold">● Print Preflight Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Download Modal */}
      <DownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        design={design}
        designTitle={metadata.title}
      />

      {/* Real Print Order Dialog */}
      <PrintOrderDialog
        isOpen={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        design={design}
        metadata={metadata}
        onOrderSuccess={(order) => {
          onOrderSuccess(order)
        }}
      />
    </div>
  )
}
