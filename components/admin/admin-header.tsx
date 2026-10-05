'use client'

import React from 'react'
import Link from 'next/link'
import { Menu, ExternalLink, Bell } from 'lucide-react'

interface AdminHeaderProps {
  onOpenMobileSidebar: () => void
}

export function AdminHeader({ onOpenMobileSidebar }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-gray-900 border-2 border-gray-100 rounded-xl bg-white hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden lg:flex flex-col">
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
            Management Console
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            System Admin Hub
          </p>
        </div>

        <div className="lg:hidden flex flex-col">
          <h3 className="text-[16px] font-black text-red-600 uppercase tracking-tighter italic leading-none">
            KichuBanai Admin
          </h3>
          <p className="text-[8px] font-bold text-gray-900 uppercase tracking-widest mt-0.5">
            Control Panel
          </p>
        </div>
      </div>

      {/* Centered Frontend Site Link */}
      <div className="flex items-center justify-center">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-[11px] font-black uppercase tracking-wider text-slate-700 hover:text-red-600 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition-all duration-200 shadow-sm active:scale-95 group"
        >
          <span className="hidden sm:inline">KichuBanai Site</span>
          <span className="sm:hidden">Studio</span>
          <ExternalLink className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400 group-hover:text-red-500 transition-colors" />
        </Link>
      </div>

      {/* Right Notifications & Status */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative text-gray-400 hover:text-red-600 hover:bg-red-50 h-10 w-10 p-0 rounded-2xl border border-gray-100 flex items-center justify-center shadow-xs transition-all cursor-pointer"
          title="Notification Center"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full animate-ping" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.5)] border border-white" />
        </button>

        <div className="hidden md:flex flex-col items-end border-l border-gray-100 pl-4">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
            System Status
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-tighter">
              Encrypted Link Active
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
