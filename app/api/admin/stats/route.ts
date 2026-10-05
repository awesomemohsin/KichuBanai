import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/server-auth'
import { OrderService } from '@/lib/orders/order-service'
import { DEFAULT_TEMPLATES } from '@/lib/templates/template-registry'
import { listUsers } from '@/lib/db/repositories/user-repository'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response) return auth.response

  try {
    const orders = OrderService.getOrders()
    const { total: totalUsers } = await listUsers()

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    const todaysOrders = orders.filter((o) => o.createdAt.startsWith(todayStr)).length

    const orderStatuses = {
      pending: orders.filter((o) => o.status === 'NEW' || o.status === 'PAYMENT_PENDING').length,
      processing: orders.filter((o) => o.status === 'IN_PRODUCTION' || o.status === 'QUALITY_CHECK').length,
      readyForPress: orders.filter((o) => o.status === 'APPROVED_FOR_PRINT').length,
      shipped: orders.filter((o) => o.status === 'SHIPPED' || o.status === 'COURIER_ASSIGNED').length,
      delivered: orders.filter((o) => o.status === 'DELIVERED').length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
    }

    const totalRevenue = orders.reduce((acc, o) => acc + (o.snapshot?.pricing?.total || 0), 0)

    const recentOrders = orders.slice(0, 15).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.snapshot?.customer?.name || 'Customer',
      customerEmail: o.snapshot?.customer?.email || '',
      customerPhone: o.snapshot?.customer?.phone || '',
      designTitle: o.snapshot?.designMetadata?.title || 'Custom Design',
      total: o.snapshot?.pricing?.total || 0,
      quantity: o.snapshot?.configuration?.quantity || 1,
      paperStock: o.snapshot?.configuration?.materialName || '300gsm Art Card',
      status: o.status,
      createdAt: o.createdAt,
    }))

    return NextResponse.json({
      totalTemplates: DEFAULT_TEMPLATES.length,
      totalOrders: orders.length,
      todaysOrders,
      totalCategories: 6,
      totalUsers,
      totalRevenue,
      orderStatuses,
      production: {
        outlinesVerified: orders.filter((o) => o.status !== 'NEW').length,
        readyForPress: orders.filter((o) => o.status === 'APPROVED_FOR_PRINT').length,
        preflightPassRate: 99.4,
        averageDispatchHours: 24,
      },
      recentOrders,
    })
  } catch (error: any) {
    console.error('Failed to get admin stats:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
