import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import CategoryPageSkeleton from '../components/CategoryPageSkeleton'
import ProductCard from '../components/ProductCard'
import ProductGridSkeleton from '../components/ProductGridSkeleton'
import SectionHeading from '../components/SectionHeading'
import type { Product } from '../lib/site-theme'

export const Route = createFileRoute('/categories/$slug')({
  component: CategoryPage,
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

function CategoryPage() {
  const { slug } = Route.useParams()

  const { data: categoryRes, isLoading: categoryLoading, isError: categoryError } = useQuery({
    queryKey: ['category', 'slug', slug],
    queryFn: () => api.categories.getBySlug(slug),
  })
  const category = categoryRes?.data

  const { data: productsRes, isLoading: productsLoading, isError: productsError } = useQuery({
    queryKey: ['products', { categoryId: category?.id }],
    queryFn: () =>
      api.products.list({
        categoryId: category?.id,
        limit: '100',
        offset: '0',
        isActive: 'true',
      }),
    enabled: !!category?.id,
  })
  const products = productsRes?.data ?? []

  const isLoading = categoryLoading || (!!category?.id && productsLoading)
  const isError = categoryError || productsError

  if (categoryLoading && !category) {
    return <CategoryPageSkeleton />
  }

  if (categoryError || !category) {
    return (
      <main className="page-wrap home-shell">
        <section className="section-stack">
          <p className="product-grid-error">Category not found.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap home-shell">
      <section className="section-stack fade-in">
        <SectionHeading title={category.name} />
        {category.description && (
          <p className="department-copy mb-6">{category.description}</p>
        )}
        <div className="product-grid">
          {isLoading && <ProductGridSkeleton />}
          {isError && (
            <p className="product-grid-error">Failed to load products. Please try again later.</p>
          )}
          {!isLoading && !isError && products.length === 0 && (
            <p className="product-grid-empty">No products in this category yet.</p>
          )}
          {!isLoading && !isError &&
            products.map((p) => (
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
