import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, BarChart3, Box, ShoppingCart, Truck } from 'lucide-react'
import { useProducts, useOrders, useSuppliers, useReorderAlerts } from '../../lib/admin-queries'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

const statusClass: Record<string, string> = {
  pending: 'adm-badge--warn',
  processing: 'adm-badge--info',
  shipped: 'adm-badge--info',
  delivered: 'adm-badge--success',
  cancelled: 'adm-badge--danger',
}

function formatRWF(val: number | string): string {
  return `RWF ${Number(val).toLocaleString()}`
}

function formatDate(val: Date | string): string {
  const d = typeof val === 'string' ? new Date(val) : val
  return d.toLocaleDateString()
}

function AdminDashboard() {
  const productsQuery = useProducts()
  const ordersQuery = useOrders({ limit: '5' })
  const suppliersQuery = useSuppliers()
  const alertsQuery = useReorderAlerts()

  const productsTotal = productsQuery.data?.meta?.total ?? 0
  const alertsCount = alertsQuery.data?.data?.length ?? 0
  const ordersTotal = ordersQuery.data?.meta?.total ?? 0
  const activeSuppliers = suppliersQuery.data?.data?.filter((s) => s.isActive).length ?? 0

  const orders = ordersQuery.data?.data ?? []
  const alerts = alertsQuery.data?.data ?? []

  const isLoading =
    productsQuery.isLoading || ordersQuery.isLoading || suppliersQuery.isLoading || alertsQuery.isLoading

  const statCards = [
    { label: 'Total Products', value: isLoading ? '—' : productsTotal, sub: 'Catalog items', icon: Box },
    {
      label: 'Reorder Alerts',
      value: isLoading ? '—' : alertsCount,
      sub: alertsCount > 0 ? 'Needs attention' : 'All stocked',
      icon: AlertTriangle,
      isDark: alertsCount > 0,
    },
    { label: 'Total Orders', value: isLoading ? '—' : ordersTotal, sub: 'Lifetime', icon: ShoppingCart },
    { label: 'Active Suppliers', value: isLoading ? '—' : activeSuppliers, sub: 'Vendors', icon: Truck },
  ]

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Operations Hub</h1>
          <p className="adm-page-subtitle">Real-time data telemetry</p>
        </div>
        <div className="adm-sync-badge">
          <span className="adm-sync-dot" />
          Hub Sync: Active
        </div>
      </div>

      <div className="adm-stat-row">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`adm-stat-card${card.isDark ? ' adm-stat-card--dark' : ''}`}
            >
              <div className="adm-stat-card-top">
                <span className="adm-stat-label">{card.label}</span>
                <Icon size={16} aria-hidden="true" className="adm-stat-icon" />
              </div>
              <span className="adm-stat-value">{card.value}</span>
              <span className="adm-stat-sub">{card.sub}</span>
            </div>
          )
        })}
      </div>

      <div className="adm-dash-grid">
        <div className="adm-panel">
          <div className="adm-panel-header">
            <h2 className="adm-panel-title">Recent Orders</h2>
            <Link to="/admin/sales-orders" className="adm-panel-action">
              Full Log &rarr;
            </Link>
          </div>
          {ordersQuery.isLoading ? (
            <div className="adm-table-wrap">
              <table className="adm-table adm-table--stack">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="adm-skeleton-row">
                    <td data-label="Order ID"><span className="adm-skeleton" /></td>
                    <td data-label="Items"><span className="adm-skeleton" /></td>
                    <td data-label="Total"><span className="adm-skeleton" /></td>
                    <td data-label="Status"><span className="adm-skeleton" /></td>
                    <td data-label="Date"><span className="adm-skeleton" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : ordersQuery.isError ? (
            <div className="adm-empty">
              <span className="adm-empty-icon" aria-hidden="true">
                <BarChart3 size={32} />
              </span>
              <p className="adm-empty-text">{ordersQuery.error?.message ?? 'Failed to load orders'}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="adm-empty">
              <span className="adm-empty-icon" aria-hidden="true">
                <ShoppingCart size={32} />
              </span>
              <p className="adm-empty-text">No orders yet</p>
            </div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table adm-table--stack">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td data-label="Order ID" className="adm-cell-mono">{o.orderNumber ?? o.id}</td>
                      <td data-label="Items">{o.items?.length ?? 0}</td>
                      <td data-label="Total">{formatRWF(o.total)}</td>
                      <td data-label="Status">
                        <span className={`adm-badge ${statusClass[o.status] ?? ''}`}>
                          {o.status}
                        </span>
                      </td>
                      <td data-label="Date">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="adm-panel adm-panel--dark">
          <h2 className="adm-panel-title">Reorder Alerts</h2>
          {alertsQuery.isLoading ? (
            <div className="adm-resource-list">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="adm-resource-row">
                  <div className="adm-resource-meta">
                    <span className="adm-skeleton" style={{ width: '60%' }} />
                    <span className="adm-skeleton" style={{ width: '30px' }} />
                  </div>
                  <div className="adm-progress-track">
                    <div className="adm-progress-bar adm-skeleton" style={{ width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : alertsQuery.isError ? (
            <div className="adm-empty">
              <span className="adm-empty-icon" aria-hidden="true">
                <AlertTriangle size={32} />
              </span>
              <p className="adm-empty-text">{alertsQuery.error?.message ?? 'Failed to load alerts'}</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="adm-empty">
              <span className="adm-empty-icon" aria-hidden="true">
                <Box size={32} />
              </span>
              <p className="adm-empty-text">All stocked — no reorder alerts</p>
            </div>
          ) : (
            <div className="adm-resource-list">
              {alerts.map((a) => {
                const pct = a.reorderLevel > 0 ? Math.min(100, (a.quantity / a.reorderLevel) * 100) : 0
                return (
                  <div key={a.stockId} className="adm-resource-row">
                    <div className="adm-resource-meta">
                      <span>{a.productName}</span>
                      <span>{a.locationName} · {a.quantity} / {a.reorderLevel} (threshold)</span>
                    </div>
                    <div className="adm-progress-track">
                      <div
                        className="adm-progress-bar"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
