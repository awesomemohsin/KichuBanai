import { PrintProduct } from '@/types/domain'

export const PRINT_PRODUCTS: PrintProduct[] = [
  {
    id: 'prod-visiting-cards',
    name: 'Visiting Cards / Business Cards',
    slug: 'visiting-cards',
    description: 'Crisp, high-impact business cards tailored for professionals and entrepreneurs.',
    category: 'Business cards',
    standardSizes: [
      { id: 'size-bc-std', name: 'Standard (3.5 × 2 in)', dimensions: { width: 1050, height: 600, unit: 'px', orientation: 'landscape', bleedMm: 3, safeMarginMm: 4 } },
      { id: 'size-bc-sq', name: 'Square (2.5 × 2.5 in)', dimensions: { width: 750, height: 750, unit: 'px', orientation: 'square', bleedMm: 3, safeMarginMm: 4 } },
    ],
    quantityTiers: [50, 100, 250, 500, 1000],
    materials: [
      { id: 'mat-350-matte', name: '350 GSM Premium Matte Art Card', gsm: 350, baseUnitPrice: 4.5 },
      { id: 'mat-300-gloss', name: '300 GSM Gloss Finish Card', gsm: 300, baseUnitPrice: 4.0 },
      { id: 'mat-kraft', name: '300 GSM Eco Recycled Kraft', gsm: 300, baseUnitPrice: 5.0 },
    ],
    finishes: [
      { id: 'fin-none', name: 'Standard Smooth Finish', priceMultiplier: 1.0 },
      { id: 'fin-matte-lam', name: 'Soft Velvet Matte Lamination', priceMultiplier: 1.2 },
      { id: 'fin-spot-uv', name: 'Selective Gloss Spot UV Highlights', priceMultiplier: 1.45 },
    ],
    defaultBleedMm: 3,
    defaultSafeMarginMm: 4,
    minRecommendedDpi: 300,
    active: true,
  },
  {
    id: 'prod-menus',
    name: 'Brunch & Dining Menus',
    slug: 'menus',
    description: 'Elegant, smudge-resistant restaurant and café menus.',
    category: 'Menus',
    standardSizes: [
      { id: 'size-a4', name: 'A4 Single Sheet (210 × 297 mm)', dimensions: { width: 840, height: 1188, unit: 'px', orientation: 'portrait', bleedMm: 3, safeMarginMm: 5 } },
      { id: 'size-a5', name: 'A5 Compact Sheet (148 × 210 mm)', dimensions: { width: 592, height: 840, unit: 'px', orientation: 'portrait', bleedMm: 3, safeMarginMm: 4 } },
    ],
    quantityTiers: [25, 50, 100, 250, 500],
    materials: [
      { id: 'mat-350-matte', name: '350 GSM Heavy Board', gsm: 350, baseUnitPrice: 22.0 },
      { id: 'mat-tearproof', name: 'Water-Resistant Synthetic 280 GSM', gsm: 280, baseUnitPrice: 38.0 },
    ],
    finishes: [
      { id: 'fin-none', name: 'No Lamination', priceMultiplier: 1.0 },
      { id: 'fin-thermal-lam', name: 'Heavy Duty Thermal Matte Lamination', priceMultiplier: 1.3 },
    ],
    defaultBleedMm: 3,
    defaultSafeMarginMm: 5,
    minRecommendedDpi: 300,
    active: true,
  },
  {
    id: 'prod-posters',
    name: 'Art & Event Posters',
    slug: 'posters',
    description: 'Vibrant, gallery-grade promotional and art posters.',
    category: 'Posters',
    standardSizes: [
      { id: 'size-a3', name: 'A3 Exhibition Poster (297 × 420 mm)', dimensions: { width: 1188, height: 1680, unit: 'px', orientation: 'portrait', bleedMm: 3, safeMarginMm: 6 } },
      { id: 'size-a2', name: 'A2 Grand Poster (420 × 594 mm)', dimensions: { width: 1680, height: 2376, unit: 'px', orientation: 'portrait', bleedMm: 4, safeMarginMm: 8 } },
    ],
    quantityTiers: [10, 25, 50, 100, 250],
    materials: [
      { id: 'mat-200-matte', name: '200 GSM Enhanced Matte Art Paper', gsm: 200, baseUnitPrice: 65.0 },
      { id: 'mat-250-satin', name: '250 GSM Premium Satin Photo Paper', gsm: 250, baseUnitPrice: 85.0 },
    ],
    finishes: [
      { id: 'fin-none', name: 'Natural Art Texture', priceMultiplier: 1.0 },
      { id: 'fin-uv-coat', name: 'Anti-Glare UV Protective Finish', priceMultiplier: 1.25 },
    ],
    defaultBleedMm: 3,
    defaultSafeMarginMm: 6,
    minRecommendedDpi: 300,
    active: true,
  },
  {
    id: 'prod-flyers',
    name: 'Marketing Flyers & Leaflets',
    slug: 'flyers',
    description: 'High-volume promotional flyers with vivid color reproduction.',
    category: 'Promotions',
    standardSizes: [
      { id: 'size-a5-flyer', name: 'A5 Standard Flyer', dimensions: { width: 592, height: 840, unit: 'px', orientation: 'portrait', bleedMm: 3, safeMarginMm: 4 } },
      { id: 'size-dl-flyer', name: 'DL Envelope Flyer (99 × 210 mm)', dimensions: { width: 396, height: 840, unit: 'px', orientation: 'portrait', bleedMm: 3, safeMarginMm: 4 } },
    ],
    quantityTiers: [100, 250, 500, 1000, 2500],
    materials: [
      { id: 'mat-150-gloss', name: '150 GSM Economy Gloss Art Paper', gsm: 150, baseUnitPrice: 3.2 },
      { id: 'mat-200-matte', name: '200 GSM Premium Matte Art Paper', gsm: 200, baseUnitPrice: 4.8 },
    ],
    finishes: [
      { id: 'fin-none', name: 'Natural Press Finish', priceMultiplier: 1.0 },
    ],
    defaultBleedMm: 3,
    defaultSafeMarginMm: 4,
    minRecommendedDpi: 300,
    active: true,
  },
]
