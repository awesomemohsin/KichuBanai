import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateToken, setAuthCookie, hashPassword } from '@/lib/auth/jwt'
import {
  findUserByEmailOrMobile,
  recordFailedLogin,
  resetFailedLogin,
} from '@/lib/db/repositories/user-repository'

const LoginSchema = z.object({
  email: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = LoginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid credentials payload' },
        { status: 400 }
      )
    }

    const { email: identifier, password } = parsed.data
    const user = await findUserByEmailOrMobile(identifier)

    if (!user) {
      return NextResponse.json(
        { error: 'Incorrect email, phone, or password' },
        { status: 401 }
      )
    }

    // Check account lockout (Brute-Force Protection)
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000))
      return NextResponse.json(
        {
          error: `Account temporarily locked due to multiple failed attempts. Please try again in ${remainingMinutes} minute(s).`,
        },
        { status: 429 }
      )
    }

    // Check if account is disabled
    if (user.status === 'disabled') {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact support.' },
        { status: 403 }
      )
    }

    // Check password
    const hashedPassword = hashPassword(password)
    if (user.password !== hashedPassword) {
      await recordFailedLogin(user.id)
      return NextResponse.json(
        { error: 'Incorrect email, phone, or password' },
        { status: 401 }
      )
    }

    // Reset failed login attempts on successful login
    await resetFailedLogin(user.id)

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tokenVersion: user.tokenVersion,
    })

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mobile: user.mobile,
      },
    })

    // Set HttpOnly auth cookie
    response.headers.set('Set-Cookie', setAuthCookie(token))

    return response
  } catch (error: any) {
    console.error('[Auth Login Error]:', error)
    return NextResponse.json(
      { error: error?.message || 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
