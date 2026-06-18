<template>
  <div style="direction: rtl">
    <div class="mb-6">
      <div class="text-h5 font-weight-bold text-secondary">گزارش‌ها</div>
      <div class="text-body-2 text-grey">نمای کلی رزروها، درآمد و فعالیت سیستم</div>
    </div>

    <!-- Period filter -->
    <v-card rounded="xl" class="pa-4 mb-6">
      <div class="d-flex align-center gap-3 flex-wrap">
        <v-btn-toggle v-model="period" color="primary" variant="outlined" density="compact" rounded="lg" mandatory>
          <v-btn value="7" size="small">۷ روز اخیر</v-btn>
          <v-btn value="30" size="small">۳۰ روز اخیر</v-btn>
          <v-btn value="90" size="small">۹۰ روز اخیر</v-btn>
        </v-btn-toggle>
        <v-spacer />
        <v-chip v-if="!loading" size="small" color="grey" variant="tonal" prepend-icon="mdi-update">
          آخرین بروزرسانی: {{ lastUpdated }}
        </v-chip>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-refresh" size="small" :loading="loading" @click="loadData">
          بروزرسانی
        </v-btn>
      </div>
    </v-card>

    <!-- KPI cards -->
    <v-row class="mb-6">
      <v-col v-for="kpi in kpiCards" :key="kpi.label" cols="6" md="3">
        <v-card rounded="xl" class="pa-5">
          <div class="d-flex align-center justify-space-between mb-3">
            <v-avatar :color="kpi.color" size="44" rounded="lg">
              <v-icon color="white" size="22">{{ kpi.icon }}</v-icon>
            </v-avatar>
            <v-chip
              :color="kpi.trend >= 0 ? 'success' : 'error'"
              size="x-small"
              variant="tonal"
            >
              <v-icon start size="12">{{ kpi.trend >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}</v-icon>
              {{ Math.abs(kpi.trend) }}%
            </v-chip>
          </div>
          <div class="text-h4 font-weight-bold text-secondary mb-1">{{ kpi.value }}</div>
          <div class="text-caption text-grey">{{ kpi.label }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <!-- Line chart: daily bookings -->
      <v-col cols="12" md="8">
        <v-card rounded="xl" class="pa-5 h-100">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary">رزروها در طول زمان</div>
            <v-chip size="small" color="primary" variant="tonal">{{ period }} روز اخیر</v-chip>
          </div>
          <div style="position:relative; height:240px">
            <canvas ref="lineChartRef" />
          </div>
        </v-card>
      </v-col>

      <!-- Donut chart: status breakdown -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" class="pa-5 h-100">
          <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">وضعیت رزروها</div>
          <div style="position:relative; height:200px" class="d-flex align-center justify-center">
            <canvas ref="donutChartRef" />
          </div>
          <div class="d-flex flex-column gap-2 mt-4">
            <div
              v-for="item in statusBreakdown"
              :key="item.label"
              class="d-flex align-center justify-space-between"
            >
              <div class="d-flex align-center gap-2">
                <div class="rounded-circle" :style="`width:10px;height:10px;background:${item.color}`" />
                <span class="text-body-2 text-grey">{{ item.label }}</span>
              </div>
              <div class="d-flex align-center gap-2">
                <span class="text-body-2 font-weight-bold text-secondary">{{ item.count }}</span>
                <v-chip size="x-small" :color="item.chipColor" variant="tonal">
                  {{ stats?.total ? Math.round((item.count / stats.total) * 100) : 0 }}%
                </v-chip>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <!-- Bar chart: daily revenue -->
      <v-col cols="12" md="7">
        <v-card rounded="xl" class="pa-5 h-100">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary">درآمد روزانه</div>
            <v-chip size="small" color="success" variant="tonal" prepend-icon="mdi-cash">
              {{ formatTomanCompact(totalRevenue) }}
            </v-chip>
          </div>
          <div style="position:relative; height:220px">
            <canvas ref="barChartRef" />
          </div>
        </v-card>
      </v-col>

      <!-- Revenue summary -->
      <v-col cols="12" md="5">
        <v-card rounded="xl" class="pa-5 h-100">
          <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">خلاصه درآمد</div>
          <v-list density="compact" class="pa-0">
            <v-list-item v-for="rev in revenueSummary" :key="rev.label" class="px-0 py-2">
              <template #prepend>
                <v-avatar :color="rev.color" size="38" rounded="lg" class="ml-3">
                  <v-icon color="white" size="18">{{ rev.icon }}</v-icon>
                </v-avatar>
              </template>
              <template #title>
                <span class="text-caption text-grey">{{ rev.label }}</span>
              </template>
              <template #subtitle>
                <span class="text-body-2 font-weight-bold text-secondary">{{ rev.value }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent bookings -->
    <v-card rounded="xl" class="pa-0">
      <div class="pa-5 d-flex align-center justify-space-between">
        <div class="text-subtitle-1 font-weight-bold text-secondary">آخرین رزروها</div>
        <v-btn variant="text" color="primary" to="/admin/bookings" size="small">مشاهده همه</v-btn>
      </div>
      <v-divider />
      <v-data-table
        :headers="recentHeaders"
        :items="recentBookings"
        :loading="loading"
        hide-default-footer
        density="compact"
      >
        <template #item.user="{ item }">
          <div class="d-flex align-center gap-2 py-1">
            <v-avatar color="primary" size="28">
              <span class="text-caption font-weight-bold text-white">{{ item.user?.fullName?.charAt(0) }}</span>
            </v-avatar>
            <span class="text-body-2">{{ item.user?.fullName }}</span>
          </div>
        </template>
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="x-small" label>{{ statusLabel(item.status) }}</v-chip>
        </template>
        <template #item.estimatedFare="{ item }">
          <span class="font-weight-bold text-primary">{{ formatToman(item.finalFare || item.estimatedFare) }}</span>
        </template>
        <template #item.createdAt="{ item }">
          <span class="text-caption text-grey">{{ new Date(item.createdAt).toLocaleDateString('fa-IR') }}</span>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { formatToman, formatTomanCompact } from '~/utils/currency'

definePageMeta({ layout: 'admin' })

const { $api } = useNuxtApp()

// ── State ─────────────────────────────────────────────────────────────────────
const period      = ref('30')
const loading     = ref(false)
const stats       = ref<any>(null)
const allBookings = ref<any[]>([])
const lastUpdated = ref('')

// Chart canvas refs
const lineChartRef  = ref<HTMLCanvasElement | null>(null)
const donutChartRef = ref<HTMLCanvasElement | null>(null)
const barChartRef   = ref<HTMLCanvasElement | null>(null)

// Chart instances
let lineChart:  any = null
let donutChart: any = null
let barChart:   any = null

watch(period, () => loadData())
onMounted(() => { loadChartJS().then(loadData) })
onUnmounted(() => {
  lineChart?.destroy()
  donutChart?.destroy()
  barChart?.destroy()
})

// ── Load Chart.js from CDN ────────────────────────────────────────────────────
const loadChartJS = () =>
  new Promise<void>((resolve) => {
    if ((window as any).Chart) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
    s.onload = () => resolve()
    document.head.appendChild(s)
  })

// ── Fetch data ────────────────────────────────────────────────────────────────
async function loadData() {
  loading.value = true
  try {
    const [statsRes, bookingsRes] = await Promise.all([
      $api.get('/bookings/stats'),
      $api.get('/bookings'),
    ])
    stats.value       = statsRes.data
    allBookings.value = bookingsRes.data
    lastUpdated.value = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    await nextTick()
    renderCharts()
  } finally { loading.value = false }
}

// ── Chart rendering ───────────────────────────────────────────────────────────
const renderCharts = () => {
  const Chart = (window as any).Chart
  if (!Chart) return
  renderLineChart(Chart)
  renderDonutChart(Chart)
  renderBarChart(Chart)
}

// Line chart — daily bookings count
const renderLineChart = (Chart: any) => {
  if (!lineChartRef.value) return
  lineChart?.destroy()

  const labels = dailyData.value.map((d) => d.label)
  const counts = dailyData.value.map((d) => d.count)

  lineChart = new Chart(lineChartRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'تعداد رزرو',
        data: counts,
        borderColor: '#F5A623',
        backgroundColor: 'rgba(245,166,35,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#F5A623',
        pointRadius: 3,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          callbacks: {
            label: (ctx: any) => ` ${ctx.parsed.y} رزرو`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, maxRotation: 45 },
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: { size: 11 },
            callback: (v: any) => `${v}`,
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
      },
    },
  })
}

// Donut chart — status breakdown
const renderDonutChart = (Chart: any) => {
  if (!donutChartRef.value) return
  donutChart?.destroy()

  const breakdown = statusBreakdown.value

  donutChart = new Chart(donutChartRef.value, {
    type: 'doughnut',
    data: {
      labels: breakdown.map((b) => b.label),
      datasets: [{
        data: breakdown.map((b) => b.count),
        backgroundColor: breakdown.map((b) => b.color),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          callbacks: {
            label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}`,
          },
        },
      },
    },
    plugins: [{
      // Center text plugin
      id: 'centerText',
      beforeDraw(chart: any) {
        const { width, height, ctx } = chart
        ctx.save()
        ctx.font = `bold 22px sans-serif`
        ctx.fillStyle = '#1A1A2E'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(stats.value?.total ?? 0, width / 2, height / 2 - 8)
        ctx.font = `12px sans-serif`
        ctx.fillStyle = '#888'
        ctx.fillText('کل', width / 2, height / 2 + 14)
        ctx.restore()
      },
    }],
  })
}

// Bar chart — daily revenue
const renderBarChart = (Chart: any) => {
  if (!barChartRef.value) return
  barChart?.destroy()

  const labels   = dailyRevenueData.value.map((d) => d.label)
  const revenues = dailyRevenueData.value.map((d) => d.revenue)

  barChart = new Chart(barChartRef.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'درآمد (تومان)',
        data: revenues,
        backgroundColor: revenues.map((r) =>
          r > 0 ? 'rgba(245,166,35,0.8)' : 'rgba(0,0,0,0.05)',
        ),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          callbacks: {
            label: (ctx: any) => ` ${formatToman(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, maxRotation: 45 },
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: { size: 10 },
            callback: (v: any) => v === 0 ? '0' : formatTomanCompact(v),
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
      },
    },
  })
}



// ── Computed data ─────────────────────────────────────────────────────────────
const dailyData = computed(() => {
  const days = parseInt(period.value)
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const dateStr = d.toISOString().slice(0, 10)
    const count   = allBookings.value.filter(
      (b) => new Date(b.createdAt).toISOString().slice(0, 10) === dateStr,
    ).length
    return {
      label: d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
      count,
    }
  })
})

const dailyRevenueData = computed(() => {
  const days = parseInt(period.value)
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const dateStr = d.toISOString().slice(0, 10)
    const revenue = allBookings.value
      .filter(
        (b) =>
          b.status === 'completed' &&
          new Date(b.createdAt).toISOString().slice(0, 10) === dateStr,
      )
      .reduce((sum, b) => sum + parseFloat(b.finalFare || b.estimatedFare || 0), 0)
    return {
      label: d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
      revenue,
    }
  })
})

const statusBreakdown = computed(() => [
  { label: 'در انتظار',   count: stats.value?.pending   ?? 0, color: '#FF9800', chipColor: 'warning' },
  { label: 'تأیید شده',  count: stats.value?.confirmed  ?? 0, color: '#2196F3', chipColor: 'info' },
  { label: 'انجام شده',  count: stats.value?.completed  ?? 0, color: '#4CAF50', chipColor: 'success' },
  { label: 'لغو شده',    count: stats.value?.cancelled  ?? 0, color: '#F44336', chipColor: 'error' },
])
// Re-render charts when period changes
watch([dailyData, dailyRevenueData, statusBreakdown], async () => {
  await nextTick()
  const Chart = (window as any).Chart
  if (Chart) renderCharts()
})
const totalRevenue = computed(() =>
  allBookings.value
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + parseFloat(b.finalFare || b.estimatedFare || 0), 0),
)

const kpiCards = computed(() => [
  {
    label: 'کل رزروها',
    value: stats.value?.total ?? 0,
    icon: 'mdi-calendar-check',
    color: 'primary',
    trend: 12,
  },
  {
    label: 'سفرهای انجام شده',
    value: stats.value?.completed ?? 0,
    icon: 'mdi-flag-checkered',
    color: 'success',
    trend: 8,
  },
  {
    label: 'درآمد کل',
    value: stats.value ? formatTomanCompact(totalRevenue.value) : '—',
    icon: 'mdi-cash',
    color: 'info',
    trend: 15,
  },
  {
    label: 'نرخ لغو',
    value: stats.value?.total
      ? `${Math.round((stats.value.cancelled / stats.value.total) * 100)}%`
      : '0%',
    icon: 'mdi-close-circle',
    color: 'error',
    trend: -3,
  },
])

const revenueSummary = computed(() => {
  const completed = allBookings.value.filter((b) => b.status === 'completed')
  const total     = totalRevenue.value
  const avgFare   = completed.length ? total / completed.length : 0
  const avgDist   = completed.length
    ? completed.reduce((s, b) => s + parseFloat(b.distanceKm || 0), 0) / completed.length
    : 0

  return [
    { label: 'درآمد کل',        value: formatToman(total),           icon: 'mdi-cash-multiple',       color: 'success' },
    { label: 'میانگین کرایه',   value: formatToman(avgFare),         icon: 'mdi-cash',                color: 'primary' },
    { label: 'میانگین مسافت',   value: `${avgDist.toFixed(1)} کیلومتر`, icon: 'mdi-map-marker-distance', color: 'info' },
    { label: 'سفرهای تکمیل شده', value: completed.length,            icon: 'mdi-check-circle',        color: 'secondary' },
  ]
})

const recentBookings = computed(() =>
  [...allBookings.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8),
)

const recentHeaders = [
  { title: 'مشتری',   key: 'user',          sortable: false },
  { title: 'تاریخ',   key: 'createdAt',     sortable: true },
  { title: 'کرایه',   key: 'estimatedFare', sortable: true },
  { title: 'وضعیت',   key: 'status',        sortable: true },
]

const statusColor = (s: string) =>
  ({ pending: 'warning', confirmed: 'info', in_progress: 'primary', completed: 'success', cancelled: 'error' }[s] || 'grey')

const statusLabel = (s: string) =>
  ({ pending: 'در انتظار', confirmed: 'تأیید شده', in_progress: 'در حال سفر', completed: 'انجام شده', cancelled: 'لغو شده' }[s] || s)
</script>
