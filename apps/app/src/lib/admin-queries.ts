import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import { api } from './api'
import { toast } from '../components/admin/Toast'
import type {
  ProductListParams,
  EquipmentListParams,
  OrderListParams,
  GetMovementsParams,
  UpsertStockInput,
  RecordMovementInput,
  ReceiveInput,
  IssueInput,
  SetCountedBalanceInput,
  TransferInput,
} from '@repo/sdk'

// ── Products ──────────────────────────────────────────────────

export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => api.products.list(params),
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.products.create>[0]) => api.products.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created')
    },
    onError: () => toast.error('Failed to create product'),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.products.update>[1] }) =>
      api.products.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated')
    },
    onError: () => toast.error('Failed to update product'),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.products.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted')
    },
    onError: () => toast.error('Failed to delete product'),
  })
}

export function useProductEquipment(productId: string | undefined) {
  return useQuery({
    queryKey: ['products', 'equipment', productId],
    queryFn: () => api.products.getEquipment(productId!),
    enabled: !!productId,
  })
}

// ── Suppliers ─────────────────────────────────────────────────

export function useSuppliers(params?: { isActive?: string }) {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => api.suppliers.list(params),
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.suppliers.create>[0]) => api.suppliers.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier created')
    },
    onError: () => toast.error('Failed to create supplier'),
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.suppliers.update>[1] }) =>
      api.suppliers.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier updated')
    },
    onError: () => toast.error('Failed to update supplier'),
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.suppliers.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier deleted')
    },
    onError: () => toast.error('Failed to delete supplier'),
  })
}

// ── Categories ────────────────────────────────────────────────

export const headerCategoriesQueryOptions = queryOptions({
  queryKey: ['categories', { isActive: 'true' as const, parentId: 'null' as const }],
  queryFn: () => api.categories.list({ isActive: 'true', parentId: 'null' }),
})

export function useCategories(params?: { isActive?: 'true' | 'false'; parentId?: string | 'null' }) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => api.categories.list(params),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.categories.create>[0]) =>
      api.categories.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category created')
    },
    onError: () => toast.error('Failed to create category'),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Parameters<typeof api.categories.update>[1]
    }) => api.categories.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category updated')
    },
    onError: () => toast.error('Failed to update category'),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.categories.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted')
    },
    onError: () => toast.error('Failed to delete category'),
  })
}

// ── Equipment ─────────────────────────────────────────────────

export function useEquipment(params?: EquipmentListParams) {
  return useQuery({
    queryKey: ['equipment', params],
    queryFn: () => api.equipment.list(params),
  })
}

export function useCreateEquipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.equipment.create>[0]) => api.equipment.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] })
      toast.success('Equipment created')
    },
    onError: () => toast.error('Failed to create equipment'),
  })
}

export function useUpdateEquipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.equipment.update>[1] }) =>
      api.equipment.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] })
      toast.success('Equipment updated')
    },
    onError: () => toast.error('Failed to update equipment'),
  })
}

export function useDeleteEquipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.equipment.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] })
      toast.success('Equipment deleted')
    },
    onError: () => toast.error('Failed to delete equipment'),
  })
}

export function useEquipmentProducts(equipmentId: string | undefined) {
  return useQuery({
    queryKey: ['equipment', 'products', equipmentId],
    queryFn: () => api.equipment.getProducts(equipmentId!),
    enabled: !!equipmentId,
  })
}

export function useAddCompatibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      equipmentId,
      notes,
    }: {
      productId: string
      equipmentId: string
      notes?: string
    }) => api.equipment.addCompatibility({ productId, equipmentId, notes }),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['equipment'] })
      qc.invalidateQueries({ queryKey: ['products', 'equipment', variables.productId] })
      qc.invalidateQueries({ queryKey: ['equipment', 'products', variables.equipmentId] })
      toast.success('Compatibility linked')
    },
    onError: () => toast.error('Failed to link compatibility'),
  })
}

export function useRemoveCompatibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      compatibilityId,
    }: {
      compatibilityId: string
      productId?: string
      equipmentId?: string
    }) => api.equipment.removeCompatibility(compatibilityId),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['equipment'] })
      if (variables.productId) {
        qc.invalidateQueries({ queryKey: ['products', 'equipment', variables.productId] })
      }
      if (variables.equipmentId) {
        qc.invalidateQueries({ queryKey: ['equipment', 'products', variables.equipmentId] })
      }
      toast.success('Compatibility removed')
    },
    onError: () => toast.error('Failed to remove compatibility'),
  })
}

// ── Locations ─────────────────────────────────────────────────

export function useLocations(params?: { isActive?: 'true' | 'false' }) {
  return useQuery({
    queryKey: ['locations', params],
    queryFn: () => api.locations.list(params),
  })
}

export function useCreateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.locations.create>[0]) => api.locations.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] })
      toast.success('Location created')
    },
    onError: () => toast.error('Failed to create location'),
  })
}

export function useUpdateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.locations.update>[1] }) =>
      api.locations.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] })
      toast.success('Location updated')
    },
    onError: () => toast.error('Failed to update location'),
  })
}

export function useDeleteLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.locations.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] })
      toast.success('Location deleted')
    },
    onError: () => toast.error('Failed to delete location'),
  })
}

// ── Orders ────────────────────────────────────────────────────

export function useOrders(params?: OrderListParams) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => api.orders.list(params),
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Parameters<typeof api.orders.updateStatus>[1] }) =>
      api.orders.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order status updated')
    },
    onError: () => toast.error('Failed to update order status'),
  })
}

// ── Users ─────────────────────────────────────────────────────

export function useUsers(params?: Parameters<typeof api.users.list>[0]) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => api.users.list(params),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.users.create>[0]) => api.users.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User created')
    },
    onError: () => toast.error('Failed to create user'),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.users.update>[1] }) =>
      api.users.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated')
    },
    onError: () => toast.error('Failed to update user'),
  })
}

// ── Stock ─────────────────────────────────────────────────────

export function useReorderAlerts() {
  return useQuery({
    queryKey: ['stock', 'reorder-alerts'],
    queryFn: () => api.stock.getReorderAlerts(),
  })
}

export function useStockByProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['stock', 'by-product', productId],
    queryFn: () => api.stock.getByProduct(productId!),
    enabled: !!productId,
  })
}

export function useStockAtLocation(locationId: string | undefined) {
  return useQuery({
    queryKey: ['stock', 'at-location', locationId],
    queryFn: () => api.stock.getStockByLocation(locationId!),
    enabled: !!locationId,
  })
}

export function useStockByProductAndLocation(
  productId: string | undefined,
  locationId: string | undefined
) {
  return useQuery({
    queryKey: ['stock', 'by-product-location', productId, locationId],
    queryFn: () =>
      api.stock.getByLocation({ productId: productId!, locationId: locationId! }),
    enabled: !!productId && !!locationId,
  })
}

export function useStockMovements(params?: GetMovementsParams) {
  return useQuery({
    queryKey: ['stock', 'movements', params],
    queryFn: () => api.stock.getMovements(params),
  })
}

export function useUpsertStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpsertStockInput) => api.stock.upsert(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Stock updated')
    },
    onError: () => toast.error('Failed to update stock'),
  })
}

export function useUpdateStockQuantity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.stock.updateQuantity(id, quantity),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Quantity updated')
    },
    onError: () => toast.error('Failed to update quantity'),
  })
}

export function useRemoveStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.stock.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Stock record removed')
    },
    onError: () => toast.error('Failed to remove stock'),
  })
}

export function useRecordStockMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RecordMovementInput) => api.stock.recordMovement(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Movement recorded')
    },
    onError: () => toast.error('Failed to record movement'),
  })
}

export function useReceiveStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ReceiveInput) => api.stock.receive(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Stock received')
    },
    onError: () => toast.error('Failed to receive stock'),
  })
}

export function useIssueStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: IssueInput) => api.stock.issue(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Stock issued')
    },
    onError: () => toast.error('Failed to issue stock'),
  })
}

export function useSetCountedBalance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SetCountedBalanceInput) =>
      api.stock.setCountedBalance(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Balance updated')
    },
    onError: () => toast.error('Failed to update balance'),
  })
}

export function useTransferStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TransferInput) => api.stock.transfer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Stock transferred')
    },
    onError: () => toast.error('Failed to transfer stock'),
  })
}
