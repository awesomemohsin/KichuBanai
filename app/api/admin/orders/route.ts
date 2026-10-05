import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/server-auth'
import { OrderService } from '@/lib/orders/order-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response) return auth.response

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')?.toLowerCase() || ''
    const status = searchParams.get('status') || 'all'

    let orders = OrderService.getOrders()

    if (status !== 'all') {
      orders = orders.filter((o) => o.status === status)
    }

    if (search.trim()) {
      orders = orders.filter((o) => {
        const num = o.orderNumber?.toLowerCase() || ''
        const id = o.id?.toLowerCase() || ''
        const name = o.snapshot?.customer?.name?.toLowerCase() || ''
        const email = o.snapshot?.customer?.email?.toLowerCase() || ''
        const phone = o.snapshot?.customer?.phone?.toLowerCase() || ''
        const title = o.snapshot?.designMetadata?.title?.toLowerCase() || ''
        return (
          num.includes(search) ||
          id.includes(search) ||
          name.includes(search) ||
          email.includes(search) ||
          phone.includes(search) ||
          title.includes(search)
        )
      })
    }

    return NextResponse.json({
      orders,
      total: orders.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch orders' }, { status: 500 })
  }
}
