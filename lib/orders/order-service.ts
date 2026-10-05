import { CreateOrderPayloadSchema } from '@/lib/validation/schemas'
import { PricingService } from '@/lib/pricing/pricing-service'
import { Order, OrderStatus, ProductionRevision } from '@/types/domain'
import { getCourierProvider } from '@/lib/courier/courier-provider'
import { generateProductionOutlinedSvg } from '@/lib/export/vector-outliner'

// In-memory & local store for orders (ready to swap with MongoDB repository)
let inMemoryOrders: Order[] = []

export class OrderService {
  /**
   * Creates an order with an immutable snapshot.
   * Recalculates and enforces pricing server-side.
   */
  static async createOrder(payload: unknown, designData: any, designMeta: any): Promise<Order> {
    const validated = CreateOrderPayloadSchema.parse(payload)

    // Authoritative server-side price calculation
    const pricing = PricingService.calculatePrice(validated.configuration)

    const orderId = `ord-${Date.now()}`
    const orderNumber = `KB-${Math.floor(10000 + Math.random() * 90000)}`
    const now = new Date().toISOString()

    const order: Order = {
      id: orderId,
      orderNumber,
      customerId: validated.customer.userId,
      status: 'NEW',
      statusHistory: [
        {
          status: 'NEW',
          timestamp: now,
          note: 'Order placed by customer.',
        },
      ],
      snapshot: {
        orderId,
        createdAt: now,
        customer: validated.customer,
        designMetadata: { ...designMeta },
        designJson: JSON.parse(JSON.stringify(designData)), // immutable deep clone
        configuration: validated.configuration,
        pricing,
      },
      productionRevisions: [],
      createdAt: now,
      updatedAt: now,
    }

    inMemoryOrders.unshift(order)

    // Save to localStorage for demo persistence if in browser
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('kichubanai_orders')
        const orders = stored ? JSON.parse(stored) : []
        localStorage.setItem('kichubanai_orders', JSON.stringify([order, ...orders]))
      } catch (e) {
        console.error('Failed to store order in local cache:', e)
      }
    }

    return order
  }

  static getOrders(): Order[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('kichubanai_orders')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed && parsed.length > 0) return parsed
        }
      } catch (e) {
        console.error('Failed to load orders from local cache:', e)
      }
    }

    if (inMemoryOrders.length === 0) {
      const now = new Date()
      inMemoryOrders = [
        {
          id: 'ord-seed-1',
          orderNumber: 'KB-49219',
          customerId: 'cust-101',
          status: 'IN_PRODUCTION',
          statusHistory: [
            { status: 'NEW', timestamp: new Date(now.getTime() - 7200000).toISOString(), note: 'Order placed' },
            { status: 'IN_PRODUCTION', timestamp: new Date(now.getTime() - 3600000).toISOString(), note: 'Preflight approved' },
          ],
          snapshot: {
            orderId: 'ord-seed-1',
            createdAt: new Date(now.getTime() - 7200000).toISOString(),
            customer: {
              userId: 'cust-101',
              name: 'Tanvir Ahmed',
              email: 'tanvir.ahmed@example.com',
              phone: '01711223344',
              deliveryAddress: 'House 42, Road 11, Banani, Dhaka-1213',
            },
            designMetadata: {
              id: 'des-menu-seed-1',
              ownerId: 'cust-101',
              templateId: 'tpl-brunch-menu',
              templateVersion: 1,
              title: 'Weekend brunch menu',
              category: 'Menus',
              schemaVersion: 1,
              version: 1,
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
            designJson: {
              schemaVersion: 1,
              canvas: { width: 840, height: 1188, unit: 'px', orientation: 'portrait', bleedMm: 3, safeMarginMm: 5 },
              background: { color: '#e6aa8f' },
              fontsUsed: ['Georgia', 'Inter'],
              elements: [
                {
                  id: 'el-1',
                  type: 'text',
                  name: 'Cafe Title',
                  x: 50,
                  y: 50,
                  width: 500,
                  height: 60,
                  text: 'The Terrace Cafe',
                  fontFamily: 'Georgia',
                  fontSize: 32,
                  fill: '#1b1a18',
                  opacity: 1,
                  zIndex: 1,
                  permissions: { editable: true, movable: true, resizable: true, rotatable: false, deletable: false, locked: false, required: true, visible: true },
                },
              ],
            },
            configuration: {
              productId: 'prod-menu',
              productName: 'Restaurant Menu Card',
              sizeId: 'size-a4',
              sizeName: 'A4 (840 × 1188 px)',
              quantity: 25,
              materialId: 'mat-card-350',
              materialName: '350gsm Heavyweight Art Card',
              finishId: 'fin-matte',
              finishName: 'Matte Lamination',
              deliveryAddress: 'House 42, Road 11, Banani, Dhaka-1213',
              phoneNumber: '01711223344',
            },
            pricing: {
              basePrice: 1200,
              unitPrice: 48,
              subtotal: 1200,
              finishCost: 250,
              shippingCost: 0,
              discount: 0,
              estimatedTax: 0,
              total: 1450,
              currency: 'BDT',
            },
          },
          productionRevisions: [],
          createdAt: new Date(now.getTime() - 7200000).toISOString(),
          updatedAt: new Date(now.getTime() - 3600000).toISOString(),
        },
        {
          id: 'ord-seed-2',
          orderNumber: 'KB-78104',
          customerId: 'cust-102',
          status: 'NEW',
          statusHistory: [
            { status: 'NEW', timestamp: new Date(now.getTime() - 1800000).toISOString(), note: 'Order placed' },
          ],
          snapshot: {
            orderId: 'ord-seed-2',
            createdAt: new Date(now.getTime() - 1800000).toISOString(),
            customer: {
              userId: 'cust-102',
              name: 'Nusrat Jahan',
              email: 'nusrat.j@example.com',
              phone: '01819876543',
              deliveryAddress: 'Flat 5B, Green Garden, Dhanmondi 27, Dhaka',
            },
            designMetadata: {
              id: 'des-bc-seed-2',
              ownerId: 'cust-102',
              templateId: 'tpl-business-card',
              templateVersion: 1,
              title: 'Executive Business Card',
              category: 'Business Cards',
              schemaVersion: 1,
              version: 1,
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
            designJson: {
              schemaVersion: 1,
              canvas: { width: 1050, height: 600, unit: 'px', orientation: 'landscape', bleedMm: 3, safeMarginMm: 5 },
              background: { color: '#ef826c' },
              fontsUsed: ['Inter', 'Georgia'],
              elements: [
                {
                  id: 'el-bc-1',
                  type: 'text',
                  name: 'Card Name',
                  x: 60,
                  y: 60,
                  width: 400,
                  height: 50,
                  text: 'Nusrat Jahan\nCreative Director',
                  fontFamily: 'Inter',
                  fontSize: 24,
                  fill: '#ffffff',
                  opacity: 1,
                  zIndex: 1,
                  permissions: { editable: true, movable: true, resizable: true, rotatable: false, deletable: false, locked: false, required: true, visible: true },
                },
              ],
            },
            configuration: {
              productId: 'prod-bc',
              productName: 'Standard Business Cards',
              sizeId: 'size-bc',
              sizeName: '3.5" × 2"',
              quantity: 250,
              materialId: 'mat-card-300',
              materialName: '300gsm Premium Matte',
              finishId: 'fin-matte',
              finishName: 'Double-sided Matte',
              deliveryAddress: 'Flat 5B, Green Garden, Dhanmondi 27, Dhaka',
              phoneNumber: '01819876543',
            },
            pricing: {
              basePrice: 750,
              unitPrice: 3,
              subtotal: 750,
              finishCost: 100,
              shippingCost: 0,
              discount: 0,
              estimatedTax: 0,
              total: 850,
              currency: 'BDT',
            },
          },
          productionRevisions: [],
          createdAt: new Date(now.getTime() - 1800000).toISOString(),
          updatedAt: new Date(now.getTime() - 1800000).toISOString(),
        },
      ]
    }

    return inMemoryOrders
  }

  static getOrderById(id: string): Order | undefined {
    const orders = this.getOrders()
    return orders.find((o) => o.id === id || o.orderNumber === id)
  }

  static async updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string): Promise<Order> {
    const orders = this.getOrders()
    const orderIndex = orders.findIndex((o) => o.id === orderId)
    if (orderIndex === -1) {
      throw new Error(`Order ${orderId} not found`)
    }

    const order = orders[orderIndex]
    const now = new Date().toISOString()

    order.status = newStatus
    order.updatedAt = now
    order.statusHistory.push({
      status: newStatus,
      timestamp: now,
      note: note || `Status transitioned to ${newStatus}`,
    })

    // If assigned to courier, generate tracking info automatically
    if (newStatus === 'COURIER_ASSIGNED' && !order.courier) {
      const courierProvider = getCourierProvider()
      order.courier = await courierProvider.createShipment(order.id, {
        name: order.snapshot.customer.name,
        address: order.snapshot.customer.deliveryAddress,
        phone: order.snapshot.customer.phone,
      })
    }

    orders[orderIndex] = order
    inMemoryOrders = orders

    if (typeof window !== 'undefined') {
      localStorage.setItem('kichubanai_orders', JSON.stringify(orders))
    }

    return order
  }

  /**
   * Creates a new production revision for an order without modifying the original snapshot (Rule 24 & 38).
   */
  static createProductionRevision(orderId: string, updatedDesign: any, staffNotes?: string): ProductionRevision {
    const orders = this.getOrders()
    const order = orders.find((o) => o.id === orderId)
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    const revisionNumber = order.productionRevisions.length + 1
    const { report } = generateProductionOutlinedSvg(updatedDesign)

    const revision: ProductionRevision = {
      revisionNumber,
      createdAt: new Date().toISOString(),
      createdBy: 'Production Staff',
      notes: staffNotes,
      designJson: JSON.parse(JSON.stringify(updatedDesign)),
      preflightResult: report,
      isApproved: false,
    }

    order.productionRevisions.push(revision)
    order.activeRevisionNumber = revisionNumber
    order.status = 'DESIGN_ADJUSTMENT'
    order.updatedAt = new Date().toISOString()

    if (typeof window !== 'undefined') {
      localStorage.setItem('kichubanai_orders', JSON.stringify(orders))
    }

    return revision
  }

  /**
   * Approves a production revision and locks it (Rule 69).
   */
  static approveProductionRevision(orderId: string, revisionNumber: number): Order {
    const orders = this.getOrders()
    const order = orders.find((o) => o.id === orderId)
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    const revision = order.productionRevisions.find((r) => r.revisionNumber === revisionNumber)
    if (!revision) {
      throw new Error(`Revision ${revisionNumber} not found`)
    }

    revision.isApproved = true
    revision.approvedAt = new Date().toISOString()
    order.status = 'APPROVED_FOR_PRINT'
    order.updatedAt = new Date().toISOString()

    if (typeof window !== 'undefined') {
      localStorage.setItem('kichubanai_orders', JSON.stringify(orders))
    }

    return order
  }
}
