import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ArrowLeft, Minus, Plus, ShoppingBag, Check } from 'lucide-react'
import { api } from '../lib/api'
import { useAddToCart } from '../lib/cart-queries'
import { useSession } from '../lib/auth-client'
import { cartToast } from '../components/Toast'
import ProductCard from '../components/ProductCard'
import { productArtworkIcon } from '../lib/site-theme'

export const Route = createFileRoute('/products/$slug')({
  component: ProductPage,
})

function formatPrice(price: number): string {
  return `RWF ${price.toLocaleString()}`
}

function ProductPage() {
  const { slug } = Route.useParams()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', 'slug', slug],
    queryFn: () => api.products.getBySlug(slug),
  })

  const product = data?.data
  const categoryId = product?.category?.id

  const { data: relatedData } = useQuery({
    queryKey: ['products', 'related', categoryId, product?.id],
    queryFn: () =>
      api.products.list({
        categoryId: categoryId!,
        limit: '5',
        isActive: 'true',
      }),
    enabled: !!categoryId && !!product,
  })

  useEffect(() => {
    setSelectedImageIndex(0)
  }, [product?.id])

  if (isLoading && !product) {
    return (
      <main className="page-wrap home-shell">
        <section className="section-stack py-12">
          <div className="product-detail-skeleton animate-pulse">
            <div className="h-64 bg-[var(--line)] rounded-2xl" />
            <div className="mt-6 space-y-3">
              <div className="h-8 bg-[var(--line)] rounded w-3/4" />
              <div className="h-4 bg-[var(--line)] rounded w-1/2" />
              <div className="h-24 bg-[var(--line)] rounded" />
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (isError || !product) {
    return (
      <main className="page-wrap home-shell">
        <section className="section-stack py-12">
          <p className="product-grid-error">Product not found.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-4 text-[var(--accent-deep)] hover:underline"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </section>
      </main>
    )
  }

  const relatedProducts = (relatedData?.data ?? []).filter((p) => p.id !== product.id).slice(0, 4)
  const productImages = product.images ?? []
  const selectedImage = productImages[selectedImageIndex] ?? productImages[0]

  const ArtworkIcon = productArtworkIcon
  const category = product.category
  const brand = product.brand
  const priceFormatted = formatPrice(product.price ?? 0)
  const wholesaleFormatted =
    product.wholesalePrice != null ? formatPrice(product.wholesalePrice) : null

  return (
    <main className="page-wrap home-shell">
      <section className="section-stack py-8 md:py-12 fade-in">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[var(--ink-soft)] hover:text-[var(--ink)] mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm uppercase tracking-wider">Back to catalog</span>
          </Link>

          <div className="product-detail-layout">
            <div className="product-detail-visual">
              <div className="product-detail-image-wrap">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="product-detail-image"
                  />
                ) : (
                  <div className="product-detail-placeholder">
                    <ArtworkIcon size={120} strokeWidth={0.8} aria-hidden />
                  </div>
                )}
              </div>
              {productImages.length > 1 && (
                <div className="product-detail-thumbs" aria-label="Product images">
                  {productImages.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      className={`product-detail-thumb ${index === selectedImageIndex ? 'product-detail-thumb--active' : ''}`}
                      onClick={() => setSelectedImageIndex(index)}
                      aria-label={`View product image ${index + 1}`}
                    >
                      <img src={image} alt={`${product.name} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="product-detail-body">
              <div className="product-detail-meta">
                {category && (
                  <span className="product-badge">{category.name}</span>
                )}
                {brand && (
                  <span className="product-detail-brand">{brand.name}</span>
                )}
              </div>

              <h1 className="product-detail-title">{product.name}</h1>

              {product.partNumber && (
                <p className="product-detail-part">
                  Part # {product.partNumber}
                </p>
              )}

              {(product.description || product.shortDescription) && (
                <div className="product-detail-description">
                  <p>
                    {product.shortDescription ?? product.description}
                  </p>
                </div>
              )}

              <div className="product-detail-pricing">
                <p className="product-detail-price">{priceFormatted}</p>
                {wholesaleFormatted && (
                  <p className="product-detail-wholesale">
                    B2B: {wholesaleFormatted}
                  </p>
                )}
              </div>

              {product.stock != null && (
                <p className="product-detail-stock">
                  {product.stock > 0 ? (
                    <span className="text-green-700">In stock ({product.stock} available)</span>
                  ) : (
                    <span className="text-amber-700">Out of stock</span>
                  )}
                </p>
              )}

              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="product-detail-specs">
                  <h3 className="product-detail-specs-title">Specifications</h3>
                  <dl className="product-detail-specs-list">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="product-detail-spec-row">
                        <dt className="product-detail-spec-key">{key}</dt>
                        <dd className="product-detail-spec-value">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {product.warranty && (
                <p className="product-detail-warranty">
                  Warranty: {product.warranty}
                </p>
              )}

              <AddToCartSection productId={product.id} stock={product.stock ?? 0} />
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="section-stack pb-12 fade-in">
          <div className="max-w-5xl mx-auto">
            <div className="section-heading">
              <h2 className="section-title" style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)' }}>
                Related Products
              </h2>
            </div>
            <div className="product-grid" style={{ marginTop: '1.25rem' }}>
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{
                    badge: p.category?.name ?? 'General',
                    label: p.brand?.name ?? p.partNumber ?? '',
                    name: p.name,
                    price: formatPrice(p.price ?? 0),
                    image: p.images?.[0],
                  }}
                  slug={p.slug}
                  productId={p.id}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

function AddToCartSection({ productId, stock }: { productId: string; stock: number }) {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const addToCart = useAddToCart()
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  const outOfStock = stock <= 0

  function handleAdd() {
    if (!isLoggedIn) {
      cartToast.error('Please sign in to add items to your cart')
      return
    }
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
    addToCart.mutate({ productId, quantity, deliveryMethod: 'delivery' })
  }

  return (
    <div className="product-detail-actions mt-8">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="qty-selector">
          <button
            type="button"
            className="qty-btn"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>
          <span className="qty-value">{quantity}</span>
          <button
            type="button"
            className="qty-btn"
            onClick={() => setQuantity((q) => q + 1)}
            disabled={outOfStock}
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>

        <button
          type="button"
          className="btn btn-primary inline-flex items-center gap-2"
          onClick={handleAdd}
          disabled={addToCart.isPending || outOfStock}
        >
          {justAdded ? (
            <>
              <Check size={18} />
              <span>Added</span>
            </>
          ) : (
            <>
              <ShoppingBag size={18} />
              <span>{outOfStock ? 'Out of stock' : 'Add to cart'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
