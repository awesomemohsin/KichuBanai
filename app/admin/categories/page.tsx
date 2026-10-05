'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'

const PRINT_CATEGORIES = [
  {
    id: 'cat-cards',
    name: 'Business Cards',
    slug: 'business-cards',
    dimensions: '1050 × 600 px (3.5" × 2")',
    bleedMm: 3,
    safeMarginMm: 5,
    standardBatches: '100, 250, 500, 1000 pcs',
    paperDefault: '300gsm Premium Art Card',
    status: 'Active',
    count: 4,
  },
  {
    id: 'cat-menus',
    name: 'Menus & Hospitality',
    slug: 'menus',
    dimensions: '840 × 1188 px (A4)',
    bleedMm: 3,
    safeMarginMm: 5,
    standardBatches: '10, 25, 50, 100 pcs',
    paperDefault: '350gsm Laminated Water-Resistant',
    status: 'Active',
    count: 3,
  },
  {
    id: 'cat-flyers',
    name: 'Flyers & Marketing Leaflets',
    slug: 'flyers',
    dimensions: '595 × 842 px (A5)',
    bleedMm: 3,
    safeMarginMm: 4,
    standardBatches: '250, 500, 1000, 2500 pcs',
    paperDefault: '150gsm Gloss Art Paper',
    status: 'Active',
    count: 2,
  },
  {
    id: 'cat-badges',
    name: 'ID Cards & Event Badges',
    slug: 'badges',
    dimensions: '600 × 900 px (CR80)',
    bleedMm: 2,
    safeMarginMm: 4,
    standardBatches: '20, 50, 100, 250 pcs',
    paperDefault: '0.76mm PVC Composite',
    status: 'Active',
    count: 2,
  },
  {
    id: 'cat-posters',
    name: 'Posters & Wall Display',
    slug: 'posters',
    dimensions: '1191 × 1684 px (A3)',
    bleedMm: 5,
    safeMarginMm: 8,
    standardBatches: '5, 10, 25, 50 pcs',
    paperDefault: '220gsm Satin Photo Paper',
    status: 'Active',
    count: 1,
  },
]

export default function AdminCategoriesPage() {
  const [categories] = useState(PRINT_CATEGORIES)

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-xl font-bold text-gray-900 italic uppercase tracking-tight">
            Print Product Categories
          </h1>
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
            Catalog Specs
          </span>
        </div>
        <p className="text-xs text-gray-400 font-medium">
          Paper substrates, bleed margins & standard volume batches
        </p>
      </div>

      {/* Categories Table */}
      <Card className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Standard Dimensions</th>
                <th className="py-3 px-4">Bleed & Safe Area</th>
                <th className="py-3 px-4">Default Substrate</th>
                <th className="py-3 px-4">Batch Quantities</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-bold text-gray-900">{cat.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">slug: {cat.slug}</div>
                  </td>
                  <td className="py-4 px-4 font-semibold text-gray-700">{cat.dimensions}</td>
                  <td className="py-4 px-4 text-gray-700">
                    <span className="text-emerald-600 font-bold">+{cat.bleedMm}mm bleed</span> • {cat.safeMarginMm}mm safe
                  </td>
                  <td className="py-4 px-4 text-gray-700">{cat.paperDefault}</td>
                  <td className="py-4 px-4 text-gray-500 font-medium text-xs">{cat.standardBatches}</td>
                  <td className="py-4 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {cat.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
