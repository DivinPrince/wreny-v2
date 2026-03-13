import { createFileRoute } from '@tanstack/react-router'
import ProductCard from '../components/ProductCard'
import ProductGridSkeleton from '../components/ProductGridSkeleton'
import { useProducts } from '../lib/admin-queries'
import type { Product } from '../lib/site-theme'

export const Route = createFileRoute('/search')({
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    search: typeof search.search === 'string' && search.search.trim() ? search.search : undefined,
  }),
})

function formatProductPrice(price: number): string {
  return `RWF ${price.toLocaleString()}`
}

function mapApiProductToDisplay(p: {
  name: string
  price: number
  category?: { name: string } | null
  brand?: { name: string } | null
  partNumber?: string
  images?: string[]
}): Product {
  return {
    badge: p.category?.name ?? 'General',
    label: p.brand?.name ?? p.partNumber ?? '',
    name: p.name,
    price: formatProductPrice(p.price ?? 0),
    image: p.images?.[0],
  }
}

function SearchPage() {
  const { search } = Route.useSearch()
  const searchTerm = (search ?? '').trim()

  const { data, isLoading, isError } = useProducts({
    limit: '24',
    offset: '0',
    isActive: 'true',
    ...(searchTerm ? { search: searchTerm } : {}),
  })

  const products = data?.data ?? []

  return (
    <main className="page-wrap search-page">
      <section className="search-hero fade-in">
        <p className="search-kicker">Catalog Search</p>
        <h1 className="search-title">
          {searchTerm ? `Results for "${searchTerm}"` : 'All catalog products'}
        </h1>
        <p className="search-description">
          {searchTerm
            ? 'Browse every matching part from the storefront catalog.'
            : 'Browse the full storefront catalog. Use the header search whenever you want to narrow it down.'}
        </p>
      </section>

      <section className="section-stack fade-in">
        <div className="search-results-head">
          <div>
            <p className="search-results-label">Results</p>
            <h2 className="search-results-title">
              {searchTerm ? `Showing matches for "${searchTerm}"` : 'All products'}
            </h2>
          </div>
          <p className="search-results-meta">
            {isLoading
              ? (searchTerm ? 'Searching...' : 'Loading catalog...')
              : `${products.length} item${products.length === 1 ? '' : 's'} found`}
          </p>
        </div>

        <div className="product-grid">
          {isLoading && <ProductGridSkeleton />}
          {isError && (
            <p className="product-grid-error">Failed to load products. Please try again later.</p>
          )}
          {!isLoading && !isError && products.length === 0 && (
            <p className="product-grid-empty">
              {searchTerm ? 'No products matched that search.' : 'No products available at the moment.'}
            </p>
          )}
          {!isLoading && !isError && products.map((product) => (
            <ProductCard
              key={product.id}
              product={mapApiProductToDisplay(product)}
              slug={product.slug}
              productId={product.id}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
