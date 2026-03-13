import { createFileRoute } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ButtonLink from '../components/ButtonLink'
import CategoryCard from '../components/CategoryCard'
import ProductCard from '../components/ProductCard'
import ProductGridSkeleton from '../components/ProductGridSkeleton'
import SectionHeading from '../components/SectionHeading'
import { siteTheme } from '../lib/site-theme'
import { useProducts } from '../lib/admin-queries'
import type { Product } from '../lib/site-theme'

export const Route = createFileRoute('/')({ component: App })

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

function App() {
  const { data, isLoading, isError } = useProducts({
    limit: '8',
    offset: '0',
    isActive: 'true',
  })

  const apiProducts = data?.data ?? []

  return (
    <main className="page-wrap home-shell">
      <section className="hero-panel fade-in">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">{siteTheme.hero.eyebrow}</p>
          <h1 className="hero-title">{siteTheme.hero.title}</h1>
          <p className="hero-description">{siteTheme.hero.description}</p>
          <div className="hero-actions">
            <ButtonLink href={siteTheme.hero.primaryCta.href} variant="primary">
              {siteTheme.hero.primaryCta.label}
            </ButtonLink>
            <ButtonLink href={siteTheme.hero.secondaryCta.href} variant="secondary">
              {siteTheme.hero.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section id="operation-hubs" className="section-stack fade-in">
        <SectionHeading title="Operation Hubs" actionLabel="All departments" />
        <div className="department-grid">
          {siteTheme.categories.map((category) => (
            <CategoryCard key={category.title} category={category} />
          ))}
        </div>
      </section>

      <section id="featured-products" className="section-stack fade-in">
        <div className="feature-header-row">
          <SectionHeading title="High Precision Supply" />
          <div className="carousel-arrows" aria-hidden="true">
            <button type="button" className="carousel-arrow">
              <ChevronLeft size={16} />
            </button>
            <button type="button" className="carousel-arrow">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="product-grid">
          {isLoading && <ProductGridSkeleton />}
          {isError && (
            <p className="product-grid-error">Failed to load products. Please try again later.</p>
          )}
          {!isLoading && !isError && apiProducts.length === 0 && (
            <p className="product-grid-empty">No products available at the moment.</p>
          )}
          {!isLoading && !isError && apiProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={mapApiProductToDisplay(p)}
              slug={p.slug}
              productId={p.id}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
