<template>
  <div>
    <!-- Header -->
    <div class="driver-hero pa-8 mb-6">
      <v-container>
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div>
            <div class="text-overline text-primary font-weight-bold mb-1">پنل راننده</div>
            <h1 class="text-h4 font-weight-bold text-secondary">
              خوش آمدید، {{ driverStore.driver?.fullName?.split(' ')[0] }} 👋
            </h1>
            <p class="text-body-2 text-grey mt-1">خلاصه فعالیت شما</p>
          </div>
          <v-card color="secondary" rounded="xl" class="pa-4" flat>
            <div class="d-flex align-center gap-3">
              <v-avatar color="primary" size="48">
                <v-icon color="white">mdi-car</v-icon>
              </v-avatar>
              <div>
                <div class="text-white font-weight-bold">{{ driverStore.driver?.carModel }}</div>
                <div class="d-flex gap-2 mt-1">
                  <v-chip size="x-small" color="primary">{{ driverStore.driver?.carPlate }}</v-chip>
                  <v-chip v-if="driverStore.driver?.carColor" size="x-small" color="white" variant="tonal">
                    {{ driverStore.driver?.carColor }}
                  </v-chip>
                </div>
              </div>
            </div>
          </v-card>
        </div>
      </v-container>
    </div>

    <v-container>
      <!-- آمار -->
      <v-row class="mb-6">
        <v-col v-for="stat in statCards" :key="stat.label" cols="6" md="3">
          <v-card rounded="xl" class="pa-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <v-avatar  :color="stat.color" size="44" rounded="lg">
                <v-icon color="white" size="22">{{ stat.icon }}</v-icon>
              </v-avatar>
            </div>
            <div class="text-h4 font-weight-bold text-secondary mb-1">{{ stat.value }}</div>
            <div class="text-caption text-grey">{{ stat.label }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <!-- سفرهای پیش‌رو -->
        <v-col cols="12" md="7">
          <v-card rounded="xl" class="pa-0">
            <div class="pa-5 d-flex align-center justify-space-between">
              <div class="text-subtitle-1 font-weight-bold text-secondary">سفرهای پیش‌رو</div>
              <v-btn variant="text" color="primary" size="small" to="/driver/trips">مشاهده همه</v-btn>
            </div>
            <v-divider />

            <div v-if="driverStore.loading" class="d-flex justify-center pa-10">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <div v-else-if="upcomingTrips.length === 0" class="text-center pa-10">
              <v-icon size="56" color="grey-lighten-2" class="mb-3">mdi-calendar-blank</v-icon>
              <div class="text-body-2 text-grey">هیچ سفر پیش‌رویی وجود ندارد</div>
            </div>

            <div v-else>
              <div
                v-for="trip in upcomingTrips"
                :key="trip.id"
                class="trip-row pa-4 cursor-pointer"
                @click="navigateTo(`/driver/trips/${trip.id}`)"
              >
                <div class="d-flex align-start justify-space-between gap-3">
                  <div class="d-flex align-start gap-3 flex-1 min-w-0">
                    <!-- نشانگر مسیر -->
                    <div class="d-flex flex-column align-center mt-1 flex-shrink-0">
                      <v-icon color="success" size="12">mdi-circle</v-icon>
                      <div style="width:1px;height:20px;background:#e0e0e0;margin:2px 0" />
                      <v-icon color="error" size="12">mdi-map-marker</v-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-body-2 font-weight-medium text-secondary text-truncate">
                        {{ trip.pickupAddress }}
                      </div>
                      <div class="text-body-2 text-grey text-truncate mt-1">
                        {{ trip.dropoffAddress }}
                      </div>
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <v-chip :color="statusColor(trip.status)" size="x-small" label class="mb-1">
                      {{ trip.status.replace('_', ' ') }}
                    </v-chip>
                    <div class="text-caption text-grey">
                      {{ new Date(trip.scheduledAt).toLocaleDateString() }}
                    </div>
                    <div class="text-caption font-weight-bold text-primary">
                      {{ formatToman(trip.finalFare || trip.estimatedFare) }}
                    </div>
                  </div>
                </div>
                <v-divider class="mt-3" />
              </div>
            </div>
          </v-card>
        </v-col>

        <!-- ستون راست -->
        <v-col cols="12" md="5">
          <!-- کارت پروفایل راننده -->
          <v-card rounded="xl" class="pa-5 mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">پروفایل من</div>
            <div class="d-flex align-center gap-3 mb-4">
              <v-avatar color="primary" size="56">
                <v-img v-if="driverStore.driver?.avatarUrl" :src="avatarSrc(driverStore.driver?.avatarUrl)" cover />
                <span class="text-h5 font-weight-bold text-white">
                  {{ driverStore.driver?.fullName?.charAt(0) }}
                </span>
              </v-avatar>
              <div>
                <div class="text-body-1 font-weight-bold text-secondary">
                  {{ driverStore.driver?.fullName }}
                </div>
                <div class="text-body-2 text-grey">{{ driverStore.driver?.phone }}</div>
                <v-chip
                  size="x-small"
                  color="success"
                  class="mt-1"
                >
                  {{ driverStore.driver?.status }}
                </v-chip>
              </div>
            </div>
            <v-divider class="mb-3" />
            <v-list density="compact" class="pa-0">
              <v-list-item prepend-icon="mdi-car" density="compact" class="px-0">
                <template #title><span class="text-caption text-grey">خودرو</span></template>
                <template #subtitle>{{ driverStore.driver?.carModel }}</template>
              </v-list-item>
              <v-list-item prepend-icon="mdi-card-text" density="compact" class="px-0">
                <template #title><span class="text-caption text-grey">پلاک</span></template>
                <template #subtitle>
                  <v-chip size="x-small" color="primary" variant="tonal">
                    {{ driverStore.driver?.carPlate }}
                  </v-chip>
                </template>
              </v-list-item>
              <v-list-item
                v-if="driverStore.driver?.licenseNumber"
                prepend-icon="mdi-card-account-details"
                density="compact"
                class="px-0"
              >
                <template #title><span class="text-caption text-grey">گواهینامه</span></template>
                <template #subtitle>{{ driverStore.driver?.licenseNumber }}</template>
              </v-list-item>
            </v-list>
            <v-btn variant="tonal" color="primary" block class="mt-4" to="/driver/profile" prepend-icon="mdi-pencil">
              ویرایش پروفایل
            </v-btn>
          </v-card>

          <!-- خلاصه درآمد -->
          <v-card color="secondary" rounded="xl" class="pa-5">
            <div class="text-subtitle-1 font-weight-bold text-white mb-4">درآمد</div>
            <div class="text-h3 font-weight-bold text-primary mb-1">
              {{ formatToman(driverStore.stats?.totalEarnings ?? 0) }}
            </div>
            <div class="text-caption text-grey mb-4">مجموع از سفرهای تکمیل شده</div>
            <v-divider color="white" opacity="0.1" class="mb-4" />
            <v-row dense>
              <v-col cols="6" class="text-center">
                <div class="text-h5 font-weight-bold text-white">{{ driverStore.stats?.completed ?? 0 }}</div>
                <div class="text-caption text-grey">تکمیل شده</div>
              </v-col>
              <v-col cols="6" class="text-center">
                <div class="text-h5 font-weight-bold text-primary">{{ driverStore.stats?.upcoming ?? 0 }}</div>
                <div class="text-caption text-grey">پیش‌رو</div>
              </v-col>
            </v-row>
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
  await Promise.all([driverStore.fetchTrips(), driverStore.fetchStats()])
})

const statCards = computed(() => [
  { label: 'کل سفرها',    value: driverStore.stats?.total      ?? 0, icon: 'mdi-car-multiple',    color: 'primary' },
  { label: 'پیش‌رو',       value: driverStore.stats?.upcoming    ?? 0, icon: 'mdi-clock-outline',   color: 'warning' },
  { label: 'در حال انجام',    value: driverStore.stats?.inProgress  ?? 0, icon: 'mdi-car',             color: 'info' },
  { label: 'تکمیل شده',      value: driverStore.stats?.completed   ?? 0, icon: 'mdi-flag-checkered',  color: 'success' },
])

const upcomingTrips = computed(() =>
  driverStore.trips
    .filter((t) => ['confirmed', 'pending', 'in_progress'].includes(t.status))
    .slice(0, 5),
)

const statusColor = (s: string) =>
  ({ pending: 'warning', confirmed: 'info', in_progress: 'primary', completed: 'success', cancelled: 'error' }[s] || 'grey')


  const avatarSrc = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const base = useRuntimeConfig().public.apiBase.replace('/api', '')
  return `${base}${url}`
}
</script>

<style scoped>
.driver-hero {
  background: linear-gradient(135deg, #fff8ee 0%, #ffffff 100%);
  border-bottom: 1px solid #f0f0f0;
}
.trip-row { transition: background 0.15s; cursor: pointer; }
.trip-row:hover { background: #fafafa; }
</style>