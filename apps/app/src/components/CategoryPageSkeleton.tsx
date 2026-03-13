import ProductGridSkeleton from './ProductGridSkeleton'

export default function CategoryPageSkeleton() {
  return (
    <main className="page-wrap home-shell">
      <section className="section-stack fade-in">
        <div className="product-grid">
          <ProductGridSkeleton />
        </div>
      </section>
    </main>
  )
}
