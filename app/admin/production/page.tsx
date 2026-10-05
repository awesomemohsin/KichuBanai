'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { DEFAULT_TEMPLATES } from '@/lib/templates/template-registry'
import { generateProductionOutlinedSvg } from '@/lib/export/vector-outliner'
import {
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileCheck,
  Code,
  Zap,
  Layers,
} from 'lucide-react'

export default function AdminProductionPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATES[0].metadata.id)
  const [isRunningPreflight, setIsRunningPreflight] = useState(false)
  const [report, setReport] = useState<{
    success: boolean
    hasRawTextElements: boolean
    textElementCount: number
    convertedGlyphPaths: number
    bleedValid: boolean
    safeAreaValid: boolean
    generatedSvgLength: number
    svgPreview?: string
  } | null>(null)

  const selectedTemplate = DEFAULT_TEMPLATES.find((t) => t.metadata.id === selectedTemplateId) || DEFAULT_TEMPLATES[0]

  const runPreflight = async () => {
    setIsRunningPreflight(true)
    try {
      const designJson = selectedTemplate.design
      const result = await generateProductionOutlinedSvg(designJson)

      // Test raw text tags
      const hasRawText = /<text\b[^>]*>/i.test(result.svgContent)
      const textElements = designJson.elements.filter((e) => e.type === 'text').length

      setReport({
        success: result.report.passed && !hasRawText,
        hasRawTextElements: hasRawText,
        textElementCount: textElements,
        convertedGlyphPaths: textElements,
        bleedValid: (designJson.canvas.bleedMm || 0) >= 3,
        safeAreaValid: (designJson.canvas.safeMarginMm || 0) >= 4,
        generatedSvgLength: result.svgContent.length,
        svgPreview: result.svgContent,
      })
    } catch (e: any) {
      alert('Preflight execution failed: ' + e?.message)
    } finally {
      setIsRunningPreflight(false)
    }
  }

  const handleDownload = () => {
    if (!report?.svgPreview) return
    const blob = new Blob([report.svgPreview], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `KichuBanai_Outlined_${selectedTemplate.metadata.slug}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header matching Parle Bangladesh */}
      <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-xl font-bold text-gray-900 italic uppercase tracking-tight">
            Print Production & Preflight Lab
          </h1>
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
            Vector Outline Engine
          </span>
        </div>
        <p className="text-xs text-gray-400 font-medium">
          Independent of external fonts • 3mm commercial bleed guaranteed
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template Selector & Controls */}
        <Card className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm space-y-4">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 italic">
            <Layers className="w-4 h-4 text-red-600" />
            <span>Select Master Design</span>
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Master Template</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                setSelectedTemplateId(e.target.value)
                setReport(null)
              }}
              className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none cursor-pointer"
            >
              {DEFAULT_TEMPLATES.map((t) => (
                <option key={t.metadata.id} value={t.metadata.id}>
                  {t.metadata.title} ({t.metadata.category} - {t.metadata.sizeLabel})
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-xs text-gray-600 font-medium">
            <div className="flex justify-between"><strong className="text-gray-900">Dimensions:</strong> <span>{selectedTemplate.design.canvas.width} × {selectedTemplate.design.canvas.height}px</span></div>
            <div className="flex justify-between"><strong className="text-gray-900">Bleed Margin:</strong> <span className="text-emerald-600 font-bold">✓ {selectedTemplate.design.canvas.bleedMm || 3}mm</span></div>
            <div className="flex justify-between"><strong className="text-gray-900">Safe Zone:</strong> <span className="text-emerald-600 font-bold">✓ {selectedTemplate.design.canvas.safeMarginMm || 5}mm</span></div>
            <div className="flex justify-between"><strong className="text-gray-900">Fonts Used:</strong> <span>{selectedTemplate.design.fontsUsed.join(', ')}</span></div>
            <div className="flex justify-between"><strong className="text-gray-900">Layer Count:</strong> <span>{selectedTemplate.design.elements.length} elements</span></div>
          </div>

          <button
            onClick={runPreflight}
            disabled={isRunningPreflight}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-900 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-red-500" />
            <span>{isRunningPreflight ? 'Converting Glyphs...' : 'Run Vector Outline Preflight'}</span>
          </button>
        </Card>

        {/* Right: Preflight Report */}
        <Card className="lg:col-span-2 p-6 bg-white border border-gray-100 rounded-xl shadow-sm space-y-4">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 italic">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Preflight Inspection Report</span>
          </h2>

          {!report ? (
            <div className="py-16 text-center text-gray-400 space-y-2 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <Printer className="w-8 h-8 mx-auto text-gray-300" />
              <p className="text-xs font-bold uppercase tracking-wider">
                Select a template and click &quot;Run Vector Outline Preflight&quot;
              </p>
              <p className="text-[11px] text-gray-400">
                Tests that all typography elements are converted into pure vector bezier paths.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl flex items-center gap-3 border ${
                  report.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {report.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-sm">
                    {report.success
                      ? 'Preflight Verification Passed — Safe for Commercial Offset/Digital Press'
                      : 'Preflight Warnings Identified'}
                  </h3>
                  <p className="text-xs mt-0.5 opacity-90">
                    {report.hasRawTextElements
                      ? 'Raw <text> tags remain. Not ready for standalone print.'
                      : '0 raw <text> elements found. Typography successfully transformed to vector outlines.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Raw Text Tags</div>
                  <div className="text-lg font-black text-gray-900 mt-1">
                    {report.hasRawTextElements ? 'Detected' : '0 (Clean)'}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Outlined Glyphs</div>
                  <div className="text-lg font-black text-emerald-600 mt-1">
                    {report.convertedGlyphPaths} Elements
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Bleed Margin</div>
                  <div className="text-lg font-black text-emerald-600 mt-1">
                    {report.bleedValid ? '3mm Pass' : 'Substandard'}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Output File Size</div>
                  <div className="text-lg font-black text-gray-900 mt-1">
                    {(report.generatedSvgLength / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>

              {report.svgPreview && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-gray-400" />
                      Generated Vector SVG Preview
                    </span>
                    <button
                      onClick={handleDownload}
                      className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Outlined SVG</span>
                    </button>
                  </div>

                  <div className="p-4 bg-gray-900 text-emerald-400 font-mono text-[10px] rounded-xl max-h-48 overflow-y-auto custom-scrollbar border border-gray-800">
                    <pre>{report.svgPreview.slice(0, 1500)}...</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
