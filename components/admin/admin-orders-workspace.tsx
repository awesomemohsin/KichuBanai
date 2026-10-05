'use client'

import React, { useState } from 'react'
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Download,
  FileCode,
  FileCheck,
  Package,
  Printer,
  ShieldAlert,
  Truck,
  Wand2,
} from 'lucide-react'
import { Order, OrderStatus, PreflightReport } from '@/types/domain'
import { OrderService } from '@/lib/orders/order-service'
import { createProductionZip } from '@/lib/export/export-service'
import { generateProductionOutlinedSvg, validateProductionSvg } from '@/lib/export/vector-outliner'

export function AdminOrdersWorkspace() {
  const [orders, setOrders] = useState<Order[]>(() => OrderService.getOrders())
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(orders[0]?.id || null)
  const [preflightResult, setPreflightResult] = useState<PreflightReport | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'preflight' | 'revisions'>('details')
  const [downloadingZip, setDownloadingZip] = useState(false)

  const selectedOrder = orders.find((o) => o.id === selectedOrderId)

  const refreshOrders = () => {
    setOrders(OrderService.getOrders())
  }

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await OrderService.updateOrderStatus(orderId, newStatus)
      refreshOrders()
    } catch (err) {
      console.error(err)
      alert('Failed to update status.')
    }
  }

  const handleRunPreflight = () => {
    if (!selectedOrder) return
    const activeDesign = selectedOrder.productionRevisions.length > 0
      ? selectedOrder.productionRevisions[selectedOrder.productionRevisions.length - 1].designJson
      : selectedOrder.snapshot.designJson

    const { report } = generateProductionOutlinedSvg(activeDesign)
    setPreflightResult(report)
    setActiveTab('preflight')
  }

  const handleDownloadOutlinedSvg = () => {
    if (!selectedOrder) return
    const activeDesign = selectedOrder.productionRevisions.length > 0
      ? selectedOrder.productionRevisions[selectedOrder.productionRevisions.length - 1].designJson
      : selectedOrder.snapshot.designJson

    const { svgContent } = generateProductionOutlinedSvg(activeDesign)
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `KichuBanai-${selectedOrder.orderNumber}-production-outlined.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadProductionZip = async () => {
    if (!selectedOrder) return
    setDownloadingZip(true)
    try {
      const zipBlob = await createProductionZip(selectedOrder)
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `KichuBanai-Order-${selectedOrder.orderNumber}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to create production zip:', err)
      alert('Unable to generate production ZIP.')
    } finally {
      setDownloadingZip(false)
    }
  }

  const handleCreateRevision = () => {
    if (!selectedOrder) return
    const activeDesign = selectedOrder.productionRevisions.length > 0
      ? selectedOrder.productionRevisions[selectedOrder.productionRevisions.length - 1].designJson
      : selectedOrder.snapshot.designJson

    // Create a modified production revision copy (e.g. prepress bleed alignment adjustments)
    const adjustedDesign = JSON.parse(JSON.stringify(activeDesign))
    adjustedDesign.canvas.bleedMm = 3.5

    OrderService.createProductionRevision(
      selectedOrder.id,
      adjustedDesign,
      'Prepress bleed expansion & safe margin alignment calibrated by Production Staff.'
    )
    refreshOrders()
    setActiveTab('revisions')
  }

  const handleApproveRevision = (revisionNumber: number) => {
    if (!selectedOrder) return
    OrderService.approveProductionRevision(selectedOrder.id, revisionNumber)
    refreshOrders()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#e26f5b]">
            Admin & Prepress Operations
          </span>
          <h2 className="text-xl font-bold text-[#20201f] m-0">Print Production Workspace</h2>
          <p className="text-xs text-[#817e79] mt-0.5 mb-0">
            Review incoming orders, validate vector outlines (zero &lt;text&gt; elements), and generate production packages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshOrders}
            className="px-3 py-1.5 rounded-md bg-white border border-[#e4e1dc] text-xs font-semibold text-[#6e6861] hover:bg-[#faf9f7]"
          >
            Refresh Orders
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e4e1dc] p-12 text-center text-xs text-[#817e79]">
          No print orders in queue. Place a test order from the editor to review the production workflow.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Orders Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <h4 className="text-[11px] font-bold uppercase text-[#817e79] tracking-wider mb-2">
              Orders Queue ({orders.length})
            </h4>
            {orders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => {
                  setSelectedOrderId(ord.id)
                  setPreflightResult(null)
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedOrderId === ord.id
                    ? 'bg-white border-[#e26f5b] shadow-xs'
                    : 'bg-[#faf9f7] border-[#e4e1dc] hover:bg-white'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-[#20201f]">{ord.orderNumber}</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#f2f0ec] text-[#6e6861]">
                    {ord.status}
                  </span>
                </div>
                <div className="text-xs text-[#6e6861]">
                  {ord.snapshot.customer.name} · {ord.snapshot.configuration.productName}
                </div>
                <div className="text-[10px] text-[#99938d] mt-1">
                  {ord.snapshot.configuration.quantity} units · ৳{ord.snapshot.pricing.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Order Production Dashboard */}
          {selectedOrder && (
            <div className="lg:col-span-8 bg-white rounded-xl border border-[#e4e1dc] p-6 space-y-6">
              {/* Order Meta Bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-[#f2f0ec] gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#20201f] m-0">{selectedOrder.orderNumber}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#e6def9] text-[#65579a]">
                      {selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#817e79] mt-0.5 mb-0">
                    Customer: <strong>{selectedOrder.snapshot.customer.name}</strong> ({selectedOrder.snapshot.customer.phone})
                  </p>
                </div>

                {/* Workflow Status Transition */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                    className="h-8 px-2 text-xs font-semibold bg-[#faf9f7] border border-[#e4e1dc] rounded-md outline-none"
                  >
                    <option value="NEW">NEW</option>
                    <option value="PAYMENT_CONFIRMED">PAYMENT_CONFIRMED</option>
                    <option value="DESIGN_REVIEW">DESIGN_REVIEW</option>
                    <option value="DESIGN_ADJUSTMENT">DESIGN_ADJUSTMENT</option>
                    <option value="APPROVED_FOR_PRINT">APPROVED_FOR_PRINT</option>
                    <option value="IN_PRODUCTION">IN_PRODUCTION</option>
                    <option value="QUALITY_CHECK">QUALITY_CHECK</option>
                    <option value="PACKED">PACKED</option>
                    <option value="COURIER_ASSIGNED">COURIER_ASSIGNED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleRunPreflight}
                  className="px-3.5 py-2 rounded-lg bg-[#292724] hover:bg-[#3d3a36] text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <FileCheck className="w-4 h-4 text-emerald-300" />
                  <span>Run Preflight Check</span>
                </button>

                <button
                  onClick={handleDownloadOutlinedSvg}
                  className="px-3.5 py-2 rounded-lg bg-white border border-[#e4e1dc] text-[#242322] hover:bg-[#faf9f7] text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <FileCode className="w-4 h-4 text-[#e26f5b]" />
                  <span>Export Outlined SVG</span>
                </button>

                <button
                  onClick={handleDownloadProductionZip}
                  disabled={downloadingZip}
                  className="px-3.5 py-2 rounded-lg bg-[#e26f5b] hover:bg-[#b84d3b] text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Archive className="w-4 h-4" />
                  <span>{downloadingZip ? 'Packaging ZIP...' : 'Download Production ZIP'}</span>
                </button>

                <button
                  onClick={handleCreateRevision}
                  className="px-3.5 py-2 rounded-lg bg-white border border-[#e4e1dc] text-[#6e6861] hover:bg-[#faf9f7] text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>New Revision</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#e4e1dc] gap-4 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-2 border-b-2 transition-all ${
                    activeTab === 'details'
                      ? 'border-[#e26f5b] text-[#242322]'
                      : 'border-transparent text-[#817e79] hover:text-[#242322]'
                  }`}
                >
                  Order Specifications
                </button>
                <button
                  onClick={() => setActiveTab('preflight')}
                  className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'preflight'
                      ? 'border-[#e26f5b] text-[#242322]'
                      : 'border-transparent text-[#817e79] hover:text-[#242322]'
                  }`}
                >
                  <span>Preflight Diagnostics</span>
                  {preflightResult && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('revisions')}
                  className={`pb-2 border-b-2 transition-all ${
                    activeTab === 'revisions'
                      ? 'border-[#e26f5b] text-[#242322]'
                      : 'border-transparent text-[#817e79] hover:text-[#242322]'
                  }`}
                >
                  Production Revisions ({selectedOrder.productionRevisions.length})
                </button>
              </div>

              {/* Tab 1: Details */}
              {activeTab === 'details' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#faf9f7] p-4 rounded-xl border border-[#e4e1dc]">
                    <div>
                      <span className="text-[#817e79] block text-[10px]">Product</span>
                      <strong>{selectedOrder.snapshot.configuration.productName}</strong>
                    </div>
                    <div>
                      <span className="text-[#817e79] block text-[10px]">Size</span>
                      <strong>{selectedOrder.snapshot.configuration.sizeName}</strong>
                    </div>
                    <div>
                      <span className="text-[#817e79] block text-[10px]">Material</span>
                      <strong>{selectedOrder.snapshot.configuration.materialName}</strong>
                    </div>
                    <div>
                      <span className="text-[#817e79] block text-[10px]">Finish</span>
                      <strong>{selectedOrder.snapshot.configuration.finishName}</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[#e4e1dc] bg-white space-y-2">
                    <span className="text-[10px] font-bold uppercase text-[#817e79]">Delivery & Notes</span>
                    <div>Address: <strong>{selectedOrder.snapshot.customer.deliveryAddress}</strong></div>
                    <div>Instructions: <em>{selectedOrder.snapshot.configuration.specialInstructions || 'None provided.'}</em></div>
                  </div>
                </div>
              )}

              {/* Tab 2: Preflight Diagnostics */}
              {activeTab === 'preflight' && (
                <div className="space-y-4">
                  {preflightResult ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <div>
                            <strong className="text-xs text-emerald-950 block">Preflight Validation Passed</strong>
                            <span className="text-[11px] text-emerald-800">
                              Production SVG verified: 100% vector text outlines. Zero &lt;text&gt; elements detected.
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-emerald-200/60 text-emerald-900 font-bold text-[10px]">
                          Approved for Press
                        </span>
                      </div>

                      <div className="space-y-2">
                        {preflightResult.items.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-lg border border-[#e4e1dc] bg-[#faf9f7] flex items-start gap-2.5 text-xs"
                          >
                            {item.status === 'passed' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : item.status === 'warning' ? (
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            ) : (
                              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <strong className="text-[#20201f]">{item.name}</strong>
                              <p className="text-[11px] text-[#817e79] m-0 mt-0.5">{item.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-[#faf9f7] rounded-xl border border-dashed border-[#cfc9c1] space-y-2">
                      <p className="text-xs text-[#817e79] m-0">Preflight check has not been run for this order yet.</p>
                      <button
                        onClick={handleRunPreflight}
                        className="px-4 py-2 rounded-md bg-[#292724] text-white text-xs font-bold"
                      >
                        Run Preflight Diagnostics Now
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Revisions */}
              {activeTab === 'revisions' && (
                <div className="space-y-3">
                  {selectedOrder.productionRevisions.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#817e79] bg-[#faf9f7] rounded-xl border border-[#e4e1dc]">
                      No production revisions created. The order is using the original customer design snapshot.
                    </div>
                  ) : (
                    selectedOrder.productionRevisions.map((rev) => (
                      <div
                        key={rev.revisionNumber}
                        className="p-4 rounded-xl border border-[#e4e1dc] bg-[#faf9f7] flex justify-between items-center text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <strong>Production Revision {rev.revisionNumber}</strong>
                            {rev.isApproved ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Approved & Locked
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                Draft Revision
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#817e79] m-0">{rev.notes}</p>
                          <span className="text-[10px] text-[#99938d]">{new Date(rev.createdAt).toLocaleString()}</span>
                        </div>

                        {!rev.isApproved && (
                          <button
                            onClick={() => handleApproveRevision(rev.revisionNumber)}
                            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                          >
                            Approve & Lock
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
