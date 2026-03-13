import type { Location, OrderWithItems, ReorderAlert, StockMovement, User } from '@repo/sdk'

export type ReportRange = '30d' | '90d' | '365d'
export type OrderStatusFilter = 'all' | OrderWithItems['status']

export type TrendPoint = {
  key: string
  label: string
  value: number
  count: number
}

export type DistributionItem = {
  key: string
  label: string
  value: number
  total: number
  share: number
}

export type RankingItem = {
  key: string
  label: string
  value: number
  meta: string
}

export type InsightItem = {
  title: string
  body: string
  tone: 'neutral' | 'good' | 'warn'
}

export type ReportMetrics = {
  rangeLabel: string
  orderValue: number
  orderCount: number
  averageOrderValue: number
  fulfillmentRate: number
  lowStockCount: number
  activeUsers: number
  trend: TrendPoint[]
  statusDistribution: DistributionItem[]
  movementDistribution: DistributionItem[]
  lowStockByLocation: RankingItem[]
  topProducts: RankingItem[]
  recentAlerts: ReorderAlert[]
  recentMovements: StockMovement[]
  insights: InsightItem[]
}

export const REPORT_RANGE_OPTIONS: Array<{ value: ReportRange; label: string }> = [
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '365d', label: '12M' },
]

export const ORDER_STATUS_FILTER_OPTIONS: Array<{ value: OrderStatusFilter; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const RANGE_DAYS: Record<ReportRange, number> = {
  '30d': 30,
  '90d': 90,
  '365d': 365,
}

const MOVEMENT_LABELS: Record<StockMovement['type'], string> = {
  in: 'Inbound',
  out: 'Outbound',
  adjustment: 'Adjustments',
  transfer: 'Transfers',
  return: 'Returns',
}

const STATUS_LABELS: Record<OrderWithItems['status'], string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

type Bucket = {
  key: string
  label: string
  start: Date
  end: Date
}

type DeriveInput = {
  orders: OrderWithItems[]
  movements: StockMovement[]
  alerts: ReorderAlert[]
  users: User[]
  locations: Location[]
  range: ReportRange
  status: OrderStatusFilter
  locationId?: string
  now?: Date
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function monthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function toDate(value: string | Date | null | undefined) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatCompactDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    year: '2-digit',
  }).format(date)
}

function getRangeLabel(range: ReportRange) {
  if (range === '30d') return 'Last 30 days'
  if (range === '90d') return 'Last 90 days'
  return 'Last 12 months'
}

function getRangeStart(range: ReportRange, now: Date) {
  const start = startOfDay(now)
  start.setDate(start.getDate() - (RANGE_DAYS[range] - 1))
  return start
}

function isWithinRange(date: Date | null, rangeStart: Date, rangeEnd: Date) {
  if (!date) return false
  return date >= rangeStart && date <= rangeEnd
}

function getBuckets(range: ReportRange, now: Date): Bucket[] {
  if (range === '30d') {
    const start = getRangeStart(range, now)
    return Array.from({ length: 30 }, (_, index) => {
      const bucketStart = addDays(start, index)
      return {
        key: bucketStart.toISOString(),
        label: formatCompactDate(bucketStart),
        start: bucketStart,
        end: endOfDay(bucketStart),
      }
    })
  }

  if (range === '90d') {
    const rangeEnd = endOfDay(now)
    const rangeStart = getRangeStart(range, now)
    const buckets: Bucket[] = []
    let cursor = rangeStart

    while (cursor <= rangeEnd) {
      const bucketStart = startOfDay(cursor)
      const rawEnd = endOfDay(addDays(bucketStart, 6))
      const bucketEnd = rawEnd > rangeEnd ? rangeEnd : rawEnd

      buckets.push({
        key: bucketStart.toISOString(),
        label: formatCompactDate(bucketStart),
        start: bucketStart,
        end: bucketEnd,
      })

      cursor = addDays(bucketStart, 7)
    }

    return buckets
  }

  const currentMonth = monthStart(now)
  return Array.from({ length: 12 }, (_, index) => {
    const bucketStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (11 - index), 1)
    return {
      key: bucketStart.toISOString(),
      label: formatMonth(bucketStart),
      start: bucketStart,
      end: monthEnd(bucketStart),
    }
  })
}

function toDistributionItems(items: Array<{ key: string; label: string; value: number }>) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  return items
    .filter((item) => item.value > 0)
    .map((item) => ({
      ...item,
      total,
      share: total > 0 ? item.value / total : 0,
    }))
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: 0,
  }).format(value)
}

export function deriveReportMetrics({
  orders,
  movements,
  alerts,
  users,
  locations,
  range,
  status,
  locationId,
  now = new Date(),
}: DeriveInput): ReportMetrics {
  const rangeStart = getRangeStart(range, now)
  const rangeEnd = endOfDay(now)
  const buckets = getBuckets(range, now)
  const locationMap = new Map(locations.map((location) => [location.id, location.name]))

  const filteredOrders = orders.filter((order) => {
    const createdAt = toDate(order.createdAt)
    if (!isWithinRange(createdAt, rangeStart, rangeEnd)) return false
    if (status !== 'all' && order.status !== status) return false
    return true
  })

  const filteredMovements = movements.filter((movement) => {
    const createdAt = toDate(movement.createdAt)
    if (!isWithinRange(createdAt, rangeStart, rangeEnd)) return false
    if (locationId && movement.locationId !== locationId) return false
    return true
  })

  const filteredAlerts = alerts.filter((alert) => {
    if (!locationId) return true
    return alert.locationId === locationId
  })

  const orderValue = filteredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const orderCount = filteredOrders.length
  const averageOrderValue = orderCount > 0 ? orderValue / orderCount : 0

  const fulfilledCount = filteredOrders.filter((order) => order.status === 'delivered').length
  const fulfillmentEligibleCount = filteredOrders.filter((order) => order.status !== 'cancelled').length
  const fulfillmentRate = fulfillmentEligibleCount > 0 ? fulfilledCount / fulfillmentEligibleCount : 0

  const trend = buckets.map((bucket) => {
    const bucketOrders = filteredOrders.filter((order) => {
      const createdAt = toDate(order.createdAt)
      return createdAt ? createdAt >= bucket.start && createdAt <= bucket.end : false
    })

    return {
      key: bucket.key,
      label: bucket.label,
      value: bucketOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      count: bucketOrders.length,
    }
  })

  const statusDistribution = toDistributionItems(
    (Object.keys(STATUS_LABELS) as Array<OrderWithItems['status']>).map((key) => ({
      key,
      label: STATUS_LABELS[key],
      value: filteredOrders.filter((order) => order.status === key).length,
    }))
  )

  const movementDistribution = toDistributionItems(
    (Object.keys(MOVEMENT_LABELS) as Array<StockMovement['type']>).map((key) => ({
      key,
      label: MOVEMENT_LABELS[key],
      value: filteredMovements
        .filter((movement) => movement.type === key)
        .reduce((sum, movement) => sum + Math.abs(Number(movement.quantity || 0)), 0),
    }))
  )

  const topProductsMap = new Map<string, { label: string; quantity: number; revenue: number; orders: number }>()
  for (const order of filteredOrders) {
    for (const item of order.items ?? []) {
      const key = item.productId ?? item.sku ?? item.name
      const entry = topProductsMap.get(key) ?? {
        label: item.name,
        quantity: 0,
        revenue: 0,
        orders: 0,
      }

      entry.quantity += Number(item.quantity || 0)
      entry.revenue += Number(item.total || 0)
      entry.orders += 1
      topProductsMap.set(key, entry)
    }
  }

  const topProducts = [...topProductsMap.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([key, item]) => ({
      key,
      label: item.label,
      value: item.revenue,
      meta: `${formatInteger(item.quantity)} units · ${formatInteger(item.orders)} order lines`,
    }))

  const lowStockByLocationMap = new Map<string, { label: string; count: number; missing: number }>()
  for (const alert of filteredAlerts) {
    const entry = lowStockByLocationMap.get(alert.locationId) ?? {
      label: alert.locationName,
      count: 0,
      missing: 0,
    }
    entry.count += 1
    entry.missing += Math.max(0, alert.reorderLevel - alert.quantity)
    lowStockByLocationMap.set(alert.locationId, entry)
  }

  const lowStockByLocation = [...lowStockByLocationMap.entries()]
    .sort((a, b) => b[1].count - a[1].count || b[1].missing - a[1].missing)
    .slice(0, 5)
    .map(([key, item]) => ({
      key,
      label: item.label,
      value: item.count,
      meta: `${formatInteger(item.missing)} units below threshold`,
    }))

  const recentAlerts = [...filteredAlerts]
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5)

  const recentMovements = [...filteredMovements]
    .sort((a, b) => {
      const left = toDate(a.createdAt)?.getTime() ?? 0
      const right = toDate(b.createdAt)?.getTime() ?? 0
      return right - left
    })
    .slice(0, 6)

  const inboundVolume = filteredMovements
    .filter((movement) => movement.type === 'in' || movement.type === 'return')
    .reduce((sum, movement) => sum + Math.abs(Number(movement.quantity || 0)), 0)

  const outboundVolume = filteredMovements
    .filter((movement) => movement.type === 'out' || movement.type === 'transfer')
    .reduce((sum, movement) => sum + Math.abs(Number(movement.quantity || 0)), 0)

  const insights: InsightItem[] = []

  if (topProducts[0]) {
    insights.push({
      title: 'Top performer',
      body: `${topProducts[0].label} is leading the period with strong order value momentum.`,
      tone: 'good',
    })
  }

  if (filteredAlerts.length > 0) {
    const mostExposed = lowStockByLocation[0]
    insights.push({
      title: 'Reorder pressure',
      body: mostExposed
        ? `${mostExposed.label} carries the highest concentration of low-stock risk right now.`
        : 'Low-stock alerts are active and should be reviewed soon.',
      tone: 'warn',
    })
  }

  if (filteredMovements.length > 0) {
    insights.push({
      title: 'Inventory pulse',
      body:
        outboundVolume > inboundVolume
          ? 'Outbound movement is outpacing replenishment in the current window.'
          : 'Inbound activity is keeping pace with outbound demand in the current window.',
      tone: outboundVolume > inboundVolume ? 'warn' : 'neutral',
    })
  }

  if (filteredOrders.length > 0) {
    insights.push({
      title: 'Fulfillment',
      body: `${formatPercent(fulfillmentRate)} of active orders in this window have reached delivered status.`,
      tone: fulfillmentRate >= 0.6 ? 'good' : 'neutral',
    })
  }

  if (insights.length === 0) {
    insights.push({
      title: 'Waiting for signal',
      body: 'This range has limited activity, so the dashboard is ready once new orders and movements land.',
      tone: 'neutral',
    })
  }

  const activeUsers = users.filter((user) => user.role === 'admin' || user.role === 'user').length
  const scopedLocationName = locationId ? locationMap.get(locationId) : null
  const rangeLabel = scopedLocationName ? `${getRangeLabel(range)} · ${scopedLocationName}` : getRangeLabel(range)

  return {
    rangeLabel,
    orderValue,
    orderCount,
    averageOrderValue,
    fulfillmentRate,
    lowStockCount: filteredAlerts.length,
    activeUsers,
    trend,
    statusDistribution,
    movementDistribution,
    lowStockByLocation,
    topProducts,
    recentAlerts,
    recentMovements,
    insights,
  }
}
