import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import { api } from './api'
import { cartToast } from '../components/Toast'
import { useSession } from './auth-client'
import type { AddToCartInput, UpdateCartItemInput, CreateOrderInput, CartWithItems } from '@repo/sdk'
import type { Response } from '@repo/sdk'

type CartResponse = Response<CartWithItems>

const CART_KEY = ['cart'] as const

function snapshotCart(qc: ReturnType<typeof useQueryClient>) {
  qc.cancelQueries({ queryKey: CART_KEY })
  return qc.getQueryData<CartResponse>(CART_KEY)
}

function rollbackCart(qc: ReturnType<typeof useQueryClient>, snapshot: CartResponse | undefined) {
  if (snapshot) {
    qc.setQueryData<CartResponse>(CART_KEY, snapshot)
  }
}

export const cartQueryOptions = queryOptions({
  queryKey: [...CART_KEY],
  queryFn: () => api.cart.get(),
})

export function useCart() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  return useQuery({
    ...cartQueryOptions,
    enabled: isLoggedIn,
  })
}

export function useCartItemCount() {
  const { data } = useCart()
  if (!data?.data?.items) return 0
  return data.data.items.reduce((sum, item) => sum + item.quantity, 0)
}

export function useAddToCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<AddToCartInput, 'userId'>) =>
      api.cart.addItem(data as AddToCartInput),

    onMutate: async (newItem) => {
      const snapshot = snapshotCart(qc)
      if (!snapshot?.data) return { snapshot }

      const prev = snapshot.data
      const existing = prev.items.find(
        (i) =>
          i.productId === newItem.productId &&
          i.deliveryMethod === (newItem.deliveryMethod ?? 'delivery'),
      )

      const updatedItems = existing
        ? prev.items.map((i) =>
            i === existing
              ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) }
              : i,
          )
        : [
            ...prev.items,
            {
              id: `_optimistic_${Date.now()}`,
              cartId: prev.cart.id,
              productId: newItem.productId,
              productVariantId: newItem.productVariantId ?? null,
              quantity: newItem.quantity ?? 1,
              deliveryMethod: newItem.deliveryMethod ?? 'delivery',
              pickupLocationId: newItem.pickupLocationId ?? null,
              product: {} as unknown,
              variant: null,
            },
          ]

      qc.setQueryData<CartResponse>(CART_KEY, {
        ...snapshot,
        data: { ...prev, items: updatedItems },
      })

      return { snapshot }
    },

    onSuccess: () => {
      cartToast.success('Added to cart')
    },

    onError: (_err, _vars, context) => {
      rollbackCart(qc, context?.snapshot)
      cartToast.error('Failed to add to cart')
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: CART_KEY })
    },
  })
}

export function useUpdateCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      api.cart.updateItem(itemId, { quantity } as UpdateCartItemInput),

    onMutate: async ({ itemId, quantity }) => {
      const snapshot = snapshotCart(qc)
      if (!snapshot?.data) return { snapshot }

      const prev = snapshot.data
      const updatedItems =
        quantity === 0
          ? prev.items.filter((i) => i.id !== itemId)
          : prev.items.map((i) => (i.id === itemId ? { ...i, quantity } : i))

      qc.setQueryData<CartResponse>(CART_KEY, {
        ...snapshot,
        data: { ...prev, items: updatedItems },
      })

      return { snapshot }
    },

    onError: (_err, _vars, context) => {
      rollbackCart(qc, context?.snapshot)
      cartToast.error('Failed to update item')
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: CART_KEY })
    },
  })
}

export function useRemoveCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => api.cart.removeItem(itemId),

    onMutate: async (itemId) => {
      const snapshot = snapshotCart(qc)
      if (!snapshot?.data) return { snapshot }

      const prev = snapshot.data
      qc.setQueryData<CartResponse>(CART_KEY, {
        ...snapshot,
        data: { ...prev, items: prev.items.filter((i) => i.id !== itemId) },
      })

      return { snapshot }
    },

    onSuccess: () => {
      cartToast.success('Item removed')
    },

    onError: (_err, _vars, context) => {
      rollbackCart(qc, context?.snapshot)
      cartToast.error('Failed to remove item')
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: CART_KEY })
    },
  })
}

export function useClearCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.cart.clear(),

    onMutate: async () => {
      const snapshot = snapshotCart(qc)
      if (!snapshot?.data) return { snapshot }

      qc.setQueryData<CartResponse>(CART_KEY, {
        ...snapshot,
        data: { ...snapshot.data, items: [] },
      })

      return { snapshot }
    },

    onError: (_err, _vars, context) => {
      rollbackCart(qc, context?.snapshot)
      cartToast.error('Failed to clear cart')
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: CART_KEY })
    },
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOrderInput) => api.orders.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CART_KEY })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: () => cartToast.error('Failed to create order'),
  })
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (data: { orderId: string; successUrl: string; cancelUrl: string }) =>
      api.checkout.createSession(data),
    onError: () => cartToast.error('Failed to start checkout'),
  })
}
