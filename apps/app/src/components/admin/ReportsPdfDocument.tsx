import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import type { ReportMetrics } from '../../lib/admin-reporting'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#f6f1e8',
    color: '#1b1713',
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  hero: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 18,
  },
  heroPrimary: {
    flex: 2,
    borderRadius: 18,
    backgroundColor: '#191612',
    padding: 20,
  },
  heroSecondary: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    padding: 18,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ddd7cf',
  },
  eyebrow: {
    color: '#d7922c',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  subtitle: {
    color: '#d5cec1',
    lineHeight: 1.5,
  },
  metaLabel: {
    color: '#d7922c',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  metaValue: {
    color: '#1b1713',
    marginBottom: 10,
    lineHeight: 1.4,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e3ddd5',
  },
  statLabel: {
    color: '#6f675b',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 700,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  panel: {
    width: '48.6%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e3ddd5',
    marginBottom: 12,
  },
  panelTitle: {
    color: '#6f675b',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#ebe5dd',
  },
  rowFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  rowTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 3,
  },
  rowMeta: {
    color: '#6f675b',
    fontSize: 9.5,
    lineHeight: 1.45,
  },
  rowValue: {
    fontSize: 10,
    fontWeight: 700,
    textAlign: 'right',
  },
  insightCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  insightGood: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  insightWarn: {
    backgroundColor: 'rgba(242, 171, 61, 0.14)',
  },
  insightNeutral: {
    backgroundColor: 'rgba(36, 28, 20, 0.05)',
  },
  insightTitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
    fontWeight: 700,
  },
  insightBody: {
    fontSize: 10.5,
    lineHeight: 1.55,
  },
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(value)
}

function renderRows(
  items: Array<{
    title: string
    meta: string
    value: string
  }>
) {
  if (items.length === 0) {
    return <Text style={styles.rowMeta}>No records are available for the selected filters.</Text>
  }

  return items.map((item, index) => (
    <View key={`${item.title}-${index}`} style={index === 0 ? [styles.row, styles.rowFirst] : styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowMeta}>{item.meta}</Text>
      </View>
      <Text style={styles.rowValue}>{item.value}</Text>
    </View>
  ))
}

export default function ReportsPdfDocument({
  metrics,
  generatedAt,
}: {
  metrics: ReportMetrics
  generatedAt: Date
}) {
  const statCards = [
    { label: 'Order Value', value: formatCurrency(metrics.orderValue) },
    { label: 'Orders', value: metrics.orderCount.toLocaleString() },
    { label: 'Avg Order Value', value: formatCurrency(metrics.averageOrderValue) },
    { label: 'Fulfillment', value: `${Math.round(metrics.fulfillmentRate * 100)}%` },
  ]

  return (
    <Document title="1000 Hills Report" author="1000 Hills Admin">
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <View style={styles.heroPrimary}>
            <Text style={styles.eyebrow}>1000 Hills Admin Report</Text>
            <Text style={styles.title}>Operational Report</Text>
            <Text style={styles.subtitle}>
              A presentation-ready summary of commercial performance, fulfillment velocity, and inventory pressure.
            </Text>
          </View>

          <View style={styles.heroSecondary}>
            <Text style={styles.metaLabel}>Scope</Text>
            <Text style={styles.metaValue}>{metrics.rangeLabel}</Text>

            <Text style={styles.metaLabel}>Generated</Text>
            <Text style={styles.metaValue}>{formatDateTime(generatedAt)}</Text>

            <Text style={styles.metaLabel}>Alerts</Text>
            <Text style={styles.metaValue}>{metrics.lowStockCount.toLocaleString()} active low-stock signals</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          {statCards.map((card) => (
            <View key={card.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{card.label}</Text>
              <Text style={styles.statValue}>{card.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.grid}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Trend Highlights</Text>
            {renderRows(
              metrics.trend
                .filter((point) => point.value > 0)
                .slice(-8)
                .map((point) => ({
                  title: point.label,
                  meta: `${point.count.toLocaleString()} orders`,
                  value: formatCurrency(point.value),
                }))
            )}
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Operational Highlights</Text>
            {metrics.insights.map((insight) => (
              <View
                key={insight.title}
                style={[
                  styles.insightCard,
                  insight.tone === 'good'
                    ? styles.insightGood
                    : insight.tone === 'warn'
                      ? styles.insightWarn
                      : styles.insightNeutral,
                ]}
              >
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightBody}>{insight.body}</Text>
              </View>
            ))}
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Top Products</Text>
            {renderRows(
              metrics.topProducts.map((item) => ({
                title: item.label,
                meta: item.meta,
                value: formatCurrency(item.value),
              }))
            )}
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Recent Risk Alerts</Text>
            {renderRows(
              metrics.recentAlerts.map((alert) => ({
                title: alert.productName,
                meta: `${alert.locationName} · ${alert.quantity} / ${alert.reorderLevel} on hand`,
                value: alert.supplierName ?? 'No supplier',
              }))
            )}
          </View>

        </View>
      </Page>
    </Document>
  )
}
