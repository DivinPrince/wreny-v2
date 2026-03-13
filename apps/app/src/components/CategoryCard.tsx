import type { Category } from '../lib/site-theme'

type CategoryCardProps = {
  category: Category
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const Icon = category.icon

  return (
    <article className="department-card">
      <div className="department-icon">
        <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
      </div>
      <h3 className="department-title">{category.title}</h3>
      <p className="department-copy">{category.description}</p>
    </article>
  )
}
