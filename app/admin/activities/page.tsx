'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'

const AUDIT_LOGS = [
  {
    id: 'act-1',
    action: 'Order Status Updated',
    details: 'Order #KB-49219 moved from NEW to IN_PRODUCTION',
    actor: 'Mohsin (Super Admin)',
    actorEmail: 'mohsindude5@gmail.com',
    role: 'super_admin',
    ip: '127.0.0.1 (Localhost)',
    timestamp: 'Just now',
  },
  {
    id: 'act-2',
    action: 'Vector Outline Generated',
    details: 'Outlined vector SVG exported for Weekend Brunch Menu (Zero raw text tags verified)',
    actor: 'Mohsin (Super Admin)',
    actorEmail: 'mohsindude5@gmail.com',
    role: 'super_admin',
    ip: '127.0.0.1 (Localhost)',
    timestamp: '5 minutes ago',
  },
  {
    id: 'act-3',
    action: 'Administrator Authentication',
    details: 'Successful JWT authorization & session token issued',
    actor: 'Mohsin (Super Admin)',
    actorEmail: 'mohsindude5@gmail.com',
    role: 'super_admin',
    ip: '127.0.0.1 (Localhost)',
    timestamp: '15 minutes ago',
  },
  {
    id: 'act-4',
    action: 'Master Template Registered',
    details: 'Registered new template "Weekend brunch menu" (840 × 1188 px, 3mm bleed)',
    actor: 'System Bootstrap',
    actorEmail: 'system@kichubanai.com',
    role: 'super_admin',
    ip: 'Internal System',
    timestamp: 'Today',
  },
  {
    id: 'act-5',
    action: 'Database Synced',
    details: 'MongoDB user collections verified and synchronized',
    actor: 'Database Driver',
    actorEmail: 'system@kichubanai.com',
    role: 'system',
    ip: 'Internal System',
    timestamp: 'Today',
  },
]

export default function AdminActivitiesPage() {
  const [logs] = useState(AUDIT_LOGS)

  return (
    <div className="space-y-6">
      {/* Top Header matching Parle Bangladesh */}
      <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-xl font-bold text-gray-900 italic uppercase tracking-tight">
            Action & Audit Logs
          </h1>
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
            Security Trail
          </span>
        </div>
        <p className="text-xs text-gray-400 font-medium">
          Real-time record of security verifications, order transitions, and system actions
        </p>
      </div>

      {/* Logs Table */}
      <Card className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="py-3 px-4">Event Action</th>
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-4">Operator / Admin</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-2 font-bold text-gray-900 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600 max-w-md text-xs">{log.details}</td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-gray-900 text-xs">{log.actor}</div>
                    <div className="text-[10px] text-gray-400">{log.actorEmail}</div>
                  </td>
                  <td className="py-4 px-4 font-mono text-[11px] text-gray-400">{log.ip}</td>
                  <td className="py-4 px-4 text-right text-gray-400 font-bold italic text-xs">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
