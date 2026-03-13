import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { LogOut, Search, Shield, ShoppingBag, User, X } from 'lucide-react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { siteTheme } from '../lib/site-theme'
import { useSession, signIn, signUp, signOut } from '../lib/auth-client'
import { useQuery } from '@tanstack/react-query'
import { headerCategoriesQueryOptions } from '../lib/admin-queries'
import { useCartItemCount } from '../lib/cart-queries'

const actionIcons = {
  Cart: ShoppingBag,
  Account: User,
} as const

type AuthMode = 'sign-in' | 'sign-up'

export default function Header() {
  const { data: session } = useSession()
  const { data: categoriesRes } = useQuery(headerCategoriesQueryOptions)
  const navCategories = categoriesRes?.data ?? []
  const navigate = useNavigate()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const loginTitleId = useId()
  const loginDescriptionId = useId()
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const routeSearch = useRouterState({
    select: (state) => {
      const search = state.location.search as Record<string, unknown>
      return typeof search.search === 'string' ? search.search : ''
    },
  })

  const isLoggedIn = !!session?.user
  const isAdmin = (session?.user as Record<string, unknown> | undefined)?.role === 'admin'
  const cartCount = useCartItemCount()

  useEffect(() => {
    document.body.classList.toggle('modal-open', isLoginModalOpen)

    if (!isLoginModalOpen) {
      return () => {
        document.body.classList.remove('modal-open')
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLoginModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.classList.remove('modal-open')
    }
  }, [isLoginModalOpen])

  useEffect(() => {
    if (!isUserMenuOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsUserMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isUserMenuOpen])

  function openModal(mode: AuthMode = 'sign-in') {
    setAuthMode(mode)
    setError('')
    setEmail('')
    setPassword('')
    setName('')
    setIsLoginModalOpen(true)
  }

  function closeModal() {
    setIsLoginModalOpen(false)
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (authMode === 'sign-up') {
        const { error: authError } = await signUp.email({
          email,
          password,
          name: name || email.split('@')[0],
        })
        if (authError) {
          setError(authError.message || 'Failed to create account')
          return
        }
      } else {
        const { error: authError } = await signIn.email({
          email,
          password,
        })
        if (authError) {
          setError(authError.message || 'Invalid email or password')
          return
        }
      }
      closeModal()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    setIsUserMenuOpen(false)
    await signOut()
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextSearch = (searchInputRef.current?.value ?? routeSearch).trim()
    navigate({
      to: '/search',
      search: { search: nextSearch || undefined },
    })
  }

  const userInitial =
    session?.user?.name?.[0]?.toUpperCase() ||
    session?.user?.email?.[0]?.toUpperCase() ||
    '?'

  return (
    <>
      <header className="site-header">
        <div className="utility-strip">
          <div className="page-wrap utility-strip-inner">
            <Link to="/" className="brand-mark utility-brand no-underline">
              <span className="brand-badge">{siteTheme.brand.mark}</span>
              <span className="brand-name">{siteTheme.brand.name}</span>
            </Link>

            <form className="search-shell" role="search" onSubmit={handleSearchSubmit}>
              <label htmlFor="site-search" className="sr-only">
                Search inventory
              </label>
              <Search aria-hidden="true" size={15} className="search-icon" />
              <input
                key={routeSearch}
                ref={searchInputRef}
                id="site-search"
                type="search"
                className="search-input"
                placeholder={siteTheme.header.searchPlaceholder}
                defaultValue={routeSearch}
              />
              <button type="submit" className="search-submit">
                {siteTheme.header.searchActionLabel}
              </button>
            </form>

            <div className="header-actions">
              {siteTheme.header.actions.map((action) => {
                const ActionIcon = actionIcons[action.label as keyof typeof actionIcons]

                if (action.label === 'Account') {
                  if (isLoggedIn) {
                    return (
                      <div key={action.label} className="user-menu-anchor" ref={menuRef}>
                        <button
                          type="button"
                          className="header-user-badge"
                          onClick={() => setIsUserMenuOpen((v) => !v)}
                          aria-haspopup="menu"
                          aria-expanded={isUserMenuOpen}
                        >
                          {userInitial}
                        </button>

                        {isUserMenuOpen && (
                          <div className="user-menu" role="menu">
                            <div className="user-menu-header">
                              <span className="user-menu-name">
                                {session.user.name || 'User'}
                              </span>
                              <span className="user-menu-email">
                                {session.user.email}
                              </span>
                              {isAdmin && (
                                <span className="user-menu-role">Admin</span>
                              )}
                            </div>

                            <div className="user-menu-divider" />

                            {isAdmin && (
                              <Link
                                to="/admin"
                                className="user-menu-item"
                                role="menuitem"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <Shield size={14} aria-hidden="true" />
                                Admin Dashboard
                              </Link>
                            )}

                            <Link
                              to="/"
                              className="user-menu-item"
                              role="menuitem"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <User size={14} aria-hidden="true" />
                              My Account
                            </Link>

                            <div className="user-menu-divider" />

                            <button
                              type="button"
                              className="user-menu-item user-menu-item--danger"
                              role="menuitem"
                              onClick={handleSignOut}
                            >
                              <LogOut size={14} aria-hidden="true" />
                              Sign out
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <button
                      key={action.label}
                      type="button"
                      className="header-action"
                      onClick={() => openModal('sign-in')}
                      aria-haspopup="dialog"
                      aria-expanded={isLoginModalOpen}
                      aria-controls="account-login-modal"
                    >
                      <ActionIcon aria-hidden="true" size={17} />
                      <span className="sr-only">{action.label}</span>
                    </button>
                  )
                }

                if (action.label === 'Cart') {
                  return (
                    <Link key={action.label} to="/cart" className="header-cart-link">
                      <ActionIcon aria-hidden="true" size={17} />
                      <span className="sr-only">Cart</span>
                      {isLoggedIn && cartCount > 0 && (
                        <span className="cart-badge">{cartCount}</span>
                      )}
                    </Link>
                  )
                }

                return (
                  <a key={action.label} href={action.href} className="header-action">
                    <ActionIcon aria-hidden="true" size={17} />
                    <span className="sr-only">{action.label}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        <nav className="main-nav">
          <div className="page-wrap main-nav-inner">
            <div className="nav-links">
              {navCategories.map((category) => (
                <Link
                  key={category.id}
                  to="/categories/$slug"
                  params={{ slug: category.slug }}
                  className="nav-link"
                >
                  {category.name}
                </Link>
              ))}
            </div>

            <p className="support-copy">
              <span>{siteTheme.brand.supportLabel}</span> {siteTheme.brand.supportPhone}
            </p>
          </div>
        </nav>
      </header>

      {isLoginModalOpen ? (
        <div
          className="login-modal-backdrop"
          onClick={closeModal}
          role="presentation"
        >
          <div
            id="account-login-modal"
            className="login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={loginTitleId}
            aria-describedby={loginDescriptionId}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="login-modal-close"
              onClick={closeModal}
              aria-label="Close login modal"
            >
              <X aria-hidden="true" size={16} />
            </button>

            <div className="login-modal-brand">{siteTheme.brand.mark}</div>
            <h2 id={loginTitleId} className="login-modal-title">
              {authMode === 'sign-in' ? 'Access Portal' : 'Create Account'}
            </h2>
            <p id={loginDescriptionId} className="login-modal-copy">
              {authMode === 'sign-in'
                ? 'Sign in with your credentials'
                : 'Register for a new account'}
            </p>

            <form className="login-modal-form" onSubmit={handleSubmit}>
              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              {authMode === 'sign-up' && (
                <label className="login-field">
                  <span className="login-field-label">Full name</span>
                  <input
                    type="text"
                    className="login-field-input"
                    placeholder="John Doe"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
              )}

              <label className="login-field">
                <span className="login-field-label">Email address</span>
                <input
                  type="email"
                  className="login-field-input"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="login-field">
                <span className="login-field-header">
                  <span className="login-field-label">Password</span>
                  {authMode === 'sign-in' && (
                    <button type="button" className="login-forgot-link">
                      Forgot password?
                    </button>
                  )}
                </span>
                <input
                  type="password"
                  className="login-field-input"
                  placeholder="••••••••"
                  autoComplete={authMode === 'sign-in' ? 'current-password' : 'new-password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading
                  ? 'Please wait...'
                  : authMode === 'sign-in'
                    ? 'Sign in'
                    : 'Create account'}
              </button>

              <div className="login-divider" aria-hidden="true">
                <span />
                <span>
                  {authMode === 'sign-in' ? "Don't have an account?" : 'Already have an account?'}
                </span>
                <span />
              </div>

              <button
                type="button"
                className="login-provider-button"
                onClick={() => {
                  setAuthMode(authMode === 'sign-in' ? 'sign-up' : 'sign-in')
                  setError('')
                }}
              >
                {authMode === 'sign-in' ? 'Create an account' : 'Sign in instead'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
