import { DesignElement, Template, TextElement } from '@/types/domain'

export interface SvgImportOptions {
  id?: string
  title: string
  category?: string
  sizeLabel?: string
  badgeLabel?: string
  colorTheme?: string
  icon?: string
}

export interface SvgImportResult {
  template: Template
  artworkSvg: string
  extractedTextElements: TextElement[]
}

/**
 * Parses CSS classes defined inside <defs><style>...</style></defs> in an SVG.
 */
function parseSvgStyles(svgContent: string): Record<string, Record<string, string>> {
  const styles: Record<string, Record<string, string>> = {}
  const styleBlockMatch = svgContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  if (!styleBlockMatch) return styles

  const cssText = styleBlockMatch[1]
  // Match rules like: .st1, .st2 { fill: #6578ff; font-size: 8.27px; }
  const ruleRegex = /([^{]+)\{([^}]+)\}/g
  let match: RegExpExecArray | null

  while ((match = ruleRegex.exec(cssText)) !== null) {
    const selectors = match[1].split(',').map((s) => s.trim().replace(/^\./, ''))
    const decls = match[2].split(';').map((d) => d.trim()).filter(Boolean)
    const styleObj: Record<string, string> = {}

    for (const decl of decls) {
      const [prop, val] = decl.split(':').map((s) => s.trim())
      if (prop && val) {
        styleObj[prop] = val
      }
    }

    for (const selector of selectors) {
      if (selector) {
        styles[selector] = { ...(styles[selector] || {}), ...styleObj }
      }
    }
  }

  return styles
}

/**
 * Automatically assigns beginner-friendly Quick Edit metadata based on content and position.
 */
function inferQuickEditMetadata(
  text: string,
  fontSize: number,
  y: number,
  canvasHeight: number
): { key: string; label: string } {
  const lower = text.toLowerCase()

  // Email detection
  if (lower.includes('@') && lower.includes('.')) {
    return { key: 'email', label: 'Email Address' }
  }

  // Website detection
  if (lower.includes('www.') || lower.includes('.com') || lower.includes('.org') || lower.includes('.net')) {
    return { key: 'website', label: 'Website URL' }
  }

  // Phone number detection
  if (/[+0-9\s()–-]{8,}/.test(text) && !lower.includes('street') && !lower.includes('road')) {
    return { key: 'phone', label: 'Phone Number' }
  }

  // Address detection
  if (lower.includes('street') || lower.includes('road') || lower.includes('ave') || lower.includes('lane') || lower.includes('box')) {
    return { key: 'address', label: 'Office Address' }
  }

  // Top large heading -> Company Name
  if (fontSize >= 18 && y < canvasHeight * 0.35) {
    return { key: 'companyName', label: 'Company Name' }
  }

  // Top medium text -> Tagline / Slogan
  if (fontSize >= 10 && fontSize < 18 && y < canvasHeight * 0.4) {
    return { key: 'tagline', label: 'Tagline / Slogan' }
  }

  // Multiline or body text
  if (text.includes('\n') || text.length > 50) {
    return { key: 'memoBody', label: 'Letter / Memo Body' }
  }

  return { key: `field_${Math.random().toString(36).slice(2, 7)}`, label: text.slice(0, 20) }
}

/**
 * Universal SVG Template Importer
 * Automatically parses ANY vector SVG file (from Adobe Illustrator, Figma, or Canva),
 * extracts all typography as editable text elements with 2-way binding,
 * strips text to produce clean vector background artwork,
 * and generates a complete KichuBanai Master Template JSON.
 */
export function importSvgAsTemplate(
  svgString: string,
  options: SvgImportOptions
): SvgImportResult {
  // 1. Extract dimensions from viewBox or width/height attributes
  let width = 730
  let height = 888

  const viewBoxMatch = svgString.match(/viewBox=["']([\d.-]+)[\s,]+([\d.-]+)[\s,]+([\d.-]+)[\s,]+([\d.-]+)["']/i)
  if (viewBoxMatch) {
    width = Math.round(parseFloat(viewBoxMatch[3]))
    height = Math.round(parseFloat(viewBoxMatch[4]))
  } else {
    const widthMatch = svgString.match(/width=["']([\d.-]+)(?:px)?["']/i)
    const heightMatch = svgString.match(/height=["']([\d.-]+)(?:px)?["']/i)
    if (widthMatch) width = Math.round(parseFloat(widthMatch[1]))
    if (heightMatch) height = Math.round(parseFloat(heightMatch[1]))
  }

  const styles = parseSvgStyles(svgString)

  // 2. Extract <text> elements
  const textElements: TextElement[] = []
  const textTagRegex = /<text([^>]*)>([\s\S]*?)<\/text>/gi
  let match: RegExpExecArray | null
  let zIndexCounter = 2

  while ((match = textTagRegex.exec(svgString)) !== null) {
    const attrs = match[1]
    const rawBody = match[2]

    // Extract text content (strip nested tspans or tags)
    const textContent = rawBody
      .replace(/<tspan[^>]*>/gi, '')
      .replace(/<\/tspan>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .trim()

    if (!textContent) continue

    // Extract class names
    const classMatch = attrs.match(/class=["']([^"']+)["']/i)
    const classList = classMatch ? classMatch[1].split(/\s+/) : []
    const mergedClassStyle: Record<string, string> = {}
    for (const cls of classList) {
      if (styles[cls]) {
        Object.assign(mergedClassStyle, styles[cls])
      }
    }

    // Extract coordinates: check transform="translate(x, y)" or x / y
    let posX = 100
    let posY = 100

    const translateMatch = attrs.match(/transform=["'][^"']*translate\(([\d.-]+)[\s,]+([\d.-]+)\)/i)
    if (translateMatch) {
      posX = Math.round(parseFloat(translateMatch[1]))
      posY = Math.round(parseFloat(translateMatch[2]))
    } else {
      const xMatch = attrs.match(/\bx=["']([\d.-]+)["']/i)
      const yMatch = attrs.match(/\by=["']([\d.-]+)["']/i)
      if (xMatch) posX = Math.round(parseFloat(xMatch[1]))
      if (yMatch) posY = Math.round(parseFloat(yMatch[1]))
    }

    // Extract font size
    let fontSize = 14
    if (mergedClassStyle['font-size']) {
      fontSize = Math.round(parseFloat(mergedClassStyle['font-size']))
    } else {
      const fsMatch = attrs.match(/font-size=["']([\d.-]+)(?:px)?["']/i)
      if (fsMatch) fontSize = Math.round(parseFloat(fsMatch[1]))
    }

    // Extract font family
    let fontFamily = 'Inter'
    if (mergedClassStyle['font-family']) {
      fontFamily = mergedClassStyle['font-family'].split(',')[0].replace(/['"]/g, '').trim()
    }

    // Extract fill color
    let fill = '#1d1d1b'
    if (mergedClassStyle.fill && mergedClassStyle.fill !== 'none') {
      fill = mergedClassStyle.fill
    } else {
      const fillMatch = attrs.match(/fill=["']([^"']+)["']/i)
      if (fillMatch && fillMatch[1] !== 'none') fill = fillMatch[1]
    }

    // Quick Edit metadata
    const { key, label } = inferQuickEditMetadata(textContent, fontSize, posY, height)

    // Calculate approximate width/height
    const estimatedWidth = Math.max(120, Math.round(textContent.length * fontSize * 0.65))
    const estimatedHeight = Math.max(20, Math.round(fontSize * 1.4))

    const elId = `el-${key}-${Date.now().toString(36).slice(-4)}-${zIndexCounter}`

    textElements.push({
      id: elId,
      type: 'text',
      name: label,
      text: textContent,
      fontFamily,
      fontSize: Math.max(10, fontSize),
      fontWeight: fontSize >= 20 ? 800 : fontSize >= 14 ? 600 : 500,
      fill,
      textAlign: posX > width * 0.4 && posX < width * 0.6 ? 'center' : posX > width * 0.6 ? 'right' : 'left',
      x: posX,
      y: posY,
      width: estimatedWidth,
      height: estimatedHeight,
      zIndex: zIndexCounter++,
      quickEditKey: key,
      quickEditLabel: label,
      permissions: {
        editable: true,
        movable: true,
        resizable: true,
        rotatable: false,
        deletable: true,
        locked: false,
        required: key === 'companyName',
        visible: true,
      },
    })
  }

  // 3. Create stripped background artwork SVG (with all text elements removed)
  const artworkSvg = svgString
    .replace(/<text[\s\S]*?<\/text>/gi, '')
    // Clean up empty text tags or remaining tspan artifacts
    .replace(/<g id="TEXTS"[^>]*>[\s\S]*?<\/g>/gi, '')

  // 4. Assemble Master Template JSON
  const tplId = options.id || `tpl-${Date.now()}`
  const category = (options.category as any) || 'Letterheads & Pads'

  const template: Template = {
    metadata: {
      id: tplId,
      slug: options.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: options.title,
      description: `Customizable ${category} template generated from vector SVG specifications.`,
      category,
      sizeLabel: options.sizeLabel || (width > 800 ? 'A3' : width > 600 ? 'Letter / A4' : 'Card'),
      badgeLabel: options.badgeLabel || 'NEW',
      colorTheme: options.colorTheme || 'slate',
      icon: options.icon || '📋',
      isPremium: false,
      isFeatured: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    design: {
      schemaVersion: 1,
      canvas: {
        width,
        height,
        unit: 'px',
        orientation: width > height ? 'landscape' : 'portrait',
        bleedMm: 3,
        safeMarginMm: 5,
      },
      background: {
        color: '#ffffff',
      },
      fontsUsed: Array.from(new Set(textElements.map((el) => el.fontFamily).concat(['Inter']))),
      elements: [
        {
          id: 'svg-vector-artwork',
          type: 'svg',
          name: 'Vector Background & Graphics',
          svgContent: artworkSvg,
          x: 0,
          y: 0,
          width,
          height,
          zIndex: 1,
          permissions: {
            editable: false,
            movable: false,
            resizable: false,
            rotatable: false,
            deletable: false,
            locked: true,
            required: true,
            visible: true,
          },
        } as DesignElement,
        ...textElements,
      ],
    },
  }

  return {
    template,
    artworkSvg,
    extractedTextElements: textElements,
  }
}
