export default function ProductCardSkeleton() {
  return (
    <article className="product-card">
      <div className="product-visual product-skeleton-visual" />
      <div className="product-body">
        <div className="product-meta">
          <span className="skeleton-box skeleton-text skeleton-text--sm" />
          <span className="skeleton-box skeleton-text skeleton-text--xs" />
        </div>
        <h3 className="product-title">
          <span className="skeleton-box skeleton-text skeleton-text--title" />
        </h3>
        <div className="product-bottom">
          <span className="skeleton-box skeleton-text skeleton-text--price" />
          <span className="skeleton-box skeleton-icon" />
        </div>
      </div>
    </article>
  )
}
