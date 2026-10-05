import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()
  let dbStatus = 'Local Fallback'
  try {
    const db = await getDatabase()
    if (db) {
      dbStatus = 'Atlas Connected'
    }
  } catch {
    dbStatus = 'Offline'
  }
  const latency = `${Date.now() - start}ms`

  return NextResponse.json({
    online: true,
    database: dbStatus,
    latency,
    timestamp: new Date().toISOString(),
  })
}
