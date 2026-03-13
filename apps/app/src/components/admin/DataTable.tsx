import type { ReactNode } from 'react'

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: string
  loading?: boolean
  error?: string
  emptyMessage?: string
  onRowAction?: (item: T) => ReactNode
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  loading,
  error,
  emptyMessage = 'No records found.',
  onRowAction,
}: DataTableProps<T>) {
  if (error) {
    return <div className="adm-table-error">{error}</div>
  }

  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {onRowAction && <th />}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="adm-skeleton-row">
                  {columns.map((col) => (
                    <td key={col.key}>
                      <span className="adm-skeleton" />
                    </td>
                  ))}
                  {onRowAction && (
                    <td>
                      <span className="adm-skeleton" />
                    </td>
                  )}
                </tr>
              ))
            : data.length === 0
              ? (
                  <tr>
                    <td colSpan={columns.length + (onRowAction ? 1 : 0)} className="adm-empty">
                      {emptyMessage}
                    </td>
                  </tr>
                )
              : data.map((item) => (
                  <tr key={item[keyField]}>
                    {columns.map((col) => (
                      <td key={col.key}>{col.render ? col.render(item) : item[col.key]}</td>
                    ))}
                    {onRowAction && <td className="adm-table-actions">{onRowAction(item)}</td>}
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  )
}
