import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateToken, setAuthCookie } from '@/lib/auth/jwt'
import { findUserByEmailOrMobile, createUser } from '@/lib/db/repositories/user-repository'

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email address'),
  mobile: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = RegisterSchema.safeParse(body)

    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return NextResponse.json(
        { error: issue ? issue.message : 'Invalid registration data' },
        { status: 400 }
      )
    }

    const { name, email, mobile, password } = parsed.data
    const cleanEmail = email.trim().toLowerCase()

    // Check if user already exists
    const existing = await findUserByEmailOrMobile(cleanEmail)
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    if (mobile && mobile.trim().length > 0) {
      const existingMobile = await findUserByEmailOrMobile(mobile)
      if (existingMobile) {
        return NextResponse.json(
          { error: 'An account with this phone number already exists' },
          { status: 409 }
        )
      }
    }

    // Create user in database
    const newUser = await createUser({
      name,
      email: cleanEmail,
      mobile,
      password,
      role: 'customer',
      status: 'active',
    })

    // Generate JWT token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      tokenVersion: newUser.tokenVersion,
    })

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        mobile: newUser.mobile,
      },
    })

    // Set HttpOnly cookie
    response.headers.set('Set-Cookie', setAuthCookie(token))

    return response
  } catch (error: any) {
    console.error('[Auth Register Error]:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
