import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Check, Plus, Search, X } from 'lucide-react'
import { useCreateUser, useUpdateUser, useUsers } from '../../lib/admin-queries'
import type { User as UserType } from '@repo/sdk'
import ActionMenu from '../../components/admin/ActionMenu'
import ActionMenuItem from '../../components/admin/ActionMenuItem'
import AdminFormField from '../../components/admin/AdminFormField'
import AdminModal from '../../components/admin/AdminModal'

export const Route = createFileRoute('/admin/users')({
  component: AdminUsers,
})

const roleClass: Record<string, string> = {
  admin: 'adm-badge--accent',
  user: 'adm-badge--info',
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString()
}

function getInitial(u: UserType): string {
  return (u.name || u.email || '?').charAt(0).toUpperCase()
}

type Role = 'admin' | 'user'

type CreateFormState = {
  name: string
  email: string
  password: string
  phone: string
  role: Role
}

type EditFormState = {
  name: string
  phone: string
  role: Role
}

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
]

const emptyCreateForm: CreateFormState = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'user',
}

const emptyEditForm: EditFormState = {
  name: '',
  phone: '',
  role: 'user',
}

function userToEditForm(user: UserType): EditFormState {
  return {
    name: user.name ?? '',
    phone: user.phone ?? '',
    role: (user.role === 'admin' ? 'admin' : 'user'),
  }
}

function AdminUsers() {
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserType | null>(null)
  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm)
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm)

  const params = {
    ...(search && { search }),
    ...(roleFilter !== 'all' && { role: roleFilter }),
  }
  const { data, isLoading, isError, error } = useUsers(Object.keys(params).length ? params : undefined)
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const users = data?.data ?? []

  const updateCreateForm = (field: keyof CreateFormState, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateEditForm = (field: keyof EditFormState, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: field === 'role' ? (value as Role) : value,
    }))
  }

  const openCreate = () => {
    setCreateForm(emptyCreateForm)
    setCreateOpen(true)
  }

  const closeCreate = () => {
    setCreateOpen(false)
    setCreateForm(emptyCreateForm)
  }

  const openEdit = (user: UserType) => {
    setEditUser(user)
    setEditForm(userToEditForm(user))
  }

  const closeEdit = () => {
    setEditUser(null)
    setEditForm(emptyEditForm)
  }

  const handleCreate = () => {
    createUserMutation.mutate(
      {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        phone: createForm.phone.trim() || undefined,
        role: createForm.role,
      },
      { onSuccess: closeCreate },
    )
  }

  const handleUpdate = () => {
    if (!editUser) return
    updateUserMutation.mutate(
      {
        id: editUser.id,
        data: {
          name: editForm.name.trim(),
          phone: editForm.phone.trim() || undefined,
          role: editForm.role,
        },
      },
      { onSuccess: closeEdit },
    )
  }

  const renderUserActions = (user: UserType) => (
    <ActionMenu>
      <ActionMenuItem onClick={() => openEdit(user)}>Edit user</ActionMenuItem>
    </ActionMenu>
  )

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Users &amp; Roles</h1>
          <p className="adm-page-subtitle">Access control &amp; identity management</p>
        </div>
        <button type="button" className="adm-btn adm-btn--accent" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Add User
        </button>
      </div>

      <div className="adm-panel">
        <div className="adm-toolbar">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`adm-btn adm-btn--sm ${roleFilter === 'all' ? 'adm-btn--accent' : 'adm-btn--outline'}`}
              onClick={() => setRoleFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`adm-btn adm-btn--sm ${roleFilter === 'admin' ? 'adm-btn--accent' : 'adm-btn--outline'}`}
              onClick={() => setRoleFilter('admin')}
            >
              Admin
            </button>
            <button
              type="button"
              className={`adm-btn adm-btn--sm ${roleFilter === 'user' ? 'adm-btn--accent' : 'adm-btn--outline'}`}
              onClick={() => setRoleFilter('user')}
            >
              User
            </button>
          </div>
          <div className="adm-toolbar-search">
            <Search size={14} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by name, email..."
              className="adm-toolbar-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--stack">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Email Verified</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="adm-skeleton-row">
                    <td data-label="User"><span className="adm-skeleton" /></td>
                    <td data-label="Role"><span className="adm-skeleton" /></td>
                    <td data-label="Email verified"><span className="adm-skeleton" /></td>
                    <td data-label="Phone"><span className="adm-skeleton" /></td>
                    <td data-label="Joined"><span className="adm-skeleton" /></td>
                    <td data-label="Action"><span className="adm-skeleton" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : isError ? (
          <div className="adm-empty">
            <span className="adm-empty-icon" aria-hidden="true">
              !
            </span>
            <p className="adm-empty-text">{error?.message ?? 'Failed to load users'}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="adm-empty">
            <span className="adm-empty-icon" aria-hidden="true">—</span>
            <p className="adm-empty-text">
              {search || roleFilter !== 'all' ? 'No users match your filters.' : 'No users yet.'}
            </p>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--stack">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Email Verified</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td data-label="User">
                      <div className="adm-user-primary">
                        <div className="adm-user-identity">
                          <span className="adm-avatar">
                            {u.image ? (
                              <img
                                src={u.image}
                                alt=""
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  borderRadius: '999px',
                                }}
                              />
                            ) : (
                              getInitial(u)
                            )}
                          </span>
                          <div className="adm-user-copy">
                            <div className="adm-user-name">{u.name}</div>
                            <div className="adm-cell-sub adm-cell-mono">{u.email}</div>
                          </div>
                        </div>
                        <div className="adm-user-inline-action">
                          {renderUserActions(u)}
                        </div>
                      </div>
                    </td>
                    <td data-label="Role">
                      <span className={`adm-badge ${roleClass[u.role] ?? 'adm-badge--info'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td data-label="Email verified">
                      {u.emailVerified ? (
                        <span className="adm-badge adm-badge--success">
                          <Check size={12} aria-hidden="true" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="adm-badge adm-badge--danger">
                          <X size={12} aria-hidden="true" />
                          <span>Unverified</span>
                        </span>
                      )}
                    </td>
                    <td data-label="Phone" className="adm-cell-mono">{u.phone ?? '—'}</td>
                    <td data-label="Joined">{formatDate(u.createdAt)}</td>
                    <td data-label="Action" className="adm-user-actions">
                      {renderUserActions(u)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminModal open={createOpen} onClose={closeCreate} title="Create User" size="sm">
        <form
          className="adm-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleCreate()
          }}
        >
          <AdminFormField
            label="Name"
            name="name"
            value={createForm.name}
            onChange={(value) => updateCreateForm('name', value)}
            placeholder="User name"
            required
          />
          <AdminFormField
            label="Email"
            name="email"
            type="email"
            value={createForm.email}
            onChange={(value) => updateCreateForm('email', value)}
            placeholder="user@example.com"
            required
          />
          <AdminFormField
            label="Password"
            name="password"
            type="password"
            value={createForm.password}
            onChange={(value) => updateCreateForm('password', value)}
            placeholder="Minimum 8 characters"
            required
          />
          <AdminFormField
            label="Phone"
            name="phone"
            type="tel"
            value={createForm.phone}
            onChange={(value) => updateCreateForm('phone', value)}
            placeholder="Optional"
          />
          <AdminFormField
            label="Role"
            name="role"
            type="select"
            value={createForm.role}
            onChange={(value) => updateCreateForm('role', value)}
            options={roleOptions}
            required
          />

          <div className="adm-form-actions">
            <button type="button" className="adm-btn adm-btn--outline" onClick={closeCreate}>
              Cancel
            </button>
            <button
              type="submit"
              className="adm-btn adm-btn--accent"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? 'Creating...' : 'Create user'}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal open={!!editUser} onClose={closeEdit} title="Edit User" size="sm">
        <form
          className="adm-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleUpdate()
          }}
        >
          <AdminFormField
            label="Name"
            name="edit-name"
            value={editForm.name}
            onChange={(value) => updateEditForm('name', value)}
            required
          />
          <AdminFormField
            label="Phone"
            name="edit-phone"
            type="tel"
            value={editForm.phone}
            onChange={(value) => updateEditForm('phone', value)}
            placeholder="Optional"
          />
          <AdminFormField
            label="Role"
            name="edit-role"
            type="select"
            value={editForm.role}
            onChange={(value) => updateEditForm('role', value)}
            options={roleOptions}
            required
          />

          <div className="adm-form-actions">
            <button type="button" className="adm-btn adm-btn--outline" onClick={closeEdit}>
              Cancel
            </button>
            <button
              type="submit"
              className="adm-btn adm-btn--accent"
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
