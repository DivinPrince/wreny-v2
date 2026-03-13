import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Loader2, ShoppingBag } from 'lucide-react'
import { useSession } from '../lib/auth-client'
import { useCart, useClearCart, useCreateOrder, useCreateCheckoutSession } from '../lib/cart-queries'
import { productArtworkIcon } from '../lib/site-theme'
import { useUserAddresses, useUserProfile } from '../lib/user-queries'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

function formatPrice(price: number): string {
  return `RWF ${price.toLocaleString()}`
}

type PaymentMethod = 'stripe' | 'cod' | 'check'

function splitName(name: string | undefined): { firstName: string; lastName: string } {
  const trimmed = name?.trim()
  if (!trimmed) {
    return { firstName: '', lastName: '' }
  }

  const [firstName, ...rest] = trimmed.split(/\s+/)

  return {
    firstName,
    lastName: rest.join(' '),
  }
}

function CheckoutPage() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const navigate = useNavigate()

  const { data: cartData, isLoading: cartLoading } = useCart()
  const { data: profileData, isFetched: profileFetched } = useUserProfile()
  const { data: addressData, isFetched: addressesFetched } = useUserAddresses()
  const createOrder = useCreateOrder()
  const createCheckout = useCreateCheckoutSession()
  const clearCart = useClearCart()

  const items = cartData?.data?.items ?? []
  const ArtworkIcon = productArtworkIcon

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [street1, setStreet1] = useState('')
  const [street2, setStreet2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('RW')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe')
  const [notes, setNotes] = useState('')
  const [saveAddress, setSaveAddress] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const hasPrefilledProfile = useRef(false)
  const hasPrefilledAddress = useRef(false)

  const subtotal = items.reduce((sum, item) => {
    const price = (item.product as Record<string, unknown>)?.price as number ?? 0
    return sum + price * item.quantity
  }, 0)

  useEffect(() => {
    if (hasPrefilledProfile.current || !profileFetched) return

    const profile = profileData?.data
    const sessionUser = session?.user

    const { firstName: profileFirstName, lastName: profileLastName } = splitName(
      profile?.name || sessionUser?.name,
    )

    if (!firstName && profileFirstName) setFirstName(profileFirstName)
    if (!lastName && profileLastName) setLastName(profileLastName)
    if (!phone && profile?.phone) setPhone(profile.phone)

    hasPrefilledProfile.current = true
  }, [firstName, lastName, phone, profileData, profileFetched, session])

  useEffect(() => {
    if (hasPrefilledAddress.current || !addressesFetched) return

    const addresses = addressData?.data ?? []

    const preferredAddress =
      addresses.find((address) => address.type === 'shipping' && address.isDefault) ??
      addresses.find((address) => address.type === 'shipping') ??
      addresses.find((address) => address.isDefault) ??
      addresses[0]

    if (preferredAddress) {
      if (!firstName && preferredAddress.firstName) setFirstName(preferredAddress.firstName)
      if (!lastName && preferredAddress.lastName) setLastName(preferredAddress.lastName)
      if (!company && preferredAddress.company) setCompany(preferredAddress.company)
      if (!street1 && preferredAddress.street1) setStreet1(preferredAddress.street1)
      if (!street2 && preferredAddress.street2) setStreet2(preferredAddress.street2)
      if (!city && preferredAddress.city) setCity(preferredAddress.city)
      if (!state && preferredAddress.state) setState(preferredAddress.state)
      if (!postalCode && preferredAddress.postalCode) setPostalCode(preferredAddress.postalCode)
      if ((country === 'RW' || !country) && preferredAddress.country) setCountry(preferredAddress.country)
      if (!phone && preferredAddress.phone) setPhone(preferredAddress.phone)
    }

    hasPrefilledAddress.current = true
  }, [addressData, addressesFetched, firstName, lastName, company, street1, street2, city, state, postalCode, country, phone])

  if (!isLoggedIn) {
    return (
      <main className="page-wrap home-shell">
        <section className="section-stack py-12 fade-in">
          <div className="max-w-3xl mx-auto cart-empty">
            <ShoppingBag size={48} strokeWidth={1} className="cart-empty-icon" />
            <h1 className="cart-empty-title">Checkout</h1>
            <p className="cart-empty-text">Please sign in to complete your purchase.</p>
            <Link to="/" className="btn btn-primary">
              <span>Back to home</span>
            </Link>
          </div>
        </section>
      </main>
    )
  }

  if (cartLoading) {
    return (
      <main className="page-wrap home-shell">
        <section className="section-stack py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-[var(--line)] rounded w-48" />
              <div className="h-64 bg-[var(--line)] rounded-xl" />
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
            <h1 className="cart-empty-title">Nothing to check out</h1>
            <p className="cart-empty-text">Your cart is empty. Add some items first.</p>
            <Link to="/" className="btn btn-primary">
              <span>Browse catalog</span>
            </Link>
          </div>
        </section>
      </main>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const orderItems = items.map((item) => {
        const product = item.product as Record<string, unknown>
        return {
          productId: item.productId,
          productVariantId: item.productVariantId ?? undefined,
          name: (product?.name as string) ?? 'Product',
          sku: (product?.sku as string) ?? undefined,
          image: ((product?.images as string[]) ?? [])[0] ?? undefined,
          price: (product?.price as number) ?? 0,
          quantity: item.quantity,
          deliveryMethod: item.deliveryMethod as 'pickup' | 'delivery',
          pickupLocationId: item.pickupLocationId ?? undefined,
        }
      })

      const orderResult = await createOrder.mutateAsync({
        email: session!.user.email,
        paymentMethod: paymentMethod === 'cod' ? 'cod' : paymentMethod === 'check' ? 'check' : 'stripe',
        shippingAddress: {
          firstName,
          lastName,
          company: company || undefined,
          street1,
          street2: street2 || undefined,
          city,
          state: state || undefined,
          postalCode: postalCode || undefined,
          country,
          phone: phone || undefined,
        },
        items: orderItems,
        subtotal,
        shippingAmount: 0,
        total: subtotal,
        notes: notes || undefined,
        saveAddress,
      })

      const order = orderResult.data

      await clearCart.mutateAsync()

      if (paymentMethod === 'stripe') {
        const origin = window.location.origin
        const checkoutResult = await createCheckout.mutateAsync({
          orderId: order.id,
          successUrl: `${origin}/checkout?status=success&orderId=${order.id}`,
          cancelUrl: `${origin}/checkout?status=cancelled&orderId=${order.id}`,
        })

        window.location.href = checkoutResult.data.url
        return
      }

      navigate({
        to: '/checkout',
        search: { status: 'success', orderId: order.id },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const searchParams = new URLSearchParams(window.location.search)
  const status = searchParams.get('status')
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    if (status === 'success' && orderId) {
      clearCart.mutate()
    }
  }, [status, orderId])

  if (status === 'success' && orderId) {
    return (
      <main className="page-wrap home-shell">
        <section className="section-stack py-12 fade-in">
          <div className="max-w-3xl mx-auto cart-empty">
            <div className="checkout-success-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
                <circle cx="24" cy="24" r="24" fill="rgba(22, 163, 74, 0.1)" />
                <path d="M15 25l6 6 12-12" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="cart-empty-title">Order confirmed</h1>
            <p className="cart-empty-text">
              Your order <strong>{orderId.slice(0, 20)}...</strong> has been placed successfully.
              You will receive a confirmation email shortly.
            </p>
            <Link to="/" className="btn btn-primary">
              <span>Continue shopping</span>
            </Link>
          </div>
        </section>
      </main>
    )
  }

  if (status === 'cancelled') {
    return (
      <main className="page-wrap home-shell">
        <section className="section-stack py-12 fade-in">
          <div className="max-w-3xl mx-auto cart-empty">
            <ShoppingBag size={48} strokeWidth={1} className="cart-empty-icon" />
            <h1 className="cart-empty-title">Payment cancelled</h1>
            <p className="cart-empty-text">
              Your payment was cancelled. Your cart items are still saved.
            </p>
            <Link to="/cart" className="btn btn-primary">
              <span>Return to cart</span>
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap home-shell">
      <section className="section-stack py-8 md:py-12 fade-in">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-[var(--ink-soft)] hover:text-[var(--ink)] mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm uppercase tracking-wider">Back to cart</span>
          </Link>

          <h1 className="cart-page-title">Checkout</h1>

          <form className="checkout-layout" onSubmit={handleSubmit}>
            <div className="checkout-form-sections">
              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              <div className="checkout-section">
                <h2 className="checkout-section-title">Shipping Address</h2>
                <div className="checkout-form-grid">
                  <label className="checkout-field">
                    <span className="checkout-field-label">First name *</span>
                    <input
                      type="text"
                      className="checkout-field-input"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </label>
                  <label className="checkout-field">
                    <span className="checkout-field-label">Last name *</span>
                    <input
                      type="text"
                      className="checkout-field-input"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </label>
                </div>

                <label className="checkout-field">
                  <span className="checkout-field-label">Company</span>
                  <input
                    type="text"
                    className="checkout-field-input"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </label>

                <label className="checkout-field">
                  <span className="checkout-field-label">Street address *</span>
                  <input
                    type="text"
                    className="checkout-field-input"
                    required
                    value={street1}
                    onChange={(e) => setStreet1(e.target.value)}
                  />
                </label>

                <label className="checkout-field">
                  <span className="checkout-field-label">Apartment, suite, etc.</span>
                  <input
                    type="text"
                    className="checkout-field-input"
                    value={street2}
                    onChange={(e) => setStreet2(e.target.value)}
                  />
                </label>

                <div className="checkout-form-grid">
                  <label className="checkout-field">
                    <span className="checkout-field-label">City *</span>
                    <input
                      type="text"
                      className="checkout-field-input"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </label>
                  <label className="checkout-field">
                    <span className="checkout-field-label">Province / State</span>
                    <input
                      type="text"
                      className="checkout-field-input"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </label>
                </div>

                <div className="checkout-form-grid">
                  <label className="checkout-field">
                    <span className="checkout-field-label">Postal code</span>
                    <input
                      type="text"
                      className="checkout-field-input"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </label>
                  <label className="checkout-field">
                    <span className="checkout-field-label">Country *</span>
                    <input
                      type="text"
                      className="checkout-field-input"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </label>
                </div>

                <label className="checkout-field">
                  <span className="checkout-field-label">Phone</span>
                  <input
                    type="tel"
                    className="checkout-field-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>

                <label className="checkout-checkbox">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                  />
                  <span>Save this address for future orders</span>
                </label>
              </div>

              <div className="checkout-section">
                <h2 className="checkout-section-title">Payment Method</h2>
                <div className="checkout-payment-options">
                  {([
                    { value: 'stripe' as const, label: 'Pay with Card (Stripe)' },
                    { value: 'cod' as const, label: 'Cash on Delivery' },
                    { value: 'check' as const, label: 'Check / Bank Transfer' },
                  ]).map((opt) => (
                    <label key={opt.value} className="checkout-payment-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={opt.value}
                        checked={paymentMethod === opt.value}
                        onChange={() => setPaymentMethod(opt.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="checkout-section">
                <h2 className="checkout-section-title">Order Notes</h2>
                <label className="checkout-field">
                  <textarea
                    className="checkout-field-input checkout-textarea"
                    placeholder="Special instructions for your order..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="cart-summary">
              <h2 className="cart-summary-title">Order Summary</h2>

              <div className="checkout-items-preview">
                {items.map((item) => {
                  const product = item.product as Record<string, unknown> | null
                  const name = (product?.name as string) ?? 'Product'
                  const price = (product?.price as number) ?? 0
                  const images = product?.images as string[] | undefined

                  return (
                    <div key={item.id} className="checkout-item-row">
                      <div className="checkout-item-thumb">
                        {images && images.length > 0 ? (
                          <img src={images[0]} alt={name} />
                        ) : (
                          <ArtworkIcon size={18} strokeWidth={1} aria-hidden />
                        )}
                      </div>
                      <div className="checkout-item-info">
                        <span className="checkout-item-name">{name}</span>
                        <span className="checkout-item-qty">x{item.quantity}</span>
                      </div>
                      <span className="checkout-item-price">{formatPrice(price * item.quantity)}</span>
                    </div>
                  )
                })}
              </div>

              <div className="cart-summary-divider" />

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="cart-summary-row cart-summary-row--muted">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="cart-summary-divider" />
              <div className="cart-summary-row cart-summary-row--total">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary cart-checkout-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {paymentMethod === 'stripe' ? 'Pay with Stripe' : 'Place Order'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
