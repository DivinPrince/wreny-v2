import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  ChevronDown,
  Download,
  Gauge,
  ShoppingCart,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { OrderWithItems, StockMovement } from '@repo/sdk'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useLocations, useReorderAlerts, useUsers } from '../../lib/admin-queries'
import { api } from '../../lib/api'
import {
  deriveReportMetrics,
  ORDER_STATUS_FILTER_OPTIONS,
  REPORT_RANGE_OPTIONS,
  type DistributionItem,
  type OrderStatusFilter,
  type RankingItem,
  type ReportMetrics,
  type ReportRange,
  type TrendPoint,
} from '../../lib/admin-reporting'

const VALID_RANGES: ReportRange[] = ['30d', '90d', '365d']
const VALID_STATUSES: OrderStatusFilter[] = [
  'all',
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

export const Route = createFileRoute('/admin/reports')({
  validateSearch: (search: Record<string, unknown>) => ({
    range:
      typeof search.range === 'string' && VALID_RANGES.includes(search.range as ReportRange)
        ? (search.range as ReportRange)
        : '30d',
    status:
      typeof search.status === 'string' && VALID_STATUSES.includes(search.status as OrderStatusFilter)
        ? (search.status as OrderStatusFilter)
        : 'all',
    locationId: typeof search.locationId === 'string' && search.locationId.trim() ? search.locationId : undefined,
  }),
  component: AdminReports,
})

async function fetchAllOrders() {
  const limit = 100
  let offset = 0
  const rows: OrderWithItems[] = []

  while (true) {
    const page = await api.orders.list({
      limit: String(limit),
      offset: String(offset),
    })

    rows.push(...page.data)

    if (!page.meta.hasMore) break
    offset += page.meta.limit || limit
  }

  return rows
}

async function fetchAllMovements() {
  const limit = 100
  let offset = 0
  const rows: StockMovement[] = []

  while (true) {
    const page = await api.stock.getMovements({
      limit,
      offset,
    })

    rows.push(...page.data)

    if (page.data.length < limit) break
    offset += limit
  }

  return rows
}

function formatRWF(value: number) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function exportSummary(metrics: ReportMetrics, filenameSeed: string) {
  const rows = [
    ['Metric', 'Value'],
    ['Range', metrics.rangeLabel],
    ['Order Value', String(Math.round(metrics.orderValue))],
    ['Orders', String(metrics.orderCount)],
    ['Average Order Value', String(Math.round(metrics.averageOrderValue))],
    ['Fulfillment Rate', `${Math.round(metrics.fulfillmentRate * 100)}%`],
    ['Low Stock Alerts', String(metrics.lowStockCount)],
    ['Active Users', String(metrics.activeUsers)],
    [],
    ['Top Products', 'Value'],
    ...metrics.topProducts.map((item) => [item.label, `${Math.round(item.value)} (${item.meta})`]),
    [],
    ['Locations Under Pressure', 'Alerts'],
    ...metrics.lowStockByLocation.map((item) => [item.label, `${item.value} (${item.meta})`]),
  ]

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filenameSeed}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function openPdfReport(metrics: ReportMetrics, filenameSeed: string) {
  const [{ pdf }, { default: ReportsPdfDocument }, { createElement }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../../components/admin/ReportsPdfDocument'),
    import('react'),
  ])

  const blob = await pdf(
    createElement(ReportsPdfDocument, {
      metrics,
      generatedAt: new Date(),
    })
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const previewWindow = window.open(url, '_blank')

  if (!previewWindow) {
    const link = document.createElement('a')
    link.href = url
    link.download = `${filenameSeed}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 60_000)
}

function AdminReports() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [exportOpen, setExportOpen] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!exportOpen) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (exportRef.current && !exportRef.current.contains(target)) {
        setExportOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExportOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [exportOpen])

  const ordersQuery = useQuery({
    queryKey: ['reports', 'orders'],
    queryFn: fetchAllOrders,
    staleTime: 60_000,
  })

  const movementsQuery = useQuery({
    queryKey: ['reports', 'movements'],
    queryFn: fetchAllMovements,
    staleTime: 60_000,
  })

  const alertsQuery = useReorderAlerts()
  const usersQuery = useUsers()
  const locationsQuery = useLocations()

  const orders = ordersQuery.data ?? []
  const movements = movementsQuery.data ?? []
  const alerts = alertsQuery.data?.data ?? []
  const users = usersQuery.data?.data ?? []
  const locations = locationsQuery.data?.data ?? []

  const metrics = useMemo(
    () =>
      deriveReportMetrics({
        orders,
        movements,
        alerts,
        users,
        locations,
        range: search.range,
        status: search.status,
        locationId: search.locationId,
      }),
    [alerts, locations, movements, orders, search.locationId, search.range, search.status, users]
  )

  const sourceErrors = [
    ordersQuery.isError ? `Orders: ${ordersQuery.error?.message ?? 'Failed to load orders'}` : null,
    movementsQuery.isError ? `Movements: ${movementsQuery.error?.message ?? 'Failed to load movements'}` : null,
    alertsQuery.isError ? `Alerts: ${alertsQuery.error?.message ?? 'Failed to load alerts'}` : null,
    usersQuery.isError ? `Users: ${usersQuery.error?.message ?? 'Failed to load users'}` : null,
    locationsQuery.isError ? `Locations: ${locationsQuery.error?.message ?? 'Failed to load locations'}` : null,
  ].filter(Boolean) as string[]

  const hasSignal =
    metrics.orderCount > 0 ||
    metrics.lowStockCount > 0 ||
    metrics.recentMovements.length > 0 ||
    metrics.activeUsers > 0

  const locationValue = search.locationId ?? 'all'

  const setSearch = (patch: Partial<{ range: ReportRange; status: OrderStatusFilter; locationId?: string }>) => {
    navigate({
      to: '/admin/reports',
      search: (prev) => ({
        ...prev,
        ...patch,
      }),
    })
  }

  const cards = [
    {
      label: 'Order Value',
      value: ordersQuery.isLoading ? '—' : formatRWF(metrics.orderValue),
      sub: metrics.rangeLabel,
      icon: Banknote,
    },
    {
      label: 'Orders',
      value: ordersQuery.isLoading ? '—' : metrics.orderCount.toLocaleString(),
      sub: search.status === 'all' ? 'Across every status' : `Filtered to ${search.status}`,
      icon: ShoppingCart,
    },
    {
      label: 'Avg Order Value',
      value: ordersQuery.isLoading ? '—' : formatRWF(metrics.averageOrderValue),
      sub: 'Order value per transaction',
      icon: Gauge,
    },
    {
      label: 'Low Stock Alerts',
      value: alertsQuery.isLoading ? '—' : metrics.lowStockCount.toLocaleString(),
      sub: search.locationId ? 'Location scoped risk' : 'Network reorder pressure',
      icon: AlertTriangle,
      isDark: metrics.lowStockCount > 0,
    },
    {
      label: 'Active Users',
      value: usersQuery.isLoading ? '—' : metrics.activeUsers.toLocaleString(),
      sub: 'Admin and customer accounts',
      icon: Users,
    },
  ]

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Reports</h1>
          <p className="adm-page-subtitle">Commercial telemetry &amp; operational risk</p>
        </div>
        <div className="adm-export-menu" ref={exportRef}>
          <button
            type="button"
            className="adm-btn adm-btn--accent"
            onClick={() => setExportOpen((open) => !open)}
            disabled={!hasSignal || isExportingPdf}
            aria-expanded={exportOpen}
            aria-haspopup="menu"
          >
            <Download size={16} aria-hidden="true" />
            {isExportingPdf ? 'Preparing PDF...' : 'Export Report'}
            <ChevronDown size={15} aria-hidden="true" />
          </button>

          {exportOpen ? (
            <div className="adm-export-dropdown" role="menu">
              <button
                type="button"
                className="adm-dropdown-item"
                onClick={async () => {
                  setExportOpen(false)
                  setIsExportingPdf(true)
                  try {
                    await openPdfReport(metrics, `admin-report-${search.range}`)
                  } finally {
                    setIsExportingPdf(false)
                  }
                }}
                disabled={isExportingPdf}
              >
                {isExportingPdf ? 'Building PDF...' : 'Export PDF'}
              </button>
              <button
                type="button"
                className="adm-dropdown-item"
                onClick={() => {
                  exportSummary(metrics, `admin-report-${search.range}`)
                  setExportOpen(false)
                }}
              >
                Export CSV
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="adm-panel adm-report-toolbar">
        <div className="adm-report-toolbar-group">
          <span className="adm-report-toolbar-label">Window</span>
          <div className="adm-report-chip-row">
            {REPORT_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`adm-btn adm-btn--sm ${
                  search.range === option.value ? 'adm-btn--accent' : 'adm-btn--outline'
                }`}
                onClick={() => setSearch({ range: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="adm-report-toolbar-group">
          <label className="adm-report-toolbar-label" htmlFor="reports-status-filter">
            Status
          </label>
          <select
            id="reports-status-filter"
            className="adm-form-select adm-report-select"
            value={search.status}
            onChange={(event) => setSearch({ status: event.target.value as OrderStatusFilter })}
          >
            {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="adm-report-toolbar-group">
          <label className="adm-report-toolbar-label" htmlFor="reports-location-filter">
            Location
          </label>
          <select
            id="reports-location-filter"
            className="adm-form-select adm-report-select"
            value={locationValue}
            onChange={(event) =>
              setSearch({
                locationId: event.target.value === 'all' ? undefined : event.target.value,
              })
            }
          >
            <option value="all">All locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <p className="adm-report-note">
          Location filters shape movement and risk panels, while order analytics stay scoped to the selected status window.
        </p>
      </div>

      {sourceErrors.length > 0 && (
        <div className="adm-report-banner adm-report-banner--warn">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{sourceErrors.join(' · ')}</span>
        </div>
      )}

      <div className="adm-report-stat-row">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {!ordersQuery.isLoading && !movementsQuery.isLoading && !alertsQuery.isLoading && !hasSignal ? (
        <div className="adm-panel">
          <div className="adm-empty">
            <AlertTriangle size={36} className="adm-empty-icon" aria-hidden="true" />
            <p className="adm-empty-text">No report activity matches the current filters</p>
          </div>
        </div>
      ) : (
        <>
          <div className="adm-report-grid">
            <ChartCard
              title="Order Value Trend"
              meta={`${metrics.rangeLabel} · ${metrics.orderCount.toLocaleString()} orders`}
              dark
            >
              <TrendChart
                data={metrics.trend}
                loading={ordersQuery.isLoading}
                emptyLabel="No order value in the selected range."
              />
            </ChartCard>

            <ChartCard
              title="Fulfillment Snapshot"
              meta={`${Math.round(metrics.fulfillmentRate * 100)}% delivered conversion`}
            >
              <DistributionBars
                items={metrics.statusDistribution}
                loading={ordersQuery.isLoading}
                formatter={(item) => `${item.value.toLocaleString()} orders`}
                emptyLabel="No order statuses to compare yet."
              />
            </ChartCard>

            <ChartCard
              title="Inventory Movement Mix"
              meta={search.locationId ? 'Location-scoped operations' : 'Network-wide movement share'}
            >
              <DistributionBars
                items={metrics.movementDistribution}
                loading={movementsQuery.isLoading}
                formatter={(item) => `${item.value.toLocaleString()} units`}
                emptyLabel="No movement activity in this window."
              />
            </ChartCard>

            <ChartCard
              title="Risk By Location"
              meta={`${metrics.lowStockCount.toLocaleString()} active low-stock alerts`}
            >
              <RankingList
                items={metrics.lowStockByLocation}
                loading={alertsQuery.isLoading}
                formatter={(item) => `${item.value.toLocaleString()} alerts`}
                emptyLabel="No low-stock pressure detected."
              />
            </ChartCard>
          </div>

          <div className="adm-report-detail-grid">
            <ChartCard
              title="Top Products"
              meta="Ranked by order value in the current window"
            >
              <RankingList
                items={metrics.topProducts}
                loading={ordersQuery.isLoading}
                formatter={(item) => formatRWF(item.value)}
                emptyLabel="Orders are needed before product leaders appear."
              />
            </ChartCard>

            <ChartCard
              title="Operational Highlights"
              meta="Machine-generated cues for the current range"
              dark
            >
              <InsightList insights={metrics.insights} />
            </ChartCard>
          </div>

          <div className="adm-report-detail-grid">
            <ChartCard
              title="Recent Risk Alerts"
              meta="Most urgent inventory thresholds"
            >
              {alertsQuery.isLoading ? (
                <PanelLoadingRows rows={4} />
              ) : metrics.recentAlerts.length === 0 ? (
                <EmptyPanelCopy message="No risk alerts in the selected scope." />
              ) : (
                <div className="adm-resource-list">
                  {metrics.recentAlerts.map((alert) => (
                    <div key={alert.stockId} className="adm-resource-row adm-report-row">
                      <div className="adm-resource-meta">
                        <span>{alert.productName}</span>
                        <span>
                          {alert.locationName} · {alert.quantity} / {alert.reorderLevel} on hand
                        </span>
                      </div>
                      <span className="adm-report-row-meta">
                        {alert.supplierName ?? 'No supplier'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Recent Inventory Movements"
              meta="Latest movement activity from the filtered window"
            >
              {movementsQuery.isLoading ? (
                <PanelLoadingRows rows={5} />
              ) : metrics.recentMovements.length === 0 ? (
                <EmptyPanelCopy message="No movement events found for this range." />
              ) : (
                <div className="adm-resource-list">
                  {metrics.recentMovements.map((movement) => (
                    <div key={movement.id} className="adm-resource-row adm-report-row">
                      <div className="adm-resource-meta">
                        <span>{movement.type}</span>
                        <span>
                          {movement.locationId} · {Math.abs(Number(movement.quantity || 0)).toLocaleString()} units
                        </span>
                      </div>
                      <span className="adm-report-row-meta">{formatDateTime(movement.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          </div>

          <p className="adm-report-footnote">
            Export uses the current report window and visible scope. Orders are aggregated across loaded admin records, while movement and alert panels react to the active location filter.
          </p>
        </>
      )}
    </>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  isDark,
}: {
  label: string
  value: string
  sub: string
  icon: LucideIcon
  isDark?: boolean
}) {
  return (
    <div className={`adm-stat-card adm-report-kpi${isDark ? ' adm-stat-card--dark' : ''}`}>
      <div className="adm-stat-card-top">
        <span className="adm-stat-label">{label}</span>
        <Icon size={16} aria-hidden="true" className="adm-stat-icon" />
      </div>
      <span className="adm-stat-value">{value}</span>
      <span className="adm-stat-sub">{sub}</span>
    </div>
  )
}

function ChartCard({
  title,
  meta,
  dark,
  children,
}: {
  title: string
  meta: string
  dark?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={`adm-panel adm-chart-card${dark ? ' adm-panel--dark adm-chart-card--dark' : ''}`}>
      <div className="adm-chart-card-header">
        <div>
          <h2 className="adm-panel-title">{title}</h2>
          <p className="adm-chart-card-meta">{meta}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function TrendChart({
  data,
  loading,
  emptyLabel,
}: {
  data: TrendPoint[]
  loading: boolean
  emptyLabel: string
}) {
  if (loading) return <PanelLoadingRows rows={6} />
  if (data.length === 0 || data.every((point) => point.value === 0)) {
    return <EmptyPanelCopy message={emptyLabel} />
  }

  return (
    <div className="adm-chart-shell">
      <div className="adm-chart-recharts">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="reportTrendFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(242, 171, 61, 0.48)" />
                <stop offset="100%" stopColor="rgba(242, 171, 61, 0.04)" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.12)" strokeDasharray="4 6" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={24}
              tick={{ fontSize: 11, fill: 'rgba(255, 255, 255, 0.58)' }}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ stroke: 'rgba(242, 171, 61, 0.3)', strokeWidth: 1.5, strokeDasharray: '4 6' }}
              content={<TrendTooltip />}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="transparent"
              fill="url(#reportTrendFill)"
              fillOpacity={1}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--accent)"
              strokeWidth={3}
              dot={{ r: 3.5, fill: 'var(--accent)', stroke: 'rgba(255,255,255,0.85)', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'rgba(255,255,255,0.95)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: TrendPoint }>
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  return (
    <div className="adm-chart-tooltip">
      <span className="adm-chart-tooltip-label">{point.label}</span>
      <strong>{formatRWF(point.value)}</strong>
      <span>{point.count.toLocaleString()} orders</span>
    </div>
  )
}

function DistributionBars({
  items,
  loading,
  formatter,
  emptyLabel,
}: {
  items: DistributionItem[]
  loading: boolean
  formatter: (item: DistributionItem) => string
  emptyLabel: string
}) {
  if (loading) return <PanelLoadingRows rows={5} />
  if (items.length === 0) return <EmptyPanelCopy message={emptyLabel} />

  return (
    <div className="adm-dist-list">
      {items.map((item) => (
        <div key={item.key} className="adm-dist-item">
          <div className="adm-dist-item-top">
            <span>{item.label}</span>
            <span>{formatter(item)}</span>
          </div>
          <div className="adm-dist-bar">
            <div
              className="adm-dist-bar-fill"
              style={{ width: `${Math.max(item.share * 100, 4)}%` }}
            />
          </div>
          <div className="adm-dist-item-bottom">
            <span>{Math.round(item.share * 100)}% of total</span>
            <span>{item.total.toLocaleString()} overall</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function RankingList({
  items,
  loading,
  formatter,
  emptyLabel,
}: {
  items: RankingItem[]
  loading: boolean
  formatter: (item: RankingItem) => string
  emptyLabel: string
}) {
  if (loading) return <PanelLoadingRows rows={5} />
  if (items.length === 0) return <EmptyPanelCopy message={emptyLabel} />

  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="adm-rank-list">
      {items.map((item) => (
        <div key={item.key} className="adm-rank-item">
          <div className="adm-rank-item-top">
            <div>
              <div className="adm-rank-label">{item.label}</div>
              <div className="adm-rank-meta">{item.meta}</div>
            </div>
            <span className="adm-rank-value">{formatter(item)}</span>
          </div>
          <div className="adm-dist-bar">
            <div
              className="adm-dist-bar-fill adm-dist-bar-fill--soft"
              style={{ width: `${Math.max((item.value / maxValue) * 100, 6)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function InsightList({ insights }: { insights: ReportMetrics['insights'] }) {
  return (
    <div className="adm-insight-list">
      {insights.map((insight) => (
        <article key={insight.title} className={`adm-insight-item adm-insight-item--${insight.tone}`}>
          <div className="adm-insight-item-top">
            <span>{insight.title}</span>
            <ArrowRight size={14} aria-hidden="true" />
          </div>
          <p>{insight.body}</p>
        </article>
      ))}
    </div>
  )
}

function PanelLoadingRows({ rows }: { rows: number }) {
  return (
    <div className="adm-report-loading">
      {Array.from({ length: rows }).map((_, index) => (
        <span key={index} className="adm-skeleton-row" />
      ))}
    </div>
  )
}

function EmptyPanelCopy({ message }: { message: string }) {
  return (
    <div className="adm-empty adm-report-empty">
      <AlertTriangle size={28} className="adm-empty-icon" aria-hidden="true" />
      <p className="adm-empty-text">{message}</p>
    </div>
  )
}
