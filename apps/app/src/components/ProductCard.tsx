import { Link } from '@tanstack/react-router'
import { Check, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import type { Product } from '../lib/site-theme'
import { productArtworkIcon } from '../lib/site-theme'
import { useAddToCart } from '../lib/cart-queries'
import { useSession } from '../lib/auth-client'
import { cartToast } from './Toast'

type ProductCardProps = {
  product: Product
  slug?: string
  productId?: string
}

export default function ProductCard({ product, slug, productId }: ProductCardProps) {
  const ArtworkIcon = productArtworkIcon
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const addToCart = useAddToCart()
  const [justAdded, setJustAdded] = useState(false)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!productId) return
    if (!isLoggedIn) {
      cartToast.error('Please sign in to add items to your cart')
      return
    }

    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1500)
    addToCart.mutate({ productId, quantity: 1, deliveryMethod: 'delivery' })
  }

  const cartButton = productId ? (
    <button
      type="button"
      className="icon-button product-cart"
      aria-label="Add to cart"
      onClick={handleAddToCart}
    >
      {justAdded ? (
        <Check aria-hidden="true" size={16} />
      ) : (
        <ShoppingBag aria-hidden="true" size={16} />
      )}
    </button>
  ) : (
    <span className="icon-button product-cart" aria-label="View details">
      <ShoppingBag aria-hidden="true" size={16} />
    </span>
  )

  const content = (
    <>
      <div className="product-visual">
        <span className="product-badge">{product.badge}</span>
        {product.image ? (
          <img src={product.image} alt={product.name} className="product-card-image" />
        ) : (
          <ArtworkIcon aria-hidden="true" size={76} strokeWidth={1.2} />
        )}
      </div>
      <div className="product-body">
        <div className="product-meta">
          <span>{product.label}</span>
          <span>In stock</span>
        </div>
        <h3 className="product-title">{product.name}</h3>
        <div className="product-bottom">
          <p className="product-price">{product.price}</p>
          {cartButton}
        </div>
      </div>
    </>
  )

  if (slug) {
    return (
      <Link to="/products/$slug" params={{ slug }} className="product-card product-card--link">
        {content}
      </Link>
    )
  }

  return <article className="product-card">{content}</article>
}
