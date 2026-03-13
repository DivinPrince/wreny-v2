import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ToastContainer } from './admin/Toast'
import {
  Box,
  Cog,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  X,
} from 'lucide-react'
import { siteTheme } from '../lib/site-theme'
import { authClient, signOut } from '../lib/auth-client'

const navSections = [
  {
    title: 'Operations',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Categories', href: '/admin/categories', icon: Tags },
      { label: 'Inventory', href: '/admin/inventory', icon: Box },
      { label: 'Sales Orders', href: '/admin/sales-orders', icon: ShoppingCart },
    ],
  },
  {
    title: 'Supply Chain',
    items: [
      { label: 'Suppliers', href: '/admin/suppliers', icon: Truck },
      { label: 'Equipment', href: '/admin/equipment', icon: Cog },
      { label: 'Locations', href: '/admin/locations', icon: MapPin },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users & Roles', href: '/admin/users', icon: Users },
      { label: 'Reports', href: '/admin/reports', icon: ClipboardList },
    ],
  },
]

export default function AdminShell() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const routeSearch = useRouterState({
    select: (state) => {
      const search = state.location.search as Record<string, unknown>
      return typeof search.search === 'string' ? search.search : ''
    },
  })

  useEffect(() => {
    if (!isPending && (!session?.user || session.user.role !== 'admin')) {
      navigate({ to: '/', search: { login: 'required' } })
    }
  }, [isPending, session, navigate])

  useEffect(() => {
    if (!isMobileNavOpen) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileNavOpen])

  const user = session?.user
  const initial = user?.name?.[0]?.toUpperCase() || user?.email[0]?.toUpperCase() || 'A'

  if (isPending || !user) return null

  async function handleLogout() {
    await signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/' } } })
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextSearch = (searchInputRef.current?.value ?? routeSearch).trim()
    navigate({
      to: '/admin/products',
      search: { search: nextSearch || undefined },
    })
  }

  return (
    <div className="adm-shell">
      {isMobileNavOpen ? (
        <button
          type="button"
          className="adm-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileNavOpen(false)}
        />
      ) : null}

      <aside
        id="admin-sidebar-navigation"
        className={`adm-sidebar ${isMobileNavOpen ? 'adm-sidebar--open' : ''}`}
      >
        <Link to="/" className="adm-sidebar-brand">
          <span className="brand-badge">{siteTheme.brand.mark}</span>
          <span className="adm-sidebar-brand-name">1000 Hills<br />Platform</span>
        </Link>

        <nav className="adm-sidebar-nav">
          {navSections.map((section) => (
            <div key={section.title} className="adm-nav-group">
              <span className="adm-nav-group-title">{section.title}</span>
              {section.items.map((item) => {
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`adm-nav-link ${isActive ? 'adm-nav-link--active' : ''}`}
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <Icon size={15} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <button type="button" className="adm-nav-link adm-logout" onClick={handleLogout}>
          <LogOut size={15} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </aside>

      <div className="adm-main">
        <header className="adm-topbar">
          <button
            type="button"
            className="adm-menu-toggle"
            aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileNavOpen}
            aria-controls="admin-sidebar-navigation"
            onClick={() => setIsMobileNavOpen((open) => !open)}
          >
            {isMobileNavOpen ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
            <span>{isMobileNavOpen ? 'Close' : 'Menu'}</span>
          </button>

          <form className="adm-search" role="search" onSubmit={handleSearchSubmit}>
            <Search size={14} aria-hidden="true" className="adm-search-icon" />
            <input
              key={routeSearch}
              ref={searchInputRef}
              type="search"
              className="adm-search-input"
              placeholder="Global system search..."
              defaultValue={routeSearch}
            />
          </form>

          <p className="adm-topbar-title">1000 Hills Digital Platform</p>

          <div className="adm-topbar-right">
            <span className="adm-topbar-meta">{user?.name || user?.email || ''}</span>
            <span className="adm-avatar">{initial}</span>
          </div>
        </header>

        <div className="adm-content">
          <Outlet />
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}
