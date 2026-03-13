import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  total: number
  limit: number
  offset: number
  onPageChange: (offset: number) => void
}

export default function Pagination({ total, limit, offset, onPageChange }: PaginationProps) {
  const start = total === 0 ? 0 : offset + 1
  const end = Math.min(offset + limit, total)
  const hasPrev = offset > 0
  const hasNext = offset + limit < total

  return (
    <div className="adm-pagination">
      <span className="adm-pagination-info">
        Showing {start}–{end} of {total}
      </span>
      <div className="adm-pagination-controls">
        <button
          type="button"
          className="adm-btn adm-btn--icon"
          disabled={!hasPrev}
          onClick={() => onPageChange(Math.max(0, offset - limit))}
        >
          <ChevronLeft size={16} />
          Prev
        </button>
        <button
          type="button"
          className="adm-btn adm-btn--icon"
          disabled={!hasNext}
          onClick={() => onPageChange(offset + limit)}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
