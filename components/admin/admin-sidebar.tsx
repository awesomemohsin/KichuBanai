'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  X,
  ExternalLink,
  LogOut,
} from 'lucide-react'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { user, isSuperAdmin, logout } = useAuth()
  const [counts, setCounts] = useState({
    pendingOrders: 0,
    processingOrders: 0,
    readyForPress: 0,
  })

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/admin/stats', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (res.ok) {
          const data = await res.json()
          setCounts({
            pendingOrders: data.orderStatuses?.pending || 0,
            processingOrders: data.orderStatuses?.processing || 0,
            readyForPress: data.production?.readyForPress || 0,
          })
        }
      } catch {
        // Fallback polling
      }
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 45000)
    return () => clearInterval(interval)
  }, [])

  const navGroups = [
    {
      title: 'Operations & Orders',
      items: [
        {
          label: 'Dashboard',
          href: '/admin/dashboard',
        },
        {
          label: 'Order Hub',
          href: '/admin/orders',
          badge: counts.pendingOrders + counts.processingOrders > 0 ? counts.pendingOrders + counts.processingOrders : undefined,
        },
        {
          label: 'Print & Preflight',
          href: '/admin/production',
          badge: counts.readyForPress > 0 ? counts.readyForPress : undefined,
        },
        {
          label: 'Customer Hub',
          href: '/admin/customers',
          accentClass: 'text-amber-500',
        },
        {
          label: 'Revenue & Economics',
          href: '/admin/revenue',
        },
      ],
    },
    {
      title: 'Design & Templates',
      items: [
        {
          label: 'Master Templates',
          href: '/admin/templates',
        },
        {
          label: 'Categories',
          href: '/admin/categories',
        },
      ],
    },
    {
      title: 'System & Clearance',
      items: [
        {
          label: 'Manage Admins / Staff',
          href: '/admin/users',
          accentClass: 'text-amber-500',
        },
        {
          label: 'Activity Logs',
          href: '/admin/activities',
        },
      ],
    },
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col h-full z-[150]
          transition-transform duration-300 ease-in-out transform border-r border-gray-800
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <Link href="/admin/dashboard" onClick={onClose} className="hover:opacity-80 transition-opacity">
            <h2 className="text-2xl font-bold italic tracking-tighter">
              KichuBanai <span className="text-red-600">Admin</span>
            </h2>
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mt-1">
              Control Panel
            </p>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info Card */}
        <div className="p-4 bg-gray-800/50 mx-4 mt-6 rounded-2xl flex items-center gap-4 border border-white/5 hover:bg-gray-800 transition-colors group cursor-pointer">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-900/20 group-hover:scale-105 transition-transform shrink-0">
            <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
              {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN USER'}
            </p>
            <p className="font-black text-sm truncate uppercase tracking-tight italic text-white group-hover:text-red-500 transition-colors">
              {user?.name || 'MOHSIN'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title} className="bg-white/5 rounded-[1.5rem] p-2 border border-white/5">
              <div className="px-4 pb-2 pt-1 border-b border-white/5 mb-2">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] italic">
                  {group.title}
                </p>
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onClose}
                      className={`
                        w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold uppercase text-[11px] tracking-widest italic transition-all relative group
                        ${
                          isActive
                            ? 'text-white bg-white/10 font-black shadow-inner'
                            : `${item.accentClass || 'text-gray-400'} hover:text-white hover:bg-white/5`
                        }
                      `}
                    >
                      <span className="truncate">{item.label}</span>

                      {item.badge !== undefined && (
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-red-900/20 group-hover:scale-110 transition-transform shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* External Link back to Studio */}
          <div className="bg-white/5 rounded-[1.5rem] p-2 border border-white/5">
            <Link
              href="/"
              onClick={onClose}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold uppercase text-[11px] tracking-widest italic text-red-500 hover:text-red-400 hover:bg-white/5 transition-colors"
            >
              <span>Back to Studio</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </Link>
          </div>
        </nav>

        {/* System Health Status Indicator */}
        <div className="px-5 py-3 border-t border-gray-800 bg-black/40">
          <SystemStatusIndicator />
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => logout()}
            className="w-full py-3 bg-white/5 hover:bg-red-600 border border-white/10 hover:border-red-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>LOGOUT</span>
          </button>
        </div>
      </aside>
    </>
  )
}

function SystemStatusIndicator() {
  const [status, setStatus] = useState({ online: true, database: 'Connected', latency: '24ms' })

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health')
        if (res.ok) {
          const data = await res.json()
          setStatus({ online: true, database: data.database, latency: data.latency })
        } else {
          setStatus((s) => ({ ...s, online: false, database: 'Error' }))
        }
      } catch {
        setStatus((s) => ({ ...s, online: false }))
      }
    }

    checkHealth()
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkHealth()
      }
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-2 h-2 rounded-full ${
          status.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
        } shadow-[0_0_8px_rgba(16,185,129,0.5)]`}
      />
      <div className="flex flex-col">
        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest italic">
          System Status
        </span>
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
          {status.online ? 'Cloud Synchronized' : 'Sync Interrupted'}
        </span>
      </div>
      <div className="ml-auto flex flex-col items-end">
        <span className="text-[7px] font-black text-gray-600 uppercase italic">Ping</span>
        <span className="text-[9px] font-black text-gray-400 italic leading-none">
          {status.latency}
        </span>
      </div>
    </div>
  )
}
