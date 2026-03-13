import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Cog, Link2, Package, Pencil, Plus, Search, Trash2, Unlink, Wrench } from 'lucide-react'
import {
  useAddCompatibility,
  useEquipment,
  useEquipmentProducts,
  useCreateEquipment,
  useProducts,
  useRemoveCompatibility,
  useUpdateEquipment,
  useDeleteEquipment,
} from '../../lib/admin-queries'
import AdminModal from '../../components/admin/AdminModal'
import AdminFormField from '../../components/admin/AdminFormField'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import ActionMenu from '../../components/admin/ActionMenu'
import ActionMenuItem from '../../components/admin/ActionMenuItem'
import type { Equipment } from '@repo/sdk'

export const Route = createFileRoute('/admin/equipment')({
  component: AdminEquipment,
})

const EQUIPMENT_TYPES = [
  { value: 'vehicle' as const, label: 'Vehicle' },
  { value: 'generator' as const, label: 'Generator' },
  { value: 'machinery' as const, label: 'Machinery' },
  { value: 'electronics' as const, label: 'Electronics' },
  { value: 'other' as const, label: 'Other' },
]

const typeClass: Record<string, string> = {
  vehicle: 'adm-badge--info',
  generator: 'adm-badge--accent',
  machinery: 'adm-badge--warn',
  electronics: 'adm-badge--success',
  other: 'adm-badge--info',
}

function formatYearRange(yearFrom: number | null, yearTo: number | null): string {
  if (yearFrom != null && yearTo != null) return `${yearFrom}–${yearTo}`
  if (yearFrom != null) return `${yearFrom}+`
  if (yearTo != null) return `Up to ${yearTo}`
  return '—'
}

function formatType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function EquipmentProductsModal({
  open,
  equipment,
  onClose,
}: {
  open: boolean
  equipment: Equipment | null
  onClose: () => void
}) {
  const [productSearch, setProductSearch] = useState('')
  const [productId, setProductId] = useState('')
  const [notes, setNotes] = useState('')
  const { data, isLoading, isError, error } = useEquipmentProducts(equipment?.id)
  const { data: productsRes, isLoading: productsLoading } = useProducts({
    limit: '100',
    offset: '0',
    isActive: 'true',
    ...(productSearch.trim() ? { search: productSearch.trim() } : {}),
  })
  const addCompatibility = useAddCompatibility()
  const removeCompatibility = useRemoveCompatibility()

  const linkedProducts = data?.data ?? []
  const selectableProducts = (productsRes?.data ?? []).filter(
    (entry) => !linkedProducts.some((linked) => linked.product.id === entry.id),
  )

  return (
    <AdminModal
      open={open && !!equipment}
      onClose={onClose}
      title={equipment ? `Compatible Parts: ${equipment.make} ${equipment.model}` : 'Compatible Parts'}
      size="lg"
    >
      {equipment && (
        <div className="adm-compat-section">
          <div className="adm-compat-header">
            <div>
              <h3 className="adm-panel-title">Linked Products</h3>
              <p className="adm-compat-copy">
                Manage which parts match this equipment entry.
              </p>
            </div>
            <span className="adm-badge adm-badge--info adm-badge--sm">
              {linkedProducts.length} linked
            </span>
          </div>

          {isLoading && (
            <div className="adm-compat-empty">
              <p className="adm-empty-text">Loading linked products...</p>
            </div>
          )}

          {isError && (
            <div className="adm-compat-empty">
              <p className="adm-empty-text">{error?.message ?? 'Failed to load linked products'}</p>
            </div>
          )}

          {!isLoading && !isError && linkedProducts.length === 0 && (
            <div className="adm-compat-empty">
              <p className="adm-empty-text">No products linked yet</p>
            </div>
          )}

          {!isLoading && !isError && linkedProducts.length > 0 && (
            <div className="adm-compat-list">
              {linkedProducts.map((entry) => (
                <div key={entry.compatibility.id} className="adm-compat-item">
                  <div className="adm-compat-item-main">
                    <div className="adm-compat-title-row">
                      <strong>{entry.product.name}</strong>
                      <span className="adm-badge adm-badge--info adm-badge--sm">
                        {entry.product.partNumber}
                      </span>
                    </div>
                    <p className="adm-compat-meta">{entry.product.slug}</p>
                    {entry.compatibility.notes && (
                      <p className="adm-compat-note">{entry.compatibility.notes}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="adm-btn adm-btn--outline adm-btn--sm"
                    disabled={removeCompatibility.isPending}
                    onClick={() =>
                      removeCompatibility.mutate({
                        compatibilityId: entry.compatibility.id,
                        equipmentId: equipment.id,
                        productId: entry.product.id,
                      })
                    }
                  >
                    <Unlink size={14} aria-hidden="true" />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="adm-compat-form">
            <div className="adm-form-row">
              <AdminFormField
                label="Find products"
                name={`product-search-${equipment.id}`}
                value={productSearch}
                onChange={setProductSearch}
                placeholder="Search by part number or name"
              />
              <AdminFormField
                label="Product"
                name={`product-id-${equipment.id}`}
                type="select"
                value={productId}
                onChange={setProductId}
                placeholder={productsLoading ? 'Loading products...' : 'Select product'}
                options={selectableProducts.map((entry) => ({
                  value: entry.id,
                  label: `${entry.partNumber ?? 'No part number'} - ${entry.name}`,
                }))}
              />
            </div>
            <AdminFormField
              label="Fitment notes"
              name={`product-notes-${equipment.id}`}
              value={notes}
              onChange={setNotes}
              placeholder="Optional notes"
            />
            <div className="adm-form-actions adm-form-actions--split">
              <p className="adm-compat-copy">
                Search helps when the catalog is large. Only products not yet linked are shown.
              </p>
              <button
                type="button"
                className="adm-btn adm-btn--accent"
                disabled={!productId || addCompatibility.isPending}
                onClick={() =>
                  addCompatibility.mutate(
                    {
                      productId,
                      equipmentId: equipment.id,
                      notes: notes.trim() || undefined,
                    },
                    {
                      onSuccess: () => {
                        setProductId('')
                        setNotes('')
                      },
                    },
                  )
                }
              >
                <Link2 size={14} aria-hidden="true" />
                {addCompatibility.isPending ? 'Linking...' : 'Link Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminModal>
  )
}

function AdminEquipment() {
  const [typeFilter, setTypeFilter] = useState<Equipment['type'] | null>(null)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<Equipment | null>(null)
  const [deleteItem, setDeleteItem] = useState<Equipment | null>(null)
  const [productsItem, setProductsItem] = useState<Equipment | null>(null)

  const params = typeFilter ? { type: typeFilter } : undefined
  const { data, isLoading, isError, error } = useEquipment(params)
  const equipmentList = data?.data ?? []
  const createMutation = useCreateEquipment()
  const updateMutation = useUpdateEquipment()
  const deleteMutation = useDeleteEquipment()

  const filtered = search
    ? equipmentList.filter(
        (e) =>
          e.make.toLowerCase().includes(search.toLowerCase()) ||
          e.model.toLowerCase().includes(search.toLowerCase())
      )
    : equipmentList

  const totalCount = equipmentList.length
  const activeCount = equipmentList.filter((e) => e.isActive).length
  const uniqueMakes = new Set(equipmentList.map((e) => e.make)).size
  const typeCount = new Set(equipmentList.map((e) => e.type)).size

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Equipment</h1>
          <p className="adm-page-subtitle">
            Vehicles, generators &amp; machinery compatibility registry
          </p>
        </div>
        <button type="button" className="adm-btn adm-btn--accent" onClick={() => setCreateOpen(true)}>
          <Plus size={16} aria-hidden="true" />
          Add Equipment
        </button>
      </div>

      <div className="adm-stat-row">
        <div className="adm-stat-card">
          <div className="adm-stat-card-top">
            <span className="adm-stat-label">Equipment Entries</span>
            <Wrench size={16} aria-hidden="true" className="adm-stat-icon" />
          </div>
          <span className="adm-stat-value">{totalCount}</span>
          <span className="adm-stat-sub">{activeCount} Active</span>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-card-top">
            <span className="adm-stat-label">Makes</span>
            <Cog size={16} aria-hidden="true" className="adm-stat-icon" />
          </div>
          <span className="adm-stat-value">{uniqueMakes}</span>
          <span className="adm-stat-sub">Manufacturers</span>
        </div>
        <div className="adm-stat-card adm-stat-card--dark">
          <div className="adm-stat-card-top">
            <span className="adm-stat-label">Categories</span>
            <Wrench size={16} aria-hidden="true" className="adm-stat-icon" />
          </div>
          <span className="adm-stat-value">{typeCount}</span>
          <span className="adm-stat-sub">Equipment types</span>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-toolbar">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`adm-btn adm-btn--sm ${typeFilter === null ? 'adm-btn--accent' : 'adm-btn--outline'}`}
              onClick={() => setTypeFilter(null)}
            >
              All Types
            </button>
            {EQUIPMENT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`adm-btn adm-btn--sm ${typeFilter === t.value ? 'adm-btn--accent' : 'adm-btn--outline'}`}
                onClick={() => setTypeFilter(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="adm-toolbar-search">
            <Search size={14} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by make, model..."
              className="adm-toolbar-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading && (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--stack">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Type</th>
                  <th>Year Range</th>
                  <th>Engine</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="adm-skeleton-row">
                    <td data-label="ID"><span className="adm-skeleton" /></td>
                    <td data-label="Make"><span className="adm-skeleton" /></td>
                    <td data-label="Model"><span className="adm-skeleton" /></td>
                    <td data-label="Type"><span className="adm-skeleton" /></td>
                    <td data-label="Year Range"><span className="adm-skeleton" /></td>
                    <td data-label="Engine"><span className="adm-skeleton" /></td>
                    <td data-label="Status"><span className="adm-skeleton" /></td>
                    <td data-label="Action"><span className="adm-skeleton" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isError && (
          <div className="adm-empty">
            <div className="adm-empty-icon">!</div>
            <p className="adm-empty-text">{error?.message ?? 'Failed to load equipment'}</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="adm-empty">
            <div className="adm-empty-icon">—</div>
            <p className="adm-empty-text">
              {equipmentList.length === 0 ? 'No equipment yet' : 'No matches for your search'}
            </p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--stack">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Type</th>
                  <th>Year Range</th>
                  <th>Engine</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td data-label="ID" className="adm-cell-mono">{e.id}</td>
                    <td data-label="Make" style={{ fontWeight: 600 }}>{e.make}</td>
                    <td data-label="Model">{e.model}</td>
                    <td data-label="Type">
                      <span className={`adm-badge ${typeClass[e.type] ?? ''}`}>
                        {formatType(e.type)}
                      </span>
                    </td>
                    <td data-label="Year Range" className="adm-cell-mono">
                      {formatYearRange(e.yearFrom, e.yearTo)}
                    </td>
                    <td data-label="Engine">{e.engineType ?? '—'}</td>
                    <td data-label="Status">
                      <span
                        className={`adm-badge ${e.isActive ? 'adm-badge--success' : 'adm-badge--danger'}`}
                      >
                        {e.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td data-label="Action">
                      <ActionMenu>
                        <ActionMenuItem
                          onClick={() => setEditItem(e)}
                        >
                          <Pencil size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                          Edit
                        </ActionMenuItem>
                        <ActionMenuItem onClick={() => setProductsItem(e)}>
                          <Package size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                          Compatible parts
                        </ActionMenuItem>
                        <ActionMenuItem
                          variant="danger"
                          onClick={() => setDeleteItem(e)}
                        >
                          <Trash2 size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                          Delete
                        </ActionMenuItem>
                      </ActionMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EquipmentFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(form) => {
          const yearFrom = form.yearFrom ? parseInt(form.yearFrom, 10) : undefined
          const yearTo = form.yearTo ? parseInt(form.yearTo, 10) : undefined
          createMutation.mutate(
            {
              make: form.make,
              model: form.model,
              yearFrom,
              yearTo,
              type: form.type,
              engineType: form.engineType || undefined,
              notes: form.notes || undefined,
              isActive: form.isActive,
            },
            { onSuccess: () => setCreateOpen(false) }
          )
        }}
        loading={createMutation.isPending}
      />

      {editItem && (
        <EquipmentFormModal
          open={true}
          onClose={() => setEditItem(null)}
          equipment={editItem}
          onSubmit={(form) => {
            const yearFrom = form.yearFrom ? parseInt(form.yearFrom, 10) : undefined
            const yearTo = form.yearTo ? parseInt(form.yearTo, 10) : undefined
            updateMutation.mutate(
              {
                id: editItem.id,
                data: {
                  make: form.make,
                  model: form.model,
                  yearFrom,
                  yearTo,
                  type: form.type,
                  engineType: form.engineType || undefined,
                  notes: form.notes || undefined,
                  isActive: form.isActive,
                },
              },
              { onSuccess: () => setEditItem(null) }
            )
          }}
          loading={updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => {
          if (deleteItem) {
            deleteMutation.mutate(deleteItem.id, { onSuccess: () => setDeleteItem(null) })
          }
        }}
        title="Delete equipment"
        message={
          deleteItem
            ? `Delete ${deleteItem.make} ${deleteItem.model}? This cannot be undone.`
            : ''
        }
        loading={deleteMutation.isPending}
      />

      {productsItem && (
        <EquipmentProductsModal
          key={productsItem.id}
          open={true}
          equipment={productsItem}
          onClose={() => setProductsItem(null)}
        />
      )}
    </>
  )
}

interface FormState {
  make: string
  model: string
  yearFrom: string
  yearTo: string
  type: Equipment['type']
  engineType: string
  notes: string
  isActive: boolean
}

const initialForm: FormState = {
  make: '',
  model: '',
  yearFrom: '',
  yearTo: '',
  type: 'vehicle',
  engineType: '',
  notes: '',
  isActive: true,
}

interface EquipmentFormModalProps {
  open: boolean
  onClose: () => void
  equipment?: Equipment
  onSubmit: (form: FormState) => void
  loading: boolean
}

function EquipmentFormModal({
  open,
  onClose,
  equipment,
  onSubmit,
  loading,
}: EquipmentFormModalProps) {
  const [form, setForm] = useState<FormState>(initialForm)

  useEffect(() => {
    if (!open) return
    if (equipment) {
      setForm({
        make: equipment.make,
        model: equipment.model,
        yearFrom: equipment.yearFrom != null ? String(equipment.yearFrom) : '',
        yearTo: equipment.yearTo != null ? String(equipment.yearTo) : '',
        type: equipment.type,
        engineType: equipment.engineType ?? '',
        notes: equipment.notes ?? '',
        isActive: equipment.isActive,
      })
    } else {
      setForm(initialForm)
    }
  }, [open, equipment])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const yearFromNum = form.yearFrom ? parseInt(form.yearFrom, 10) : undefined
    const yearToNum = form.yearTo ? parseInt(form.yearTo, 10) : undefined
    if (form.yearFrom && isNaN(yearFromNum!)) return
    if (form.yearTo && isNaN(yearToNum!)) return
    onSubmit(form)
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={equipment ? 'Edit equipment' : 'Add equipment'}
      size="default"
    >
      <form className="adm-form" onSubmit={handleSubmit}>
        <div className="adm-form-row">
          <AdminFormField
            label="Make"
            name="make"
            value={form.make}
            onChange={(v) => setForm((f) => ({ ...f, make: v }))}
            placeholder="e.g. Caterpillar"
            required
          />
          <AdminFormField
            label="Model"
            name="model"
            value={form.model}
            onChange={(v) => setForm((f) => ({ ...f, model: v }))}
            placeholder="e.g. 320D"
            required
          />
        </div>
        <div className="adm-form-row">
          <AdminFormField
            label="Year from"
            name="yearFrom"
            type="number"
            value={form.yearFrom}
            onChange={(v) => setForm((f) => ({ ...f, yearFrom: v }))}
            placeholder="e.g. 2015"
          />
          <AdminFormField
            label="Year to"
            name="yearTo"
            type="number"
            value={form.yearTo}
            onChange={(v) => setForm((f) => ({ ...f, yearTo: v }))}
            placeholder="e.g. 2020"
          />
        </div>
        <div className="adm-form-row">
          <AdminFormField
            label="Type"
            name="type"
            type="select"
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: v as Equipment['type'] }))}
            options={EQUIPMENT_TYPES}
            required
          />
          <AdminFormField
            label="Engine type"
            name="engineType"
            value={form.engineType}
            onChange={(v) => setForm((f) => ({ ...f, engineType: v }))}
            placeholder="e.g. Diesel, Electric"
          />
        </div>
        <AdminFormField
          label="Notes"
          name="notes"
          type="textarea"
          value={form.notes}
          onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
          placeholder="Optional notes"
        />
        <AdminFormField
          label="Status"
          name="isActive"
          type="select"
          value={form.isActive ? 'true' : 'false'}
          onChange={(v) => setForm((f) => ({ ...f, isActive: v === 'true' }))}
          options={[
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
        />
        <div className="adm-form-actions">
          <button type="button" className="adm-btn adm-btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="adm-btn adm-btn--accent" disabled={loading}>
            {loading ? 'Saving...' : equipment ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </AdminModal>
  )
}
