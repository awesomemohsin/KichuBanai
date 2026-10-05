import { create } from 'zustand'
import { DesignData, DesignElement, DesignMetadata, Template, TextElement } from '@/types/domain'
import { DEFAULT_TEMPLATES } from '@/lib/templates/template-registry'

export type EditorMode = 'quick' | 'full'
export type EditorTool = 'templates' | 'text' | 'uploads' | 'elements' | 'styles' | 'settings'
export type SaveStatus = 'saved' | 'saving' | 'unsaved'

interface EditorHistoryEntry {
  design: DesignData
  metadata: DesignMetadata
}

export interface EditorState {
  // Current active design & metadata
  design: DesignData
  metadata: DesignMetadata
  selectedElementId: string | null
  activeTool: EditorTool
  editorMode: EditorMode
  zoom: number
  saveStatus: SaveStatus

  // Undo / Redo history
  past: EditorHistoryEntry[]
  future: EditorHistoryEntry[]

  // Actions
  loadFromTemplate: (template: Template) => void
  loadDesign: (design: DesignData, metadata: DesignMetadata) => void
  setEditorMode: (mode: EditorMode) => void
  setActiveTool: (tool: EditorTool) => void
  setZoom: (zoom: number) => void
  selectElement: (id: string | null) => void

  updateElement: (id: string, updates: Partial<DesignElement>) => void
  updateQuickEditField: (fieldKey: string, value: string) => void
  addElement: (element: DesignElement) => void
  deleteElement: (id: string) => void
  duplicateElement: (id: string) => void
  toggleLock: (id: string) => void
  toggleVisibility: (id: string) => void
  reorderLayer: (id: string, direction: 'up' | 'down') => void

  undo: () => void
  redo: () => void
  saveDesign: () => Promise<void>
  initDesignWithId: (id: string, templateId?: string | null) => void
}

const LOCAL_STORAGE_KEY_PREFIX = 'kichubanai_draft_'

export const useEditorStore = create<EditorState>((set, get) => {
  const initialTemplate = DEFAULT_TEMPLATES[0]
  const initialMetadata: DesignMetadata = {
    id: `design-${Date.now()}`,
    ownerId: 'alex-morgan-guest',
    templateId: initialTemplate.metadata.id,
    templateVersion: initialTemplate.metadata.version,
    title: initialTemplate.metadata.title,
    category: initialTemplate.metadata.category,
    schemaVersion: 1,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Deep clone helper
  const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

  return {
    design: clone(initialTemplate.design),
    metadata: initialMetadata,
    selectedElementId: null,
    activeTool: 'templates',
    editorMode: 'quick',
    zoom: 1,
    saveStatus: 'saved',
    past: [],
    future: [],

    loadFromTemplate: (template: Template) => {
      const newDesign = clone(template.design)
      const newMetadata: DesignMetadata = {
        id: `design-${Date.now()}`,
        ownerId: 'alex-morgan-guest',
        templateId: template.metadata.id,
        templateVersion: template.metadata.version,
        title: template.metadata.title,
        category: template.metadata.category,
        schemaVersion: 1,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      set({
        design: newDesign,
        metadata: newMetadata,
        selectedElementId: null,
        past: [],
        future: [],
        saveStatus: 'saved',
      })
    },

    loadDesign: (design: DesignData, metadata: DesignMetadata) => {
      set({
        design: clone(design),
        metadata: clone(metadata),
        selectedElementId: null,
        past: [],
        future: [],
        saveStatus: 'saved',
      })
    },

    initDesignWithId: (id: string, templateId?: string | null) => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${id}`)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            set({
              design: clone(parsed.design),
              metadata: clone(parsed.metadata),
              selectedElementId: null,
              past: [],
              future: [],
              saveStatus: 'saved',
            })
            return
          } catch (e) {
            console.error('Failed to parse draft from localStorage:', e)
          }
        }
      }

      const matchedTemplate = templateId
        ? DEFAULT_TEMPLATES.find((t) => t.metadata.id === templateId || t.metadata.slug === templateId)
        : null

      if (matchedTemplate) {
        const newDesign = clone(matchedTemplate.design)
        const newMetadata: DesignMetadata = {
          id,
          ownerId: 'alex-morgan-guest',
          templateId: matchedTemplate.metadata.id,
          templateVersion: matchedTemplate.metadata.version,
          title: matchedTemplate.metadata.title,
          category: matchedTemplate.metadata.category,
          schemaVersion: 1,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set({
          design: newDesign,
          metadata: newMetadata,
          selectedElementId: null,
          past: [],
          future: [],
          saveStatus: 'saved',
        })
      } else {
        const blankDesign: DesignData = {
          schemaVersion: 1,
          canvas: {
            width: 1050,
            height: 600,
            unit: 'px',
            orientation: 'landscape',
            bleedMm: 3,
            safeMarginMm: 4,
          },
          background: { color: '#ffffff' },
          fontsUsed: ['Inter'],
          elements: [],
        }

        const blankMetadata: DesignMetadata = {
          id,
          ownerId: 'alex-morgan-guest',
          title: `Untitled Design #${id}`,
          category: 'Custom',
          schemaVersion: 1,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set({
          design: blankDesign,
          metadata: blankMetadata,
          selectedElementId: null,
          past: [],
          future: [],
          saveStatus: 'saved',
        })
      }
    },

    setEditorMode: (mode: EditorMode) => set({ editorMode: mode }),
    setActiveTool: (tool: EditorTool) => set({ activeTool: tool }),
    setZoom: (zoom: number) => set({ zoom }),
    selectElement: (id: string | null) => set({ selectedElementId: id }),

    updateElement: (id: string, updates: Partial<DesignElement>) => {
      const state = get()
      const element = state.design.elements.find((el) => el.id === id)
      if (!element || element.permissions.locked) return

      // Push to undo history
      const currentEntry: EditorHistoryEntry = {
        design: clone(state.design),
        metadata: clone(state.metadata),
      }

      const updatedElements = state.design.elements.map((el) => {
        if (el.id === id) {
          return { ...el, ...updates } as DesignElement
        }
        return el
      })

      set({
        past: [...state.past.slice(-20), currentEntry],
        future: [],
        design: {
          ...state.design,
          elements: updatedElements,
        },
        saveStatus: 'unsaved',
      })
    },

    updateQuickEditField: (fieldKey: string, value: string) => {
      const state = get()
      const matchingElements = state.design.elements.filter(
        (el) => (el as TextElement).quickEditKey === fieldKey && el.permissions.editable
      )

      if (matchingElements.length === 0) return

      const currentEntry: EditorHistoryEntry = {
        design: clone(state.design),
        metadata: clone(state.metadata),
      }

      const updatedElements = state.design.elements.map((el) => {
        if ((el as TextElement).quickEditKey === fieldKey) {
          return { ...el, text: value } as DesignElement
        }
        return el
      })

      set({
        past: [...state.past.slice(-20), currentEntry],
        future: [],
        design: {
          ...state.design,
          elements: updatedElements,
        },
        saveStatus: 'unsaved',
      })
    },

    addElement: (newElement: DesignElement) => {
      const state = get()
      const currentEntry: EditorHistoryEntry = {
        design: clone(state.design),
        metadata: clone(state.metadata),
      }

      set({
        past: [...state.past.slice(-20), currentEntry],
        future: [],
        design: {
          ...state.design,
          elements: [...state.design.elements, newElement],
        },
        selectedElementId: newElement.id,
        saveStatus: 'unsaved',
      })
    },

    deleteElement: (id: string) => {
      const state = get()
      const element = state.design.elements.find((el) => el.id === id)
      if (!element || !element.permissions.deletable || element.permissions.locked) return

      const currentEntry: EditorHistoryEntry = {
        design: clone(state.design),
        metadata: clone(state.metadata),
      }

      set({
        past: [...state.past.slice(-20), currentEntry],
        future: [],
        design: {
          ...state.design,
          elements: state.design.elements.filter((el) => el.id !== id),
        },
        selectedElementId: null,
        saveStatus: 'unsaved',
      })
    },

    duplicateElement: (id: string) => {
      const state = get()
      const element = state.design.elements.find((el) => el.id === id)
      if (!element) return

      const duplicated: DesignElement = {
        ...clone(element),
        id: `el-${Date.now()}`,
        name: `${element.name} (Copy)`,
        x: element.x + 20,
        y: element.y + 20,
        zIndex: state.design.elements.length + 1,
      }

      get().addElement(duplicated)
    },

    toggleLock: (id: string) => {
      const state = get()
      const element = state.design.elements.find((el) => el.id === id)
      if (!element) return

      const updatedElements = state.design.elements.map((el) => {
        if (el.id === id) {
          return {
            ...el,
            permissions: {
              ...el.permissions,
              locked: !el.permissions.locked,
            },
          }
        }
        return el
      })

      set({
        design: { ...state.design, elements: updatedElements },
        saveStatus: 'unsaved',
      })
    },

    toggleVisibility: (id: string) => {
      const state = get()
      const element = state.design.elements.find((el) => el.id === id)
      if (!element) return

      const updatedElements = state.design.elements.map((el) => {
        if (el.id === id) {
          return {
            ...el,
            permissions: {
              ...el.permissions,
              visible: !el.permissions.visible,
            },
          }
        }
        return el
      })

      set({
        design: { ...state.design, elements: updatedElements },
        saveStatus: 'unsaved',
      })
    },

    reorderLayer: (id: string, direction: 'up' | 'down') => {
      const state = get()
      const index = state.design.elements.findIndex((el) => el.id === id)
      if (index === -1) return
      if (direction === 'up' && index === state.design.elements.length - 1) return
      if (direction === 'down' && index === 0) return

      const elements = [...state.design.elements]
      const targetIndex = direction === 'up' ? index + 1 : index - 1
      const temp = elements[index]
      elements[index] = elements[targetIndex]
      elements[targetIndex] = temp

      // Normalize zIndexes
      elements.forEach((el, idx) => {
        el.zIndex = idx + 1
      })

      set({
        design: { ...state.design, elements },
        saveStatus: 'unsaved',
      })
    },

    undo: () => {
      const { past, design, metadata, future } = get()
      if (past.length === 0) return

      const previous = past[past.length - 1]
      const newPast = past.slice(0, past.length - 1)

      set({
        design: previous.design,
        metadata: previous.metadata,
        past: newPast,
        future: [{ design: clone(design), metadata: clone(metadata) }, ...future],
        saveStatus: 'unsaved',
      })
    },

    redo: () => {
      const { future, design, metadata, past } = get()
      if (future.length === 0) return

      const next = future[0]
      const newFuture = future.slice(1)

      set({
        design: next.design,
        metadata: next.metadata,
        past: [...past, { design: clone(design), metadata: clone(metadata) }],
        future: newFuture,
        saveStatus: 'unsaved',
      })
    },

    saveDesign: async () => {
      const state = get()
      set({ saveStatus: 'saving' })

      try {
        const payload = {
          metadata: {
            ...state.metadata,
            version: state.metadata.version + 1,
            updatedAt: new Date().toISOString(),
          },
          design: state.design,
        }

        // Save local draft to localStorage (Rule 18: Local-first drafts)
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            `${LOCAL_STORAGE_KEY_PREFIX}${state.metadata.id}`,
            JSON.stringify(payload)
          )

          // Also keep an index of saved designs
          const indexKey = 'kichubanai_user_designs_index'
          const existingRaw = localStorage.getItem(indexKey)
          const existingList: Array<{ id: string; title: string; updatedAt: string }> = existingRaw
            ? JSON.parse(existingRaw)
            : []
          const updatedIndex = [
            { id: state.metadata.id, title: state.metadata.title, updatedAt: payload.metadata.updatedAt },
            ...existingList.filter((d) => d.id !== state.metadata.id),
          ]
          localStorage.setItem(indexKey, JSON.stringify(updatedIndex))
        }

        // Simulate network save if syncing
        await new Promise((resolve) => setTimeout(resolve, 350))

        set({
          metadata: payload.metadata,
          saveStatus: 'saved',
        })
      } catch (err) {
        console.error('Failed to autosave design:', err)
        set({ saveStatus: 'unsaved' })
      }
    },
  }
})
