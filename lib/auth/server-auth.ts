import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken, JWTPayload, isAdminRole, isSuperAdminRole } from '@/lib/auth/jwt'
import { findUserById } from '@/lib/db/repositories/user-repository'

/**
 * Returns the currently authenticated user payload from the request,
 * or null if no valid token is provided.
 */
export async function getAuthUser(request: NextRequest): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(request)
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  // Deep verification: check user exists and is active in database
  const user = await findUserById(payload.id)
  if (!user || user.status === 'disabled') {
    return null
  }

  // Check tokenVersion match
  if (user.tokenVersion && payload.tokenVersion && user.tokenVersion !== payload.tokenVersion) {
    return null
  }

  return {
    ...payload,
    role: user.role, // Always use authoritative DB role
    name: user.name,
    email: user.email,
  }
}

/**
 * Requires standard user authentication for API routes
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: JWTPayload; response?: never } | { user?: never; response: NextResponse }> {
  const user = await getAuthUser(request)
  if (!user) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized: Please log in to continue' },
        { status: 401 }
      ),
    }
  }
  return { user }
}

/**
 * Requires Admin or SuperAdmin role clearance
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: JWTPayload; response?: never } | { user?: never; response: NextResponse }> {
  const user = await getAuthUser(request)
  if (!user) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized: Please log in to continue' },
        { status: 401 }
      ),
    }
  }

  if (!isAdminRole(user.role)) {
    return {
      response: NextResponse.json(
        { error: 'Forbidden: Admin clearance required' },
        { status: 403 }
      ),
    }
  }

  return { user }
}

/**
 * Requires SuperAdmin role clearance
 */
export async function requireSuperAdmin(
  request: NextRequest
): Promise<{ user: JWTPayload; response?: never } | { user?: never; response: NextResponse }> {
  const user = await getAuthUser(request)
  if (!user) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized: Please log in to continue' },
        { status: 401 }
      ),
    }
  }

  if (!isSuperAdminRole(user.role)) {
    return {
      response: NextResponse.json(
        { error: 'Forbidden: SuperAdmin clearance required' },
        { status: 403 }
      ),
    }
  }

  return { user }
}
