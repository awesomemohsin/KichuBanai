'use client'

import React, { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, ChevronRight, Package, Printer, Sparkles, Truck, X } from 'lucide-react'
import { DesignData, DesignMetadata, Order, PrintConfiguration } from '@/types/domain'
import { PRINT_PRODUCTS } from '@/lib/print/print-catalog'
import { PricingService } from '@/lib/pricing/pricing-service'
import { OrderService } from '@/lib/orders/order-service'

interface PrintOrderDialogProps {
  isOpen: boolean
  onClose: () => void
  design: DesignData
  metadata: DesignMetadata
  onOrderSuccess: (order: Order) => void
}

export function PrintOrderDialog({ isOpen, onClose, design, metadata, onOrderSuccess }: PrintOrderDialogProps) {
  // Determine suitable initial product based on design category
  const initialProduct = useMemo(() => {
    if (metadata.category.toLowerCase().includes('card')) return PRINT_PRODUCTS[0]
    if (metadata.category.toLowerCase().includes('menu')) return PRINT_PRODUCTS[1]
    if (metadata.category.toLowerCase().includes('poster')) return PRINT_PRODUCTS[2]
    return PRINT_PRODUCTS[0]
  }, [metadata.category])

  const [productId, setProductId] = useState<string>(initialProduct.id)
  const product = useMemo(() => PRINT_PRODUCTS.find((p) => p.id === productId) || PRINT_PRODUCTS[0], [productId])

  const [sizeId, setSizeId] = useState<string>(product.standardSizes[0]?.id || '')
  const [quantity, setQuantity] = useState<number>(product.quantityTiers[1] || 100)
  const [materialId, setMaterialId] = useState<string>(product.materials[0]?.id || '')
  const [finishId, setFinishId] = useState<string>(product.finishes[0]?.id || '')

  // Delivery & Customer inputs
  const [customerName, setCustomerName] = useState('Alex Morgan')
  const [customerEmail, setCustomerEmail] = useState('alex@kichubanai.com')
  const [phoneNumber, setPhoneNumber] = useState('+880 1711 000000')
  const [deliveryAddress, setDeliveryAddress] = useState('House 42, Road 11, Banani, Dhaka 1213')
  const [specialInstructions, setSpecialInstructions] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)

  // Recalculate price in real-time server service
  const priceBreakdown = useMemo(() => {
    const config: PrintConfiguration = {
      productId: product.id,
      productName: product.name,
      sizeId: sizeId || product.standardSizes[0]?.id || '',
      sizeName: product.standardSizes.find((s) => s.id === sizeId)?.name || product.standardSizes[0]?.name || '',
      quantity,
      materialId: materialId || product.materials[0]?.id || '',
      materialName: product.materials.find((m) => m.id === materialId)?.name || product.materials[0]?.name || '',
      finishId: finishId || product.finishes[0]?.id || '',
      finishName: product.finishes.find((f) => f.id === finishId)?.name || product.finishes[0]?.name || '',
      deliveryAddress,
      phoneNumber,
      specialInstructions,
    }

    try {
      return PricingService.calculatePrice(config)
    } catch {
      return null
    }
  }, [product, sizeId, quantity, materialId, finishId, deliveryAddress, phoneNumber, specialInstructions])

  if (!isOpen) return null

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const config: PrintConfiguration = {
        productId: product.id,
        productName: product.name,
        sizeId: sizeId || product.standardSizes[0]?.id || '',
        sizeName: product.standardSizes.find((s) => s.id === sizeId)?.name || product.standardSizes[0]?.name || '',
        quantity,
        materialId: materialId || product.materials[0]?.id || '',
        materialName: product.materials.find((m) => m.id === materialId)?.name || product.materials[0]?.name || '',
        finishId: finishId || product.finishes[0]?.id || '',
        finishName: product.finishes.find((f) => f.id === finishId)?.name || product.finishes[0]?.name || '',
        deliveryAddress,
        phoneNumber,
        specialInstructions,
      }

      const orderPayload = {
        designId: metadata.id,
        configuration: config,
        customer: {
          userId: metadata.ownerId,
          name: customerName,
          email: customerEmail,
          phone: phoneNumber,
          deliveryAddress,
        },
      }

      const order = await OrderService.createOrder(orderPayload, design, metadata)
      setCreatedOrder(order)
      onOrderSuccess(order)
    } catch (err) {
      console.error('Failed to submit print order:', err)
      alert('Unable to place order. Please review your entries and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#24232299] backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#fbfaf8] rounded-2xl shadow-2xl overflow-hidden border border-[#e4e1dc] my-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-600 flex items-center justify-center shadow-xs"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {createdOrder ? (
          /* Order Confirmation Screen */
          <div className="p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-emerald-700 font-bold">
                Order Received · {createdOrder.orderNumber}
              </span>
              <h2 className="text-2xl font-bold text-[#20201f] m-0">Print Order Confirmed!</h2>
              <p className="text-xs text-[#817e79] max-w-md mx-auto">
                An immutable design snapshot has been saved. Our production team will review vector outlines and prepare your order for press.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#e4e1dc] max-w-md mx-auto text-left space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#f2f0ec]">
                <span className="text-[#817e79]">Product:</span>
                <span className="font-semibold text-[#20201f]">{createdOrder.snapshot.configuration.productName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f2f0ec]">
                <span className="text-[#817e79]">Quantity:</span>
                <span className="font-semibold text-[#20201f]">{createdOrder.snapshot.configuration.quantity} units</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f2f0ec]">
                <span className="text-[#817e79]">Total (BDT):</span>
                <span className="font-bold text-[#e26f5b] text-sm">৳{createdOrder.snapshot.pricing.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-emerald-700 font-medium">
                <span>Estimated Delivery:</span>
                <span>3–5 business days</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-[#292724] text-white text-xs font-bold hover:bg-[#3d3a36]"
            >
              Close & View Orders
            </button>
          </div>
        ) : (
          /* Order Configuration Form */
          <div>
            <div className="p-6 md:p-8 bg-[#e6def9] border-b border-[#dcd4f0]">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-[#65579a] mb-2">
                <img src="/favicon.png" alt="KichuBanai" className="w-4 h-4 object-contain inline-block rounded-xs" />
                <span>KichuBanai Physical Print Studio</span>
              </span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#242322] m-0">
                Turn your design into reality.
              </h2>
              <p className="text-xs text-[#726986] mt-1 mb-0">
                Premium materials, professional prepress outline checks, and direct doorstep delivery across Bangladesh.
              </p>
            </div>

            <form onSubmit={handlePlaceOrder} className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column: Product Specifications */}
              <div className="md:col-span-7 space-y-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#242322] flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#e26f5b]" /> 1. Print Specifications
                </h4>

                {/* Product Select */}
                <div>
                  <label className="block text-[11px] font-bold text-[#6e6861] mb-1">Print Product</label>
                  <select
                    value={productId}
                    onChange={(e) => {
                      setProductId(e.target.value)
                      const newProd = PRINT_PRODUCTS.find((p) => p.id === e.target.value)
                      if (newProd) {
                        setSizeId(newProd.standardSizes[0]?.id || '')
                        setQuantity(newProd.quantityTiers[1] || 100)
                        setMaterialId(newProd.materials[0]?.id || '')
                        setFinishId(newProd.finishes[0]?.id || '')
                      }
                    }}
                    className="w-full h-9 px-3 text-xs bg-white border border-[#e4e1dc] rounded-md outline-none"
                  >
                    {PRINT_PRODUCTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Size & Quantity Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6e6861] mb-1">Standard Size</label>
                    <select
                      value={sizeId}
                      onChange={(e) => setSizeId(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-white border border-[#e4e1dc] rounded-md outline-none"
                    >
                      {product.standardSizes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#6e6861] mb-1">Quantity</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full h-9 px-3 text-xs bg-white border border-[#e4e1dc] rounded-md outline-none font-semibold"
                    >
                      {product.quantityTiers.map((q) => (
                        <option key={q} value={q}>
                          {q} copies
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Material & Finish Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6e6861] mb-1">Paper & Material</label>
                    <select
                      value={materialId}
                      onChange={(e) => setMaterialId(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-white border border-[#e4e1dc] rounded-md outline-none"
                    >
                      {product.materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#6e6861] mb-1">Surface Finish</label>
                    <select
                      value={finishId}
                      onChange={(e) => setFinishId(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-white border border-[#e4e1dc] rounded-md outline-none"
                    >
                      {product.finishes.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#242322] flex items-center gap-1.5 mb-3">
                    <Truck className="w-4 h-4 text-[#e26f5b]" /> 2. Delivery & Customer Details
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#817e79] mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full h-9 px-3 text-xs bg-white border border-[#e4e1dc] rounded-md outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#817e79] mb-1">Phone Number</label>
                        <input
                          type="text"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full h-9 px-3 text-xs bg-white border border-[#e4e1dc] rounded-md outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#817e79] mb-1">Delivery Address (Bangladesh)</label>
                      <input
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-white border border-[#e4e1dc] rounded-md outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Pricing & Review */}
              <div className="md:col-span-5 flex flex-col justify-between bg-white p-5 rounded-xl border border-[#e4e1dc] space-y-5">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ec]">
                    <span className="text-xs font-bold text-[#20201f]">Live Price Calculation</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Server Verified
                    </span>
                  </div>

                  {priceBreakdown && (
                    <div className="py-4 space-y-2.5 text-xs">
                      <div className="flex justify-between text-[#817e79]">
                        <span>Base Cost ({quantity} × ৳{priceBreakdown.unitPrice}):</span>
                        <span className="text-[#20201f] font-medium">৳{priceBreakdown.subtotal.toFixed(2)}</span>
                      </div>
                      {priceBreakdown.finishCost > 0 && (
                        <div className="flex justify-between text-[#817e79]">
                          <span>Finish & Lamination:</span>
                          <span className="text-[#20201f] font-medium">৳{priceBreakdown.finishCost.toFixed(2)}</span>
                        </div>
                      )}
                      {priceBreakdown.discount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Volume Discount:</span>
                          <span>-৳{priceBreakdown.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[#817e79]">
                        <span>Express Courier Delivery:</span>
                        <span className="text-[#20201f] font-medium">৳{priceBreakdown.shippingCost.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#f2f0ec] flex justify-between items-baseline">
                    <span className="text-xs font-bold text-[#817e79]">Estimated Total</span>
                    <span className="text-2xl font-bold text-[#e26f5b]">
                      ৳{priceBreakdown ? priceBreakdown.total.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#99938d] mt-2 mb-0">
                    Payment via Cash On Delivery (COD) or bKash on delivery confirmation. Arrives in 3–5 business days.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-lg bg-[#242322] hover:bg-[#3d3a36] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {submitting ? (
                    <span>Processing Order Snapshot...</span>
                  ) : (
                    <>
                      <span>Confirm & Place Print Order</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
