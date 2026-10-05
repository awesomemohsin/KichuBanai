import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/server-auth'
import { updateUser, deleteUser, findUserById } from '@/lib/db/repositories/user-repository'
import { UserRole } from '@/lib/auth/jwt'
import { z } from 'zod'

const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['customer', 'admin', 'moderator', 'super_admin']).optional(),
  status: z.enum(['active', 'disabled']).optional(),
  mobile: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request)
  if (auth.response) return auth.response

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = UpdateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid update data' },
        { status: 400 }
      )
    }

    const targetUser = await findUserById(id)
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent modifying the primary superadmin status
    if (targetUser.email === 'mohsindude5@gmail.com' && parsed.data.status === 'disabled') {
      return NextResponse.json(
        { error: 'Cannot deactivate primary superadmin account' },
        { status: 400 }
      )
    }

    const updated = await updateUser(id, {
      ...parsed.data,
      role: parsed.data.role as UserRole | undefined,
      tokenVersion: targetUser.tokenVersion + 1, // Invalidates old tokens if role or status changes
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updated?.id,
        name: updated?.name,
        email: updated?.email,
        mobile: updated?.mobile,
        role: updated?.role,
        status: updated?.status,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request)
  if (auth.response) return auth.response

  try {
    const { id } = await params
    const targetUser = await findUserById(id)
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.email === 'mohsindude5@gmail.com') {
      return NextResponse.json(
        { error: 'Cannot delete primary superadmin account' },
        { status: 400 }
      )
    }

    await deleteUser(id)
    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to delete user' },
      { status: 500 }
    )
  }
}
