'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  ChevronDown,
  Cloud,
  Copy,
  Download,
  Eye,
  EyeOff,
  Grid2X2,
  Image as ImageIcon,
  Italic,
  Layers,
  Layers3,
  Lock,
  Minus,
  Palette,
  Plus,
  Printer,
  Redo2,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  Unlink,
  Unlock,
  Upload,
  X,
} from 'lucide-react'
import { FontPicker } from './font-picker'
import { useEditorStore } from '@/lib/editor/editor-store'
import { CanvasRenderer } from './canvas-renderer'
import { DownloadModal } from './download-modal'
import { PrintOrderDialog } from '../orders/print-order-dialog'
import { DesignElement, TextElement } from '@/types/domain'
import { toggleTextBold, toggleTextItalic } from '@/lib/editor/editor-utils'

interface StandaloneEditorProps {
  designId: string
  initialTemplateId?: string | null
}

export function StandaloneEditor({ designId, initialTemplateId }: StandaloneEditorProps) {
  const router = useRouter()
  const replaceFileInputRef = useRef<HTMLInputElement>(null)
  const sidebarTextareaRef = useRef<HTMLTextAreaElement>(null)
  const topBarInputRef = useRef<HTMLInputElement>(null)
  const [sidebarSelection, setSidebarSelection] = useState<{ start: number; end: number } | null>(null)
  const [topBarSelection, setTopBarSelection] = useState<{ start: number; end: number } | null>(null)
  const originalFontRef = useRef<string | null>(null)

  const {
    design,
    metadata,
    selectedElementId,
    activeTool,
    zoom,
    saveStatus,
    past,
    future,
    initDesignWithId,
    loadFromTemplate,
    setActiveTool,
    setZoom,
    selectElement,
    updateElement,
    addElement,
    deleteElement,
    duplicateElement,
    toggleLock,
    toggleVisibility,
    toggleGroup,
    updateMultipleElementsPositions,
    reorderLayer,
    undo,
    redo,
    saveDesign,
  } = useEditorStore()

  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  // Initialize design on mount based on URL designId and optional template
  useEffect(() => {
    initDesignWithId(designId, initialTemplateId)
  }, [designId, initialTemplateId, initDesignWithId])

  // Native browser prompt if user tries to close the tab / reload with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveStatus])

  // Global Canva-style Keyboard Shortcuts: Undo, Redo, Delete, Duplicate, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      // Don't intercept shortcuts when user is typing in an input or textarea
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (past.length > 0) undo()
      }
      // Redo: Ctrl+Y / Cmd+Y / Ctrl+Shift+Z
      else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault()
        if (future.length > 0) redo()
      }
      // Delete / Backspace: hides element in layers
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault()
          deleteElement(selectedElementId)
        }
      }
      // Duplicate: Ctrl+D
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedElementId) {
          e.preventDefault()
          duplicateElement(selectedElementId)
        }
      }
      // Escape: deselect
      else if (e.key === 'Escape') {
        selectElement(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [past, future, selectedElementId, undo, redo, deleteElement, duplicateElement, selectElement])

  const handleAttemptExit = () => {
    if (saveStatus === 'unsaved') {
      setShowExitConfirm(true)
    } else {
      exitEditor()
    }
  }

  const exitEditor = () => {
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

  const selectedElement = design.elements.find((el) => el.id === selectedElementId)

  // Canva-style Typography Adders
  const handleAddTypography = (level: 'heading' | 'subheading' | 'body') => {
    const config =
      level === 'heading'
        ? { text: 'Add a heading', fontSize: 44, fontWeight: 700, height: 60, width: 450 }
        : level === 'subheading'
        ? { text: 'Add a subheading', fontSize: 24, fontWeight: 600, height: 40, width: 380 }
        : { text: 'Add a little bit of body text', fontSize: 16, fontWeight: 400, height: 32, width: 340 }

    const newText: TextElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      name: level === 'heading' ? 'Heading' : level === 'subheading' ? 'Subheading' : 'Body Text',
      text: config.text,
      fontFamily: 'Inter',
      fontSize: config.fontSize,
      fontWeight: config.fontWeight,
      fill: '#242322',
      textAlign: 'left',
      x: Math.round(design.canvas.width / 2 - config.width / 2),
      y: Math.round(design.canvas.height / 2 - config.height / 2),
      width: config.width,
      height: config.height,
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

  // Canva-style Shapes
  const handleAddShape = (shapeType: 'rectangle' | 'circle') => {
    const newShape: DesignElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      name: shapeType === 'circle' ? 'Circle' : 'Rectangle',
      shapeType,
      x: Math.round(design.canvas.width / 2 - 90),
      y: Math.round(design.canvas.height / 2 - (shapeType === 'circle' ? 90 : 50)),
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

  // Handle Image File Uploads (Add new or gallery)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setUploadedImages((prev) => [dataUrl, ...prev.slice(0, 19)])

      // If an image or logo is currently selected, replace its source directly!
      if (selectedElement && (selectedElement.type === 'image' || selectedElement.type === 'logo')) {
        updateElement(selectedElement.id, {
          src: dataUrl,
          name: file.name.slice(0, 16),
        } as any)
        return
      }

      // Otherwise, add a new image element to canvas
      const newImg: DesignElement = {
        id: `img-${Date.now()}`,
        type: 'image',
        name: file.name.slice(0, 16),
        src: dataUrl,
        x: Math.round(design.canvas.width / 2 - 100),
        y: Math.round(design.canvas.height / 2 - 75),
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

  // Handle direct replacement of selected image/logo
  const handleReplaceSelectedImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedElementId) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setUploadedImages((prev) => [dataUrl, ...prev.slice(0, 19)])
      updateElement(selectedElementId, {
        src: dataUrl,
        name: file.name.slice(0, 16),
      } as any)
    }
    reader.readAsDataURL(file)
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-[#f9f8f6] overflow-hidden select-none">
      {/* Hidden File Input for Replace Logo / Image */}
      <input
        type="file"
        ref={replaceFileInputRef}
        accept="image/*,.svg"
        onChange={handleReplaceSelectedImage}
        className="hidden"
      />

      {/* Top Header */}
      <header className="h-14 bg-white border-b border-[#e4e1dc] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAttemptExit}
            className="p-1.5 rounded-md hover:bg-[#f2f0ec] text-[#6e6861] transition-all cursor-pointer"
            title="Back / Close Studio"
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

          {/* Title Editor */}
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

        {/* Right Action Header Buttons */}
        <div className="flex items-center gap-2">
          {/* Cloud Save Status Button */}
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
                ? 'Save changes'
                : 'All changes saved'}
            </span>
          </button>

          {/* Canva-style Undo & Redo Controls */}
          <div className="flex items-center gap-0.5 bg-[#f0eeeb] p-0.5 rounded-md">
            <button
              type="button"
              className="p-1.5 rounded text-[#716d67] hover:text-[#20201f] hover:bg-white disabled:opacity-30 cursor-pointer transition-colors"
              onClick={undo}
              disabled={past.length === 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded text-[#716d67] hover:text-[#20201f] hover:bg-white disabled:opacity-30 cursor-pointer transition-colors"
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

      {/* Editor Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tool Rail (Canva Style Icons) */}
        <aside className="w-18 bg-[#242322] text-[#aaa49c] p-2 flex flex-col gap-1.5 shrink-0 z-10">
          <button
            className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-md text-[9px] font-medium transition-all cursor-pointer ${
              activeTool === 'uploads' ? 'bg-[#3d3834] text-white' : 'hover:bg-[#332f2b] hover:text-white'
            }`}
            onClick={() => setActiveTool('uploads')}
          >
            <Upload className="w-4 h-4" />
            <span>Uploads</span>
          </button>

          <button
            className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-md text-[9px] font-medium transition-all cursor-pointer ${
              activeTool === 'text' ? 'bg-[#3d3834] text-white' : 'hover:bg-[#332f2b] hover:text-white'
            }`}
            onClick={() => setActiveTool('text')}
          >
            <Type className="w-4 h-4" />
            <span>Text</span>
          </button>

          <button
            className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-md text-[9px] font-medium transition-all cursor-pointer ${
              activeTool === 'elements' ? 'bg-[#3d3834] text-white' : 'hover:bg-[#332f2b] hover:text-white'
            }`}
            onClick={() => setActiveTool('elements')}
          >
            <Grid2X2 className="w-4 h-4" />
            <span>Elements</span>
          </button>

          <button
            className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-md text-[9px] font-medium transition-all cursor-pointer ${
              activeTool === 'settings' ? 'bg-[#3d3834] text-white' : 'hover:bg-[#332f2b] hover:text-white'
            }`}
            onClick={() => setActiveTool('settings')}
          >
            <Layers3 className="w-4 h-4" />
            <span>Layers</span>
          </button>
        </aside>

        {/* Canva-style Drawer Panel (No hardcoded form fields) */}
        <aside className="w-72 bg-white border-r border-[#e4e1dc] p-4 flex flex-col shrink-0 overflow-y-auto z-10">
          {/* SELECTED ELEMENT INSPECTOR (Direct, clear controls for whatever element is clicked) */}
          {selectedElement && (
            <div className="mb-4 p-3 bg-[#faf9f7] rounded-xl border border-[#e26f5b]/50 shadow-xs space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#e26f5b] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#e26f5b]" />
                  Edit {selectedElement.type === 'text' ? 'Text' : selectedElement.type === 'logo' || selectedElement.type === 'image' ? 'Logo / Image' : 'Element'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => duplicateElement(selectedElement.id)}
                    className="p-1 hover:bg-[#f0eeeb] rounded text-[#6e6861] cursor-pointer"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteElement(selectedElement.id)}
                    className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                    title="Delete (hides in layers)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* If Text Element */}
              {selectedElement.type === 'text' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6e6861] uppercase tracking-wider mb-1">
                      Content
                    </label>
                    <textarea
                      ref={sidebarTextareaRef}
                      rows={2}
                      value={(selectedElement as TextElement).text}
                      onChange={(e) => updateElement(selectedElement.id, { text: e.target.value } as any)}
                      onSelect={(e) => {
                        const target = e.currentTarget
                        setSidebarSelection({ start: target.selectionStart, end: target.selectionEnd })
                      }}
                      onKeyUp={(e) => {
                        const target = e.currentTarget
                        setSidebarSelection({ start: target.selectionStart, end: target.selectionEnd })
                      }}
                      onMouseUp={(e) => {
                        const target = e.currentTarget
                        setSidebarSelection({ start: target.selectionStart, end: target.selectionEnd })
                      }}
                      className="w-full p-2 text-xs text-[#20201f] bg-white border border-[#e4e1dc] focus:border-[#e26f5b] rounded-lg outline-none resize-none transition-all font-medium leading-relaxed"
                      placeholder="Type your text here..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-[#6e6861] uppercase tracking-wider">
                        Font & Styling
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          onClick={() =>
                            toggleTextBold(
                              selectedElement as TextElement,
                              (id, updates) => updateElement(id, updates as any),
                              sidebarTextareaRef,
                              sidebarSelection
                            )
                          }
                          className={`p-1 rounded text-xs cursor-pointer border ${
                            (selectedElement as TextElement).fontWeight === 700 ||
                            (selectedElement as TextElement).fontWeight === 'bold' ||
                            (selectedElement as TextElement).text.includes('**')
                              ? 'bg-[#242322] border-[#242322] text-white'
                              : 'bg-white border-[#e4e1dc] text-[#6e6861] hover:bg-[#faf9f7]'
                          }`}
                          title="Bold marked word"
                        >
                          <Bold className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          onClick={() =>
                            toggleTextItalic(
                              selectedElement as TextElement,
                              (id, updates) => updateElement(id, updates as any),
                              sidebarTextareaRef,
                              sidebarSelection
                            )
                          }
                          className={`p-1 rounded text-xs cursor-pointer border ${
                            (selectedElement as TextElement).fontStyle === 'italic' ||
                            (selectedElement as TextElement).text.includes('*')
                              ? 'bg-[#242322] border-[#242322] text-white'
                              : 'bg-white border-[#e4e1dc] text-[#6e6861] hover:bg-[#faf9f7]'
                          }`}
                          title="Italic marked word"
                        >
                          <Italic className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <FontPicker
                      selectedFont={(selectedElement as TextElement).fontFamily || 'Inter'}
                      onSelectFont={(family) => {
                        originalFontRef.current = null
                        updateElement(selectedElement.id, { fontFamily: family } as any, true)
                      }}
                      onPreviewFont={(family) => {
                        if (!originalFontRef.current) {
                          originalFontRef.current = (selectedElement as TextElement).fontFamily || 'Inter'
                        }
                        updateElement(selectedElement.id, { fontFamily: family } as any, false)
                      }}
                      onRevertFont={() => {
                        if (originalFontRef.current) {
                          updateElement(selectedElement.id, { fontFamily: originalFontRef.current } as any, false)
                          originalFontRef.current = null
                        }
                      }}
                      compact={false}
                      placement="bottom"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6e6861] uppercase tracking-wider mb-1">
                        Size (px)
                      </label>
                      <div className="flex items-center gap-1 bg-[#f0eeeb] rounded-md p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const s = (selectedElement as TextElement).fontSize || 24
                            updateElement(selectedElement.id, { fontSize: Math.max(8, s - 2) } as any)
                          }}
                          className="p-1 rounded hover:bg-white text-[#242322] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          value={(selectedElement as TextElement).fontSize}
                          onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) } as any)}
                          className="w-full text-center text-xs font-bold bg-white rounded border border-[#e4e1dc] outline-none h-6"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const s = (selectedElement as TextElement).fontSize || 24
                            updateElement(selectedElement.id, { fontSize: Math.min(240, s + 2) } as any)
                          }}
                          className="p-1 rounded hover:bg-white text-[#242322] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6e6861] uppercase tracking-wider mb-1">
                        Color
                      </label>
                      <label
                        className="w-full h-7 rounded-md border border-[#e4e1dc] cursor-pointer flex items-center justify-center overflow-hidden shadow-2xs"
                        style={{ backgroundColor: (selectedElement as TextElement).fill || '#000000' }}
                      >
                        <input
                          type="color"
                          value={(selectedElement as TextElement).fill || '#000000'}
                          onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value } as any)}
                          className="opacity-0 w-0 h-0 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* If Logo / Image */}
              {(selectedElement.type === 'image' || selectedElement.type === 'logo') && (
                <div className="space-y-2">
                  <div className="w-full h-20 bg-white rounded-lg border border-[#e4e1dc] p-1 flex items-center justify-center overflow-hidden">
                    <img src={selectedElement.src} alt={selectedElement.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={() => replaceFileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-lg bg-[#e26f5b] hover:bg-[#b84d3b] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Replace File</span>
                  </button>
                </div>
              )}

              {/* If Shape */}
              {selectedElement.type === 'shape' && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#6e6861] uppercase tracking-wider">
                    Shape Color
                  </label>
                  <label
                    className="w-full h-8 rounded-md border border-[#e4e1dc] cursor-pointer flex items-center justify-center overflow-hidden shadow-2xs"
                    style={{ backgroundColor: selectedElement.fill || '#e6aa8f' }}
                  >
                    <input
                      type="color"
                      value={selectedElement.fill || '#e6aa8f'}
                      onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value } as any)}
                      className="opacity-0 w-0 h-0 cursor-pointer"
                    />
                  </label>
                </div>
              )}
            </div>
          )}
          {/* TAB: UPLOADS (Logos, Photos & User Media) */}
          {activeTool === 'uploads' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-[#20201f] uppercase tracking-wider">Uploads</h3>
                <p className="text-[10px] text-[#817e79] mt-0.5">Add your logo, photos, and custom artwork</p>
              </div>

              {/* Contextual Target Card if an Image or Logo is selected on canvas */}
              {selectedElement && (selectedElement.type === 'image' || selectedElement.type === 'logo') && (
                <div className="p-3 rounded-lg bg-[#fff8eb] border border-[#f5d99b] text-xs">
                  <div className="flex items-center gap-2 font-bold text-[#8c5e12]">
                    <ImageIcon className="w-4 h-4 text-[#e26f5b]" />
                    <span>Selected: {selectedElement.name || 'Brand Logo'}</span>
                  </div>
                  <p className="text-[11px] text-[#716d67] mt-1 leading-relaxed">
                    Choose a new file to replace this logo or image on your design.
                  </p>
                  <button
                    type="button"
                    onClick={() => replaceFileInputRef.current?.click()}
                    className="mt-2.5 w-full py-2 px-3 rounded-md bg-[#e26f5b] hover:bg-[#b84d3b] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Replace File</span>
                  </button>
                </div>
              )}

              {/* Main File Upload Dropzone */}
              <label className="w-full p-5 border-2 border-dashed border-[#cfc9c1] hover:border-[#e26f5b] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#faf9f7] hover:bg-white text-center transition-all group shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-[#eeece8] flex items-center justify-center text-[#e26f5b] group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-[#20201f]">
                    Upload Image or Logo
                  </span>
                  <small className="text-[10px] text-[#817e79]">
                    PNG, JPG, WEBP, or SVG
                  </small>
                </div>
                <span className="text-[10px] text-[#e26f5b] font-medium underline">
                  Browse from computer
                </span>
                <input
                  type="file"
                  accept="image/*,.svg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Quick Graphics & Accents */}
              <div className="pt-2 border-t border-[#f0eeeb] space-y-2">
                <span className="text-[10px] font-bold text-[#817e79] uppercase tracking-wider">
                  Quick Accents
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      addElement({
                        id: `seal-${Date.now()}`,
                        type: 'shape',
                        name: 'Official Seal',
                        shapeType: 'circle',
                        x: Math.round(design.canvas.width / 2 - 40),
                        y: Math.round(design.canvas.height / 2 - 40),
                        width: 80,
                        height: 80,
                        fill: '#e26f5b',
                        stroke: '#ffffff',
                        strokeWidth: 3,
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
                      })
                    }}
                    className="p-2.5 rounded-lg border border-[#e4e1dc] bg-[#faf9f7] hover:bg-white text-left flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#e26f5b] shrink-0" />
                    <span className="text-[11px] font-semibold text-[#20201f]">Seal Badge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      addElement({
                        id: `pill-${Date.now()}`,
                        type: 'shape',
                        name: 'Dark Tag',
                        shapeType: 'rectangle',
                        x: Math.round(design.canvas.width / 2 - 60),
                        y: Math.round(design.canvas.height / 2 - 20),
                        width: 120,
                        height: 40,
                        fill: '#242322',
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
                      })
                    }}
                    className="p-2.5 rounded-lg border border-[#e4e1dc] bg-[#faf9f7] hover:bg-white text-left flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <div className="w-6 h-3 rounded-xs bg-[#242322] shrink-0" />
                    <span className="text-[11px] font-semibold text-[#20201f]">Dark Tag</span>
                  </button>
                </div>
              </div>

              {/* Gallery of Uploaded Media */}
              {uploadedImages.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#f0eeeb]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#817e79] uppercase tracking-wider">
                      Recent Uploads ({uploadedImages.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setUploadedImages([])}
                      className="text-[10px] text-[#817e79] hover:text-[#d44333] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedImages.map((src, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (selectedElement && (selectedElement.type === 'image' || selectedElement.type === 'logo')) {
                            updateElement(selectedElement.id, { src } as any)
                          } else {
                            addElement({
                              id: `img-${Date.now()}`,
                              type: 'image',
                              name: 'Uploaded Image',
                              src,
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
                                locked: false,
                                required: false,
                                visible: true,
                              },
                            })
                          }
                        }}
                        className="group relative aspect-4/3 rounded-lg border border-[#e4e1dc] bg-[#faf9f7] p-1.5 cursor-pointer hover:border-[#e26f5b] hover:shadow-xs overflow-hidden transition-all"
                        title="Click to insert or replace"
                      >
                        <img src={src} alt="Upload" className="w-full h-full object-contain" />
                        <span className="absolute inset-0 bg-[#242322]/80 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center text-center p-1 transition-opacity">
                          {selectedElement && (selectedElement.type === 'image' || selectedElement.type === 'logo')
                            ? 'Replace selected'
                            : '+ Add to design'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: TEXT (Add Typography like Canva) */}
          {activeTool === 'text' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-[#20201f] uppercase tracking-wider">Typography</h3>
                <p className="text-[10px] text-[#817e79] mt-0.5">Click to add text directly to the canvas</p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleAddTypography('heading')}
                  className="w-full py-3.5 px-3 rounded-lg bg-[#242322] text-white text-base font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:bg-[#38332f] transition-all"
                >
                  <Plus className="w-4 h-4 text-[#e26f5b]" />
                  <span>Add a heading</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTypography('subheading')}
                  className="w-full py-2.5 px-3 rounded-lg bg-[#faf9f7] hover:bg-white border border-[#e4e1dc] text-[#242322] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-[#e26f5b]" />
                  <span>Add a subheading</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTypography('body')}
                  className="w-full py-2 px-3 rounded-lg bg-[#faf9f7] hover:bg-white border border-[#e4e1dc] text-[#6e6861] text-xs font-normal flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-[#e26f5b]" />
                  <span>Add a little bit of body text</span>
                </button>
              </div>

              <div className="pt-3 border-t border-[#f0eeeb]">
                <p className="text-[10px] text-[#817e79] leading-relaxed">
                  💡 <strong>Tip:</strong> Click any text directly on the canvas to edit, format font, or drag corner handles to resize.
                </p>
              </div>
            </div>
          )}

          {/* TAB: ELEMENTS (Shapes & Accents) */}
          {activeTool === 'elements' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-[#20201f] uppercase tracking-wider">Shapes & Elements</h3>
                <p className="text-[10px] text-[#817e79] mt-0.5">Vector shapes and decorative blocks</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddShape('rectangle')}
                  className="p-3 border border-[#e4e1dc] rounded-md bg-[#faf9f7] hover:bg-white font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all"
                >
                  <div className="w-8 h-5 bg-[#e26f5b] rounded-xs shadow-2xs" />
                  <span className="text-[11px] text-[#242322]">Rectangle</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddShape('circle')}
                  className="p-3 border border-[#e4e1dc] rounded-md bg-[#faf9f7] hover:bg-white font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all"
                >
                  <div className="w-6 h-6 bg-[#e26f5b] rounded-full shadow-2xs" />
                  <span className="text-[11px] text-[#242322]">Circle</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: LAYERS (Canva-style Layer List with Unhide & Reorder) */}
          {activeTool === 'settings' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#20201f] uppercase tracking-wider">Layers</h3>
                  <p className="text-[10px] text-[#817e79] mt-0.5">Toggle visibility, lock or reorder</p>
                </div>
                <span className="text-[10px] font-mono text-[#817e79] bg-[#f0eeeb] px-1.5 py-0.5 rounded">
                  {design.elements.length}
                </span>
              </div>

              <div className="space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                {[...design.elements].reverse().map((el) => {
                  const isSelected = selectedElementId === el.id
                  const isHidden = !el.permissions.visible

                  return (
                    <div
                      key={el.id}
                      onClick={() => selectElement(el.id)}
                      className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-50 border-[#e26f5b] font-semibold text-[#20201f] shadow-2xs'
                          : isHidden
                          ? 'bg-[#f7f5f2] border-dashed border-[#e4e1dc] text-[#99938d] opacity-60'
                          : 'bg-[#faf9f7] border-[#e4e1dc] hover:bg-white text-[#4a4642]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span className="text-[10px] text-[#817e79] uppercase font-bold shrink-0">
                          {el.type === 'text' ? 'T' : el.type === 'shape' ? '■' : 'IMG'}
                        </span>
                        <span className={`truncate text-[11px] ${isHidden ? 'line-through' : ''}`}>
                          {el.name}
                        </span>
                        {el.groupId && (
                          <span className="text-[8px] bg-[#f0eeeb] text-[#817e79] px-1 py-0.2 rounded shrink-0">
                            Group
                          </span>
                        )}
                        {isHidden && (
                          <span className="text-[8px] bg-red-100 text-red-600 px-1 py-0.2 rounded font-semibold shrink-0">
                            Hidden
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Lock / Unlock */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLock(el.id)
                          }}
                          className="p-1 text-[#817e79] hover:text-[#20201f] cursor-pointer"
                          title={el.permissions.locked ? 'Unlock' : 'Lock'}
                        >
                          {el.permissions.locked ? (
                            <Lock className="w-3 h-3 text-red-500" />
                          ) : (
                            <Unlock className="w-3 h-3 text-[#b5afa7]" />
                          )}
                        </button>

                        {/* Visibility (Hide / Unhide) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleVisibility(el.id)
                          }}
                          className="p-1 hover:text-[#20201f] cursor-pointer"
                          title={el.permissions.visible ? 'Hide layer' : 'Unhide layer'}
                        >
                          {el.permissions.visible ? (
                            <Eye className="w-3.5 h-3.5 text-[#817e79]" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Center Stage & Canvas (Canva Workspace) */}
        <div className="flex-1 flex flex-col bg-[#e9e6e1] overflow-hidden">
          {/* Canva Top Contextual Property Bar */}
          <div className="min-h-11 bg-white border-b border-[#e4e1dc] px-4 py-1 flex items-center justify-between shrink-0 gap-2 z-15">
            {/* Contextual Properties for Selected Element */}
            {selectedElement ? (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* TEXT ELEMENT CONTEXTUAL CONTROLS */}
                {selectedElement.type === 'text' && (
                  <>
                    {/* Direct Text Input in Top Bar */}
                    <div className="flex items-center gap-1.5 bg-[#faf9f7] border border-[#e4e1dc] rounded-md px-2 py-0.5 max-w-[200px]" title="Edit text directly">
                      <span className="text-[10px] font-semibold text-[#817e79] shrink-0">Text:</span>
                      <input
                        ref={topBarInputRef}
                        type="text"
                        value={(selectedElement as TextElement).text}
                        onChange={(e) => updateElement(selectedElement.id, { text: e.target.value } as any)}
                        onSelect={(e) => {
                          const target = e.currentTarget
                          setTopBarSelection({ start: target.selectionStart ?? 0, end: target.selectionEnd ?? 0 })
                        }}
                        onKeyUp={(e) => {
                          const target = e.currentTarget
                          setTopBarSelection({ start: target.selectionStart ?? 0, end: target.selectionEnd ?? 0 })
                        }}
                        onMouseUp={(e) => {
                          const target = e.currentTarget
                          setTopBarSelection({ start: target.selectionStart ?? 0, end: target.selectionEnd ?? 0 })
                        }}
                        placeholder="Edit text..."
                        className="w-full text-xs text-[#20201f] bg-transparent outline-none font-medium truncate"
                      />
                    </div>

                    <span className="w-px h-5 bg-[#e4e1dc]" />

                    <FontPicker
                      selectedFont={(selectedElement as TextElement).fontFamily || 'Inter'}
                      onSelectFont={(family) => {
                        originalFontRef.current = null
                        updateElement(selectedElement.id, { fontFamily: family } as any, true)
                      }}
                      onPreviewFont={(family) => {
                        if (!originalFontRef.current) {
                          originalFontRef.current = (selectedElement as TextElement).fontFamily || 'Inter'
                        }
                        updateElement(selectedElement.id, { fontFamily: family } as any, false)
                      }}
                      onRevertFont={() => {
                        if (originalFontRef.current) {
                          updateElement(selectedElement.id, { fontFamily: originalFontRef.current } as any, false)
                          originalFontRef.current = null
                        }
                      }}
                      compact={true}
                      placement="docked-left"
                    />

                    <span className="w-px h-5 bg-[#e4e1dc]" />

                    {/* Font Size - / + and input */}
                    <div className="flex items-center gap-1 bg-[#f0eeeb] rounded-md p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const s = (selectedElement as TextElement).fontSize || 24
                          updateElement(selectedElement.id, { fontSize: Math.max(8, s - 2) } as any)
                        }}
                        className="p-1 rounded hover:bg-white text-[#242322] cursor-pointer"
                        title="Decrease Font Size"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={(selectedElement as TextElement).fontSize}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) } as any)}
                        className="w-10 h-6 text-center text-xs font-bold bg-white rounded border border-[#e4e1dc] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const s = (selectedElement as TextElement).fontSize || 24
                          updateElement(selectedElement.id, { fontSize: Math.min(240, s + 2) } as any)
                        }}
                        className="p-1 rounded hover:bg-white text-[#242322] cursor-pointer"
                        title="Increase Font Size"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="w-px h-5 bg-[#e4e1dc]" />

                    {/* Text Color Swatch */}
                    <label
                      className="w-6 h-6 rounded-md border border-[#e4e1dc] cursor-pointer shadow-2xs flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: (selectedElement as TextElement).fill || '#000000' }}
                      title="Text Color"
                    >
                      <input
                        type="color"
                        value={(selectedElement as TextElement).fill || '#000000'}
                        onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value } as any)}
                        className="opacity-0 w-0 h-0 cursor-pointer"
                      />
                    </label>

                    {/* Bold Toggle - Formats marked word or toggles element weight */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={() =>
                        toggleTextBold(
                          selectedElement as TextElement,
                          (id, updates) => updateElement(id, updates as any),
                          topBarInputRef,
                          topBarSelection
                        )
                      }
                      className={`p-1.5 rounded-md border cursor-pointer transition-colors ${
                        (selectedElement as TextElement).fontWeight === 700 ||
                        (selectedElement as TextElement).fontWeight === 'bold' ||
                        (selectedElement as TextElement).text.includes('**')
                          ? 'bg-[#242322] border-[#242322] text-white font-bold'
                          : 'bg-[#faf9f7] border-[#e4e1dc] text-[#6e6861] hover:bg-white'
                      }`}
                      title="Bold marked word (or toggle bold)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>

                    {/* Italic Toggle - Formats marked word or toggles element style */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={() =>
                        toggleTextItalic(
                          selectedElement as TextElement,
                          (id, updates) => updateElement(id, updates as any),
                          topBarInputRef,
                          topBarSelection
                        )
                      }
                      className={`p-1.5 rounded-md border cursor-pointer transition-colors ${
                        (selectedElement as TextElement).fontStyle === 'italic' ||
                        (selectedElement as TextElement).text.includes('*')
                          ? 'bg-[#242322] border-[#242322] text-white font-bold'
                          : 'bg-[#faf9f7] border-[#e4e1dc] text-[#6e6861] hover:bg-white'
                      }`}
                      title="Italic marked word (or toggle italic)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>

                    {/* Alignment */}
                    <div className="flex items-center bg-[#f0eeeb] p-0.5 rounded-md">
                      <button
                        type="button"
                        onClick={() => updateElement(selectedElement.id, { textAlign: 'left' } as any)}
                        className={`p-1 rounded cursor-pointer ${
                          (selectedElement as TextElement).textAlign === 'left' || !(selectedElement as TextElement).textAlign
                            ? 'bg-white shadow-2xs text-[#20201f]'
                            : 'text-[#817e79] hover:text-[#20201f]'
                        }`}
                        title="Align Left"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateElement(selectedElement.id, { textAlign: 'center' } as any)}
                        className={`p-1 rounded cursor-pointer ${
                          (selectedElement as TextElement).textAlign === 'center'
                            ? 'bg-white shadow-2xs text-[#20201f]'
                            : 'text-[#817e79] hover:text-[#20201f]'
                        }`}
                        title="Align Center"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateElement(selectedElement.id, { textAlign: 'right' } as any)}
                        className={`p-1 rounded cursor-pointer ${
                          (selectedElement as TextElement).textAlign === 'right'
                            ? 'bg-white shadow-2xs text-[#20201f]'
                            : 'text-[#817e79] hover:text-[#20201f]'
                        }`}
                        title="Align Right"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}

                {/* IMAGE / LOGO CONTEXTUAL CONTROLS */}
                {(selectedElement.type === 'image' || selectedElement.type === 'logo') && (
                  <button
                    type="button"
                    onClick={() => replaceFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#e26f5b] hover:bg-[#b84d3b] text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{selectedElement.type === 'logo' || selectedElement.id.includes('logo') ? 'Change Logo' : 'Change Image'}</span>
                  </button>
                )}

                {/* SHAPE CONTEXTUAL CONTROLS */}
                {selectedElement.type === 'shape' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#6e6861]">Color:</span>
                    <label
                      className="w-6 h-6 rounded-md border border-[#e4e1dc] cursor-pointer shadow-2xs flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: selectedElement.fill || '#e6aa8f' }}
                      title="Shape Fill Color"
                    >
                      <input
                        type="color"
                        value={selectedElement.fill || '#e6aa8f'}
                        onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value } as any)}
                        className="opacity-0 w-0 h-0 cursor-pointer"
                      />
                    </label>
                  </div>
                )}

                <span className="w-px h-5 bg-[#e4e1dc]" />

                {/* GROUP / UNGROUP TOGGLE */}
                <button
                  type="button"
                  onClick={() => toggleGroup(selectedElement.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                    selectedElement.groupId
                      ? 'bg-[#e26f5b] text-white font-semibold'
                      : 'bg-[#faf9f7] hover:bg-[#f0eeeb] border border-[#e4e1dc] text-[#4a4642]'
                  }`}
                  title={selectedElement.groupId ? 'Ungroup items' : 'Group items together'}
                >
                  {selectedElement.groupId ? <Unlink className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                  <span>{selectedElement.groupId ? 'Ungroup' : 'Group'}</span>
                </button>

                {/* DUPLICATE */}
                <button
                  type="button"
                  onClick={() => duplicateElement(selectedElement.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#f0eeeb] text-xs font-medium text-[#4a4642] cursor-pointer"
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>

                {/* HIDE / DELETE */}
                <button
                  type="button"
                  onClick={() => deleteElement(selectedElement.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 text-xs font-medium text-red-600 cursor-pointer"
                  title="Delete element (hides in layers, undoable)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            ) : (
              /* Canvas Global Properties when nothing is selected */
              <div className="flex items-center gap-2 text-xs text-[#6e6861]">
                <span className="text-[11px] text-[#817e79]">
                  💡 Click any text or logo directly on the canvas to customize
                </span>
              </div>
            )}

            {/* Right: Zoom Control */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6e6861] shrink-0">
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

          {/* Canva Interactive Canvas Viewport */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[#e9e6e1]">
            <CanvasRenderer
              design={design}
              selectedElementId={selectedElementId}
              zoom={zoom}
              onSelectElement={selectElement}
              onUpdateElementPosition={(id, x, y) => updateElement(id, { x, y } as any)}
              onUpdateElement={(id, updates) => updateElement(id, updates as any)}
              onUpdateMultiplePositions={(updates) => updateMultipleElementsPositions(updates)}
              onDuplicateElement={duplicateElement}
              onDeleteElement={deleteElement}
              onToggleGroup={toggleGroup}
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

            <div className="flex items-center gap-2 text-[#99938d]">
              <span>Shortcuts: Ctrl+Z Undo · Ctrl+Y Redo · Del Delete · Esc Deselect</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Dialogs */}
      <DownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        design={design}
        designTitle={metadata.title || 'My Design'}
      />

      <PrintOrderDialog
        isOpen={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        design={design}
        metadata={metadata}
        onOrderSuccess={() => setPrintDialogOpen(false)}
      />

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full space-y-4 border border-[#e4e1dc]">
            <h3 className="text-base font-bold text-[#20201f]">Unsaved Changes</h3>
            <p className="text-xs text-[#817e79]">
              You have unsaved changes in your design. Would you like to save them before leaving?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={exitEditor}
                className="px-3 py-1.5 text-xs text-[#817e79] hover:text-[#20201f] cursor-pointer"
              >
                Discard & Leave
              </button>
              <button
                type="button"
                onClick={handleSaveAndExit}
                disabled={isSavingAndExiting}
                className="px-4 py-1.5 rounded-lg bg-[#e26f5b] hover:bg-[#b84d3b] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isSavingAndExiting ? 'Saving...' : 'Save & Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
