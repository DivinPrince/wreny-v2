import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ImagePlus, Link2, Package, PackageOpen, Plus, Search, Unlink, X } from 'lucide-react'
import {
  useAddCompatibility,
  useEquipment,
  useProductEquipment,
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCategories,
  useRemoveCompatibility,
} from '../../lib/admin-queries'
import type { Equipment, ProductWithDetails } from '@repo/sdk'
import { api } from '../../lib/api'
import AdminModal from '../../components/admin/AdminModal'
import AdminFormField from '../../components/admin/AdminFormField'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import ActionMenu from '../../components/admin/ActionMenu'
import ActionMenuItem from '../../components/admin/ActionMenuItem'
import Pagination from '../../components/admin/Pagination'
import { toast } from '../../components/admin/Toast'

export const Route = createFileRoute('/admin/products')({
  component: AdminProducts,
  validateSearch: (search: Record<string, unknown>) => ({
    search: typeof search.search === 'string' && search.search.trim() ? search.search : undefined,
  }),
})

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'aftermarket', label: 'Aftermarket' },
]

const conditionClass: Record<string, string> = {
  new: 'adm-badge--success',
  refurbished: 'adm-badge--warn',
  used: 'adm-badge--warn',
  aftermarket: 'adm-badge--info',
}

function formatCondition(c: string) {
  return c.charAt(0).toUpperCase() + c.slice(1)
}

function formatRWF(n: number) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatEquipmentLabel(equipment: Equipment) {
  const base = `${equipment.make} ${equipment.model}`
  if (equipment.yearFrom != null && equipment.yearTo != null) {
    return `${base} (${equipment.yearFrom}-${equipment.yearTo})`
  }
  if (equipment.yearFrom != null) {
    return `${base} (${equipment.yearFrom}+)`
  }
  if (equipment.yearTo != null) {
    return `${base} (Up to ${equipment.yearTo})`
  }
  return base
}

function formatEquipmentMeta(equipment: Equipment) {
  const parts: string[] = [equipment.type]
  if (equipment.engineType) {
    parts.push(equipment.engineType)
  }
  return parts.join(' / ')
}

function ProductCompatibilityManager({ productId }: { productId: string }) {
  const { data, isLoading, isError, error } = useProductEquipment(productId)
  const { data: equipmentRes, isLoading: equipmentLoading } = useEquipment({ isActive: 'true' })
  const addCompatibility = useAddCompatibility()
  const removeCompatibility = useRemoveCompatibility()
  const [equipmentId, setEquipmentId] = useState('')
  const [notes, setNotes] = useState('')

  const linkedEquipment = data?.data ?? []
  const allEquipment = equipmentRes?.data ?? []
  const linkedIds = new Set(linkedEquipment.map((entry) => entry.equipment.id))
  const availableEquipment = allEquipment.filter((entry) => !linkedIds.has(entry.id))

  return (
    <section className="adm-compat-section">
      <div className="adm-compat-header">
        <div>
          <h3 className="adm-panel-title">Compatible Equipment</h3>
          <p className="adm-compat-copy">
            Link this part to the vehicles, generators, or machines it fits.
          </p>
        </div>
        <span className="adm-badge adm-badge--info adm-badge--sm">
          {linkedEquipment.length} linked
        </span>
      </div>

      {isLoading && (
        <div className="adm-compat-empty">
          <p className="adm-empty-text">Loading compatibility...</p>
        </div>
      )}

      {isError && (
        <div className="adm-compat-empty">
          <p className="adm-empty-text">{error?.message ?? 'Failed to load compatibility'}</p>
        </div>
      )}

      {!isLoading && !isError && linkedEquipment.length === 0 && (
        <div className="adm-compat-empty">
          <p className="adm-empty-text">No equipment linked yet</p>
        </div>
      )}

      {!isLoading && !isError && linkedEquipment.length > 0 && (
        <div className="adm-compat-list">
          {linkedEquipment.map((entry) => (
            <div key={entry.compatibility.id} className="adm-compat-item">
              <div className="adm-compat-item-main">
                <div className="adm-compat-title-row">
                  <strong>{formatEquipmentLabel(entry.equipment)}</strong>
                  <span className="adm-badge adm-badge--info adm-badge--sm">
                    {entry.equipment.type}
                  </span>
                </div>
                <p className="adm-compat-meta">{formatEquipmentMeta(entry.equipment)}</p>
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
                    productId,
                    equipmentId: entry.equipment.id,
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
            label="Equipment"
            name={`equipmentId-${productId}`}
            type="select"
            value={equipmentId}
            onChange={setEquipmentId}
            placeholder={equipmentLoading ? 'Loading equipment...' : 'Select equipment'}
            options={availableEquipment.map((entry) => ({
              value: entry.id,
              label: formatEquipmentLabel(entry),
            }))}
          />
          <AdminFormField
            label="Fitment notes"
            name={`compatibility-notes-${productId}`}
            value={notes}
            onChange={setNotes}
            placeholder="Optional notes"
          />
        </div>
        <div className="adm-form-actions adm-form-actions--split">
          <p className="adm-compat-copy">
            {availableEquipment.length === 0
              ? 'All active equipment entries are already linked.'
              : 'Use notes for fitment details like engine variant or year-specific remarks.'}
          </p>
          <button
            type="button"
            className="adm-btn adm-btn--accent"
            disabled={!equipmentId || addCompatibility.isPending}
            onClick={() =>
              addCompatibility.mutate(
                {
                  productId,
                  equipmentId,
                  notes: notes.trim() || undefined,
                },
                {
                  onSuccess: () => {
                    setEquipmentId('')
                    setNotes('')
                  },
                },
              )
            }
          >
            <Link2 size={14} aria-hidden="true" />
            {addCompatibility.isPending ? 'Linking...' : 'Link Equipment'}
          </button>
        </div>
      </div>
    </section>
  )
}

function ProductImagesField({
  images,
  onChange,
}: {
  images: string[]
  onChange: (images: string[]) => void
}) {
  const inputId = useId()
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploadedUrls: string[] = []

      for (const file of files) {
        const result = await api.upload.put(file, { folder: 'products' })
        uploadedUrls.push(result.data.url)
      }

      return uploadedUrls
    },
    onSuccess: (uploadedUrls) => {
      onChange([...images, ...uploadedUrls])
      toast.success(uploadedUrls.length === 1 ? 'Image uploaded' : 'Images uploaded')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to upload images')
    },
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    uploadMutation.mutate(files)
    event.target.value = ''
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, imageIndex) => imageIndex !== index))
  }

  const setPrimaryImage = (index: number) => {
    if (index === 0) return

    const nextImages = [...images]
    const [selectedImage] = nextImages.splice(index, 1)
    nextImages.unshift(selectedImage)
    onChange(nextImages)
  }

  return (
    <section className="adm-image-section">
      <div className="adm-compat-header">
        <div>
          <h3 className="adm-panel-title">Product Images</h3>
          <p className="adm-compat-copy">
            Upload product photos for the storefront. The first image is used as the cover image.
          </p>
        </div>
        <span className="adm-badge adm-badge--info adm-badge--sm">
          {images.length} image{images.length === 1 ? '' : 's'}
        </span>
      </div>

      <label className="adm-image-upload" htmlFor={inputId}>
        <span className="adm-btn adm-btn--accent adm-btn--sm">
          <ImagePlus size={14} aria-hidden="true" />
          {uploadMutation.isPending ? 'Uploading...' : 'Upload images'}
        </span>
        <span className="adm-image-upload-copy">
          JPG, PNG, WebP, GIF, or SVG up to 10MB each.
        </span>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          multiple
          className="adm-image-upload-input"
          onChange={handleFileChange}
          disabled={uploadMutation.isPending}
        />
      </label>

      {images.length === 0 ? (
        <div className="adm-compat-empty">
          <p className="adm-empty-text">No product images added yet</p>
        </div>
      ) : (
        <div className="adm-image-grid">
          {images.map((imageUrl, index) => (
            <article key={imageUrl} className="adm-image-card">
              <div className="adm-image-preview-wrap">
                <img
                  src={imageUrl}
                  alt={`Product image ${index + 1}`}
                  className="adm-image-preview"
                />
                {index === 0 && <span className="adm-image-cover-badge">Cover</span>}
              </div>
              <div className="adm-image-actions">
                <button
                  type="button"
                  className="adm-btn adm-btn--outline adm-btn--sm"
                  onClick={() => setPrimaryImage(index)}
                  disabled={index === 0}
                >
                  Set as cover
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn--outline adm-btn--sm"
                  onClick={() => removeImage(index)}
                >
                  <X size={14} aria-hidden="true" />
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

type FormState = {
  name: string
  slug: string
  partNumber: string
  sku: string
  basePrice: string
  condition: string
  description: string
  categoryId: string
  images: string[]
}

const emptyForm: FormState = {
  name: '',
  slug: '',
  partNumber: '',
  sku: '',
  basePrice: '',
  condition: 'new',
  description: '',
  categoryId: '',
  images: [],
}

function productToForm(p: ProductWithDetails): FormState {
  return {
    name: p.name,
    slug: p.slug,
    partNumber: p.partNumber,
    sku: p.sku ?? '',
    basePrice: String(p.price ?? 0),
    condition: p.condition ?? 'new',
    description: p.description ?? '',
    categoryId: p.category?.id ?? '',
    images: p.images ?? [],
  }
}

function AdminProducts() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { search } = Route.useSearch()
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<ProductWithDetails | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<ProductWithDetails | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const trimmedSearch = (search ?? '').trim()

  const { data, isLoading, isError, error } = useProducts({
    limit: String(limit),
    offset: String(offset),
    ...(trimmedSearch ? { search: trimmedSearch } : {}),
  })
  const { data: categoriesRes } = useCategories({ isActive: 'true' })
  const categories = categoriesRes?.data ?? []
  const categoryOptions = [{ value: '', label: 'No category' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()

  const products = data?.data ?? []
  const meta = data?.meta ?? { total: 0, limit: 20, offset: 0, hasMore: false }

  const openCreate = () => {
    setForm(emptyForm)
    setCreateOpen(true)
  }

  const closeCreate = () => {
    setCreateOpen(false)
    setForm(emptyForm)
  }

  const openEdit = (p: ProductWithDetails) => {
    setForm(productToForm(p))
    setEditProduct(p)
  }

  const closeEdit = () => {
    setEditProduct(null)
    setForm(emptyForm)
  }

  const openDelete = (p: ProductWithDetails) => {
    setDeleteProduct(p)
  }

  const closeDelete = () => {
    setDeleteProduct(null)
  }

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreate = () => {
    const price = parseFloat(form.basePrice)
    if (Number.isNaN(price) || price < 0) return
    createMutation.mutate(
      {
        name: form.name,
        slug: form.slug,
        partNumber: form.partNumber,
        sku: form.sku || undefined,
        description: form.description || undefined,
        price,
        condition: form.condition as 'new' | 'used' | 'refurbished' | 'aftermarket',
        categoryId: form.categoryId || undefined,
        images: form.images,
      },
      { onSuccess: closeCreate }
    )
  }

  const handleUpdate = () => {
    if (!editProduct) return
    const price = parseFloat(form.basePrice)
    if (Number.isNaN(price) || price < 0) return
    updateMutation.mutate(
      {
        id: editProduct.id,
        data: {
          id: editProduct.id,
          name: form.name,
          slug: form.slug,
          partNumber: form.partNumber,
          sku: form.sku || undefined,
          description: form.description || undefined,
          price,
          condition: form.condition as 'new' | 'used' | 'refurbished' | 'aftermarket',
          categoryId: form.categoryId || undefined,
          images: form.images,
        },
      },
      { onSuccess: closeEdit }
    )
  }

  const handleDelete = () => {
    if (!deleteProduct) return
    deleteMutation.mutate(deleteProduct.id, { onSuccess: closeDelete })
  }

  const renderProductActions = (product: ProductWithDetails) => (
    <ActionMenu>
      <ActionMenuItem onClick={() => openEdit(product)}>Edit</ActionMenuItem>
      <ActionMenuItem onClick={() => openDelete(product)} variant="danger">
        Delete
      </ActionMenuItem>
    </ActionMenu>
  )

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Parts Catalog</h1>
          <p className="adm-page-subtitle">Spare parts inventory &amp; catalog management</p>
        </div>
        <button type="button" className="adm-btn adm-btn--accent" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Add New Part
        </button>
      </div>

      <div className="adm-panel">
        <div className="adm-toolbar">
          <button type="button" className="adm-btn adm-btn--accent adm-btn--sm">
            All Categories
          </button>
          <div className="adm-toolbar-search">
            <Search size={14} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by part number, name..."
              className="adm-toolbar-input"
              value={search ?? ''}
              onChange={(event) => {
                setOffset(0)
                const nextSearch = event.target.value
                navigate({
                  search: { search: nextSearch.trim() ? nextSearch : undefined },
                })
              }}
            />
          </div>
        </div>

        {isLoading && (
          <>
            <div className="adm-table-wrap adm-products-table">
              <table className="adm-table adm-desktop-table">
                <thead>
                  <tr>
                    <th>Part Number</th>
                    <th>Description</th>
                    <th>Total On Hand</th>
                    <th>Condition</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="adm-skeleton-row">
                      <td><span className="adm-skeleton" /></td>
                      <td><span className="adm-skeleton" /></td>
                      <td><span className="adm-skeleton" /></td>
                      <td><span className="adm-skeleton" /></td>
                      <td><span className="adm-skeleton" /></td>
                      <td><span className="adm-skeleton" /></td>
                      <td><span className="adm-skeleton" /></td>
                      <td><span className="adm-skeleton" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="adm-mobile-product-list">
              {Array.from({ length: 3 }).map((_, i) => (
                <article key={i} className="adm-mobile-product-card">
                  <div className="adm-mobile-product-card-top">
                    <span className="adm-badge adm-badge--info">
                      <span className="adm-skeleton" />
                    </span>
                    <span className="adm-skeleton" />
                  </div>
                  <div className="adm-mobile-product-title"><span className="adm-skeleton" /></div>
                  <div className="adm-mobile-product-meta"><span className="adm-skeleton" /></div>
                  <div className="adm-mobile-product-stats">
                    <div className="adm-mobile-product-stat"><span className="adm-skeleton" /></div>
                    <div className="adm-mobile-product-stat"><span className="adm-skeleton" /></div>
                    <div className="adm-mobile-product-stat"><span className="adm-skeleton" /></div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {isError && (
          <div className="adm-empty">
            <span className="adm-empty-icon" aria-hidden="true">!</span>
            <p className="adm-empty-text">{error?.message ?? 'Failed to load products'}</p>
          </div>
        )}

        {!isLoading && !isError && products.length === 0 && (
          <>
            <div className="adm-table-wrap adm-products-table">
              <table className="adm-table adm-desktop-table">
                <thead>
                  <tr>
                    <th>Part Number</th>
                    <th>Description</th>
                    <th>Total On Hand</th>
                    <th>Condition</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={8} className="adm-empty">
                      <Package size={32} className="adm-empty-icon" aria-hidden="true" />
                      <p className="adm-empty-text">
                        {trimmedSearch
                          ? 'No products matched that search.'
                          : 'No products yet. Add your first part to get started.'}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="adm-mobile-product-list">
              <div className="adm-empty adm-panel">
                <Package size={32} className="adm-empty-icon" aria-hidden="true" />
                <p className="adm-empty-text">
                  {trimmedSearch
                    ? 'No products matched that search.'
                    : 'No products yet. Add your first part to get started.'}
                </p>
              </div>
            </div>
          </>
        )}

        {!isLoading && !isError && products.length > 0 && (
          <>
            <div className="adm-table-wrap adm-products-table">
              <table className="adm-table adm-desktop-table">
                <thead>
                  <tr>
                    <th>Part Number</th>
                    <th>Description</th>
                    <th>Total On Hand</th>
                    <th>Condition</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="adm-cell-mono">{p.partNumber}</td>
                      <td>{p.name}</td>
                      <td className="adm-cell-mono">{p.stock ?? 0}</td>
                      <td>
                        <span className={`adm-badge ${conditionClass[p.condition] ?? ''}`}>
                          {formatCondition(p.condition)}
                        </span>
                      </td>
                      <td>{formatRWF(p.price ?? 0)}</td>
                      <td className="adm-cell-sub">{p.category?.name ?? '—'}</td>
                      <td className="adm-cell-sub">{p.brand?.name ?? '—'}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            to="/admin/inventory"
                            search={{ productId: p.id }}
                            className="adm-btn adm-btn--sm adm-btn--outline inline-flex items-center gap-1"
                          >
                            <PackageOpen size={14} aria-hidden="true" />
                            Manage inventory
                          </Link>
                          {renderProductActions(p)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="adm-mobile-product-list">
              {products.map((p) => (
                <article key={p.id} className="adm-mobile-product-card">
                  <div className="adm-mobile-product-card-top">
                    <span className="adm-mobile-product-code adm-cell-mono">{p.partNumber}</span>
                    {renderProductActions(p)}
                  </div>

                  <div className="adm-mobile-product-title">{p.name}</div>

                  <div className="adm-mobile-product-meta">
                    <span>{p.category?.name ?? 'No category'}</span>
                    <span>{p.brand?.name ?? 'No brand'}</span>
                  </div>

                  <div className="adm-mobile-product-stats">
                    <div className="adm-mobile-product-stat">
                      <span className="adm-mobile-product-stat-label">On hand</span>
                      <strong className="adm-cell-mono">{p.stock ?? 0}</strong>
                    </div>
                    <div className="adm-mobile-product-stat">
                      <span className="adm-mobile-product-stat-label">Condition</span>
                      <span className={`adm-badge ${conditionClass[p.condition] ?? ''}`}>
                        {formatCondition(p.condition)}
                      </span>
                    </div>
                    <div className="adm-mobile-product-stat">
                      <span className="adm-mobile-product-stat-label">Price</span>
                      <strong>{formatRWF(p.price ?? 0)}</strong>
                    </div>
                  </div>

                  <Link
                    to="/admin/inventory"
                    search={{ productId: p.id }}
                    className="adm-btn adm-btn--outline adm-btn--sm adm-mobile-product-link"
                  >
                    <PackageOpen size={14} aria-hidden="true" />
                    Manage inventory
                  </Link>
                </article>
              ))}
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

      <AdminModal open={createOpen} onClose={closeCreate} title="Add New Part" size="lg">
        <form
          className="adm-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleCreate()
          }}
        >
          <div className="adm-form-row">
            <AdminFormField
              label="Name"
              name="name"
              value={form.name}
              onChange={(v) => updateForm('name', v)}
              required
            />
            <AdminFormField
              label="Slug"
              name="slug"
              value={form.slug}
              onChange={(v) => updateForm('slug', v)}
              placeholder="url-friendly-slug"
              required
            />
          </div>
          <div className="adm-form-row">
            <AdminFormField
              label="Part Number"
              name="partNumber"
              value={form.partNumber}
              onChange={(v) => updateForm('partNumber', v)}
              required
            />
            <AdminFormField
              label="SKU"
              name="sku"
              value={form.sku}
              onChange={(v) => updateForm('sku', v)}
            />
          </div>
          <div className="adm-form-row">
            <AdminFormField
              label="Base Price"
              name="basePrice"
              type="number"
              value={form.basePrice}
              onChange={(v) => updateForm('basePrice', v)}
              required
            />
            <AdminFormField
              label="Condition"
              name="condition"
              type="select"
              value={form.condition}
              onChange={(v) => updateForm('condition', v)}
              options={CONDITION_OPTIONS}
            />
          </div>
          <AdminFormField
            label="Category"
            name="categoryId"
            type="select"
            value={form.categoryId}
            onChange={(v) => updateForm('categoryId', v)}
            options={categoryOptions}
          />
          <AdminFormField
            label="Description"
            name="description"
            type="textarea"
            value={form.description}
            onChange={(v) => updateForm('description', v)}
          />
          <ProductImagesField
            images={form.images}
            onChange={(images) => setForm((prev) => ({ ...prev, images }))}
          />
          <div className="adm-compat-empty">
            <p className="adm-empty-text">Create this part first to link equipment compatibility</p>
          </div>
          <div className="adm-form-actions">
            <button type="button" className="adm-btn adm-btn--outline" onClick={closeCreate}>
              Cancel
            </button>
            <button
              type="submit"
              className="adm-btn adm-btn--accent"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal open={!!editProduct} onClose={closeEdit} title="Edit Part" size="lg">
        {editProduct && (
          <form
            className="adm-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleUpdate()
            }}
          >
            <div className="adm-form-row">
              <AdminFormField
                label="Name"
                name="name"
                value={form.name}
                onChange={(v) => updateForm('name', v)}
                required
              />
              <AdminFormField
                label="Slug"
                name="slug"
                value={form.slug}
                onChange={(v) => updateForm('slug', v)}
                placeholder="url-friendly-slug"
                required
              />
            </div>
            <div className="adm-form-row">
              <AdminFormField
                label="Part Number"
                name="partNumber"
                value={form.partNumber}
                onChange={(v) => updateForm('partNumber', v)}
                required
              />
              <AdminFormField
                label="SKU"
                name="sku"
                value={form.sku}
                onChange={(v) => updateForm('sku', v)}
              />
            </div>
            <div className="adm-form-row">
              <AdminFormField
                label="Base Price"
                name="basePrice"
                type="number"
                value={form.basePrice}
                onChange={(v) => updateForm('basePrice', v)}
                required
              />
              <AdminFormField
                label="Condition"
                name="condition"
                type="select"
                value={form.condition}
                onChange={(v) => updateForm('condition', v)}
                options={CONDITION_OPTIONS}
              />
            </div>
            <AdminFormField
              label="Category"
              name="categoryId"
              type="select"
              value={form.categoryId}
              onChange={(v) => updateForm('categoryId', v)}
              options={categoryOptions}
            />
            <AdminFormField
              label="Description"
              name="description"
              type="textarea"
              value={form.description}
              onChange={(v) => updateForm('description', v)}
            />
            <ProductImagesField
              images={form.images}
              onChange={(images) => setForm((prev) => ({ ...prev, images }))}
            />
            <ProductCompatibilityManager key={editProduct.id} productId={editProduct.id} />
            <div className="adm-form-actions">
              <button type="button" className="adm-btn adm-btn--outline" onClick={closeEdit}>
                Cancel
              </button>
              <button
                type="submit"
                className="adm-btn adm-btn--accent"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      <ConfirmDialog
        open={!!deleteProduct}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Delete Part"
        message={
          deleteProduct
            ? `Are you sure you want to delete "${deleteProduct.name}"? This action cannot be undone.`
            : ''
        }
        loading={deleteMutation.isPending}
      />
    </>
  )
}
