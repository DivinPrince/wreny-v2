import ProductCardSkeleton from './ProductCardSkeleton'

type ProductGridSkeletonProps = {
  count?: number
}

export default function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </>
  )
}
