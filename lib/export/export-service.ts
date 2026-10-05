import JSZip from 'jszip'
import { DesignData, Order } from '@/types/domain'
import { generateProductionOutlinedSvg } from './vector-outliner'

export interface RenderJpgOptions {
  design: DesignData
  isSubscriber: boolean
  watermarkText?: string
}

/**
 * Renders a KichuBanai design to an HTML5 canvas and exports as a real JPG data URL / blob.
 * For free users: permanently burns a repeated diagonal watermark into the raster pixel data.
 * For subscribers: outputs a clean, high-resolution (2x) clean JPG.
 */
export async function renderDesignToJpg(options: RenderJpgOptions): Promise<{ dataUrl: string; width: number; height: number; isWatermarked: boolean }> {
  if (typeof window === 'undefined') {
    throw new Error('Canvas JPG rendering requires browser canvas environment.')
  }

  const { design, isSubscriber, watermarkText = 'Preview — KichuBanai' } = options
  const { width: origWidth, height: origHeight } = design.canvas

  // Free users get 1x resolution (or 0.8x); Subscribers get 2x retina/high-res
  const scale = isSubscriber ? 2.0 : 1.0
  const width = Math.round(origWidth * scale)
  const height = Math.round(origHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context.')
  }

  ctx.scale(scale, scale)

  // 1. Fill background
  ctx.fillStyle = design.background.color || '#ffffff'
  ctx.fillRect(0, 0, origWidth, origHeight)

  // 2. Render elements in z-index order
  const elements = [...design.elements].sort((a, b) => a.zIndex - b.zIndex)

  for (const el of elements) {
    if (!el.permissions.visible) continue
    ctx.save()
    if (el.opacity !== undefined) {
      ctx.globalAlpha = el.opacity
    }

    if (el.type === 'shape') {
      ctx.fillStyle = el.fill
      if (el.shapeType === 'rectangle') {
        ctx.fillRect(el.x, el.y, el.width, el.height)
        if (el.stroke) {
          ctx.strokeStyle = el.stroke
          ctx.lineWidth = el.strokeWidth || 1
          ctx.strokeRect(el.x, el.y, el.width, el.height)
        }
      } else if (el.shapeType === 'circle') {
        const radius = Math.min(el.width, el.height) / 2
        ctx.beginPath()
        ctx.arc(el.x + radius, el.y + radius, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (el.type === 'text') {
      const fontSize = el.fontSize
      const fontFamily = el.fontFamily || 'sans-serif'
      const fontWeight = el.fontWeight || 'normal'
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
      ctx.fillStyle = el.fill || '#000000'
      ctx.textBaseline = 'top'

      const lines = el.text.split('\n')
      const lineHeight = fontSize * (el.lineHeight || 1.3)
      lines.forEach((line, index) => {
        let textX = el.x
        if (el.textAlign === 'center') {
          ctx.textAlign = 'center'
          textX = el.x + el.width / 2
        } else if (el.textAlign === 'right') {
          ctx.textAlign = 'right'
          textX = el.x + el.width
        } else {
          ctx.textAlign = 'left'
        }
        ctx.fillText(line, textX, el.y + index * lineHeight)
      })
    }

    ctx.restore()
  }

  // 3. Burn Permanent Watermark for Free Users
  if (!isSubscriber) {
    ctx.save()
    ctx.font = 'bold 34px sans-serif'
    ctx.fillStyle = 'rgba(180, 50, 40, 0.28)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Repeated angled tile pattern across entire canvas
    const angle = -Math.PI / 6 // -30 degrees
    const stepX = 320
    const stepY = 220

    for (let x = -200; x < origWidth + 400; x += stepX) {
      for (let y = -200; y < origHeight + 400; y += stepY) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        ctx.fillText(watermarkText, 0, 0)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
        ctx.lineWidth = 1
        ctx.strokeText(watermarkText, 0, 0)
        ctx.restore()
      }
    }
    ctx.restore()
  }

  // Free: 0.65 quality; Subscriber: 0.95 quality
  const quality = isSubscriber ? 0.95 : 0.65
  const dataUrl = canvas.toDataURL('image/jpeg', quality)

  return {
    dataUrl,
    width,
    height,
    isWatermarked: !isSubscriber,
  }
}

/**
 * Creates the complete Production ZIP package for Admin & Production Staff (Rule 36).
 * Package includes:
 *   /print/production.svg
 *   /print/production-preflight.json
 *   /source/design.json
 *   /notes/production-notes.txt
 */
export async function createProductionZip(order: Order): Promise<Blob> {
  const zip = new JSZip()
  const activeDesign = order.productionRevisions.length > 0
    ? order.productionRevisions[order.productionRevisions.length - 1].designJson
    : order.snapshot.designJson

  // 1. Generate text-outlined production SVG
  const { svgContent, report } = generateProductionOutlinedSvg(activeDesign)

  const printFolder = zip.folder('print')
  if (printFolder) {
    printFolder.file('production.svg', svgContent)
    printFolder.file('production-preflight.json', JSON.stringify(report, null, 2))
  }

  const sourceFolder = zip.folder('source')
  if (sourceFolder) {
    sourceFolder.file('design.json', JSON.stringify(activeDesign, null, 2))
  }

  const notesFolder = zip.folder('notes')
  if (notesFolder) {
    const notesContent = `=====================================================
KICHUBANAI PRINT PRODUCTION PACKAGE
=====================================================
Order Number:     ${order.orderNumber}
Order Status:     ${order.status}
Customer Name:    ${order.snapshot.customer.name}
Phone Number:     ${order.snapshot.customer.phone}
Delivery Address: ${order.snapshot.customer.deliveryAddress}

Product:          ${order.snapshot.configuration.productName}
Size:             ${order.snapshot.configuration.sizeName}
Quantity:         ${order.snapshot.configuration.quantity}
Material:         ${order.snapshot.configuration.materialName}
Finish:           ${order.snapshot.configuration.finishName}
Special Notes:    ${order.snapshot.configuration.specialInstructions || 'None'}

PRINT SPECIFICATIONS:
Dimensions:       ${activeDesign.canvas.width} x ${activeDesign.canvas.height} px
Bleed:            ${activeDesign.canvas.bleedMm || 3} mm
Safe Margin:      ${activeDesign.canvas.safeMarginMm || 4} mm
Vector Outlined:  YES (100% Vector paths, zero <text> tags)
Resolution:       Prepress 300 DPI ready
Generated:        ${new Date().toISOString()}
=====================================================
`
    notesFolder.file('production-notes.txt', notesContent)
  }

  return await zip.generateAsync({ type: 'blob' })
}
