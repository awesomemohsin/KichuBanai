import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'kichubanai_jwt_secret_key_secure_auth_token_2026'

export type UserRole = 'customer' | 'admin' | 'moderator' | 'super_admin'

export interface JWTPayload {
  id: string
  email: string
  name: string
  role: UserRole
  tokenVersion?: number
  iat?: number
  exp?: number
}

/**
 * Generates a signed JWT with 7-day expiration
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Verifies a JWT token and returns the decoded payload, or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded as unknown as JWTPayload
  } catch {
    return null
  }
}

/**
 * Extracts a token from a cookie string header
 */
export function getTokenFromCookie(cookieHeader: string | null, name: string = 'token'): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(';').map((c) => c.trim())
  const authCookie = cookies.find((c) => c.startsWith(`${name}=`))
  if (!authCookie) return null
  return authCookie.substring(`${name}=`.length)
}

/**
 * Extracts a token from an incoming NextRequest (Authorization header or Cookie)
 */
export function getTokenFromRequest(request: NextRequest, name: string = 'token'): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return getTokenFromCookie(request.headers.get('cookie'), name)
}

/**
 * Formats a Set-Cookie header string for the auth token
 */
export function setAuthCookie(token: string, name: string = 'token', maxAge: number = 86400 * 7): string {
  const isProd = process.env.NODE_ENV === 'production'
  return `${name}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`
}

/**
 * Formats a Set-Cookie header string to expire the auth token
 */
export function clearAuthCookie(name: string = 'token'): string {
  const isProd = process.env.NODE_ENV === 'production'
  return `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`
}

/**
 * Secure SHA-256 password hash (consistent with Parle Bangladesh)
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

/**
 * Normalizes Bangladeshi phone numbers into standard 11-digit format (01XXXXXXXXX)
 */
export function normalizeMobile(input: string): string {
  let digits = input.replace(/\D/g, '')

  // Remove leading 880 (e.g. 88017... -> 017...)
  if (digits.startsWith('880') && digits.length === 13) {
    digits = digits.slice(2)
  }

  // Prepend 0 if 10 digits starting with 1
  if (digits.length === 10 && digits.startsWith('1')) {
    digits = '0' + digits
  }

  return digits
}

/**
 * Role clearance verification helpers
 */
export function isAdminRole(role: UserRole | string | undefined): boolean {
  return role === 'admin' || role === 'super_admin' || role === 'moderator'
}

export function isSuperAdminRole(role: UserRole | string | undefined): boolean {
  return role === 'super_admin'
}
