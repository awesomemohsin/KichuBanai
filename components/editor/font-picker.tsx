'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { AVAILABLE_FONTS, FontOption, getFontByFamilyOrName, ensureFontLoaded } from '@/lib/fonts/font-catalog'

interface FontPickerProps {
  selectedFont: string
  onSelectFont: (fontFamily: string, fontName: string) => void
  onPreviewFont?: (fontFamily: string) => void
  onRevertFont?: () => void
  compact?: boolean
  forceDropUp?: boolean
  placement?: 'auto' | 'top' | 'bottom' | 'side-left' | 'side-right' | 'docked-left'
  customDropdownStyle?: React.CSSProperties
  className?: string
}

export function FontPicker({
  selectedFont,
  onSelectFont,
  onPreviewFont,
  onRevertFont,
  compact = false,
  forceDropUp = false,
  placement = 'auto',
  customDropdownStyle,
  className = '',
}: FontPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | 'sans-serif' | 'serif' | 'display' | 'handwriting'>('all')
  const [dropUp, setDropUp] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentOption = getFontByFamilyOrName(selectedFont) || {
    id: 'custom',
    name: selectedFont.split(',')[0].replace(/['"]/g, '').trim() || 'Inter',
    family: selectedFont,
    category: 'sans-serif' as const,
    isGoogleFont: false,
    weights: [400],
  }

  // Preload all Google Fonts in background so live previews are instant
  useEffect(() => {
    AVAILABLE_FONTS.forEach((f) => {
      if (f.isGoogleFont) {
        ensureFontLoaded(f.family)
      }
    })
  }, [])

  // Detect whether to open upwards or downwards based on viewport space if placement is auto
  useEffect(() => {
    if (isOpen && dropdownRef.current && placement === 'auto') {
      if (forceDropUp || compact) {
        const rect = dropdownRef.current.getBoundingClientRect()
        if (rect.top > 260) {
          setDropUp(true)
          return
        }
      }

      const rect = dropdownRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      if (spaceBelow < 340) {
        setDropUp(true)
      } else {
        setDropUp(false)
      }
    }
  }, [isOpen, compact, forceDropUp, placement])

  // Close when clicking outside and revert preview if not chosen
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onRevertFont?.()
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onRevertFont])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onRevertFont?.()
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onRevertFont])

  const filteredFonts = AVAILABLE_FONTS.filter((font) => {
    const matchesSearch =
      font.name.toLowerCase().includes(search.toLowerCase()) ||
      font.category.toLowerCase().includes(search.toLowerCase())
    const matchesCat = category === 'all' || font.category === category
    return matchesSearch && matchesCat
  })

  const getDropdownStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      maxHeight: '340px',
      width: '280px',
      backgroundColor: '#ffffff',
      opacity: 1,
      zIndex: 99999,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15)',
    }

    if (customDropdownStyle) {
      return {
        ...baseStyle,
        ...customDropdownStyle,
      }
    }

    if (placement === 'docked-left') {
      return {
        ...baseStyle,
        position: 'fixed',
        left: '375px',
        top: '105px',
        width: '280px',
        maxHeight: 'calc(100vh - 140px)',
      }
    }

    if (placement === 'side-left') {
      return {
        ...baseStyle,
        right: 'calc(100% + 8px)',
        top: 0,
      }
    }

    if (placement === 'side-right') {
      return {
        ...baseStyle,
        left: 'calc(100% + 8px)',
        top: 0,
      }
    }

    if (placement === 'top' || dropUp) {
      return {
        ...baseStyle,
        left: 0,
        bottom: 'calc(100% + 8px)',
      }
    }

    return {
      ...baseStyle,
      left: 0,
      top: 'calc(100% + 8px)',
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
        onClick={() => {
          if (isOpen) {
            onRevertFont?.()
          }
          setIsOpen(!isOpen)
        }}
        className={`flex items-center justify-between gap-1.5 border border-[#cfc9c1] rounded-md text-left transition-all cursor-pointer shadow-2xs ${
          compact
            ? 'h-7 px-2.5 text-[11px] min-w-[115px] max-w-[145px]'
            : 'w-full h-8.5 px-3 text-xs'
        }`}
        style={{
          backgroundColor: '#ffffff',
          color: '#1d1d1b',
        }}
        title={`Font: ${currentOption.name} (Hover to live preview, click to select)`}
      >
        <span
          className="truncate font-semibold"
          style={{ fontFamily: currentOption.family }}
        >
          {currentOption.name}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#6e6861] shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu - 100% Solid Opaque Background */}
      {isOpen && (
        <div
          className="border border-[#cfc9c1] rounded-xl overflow-hidden flex flex-col"
          style={getDropdownStyle()}
          onMouseDown={(e) => {
            e.stopPropagation()
          }}
        >
          {/* Header */}
          <div
            className="px-3 pt-2.5 pb-2 border-b border-[#eeece8] flex items-center justify-between shrink-0"
            style={{ backgroundColor: '#ffffff' }}
          >
            <span className="text-[11px] font-bold text-[#1d1d1b] uppercase tracking-wider">
              Choose Font
            </span>
            <span className="text-[10px] text-[#817e79] font-medium">
              Hover to preview
            </span>
          </div>

          {/* Search Bar */}
          <div
            className="p-2 border-b border-[#eeece8] flex items-center gap-2 shrink-0"
            style={{ backgroundColor: '#faf9f7' }}
          >
            <Search className="w-3.5 h-3.5 text-[#817e79] shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Search font name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 outline-none text-[#1d1d1b] placeholder:text-[#99938d]"
              autoFocus
            />
          </div>

          {/* Category Tabs */}
          <div
            className="flex gap-1 p-1.5 border-b border-[#eeece8] overflow-x-auto text-[10px] shrink-0"
            style={{ backgroundColor: '#ffffff' }}
          >
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'sans-serif', label: 'Clean' },
                { id: 'serif', label: 'Classic' },
                { id: 'display', label: 'Modern' },
                { id: 'handwriting', label: 'Script' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap cursor-pointer transition-all ${
                  category === tab.id
                    ? 'bg-[#242322] text-white shadow-xs'
                    : 'bg-[#f0eeeb] text-[#6e6861] hover:bg-[#e4e1dc] hover:text-[#1d1d1b]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Font List */}
          <div
            className="overflow-y-auto flex-1 divide-y divide-[#f5f3f0] py-1"
            style={{ backgroundColor: '#ffffff' }}
          >
            {filteredFonts.length === 0 ? (
              <div
                className="p-5 text-center text-xs text-[#817e79]"
                style={{ backgroundColor: '#ffffff' }}
              >
                No fonts matching &quot;{search}&quot;
              </div>
            ) : (
              filteredFonts.map((font) => {
                const isSelected =
                  currentOption.id === font.id ||
                  currentOption.name.toLowerCase() === font.name.toLowerCase()

                return (
                  <button
                    key={font.id}
                    type="button"
                    onMouseEnter={() => {
                      ensureFontLoaded(font.family)
                      onPreviewFont?.(font.family)
                    }}
                    onClick={() => {
                      ensureFontLoaded(font.family)
                      onSelectFont(font.family, font.name)
                      setIsOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/80 font-bold'
                        : 'hover:bg-[#faf9f7]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? '#fff9ec' : '#ffffff',
                    }}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span
                        className="text-sm font-semibold text-[#1d1d1b] truncate"
                        style={{ fontFamily: font.family }}
                      >
                        {font.name}
                      </span>
                      <span
                        className="text-[11px] text-[#716d67] truncate mt-0.5"
                        style={{ fontFamily: font.family }}
                      >
                        {font.previewText || 'Aa Bb Cc 123'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-[#817e79] px-1.5 py-0.5 rounded bg-[#f2f0ec]">
                        {font.category === 'sans-serif'
                          ? 'Sans'
                          : font.category === 'serif'
                          ? 'Serif'
                          : font.category === 'display'
                          ? 'Modern'
                          : 'Script'}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#e26f5b] stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

