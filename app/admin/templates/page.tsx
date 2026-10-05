'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { Template } from '@/types/domain'
import {
  Layers,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Download,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react'

function TemplatesContent() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Create Template Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    category: 'Business Cards',
    sizeLabel: '3.5" × 2"',
    badgeLabel: 'HOT',
    colorTheme: 'terracotta',
    width: '1050',
    height: '600',
    icon: '💼',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inspect JSON Modal
  const [inspectingTemplate, setInspectingTemplate] = useState<Template | null>(null)

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (search.trim()) params.append('search', search.trim())

      const res = await fetch(`/api/admin/templates?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load templates')
      }

      setTemplates(data.templates || [])
    } catch (err: any) {
      setError(err?.message || 'Error loading templates')
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, search])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newTemplate),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create template')
      }

      setSuccessMsg(`Master template "${data.template.metadata.title}" created successfully!`)
      setShowAddModal(false)
      fetchTemplates()
    } catch (err: any) {
      setError(err?.message || 'Failed to create template')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadTemplateJson = (tpl: Template) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tpl, null, 2))
    const dl = document.createElement('a')
    dl.setAttribute('href', dataStr)
    dl.setAttribute('download', `${tpl.metadata.slug || tpl.metadata.id}_master.json`)
    dl.click()
  }

  const categories = ['all', 'Menus', 'Cards', 'Business Cards', 'Social Media', 'Badges', 'Events']

  return (
    <div className="space-y-6">
      {/* Top Header matching Parle Bangladesh */}
      <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-xl font-bold text-gray-900 italic uppercase tracking-tight">
            Master Templates Registry
          </h1>
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
            Vector Design Specs
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchTemplates()}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Refresh templates"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-600 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Template</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar matching Parle Bangladesh */}
      <div className="flex flex-col xl:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="w-full xl:flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm font-bold bg-gray-50/20"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto">
          <div className="relative w-full xl:w-48">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 hidden sm:block" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-2 sm:pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs font-bold uppercase bg-white cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? `All Categories (${templates.length})` : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
              <span>Loading registered master templates...</span>
            </div>
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-300 font-bold uppercase tracking-widest text-[10px] bg-white rounded-xl border border-dashed border-gray-200">
            No templates found matching your search.
          </div>
        ) : (
          templates.map((tpl) => (
            <Card
              key={tpl.metadata.id}
              className="p-0 overflow-hidden border border-gray-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow group flex flex-col"
            >
              {/* Art Preview Header */}
              <div
                className={`p-6 relative text-white ${
                  tpl.metadata.colorTheme === 'sunset'
                    ? 'bg-rose-600'
                    : tpl.metadata.colorTheme === 'sage'
                    ? 'bg-emerald-700'
                    : tpl.metadata.colorTheme === 'lavender'
                    ? 'bg-indigo-600'
                    : 'bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{tpl.metadata.icon}</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/30 text-white tracking-wider">
                    {tpl.metadata.badgeLabel}
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">
                    {tpl.metadata.category}
                  </span>
                  <h3 className="text-lg font-black tracking-tight leading-snug drop-shadow-xs italic">
                    {tpl.metadata.title}
                  </h3>
                </div>
              </div>

              {/* Template Technical Meta */}
              <div className="p-4 flex-1 flex flex-col justify-between text-xs space-y-3">
                <div className="space-y-1.5 text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold uppercase text-[10px]">Dimensions:</span>
                    <span className="font-bold text-gray-900">
                      {tpl.design.canvas.width} × {tpl.design.canvas.height}px ({tpl.metadata.sizeLabel})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold uppercase text-[10px]">Bleed Margin:</span>
                    <span className="font-bold text-emerald-600">✓ {tpl.design.canvas.bleedMm || 3}mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold uppercase text-[10px]">Safe Area:</span>
                    <span className="font-bold text-emerald-600">✓ {tpl.design.canvas.safeMarginMm || 5}mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold uppercase text-[10px]">Layers:</span>
                    <span className="font-bold text-gray-900">{tpl.design.elements.length} elements</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setInspectingTemplate(tpl)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                    title="View Design JSON"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDownloadTemplateJson(tpl)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                    title="Download JSON Spec"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={`/designs/tpl_${tpl.metadata.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                  >
                    <span>Open in Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Master Template Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-600" />
                <h3 className="font-black text-base text-gray-900 uppercase italic">
                  Register Master Template
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Template Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Luxe Business Card"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none cursor-pointer uppercase font-bold"
                  >
                    <option value="Business Cards">Business Cards</option>
                    <option value="Menus">Menus</option>
                    <option value="Cards">Cards</option>
                    <option value="Badges">Badges</option>
                    <option value="Events">Events</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={newTemplate.badgeLabel}
                    onChange={(e) => setNewTemplate({ ...newTemplate, badgeLabel: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Canvas Width (px)
                  </label>
                  <input
                    type="number"
                    value={newTemplate.width}
                    onChange={(e) => setNewTemplate({ ...newTemplate, width: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Canvas Height (px)
                  </label>
                  <input
                    type="number"
                    value={newTemplate.height}
                    onChange={(e) => setNewTemplate({ ...newTemplate, height: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Registering...' : 'Register Master Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Template JSON Modal */}
      {inspectingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-red-600" />
                <h3 className="font-black text-base text-gray-900 uppercase italic">
                  Master Design JSON: {inspectingTemplate.metadata.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectingTemplate(null)}
                className="text-gray-400 hover:text-gray-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4">
              <pre className="p-4 rounded-xl bg-gray-900 text-emerald-400 font-mono text-[11px] max-h-96 overflow-y-auto custom-scrollbar">
                {JSON.stringify(inspectingTemplate, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                onClick={() => setInspectingTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadTemplateJson(inspectingTemplate)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Master JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminTemplatesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400 font-bold uppercase">Loading Templates...</div>}>
      <TemplatesContent />
    </Suspense>
  )
}
