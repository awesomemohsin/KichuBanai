'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bell,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Cloud,
  FolderOpen,
  Heart,
  Home,
  LayoutTemplate,
  LogIn,
  LogOut,
  Menu,
  MoreHorizontal,
  Package,
  Palette,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  WandSparkles,
} from 'lucide-react'
import { DEFAULT_TEMPLATES } from '@/lib/templates/template-registry'
import { MyOrdersView } from '@/components/dashboard/my-orders-view'
import { AdminOrdersWorkspace } from '@/components/admin/admin-orders-workspace'
import { AdminUsersWorkspace } from '@/components/admin/admin-users-workspace'
import { OrderService } from '@/lib/orders/order-service'
import { Template } from '@/types/domain'
import { useAuth } from '@/hooks/useAuth'

export default function Page() {
  const { user, isAuthenticated, isAdmin, isSuperAdmin, logout } = useAuth()
  const [activeNav, setActiveNav] = useState<string>('Home')
  const [adminSubTab, setAdminSubTab] = useState<'orders' | 'users'>('orders')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [savedDesigns, setSavedDesigns] = useState<Array<{ id: string; title: string; updatedAt: string }>>([])
  const [ordersCount, setOrdersCount] = useState<number>(0)

  const refreshSavedData = () => {
    if (typeof window !== 'undefined') {
      try {
        const rawIndex = localStorage.getItem('kichubanai_user_designs_index')
        if (rawIndex) setSavedDesigns(JSON.parse(rawIndex))
      } catch (e) {
        console.error(e)
      }
      setOrdersCount(OrderService.getOrders().length)
    }
  }

  // Load saved designs and order count on mount, and reload when tab regains focus
  useEffect(() => {
    refreshSavedData()
    window.addEventListener('focus', refreshSavedData)
    return () => window.removeEventListener('focus', refreshSavedData)
  }, [])

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return DEFAULT_TEMPLATES.filter((tpl) => {
      const matchesSearch =
        tpl.metadata.title.toLowerCase().includes(search.toLowerCase()) ||
        tpl.metadata.category.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        selectedCategory === 'All' ||
        tpl.metadata.category.toLowerCase().includes(selectedCategory.toLowerCase())
      return matchesSearch && matchesCategory
    })
  }, [search, selectedCategory])

  const handleOpenTemplate = (template: Template) => {
    const randomId = Math.floor(100000 + Math.random() * 900000)
    window.open(`/designs/${randomId}?template=${template.metadata.id}`, '_blank')
  }

  const handleStartBlankDesign = () => {
    const randomId = Math.floor(100000 + Math.random() * 900000)
    window.open(`/designs/${randomId}`, '_blank')
  }

  const handleOpenSavedDesign = (savedId: string) => {
    window.open(`/designs/${savedId}`, '_blank')
  }

  return (
    <main className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-mark cursor-pointer" onClick={() => setActiveNav('Home')} title="KichuBanai">
          <img src="/logo.png" alt="KichuBanai" className="w-[195px] h-auto object-contain max-h-[85px] transition-transform hover:scale-[1.02]" />
        </div>

        <button className="create-button cursor-pointer" onClick={handleStartBlankDesign}>
          <Plus className="w-4 h-4" /> Create design
        </button>

        <nav className="primary-nav" aria-label="Main navigation">
          <button
            className={`nav-item cursor-pointer ${activeNav === 'Home' ? 'active' : ''}`}
            onClick={() => setActiveNav('Home')}
          >
            <Home className="w-4 h-4" /> <span>Home</span>
          </button>
          <button
            className={`nav-item cursor-pointer ${activeNav === 'Templates' ? 'active' : ''}`}
            onClick={() => setActiveNav('Templates')}
          >
            <LayoutTemplate className="w-4 h-4" /> <span>Templates</span>
          </button>
          <button
            className={`nav-item cursor-pointer ${activeNav === 'My designs' ? 'active' : ''}`}
            onClick={() => setActiveNav('My designs')}
          >
            <FolderOpen className="w-4 h-4" /> <span>My designs</span>
            {savedDesigns.length > 0 && <span className="nav-count">{savedDesigns.length}</span>}
          </button>
          <button
            className={`nav-item cursor-pointer ${activeNav === 'My orders' ? 'active' : ''}`}
            onClick={() => setActiveNav('My orders')}
          >
            <Package className="w-4 h-4" /> <span>My Orders</span>
            {ordersCount > 0 && <span className="nav-count">{ordersCount}</span>}
          </button>
        </nav>

        <div className="sidebar-rule" />

        <p className="nav-label">Management</p>
        <button
          className={`nav-item cursor-pointer ${activeNav === 'Admin Portal' ? 'active' : ''}`}
          onClick={() => setActiveNav('Admin Portal')}
        >
          <ShieldAlert className="w-4 h-4 text-[#e26f5b]" />
          <span>Admin Portal</span>
          {isAdmin && (
            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#e26f5b]/15 text-[#c45341] uppercase">
              {isSuperAdmin ? 'Super' : 'Admin'}
            </span>
          )}
        </button>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <WandSparkles className="w-4 h-4" />
            </div>
            <strong>KichuBanai Plus</strong>
            <p>Unlock high-res clean downloads and priority press queuing.</p>
            <button
              className="cursor-pointer"
              onClick={() => alert('KichuBanai Plus gives unlimited watermark-free 2x high-res JPG exports!')}
            >
              Explore benefits <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <button className="nav-item">
            <CircleHelp />
            <span>Help center</span>
          </button>

          {isAuthenticated && user ? (
            <div className="profile-row flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="avatar">
                  {user.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'KB'}
                </span>
                <span className="profile-copy min-w-0">
                  <strong className="truncate">{user.name}</strong>
                  <small className="text-[#e26f5b] capitalize">
                    {user.role === 'super_admin'
                      ? 'Super Admin'
                      : user.role === 'admin'
                      ? 'Administrator'
                      : user.role === 'moderator'
                      ? 'Moderator'
                      : 'Customer'}
                  </small>
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-[#817e79] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="pt-2 px-1">
              <Link
                href="/auth/login"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#1b1a18] text-white text-xs font-semibold hover:bg-[#2c2a27] transition-all cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="mobile-brand flex items-center gap-2">
            <Menu />
            <img src="/logo.png" alt="KichuBanai" className="h-8.5 w-auto object-contain" />
          </div>

          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight />
            <strong>{activeNav}</strong>
          </div>

          <div className="top-actions">
            <div className="search-box">
              <Search />
              <input
                aria-label="Search templates"
                placeholder="Search templates"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-button" aria-label="Notifications">
              <Bell />
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={isAdmin ? '/admin' : '#'}
                  className="top-avatar flex items-center justify-center font-bold text-xs"
                  title={`${user.name} (${user.role})`}
                >
                  {user.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'KB'}
                </Link>
                <button
                  onClick={() => logout()}
                  className="icon-button cursor-pointer text-[#817e79] hover:text-red-600"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b1a18] text-white text-xs font-semibold hover:bg-[#2c2a27] transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </header>

        {/* Content Body based on Active Tab */}
        <div className="content-wrap">
          {activeNav === 'Home' && (
            <>
              {/* Welcome Row */}
              <div className="welcome-row">
                <div>
                  <p className="eyebrow">Professional Design & Physical Printing</p>
                  <h1>
                    Good morning, {user ? user.name.split(' ')[0] : 'Creator'} <span>✦</span>
                  </h1>
                  <p className="lede">Design it. Print it. We deliver it directly to your doorstep.</p>
                </div>
                <button className="outline-button cursor-pointer" onClick={handleStartBlankDesign}>
                  <Cloud /> Open Design Studio
                </button>
              </div>

              {/* Hero Banner */}
              <section className="hero-banner">
                <div className="hero-content">
                  <span className="hero-kicker">
                    <Sparkles /> Online Design & Print Studio
                  </span>
                  <h2>
                    Make something <em>worth keeping.</em>
                  </h2>
                  <p>
                    Start with a beautifully crafted master template, or begin with a blank canvas. Customize text, upload logos, and order physical prints seamlessly.
                  </p>
                  <button className="dark-button cursor-pointer" onClick={handleStartBlankDesign}>
                    Start creating <ArrowRight />
                  </button>
                </div>
                <div className="hero-shape shape-one" />
                <div className="hero-shape shape-two" />
                <div className="hero-note">
                  Designed by you
                  <br />
                  <span>printed by us</span>
                </div>
              </section>

              {/* Recent / Quick Start Grid */}
              <section className="section-block">
                <div className="section-heading">
                  <div>
                    <h2>Pick up where you left off</h2>
                    <p>Your recent designs, ready for customization and printing.</p>
                  </div>
                  <button className="text-button cursor-pointer" onClick={() => setActiveNav('Templates')}>
                    View all templates <ArrowRight />
                  </button>
                </div>

                <div className="recent-grid">
                  <button className="new-design-card cursor-pointer" onClick={handleStartBlankDesign}>
                    <span className="new-design-icon">
                      <Plus />
                    </span>
                    <strong>Blank design</strong>
                    <span>Start from scratch</span>
                  </button>

                  {DEFAULT_TEMPLATES.map((tpl) => (
                    <button
                      className="recent-card cursor-pointer"
                      key={tpl.metadata.id}
                      onClick={() => handleOpenTemplate(tpl)}
                    >
                      <div className={`template-art ${tpl.metadata.colorTheme}`}>
                        <div className="art-grid" />
                        <span className="art-icon">{tpl.metadata.icon}</span>
                        <div className="art-copy">
                          <span className="art-eyebrow">{tpl.metadata.category}</span>
                          <strong>{tpl.metadata.title}</strong>
                          <span className="art-line" />
                        </div>
                        <span className="art-badge">{tpl.metadata.badgeLabel}</span>
                      </div>
                      <span className="recent-card-info">
                        <strong>{tpl.metadata.title}</strong>
                        <small>{tpl.metadata.sizeLabel} · Click to edit</small>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Template Catalog Section */}
              <section className="section-block templates-section">
                <div className="section-heading">
                  <div>
                    <h2>Find your starting point</h2>
                    <p>Carefully structured master templates with editable permissions.</p>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="filter-row">
                  {['All', 'Menus', 'Business cards', 'Posters', 'Promotions'].map((cat) => (
                    <button
                      key={cat}
                      className={`filter-pill cursor-pointer ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Template Cards */}
                <div className="template-grid">
                  {filteredTemplates.map((tpl) => (
                    <button
                      className="template-card cursor-pointer"
                      key={tpl.metadata.id}
                      onClick={() => handleOpenTemplate(tpl)}
                    >
                      <div className="template-preview">
                        <div className={`template-art ${tpl.metadata.colorTheme}`}>
                          <div className="art-grid" />
                          <span className="art-icon">{tpl.metadata.icon}</span>
                          <div className="art-copy">
                            <span className="art-eyebrow">{tpl.metadata.category}</span>
                            <strong>{tpl.metadata.title}</strong>
                            <span className="art-line" />
                          </div>
                          <span className="art-badge">{tpl.metadata.badgeLabel}</span>
                        </div>
                      </div>
                      <div className="template-meta">
                        <span>
                          <strong>{tpl.metadata.title}</strong>
                          <small>
                            {tpl.metadata.category} · {tpl.metadata.sizeLabel}
                          </small>
                        </span>
                        <ArrowRight />
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Bottom Promo */}
              <section className="bottom-promo">
                <div>
                  <span className="hero-kicker">
                    <Star /> KichuBanai Plus
                  </span>
                  <h2>More room for your ideas.</h2>
                  <p>
                    Unlimited high-quality downloads, zero watermarks, and fast-track physical print dispatch for your brand.
                  </p>
                  <button
                    className="coral-button cursor-pointer"
                    onClick={() => alert('KichuBanai Plus is active for testing: try downloading in Subscriber Mode!')}
                  >
                    See what&apos;s included <ArrowRight />
                  </button>
                </div>
                <div className="promo-stamp">
                  PLUS
                  <br />
                  <span>your way</span>
                </div>
              </section>
            </>
          )}

          {activeNav === 'Templates' && (
            <div className="space-y-6">
              <div className="welcome-row">
                <div>
                  <h1 className="text-2xl font-bold text-[#20201f] m-0">Master Template Library</h1>
                  <p className="text-xs text-[#817e79] mt-1 mb-0">
                    Select any template to make an instant editable copy. Original templates remain pristine.
                  </p>
                </div>
              </div>

              <div className="template-grid mt-6">
                {filteredTemplates.map((tpl) => (
                  <button
                    className="template-card cursor-pointer"
                    key={tpl.metadata.id}
                    onClick={() => handleOpenTemplate(tpl)}
                  >
                    <div className="template-preview">
                      <div className={`template-art ${tpl.metadata.colorTheme}`}>
                        <div className="art-grid" />
                        <span className="art-icon">{tpl.metadata.icon}</span>
                        <div className="art-copy">
                          <span className="art-eyebrow">{tpl.metadata.category}</span>
                          <strong>{tpl.metadata.title}</strong>
                          <span className="art-line" />
                        </div>
                        <span className="art-badge">{tpl.metadata.badgeLabel}</span>
                      </div>
                    </div>
                    <div className="template-meta">
                      <span>
                        <strong>{tpl.metadata.title}</strong>
                        <small>
                          {tpl.metadata.category} · {tpl.metadata.sizeLabel}
                        </small>
                      </span>
                      <ArrowRight />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'My designs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#20201f] m-0">My Saved Designs</h2>
                  <p className="text-xs text-[#817e79] mt-1 mb-0">
                    Locally saved design drafts and versions.
                  </p>
                </div>
                <button className="coral-button cursor-pointer" onClick={handleStartBlankDesign}>
                  <Plus className="w-4 h-4" /> New Design
                </button>
              </div>

              {savedDesigns.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-[#cfc9c1] p-12 text-center text-xs text-[#817e79]">
                  No saved drafts yet. Open the design editor and click &ldquo;Saved&rdquo; or make edits to autosave drafts.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {savedDesigns.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => handleOpenSavedDesign(d.id)}
                      className="p-4 rounded-xl border border-[#e4e1dc] bg-white hover:border-[#e26f5b] cursor-pointer transition-all shadow-xs"
                    >
                      <h4 className="font-bold text-xs text-[#20201f] m-0 mb-1">{d.title}</h4>
                      <p className="text-[10px] text-[#817e79] m-0">
                        Last edited: {new Date(d.updatedAt).toLocaleTimeString()}
                      </p>
                      <div className="mt-3 flex justify-end">
                        <span className="text-[11px] font-bold text-[#e26f5b]">Open in New Tab →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeNav === 'My orders' && (
            <MyOrdersView onStartDesign={handleStartBlankDesign} />
          )}

          {activeNav === 'Admin Portal' && (
            <div>
              {!isAdmin ? (
                <div className="bg-white rounded-2xl border border-[#ded8cc] p-8 text-center max-w-lg mx-auto shadow-sm my-8">
                  <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1b1a18]">Administrator Clearance Required</h3>
                  <p className="mt-2 text-xs text-[#736f68] leading-relaxed">
                    The Admin Command Center contains production SVG rendering, staff role controls, and preflight inspection.
                    Please sign in with an administrative account to continue.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Link
                      href="/auth/login?callbackUrl=/admin"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b1a18] text-white text-xs font-semibold hover:bg-[#2c2a27] transition-all shadow-sm"
                    >
                      <LogIn className="w-4 h-4" /> Sign In as Admin
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Admin Subnav */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#ded8cc] shadow-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAdminSubTab('orders')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          adminSubTab === 'orders'
                            ? 'bg-[#1b1a18] text-white shadow-xs'
                            : 'bg-white text-[#524f4a] hover:bg-[#faf8f5] border border-[#ded8cc]'
                        }`}
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Print Orders & Production</span>
                      </button>

                      <button
                        onClick={() => setAdminSubTab('users')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          adminSubTab === 'users'
                            ? 'bg-[#1b1a18] text-white shadow-xs'
                            : 'bg-white text-[#524f4a] hover:bg-[#faf8f5] border border-[#ded8cc]'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Staff & Users</span>
                        {isSuperAdmin && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-bold">
                            SuperAdmin
                          </span>
                        )}
                      </button>
                    </div>

                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e26f5b] hover:text-[#c45341] transition-colors"
                    >
                      <span>Open Dedicated Admin Console</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {adminSubTab === 'orders' && <AdminOrdersWorkspace />}
                  {adminSubTab === 'users' && <AdminUsersWorkspace />}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
