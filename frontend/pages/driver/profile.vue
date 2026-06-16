<template>
  <div>
    <div class="driver-hero pa-8 mb-6">
      <v-container>
        <div class="text-overline text-primary font-weight-bold mb-1">Driver Portal</div>
        <h1 class="text-h4 font-weight-bold text-secondary">My Profile</h1>
        <p class="text-body-2 text-grey mt-1">Your account and vehicle information</p>
      </v-container>
    </div>

    <v-container style="max-width:760px">
      <!-- Profile header -->
      <v-card rounded="xl" class="pa-6 mb-4">
        <div class="d-flex align-center gap-4 flex-wrap">
          <v-avatar color="primary" size="80">
            <span class="text-h3 font-weight-bold text-white">
              {{ driverStore.driver?.fullName?.charAt(0) }}
            </span>
          </v-avatar>
          <div class="flex-1">
            <div class="text-h5 font-weight-bold text-secondary mb-1">
              {{ driverStore.driver?.fullName }}
            </div>
            <div class="text-body-2 text-grey mb-2">{{ driverStore.driver?.phone }}</div>
            <div class="d-flex gap-2 flex-wrap">
              <v-chip size="small" color="success" label>
                <v-icon start size="14">mdi-check-circle</v-icon>
                {{ driverStore.driver?.status }}
              </v-chip>
              <v-chip size="small" color="primary" variant="tonal">
                <v-icon start size="14">mdi-car</v-icon>
                {{ driverStore.driver?.carModel }}
              </v-chip>
              <v-chip size="small" color="secondary" variant="tonal">
                {{ driverStore.driver?.carPlate }}
              </v-chip>
            </div>
          </div>
        </div>
      </v-card>

      <!-- Info sections -->
      <v-row>
        <v-col cols="12" md="6">
          <v-card rounded="xl" class="pa-5 h-100">
            <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">
              <v-icon color="primary" class="mr-2">mdi-account</v-icon>
              Personal Info
            </div>
            <v-list density="compact" class="pa-0">
              <v-list-item prepend-icon="mdi-account" class="px-0">
                <template #title><span class="text-caption text-grey">Full Name</span></template>
                <template #subtitle>{{ driverStore.driver?.fullName }}</template>
              </v-list-item>
              <v-list-item prepend-icon="mdi-phone" class="px-0">
                <template #title><span class="text-caption text-grey">Phone</span></template>
                <template #subtitle>{{ driverStore.driver?.phone }}</template>
              </v-list-item>
              <v-list-item prepend-icon="mdi-email" class="px-0">
                <template #title><span class="text-caption text-grey">Email</span></template>
                <template #subtitle>{{ driverStore.driver?.email || '—' }}</template>
              </v-list-item>
              <v-list-item prepend-icon="mdi-card-account-details" class="px-0">
                <template #title><span class="text-caption text-grey">License Number</span></template>
                <template #subtitle>{{ driverStore.driver?.licenseNumber || '—' }}</template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card rounded="xl" class="pa-5 h-100">
            <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">
              <v-icon color="primary" class="mr-2">mdi-car</v-icon>
              Vehicle Info
            </div>
            <v-list density="compact" class="pa-0">
              <v-list-item prepend-icon="mdi-car" class="px-0">
                <template #title><span class="text-caption text-grey">Model</span></template>
                <template #subtitle>{{ driverStore.driver?.carModel }}</template>
              </v-list-item>
              <v-list-item prepend-icon="mdi-card-text" class="px-0">
                <template #title><span class="text-caption text-grey">Plate Number</span></template>
                <template #subtitle>
                  <v-chip size="x-small" color="primary" variant="tonal">
                    {{ driverStore.driver?.carPlate }}
                  </v-chip>
                </template>
              </v-list-item>
              <v-list-item prepend-icon="mdi-palette" class="px-0">
                <template #title><span class="text-caption text-grey">Color</span></template>
                <template #subtitle>{{ driverStore.driver?.carColor || '—' }}</template>
              </v-list-item>
              <v-list-item prepend-icon="mdi-calendar" class="px-0">
                <template #title><span class="text-caption text-grey">Year</span></template>
                <template #subtitle>{{ driverStore.driver?.carYear || '—' }}</template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Stats -->
      <v-card rounded="xl" class="pa-5 mt-4">
        <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">
          <v-icon color="primary" class="mr-2">mdi-chart-bar</v-icon>
          My Stats
        </div>
        <v-row>
          <v-col v-for="stat in statCards" :key="stat.label" cols="6" md="3" class="text-center">
            <div class="text-h4 font-weight-bold" :class="`text-${stat.color}`">{{ stat.value }}</div>
            <div class="text-caption text-grey mt-1">{{ stat.label }}</div>
          </v-col>
        </v-row>
      </v-card>

      <!-- Note -->
      <v-alert type="info" variant="tonal" rounded="xl" class="mt-4">
        <div class="text-body-2">
          To update your profile or vehicle information, please contact your admin or dispatcher.
        </div>
      </v-alert>
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
  await driverStore.fetchStats()
})

const statCards = computed(() => [
  { label: 'Total Trips',   value: driverStore.stats?.total     ?? 0, color: 'secondary' },
  { label: 'Completed',     value: driverStore.stats?.completed ?? 0, color: 'success' },
  { label: 'Upcoming',      value: driverStore.stats?.upcoming  ?? 0, color: 'primary' },
  { label: 'درآمد کل', value: formatToman(driverStore.stats?.totalEarnings ?? 0), color: 'primary' },
])
</script>

<style scoped>
.driver-hero { background: linear-gradient(135deg, #fff8ee 0%, #ffffff 100%); border-bottom: 1px solid #f0f0f0; }
</style>
