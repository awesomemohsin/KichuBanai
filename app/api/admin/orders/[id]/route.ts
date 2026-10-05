import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/server-auth'
import { OrderService } from '@/lib/orders/order-service'
import { OrderStatus } from '@/types/domain'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth.response) return auth.response

  const { id } = await params
  const order = OrderService.getOrderById(id)

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({ order })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth.response) return auth.response

  try {
    const { id } = await params
    const body = await request.json()
    const { status, note } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const updated = await OrderService.updateOrderStatus(id, status as OrderStatus, note)
    return NextResponse.json({ success: true, order: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update order' }, { status: 500 })
  }
}
