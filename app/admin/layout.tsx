'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AdminSidebar from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { ShieldAlert } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
    setMobileSidebarOpen(false)
  }, [pathname])

  // Authentication & Security clearance guard
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`)
      } else if (!isAdmin) {
        alert('ACCESS DENIED: Administrative clearance required.')
        router.replace('/')
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router, pathname])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">
          Initializing Admin Systems...
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-6 px-4 text-center">
        <ShieldAlert className="w-20 h-20 text-red-600 animate-bounce" />
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">
            SECURITY ALERT
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Identifying authorization clearance...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex bg-gray-50 overflow-hidden z-[100]">
      {/* Sidebar (Desktop & Mobile Drawer) */}
      <div>
        <AdminSidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 overflow-auto bg-[#F9FAFB] relative px-4 md:px-8 pt-8">
          <div className="pb-12 max-w-[1600px] mx-auto w-full min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
