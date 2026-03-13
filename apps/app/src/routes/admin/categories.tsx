import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Plus, Tags, FolderTree } from 'lucide-react'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../lib/admin-queries'
import AdminModal from '../../components/admin/AdminModal'
import AdminFormField from '../../components/admin/AdminFormField'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import ActionMenu from '../../components/admin/ActionMenu'
import ActionMenuItem from '../../components/admin/ActionMenuItem'
import type { Category } from '@repo/sdk'

export const Route = createFileRoute('/admin/categories')({
  component: AdminCategories,
})

type CategoryFormState = {
  name: string
  slug: string
  description: string
  parentId: string
  sortOrder: string
  isActive: string
}

const emptyForm: CategoryFormState = {
  name: '',
  slug: '',
  description: '',
  parentId: '',
  sortOrder: '',
  isActive: 'true',
}

function slugFromName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function AdminCategories() {
  const { data: res, isLoading, error } = useCategories()
  const categories = res?.data ?? []
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [form, setForm] = useState<CategoryFormState>(emptyForm)

  const activeCount = categories.filter((c) => c.isActive).length

  const parentOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [{ value: '', label: 'None (root)' }]
    const excludeId = editingId ?? ''
    categories
      .filter((c) => c.id !== excludeId)
      .forEach((c) => options.push({ value: c.id, label: c.name }))
    return options
  }, [categories, editingId])

  const getParentName = (parentId: string | null) => {
    if (!parentId) return null
    return categories.find((c) => c.id === parentId)?.name ?? parentId
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      parentId: cat.parentId ?? '',
      sortOrder: cat.sortOrder != null ? String(cat.sortOrder) : '',
      isActive: cat.isActive ? 'true' : 'false',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const updateField = (key: keyof CategoryFormState, value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value }
      if (key === 'name') {
        next.slug = slugFromName(value)
      }
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      parentId: form.parentId || undefined,
      sortOrder: form.sortOrder ? parseInt(form.sortOrder, 10) : undefined,
      isActive: form.isActive === 'true',
    }
    if (editingId) {
      updateCategory.mutate(
        { id: editingId, data: payload },
        { onSuccess: closeModal }
      )
    } else {
      createCategory.mutate(payload, { onSuccess: closeModal })
    }
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  if (error) {
    return (
      <div className="adm-panel">
        <div className="adm-empty">
          <Tags size={40} className="adm-empty-icon" aria-hidden="true" />
          <p className="adm-empty-text">Failed to load categories</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Product Categories</h1>
          <p className="adm-page-subtitle">
            Organize products with hierarchical categories
          </p>
        </div>
        <button
          type="button"
          className="adm-btn adm-btn--accent"
          onClick={openCreate}
        >
          <Plus size={16} aria-hidden="true" />
          Add Category
        </button>
      </div>

      <div className="adm-stat-row">
        <div className="adm-stat-card">
          <div className="adm-stat-card-top">
            <span className="adm-stat-label">Categories</span>
            <FolderTree size={16} aria-hidden="true" className="adm-stat-icon" />
          </div>
          <span className="adm-stat-value">
            {isLoading ? '—' : categories.length}
          </span>
          <span className="adm-stat-sub">{activeCount} Active</span>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-card-top">
            <span className="adm-stat-label">Active</span>
            <Tags size={16} aria-hidden="true" className="adm-stat-icon" />
          </div>
          <span className="adm-stat-value">
            {isLoading ? '—' : activeCount}
          </span>
          <span className="adm-stat-sub">Active categories</span>
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
      ) : categories.length === 0 ? (
        <div className="adm-panel">
          <div className="adm-empty">
            <FolderTree size={48} className="adm-empty-icon" aria-hidden="true" />
            <p className="adm-empty-text">No categories yet</p>
            <button
              type="button"
              className="adm-btn adm-btn--accent"
              onClick={openCreate}
            >
              <Plus size={16} aria-hidden="true" />
              Add Category
            </button>
          </div>
        </div>
      ) : (
        <div className="adm-loc-grid">
          {categories.map((cat) => (
            <div key={cat.id} className="adm-panel" style={{ marginBottom: 0 }}>
              <div className="adm-loc-card-header">
                <div>
                  <h3 className="adm-loc-card-title">{cat.name}</h3>
                  <p className="adm-loc-card-addr">
                    /{cat.slug}
                    {getParentName(cat.parentId) && (
                      <> · Parent: {getParentName(cat.parentId)}</>
                    )}
                  </p>
                </div>
                <span
                  className={`adm-badge ${cat.isActive ? 'adm-badge--success' : 'adm-badge--danger'}`}
                >
                  {cat.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="adm-loc-card-footer">
                <span className="adm-cell-mono">{cat.id}</span>
                <ActionMenu>
                  <ActionMenuItem onClick={() => openEdit(cat)}>
                    Edit
                  </ActionMenuItem>
                  <ActionMenuItem
                    variant="danger"
                    onClick={() =>
                      setDeleteTarget({ id: cat.id, name: cat.name })
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
        title={editingId ? 'Edit Category' : 'Add Category'}
        size="lg"
      >
        <form className="adm-form" onSubmit={handleSubmit}>
          <div className="adm-form-row">
            <AdminFormField
              label="Name"
              name="name"
              value={form.name}
              onChange={(v) => updateField('name', v)}
              placeholder="Category name"
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
          <AdminFormField
            label="Description"
            name="description"
            type="textarea"
            value={form.description}
            onChange={(v) => updateField('description', v)}
            placeholder="Optional description"
          />
          <div className="adm-form-row">
            <AdminFormField
              label="Parent Category"
              name="parentId"
              type="select"
              value={form.parentId}
              onChange={(v) => updateField('parentId', v)}
              options={parentOptions}
            />
            <AdminFormField
              label="Sort Order"
              name="sortOrder"
              type="number"
              value={form.sortOrder}
              onChange={(v) => updateField('sortOrder', v)}
              placeholder="0"
            />
          </div>
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
                createCategory.isPending || updateCategory.isPending
              }
            >
              {createCategory.isPending || updateCategory.isPending
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
        title="Delete Category"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ''
        }
        loading={deleteCategory.isPending}
      />
    </>
  )
}
