import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useSession } from '../lib/auth-client'
import { useCart, useUpdateCartItem, useRemoveCartItem } from '../lib/cart-queries'
import { productArtworkIcon } from '../lib/site-theme'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function formatPrice(price: number): string {
  return `RWF ${price.toLocaleString()}`
}

function CartPage() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const navigate = useNavigate()

  const { data, isLoading } = useCart()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()

  const cart = data?.data
  const items = cart?.items ?? []

  const subtotal = items.reduce((sum, item) => {
    const price = (item.product as Record<string, unknown>)?.price as number ?? 0
    return sum + price * item.quantity
  }, 0)

  if (!isLoggedIn) {
    return (
      <main className="page-wrap home-shell">
        <section className="section-stack py-12 fade-in">
          <div className="max-w-3xl mx-auto cart-empty">
            <ShoppingBag size={48} strokeWidth={1} className="cart-empty-icon" />
            <h1 className="cart-empty-title">Your cart</h1>
            <p className="cart-empty-text">Sign in to view your cart and start shopping.</p>
            <Link to="/" className="btn btn-primary">
              <span>Browse catalog</span>
            </Link>
          </div>
        </section>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="page-wrap home-shell">
        <section className="section-stack py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-[var(--line)] rounded w-48" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-[var(--line)] rounded-xl" />
              ))}
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="page-wrap home-shell">
        <section className="section-stack py-12 fade-in">
          <div className="max-w-3xl mx-auto cart-empty">
            <ShoppingBag size={48} strokeWidth={1} className="cart-empty-icon" />
            <h1 className="cart-empty-title">Your cart is empty</h1>
            <p className="cart-empty-text">
              Browse our catalog and add items to get started.
            </p>
            <Link to="/" className="btn btn-primary">
              <span>Browse catalog</span>
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const ArtworkIcon = productArtworkIcon

  return (
    <main className="page-wrap home-shell">
      <section className="section-stack py-8 md:py-12 fade-in">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[var(--ink-soft)] hover:text-[var(--ink)] mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm uppercase tracking-wider">Continue shopping</span>
          </Link>

          <h1 className="cart-page-title">Shopping Cart</h1>

          <div className="cart-layout">
            <div className="cart-items">
              {items.map((item) => {
                const product = item.product as Record<string, unknown> | null
                const name = (product?.name as string) ?? 'Product'
                const price = (product?.price as number) ?? 0
                const slug = product?.slug as string | undefined
                const images = product?.images as string[] | undefined
                const lineTotal = price * item.quantity

                return (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-image">
                      {images && images.length > 0 ? (
                        <img src={images[0]} alt={name} className="cart-item-img" />
                      ) : (
                        <div className="cart-item-placeholder">
                          <ArtworkIcon size={32} strokeWidth={1} aria-hidden />
                        </div>
                      )}
                    </div>

                    <div className="cart-item-details">
                      <div className="cart-item-header">
                        {slug ? (
                          <Link
                            to="/products/$slug"
                            params={{ slug }}
                            className="cart-item-name"
                          >
                            {name}
                          </Link>
                        ) : (
                          <span className="cart-item-name">{name}</span>
                        )}
                        <button
                          type="button"
                          className="cart-item-remove"
                          onClick={() => removeItem.mutate(item.id)}
                          aria-label={`Remove ${name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <p className="cart-item-price">{formatPrice(price)}</p>

                      <div className="cart-item-footer">
                        <div className="cart-qty">
                          <button
                            type="button"
                            className="cart-qty-btn"
                            onClick={() =>
                              item.quantity > 1
                                ? updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })
                                : removeItem.mutate(item.id)
                            }
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="cart-qty-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="cart-qty-btn"
                            onClick={() =>
                              updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="cart-item-line-total">{formatPrice(lineTotal)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="cart-summary">
              <h2 className="cart-summary-title">Order Summary</h2>
              <div className="cart-summary-row">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="cart-summary-row cart-summary-row--muted">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="cart-summary-divider" />
              <div className="cart-summary-row cart-summary-row--total">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <button
                type="button"
                className="btn btn-primary cart-checkout-btn"
                onClick={() => navigate({ to: '/checkout' })}
              >
                <span>Proceed to checkout</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
