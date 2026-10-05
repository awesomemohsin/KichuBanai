'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
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

interface StandaloneEditorProps {
  designId: string
  initialTemplateId?: string | null
}

export function StandaloneEditor({ designId, initialTemplateId }: StandaloneEditorProps) {
  const router = useRouter()

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
    initDesignWithId,
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
    undo,
    redo,
    saveDesign,
  } = useEditorStore()

  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false)

  // Initialize design on mount based on URL designId and optional template
  useEffect(() => {
    initDesignWithId(designId, initialTemplateId)
  }, [designId, initialTemplateId, initDesignWithId])

  // Native browser prompt if user tries to close the tab / reload with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault()
        e.returnValue = '' // Standard browser requirement to show confirmation dialog
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveStatus])

  const handleAttemptExit = () => {
    if (saveStatus === 'unsaved') {
      setShowExitConfirm(true)
    } else {
      exitEditor()
    }
  }

  const exitEditor = () => {
    // If opened as a new tab via window.open, attempt window.close(); fallback to router.push('/')
    if (window.opener && window.history.length <= 2) {
      window.close()
    } else {
      router.push('/')
    }
  }

  const handleSaveAndExit = async () => {
    setIsSavingAndExiting(true)
    await saveDesign()
    setIsSavingAndExiting(false)
    setShowExitConfirm(false)
    exitEditor()
  }

  const handleDiscardAndExit = () => {
    setShowExitConfirm(false)
    exitEditor()
  }

  const selectedElement = design.elements.find((el) => el.id === selectedElementId)

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
    <div className="w-screen h-screen flex flex-col bg-[#f9f8f6] overflow-hidden select-none">
      {/* Topbar */}
      <header className="h-14 bg-white border-b border-[#e4e1dc] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAttemptExit}
            className="p-1.5 rounded-md hover:bg-[#f2f0ec] text-[#6e6861] transition-all cursor-pointer"
            title="Back / Close Editor"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div
            className="flex items-center cursor-pointer"
            onClick={handleAttemptExit}
            title="KichuBanai Studio — Click to Exit"
          >
            <img src="/logo.png" alt="KichuBanai" className="h-8.5 w-auto object-contain max-w-[150px]" />
          </div>

          <span className="w-px h-5 bg-[#e4e1dc] mx-1" />

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={metadata.title}
              onChange={(e) =>
                useEditorStore.setState({
                  metadata: { ...metadata, title: e.target.value },
                  saveStatus: 'unsaved',
                })
              }
              className="text-xs font-semibold text-[#20201f] bg-transparent hover:bg-[#f2f0ec] focus:bg-white px-2 py-1 rounded border border-transparent focus:border-[#e4e1dc] outline-none max-w-[220px] transition-all"
            />
            <span className="text-[10px] text-[#99938d] font-mono">#{designId}</span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Save Status Button */}
          <button
            type="button"
            onClick={() => saveDesign()}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#817e79] hover:text-[#20201f] bg-transparent border-0 cursor-pointer rounded transition-all"
            title="Click to save design"
          >
            <Cloud
              className={`w-3.5 h-3.5 ${
                saveStatus === 'unsaved'
                  ? 'text-amber-500'
                  : saveStatus === 'saving'
                  ? 'text-blue-500 animate-pulse'
                  : 'text-[#e26f5b]'
              }`}
            />
            <span className="text-[11px] font-medium">
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'unsaved'
                ? 'Unsaved changes (Save)'
                : 'All changes saved'}
            </span>
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 bg-[#f0eeeb] p-0.5 rounded-md">
            <button
              type="button"
              className="p-1 rounded text-[#716d67] hover:text-[#20201f] disabled:opacity-30 cursor-pointer"
              onClick={undo}
              disabled={past.length === 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1 rounded text-[#716d67] hover:text-[#20201f] disabled:opacity-30 cursor-pointer"
              onClick={redo}
              disabled={future.length === 0}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="w-px h-5 bg-[#e4e1dc] mx-1" />

          {/* Physical Print Ordering Button */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e4e1dc] hover:bg-[#f2f0ec] text-xs font-bold text-[#242322] shadow-2xs transition-all cursor-pointer"
            onClick={() => setPrintDialogOpen(true)}
          >
            <Printer className="w-3.5 h-3.5 text-[#e26f5b]" />
            <span>Order Print</span>
          </button>

          {/* Digital Download Export Button */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#e26f5b] hover:bg-[#b84d3b] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            onClick={() => setDownloadModalOpen(true)}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tool Sidebar */}
        <aside className="w-18 bg-[#292724] text-[#aaa49c] p-2 flex flex-col gap-1.5 shrink-0 z-10">
          <button
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-md text-[9px] font-medium transition-all cursor-pointer ${
              activeTool === 'templates' ? 'bg-[#4a443f] text-white' : 'hover:bg-[#38332f] hover:text-white'
            }`}
            onClick={() => setActiveTool('templates')}
          >
            <LayoutTemplate className="w-4 h-4" />
            <span>Templates</span>
          </button>

          <button
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-md text-[9px] font-medium transition-all cursor-pointer ${
              activeTool === 'text' ? 'bg-[#4a443f] text-white' : 'hover:bg-[#38332f] hover:text-white'
            }`}
            onClick={() => setActiveTool('text')}
          >
            <Type className="w-4 h-4" />
            <span>Text</span>
          </button>

          <button
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-md text-[9px] font-medium transition-all cursor-pointer ${
              activeTool === 'uploads' ? 'bg-[#4a443f] text-white' : 'hover:bg-[#38332f] hover:text-white'
            }`}
            onClick={() => setActiveTool('uploads')}
          >
            <Upload className="w-4 h-4" />
            <span>Uploads</span>
          </button>

          <button
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-md text-[9px] font-medium transition-all cursor-pointer ${
              activeTool === 'elements' ? 'bg-[#4a443f] text-white' : 'hover:bg-[#38332f] hover:text-white'
            }`}
            onClick={() => setActiveTool('elements')}
          >
            <Grid2X2 className="w-4 h-4" />
            <span>Elements</span>
          </button>

          <button
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-md text-[9px] font-medium transition-all cursor-pointer ${
              activeTool === 'styles' ? 'bg-[#4a443f] text-white' : 'hover:bg-[#38332f] hover:text-white'
            }`}
            onClick={() => setActiveTool('styles')}
          >
            <Palette className="w-4 h-4" />
            <span>Colors</span>
          </button>
        </aside>

        {/* Properties / Tool Panel */}
        <aside className="w-64 bg-white border-r border-[#e4e1dc] p-4 flex flex-col shrink-0 overflow-y-auto z-10">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#20201f] m-0">
                {editorMode === 'quick' ? 'Quick Edit' : 'Design Tools'}
              </h3>
              <p className="text-[10px] text-[#817e79] m-0 mt-0.5">
                {editorMode === 'quick'
                  ? 'Beginner-friendly text & logo replacement'
                  : 'Full control over layers, typography & styles'}
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="bg-[#f0eeeb] p-0.5 rounded-lg flex mb-4 text-xs font-semibold">
            <button
              type="button"
              className={`flex-1 py-1.5 px-2 rounded-md transition-all cursor-pointer ${
                editorMode === 'quick' ? 'bg-white text-[#20201f] shadow-2xs font-bold' : 'text-[#817e79]'
              }`}
              onClick={() => setEditorMode('quick')}
            >
              Quick Edit
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 px-2 rounded-md transition-all cursor-pointer ${
                editorMode === 'full' ? 'bg-white text-[#20201f] shadow-2xs font-bold' : 'text-[#817e79]'
              }`}
              onClick={() => setEditorMode('full')}
            >
              Full Edit
            </button>
          </div>

          {/* Quick Edit Mode Content */}
          {editorMode === 'quick' ? (
            <div className="space-y-3.5 text-xs">
              {quickEditElements.map((el) => (
                <label key={el.id} className="block text-[10px] font-bold text-[#6e6861]">
                  {el.quickEditLabel || el.name}
                  {el.text.includes('\n') ? (
                    <textarea
                      value={el.text}
                      rows={3}
                      onChange={(e) => updateQuickEditField(el.quickEditKey!, e.target.value)}
                      className="w-full p-2 mt-1 text-xs bg-[#faf9f7] border border-[#e4e1dc] rounded-md outline-none focus:border-[#e26f5b]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={el.text}
                      onChange={(e) => updateQuickEditField(el.quickEditKey!, e.target.value)}
                      className="w-full h-8 px-2 mt-1 text-xs bg-[#faf9f7] border border-[#e4e1dc] rounded-md outline-none focus:border-[#e26f5b]"
                    />
                  )}
                </label>
              ))}

              <div>
                <span className="block text-[10px] font-bold text-[#6e6861] mb-1">Company / Studio Logo</span>
                <label className="border border-dashed border-[#cfc9c1] rounded-lg p-2.5 flex items-center gap-2 cursor-pointer bg-[#faf9f7] hover:bg-white transition-all">
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  <span className="w-7 h-7 rounded bg-[#e6aa8f] text-white font-bold flex items-center justify-center text-xs">
                    ✦
                  </span>
                  <span className="text-[11px] font-medium text-[#6e6861]">Upload / Replace Logo</span>
                  <Upload className="w-3.5 h-3.5 text-[#817e79] ml-auto" />
                </label>
              </div>
            </div>
          ) : (
            /* Full Edit Panel Content */
            <div className="space-y-5 text-xs">
              {activeTool === 'templates' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[#817e79] uppercase">Switch Template</span>
                  <div className="space-y-2">
                    {DEFAULT_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.metadata.id}
                        type="button"
                        onClick={() => loadFromTemplate(tpl)}
                        className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                          metadata.templateId === tpl.metadata.id
                            ? 'bg-white border-[#e26f5b] shadow-2xs'
                            : 'bg-[#faf9f7] border-[#e4e1dc] hover:bg-white'
                        }`}
                      >
                        <div>
                          <strong className="block text-xs text-[#20201f]">{tpl.metadata.title}</strong>
                          <small className="text-[#817e79]">{tpl.metadata.category} · {tpl.metadata.sizeLabel}</small>
                        </div>
                        <span className="text-base">{tpl.metadata.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'text' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-[#817e79] uppercase">Add Typography</span>
                  <button
                    type="button"
                    onClick={handleAddText}
                    className="w-full py-2.5 rounded-md bg-[#242322] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Text Heading
                  </button>
                </div>
              )}

              {activeTool === 'uploads' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-[#817e79] uppercase">Upload Images & Logos</span>
                  <label className="w-full p-6 border-2 border-dashed border-[#cfc9c1] rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#faf9f7] hover:bg-white text-center transition-all">
                    <Upload className="w-5 h-5 text-[#e26f5b]" />
                    <span className="text-xs font-semibold text-[#20201f]">Click to upload file</span>
                    <small className="text-[10px] text-[#817e79]">PNG, JPG, WEBP, or SVG</small>
                    <input type="file" accept="image/*,.svg" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}

              {activeTool === 'elements' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-[#817e79] uppercase">Vector Shapes</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddShape('rectangle')}
                      className="p-3 border border-[#e4e1dc] rounded-md bg-[#faf9f7] hover:bg-white font-semibold flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <div className="w-6 h-4 bg-[#e26f5b] rounded-xs" />
                      <span className="text-[10px]">Rectangle</span>
                    </button>
                    <button
                      type="button"
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
                        type="button"
                        onClick={() =>
                          useEditorStore.setState({
                            design: { ...design, background: { color } },
                            saveStatus: 'unsaved',
                          })
                        }
                        className="w-7 h-7 rounded-full border border-black/10 cursor-pointer shadow-xs transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                        title={`Color: ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Element Controls */}
              {selectedElement && (
                <div className="pt-3 border-t border-[#e4e1dc] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#817e79] uppercase">Selected Element</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateElement(selectedElement.id)}
                        className="p-1 text-[#817e79] hover:text-[#20201f] cursor-pointer"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteElement(selectedElement.id)}
                        className="p-1 text-[#817e79] hover:text-red-600 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {selectedElement.type === 'text' && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-[#6e6861]">
                        Content
                        <input
                          type="text"
                          value={(selectedElement as TextElement).text}
                          onChange={(e) => updateElement(selectedElement.id, { text: e.target.value } as any)}
                          className="w-full h-8 px-2 mt-0.5 text-xs bg-white border border-[#e4e1dc] rounded-md outline-none"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block text-[10px] font-semibold text-[#6e6861]">
                          Font Size
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

              {/* Layers List */}
              <div className="pt-3 border-t border-[#e4e1dc] space-y-2">
                <span className="text-[10px] font-bold text-[#817e79] uppercase flex items-center gap-1">
                  <Layers3 className="w-3 h-3" /> Layers ({design.elements.length})
                </span>

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
                        <span className="truncate max-w-[130px]">{el.name}</span>
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

        {/* Center Stage & Canvas */}
        <div className="flex-1 flex flex-col bg-[#e9e6e1] overflow-hidden">
          {/* Canvas Toolbar */}
          <div className="h-10 bg-white border-b border-[#e4e1dc] px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              {selectedElement && (
                <>
                  <button
                    type="button"
                    className="p-1 px-2 rounded-md hover:bg-[#f2f0ec] text-[11px] font-semibold text-[#6e6861] flex items-center gap-1 cursor-pointer"
                    onClick={() => duplicateElement(selectedElement.id)}
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <button
                    type="button"
                    className="p-1 px-2 rounded-md hover:bg-red-50 text-[11px] font-semibold text-red-600 flex items-center gap-1 cursor-pointer"
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

          {/* Interactive Canvas Viewport */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[#e9e6e1]">
            <CanvasRenderer
              design={design}
              selectedElementId={selectedElementId}
              zoom={zoom}
              onSelectElement={selectElement}
              onUpdateElementPosition={(id, x, y) => updateElement(id, { x, y } as any)}
              isInteractive={true}
            />
          </div>

          {/* Canvas Footer */}
          <div className="h-8 bg-white border-t border-[#e4e1dc] px-4 flex items-center justify-between text-[10px] text-[#817e79] shrink-0">
            <div className="flex items-center gap-3">
              <span>
                {design.canvas.width} × {design.canvas.height} px ({design.canvas.orientation})
              </span>
              <span className="w-px h-3 bg-[#e4e1dc]" />
              <span>Bleed: {design.canvas.bleedMm || 3}mm</span>
              <span className="w-px h-3 bg-[#e4e1dc]" />
              <span className="text-emerald-700 font-semibold">● Print Preflight Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* In-App Unsaved Changes Warning Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-[#24232299] backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-[#e4e1dc] p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[#20201f] m-0">You have unsaved changes</h3>
              <p className="text-xs text-[#817e79] m-0">
                Would you like to save your edits before leaving the editor?
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isSavingAndExiting}
                onClick={handleSaveAndExit}
                className="w-full py-2.5 rounded-lg bg-[#242322] hover:bg-[#3d3a36] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                {isSavingAndExiting ? 'Saving Draft...' : 'Save Changes & Exit'}
              </button>

              <button
                type="button"
                onClick={handleDiscardAndExit}
                className="w-full py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Discard & Exit
              </button>

              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-1.5 text-xs text-[#817e79] hover:text-[#20201f] font-medium cursor-pointer"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Modal */}
      <DownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        design={design}
        designTitle={metadata.title}
      />

      {/* Print Order Dialog */}
      <PrintOrderDialog
        isOpen={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        design={design}
        metadata={metadata}
        onOrderSuccess={() => {
          // Keep editor open or allow user to review
        }}
      />
    </div>
  )
}
