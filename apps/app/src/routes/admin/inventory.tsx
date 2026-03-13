import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  History,
  Layers,
  Package,
  Plus,
} from 'lucide-react'
import {
  useProducts,
  useLocations,
  useSuppliers,
  useReorderAlerts,
  useStockAtLocation,
  useStockMovements,
  useStockByProduct,
  useStockByProductAndLocation,
  useUpsertStock,
  useSetCountedBalance,
  useReceiveStock,
  useIssueStock,
  useTransferStock,
  useRemoveStock,
} from '../../lib/admin-queries'
import AdminModal from '../../components/admin/AdminModal'
import AdminFormField from '../../components/admin/AdminFormField'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import ActionMenu from '../../components/admin/ActionMenu'
import ActionMenuItem from '../../components/admin/ActionMenuItem'
import type { UpsertStockInput } from '@repo/sdk'

export const Route = createFileRoute('/admin/inventory')({
  component: AdminInventory,
  validateSearch: (search: Record<string, unknown>) => ({
    productId: (search.productId as string) || undefined,
  }),
})

type TabId = 'stock-levels' | 'reorder-alerts' | 'movements'

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
]

const MOVEMENT_TYPE_OPTIONS = [
  { value: 'in', label: 'In' },
  { value: 'out', label: 'Out' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'return', label: 'Return' },
]

function formatRWF(n: number) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(d: string | Date | null) {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function conditionBadgeClass(c: string) {
  if (c === 'new') return 'adm-badge--success'
  if (c === 'refurbished' || c === 'aftermarket') return 'adm-badge--info'
  return 'adm-badge--warn'
}

type ProductStockRow = {
  id: string
  productId: string
  locationId: string
  quantity: number
  condition: string
  reorderLevel: number | null
  reorderQuantity: number | null
  costPrice: number | null
  productName?: string
  partNumber?: string
  locationName?: string
}

function AdminInventory() {
  const { productId: filterProductId } = Route.useSearch()
  const [activeTab, setActiveTab] = useState<TabId>('stock-levels')
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [addStockOpen, setAddStockOpen] = useState(false)
  const [setCountedStock, setSetCountedStock] = useState<ProductStockRow | null>(null)
  const [receiveStock, setReceiveStock] = useState<ProductStockRow | null>(null)
  const [issueStock, setIssueStock] = useState<ProductStockRow | null>(null)
  const [transferStock, setTransferStock] = useState<ProductStockRow | null>(null)
  const [removeStock, setRemoveStock] = useState<ProductStockRow | null>(null)
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('')

  const { data: productsRes } = useProducts({ limit: '100', offset: '0' })
  const { data: locationsRes } = useLocations()
  const { data: suppliersRes } = useSuppliers()
  const { data: alertsRes, isLoading: alertsLoading } = useReorderAlerts()
  const { data: stockRes, isLoading: stockLoading } = useStockAtLocation(
    selectedLocationId || undefined
  )
  const { data: movementsRes, isLoading: movementsLoading } = useStockMovements({
    type: movementTypeFilter as 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | undefined,
    limit: 50,
    offset: 0,
  })

  const products = productsRes?.data ?? []
  const meta = productsRes?.meta ?? { total: 0, limit: 100, offset: 0, hasMore: false }
  const locations = locationsRes?.data ?? []
  const suppliers = suppliersRes?.data ?? []
  const alerts = alertsRes?.data ?? []
  const rawStockList = (stockRes?.data ?? []) as ProductStockRow[]
  const stockList = filterProductId
    ? rawStockList.filter((s) => s.productId === filterProductId)
    : rawStockList
  const movements = movementsRes?.data ?? []

  const productMap = new Map(products.map((p) => [p.id, p]))
  const locationMap = new Map(locations.map((l) => [l.id, l]))

  const upsertMutation = useUpsertStock()
  const setCountedMutation = useSetCountedBalance()
  const receiveMutation = useReceiveStock()
  const issueMutation = useIssueStock()
  const transferMutation = useTransferStock()
  const removeMutation = useRemoveStock()

  const activeCount = products.filter((p) => p.isActive).length
  const defaultLocationId = locations[0]?.id || ''
  const effectiveLocationId = selectedLocationId || defaultLocationId

  useEffect(() => {
    if (!selectedLocationId && defaultLocationId) {
      setSelectedLocationId(defaultLocationId)
    }
  }, [selectedLocationId, defaultLocationId])

  const statCards = [
    { label: 'Total Products', value: String(meta.total), icon: Package, accent: false },
    {
      label: 'Reorder Alerts',
      value: String(alerts.length),
      icon: AlertTriangle,
      accent: alerts.length > 0,
    },
    { label: 'Active Products', value: String(activeCount), icon: CheckCircle, accent: false },
  ]

  const tabs: { id: TabId; label: string; icon: typeof Layers }[] = [
    { id: 'stock-levels', label: 'Stock Levels', icon: Layers },
    { id: 'reorder-alerts', label: 'Reorder Alerts', icon: AlertTriangle },
    { id: 'movements', label: 'History', icon: History },
  ]

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Inventory Overview</h1>
          <p className="adm-page-subtitle">
            Stock balances at each location. Use Receive, Issue, or Set counted balance to update.
          </p>
        </div>
        <button
          type="button"
          className="adm-btn adm-btn--accent"
          onClick={() => setAddStockOpen(true)}
        >
          <Plus size={16} aria-hidden="true" />
          Add Stock
        </button>
      </div>

      <div className="adm-stat-row">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`adm-stat-card ${card.accent ? 'adm-stat-card--warn' : ''}`}
            >
              <div className="adm-stat-card-top">
                <span className="adm-stat-label">{card.label}</span>
                <Icon size={16} aria-hidden="true" className="adm-stat-icon" />
              </div>
              <span className="adm-stat-value">{card.value}</span>
            </div>
          )
        })}
      </div>

      <div className="adm-panel">
        <div className="adm-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                className={`adm-tab ${activeTab === tab.id ? 'adm-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} aria-hidden="true" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'stock-levels' && (
          <>
            <div className="adm-toolbar">
              <div className="adm-form-field adm-form-field--inline">
                <label className="adm-form-label" htmlFor="location-filter">
                  Location
                </label>
                <select
                  id="location-filter"
                  className="adm-form-select adm-form-select--sm"
                  value={effectiveLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                >
                  <option value="">Select location...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!effectiveLocationId ? (
              <div className="adm-empty">
                <Layers size={40} aria-hidden="true" className="adm-empty-icon" />
                <p className="adm-empty-text">Select a location to view stock levels</p>
              </div>
            ) : stockLoading ? (
              <div className="adm-skeleton">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="adm-skeleton-row" />
                ))}
              </div>
            ) : stockList.length === 0 ? (
              <div className="adm-empty">
                <Package size={40} aria-hidden="true" className="adm-empty-icon" />
                <p className="adm-empty-text">No stock at this location</p>
                <p className="text-sm text-(--ink-soft) mt-1">Add stock using the button above</p>
              </div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table adm-table--stack">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Location</th>
                      <th>Condition</th>
                      <th className="text-right">Quantity</th>
                      <th className="text-right">Threshold</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockList.map((s) => (
                        <tr key={s.id}>
                          <td data-label="Product">
                            <span className="font-medium">{s.productName ?? '—'}</span>
                            <span className="adm-cell-mono text-xs block text-(--ink-soft)">
                              {s.partNumber ?? s.productId}
                            </span>
                          </td>
                          <td data-label="Location" className="adm-cell-sub">{s.locationName ?? '—'}</td>
                          <td data-label="Condition">
                            <span
                              className={`adm-badge adm-badge--sm ${conditionBadgeClass(s.condition)}`}
                            >
                              {s.condition}
                            </span>
                          </td>
                          <td data-label="Quantity" className="text-right adm-cell-mono">{s.quantity}</td>
                          <td data-label="Threshold" className="text-right adm-cell-mono">
                            {s.quantity <= (s.reorderLevel ?? 0) ? (
                              <span className="adm-badge adm-badge--warn adm-badge--sm">
                                {s.quantity}/{s.reorderLevel ?? 0}
                              </span>
                            ) : (
                              `${s.reorderLevel ?? 0}`
                            )}
                          </td>
                          <td data-label="Action">
                            <ActionMenu>
                              <ActionMenuItem
                                onClick={() => setSetCountedStock(s as ProductStockRow)}
                              >
                                Set counted balance
                              </ActionMenuItem>
                              <ActionMenuItem
                                onClick={() => setReceiveStock(s as ProductStockRow)}
                              >
                                Receive stock
                              </ActionMenuItem>
                              <ActionMenuItem
                                onClick={() => setIssueStock(s as ProductStockRow)}
                              >
                                Issue stock
                              </ActionMenuItem>
                              <ActionMenuItem
                                onClick={() => setTransferStock(s as ProductStockRow)}
                              >
                                Transfer stock
                              </ActionMenuItem>
                              <ActionMenuItem
                                onClick={() => setRemoveStock(s as ProductStockRow)}
                                variant="danger"
                              >
                                Remove
                              </ActionMenuItem>
                            </ActionMenu>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'reorder-alerts' && (
          <>
            {alertsLoading ? (
              <div className="adm-skeleton">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="adm-skeleton-row" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="adm-empty">
                <CheckCircle size={40} aria-hidden="true" className="adm-empty-icon" />
                <p className="adm-empty-text">No reorder alerts</p>
              </div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table adm-table--stack">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Location</th>
                      <th className="text-right">Current</th>
                      <th className="text-right">Threshold</th>
                      <th className="text-right">Order qty</th>
                      <th>Supplier</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((a) => (
                      <tr key={`${a.productId}-${a.locationId}`}>
                        <td data-label="Product">
                          <span className="font-medium">{a.productName}</span>
                          <span className="adm-cell-mono text-xs block text-(--ink-soft)">
                            {a.partNumber}
                          </span>
                        </td>
                        <td data-label="Location">{a.locationName}</td>
                        <td data-label="Current" className="text-right adm-cell-mono">{a.quantity}</td>
                        <td data-label="Threshold" className="text-right adm-cell-mono">{a.reorderLevel}</td>
                        <td data-label="Order Qty" className="text-right adm-cell-mono">{a.reorderQuantity ?? '—'}</td>
                        <td data-label="Supplier" className="adm-cell-sub">{a.supplierName ?? '—'}</td>
                        <td data-label="Status">
                          <span className="adm-badge adm-badge--warn adm-badge--sm">
                            Low
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'movements' && (
          <>
            <p className="adm-page-subtitle mb-3">Audit history (read-only)</p>
            <div className="adm-toolbar">
              <div className="adm-form-field adm-form-field--inline">
                <label className="adm-form-label" htmlFor="movement-type-filter">
                  Type
                </label>
                <select
                  id="movement-type-filter"
                  className="adm-form-select adm-form-select--sm"
                  value={movementTypeFilter}
                  onChange={(e) => setMovementTypeFilter(e.target.value)}
                >
                  <option value="">All types</option>
                  {MOVEMENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {movementsLoading ? (
              <div className="adm-skeleton">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="adm-skeleton-row" />
                ))}
              </div>
            ) : movements.length === 0 ? (
              <div className="adm-empty">
                <History size={40} aria-hidden="true" className="adm-empty-icon" />
                <p className="adm-empty-text">No stock movements</p>
              </div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table adm-table--stack">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Product</th>
                      <th>Location</th>
                      <th className="text-right">Qty</th>
                      <th>Reason</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m: { id: string; type: string; productId: string; locationId: string; quantity: number; reason: string | null; createdAt: string | Date }) => (
                      <tr key={m.id}>
                        <td data-label="Type">
                          <span
                            className={`adm-badge adm-badge--sm ${
                              m.type === 'in' || m.type === 'return'
                                ? 'adm-badge--success'
                                : m.type === 'out'
                                  ? 'adm-badge--warn'
                                  : 'adm-badge--info'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td data-label="Product" className="adm-cell-sub">
                          {productMap.get(m.productId)?.name ?? m.productId}
                        </td>
                        <td data-label="Location" className="adm-cell-sub">
                          {locationMap.get(m.locationId)?.name ?? m.locationId}
                        </td>
                        <td data-label="Qty" className="text-right adm-cell-mono">{m.quantity}</td>
                        <td data-label="Reason" className="adm-cell-sub">{m.reason ?? '—'}</td>
                        <td data-label="Date" className="adm-cell-sub text-sm">
                          {formatDate(m.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <AddStockModal
        open={addStockOpen}
        onClose={() => setAddStockOpen(false)}
        products={products}
        locations={locations}
        suppliers={suppliers}
        onSubmit={(data) =>
          upsertMutation.mutate(data, { onSuccess: () => setAddStockOpen(false) })
        }
        loading={upsertMutation.isPending}
      />

      <SetCountedBalanceModal
        open={!!setCountedStock}
        stock={setCountedStock}
        onClose={() => setSetCountedStock(null)}
        onSubmit={(newQuantity) =>
          setCountedStock &&
          setCountedMutation.mutate(
            {
              productStockId: setCountedStock.id,
              productId: setCountedStock.productId,
              locationId: setCountedStock.locationId,
              newQuantity,
            },
            { onSuccess: () => setSetCountedStock(null) }
          )
        }
        loading={setCountedMutation.isPending}
      />

      <ReceiveModal
        open={!!receiveStock}
        stock={receiveStock}
        onClose={() => setReceiveStock(null)}
        onSubmit={(data) =>
          receiveMutation.mutate(data, { onSuccess: () => setReceiveStock(null) })
        }
        loading={receiveMutation.isPending}
      />

      <IssueModal
        open={!!issueStock}
        stock={issueStock}
        onClose={() => setIssueStock(null)}
        onSubmit={(data) =>
          issueMutation.mutate(data, { onSuccess: () => setIssueStock(null) })
        }
        loading={issueMutation.isPending}
      />

      <TransferModal
        open={!!transferStock}
        stock={transferStock}
        onClose={() => setTransferStock(null)}
        onSubmit={(data) =>
          transferMutation.mutate(data, { onSuccess: () => setTransferStock(null) })
        }
        loading={transferMutation.isPending}
      />

      <ConfirmDialog
        open={!!removeStock}
        onClose={() => setRemoveStock(null)}
        onConfirm={() =>
          removeStock &&
          removeMutation.mutate(removeStock.id, { onSuccess: () => setRemoveStock(null) })
        }
        title="Remove stock record"
        message={
          removeStock
            ? `Remove this stock record? The product will have no stock at this location until you add it again.`
            : ''
        }
        loading={removeMutation.isPending}
      />
    </>
  )
}

function AddStockModal({
  open,
  onClose,
  products,
  locations,
  suppliers,
  onSubmit,
  loading,
}: {
  open: boolean
  onClose: () => void
  products: { id: string; name: string; partNumber: string }[]
  locations: { id: string; name: string; address?: string | null }[]
  suppliers: { id: string; name: string }[]
  onSubmit: (data: UpsertStockInput) => void
  loading: boolean
}) {
  const [productId, setProductId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [condition, setCondition] = useState('new')
  const [costPrice, setCostPrice] = useState('')
  const [reorderLevel, setReorderLevel] = useState('5')
  const [reorderQuantity, setReorderQuantity] = useState('10')
  const [supplierId, setSupplierId] = useState('')

  const { data: existingStockRes } = useStockByProductAndLocation(
    productId || undefined,
    locationId || undefined
  )
  const existingStock = existingStockRes?.data ?? null

  useEffect(() => {
    if (productId && locationId) setQuantity('0')
  }, [productId, locationId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(quantity, 10)
    if (!productId || !locationId || Number.isNaN(qty) || qty < 0) return
    const finalQuantity = existingStock ? existingStock.quantity + qty : qty
    onSubmit({
      productId,
      locationId,
      quantity: finalQuantity,
      condition: condition as 'new' | 'used' | 'refurbished',
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      reorderLevel: parseInt(reorderLevel, 10) || undefined,
      reorderQuantity: parseInt(reorderQuantity, 10) || undefined,
      supplierId: supplierId || undefined,
    })
  }

  if (!open) return null

  return (
    <AdminModal open={open} onClose={onClose} title="Add / Update Stock" size="lg">
      <form className="adm-form" onSubmit={handleSubmit}>
        <div className="adm-form-row">
          <AdminFormField
            label="Product"
            name="productId"
            type="select"
            value={productId}
            onChange={setProductId}
            required
            options={[
              { value: '', label: 'Select product...' },
              ...products.map((p) => ({ value: p.id, label: `${p.partNumber} — ${p.name}` })),
            ]}
          />
          <AdminFormField
            label="Location"
            name="locationId"
            type="select"
            value={locationId}
            onChange={setLocationId}
            required
            options={[
              { value: '', label: 'Select location...' },
              ...locations.map((l) => ({
              value: l.id,
              label: l.address ? `${l.name} (${l.address})` : l.name,
            })),
            ]}
          />
        </div>
        <div className="adm-form-row">
          <div className="adm-form-field flex-1">
            <label className="adm-form-label" htmlFor="add-stock-quantity">
              {existingStock
                ? `Quantity to add (current: ${existingStock.quantity})`
                : 'Quantity'}
            </label>
            {existingStock && (
              <p className="text-sm text-(--ink-soft) mb-1">
                Enter how many units to add. Stock will increase from {existingStock.quantity} by this amount.
              </p>
            )}
            <input
              id="add-stock-quantity"
              type="number"
              min="0"
              className="adm-form-input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <AdminFormField
            label="Condition"
            name="condition"
            type="select"
            value={condition}
            onChange={setCondition}
            options={CONDITION_OPTIONS}
          />
        </div>
        <div className="adm-form-row">
          <AdminFormField
            label="Cost price"
            name="costPrice"
            type="number"
            value={costPrice}
            onChange={setCostPrice}
            placeholder="Optional"
          />
        </div>
        <div className="adm-form-row">
          <AdminFormField
            label="Low stock threshold"
            name="reorderLevel"
            type="number"
            value={reorderLevel}
            onChange={setReorderLevel}
          />
          <AdminFormField
            label="Quantity to order"
            name="reorderQuantity"
            type="number"
            value={reorderQuantity}
            onChange={setReorderQuantity}
          />
        </div>
        <AdminFormField
          label="Supplier"
          name="supplierId"
          type="select"
          value={supplierId}
          onChange={setSupplierId}
          options={[
            { value: '', label: 'None' },
            ...suppliers.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        <div className="adm-form-actions">
          <button type="button" className="adm-btn adm-btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="adm-btn adm-btn--accent" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </AdminModal>
  )
}

function SetCountedBalanceModal({
  open,
  stock,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean
  stock: ProductStockRow | null
  onClose: () => void
  onSubmit: (newQuantity: number) => void
  loading: boolean
}) {
  const [quantity, setQuantity] = useState('0')

  useEffect(() => {
    if (stock) setQuantity(String(stock.quantity))
  }, [stock])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(quantity, 10)
    if (Number.isNaN(qty) || qty < 0) return
    onSubmit(qty)
  }

  return (
    <AdminModal open={open} onClose={onClose} title="Set counted balance" size="sm">
      {stock && (
        <form className="adm-form" onSubmit={handleSubmit}>
          <div className="adm-form-field mb-3">
            <span className="adm-form-label">Stock</span>
            <p className="adm-cell-sub text-sm">
              {stock.productName ?? stock.productId} ({stock.partNumber ?? '—'}) at {stock.locationName ?? stock.locationId}
            </p>
            <p className="adm-cell-mono text-xs">Current qty: {stock.quantity}</p>
          </div>
          <AdminFormField
            label="New quantity"
            name="quantity"
            type="number"
            value={quantity}
            onChange={setQuantity}
            required
          />
          <div className="adm-form-actions">
            <button type="button" className="adm-btn adm-btn--outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="adm-btn adm-btn--accent" disabled={loading}>
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      )}
    </AdminModal>
  )
}

function ReceiveModal({
  open,
  stock,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean
  stock: ProductStockRow | null
  onClose: () => void
  onSubmit: (data: { productStockId: string; productId: string; locationId: string; quantity: number; reason?: string }) => void
  loading: boolean
}) {
  const [quantity, setQuantity] = useState('0')
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!stock) return
    const qty = parseInt(quantity, 10)
    if (Number.isNaN(qty) || qty <= 0) return
    onSubmit({
      productStockId: stock.id,
      productId: stock.productId,
      locationId: stock.locationId,
      quantity: qty,
      reason: reason || undefined,
    })
  }

  if (!stock) return null

  return (
    <AdminModal open={open} onClose={onClose} title="Receive stock" size="sm">
      <div className="adm-form-field mb-3">
        <span className="adm-form-label">Stock</span>
        <p className="adm-cell-sub text-sm">
          {stock.productName ?? stock.productId} ({stock.partNumber ?? '—'}) at {stock.locationName ?? stock.locationId}
        </p>
        <p className="adm-cell-mono text-xs">Current qty: {stock.quantity}</p>
      </div>
      <form className="adm-form" onSubmit={handleSubmit}>
        <AdminFormField
          label="Quantity to receive"
          name="quantity"
          type="number"
          value={quantity}
          onChange={setQuantity}
          required
        />
        <AdminFormField
          label="Reason"
          name="reason"
          type="textarea"
          value={reason}
          onChange={setReason}
          placeholder="Optional (e.g. PO number)"
        />
        <div className="adm-form-actions">
          <button type="button" className="adm-btn adm-btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="adm-btn adm-btn--accent" disabled={loading}>
            {loading ? 'Receiving...' : 'Receive'}
          </button>
        </div>
      </form>
    </AdminModal>
  )
}

function IssueModal({
  open,
  stock,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean
  stock: ProductStockRow | null
  onClose: () => void
  onSubmit: (data: { productStockId: string; productId: string; locationId: string; quantity: number; reason?: string }) => void
  loading: boolean
}) {
  const [quantity, setQuantity] = useState('0')
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!stock) return
    const qty = parseInt(quantity, 10)
    if (Number.isNaN(qty) || qty <= 0) return
    if (qty > stock.quantity) return
    onSubmit({
      productStockId: stock.id,
      productId: stock.productId,
      locationId: stock.locationId,
      quantity: qty,
      reason: reason || undefined,
    })
  }

  if (!stock) return null

  return (
    <AdminModal open={open} onClose={onClose} title="Issue stock" size="sm">
      <div className="adm-form-field mb-3">
        <span className="adm-form-label">Stock</span>
        <p className="adm-cell-sub text-sm">
          {stock.productName ?? stock.productId} ({stock.partNumber ?? '—'}) at {stock.locationName ?? stock.locationId}
        </p>
        <p className="adm-cell-mono text-xs">Current qty: {stock.quantity}</p>
      </div>
      <form className="adm-form" onSubmit={handleSubmit}>
        <AdminFormField
          label="Quantity to issue"
          name="quantity"
          type="number"
          value={quantity}
          onChange={setQuantity}
          required
        />
        <AdminFormField
          label="Reason"
          name="reason"
          type="textarea"
          value={reason}
          onChange={setReason}
          placeholder="Optional (e.g. order ID)"
        />
        <div className="adm-form-actions">
          <button type="button" className="adm-btn adm-btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="adm-btn adm-btn--accent" disabled={loading}>
            {loading ? 'Issuing...' : 'Issue'}
          </button>
        </div>
      </form>
    </AdminModal>
  )
}

function TransferModal({
  open,
  stock,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean
  stock: ProductStockRow | null
  onClose: () => void
  onSubmit: (data: {
    sourceProductStockId: string
    sourceProductId: string
    sourceLocationId: string
    destProductStockId: string
    destProductId: string
    destLocationId: string
    quantity: number
  }) => void
  loading: boolean
}) {
  const [destProductStockId, setDestProductStockId] = useState('')
  const [quantity, setQuantity] = useState('0')

  const { data: stockByProductRes } = useStockByProduct(stock?.productId)
  const otherStock =
    stockByProductRes?.data?.filter(
      (s) => s.id !== stock?.id && s.locationId !== stock?.locationId
    ) ?? []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!stock) return
    const qty = parseInt(quantity, 10)
    if (!destProductStockId || Number.isNaN(qty) || qty <= 0) return
    if (qty > stock.quantity) return
    const dest = otherStock.find((s) => s.id === destProductStockId)
    if (!dest) return
    onSubmit({
      sourceProductStockId: stock.id,
      sourceProductId: stock.productId,
      sourceLocationId: stock.locationId,
      destProductStockId: dest.id,
      destProductId: dest.productId,
      destLocationId: dest.locationId,
      quantity: qty,
    })
  }

  if (!stock) return null

  return (
    <AdminModal open={open} onClose={onClose} title="Transfer stock" size="sm">
      <div className="adm-form-field mb-3">
        <span className="adm-form-label">From</span>
        <p className="adm-cell-sub text-sm">
          {stock.productName ?? stock.productId} ({stock.partNumber ?? '—'}) at {stock.locationName ?? stock.locationId}
        </p>
        <p className="adm-cell-mono text-xs">Current qty: {stock.quantity}</p>
      </div>
      <form className="adm-form" onSubmit={handleSubmit}>
        {otherStock.length === 0 ? (
          <p className="adm-cell-sub text-sm mb-3">
            No other locations with stock for this product. Add stock at another location first.
          </p>
        ) : (
          <AdminFormField
            label="Transfer to"
            name="destProductStockId"
            type="select"
            value={destProductStockId}
            onChange={setDestProductStockId}
            required
            options={[
              { value: '', label: 'Select destination...' },
              ...otherStock.map((s) => {
                const loc = (s as { location?: { name: string } }).location
                return { value: s.id, label: loc?.name ?? s.locationId }
              }),
            ]}
          />
        )}
        <AdminFormField
          label="Quantity"
          name="quantity"
          type="number"
          value={quantity}
          onChange={setQuantity}
          required
        />
        <div className="adm-form-actions">
          <button type="button" className="adm-btn adm-btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="adm-btn adm-btn--accent"
            disabled={loading || otherStock.length === 0}
          >
            {loading ? 'Transferring...' : 'Transfer'}
          </button>
        </div>
      </form>
    </AdminModal>
  )
}
