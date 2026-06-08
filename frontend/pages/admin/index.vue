<template>
  <div>
    <div class="text-h5 font-weight-bold text-secondary mb-6">Dashboard</div>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col v-for="stat in statCards" :key="stat.label" cols="12" sm="6" lg="3">
        <v-card rounded="xl" class="pa-5">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-body-2 text-grey mb-1">{{ stat.label }}</div>
              <div class="text-h4 font-weight-bold text-secondary">{{ stat.value }}</div>
            </div>
            <v-avatar :color="stat.color" size="52" rounded="lg">
              <v-icon color="white" size="26">{{ stat.icon }}</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Bookings -->
    <v-card rounded="xl" class="pa-0">
      <div class="pa-5 d-flex align-center justify-space-between">
        <div class="text-h6 font-weight-bold text-secondary">Recent Bookings</div>
        <v-btn variant="text" color="primary" to="/admin/bookings" size="small">
          View All
        </v-btn>
      </div>
      <v-divider />
      <v-data-table
        :headers="headers"
        :items="bookingsStore.allBookings.slice(0, 8)"
        :loading="bookingsStore.loading"
        hide-default-footer
      >
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" label>
            {{ item.status }}
          </v-chip>
        </template>
        <template #item.scheduledAt="{ item }">
          {{ new Date(item.scheduledAt).toLocaleString() }}
        </template>
        <template #item.estimatedFare="{ item }">
          ${{ item.finalFare || item.estimatedFare }}
        </template>
        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-eye"
            size="small"
            variant="text"
            :to="`/admin/bookings/${item.id}`"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const bookingsStore = useBookingsStore()

onMounted(async () => {
  await Promise.all([bookingsStore.fetchAllBookings(), bookingsStore.fetchStats()])
})

const stats = computed(() => bookingsStore.stats)

const statCards = computed(() => [
  {
    label: 'Total Bookings',
    value: stats.value?.total ?? '—',
    icon: 'mdi-calendar-check',
    color: 'primary',
  },
  {
    label: 'Pending',
    value: stats.value?.pending ?? '—',
    icon: 'mdi-clock-outline',
    color: 'warning',
  },
  {
    label: 'Completed',
    value: stats.value?.completed ?? '—',
    icon: 'mdi-check-circle',
    color: 'success',
  },
  {
    label: 'Revenue',
    value: stats.value ? `$${stats.value.totalRevenue?.toFixed(0)}` : '—',
    icon: 'mdi-currency-usd',
    color: 'info',
  },
])

const headers = [
  { title: 'Customer', key: 'user.fullName' },
  { title: 'Pickup', key: 'pickupAddress' },
  { title: 'Dropoff', key: 'dropoffAddress' },
  { title: 'Scheduled', key: 'scheduledAt' },
  { title: 'Fare', key: 'estimatedFare' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false },
]

const statusColor = (status: string) => ({
  pending: 'warning',
  confirmed: 'info',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'error',
}[status] || 'grey')
</script>
