import { z } from 'zod'

export const CanvasDimensionsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.enum(['px', 'mm', 'in']),
  orientation: z.enum(['portrait', 'landscape', 'square']),
  bleedMm: z.number().nonnegative().optional(),
  safeMarginMm: z.number().nonnegative().optional(),
})

export const ElementPermissionsSchema = z.object({
  editable: z.boolean(),
  movable: z.boolean(),
  resizable: z.boolean(),
  rotatable: z.boolean(),
  deletable: z.boolean(),
  replaceable: z.boolean().optional(),
  locked: z.boolean(),
  required: z.boolean(),
  visible: z.boolean(),
})

export const BaseElementSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['text', 'image', 'svg', 'shape', 'logo']),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  permissions: ElementPermissionsSchema,
  zIndex: z.number(),
})

export const TextElementSchema = BaseElementSchema.extend({
  type: z.literal('text'),
  text: z.string(),
  fontFamily: z.string().min(1),
  fontSize: z.number().positive(),
  fontWeight: z.union([z.number(), z.string()]).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
  fill: z.string(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  quickEditKey: z.string().optional(),
  quickEditLabel: z.string().optional(),
})

export const ImageElementSchema = BaseElementSchema.extend({
  type: z.literal('image'),
  src: z.string().min(1),
  alt: z.string().optional(),
  aspectRatio: z.number().optional(),
  quickEditKey: z.string().optional(),
  quickEditLabel: z.string().optional(),
})

export const ShapeElementSchema = BaseElementSchema.extend({
  type: z.literal('shape'),
  shapeType: z.enum(['rectangle', 'circle', 'line', 'star']),
  fill: z.string(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
})

export const LogoElementSchema = BaseElementSchema.extend({
  type: z.literal('logo'),
  src: z.string(),
  placeholderText: z.string().optional(),
  quickEditKey: z.string().optional(),
  quickEditLabel: z.string().optional(),
})

export const SvgElementSchema = BaseElementSchema.extend({
  type: z.literal('svg'),
  svgContent: z.string(),
  fill: z.string().optional(),
})

export const DesignElementSchema = z.discriminatedUnion('type', [
  TextElementSchema,
  ImageElementSchema,
  ShapeElementSchema,
  LogoElementSchema,
  SvgElementSchema,
])

export const DesignDataSchema = z.object({
  schemaVersion: z.literal(1),
  canvas: CanvasDimensionsSchema,
  background: z.object({
    color: z.string(),
    image: z.string().optional(),
    opacity: z.number().optional(),
  }),
  elements: z.array(DesignElementSchema),
  fontsUsed: z.array(z.string()),
})

export const PrintConfigurationSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  sizeId: z.string().min(1),
  sizeName: z.string().min(1),
  quantity: z.number().int().positive(),
  materialId: z.string().min(1),
  materialName: z.string().min(1),
  finishId: z.string().min(1),
  finishName: z.string().min(1),
  deliveryAddress: z.string().min(5),
  phoneNumber: z.string().min(6),
  specialInstructions: z.string().optional(),
})

export const CreateOrderPayloadSchema = z.object({
  designId: z.string().min(1),
  configuration: PrintConfigurationSchema,
  customer: z.object({
    userId: z.string(),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6),
    deliveryAddress: z.string().min(5),
  }),
})

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    'NEW',
    'PAYMENT_PENDING',
    'PAYMENT_CONFIRMED',
    'DESIGN_REVIEW',
    'DESIGN_ADJUSTMENT',
    'APPROVED_FOR_PRINT',
    'IN_PRODUCTION',
    'QUALITY_CHECK',
    'PACKED',
    'COURIER_ASSIGNED',
    'SHIPPED',
    'DELIVERED',
    'ON_HOLD',
    'CANCELLED',
  ]),
  note: z.string().optional(),
})
