<template>
  <div>
    <div class="mb-6">
      <div class="text-h5 font-weight-bold text-secondary">Reports</div>
      <div class="text-body-2 text-grey">Overview of bookings, revenue, and activity</div>
    </div>

    <!-- Date range filter -->
    <v-card rounded="xl" class="pa-4 mb-6">
      <div class="d-flex align-center gap-3 flex-wrap">
        <v-btn-toggle v-model="period" color="primary" variant="outlined" density="compact" rounded="lg" mandatory>
          <v-btn value="7" size="small">Last 7 days</v-btn>
          <v-btn value="30" size="small">Last 30 days</v-btn>
          <v-btn value="90" size="small">Last 90 days</v-btn>
        </v-btn-toggle>
        <v-spacer />
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-refresh" size="small" @click="loadData">
          Refresh
        </v-btn>
      </div>
    </v-card>

    <!-- KPI Cards -->
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

    <v-row>
      <!-- Bookings by status (donut) -->
      <v-col cols="12" md="5">
        <v-card rounded="xl" class="pa-5 h-100">
          <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">Bookings by Status</div>
          <div class="d-flex justify-center mb-4">
            <div style="position:relative;width:200px;height:200px">
              <svg viewBox="0 0 200 200" width="200" height="200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#f5f5f5" stroke-width="28" />
                <circle
                  v-for="(seg, i) in donutSegments"
                  :key="i"
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  :stroke="seg.color"
                  stroke-width="28"
                  :stroke-dasharray="`${seg.dash} ${502 - seg.dash}`"
                  :stroke-dashoffset="seg.offset"
                  stroke-linecap="round"
                  style="transition: all 0.6s ease"
                />
              </svg>
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)" class="text-center">
                <div class="text-h5 font-weight-bold text-secondary">{{ stats?.total ?? 0 }}</div>
                <div class="text-caption text-grey">Total</div>
              </div>
            </div>
          </div>
          <div class="d-flex flex-column gap-2">
            <div v-for="item in statusBreakdown" :key="item.label" class="d-flex align-center justify-space-between">
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

      <!-- Daily bookings bar chart -->
      <v-col cols="12" md="7">
        <v-card rounded="xl" class="pa-5 h-100">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary">Daily Bookings</div>
            <v-chip size="small" color="primary" variant="tonal">Last {{ period }} days</v-chip>
          </div>

          <div v-if="dailyData.length === 0" class="d-flex align-center justify-center" style="height:200px">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <div v-else style="height:220px;overflow:hidden" class="d-flex align-end gap-1 px-2">
            <div
              v-for="(day, i) in dailyData"
              :key="i"
              class="d-flex flex-column align-center flex-1"
              style="height:100%"
            >
              <div class="text-caption text-grey mb-1" style="font-size:9px">
                {{ day.count > 0 ? day.count : '' }}
              </div>
              <div
                class="bar rounded-t"
                :style="{
                  height: `${maxDaily > 0 ? (day.count / maxDaily) * 180 : 4}px`,
                  minHeight: '4px',
                  background: day.count > 0 ? '#F5A623' : '#f0f0f0',
                  width: '100%',
                  transition: 'height 0.4s ease',
                }"
              />
              <div class="text-grey mt-1" style="font-size:9px;writing-mode:vertical-rl;transform:rotate(180deg)">
                {{ day.label }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Revenue + Top drivers -->
    <v-row class="mt-4">
      <!-- Revenue summary -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" class="pa-5 h-100">
          <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">Revenue Summary</div>
          <v-list density="compact">
            <v-list-item v-for="rev in revenueSummary" :key="rev.label" class="px-0">
              <template #prepend>
                <v-avatar :color="rev.color" size="36" rounded="lg" class="mr-3">
                  <v-icon color="white" size="18">{{ rev.icon }}</v-icon>
                </v-avatar>
              </template>
              <template #title>
                <span class="text-caption text-grey">{{ rev.label }}</span>
              </template>
              <template #subtitle>
                <span class="text-body-1 font-weight-bold text-secondary">{{ rev.value }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Recent bookings table -->
      <v-col cols="12" md="8">
        <v-card rounded="xl" class="pa-0">
          <div class="pa-5 d-flex align-center justify-space-between">
            <div class="text-subtitle-1 font-weight-bold text-secondary">Recent Bookings</div>
            <v-btn variant="text" color="primary" to="/admin/bookings" size="small">View All</v-btn>
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
              <span class="text-body-2">{{ item.user?.fullName }}</span>
            </template>
            <template #item.status="{ item }">
              <v-chip :color="statusColor(item.status)" size="x-small" label>{{ item.status }}</v-chip>
            </template>
            <template #item.estimatedFare="{ item }">
              <span class="font-weight-bold text-primary">${{ (item.finalFare || item.estimatedFare)?.toFixed(2) }}</span>
            </template>
            <template #item.createdAt="{ item }">
              <span class="text-caption text-grey">{{ new Date(item.createdAt).toLocaleDateString() }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { $api } = useNuxtApp()

const period = ref('30')
const loading = ref(false)
const stats = ref<any>(null)
const allBookings = ref<any[]>([])

watch(period, loadData)
onMounted(loadData)

async function loadData() {
  loading.value = true
  try {
    const [statsRes, bookingsRes] = await Promise.all([
      $api.get('/bookings/stats'),
      $api.get('/bookings'),
    ])
    stats.value = statsRes.data
    allBookings.value = bookingsRes.data
  } finally { loading.value = false }
}

// ── KPI Cards ──────────────────────────────────────────────────────────────────
const kpiCards = computed(() => [
  { label: 'Total Bookings', value: stats.value?.total ?? 0, icon: 'mdi-calendar-check', color: 'primary', trend: 12 },
  { label: 'Completed Rides', value: stats.value?.completed ?? 0, icon: 'mdi-flag-checkered', color: 'success', trend: 8 },
  { label: 'Total Revenue', value: `$${(stats.value?.totalRevenue ?? 0).toFixed(0)}`, icon: 'mdi-currency-usd', color: 'info', trend: 15 },
  { label: 'Cancellation Rate', value: stats.value?.total ? `${Math.round((stats.value.cancelled / stats.value.total) * 100)}%` : '0%', icon: 'mdi-close-circle', color: 'error', trend: -3 },
])

// ── Status Breakdown (donut) ───────────────────────────────────────────────────
const statusBreakdown = computed(() => [
  { label: 'Pending', count: stats.value?.pending ?? 0, color: '#FF9800', chipColor: 'warning' },
  { label: 'Confirmed', count: stats.value?.confirmed ?? 0, color: '#2196F3', chipColor: 'info' },
  { label: 'Completed', count: stats.value?.completed ?? 0, color: '#4CAF50', chipColor: 'success' },
  { label: 'Cancelled', count: stats.value?.cancelled ?? 0, color: '#F44336', chipColor: 'error' },
])

const circumference = 2 * Math.PI * 80 // ≈ 502

const donutSegments = computed(() => {
  const total = stats.value?.total || 1
  let offset = circumference * 0.25 // start at top
  return statusBreakdown.value.map((item) => {
    const dash = (item.count / total) * circumference
    const seg = { color: item.color, dash, offset: -offset + circumference }
    offset += dash
    return seg
  })
})

// ── Daily chart ────────────────────────────────────────────────────────────────
const dailyData = computed(() => {
  const days = parseInt(period.value)
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const count = allBookings.value.filter((b) =>
      new Date(b.createdAt).toISOString().slice(0, 10) === dateStr,
    ).length
    result.push({
      label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      count,
    })
  }
  return result
})

const maxDaily = computed(() => Math.max(...dailyData.value.map((d) => d.count), 1))

// ── Revenue summary ────────────────────────────────────────────────────────────
const revenueSummary = computed(() => {
  const completed = allBookings.value.filter((b) => b.status === 'completed')
  const totalRev = completed.reduce((sum, b) => sum + parseFloat(b.finalFare || b.estimatedFare || 0), 0)
  const avgFare = completed.length ? totalRev / completed.length : 0
  const avgDist = completed.length
    ? completed.reduce((sum, b) => sum + parseFloat(b.distanceKm || 0), 0) / completed.length
    : 0
  return [
    { label: 'Total Revenue', value: `$${totalRev.toFixed(2)}`, icon: 'mdi-cash-multiple', color: 'success' },
    { label: 'Average Fare', value: `$${avgFare.toFixed(2)}`, icon: 'mdi-cash', color: 'primary' },
    { label: 'Avg. Distance', value: `${avgDist.toFixed(1)} km`, icon: 'mdi-map-marker-distance', color: 'info' },
    { label: 'Completed Trips', value: completed.length, icon: 'mdi-check-circle', color: 'secondary' },
  ]
})

// ── Recent bookings ────────────────────────────────────────────────────────────
const recentBookings = computed(() =>
  [...allBookings.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8),
)

const recentHeaders = [
  { title: 'Customer', key: 'user', sortable: false },
  { title: 'Date', key: 'createdAt', sortable: true },
  { title: 'Fare', key: 'estimatedFare', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
]

const statusColor = (s: string) =>
  ({ pending: 'warning', confirmed: 'info', in_progress: 'primary', completed: 'success', cancelled: 'error' }[s] || 'grey')
</script>

<style scoped>
.bar { transition: height 0.4s ease; }
</style>
