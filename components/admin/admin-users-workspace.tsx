'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/lib/auth/jwt'
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Search,
  Filter,
  Trash2,
  Phone,
  UserCheck,
  UserX,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react'

interface ManagedUser {
  id: string
  name: string
  email: string
  mobile?: string
  role: UserRole
  status: 'active' | 'disabled'
  createdAt: string
}

export function AdminUsersWorkspace() {
  const { user: currentUser, isSuperAdmin } = useAuth()

  const [users, setUsers] = useState<ManagedUser[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'admin' as UserRole,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (searchTerm.trim()) params.append('search', searchTerm.trim())

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err?.message || 'Error connecting to user repository')
    } finally {
      setIsLoading(false)
    }
  }, [roleFilter, searchTerm])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newUserData),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      setSuccessMsg(`User ${data.user.email} created successfully with role ${data.user.role}`)
      setShowAddModal(false)
      setNewUserData({ name: '', email: '', mobile: '', password: '', role: 'admin' })
      fetchUsers()
    } catch (err: any) {
      setError(err?.message || 'Error creating user account')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Role Change
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isSuperAdmin) {
      alert('Only SuperAdmins can alter user roles')
      return
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Role change failed')
      }

      setSuccessMsg(`Role updated to ${newRole}`)
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    } catch (err: any) {
      alert(err?.message || 'Could not update role')
    }
  }

  // Handle Status Toggle (Active / Disabled)
  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    if (!isSuperAdmin) {
      alert('Only SuperAdmins can enable or disable user accounts')
      return
    }

    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active'
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Status update failed')
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
      )
    } catch (err: any) {
      alert(err?.message || 'Could not update status')
    }
  }

  // Handle Delete User
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!isSuperAdmin) {
      alert('Only SuperAdmins can delete user accounts')
      return
    }

    if (!confirm(`Are you sure you want to permanently delete user ${userEmail}? This action cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user')
      }

      setSuccessMsg(`User ${userEmail} deleted`)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (err: any) {
      alert(err?.message || 'Could not delete user')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar matching Parle Bangladesh */}
      <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-xl font-bold text-gray-900 italic uppercase tracking-tight">
            Manage Admins & Staff
          </h1>
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
            Clearance Center
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchUsers()}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-600 shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Staff</span>
            </button>
          )}
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

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search and Filters matching Parle Bangladesh */}
      <div className="flex flex-col xl:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="w-full xl:flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm font-bold bg-gray-50/20"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto">
          <div className="relative w-full xl:w-44">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 hidden sm:block" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-2 sm:pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs font-bold uppercase bg-white cursor-pointer"
            >
              <option value="all">All Roles ({total})</option>
              <option value="super_admin">Super Admins</option>
              <option value="admin">Admins</option>
              <option value="moderator">Moderators</option>
              <option value="customer">Customers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                      <span>Loading accounts from MongoDB...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-300 font-bold uppercase tracking-widest text-[10px]">
                    No accounts found matching your filters
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = currentUser?.id === u.id
                  const isRootSuperAdmin = u.email === 'mohsindude5@gmail.com'

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                            {u.name
                              ? u.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()
                              : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.2 rounded font-black uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium text-xs">{u.mobile || '—'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {isSuperAdmin && !isRootSuperAdmin ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                            className="font-bold text-xs border border-gray-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer uppercase bg-white shadow-2xs"
                          >
                            <option value="customer">Customer</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              u.role === 'super_admin'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : u.role === 'admin'
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : u.role === 'moderator'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {u.role === 'super_admin' && <ShieldCheck className="w-3 h-3" />}
                            {u.role === 'admin' && <Shield className="w-3 h-3" />}
                            {u.role === 'moderator' && <UserCheck className="w-3 h-3" />}
                            {u.role.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {u.status === 'active' ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-gray-400 font-bold italic text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {isSuperAdmin && !isRootSuperAdmin && (
                            <>
                              <button
                                onClick={() => handleToggleStatus(u.id, u.status)}
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                                title={u.status === 'active' ? 'Deactivate user' : 'Activate user'}
                              >
                                {u.status === 'active' ? (
                                  <UserX className="w-3.5 h-3.5 text-amber-600" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff / Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-600" />
                <h3 className="font-black text-gray-900 text-base uppercase italic">
                  Add New Staff / Admin
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Mahmud"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="staff@kichubanai.com"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Bangladeshi Mobile (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={newUserData.mobile}
                  onChange={(e) => setNewUserData({ ...newUserData, mobile: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Assigned Role
                </label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none cursor-pointer font-bold uppercase"
                >
                  <option value="admin">Admin (Order Hub, Preflight, Production SVGs)</option>
                  <option value="moderator">Moderator (Review Templates & Orders)</option>
                  <option value="super_admin">Super Admin (Full Administrative Rights)</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
