import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Globe, MoreVertical, Plus, Search, Truck } from 'lucide-react'
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from '../../lib/admin-queries'
import AdminModal from '../../components/admin/AdminModal'
import AdminFormField from '../../components/admin/AdminFormField'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import ActionMenu from '../../components/admin/ActionMenu'
import ActionMenuItem from '../../components/admin/ActionMenuItem'
import type { Supplier } from '@repo/sdk'

export const Route = createFileRoute('/admin/suppliers')({
  component: AdminSuppliers,
})

type SupplierFormState = {
  name: string
  slug: string
  contactPerson: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  website: string
  notes: string
  isActive: string
}

const defaultForm: SupplierFormState = {
  name: '',
  slug: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  website: '',
  notes: '',
  isActive: 'true',
}

function slugFromName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function SupplierForm({
  form,
  updateField,
}: {
  form: SupplierFormState
  updateField: (key: keyof SupplierFormState, value: string) => void
}) {
  return (
    <div className="adm-form">
      <div className="adm-form-row">
        <AdminFormField
          label="Name"
          name="name"
          value={form.name}
          onChange={(v) => updateField('name', v)}
          placeholder="Supplier name"
          required
        />
        <AdminFormField
          label="Slug"
          name="slug"
          value={form.slug}
          onChange={(v) => updateField('slug', v)}
          placeholder="url-slug"
          required
        />
      </div>
      <div className="adm-form-row">
        <AdminFormField
          label="Contact Person"
          name="contactPerson"
          value={form.contactPerson}
          onChange={(v) => updateField('contactPerson', v)}
          placeholder="Primary contact"
        />
        <AdminFormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(v) => updateField('email', v)}
          placeholder="email@example.com"
        />
      </div>
      <div className="adm-form-row">
        <AdminFormField
          label="Phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={(v) => updateField('phone', v)}
          placeholder="+250 788 000 000"
        />
        <AdminFormField
          label="Website"
          name="website"
          type="url"
          value={form.website}
          onChange={(v) => updateField('website', v)}
          placeholder="https://..."
        />
      </div>
      <div className="adm-form-row">
        <AdminFormField
          label="Address"
          name="address"
          value={form.address}
          onChange={(v) => updateField('address', v)}
          placeholder="Street address"
        />
      </div>
      <div className="adm-form-row">
        <AdminFormField
          label="City"
          name="city"
          value={form.city}
          onChange={(v) => updateField('city', v)}
          placeholder="City"
        />
        <AdminFormField
          label="Country"
          name="country"
          value={form.country}
          onChange={(v) => updateField('country', v)}
          placeholder="Country"
        />
      </div>
      <div className="adm-form-row">
        <AdminFormField
          label="Notes"
          name="notes"
          type="textarea"
          value={form.notes}
          onChange={(v) => updateField('notes', v)}
          placeholder="Internal notes"
        />
      </div>
      <div className="adm-form-row">
        <AdminFormField
          label="Status"
          name="isActive"
          type="select"
          value={form.isActive}
          onChange={(v) => updateField('isActive', v)}
          options={[
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
        />
      </div>
    </div>
  )
}

function AdminSuppliers() {
  const { data: response, isLoading, isError, error } = useSuppliers()
  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()
  const deleteMutation = useDeleteSupplier()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Supplier | null>(null)
  const [form, setForm] = useState<SupplierFormState>(defaultForm)
  const [search, setSearch] = useState('')

  const suppliers = response?.data ?? []
  const total = suppliers.length
  const activeCount = suppliers.filter((s) => s.isActive).length
  const countryCount = new Set(suppliers.map((s) => s.country).filter(Boolean)).size

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers
    const q = search.toLowerCase()
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.email?.toLowerCase().includes(q)) ||
        (s.contactPerson?.toLowerCase().includes(q)) ||
        (s.country?.toLowerCase().includes(q)) ||
        (s.city?.toLowerCase().includes(q))
    )
  }, [suppliers, search])

  const updateField = (key: keyof SupplierFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'name') {
      setForm((prev) => ({ ...prev, slug: slugFromName(value) || prev.slug }))
    }
  }

  const openCreate = () => {
    setForm(defaultForm)
    setCreateOpen(true)
  }

  const openEdit = (s: Supplier) => {
    setSelected(s)
    setForm({
      name: s.name,
      slug: s.slug,
      contactPerson: s.contactPerson ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      address: s.address ?? '',
      city: s.city ?? '',
      country: s.country ?? '',
      website: s.website ?? '',
      notes: s.notes ?? '',
      isActive: s.isActive ? 'true' : 'false',
    })
    setEditOpen(true)
  }

  const openDelete = (s: Supplier) => {
    setSelected(s)
    setDeleteOpen(true)
  }

  const closeModals = () => {
    setCreateOpen(false)
    setEditOpen(false)
    setDeleteOpen(false)
    setSelected(null)
  }

  const handleCreate = () => {
    createMutation.mutate(
      {
        name: form.name,
        slug: form.slug,
        contactPerson: form.contactPerson || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        website: form.website || undefined,
        notes: form.notes || undefined,
        isActive: form.isActive === 'true',
      },
      { onSuccess: () => closeModals() }
    )
  }

  const handleUpdate = () => {
    if (!selected) return
    updateMutation.mutate(
      {
        id: selected.id,
        data: {
          name: form.name,
          slug: form.slug,
          contactPerson: form.contactPerson || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          country: form.country || undefined,
          website: form.website || undefined,
          notes: form.notes || undefined,
          isActive: form.isActive === 'true',
        },
      },
      { onSuccess: () => closeModals() }
    )
  }

  const handleDelete = () => {
    if (!selected) return
    deleteMutation.mutate(selected.id, { onSuccess: () => closeModals() })
  }

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Suppliers</h1>
          <p className="adm-page-subtitle">Procurement network &amp; vendor management</p>
        </div>
        <button type="button" className="adm-btn adm-btn--accent" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Add Supplier
        </button>
      </div>

      <div className="adm-stat-row">
        <div className="adm-stat-card">
          <div className="adm-stat-card-top">
            <span className="adm-stat-label">Total Suppliers</span>
            <Truck size={16} aria-hidden="true" className="adm-stat-icon" />
          </div>
          <span className="adm-stat-value">{total}</span>
          <span className="adm-stat-sub">{activeCount} Active</span>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-card-top">
            <span className="adm-stat-label">Active</span>
            <Truck size={16} aria-hidden="true" className="adm-stat-icon" />
          </div>
          <span className="adm-stat-value">{activeCount}</span>
          <span className="adm-stat-sub">Vendors</span>
        </div>
        <div className="adm-stat-card adm-stat-card--dark">
          <div className="adm-stat-card-top">
            <span className="adm-stat-label">Countries</span>
            <Globe size={16} aria-hidden="true" className="adm-stat-icon" />
          </div>
          <span className="adm-stat-value">{countryCount}</span>
          <span className="adm-stat-sub">Supply origins</span>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-toolbar">
          <h2 className="adm-panel-title">Supplier Directory</h2>
          <div className="adm-toolbar-search">
            <Search size={14} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search suppliers..."
              className="adm-toolbar-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="adm-skeleton">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="adm-skeleton-row" />
            ))}
          </div>
        ) : isError ? (
          <div className="adm-empty">
            <span className="adm-empty-icon" aria-hidden="true">
              !
            </span>
            <p className="adm-empty-text">{error?.message ?? 'Failed to load suppliers'}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            <span className="adm-empty-icon" aria-hidden="true">
              —
            </span>
            <p className="adm-empty-text">
              {search ? 'No suppliers match your search.' : 'No suppliers yet.'}
            </p>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--stack">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td data-label="ID" className="adm-cell-mono">{s.id}</td>
                    <td data-label="Supplier">
                      <div>{s.name}</div>
                      <div className="adm-cell-sub">{s.email ?? '—'}</div>
                    </td>
                    <td data-label="Contact">
                      <div>{s.contactPerson ?? '—'}</div>
                      <div className="adm-cell-sub">{s.phone ?? '—'}</div>
                    </td>
                    <td data-label="Location">
                      {[s.city, s.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td data-label="Status">
                      <span
                        className={`adm-badge ${s.isActive ? 'adm-badge--success' : 'adm-badge--danger'}`}
                      >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td data-label="Action">
                      <ActionMenu>
                        <ActionMenuItem onClick={() => openEdit(s)}>Edit</ActionMenuItem>
                        <ActionMenuItem onClick={() => openDelete(s)} variant="danger">
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

      <AdminModal open={createOpen} onClose={closeModals} title="Add Supplier" size="lg">
        <SupplierForm form={form} updateField={updateField} />
        <div className="adm-form-actions">
          <button type="button" className="adm-btn adm-btn--outline" onClick={closeModals}>
            Cancel
          </button>
          <button
            type="button"
            className="adm-btn adm-btn--accent"
            onClick={handleCreate}
            disabled={createMutation.isPending || !form.name || !form.slug}
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      </AdminModal>

      <AdminModal open={editOpen} onClose={closeModals} title="Edit Supplier" size="lg">
        <SupplierForm form={form} updateField={updateField} />
        <div className="adm-form-actions">
          <button type="button" className="adm-btn adm-btn--outline" onClick={closeModals}>
            Cancel
          </button>
          <button
            type="button"
            className="adm-btn adm-btn--accent"
            onClick={handleUpdate}
            disabled={updateMutation.isPending || !form.name || !form.slug}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </AdminModal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={closeModals}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message={
          selected
            ? `Are you sure you want to delete "${selected.name}"? This cannot be undone.`
            : ''
        }
        loading={deleteMutation.isPending}
      />
    </>
  )
}
