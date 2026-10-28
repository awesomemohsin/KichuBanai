export interface FontOption {
  id: string
  name: string
  family: string
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting'
  previewText?: string
  isGoogleFont: boolean
  weights: number[]
}

export const AVAILABLE_FONTS: FontOption[] = [
  // Sans-Serif
  {
    id: 'inter',
    name: 'Inter',
    family: "'Inter', sans-serif",
    category: 'sans-serif',
    previewText: 'Modern & Clean',
    isGoogleFont: true,
    weights: [300, 400, 500, 600, 700, 800],
  },
  {
    id: 'roboto',
    name: 'Roboto',
    family: "'Roboto', sans-serif",
    category: 'sans-serif',
    previewText: 'Geometric & Clear',
    isGoogleFont: true,
    weights: [300, 400, 500, 700],
  },
  {
    id: 'poppins',
    name: 'Poppins',
    family: "'Poppins', sans-serif",
    category: 'sans-serif',
    previewText: 'Bold & Friendly',
    isGoogleFont: true,
    weights: [400, 500, 600, 700],
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    family: "'Montserrat', sans-serif",
    category: 'sans-serif',
    previewText: 'Urban & Elegant',
    isGoogleFont: true,
    weights: [400, 500, 600, 700, 800],
  },
  {
    id: 'outfit',
    name: 'Outfit',
    family: "'Outfit', sans-serif",
    category: 'sans-serif',
    previewText: 'Minimal & Contemporary',
    isGoogleFont: true,
    weights: [400, 500, 600, 700],
  },
  {
    id: 'plus-jakarta-sans',
    name: 'Plus Jakarta Sans',
    family: "'Plus Jakarta Sans', sans-serif",
    category: 'sans-serif',
    previewText: 'Polished & Professional',
    isGoogleFont: true,
    weights: [400, 500, 600, 700],
  },
  {
    id: 'helvetica',
    name: 'Helvetica',
    family: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    category: 'sans-serif',
    previewText: 'Classic Swiss Style',
    isGoogleFont: false,
    weights: [400, 700],
  },
  {
    id: 'arial',
    name: 'Arial',
    family: "Arial, sans-serif",
    category: 'sans-serif',
    previewText: 'Standard Neutral',
    isGoogleFont: false,
    weights: [400, 700],
  },

  // Serif
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    family: "'Playfair Display', serif",
    category: 'serif',
    previewText: 'High Fashion & Luxury',
    isGoogleFont: true,
    weights: [400, 600, 700, 900],
  },
  {
    id: 'georgia',
    name: 'Georgia',
    family: "Georgia, serif",
    category: 'serif',
    previewText: 'Warm & Editorial',
    isGoogleFont: false,
    weights: [400, 700],
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    family: "'Merriweather', serif",
    category: 'serif',
    previewText: 'Readable & Classic',
    isGoogleFont: true,
    weights: [300, 400, 700],
  },
  {
    id: 'cinzel',
    name: 'Cinzel',
    family: "'Cinzel', serif",
    category: 'serif',
    previewText: 'Majestic & Classical',
    isGoogleFont: true,
    weights: [500, 700, 900],
  },
  {
    id: 'times-new-roman',
    name: 'Times New Roman',
    family: "'Times New Roman', Times, serif",
    category: 'serif',
    previewText: 'Traditional & Formal',
    isGoogleFont: false,
    weights: [400, 700],
  },

  // Display / Bold
  {
    id: 'oswald',
    name: 'Oswald',
    family: "'Oswald', sans-serif",
    category: 'display',
    previewText: 'Impactful & Condensed',
    isGoogleFont: true,
    weights: [500, 600, 700],
  },
  {
    id: 'impact',
    name: 'Impact',
    family: "Impact, Charcoal, sans-serif",
    category: 'display',
    previewText: 'Ultra Heavy & Punchy',
    isGoogleFont: false,
    weights: [400],
  },
  {
    id: 'trebuchet-ms',
    name: 'Trebuchet MS',
    family: "'Trebuchet MS', sans-serif",
    category: 'display',
    previewText: 'Dynamic & Solid',
    isGoogleFont: false,
    weights: [400, 700],
  },

  // Script / Handwriting
  {
    id: 'dancing-script',
    name: 'Dancing Script',
    family: "'Dancing Script', cursive",
    category: 'handwriting',
    previewText: 'Spontaneous & Lively',
    isGoogleFont: true,
    weights: [500, 700],
  },
  {
    id: 'caveat',
    name: 'Caveat',
    family: "'Caveat', cursive",
    category: 'handwriting',
    previewText: 'Playful Handcrafted',
    isGoogleFont: true,
    weights: [400, 600, 700],
  },
]

export const FONT_SIZE_PRESETS = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 84, 96, 120]

export function getFontByFamilyOrName(nameOrFamily: string): FontOption | undefined {
  const query = nameOrFamily.toLowerCase().replace(/['",]/g, '').trim()
  return AVAILABLE_FONTS.find((f) => {
    const fontName = f.name.toLowerCase()
    const fontId = f.id.toLowerCase()
    const rawFamily = f.family.toLowerCase().replace(/['",]/g, '')
    return (
      query === fontName ||
      query === fontId ||
      query.includes(fontName) ||
      rawFamily.includes(query)
    )
  })
}

/**
 * Dynamically injects Google Font link into document head if not already loaded
 */
export function ensureFontLoaded(familyOrName: string) {
  if (typeof document === 'undefined') return
  const option = getFontByFamilyOrName(familyOrName)
  if (!option || !option.isGoogleFont) return

  const fontId = `gfont-${option.id}`
  if (!document.getElementById(fontId)) {
    const link = document.createElement('link')
    link.id = fontId
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(option.name)}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&display=swap`
    document.head.appendChild(link)
  }
}

