'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Order, OrderStatus } from '@/types/domain'
import { generateProductionOutlinedSvg } from '@/lib/export/vector-outliner'
import {
  Search,
  Filter,
  RefreshCw,
  Phone,
  MapPin,
  CheckCircle2,
  Printer,
  Download,
  Eye,
  FileCheck,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'

function OrdersHubContent() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState(initialSearch)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Expanded order & modal
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null)
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (search.trim()) params.append('search', search.trim())

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch orders')
      }

      setOrders(data.orders || [])
    } catch (err: any) {
      setError(err?.message || 'Error loading orders')
    } finally {
      setIsLoading(false)
    }
  }, [search, selectedStatus])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Status update failed')
      }

      setSuccessMsg(`Order status updated to ${newStatus}`)
      fetchOrders()
    } catch (err: any) {
      alert(err?.message || 'Update failed')
    }
  }

  const handleDownloadOutlinedSvg = async (order: Order) => {
    setIsExporting(order.id)
    try {
      const designJson = order.snapshot?.designJson
      if (!designJson) {
        throw new Error('Design snapshot unavailable')
      }

      const result = await generateProductionOutlinedSvg(designJson)
      const svgContent = result.svgContent

      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `KichuBanai_Production_${order.orderNumber}_OUTLINED.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccessMsg(`Vector outlined SVG exported for #${order.orderNumber}`)
    } catch (err: any) {
      alert(err?.message || 'Export error')
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header matching Parle Bangladesh */}
      <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-xl font-bold text-gray-900 italic uppercase tracking-tight">
            Orders List
          </h1>
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
            Press Queue
          </span>
        </div>

        <div className="flex items-center gap-3 text-right flex-wrap">
          <div className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Live Sync (30s)
          </div>

          <div className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">
            Total: {orders.length}
          </div>

          <button
            onClick={() => fetchOrders()}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search and Filters matching Parle Bangladesh */}
      <div className="flex flex-col xl:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="w-full xl:flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, Customer Name, Phone, or Design..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm font-bold bg-gray-50/20"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full xl:w-48">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 hidden sm:block" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-2 sm:pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs font-bold uppercase bg-white cursor-pointer"
            >
              <option value="all">All Statuses ({orders.length})</option>
              <option value="NEW">Pending</option>
              <option value="PAYMENT_PENDING">Payment Pending</option>
              <option value="IN_PRODUCTION">In Production</option>
              <option value="APPROVED_FOR_PRINT">Approved for Print</option>
              <option value="QUALITY_CHECK">Quality Check</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Design Item</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Production Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                      <span>Synchronizing live database...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-300 font-bold uppercase tracking-widest text-[10px]">
                    No orders found matching your search criteria
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const isExpanded = expandedId === o.id
                  const config = o.snapshot?.configuration
                  const pricing = o.snapshot?.pricing

                  return (
                    <React.Fragment key={o.id}>
                      <tr className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-4 px-4 font-black text-gray-900 uppercase italic">
                          #{o.orderNumber}
                          <div className="text-[10px] text-gray-400 font-normal mt-0.5 not-italic">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-bold text-gray-800">{o.snapshot?.customer?.name || 'Customer'}</div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{o.snapshot?.customer?.phone || '—'}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5 truncate max-w-xs">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{o.snapshot?.customer?.deliveryAddress || '—'}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-bold text-gray-800">{o.snapshot?.designMetadata?.title || 'Design'}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {config?.quantity || 1} copies • {config?.materialName || 'Standard Stock'}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            ✓ Bleed: {o.snapshot?.designJson?.canvas?.bleedMm || 3}mm verified
                          </div>
                        </td>

                        <td className="py-4 px-4 font-black text-gray-900 tabular-nums text-base italic">
                          ৳{pricing?.total || 0}
                        </td>

                        <td className="py-4 px-4">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateStatus(o.id, e.target.value as OrderStatus)}
                            className="text-xs font-bold px-2.5 py-1 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer shadow-2xs uppercase"
                          >
                            <option value="NEW">Pending</option>
                            <option value="PAYMENT_PENDING">Payment Pending</option>
                            <option value="IN_PRODUCTION">In Production</option>
                            <option value="APPROVED_FOR_PRINT">Approved for Print</option>
                            <option value="QUALITY_CHECK">Quality Check</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleDownloadOutlinedSvg(o)}
                              disabled={isExporting === o.id}
                              className="px-2.5 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-red-600 font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                              title="Export Production Outlined SVG"
                            >
                              <Download className="w-3 h-3" />
                              <span>{isExporting === o.id ? 'Outlining...' : 'Vector SVG'}</span>
                            </button>

                            <button
                              onClick={() => setInspectingOrder(o)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                              title="Inspect Design Specs"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setExpandedId(isExpanded ? null : o.id)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                              title="Toggle details"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Order Details Panel */}
                      {isExpanded && (
                        <tr className="bg-gray-50/70">
                          <td colSpan={6} className="p-4 border-b border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                                  <FileCheck className="w-4 h-4 text-blue-600" />
                                  <span>Print Specifications</span>
                                </h4>
                                <ul className="space-y-1 text-gray-600">
                                  <li><strong>Quantity:</strong> {config?.quantity} units</li>
                                  <li><strong>Dimensions:</strong> {o.snapshot?.designJson?.canvas?.width} × {o.snapshot?.designJson?.canvas?.height}px</li>
                                  <li><strong>Material:</strong> {config?.materialName || 'Standard Material'}</li>
                                  <li><strong>Finish:</strong> {config?.finishName || 'Standard Finish'}</li>
                                  <li><strong>Bleed Margin:</strong> {o.snapshot?.designJson?.canvas?.bleedMm || 3}mm</li>
                                </ul>
                              </div>

                              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                                  <MapPin className="w-4 h-4 text-emerald-600" />
                                  <span>Shipping & Recipient</span>
                                </h4>
                                <p className="text-gray-600"><strong>Name:</strong> {o.snapshot?.customer?.name}</p>
                                <p className="text-gray-600 mt-1"><strong>Phone:</strong> {o.snapshot?.customer?.phone}</p>
                                <p className="text-gray-600 mt-1"><strong>Address:</strong> {o.snapshot?.customer?.deliveryAddress}</p>
                              </div>

                              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                                  <Printer className="w-4 h-4 text-red-600" />
                                  <span>Production Action</span>
                                </h4>
                                <p className="text-gray-500 text-[11px] mb-3">
                                  Vector text outlining guarantees exact typography independent of external font files.
                                </p>
                                <button
                                  onClick={() => handleDownloadOutlinedSvg(o)}
                                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download Print-Ready SVG</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Design Modal */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-red-600" />
                <h3 className="font-black text-base text-gray-900 uppercase italic">
                  Order Inspection: #{inspectingOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setInspectingOrder(null)}
                className="text-gray-400 hover:text-gray-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Customer:</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{inspectingOrder.snapshot?.customer?.name}</p>
                  <p className="text-gray-500">{inspectingOrder.snapshot?.customer?.phone}</p>
                  <p className="text-gray-500">{inspectingOrder.snapshot?.customer?.email}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Order Value:</span>
                  <p className="font-black text-gray-900 text-base mt-0.5 italic">৳{inspectingOrder.snapshot?.pricing?.total}</p>
                  <p className="text-gray-500">{inspectingOrder.snapshot?.configuration?.quantity} Copies</p>
                  <p className="text-emerald-600 font-bold uppercase">{inspectingOrder.status.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-1 uppercase tracking-wider text-[11px]">Canvas & Print Bleed Specifications</h4>
                <div className="p-3.5 rounded-xl border border-gray-100 bg-white space-y-1 text-gray-600">
                  <p><strong>Dimensions:</strong> {inspectingOrder.snapshot?.designJson?.canvas?.width} × {inspectingOrder.snapshot?.designJson?.canvas?.height}px</p>
                  <p><strong>Orientation:</strong> {inspectingOrder.snapshot?.designJson?.canvas?.orientation}</p>
                  <p><strong>Bleed Margin:</strong> {inspectingOrder.snapshot?.designJson?.canvas?.bleedMm || 3} mm</p>
                  <p><strong>Fonts Used:</strong> {inspectingOrder.snapshot?.designJson?.fontsUsed?.join(', ') || 'Standard OpenType'}</p>
                  <p><strong>Total Layer Elements:</strong> {inspectingOrder.snapshot?.designJson?.elements?.length || 0} layers</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                onClick={() => setInspectingOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadOutlinedSvg(inspectingOrder)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Outlined Vector SVG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400 font-bold uppercase">Loading Order Hub...</div>}>
      <OrdersHubContent />
    </Suspense>
  )
}
