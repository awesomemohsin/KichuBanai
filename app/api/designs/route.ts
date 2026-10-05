import { NextRequest, NextResponse } from 'next/server'
import { getDatabase, COLLECTIONS } from '@/lib/db/mongodb'
import { DesignDataSchema } from '@/lib/validation/schemas'

export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ success: true, source: 'fallback', designs: [] })
    }

    const { searchParams } = new URL(req.url)
    const ownerId = searchParams.get('ownerId') || 'alex-morgan-guest'

    const designs = await db
      .collection(COLLECTIONS.DESIGNS)
      .find({ ownerId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({ success: true, source: 'mongodb', designs })
  } catch (err: any) {
    console.error('Error fetching designs from MongoDB:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { metadata, design } = body

    if (!metadata || !metadata.id) {
      return NextResponse.json({ success: false, error: 'Design metadata with id is required' }, { status: 400 })
    }

    // Validate design schema
    const validatedDesign = DesignDataSchema.parse(design)

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({
        success: true,
        source: 'local-only',
        message: 'MongoDB not reachable (check Atlas IP whitelist); design saved locally in browser.',
        id: metadata.id,
      })
    }

    const now = new Date().toISOString()
    const doc = {
      _id: metadata.id as any,
      metadata: {
        ...metadata,
        updatedAt: now,
      },
      design: validatedDesign,
      ownerId: metadata.ownerId || 'alex-morgan-guest',
      updatedAt: now,
    }

    await db.collection(COLLECTIONS.DESIGNS).updateOne(
      { _id: metadata.id as any },
      { $set: doc },
      { upsert: true }
    )

    // Save design version history
    await db.collection(COLLECTIONS.DESIGN_VERSIONS).insertOne({
      designId: metadata.id,
      version: metadata.version || 1,
      design: validatedDesign,
      createdAt: now,
    })

    return NextResponse.json({ success: true, source: 'mongodb', id: metadata.id })
  } catch (err: any) {
    console.error('Error saving design to MongoDB:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
