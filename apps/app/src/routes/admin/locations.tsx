import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { MapPin, Package, Plus, Warehouse } from 'lucide-react'
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '../../lib/admin-queries'
import AdminModal from '../../components/admin/AdminModal'
import AdminFormField from '../../components/admin/AdminFormField'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import ActionMenu from '../../components/admin/ActionMenu'
import ActionMenuItem from '../../components/admin/ActionMenuItem'

export const Route = createFileRoute('/admin/locations')({
  component: AdminLocations,
})

const emptyForm = {
  name: '',
  address: '',
  landmark: '',
  mobile: '',
  email: '',
  website: '',
  isActive: 'true',
}

function AdminLocations() {
  const { data: res, isLoading, error } = useLocations()
  const locations = res?.data ?? []
  const createLocation = useCreateLocation()
  const updateLocation = useUpdateLocation()
  const deleteLocation = useDeleteLocation()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [form, setForm] = useState(emptyForm)

  const activeCount = locations.filter((l) => l.isActive).length

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (loc: (typeof locations)[0]) => {
    setEditingId(loc.id)
    setForm({
      name: loc.name,
      address: loc.address ?? '',
      landmark: loc.landmark ?? '',
      mobile: loc.mobile ?? '',
      email: loc.email ?? '',
      website: loc.website ?? '',
      isActive: loc.isActive ? 'true' : 'false',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      address: form.address || undefined,
      landmark: form.landmark || undefined,
      mobile: form.mobile || undefined,
      email: form.email || undefined,
      website: form.website || undefined,
      isActive: form.isActive === 'true',
    }
    if (editingId) {
      updateLocation.mutate(
        { id: editingId, data: payload },
        { onSuccess: closeModal }
      )
    } else {
      createLocation.mutate(payload, { onSuccess: closeModal })
    }
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteLocation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const formatAddress = (loc: (typeof locations)[0]) => {
    const parts = [loc.address, loc.landmark].filter(Boolean)
    return parts.length ? parts.join(' · ') : 'No address'
  }

  if (error) {
    return (
      <div className="adm-panel">
        <div className="adm-empty">
          <Package size={40} className="adm-empty-icon" aria-hidden="true" />
          <p className="adm-empty-text">Failed to load locations</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Warehouse Locations</h1>
          <p className="adm-page-subtitle">
            Storage facilities &amp; distribution points
          </p>
        </div>
        <button
          type="button"
          className="adm-btn adm-btn--accent"
          onClick={openCreate}
        >
          <Plus size={16} aria-hidden="true" />
          Add Location
        </button>
      </div>

      <div className="adm-stat-row">
        <div className="adm-stat-card">
          <div className="adm-stat-card-top">
            <span className="adm-stat-label">Locations</span>
            <Warehouse size={16} aria-hidden="true" className="adm-stat-icon" />
          </div>
          <span className="adm-stat-value">
            {isLoading ? '—' : locations.length}
          </span>
          <span className="adm-stat-sub">{activeCount} Active</span>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-card-top">
            <span className="adm-stat-label">Active</span>
            <Package size={16} aria-hidden="true" className="adm-stat-icon" />
          </div>
          <span className="adm-stat-value">
            {isLoading ? '—' : activeCount}
          </span>
          <span className="adm-stat-sub">Active locations</span>
        </div>
      </div>

      {isLoading ? (
        <div className="adm-loc-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="adm-panel" style={{ marginBottom: 0 }}>
              <div className="adm-skeleton">
                <span className="adm-skeleton-row" />
                <span className="adm-skeleton-row" />
                <span className="adm-skeleton-row" />
                <span className="adm-skeleton-row" />
              </div>
            </div>
          ))}
        </div>
      ) : locations.length === 0 ? (
        <div className="adm-panel">
          <div className="adm-empty">
            <Warehouse size={48} className="adm-empty-icon" aria-hidden="true" />
            <p className="adm-empty-text">No locations yet</p>
            <button
              type="button"
              className="adm-btn adm-btn--accent"
              onClick={openCreate}
            >
              <Plus size={16} aria-hidden="true" />
              Add Location
            </button>
          </div>
        </div>
      ) : (
        <div className="adm-loc-grid">
          {locations.map((loc) => (
            <div key={loc.id} className="adm-panel" style={{ marginBottom: 0 }}>
              <div className="adm-loc-card-header">
                <div>
                  <h3 className="adm-loc-card-title">{loc.name}</h3>
                  <p className="adm-loc-card-addr">
                    <MapPin size={12} aria-hidden="true" />
                    {formatAddress(loc)}
                  </p>
                </div>
                <span
                  className={`adm-badge ${loc.isActive ? 'adm-badge--success' : 'adm-badge--danger'}`}
                >
                  {loc.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="adm-loc-card-footer">
                <span className="adm-cell-mono">{loc.id}</span>
                <ActionMenu>
                  <ActionMenuItem onClick={() => openEdit(loc)}>
                    Edit
                  </ActionMenuItem>
                  <ActionMenuItem
                    variant="danger"
                    onClick={() =>
                      setDeleteTarget({ id: loc.id, name: loc.name })
                    }
                  >
                    Delete
                  </ActionMenuItem>
                </ActionMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Location' : 'Add Location'}
        size="lg"
      >
        <form className="adm-form" onSubmit={handleSubmit}>
          <AdminFormField
            label="Name"
            name="name"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            required
          />
          <AdminFormField
            label="Address"
            name="address"
            value={form.address}
            onChange={(v) => setForm((f) => ({ ...f, address: v }))}
            placeholder="Street, building, etc."
          />
          <AdminFormField
            label="Landmark"
            name="landmark"
            value={form.landmark}
            onChange={(v) => setForm((f) => ({ ...f, landmark: v }))}
            placeholder="Nearby landmark"
          />
          <div className="adm-form-row">
            <AdminFormField
              label="Mobile"
              name="mobile"
              type="tel"
              value={form.mobile}
              onChange={(v) => setForm((f) => ({ ...f, mobile: v }))}
            />
            <AdminFormField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            />
          </div>
          <AdminFormField
            label="Website"
            name="website"
            type="url"
            value={form.website}
            onChange={(v) => setForm((f) => ({ ...f, website: v }))}
            placeholder="https://"
          />
          <AdminFormField
            label="Status"
            name="isActive"
            type="select"
            value={form.isActive}
            onChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
          />
          <div className="adm-form-actions">
            <button
              type="button"
              className="adm-btn adm-btn--outline"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="adm-btn adm-btn--accent"
              disabled={
                createLocation.isPending || updateLocation.isPending
              }
            >
              {createLocation.isPending || updateLocation.isPending
                ? 'Saving...'
                : editingId
                  ? 'Update'
                  : 'Create'}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Location"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ''
        }
        loading={deleteLocation.isPending}
      />
    </>
  )
}
