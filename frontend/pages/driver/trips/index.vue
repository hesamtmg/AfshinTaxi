<template>
  <div>
    <div class="driver-hero pa-8 mb-6">
      <v-container>
        <div class="text-overline text-primary font-weight-bold mb-1">پنل راننده</div>
        <h1 class="text-h4 font-weight-bold text-secondary">سفرهای من</h1>
        <p class="text-body-2 text-grey mt-1">همه سفرهای اختصاص داده شده و جزئیات آنها</p>
      </v-container>
    </div>

    <v-container>
      <!-- فیلتر برگه‌ها -->
      <v-tabs v-model="activeTab" color="primary" class="mb-6">
        <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
          {{ tab.label }}
          <v-chip
            v-if="tabCount(tab.value) > 0"
            size="x-small"
            :color="tab.color"
            class="ml-2"
          >
            {{ tabCount(tab.value) }}
          </v-chip>
        </v-tab>
      </v-tabs>

      <!-- در حال بارگذاری -->
      <div v-if="driverStore.loading" class="d-flex justify-center pa-16">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <!-- خالی -->
      <div v-else-if="filteredTrips.length === 0" class="text-center pa-16">
        <v-icon size="72" color="grey-lighten-2" class="mb-4">mdi-car-off</v-icon>
        <div class="text-h6 text-grey mb-2">هیچ سفری یافت نشد</div>
        <div class="text-body-2 text-grey">
          {{ activeTab === 'all' ? 'هنوز هیچ سفری به شما اختصاص داده نشده است.' : `هیچ سفری با وضعیت ${activeTab} وجود ندارد.` }}
        </div>
      </div>

      <!-- شبکه سفرها -->
      <v-row v-else>
        <v-col
          v-for="trip in filteredTrips"
          :key="trip.id"
          cols="12"
          md="6"
        >
          <v-card
            rounded="xl"
            class="trip-card"
            @click="navigateTo(`/driver/trips/${trip.id}`)"
          >
            <!-- نوار وضعیت -->
            <div class="status-bar" :style="{ background: statusGradient(trip.status) }" />

            <div class="pa-5">
              <!-- هدر -->
              <div class="d-flex align-start justify-space-between mb-4">
                <div>
                  <v-chip :color="statusColor(trip.status)" size="small" label class="mb-2">
                    <v-icon start size="12">{{ statusIcon(trip.status) }}</v-icon>
                    {{ trip.status.replace('_', ' ').toUpperCase() }}
                  </v-chip>
                  <div class="text-caption text-grey">
                    #{{ trip.id.slice(0, 8).toUpperCase() }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-h6 font-weight-bold text-primary">
                    {{ formatToman(trip.finalFare || trip.estimatedFare) }}
                  </div>
                  <div class="text-caption text-grey">{{ trip.distanceKm }} کیلومتر</div>
                </div>
              </div>

              <!-- مسیر -->
              <div class="d-flex align-start gap-3 mb-4">
                <div class="d-flex flex-column align-center mt-1 flex-shrink-0">
                  <v-icon color="success" size="12">mdi-circle</v-icon>
                  <div style="width:1px;height:20px;background:#e0e0e0;margin:2px 0" />
                  <v-icon color="error" size="12">mdi-map-marker</v-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-body-2 font-weight-medium text-secondary text-truncate mb-2">
                    {{ trip.pickupAddress }}
                  </div>
                  <div class="text-body-2 text-grey text-truncate">
                    {{ trip.dropoffAddress }}
                  </div>
                </div>
              </div>

              <v-divider class="mb-3" />

              <!-- پاورقی -->
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center gap-1">
                  <v-icon size="14" color="grey">mdi-calendar-clock</v-icon>
                  <span class="text-caption text-grey">
                    {{ new Date(trip.scheduledAt).toLocaleDateString() }}
                    {{ new Date(trip.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                  </span>
                </div>
                <div class="d-flex align-center gap-1">
                  <v-icon size="14" color="grey">mdi-account</v-icon>
                  <span class="text-caption text-grey">{{ trip.user?.fullName }}</span>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { formatToman } from '~/utils/currency'
definePageMeta({ layout: 'driver' })

const driverStore = useDriverStore()

onMounted(async () => {
  driverStore.hydrate()
  if (!driverStore.isAuthenticated) { navigateTo('/driver/login'); return }
  await driverStore.fetchTrips()
})

const activeTab = ref('all')

const tabs = [
  { label: 'همه',         value: 'all',         color: 'secondary' },
  { label: 'پیش‌رو',    value: 'confirmed',    color: 'info' },
  { label: 'در حال انجام', value: 'in_progress',  color: 'primary' },
  { label: 'تکمیل شده',   value: 'completed',    color: 'success' },
  { label: 'لغو شده',   value: 'cancelled',    color: 'error' },
]

const filteredTrips = computed(() => {
  if (activeTab.value === 'all') return driverStore.trips
  return driverStore.trips.filter((t) => t.status === activeTab.value)
})

const tabCount = (val: string) => {
  if (val === 'all') return 0
  return driverStore.trips.filter((t) => t.status === val).length
}

const statusColor = (s: string) =>
  ({ pending: 'warning', confirmed: 'info', in_progress: 'primary', completed: 'success', cancelled: 'error' }[s] || 'grey')

const statusIcon = (s: string) =>
  ({ pending: 'mdi-clock-outline', confirmed: 'mdi-check-circle', in_progress: 'mdi-car', completed: 'mdi-flag-checkered', cancelled: 'mdi-close-circle' }[s] || 'mdi-help-circle')

const statusGradient = (s: string) =>
  ({ pending: 'linear-gradient(90deg,#FF9800,#FFB74D)', confirmed: 'linear-gradient(90deg,#2196F3,#64B5F6)', in_progress: 'linear-gradient(90deg,#F5A623,#FFD180)', completed: 'linear-gradient(90deg,#4CAF50,#81C784)', cancelled: 'linear-gradient(90deg,#F44336,#E57373)' }[s] || '#e0e0e0')
</script>

<style scoped>
.driver-hero { background: linear-gradient(135deg, #fff8ee 0%, #ffffff 100%); border-bottom: 1px solid #f0f0f0; }
.trip-card { cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; overflow: hidden; }
.trip-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
.status-bar { height: 4px; }
</style>