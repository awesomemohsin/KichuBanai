'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Users, Search, Phone, Mail, RefreshCw } from 'lucide-react'

interface CustomerItem {
  id: string
  name: string
  email: string
  mobile?: string
  role: string
  status: string
  createdAt: string
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (search.trim()) params.append('search', search.trim())
      params.append('role', 'customer')

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setCustomers(data.users || [])
    } catch {
      // Ignore error
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return (
    <div className="space-y-6">
      {/* Top Header matching Parle Bangladesh */}
      <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-xl font-bold text-gray-900 italic uppercase tracking-tight">
            Customer Hub
          </h1>
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
            Registered Print Buyers
          </span>
        </div>

        <button
          onClick={() => fetchCustomers()}
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer self-start sm:self-auto"
          title="Refresh customers"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search */}
      <div className="relative bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <Search className="w-4 h-4 absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by customer name, email, or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm font-bold rounded-lg border border-gray-200 bg-gray-50/20 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Table */}
      <Card className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                    Loading customer accounts...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-300 font-bold uppercase tracking-widest text-[10px]">
                    No customer accounts found
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-900">{c.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">ID: #{c.id.slice(-8).toUpperCase()}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{c.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{c.mobile || '—'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-gray-400 font-bold italic text-xs">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
