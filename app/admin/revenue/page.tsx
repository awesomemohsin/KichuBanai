'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, ArrowUpRight, Printer, Layers, FileCheck } from 'lucide-react'

export default function AdminRevenuePage() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {})
  }, [])

  const totalRev = stats?.totalRevenue || 0
  const orderCount = stats?.totalOrders || 1
  const aov = Math.round(totalRev / (orderCount || 1))

  return (
    <div className="space-y-8">
      {/* Top Header matching Parle Bangladesh */}
      <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-xl font-bold text-gray-900 italic uppercase tracking-tight">
            Revenue & Print Economics
          </h1>
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            Commercial Press Margins
          </span>
        </div>
        <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          Live Commercial Economics
        </div>
      </div>

      {/* Main KPI Cards in Parle Bangladesh Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 bg-slate-900 text-white rounded-xl border-none shadow-md">
          <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
            Gross Sales Volume
          </div>
          <div className="text-4xl font-black tabular-nums mt-1 text-white">
            ৳{totalRev.toLocaleString('en-US')}
          </div>
          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-3">
            <ArrowUpRight className="w-3.5 h-3.5" /> Direct to production press
          </div>
        </Card>

        <Card className="p-6 bg-white rounded-xl border-none shadow-sm">
          <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
            Average Order Value (AOV)
          </div>
          <div className="text-4xl font-black text-gray-900 mt-1 tabular-nums">
            ৳{aov.toLocaleString('en-US')}
          </div>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-3">
            Per customer print order
          </div>
        </Card>

        <Card className="p-6 bg-white rounded-xl border-none shadow-sm border-l-4 border-l-emerald-500">
          <div className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-1">
            Estimated Gross Margin
          </div>
          <div className="text-4xl font-black text-gray-900 mt-1 tabular-nums">
            64.2%
          </div>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-3">
            After paper stock & ink overhead
          </div>
        </Card>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Contribution */}
        <Card className="p-6 bg-white rounded-xl border-none shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight italic">
            Category Revenue Contribution
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50/70 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900 text-xs">Business Cards & Stationery</span>
                <div className="text-[10px] text-gray-400">High-volume corporate prints</div>
              </div>
              <span className="font-black text-sm text-gray-900 italic">48%</span>
            </div>

            <div className="p-3 bg-gray-50/70 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900 text-xs">Menus & Hospitality Prints</span>
                <div className="text-[10px] text-gray-400">Restaurants, cafes & dining</div>
              </div>
              <span className="font-black text-sm text-gray-900 italic">26%</span>
            </div>

            <div className="p-3 bg-gray-50/70 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900 text-xs">Flyers & Event Marketing</span>
                <div className="text-[10px] text-gray-400">Corporate & retail launches</div>
              </div>
              <span className="font-black text-sm text-gray-900 italic">16%</span>
            </div>

            <div className="p-3 bg-gray-50/70 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900 text-xs">Custom Badges & Labels</span>
                <div className="text-[10px] text-gray-400">Product packaging & stickers</div>
              </div>
              <span className="font-black text-sm text-gray-900 italic">10%</span>
            </div>
          </div>
        </Card>

        {/* Paper Stock Preferences */}
        <Card className="p-6 bg-white rounded-xl border-none shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight italic">
            Paper Stock Preferences
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50/70 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900 text-xs">300gsm Premium Art Card (Matte)</span>
                <div className="text-[10px] text-emerald-600 font-bold">Standard flagship media</div>
              </div>
              <span className="font-black text-sm text-emerald-600 italic">58% of orders</span>
            </div>

            <div className="p-3 bg-gray-50/70 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900 text-xs">350gsm Heavyweight Gloss</span>
                <div className="text-[10px] text-blue-600 font-bold">Premium rigid cards</div>
              </div>
              <span className="font-black text-sm text-gray-900 italic">24% of orders</span>
            </div>

            <div className="p-3 bg-gray-50/70 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900 text-xs">Recycled Kraft Texture</span>
                <div className="text-[10px] text-amber-600 font-bold">Eco-friendly artisanal finish</div>
              </div>
              <span className="font-black text-sm text-gray-900 italic">18% of orders</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
