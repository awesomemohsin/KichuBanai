import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/server-auth'
import { findUserById } from '@/lib/db/repositories/user-repository'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized or session expired' }, { status: 401 })
    }

    const dbUser = await findUserById(authUser.id)
    if (!dbUser) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        mobile: dbUser.mobile,
        status: dbUser.status,
        createdAt: dbUser.createdAt,
      },
    })
  } catch (error: any) {
    console.error('[Auth Me Error]:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
