import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { MoreVertical, Package, AlertCircle } from 'lucide-react'
import { useOrders, useUpdateOrderStatus } from '../../lib/admin-queries'
import type { OrderWithItems } from '@repo/sdk'
import AdminModal from '../../components/admin/AdminModal'
import Pagination from '../../components/admin/Pagination'

export const Route = createFileRoute('/admin/sales-orders')({
  component: AdminSalesOrders,
})

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

const STATUS_TABS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const orderStatusClass: Record<OrderStatus, string> = {
  pending: 'adm-badge--warn',
  processing: 'adm-badge--info',
  shipped: 'adm-badge--info',
  delivered: 'adm-badge--success',
  cancelled: 'adm-badge--danger',
}

const paymentStatusClass: Record<PaymentStatus, string> = {
  pending: 'adm-badge--warn',
  paid: 'adm-badge--success',
  failed: 'adm-badge--danger',
  refunded: 'adm-badge--info',
}

function formatCurrency(val: number | string): string {
  return `RWF ${Number(val).toLocaleString()}`
}

function formatDate(val: Date | string): string {
  const d = typeof val === 'string' ? new Date(val) : val
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function AdminSalesOrders() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all')
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [detailOrder, setDetailOrder] = useState<OrderWithItems | null>(null)
  const [modalStatus, setModalStatus] = useState<OrderStatus | ''>('')

  const params = {
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    limit: String(limit),
    offset: String(offset),
  }

  const { data, isLoading, isError, error } = useOrders(params)
  const updateStatusMutation = useUpdateOrderStatus()

  const orders = data?.data ?? []
  const meta = data?.meta ?? { total: 0, limit: 20, offset: 0, hasMore: false }

  const pipelineTotal = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total || 0), 0)

  const openDetail = (order: OrderWithItems) => {
    setDetailOrder(order)
    setModalStatus(order.status)
  }

  const closeDetail = () => {
    setDetailOrder(null)
    setModalStatus('')
  }

  const handleUpdateStatus = () => {
    if (!detailOrder || !modalStatus || modalStatus === detailOrder.status) return
    updateStatusMutation.mutate(
      { id: detailOrder.id, status: modalStatus as OrderStatus },
      { onSuccess: closeDetail }
    )
  }

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Sales Orders</h1>
          <p className="adm-page-subtitle">Transaction pipeline &amp; fulfillment</p>
        </div>
        <div className="adm-sync-badge">
          Pipeline: {formatCurrency(pipelineTotal)}
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-panel-header">
          <h2 className="adm-panel-title">Order Stream</h2>
          <div className="adm-toolbar">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`adm-btn adm-btn--sm ${selectedStatus === tab.value ? 'adm-btn--accent' : 'adm-btn--outline'}`}
                onClick={() => {
                  setSelectedStatus(tab.value)
                  setOffset(0)
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--stack">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Items</th>
                  <th>Subtotal</th>
                  <th>Total</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="adm-skeleton-row">
                    <td data-label="Order ID"><span className="adm-skeleton" /></td>
                    <td data-label="Items"><span className="adm-skeleton" /></td>
                    <td data-label="Subtotal"><span className="adm-skeleton" /></td>
                    <td data-label="Total"><span className="adm-skeleton" /></td>
                    <td data-label="Payment status"><span className="adm-skeleton" /></td>
                    <td data-label="Order status"><span className="adm-skeleton" /></td>
                    <td data-label="Date"><span className="adm-skeleton" /></td>
                    <td data-label="Action"><span className="adm-skeleton" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isError && (
          <div className="adm-empty">
            <AlertCircle size={32} className="adm-empty-icon" aria-hidden="true" />
            <p className="adm-empty-text">{error?.message ?? 'Failed to load orders'}</p>
          </div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--stack">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Items</th>
                  <th>Subtotal</th>
                  <th>Total</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={8} className="adm-empty">
                    <Package size={32} className="adm-empty-icon" aria-hidden="true" />
                    <p className="adm-empty-text">No orders found.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && orders.length > 0 && (
          <>
            <div className="adm-table-wrap">
              <table className="adm-table adm-table--stack">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Items</th>
                    <th>Subtotal</th>
                    <th>Total</th>
                    <th>Payment Status</th>
                    <th>Order Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td data-label="Order ID" className="adm-cell-mono">{o.id}</td>
                      <td data-label="Items">{o.items?.length ?? 0}</td>
                      <td data-label="Subtotal">{formatCurrency(o.subtotal ?? o.total ?? 0)}</td>
                      <td data-label="Total">{formatCurrency(o.total ?? 0)}</td>
                      <td data-label="Payment Status">
                        <span className={`adm-badge ${paymentStatusClass[(o.paymentStatus as PaymentStatus) ?? 'pending'] ?? ''}`}>
                          {capitalize(String(o.paymentStatus ?? 'pending'))}
                        </span>
                      </td>
                      <td data-label="Order Status">
                        <span className={`adm-badge ${orderStatusClass[(o.status as OrderStatus) ?? 'pending'] ?? ''}`}>
                          {capitalize(String(o.status ?? 'pending'))}
                        </span>
                      </td>
                      <td data-label="Date">{formatDate(o.createdAt)}</td>
                      <td data-label="Action">
                        <button
                          type="button"
                          className="adm-btn adm-btn--sm adm-btn--outline"
                          onClick={() => openDetail(o)}
                          aria-label="View order details"
                        >
                          <MoreVertical size={14} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              total={meta.total}
              limit={meta.limit}
              offset={meta.offset}
              onPageChange={setOffset}
            />
          </>
        )}
      </div>

      <AdminModal
        open={!!detailOrder}
        onClose={closeDetail}
        title={detailOrder ? `Order ${detailOrder.id}` : 'Order details'}
        size="lg"
      >
        {detailOrder && (
          <div className="adm-form">
            <div className="adm-form-field">
              <span className="adm-form-label">Order ID</span>
              <span className="adm-cell-mono">{detailOrder.id}</span>
            </div>
            <div className="adm-form-field">
              <span className="adm-form-label">Created</span>
              <span>{formatDate(detailOrder.createdAt)}</span>
            </div>

            <div className="adm-form-field">
              <span className="adm-form-label">Items</span>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {(detailOrder.items ?? []).map((item) => (
                  <li key={item.id} style={{ marginBottom: '0.25rem' }}>
                    {item.name ?? 'Item'} × {item.quantity} — {formatCurrency(item.total ?? item.quantity * (item.price ?? 0))}
                  </li>
                ))}
              </ul>
            </div>

            <div className="adm-form-field">
              <span className="adm-form-label">Subtotal</span>
              <span>{formatCurrency(detailOrder.subtotal ?? detailOrder.total ?? 0)}</span>
            </div>
            <div className="adm-form-field">
              <span className="adm-form-label">Tax</span>
              <span>{formatCurrency(detailOrder.taxAmount ?? 0)}</span>
            </div>
            <div className="adm-form-field">
              <span className="adm-form-label">Total</span>
              <span>{formatCurrency(detailOrder.total ?? 0)}</span>
            </div>

            <div className="adm-form-field">
              <span className="adm-form-label">Order Status</span>
              <div className="adm-form-row" style={{ gap: '0.5rem', alignItems: 'center' }}>
                <select
                  className="adm-form-select"
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as OrderStatus)}
                >
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="adm-btn adm-btn--accent"
                  disabled={!modalStatus || modalStatus === detailOrder.status || updateStatusMutation.isPending}
                  onClick={handleUpdateStatus}
                >
                  {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>

            <div className="adm-form-actions">
              <button type="button" className="adm-btn adm-btn--outline" onClick={closeDetail}>
                Close
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </>
  )
}
