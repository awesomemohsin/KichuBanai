export type UserRole = 'GUEST' | 'CUSTOMER' | 'SUBSCRIBER' | 'ADMIN' | 'PRODUCTION_STAFF'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface SubscriptionEntitlements {
  highQualityJpg: boolean
  watermarkFree: boolean
  premiumTemplates: boolean
  maxSavedDesigns: number
  priorityPrintProcessing: boolean
}

export interface Subscription {
  id: string
  userId: string
  plan: 'FREE' | 'PLUS' | 'PRO'
  status: 'ACTIVE' | 'TRIALING' | 'CANCELLED' | 'EXPIRED'
  entitlements: SubscriptionEntitlements
  currentPeriodEnd?: string
}

// ----------------------------------------------------
// CANVAS & TEMPLATE SCHEMA
// ----------------------------------------------------

export type CanvasUnit = 'px' | 'mm' | 'in'
export type CanvasOrientation = 'portrait' | 'landscape' | 'square'

export interface CanvasDimensions {
  width: number
  height: number
  unit: CanvasUnit
  orientation: CanvasOrientation
  bleedMm?: number
  safeMarginMm?: number
}

export type ElementType = 'text' | 'image' | 'svg' | 'shape' | 'logo'

export interface ElementPermissions {
  editable: boolean
  movable: boolean
  resizable: boolean
  rotatable: boolean
  deletable: boolean
  replaceable?: boolean
  locked: boolean
  required: boolean
  visible: boolean
}

export interface BaseDesignElement {
  id: string
  type: ElementType
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  opacity?: number
  permissions: ElementPermissions
  zIndex: number
}

export interface TextElement extends BaseDesignElement {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number
  fontWeight?: number | string
  fontStyle?: 'normal' | 'italic'
  fill: string
  textAlign?: 'left' | 'center' | 'right'
  lineHeight?: number
  letterSpacing?: number
  quickEditKey?: string // maps to a quick edit field name
  quickEditLabel?: string
}

export interface ImageElement extends BaseDesignElement {
  type: 'image'
  src: string
  alt?: string
  aspectRatio?: number
  quickEditKey?: string
  quickEditLabel?: string
}

export interface ShapeElement extends BaseDesignElement {
  type: 'shape'
  shapeType: 'rectangle' | 'circle' | 'line' | 'star'
  fill: string
  stroke?: string
  strokeWidth?: number
}

export interface LogoElement extends BaseDesignElement {
  type: 'logo'
  src: string
  placeholderText?: string
  quickEditKey?: string
  quickEditLabel?: string
}

export interface SvgElement extends BaseDesignElement {
  type: 'svg'
  svgContent: string
  fill?: string
}

export type DesignElement = TextElement | ImageElement | ShapeElement | LogoElement | SvgElement

export interface DesignData {
  schemaVersion: 1
  canvas: CanvasDimensions
  background: {
    color: string
    image?: string
    opacity?: number
  }
  elements: DesignElement[]
  fontsUsed: string[]
}

export interface TemplateMetadata {
  id: string
  slug: string
  title: string
  description?: string
  category: 'Menus' | 'Promotions' | 'Social posts' | 'Invitations' | 'Business cards' | 'Posters' | 'Certificates' | 'Packaging'
  sizeLabel: string
  badgeLabel?: string
  colorTheme: string
  icon?: string
  isPremium: boolean
  isFeatured?: boolean
  version: number
  previewUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Template {
  metadata: TemplateMetadata
  design: DesignData
}

export interface DesignMetadata {
  id: string
  ownerId: string
  templateId?: string
  templateVersion?: number
  title: string
  category: string
  schemaVersion: number
  version: number
  previewUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Design {
  metadata: DesignMetadata
  design: DesignData
}

// ----------------------------------------------------
// PRINT PRODUCTS & PRICING
// ----------------------------------------------------

export interface PrintFinishOption {
  id: string
  name: string
  priceMultiplier: number
}

export interface PrintMaterialOption {
  id: string
  name: string
  gsm: number
  baseUnitPrice: number
}

export interface PrintProduct {
  id: string
  name: string
  slug: string
  description: string
  category: string
  standardSizes: Array<{
    id: string
    name: string
    dimensions: CanvasDimensions
  }>
  quantityTiers: number[]
  materials: PrintMaterialOption[]
  finishes: PrintFinishOption[]
  defaultBleedMm: number
  defaultSafeMarginMm: number
  minRecommendedDpi: number
  active: boolean
}

export interface PrintConfiguration {
  productId: string
  productName: string
  sizeId: string
  sizeName: string
  quantity: number
  materialId: string
  materialName: string
  finishId: string
  finishName: string
  deliveryAddress: string
  phoneNumber: string
  specialInstructions?: string
}

export interface PriceBreakdown {
  basePrice: number
  unitPrice: number
  subtotal: number
  finishCost: number
  shippingCost: number
  discount: number
  estimatedTax: number
  total: number
  currency: 'BDT' | 'USD'
}

// ----------------------------------------------------
// ORDERS & REVISIONS
// ----------------------------------------------------

export type OrderStatus =
  | 'NEW'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'DESIGN_REVIEW'
  | 'DESIGN_ADJUSTMENT'
  | 'APPROVED_FOR_PRINT'
  | 'IN_PRODUCTION'
  | 'QUALITY_CHECK'
  | 'PACKED'
  | 'COURIER_ASSIGNED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'ON_HOLD'
  | 'CANCELLED'

export interface OrderSnapshot {
  orderId: string
  createdAt: string
  customer: {
    userId: string
    name: string
    email: string
    phone: string
    deliveryAddress: string
  }
  designMetadata: DesignMetadata
  designJson: DesignData
  configuration: PrintConfiguration
  pricing: PriceBreakdown
}

export interface CourierTrackingInfo {
  courierName: string
  trackingNumber: string
  status: string
  dispatchedAt?: string
  estimatedDelivery?: string
  trackingUrl?: string
}

export interface ProductionRevision {
  revisionNumber: number
  createdAt: string
  createdBy: string
  notes?: string
  designJson: DesignData
  preflightResult?: PreflightReport
  isApproved: boolean
  approvedAt?: string
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  status: OrderStatus
  statusHistory: Array<{
    status: OrderStatus
    timestamp: string
    note?: string
    updatedBy?: string
  }>
  snapshot: OrderSnapshot
  productionRevisions: ProductionRevision[]
  activeRevisionNumber?: number
  courier?: CourierTrackingInfo
  createdAt: string
  updatedAt: string
}

// ----------------------------------------------------
// PREFLIGHT & PRODUCTION EXPORT
// ----------------------------------------------------

export interface PreflightItem {
  id: string
  name: string
  status: 'passed' | 'warning' | 'failed'
  message: string
  details?: string
}

export interface PreflightReport {
  passed: boolean
  canApproveForPrint: boolean
  dimensionsChecked: boolean
  textOutlinedChecked: boolean
  effectiveDpi: number
  colorModeWarning: boolean
  items: PreflightItem[]
}
