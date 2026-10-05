import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, requireSuperAdmin } from '@/lib/auth/server-auth'
import { listUsers, createUser, findUserByEmailOrMobile } from '@/lib/db/repositories/user-repository'
import { UserRole } from '@/lib/auth/jwt'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/users: List users with role filtering & search
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response) return auth.response

  const searchParams = request.nextUrl.searchParams
  const role = searchParams.get('role') as UserRole | undefined
  const search = searchParams.get('search') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  const result = await listUsers({ role, search, page, limit })

  // Sanitize password field
  const sanitized = result.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    mobile: u.mobile,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }))

  return NextResponse.json({
    users: sanitized,
    total: result.total,
    page,
    limit,
  })
}

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(['customer', 'admin', 'moderator', 'super_admin']).default('admin'),
})

/**
 * POST /api/admin/users: SuperAdmin creates or promotes a staff/admin user
 */
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  if (auth.response) return auth.response

  try {
    const body = await request.json()
    const parsed = CreateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid user data' },
        { status: 400 }
      )
    }

    const { name, email, mobile, password, role } = parsed.data
    const cleanEmail = email.trim().toLowerCase()

    const existing = await findUserByEmailOrMobile(cleanEmail)
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    const user = await createUser({
      name,
      email: cleanEmail,
      mobile,
      password,
      role: role as UserRole,
      status: 'active',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}
