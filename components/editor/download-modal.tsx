'use client'

import React, { useState } from 'react'
import { Download, ShieldCheck, Sparkles, X, Check, AlertTriangle } from 'lucide-react'
import { DesignData } from '@/types/domain'
import { renderDesignToJpg } from '@/lib/export/export-service'

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  design: DesignData
  designTitle: string
}

export function DownloadModal({ isOpen, onClose, design, designTitle }: DownloadModalProps) {
  const [isSubscriber, setIsSubscriber] = useState<boolean>(false)
  const [downloading, setDownloading] = useState<boolean>(false)
  const [downloadComplete, setDownloadComplete] = useState<boolean>(false)

  if (!isOpen) return null

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { dataUrl, isWatermarked } = await renderDesignToJpg({
        design,
        isSubscriber,
        watermarkText: 'Preview — KichuBanai',
      })

      // Trigger actual browser download
      const filename = `KichuBanai-${designTitle.toLowerCase().replace(/\s+/g, '-')}${isWatermarked ? '-preview' : '-highres'}.jpg`
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setDownloadComplete(true)
      setTimeout(() => setDownloadComplete(false), 3000)
    } catch (err) {
      console.error('Download export failed:', err)
      alert('Unable to generate download. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#24232299] backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#fbfaf8] rounded-xl shadow-2xl overflow-hidden border border-[#e4e1dc]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e1dc] bg-white">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-[#e26f5b]" />
            <h3 className="text-sm font-bold text-[#20201f] m-0">Download Digital Design</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
            aria-label="Close download modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plan Mode Selector */}
        <div className="p-6 space-y-5">
          <div className="bg-[#f0eeeb] p-1 rounded-lg flex text-xs">
            <button
              type="button"
              onClick={() => setIsSubscriber(false)}
              className={`flex-1 py-2 px-3 rounded-md font-semibold transition-all ${
                !isSubscriber
                  ? 'bg-white text-[#242322] shadow-xs'
                  : 'text-[#817e79] hover:text-[#242322]'
              }`}
            >
              Free Download
            </button>
            <button
              type="button"
              onClick={() => setIsSubscriber(true)}
              className={`flex-1 py-2 px-3 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 ${
                isSubscriber
                  ? 'bg-[#292724] text-white shadow-xs'
                  : 'text-[#817e79] hover:text-[#242322]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#e6aa8f]" />
              Subscriber Plus
            </button>
          </div>

          {/* Details Card */}
          {!isSubscriber ? (
            <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Free Plan Digital Preview</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-amber-800 text-[11px]">
                <li>Standard resolution ({design.canvas.width} × {design.canvas.height} px)</li>
                <li><strong>Permanent watermark</strong> baked into raster pixels</li>
                <li>Suitable for web mockups & previews (not print-ready)</li>
              </ul>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-purple-50/70 border border-purple-200/60 text-xs text-purple-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-purple-950">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Subscriber Verified Access</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-purple-800 text-[11px]">
                <li><strong>High Resolution 2× Retina</strong> ({design.canvas.width * 2} × {design.canvas.height * 2} px)</li>
                <li><strong>100% Clean — Zero Watermarks</strong></li>
                <li>High-fidelity maximum quality JPG compression</li>
              </ul>
            </div>
          )}

          {/* Download Action Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className={`w-full py-3 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 text-white shadow-md transition-all ${
              isSubscriber
                ? 'bg-[#292724] hover:bg-[#3d3a36]'
                : 'bg-[#e26f5b] hover:bg-[#b84d3b]'
            }`}
          >
            {downloading ? (
              <span>Rendering export...</span>
            ) : downloadComplete ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Downloaded Successfully!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isSubscriber ? 'Download High-Res JPG' : 'Download Watermarked Preview'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
