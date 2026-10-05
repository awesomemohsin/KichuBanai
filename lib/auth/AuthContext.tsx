'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/lib/auth/jwt'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  mobile?: string
  status?: 'active' | 'disabled'
  createdAt?: string | Date
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>
  register: (data: {
    name: string
    email: string
    mobile?: string
    password: string
  }) => Promise<{ success: boolean; error?: string; user?: User }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasRole: (roles: UserRole | UserRole[]) => boolean
}

const AUTH_STORAGE_KEY = 'token'
const USER_STORAGE_KEY = 'user'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    isAdmin: false,
    isSuperAdmin: false,
    error: null,
  })

  const updateAuth = useCallback((user: User | null, token: string | null) => {
    if (token) {
      localStorage.setItem(AUTH_STORAGE_KEY, token)
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }

    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }

    const isAdmin = !!(user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'moderator'))
    const isSuperAdmin = !!(user && user.role === 'super_admin')

    setAuthState({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading: false,
      isAdmin,
      isSuperAdmin,
      error: null,
    })
  }, [])

  const logout = useCallback(async () => {
    updateAuth(null, null)
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    } catch {
      // Ignore network errors on logout
    }
    router.refresh()
  }, [router, updateAuth])

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!token) {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        logout()
        return
      }

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          updateAuth(data.user, token)
        }
      }
    } catch (err) {
      console.warn('[Auth Sync Warning]:', err)
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [logout, updateAuth])

  // Sync from localStorage on mount & listen for multi-tab synchronization
  useEffect(() => {
    const token = localStorage.getItem(AUTH_STORAGE_KEY)
    const userStr = localStorage.getItem(USER_STORAGE_KEY)

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        const isAdmin = !!(user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'moderator'))
        const isSuperAdmin = !!(user && user.role === 'super_admin')

        // Instant local restore
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          isAdmin,
          isSuperAdmin,
          error: null,
        })
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY)
      }
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }

    // Background verify & sync with database
    refreshUser()

    // Cross-tab sync handler
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY || e.key === USER_STORAGE_KEY) {
        const curToken = localStorage.getItem(AUTH_STORAGE_KEY)
        const curUserStr = localStorage.getItem(USER_STORAGE_KEY)
        if (!curToken || !curUserStr) {
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            isAdmin: false,
            isSuperAdmin: false,
            error: null,
          })
        } else {
          try {
            const parsed = JSON.parse(curUserStr)
            const isAdm = !!(parsed && (parsed.role === 'admin' || parsed.role === 'super_admin' || parsed.role === 'moderator'))
            const isSuper = !!(parsed && parsed.role === 'super_admin')
            setAuthState({
              user: parsed,
              token: curToken,
              isAuthenticated: true,
              isLoading: false,
              isAdmin: isAdm,
              isSuperAdmin: isSuper,
              error: null,
            })
          } catch {}
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [refreshUser])

  const login = useCallback(
    async (email: string, password: string) => {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Login failed')
        }

        updateAuth(data.user, data.token)
        return { success: true, user: data.user }
      } catch (error: any) {
        const errorMessage = error?.message || 'Login failed'
        setAuthState((prev) => ({ ...prev, isLoading: false, error: errorMessage }))
        return { success: false, error: errorMessage }
      }
    },
    [updateAuth]
  )

  const register = useCallback(
    async (data: { name: string; email: string; mobile?: string; password: string }) => {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const resData = await response.json()

        if (!response.ok) {
          throw new Error(resData.error || 'Registration failed')
        }

        updateAuth(resData.user, resData.token)
        return { success: true, user: resData.user }
      } catch (error: any) {
        const errorMessage = error?.message || 'Registration failed'
        setAuthState((prev) => ({ ...prev, isLoading: false, error: errorMessage }))
        return { success: false, error: errorMessage }
      }
    },
    [updateAuth]
  )

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]) => {
      if (!authState.user) return false
      const roleArray = Array.isArray(roles) ? roles : [roles]
      return roleArray.includes(authState.user.role)
    },
    [authState.user]
  )

  const value = {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
