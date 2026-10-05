import { NextRequest, NextResponse } from 'next/server'
import { getDatabase, COLLECTIONS } from '@/lib/db/mongodb'
import { OrderService } from '@/lib/orders/order-service'

export async function GET() {
  try {
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ success: true, source: 'in-memory', orders: OrderService.getOrders() })
    }

    const orders = await db
      .collection(COLLECTIONS.ORDERS)
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json({ success: true, source: 'mongodb', orders })
  } catch (err: any) {
    console.error('Error fetching orders from MongoDB:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { payload, designData, designMeta } = body

    // Call server-side OrderService for immutable snapshot & price calculation
    const order = await OrderService.createOrder(payload, designData, designMeta)

    const db = await getDatabase()
    if (db) {
      const orderDoc = {
        _id: order.id as any,
        ...order,
      }
      await db.collection(COLLECTIONS.ORDERS).insertOne(orderDoc)
      await db.collection(COLLECTIONS.ORDER_SNAPSHOTS).insertOne({
        orderId: order.id,
        snapshot: order.snapshot,
        createdAt: order.createdAt,
      })
    }

    return NextResponse.json({ success: true, order, source: db ? 'mongodb' : 'local' })
  } catch (err: any) {
    console.error('Error creating order:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 400 })
  }
}
