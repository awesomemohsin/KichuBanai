import { PriceBreakdown, PrintConfiguration } from '@/types/domain'
import { PRINT_PRODUCTS } from '@/lib/print/print-catalog'

export class PricingService {
  /**
   * Authoritative server-side price calculation.
   * Total = (Quantity * MaterialUnitPrice * FinishMultiplier) + Shipping - Discount + Tax
   */
  static calculatePrice(config: PrintConfiguration): PriceBreakdown {
    const product = PRINT_PRODUCTS.find((p) => p.id === config.productId)
    if (!product) {
      throw new Error(`Invalid print product ID: ${config.productId}`)
    }

    const material = product.materials.find((m) => m.id === config.materialId) || product.materials[0]
    const finish = product.finishes.find((f) => f.id === config.finishId) || product.finishes[0]

    const quantity = Math.max(1, config.quantity)
    const baseUnitPrice = material.baseUnitPrice

    // Volume discount tiers
    let volumeDiscountFactor = 1.0
    if (quantity >= 1000) volumeDiscountFactor = 0.75
    else if (quantity >= 500) volumeDiscountFactor = 0.85
    else if (quantity >= 250) volumeDiscountFactor = 0.92

    const effectiveUnitPrice = baseUnitPrice * volumeDiscountFactor
    const subtotal = Math.round(quantity * effectiveUnitPrice * 100) / 100
    const finishCost = Math.round(subtotal * (finish.priceMultiplier - 1.0) * 100) / 100

    // Standard flat courier delivery fee within Bangladesh: 120 BDT
    const shippingCost = 120

    const rawTotal = subtotal + finishCost + shippingCost
    const total = Math.round(rawTotal * 100) / 100

    return {
      basePrice: Math.round(quantity * baseUnitPrice * 100) / 100,
      unitPrice: Math.round(effectiveUnitPrice * 100) / 100,
      subtotal,
      finishCost,
      shippingCost,
      discount: Math.round((quantity * baseUnitPrice - subtotal) * 100) / 100,
      estimatedTax: 0,
      total,
      currency: 'BDT',
    }
  }
}
