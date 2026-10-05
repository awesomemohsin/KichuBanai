'use client'

import React, { useState } from 'react'
import { CheckCircle2, Clock, ExternalLink, Package, Printer, Truck } from 'lucide-react'
import { Order } from '@/types/domain'
import { OrderService } from '@/lib/orders/order-service'

interface MyOrdersViewProps {
  onStartDesign: () => void
}

export function MyOrdersView({ onStartDesign }: MyOrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>(() => OrderService.getOrders())
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(orders[0]?.id || null)

  const selectedOrder = orders.find((o) => o.id === selectedOrderId)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">New Order</span>
      case 'APPROVED_FOR_PRINT':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Approved for Print</span>
      case 'IN_PRODUCTION':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">In Production</span>
      case 'COURIER_ASSIGNED':
      case 'SHIPPED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">Shipped with Courier</span>
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Delivered</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#20201f] m-0">My Print Orders</h2>
          <p className="text-xs text-[#817e79] mt-1 mb-0">
            Track print production, prepress status, and home delivery across Bangladesh.
          </p>
        </div>
        <button
          onClick={onStartDesign}
          className="px-4 py-2 rounded-lg bg-[#e26f5b] hover:bg-[#b84d3b] text-white text-xs font-bold transition-all"
        >
          Create New Print Order
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#cfc9c1] p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#f2f0ec] text-[#817e79] mx-auto flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#20201f] m-0">No Print Orders Yet</h3>
            <p className="text-xs text-[#817e79] max-w-sm mx-auto">
              Customize any template or start a blank design, then click &ldquo;Order Print&rdquo; to order physical printed products.
            </p>
          </div>
          <button
            onClick={onStartDesign}
            className="px-4 py-2 rounded-md bg-[#242322] text-white text-xs font-semibold"
          >
            Start Designing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-5 space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => setSelectedOrderId(ord.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedOrderId === ord.id
                    ? 'bg-white border-[#e26f5b] shadow-sm'
                    : 'bg-[#faf9f7] border-[#e4e1dc] hover:bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-xs text-[#20201f]">{ord.orderNumber}</span>
                  {getStatusBadge(ord.status)}
                </div>
                <div className="text-xs text-[#6e6861] font-medium">
                  {ord.snapshot.configuration.productName} · {ord.snapshot.configuration.quantity} units
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#f2f0ec] text-[11px] text-[#99938d]">
                  <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                  <span className="font-bold text-[#20201f]">৳{ord.snapshot.pricing.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Order Detail */}
          {selectedOrder && (
            <div className="lg:col-span-7 bg-white rounded-xl border border-[#e4e1dc] p-6 space-y-6">
              <div className="flex justify-between items-start pb-4 border-b border-[#f2f0ec]">
                <div>
                  <span className="text-[10px] font-bold text-[#817e79] uppercase tracking-wider">Order Snapshot</span>
                  <h3 className="text-lg font-bold text-[#20201f] m-0">{selectedOrder.orderNumber}</h3>
                  <p className="text-xs text-[#817e79] mt-0.5 mb-0">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>

              {/* Courier Tracking Status (Rule 44) */}
              {selectedOrder.courier && (
                <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    <span>Courier Shipment Dispatched</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-indigo-900">
                    <div>
                      <span className="text-indigo-600 text-[10px] block">Courier:</span>
                      <strong>{selectedOrder.courier.courierName}</strong>
                    </div>
                    <div>
                      <span className="text-indigo-600 text-[10px] block">Tracking Code:</span>
                      <code className="bg-indigo-100/70 px-1.5 py-0.5 rounded text-[11px] font-mono">
                        {selectedOrder.courier.trackingNumber}
                      </code>
                    </div>
                  </div>
                  <div className="text-[11px] text-indigo-700 pt-1">
                    Estimated Delivery: <strong>{selectedOrder.courier.estimatedDelivery}</strong>
                  </div>
                </div>
              )}

              {/* Specifications */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#242322] flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-[#e26f5b]" /> Product & Paper Specifications
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#faf9f7] p-3 rounded-lg border border-[#e4e1dc]">
                  <div>
                    <span className="text-[#817e79] block text-[10px]">Product</span>
                    <strong className="text-[#20201f]">{selectedOrder.snapshot.configuration.productName}</strong>
                  </div>
                  <div>
                    <span className="text-[#817e79] block text-[10px]">Size</span>
                    <strong className="text-[#20201f]">{selectedOrder.snapshot.configuration.sizeName}</strong>
                  </div>
                  <div>
                    <span className="text-[#817e79] block text-[10px]">Material</span>
                    <strong className="text-[#20201f]">{selectedOrder.snapshot.configuration.materialName}</strong>
                  </div>
                  <div>
                    <span className="text-[#817e79] block text-[10px]">Finish</span>
                    <strong className="text-[#20201f]">{selectedOrder.snapshot.configuration.finishName}</strong>
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#242322] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#e26f5b]" /> Production Timeline
                </h4>
                <div className="space-y-2 border-l-2 border-[#e4e1dc] pl-4 ml-2">
                  {selectedOrder.statusHistory.map((hist, i) => (
                    <div key={i} className="text-xs space-y-0.5 relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#e26f5b]" />
                      <div className="font-semibold text-[#20201f]">{hist.status}</div>
                      <div className="text-[10px] text-[#817e79]">{hist.note} · {new Date(hist.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
