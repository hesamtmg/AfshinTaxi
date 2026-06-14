<template>
  <div >
    <div class="booking-hero pa-8 mb-6">
      <v-container style="direction:rtl ">
        <div class="text-overline text-primary font-weight-bold mb-1">تاریخچه</div>
        <h1 class="text-h4 font-weight-bold text-secondary">سفرهای من</h1>
        <p class="text-body-2 text-grey-darken-1 mt-1">تمام رزروهای گذشته و آینده شما</p>
      </v-container>
    </div>

    <v-container style="direction:rtl ">
      <!-- تب‌های فیلتر -->
      <v-tabs v-model="activeTab" color="primary" class="mb-6">
        <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
          {{ tab.label }}
          <v-chip v-if="tabCount(tab.value) > 0" size="x-small" :color="tab.color" class="mr-2">
            {{ tabCount(tab.value) }}
          </v-chip>
        </v-tab>
      </v-tabs>

      <!-- در حال بارگذاری -->
      <div v-if="bookingsStore.loading" class="d-flex justify-center pa-12">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <!-- حالت خالی -->
      <div v-else-if="filteredBookings.length === 0" class="text-center pa-16">
        <v-icon size="72" color="grey-lighten-2" class="mb-4">mdi-calendar-blank</v-icon>
        <div class="text-h6 text-grey mb-2">هیچ سفری یافت نشد</div>
        <div class="text-body-2 text-grey mb-6">
          {{ activeTab === 'all' ? "تاکنون هیچ رزروی انجام نداده‌اید." : `هیچ رزرو ${getTabName(activeTab)}ای وجود ندارد.` }}
        </div>
        <v-btn color="primary" to="/client/booking" prepend-icon="mdi-plus">رزرو سفر</v-btn>
      </div>

      <!-- لیست رزروها -->
      <v-row v-else>
        <v-col v-for="booking in filteredBookings" :key="booking.id" cols="12" md="6">
          <v-card rounded="xl" class="booking-card" @click="openDetail(booking)">
            <div class="status-bar" :style="{ background: statusGradient(booking.status) }" />

            <div class="pa-5">
              <div class="d-flex align-start justify-space-between mb-4">
                <div>
                  <v-chip :color="statusColor(booking.status)" size="small" label class="mb-2">
                    <v-icon start size="14">{{ statusIcon(booking.status) }}</v-icon>
                    {{ getStatusText(booking.status) }}
                  </v-chip>
                  <div class="text-caption text-grey">
                    #{{ booking.id.slice(0, 8).toUpperCase() }}
                  </div>
                </div>
                <div class="text-left">
                  <div class="text-h6 font-weight-bold text-primary">
                    {{ (booking.finalFare ? booking.finalFare.toLocaleString() : booking.estimatedFare?.toLocaleString()) }} تومان 
                  </div>
                  <div class="text-caption text-grey">{{ booking.distanceKm }} کیلومتر</div>
                </div>
              </div>

              <!-- مسیر -->
              <div class="d-flex align-start gap-3 mb-4">
                <div class="d-flex flex-column align-center mt-1">
                  <v-icon color="success" size="14">mdi-circle</v-icon>
                  <div style="width:1px;height:20px;background:#e0e0e0;margin:2px 0" />
                  <v-icon color="error" size="14">mdi-map-marker</v-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-body-2 font-weight-medium text-secondary text-truncate mb-2">
                    {{ booking.pickupAddress }}
                  </div>
                  <div class="text-body-2 font-weight-medium text-secondary text-truncate">
                    {{ booking.dropoffAddress }}
                  </div>
                </div>
              </div>

              <v-divider class="mb-3" />

              <!-- اطلاعات پایین -->
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center gap-1">
                  <v-icon size="14" color="grey">mdi-calendar-clock</v-icon>
                  <span class="text-caption text-grey">
                    {{ new Date(booking.scheduledAt).toLocaleDateString("fa-IR") }}
                    {{ new Date(booking.scheduledAt).toLocaleTimeString("fa-IR") }}
                  </span>
                </div>

                <v-chip v-if="booking.driver" size="small" color="info" variant="tonal">
                  <v-icon start size="12">mdi-account</v-icon>
                  {{ booking.driver.fullName }}
                </v-chip>

                <v-btn
                  v-else-if="booking.status === 'pending'"
                  size="x-small"
                  color="error"
                  variant="tonal"
                  @click.stop="confirmCancel(booking)"
                >
                  لغو
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- جزئیات سفر (کناری) -->
    <v-navigation-drawer v-model="detailDrawer" location="right" width="420" temporary>
      <div v-if="selectedBooking" class="pa-6">
        <div class="d-flex align-center justify-space-between mb-6">
          <div class="text-h6 font-weight-bold text-secondary">جزئیات سفر</div>
          <v-btn icon="mdi-close" variant="text" @click="detailDrawer = false" />
        </div>

        <v-card :color="statusColor(selectedBooking.status)" variant="tonal" rounded="lg" class="pa-4 mb-4">
          <div class="d-flex align-center gap-3">
            <v-icon :color="statusColor(selectedBooking.status)" size="32">
              {{ statusIcon(selectedBooking.status) }}
            </v-icon>
            <div>
              <div class="text-body-2 font-weight-bold">
                {{ getStatusText(selectedBooking.status).toUpperCase() }}
              </div>
              <div class="text-caption">رزرو #{{ selectedBooking.id.slice(0, 8).toUpperCase() }}</div>
            </div>
          </div>
        </v-card>

        <!-- اطلاعات راننده -->
        <v-card v-if="selectedBooking.driver" color="grey-lighten-5" rounded="lg" class="pa-4 mb-4">
          <div class="text-caption text-grey mb-2 font-weight-bold">راننده شما</div>
          <div class="d-flex align-center gap-3">
            <v-avatar color="primary" size="48">
              <v-icon color="white">mdi-account</v-icon>
            </v-avatar>
            <div>
              <div class="text-body-1 font-weight-bold text-secondary">
                {{ selectedBooking.driver.fullName }}
              </div>
              <div class="text-caption text-grey">{{ selectedBooking.driver.phone }}</div>
            </div>
          </div>
          <v-divider class="my-3" />
          <div class="d-flex gap-3">
            <v-chip size="small" color="secondary" variant="tonal">
              <v-icon start size="12">mdi-car</v-icon>
              {{ selectedBooking.driver.carModel }}
            </v-chip>
            <v-chip size="small" color="primary" variant="tonal">
              {{ selectedBooking.driver.carPlate }}
            </v-chip>
          </div>
        </v-card>

        <!-- جزئیات مسیر -->
        <div class="text-caption text-grey mb-2 font-weight-bold">مسیر سفر</div>
        <v-card color="grey-lighten-5" rounded="lg" class="pa-4 mb-4">
          <div class="d-flex align-start gap-3">
            <div class="d-flex flex-column align-center mt-1">
              <v-icon color="success" size="16">mdi-circle</v-icon>
              <div style="width:2px;height:32px;background:#e0e0e0;margin:3px 0" />
              <v-icon color="error" size="16">mdi-map-marker</v-icon>
            </div>
            <div>
              <div class="text-body-2 font-weight-medium text-secondary mb-3">{{ selectedBooking.pickupAddress }}</div>
              <div class="text-body-2 font-weight-medium text-secondary">{{ selectedBooking.dropoffAddress }}</div>
            </div>
          </div>
        </v-card>

        <!-- لیست جزئیات -->
        <v-list lines="two">
          <v-list-item prepend-icon="mdi-calendar-clock" density="compact">
            <template #title><span class="text-caption text-grey">زمان رزرو</span></template>
            <template #subtitle>{{ new Date(selectedBooking.scheduledAt).toLocaleString("fa-IR") }}</template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-map-marker-distance" density="compact">
            <template #title><span class="text-caption text-grey">مسافت</span></template>
            <template #subtitle>{{ selectedBooking.distanceKm }} کیلومتر</template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-account-group" density="compact">
            <template #title><span class="text-caption text-grey">مسافران</span></template>
            <template #subtitle>{{ selectedBooking.passengerCount || 1 }} نفر</template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-currency-usd" density="compact">
            <template #title><span class="text-caption text-grey">کرایه</span></template>
            <template #subtitle class="text-primary font-weight-bold">
              {{ (selectedBooking.finalFare ? selectedBooking.finalFare.toLocaleString() : selectedBooking.estimatedFare?.toLocaleString()) }} تومان
              <span v-if="!selectedBooking.finalFare" class="text-grey text-caption"> (تخمینی)</span>
            </template>
          </v-list-item>
          <v-list-item v-if="selectedBooking.notes" prepend-icon="mdi-note-text" density="compact">
            <template #title><span class="text-caption text-grey">یادداشت</span></template>
            <template #subtitle>{{ selectedBooking.notes }}</template>
          </v-list-item>
        </v-list>

        <v-btn
          v-if="selectedBooking.status === 'pending'"
          color="error"
          variant="tonal"
          block
          class="mt-4"
          @click="confirmCancel(selectedBooking)"
        >
          لغو رزرو
        </v-btn>
      </div>
    </v-navigation-drawer>

    <!-- دیالوگ تأیید لغو -->
    <v-dialog v-model="cancelDialog" max-width="380">
      <v-card rounded="xl" class="pa-6">
        <div class="text-center mb-4">
          <v-icon color="error" size="48" class="mb-3">mdi-alert-circle</v-icon>
          <div class="text-h6 font-weight-bold text-secondary">لغو رزرو؟</div>
          <div class="text-body-2 text-grey mt-2">این عمل قابل بازگشت نیست.</div>
        </div>
        <v-textarea v-model="cancelReason" label="دلیل (اختیاری)" rows="2" rounded="lg" variant="outlined" class="mb-4" />
        <div class="d-flex gap-3">
          <v-btn variant="outlined" color="secondary" block @click="cancelDialog = false">انصراف</v-btn>
          <v-btn color="error" block :loading="cancelling" @click="doCancel">لغو سفر</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'client' })

const bookingsStore = useBookingsStore()

onMounted(() => bookingsStore.fetchMyBookings())

const activeTab = ref('all')
const detailDrawer = ref(false)
const selectedBooking = ref<any>(null)
const cancelDialog = ref(false)
const cancelTarget = ref<any>(null)
const cancelReason = ref('')
const cancelling = ref(false)

const tabs = [
  { label: 'همه', value: 'all', color: 'secondary' },
  { label: 'در انتظار', value: 'pending', color: 'warning' },
  { label: 'تأیید شده', value: 'confirmed', color: 'info' },
  { label: 'تکمیل شده', value: 'completed', color: 'success' },
  { label: 'لغو شده', value: 'cancelled', color: 'error' },
]

const getTabName = (value: string) => {
  const tab = tabs.find(t => t.value === value)
  return tab?.label || ''
}

const getStatusText = (status: string) => ({
  pending: 'در انتظار',
  confirmed: 'تأیید شده',
  in_progress: 'در حال انجام',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده',
}[status] || status)

const filteredBookings = computed(() => {
  if (activeTab.value === 'all') return bookingsStore.myBookings
  return bookingsStore.myBookings.filter((b) => b.status === activeTab.value)
})

const tabCount = (val: string) => {
  if (val === 'all') return 0
  return bookingsStore.myBookings.filter((b) => b.status === val).length
}

const statusColor = (s: string) =>
  ({ pending: 'warning', confirmed: 'info', in_progress: 'primary', completed: 'success', cancelled: 'error' }[s] || 'grey')

const statusIcon = (s: string) =>
  ({ pending: 'mdi-clock-outline', confirmed: 'mdi-check-circle', in_progress: 'mdi-car', completed: 'mdi-flag-checkered', cancelled: 'mdi-close-circle' }[s] || 'mdi-help-circle')

const statusGradient = (s: string) =>
  ({ pending: 'linear-gradient(90deg,#FF9800,#FFB74D)', confirmed: 'linear-gradient(90deg,#2196F3,#64B5F6)', in_progress: 'linear-gradient(90deg,#F5A623,#FFD180)', completed: 'linear-gradient(90deg,#4CAF50,#81C784)', cancelled: 'linear-gradient(90deg,#F44336,#E57373)' }[s] || '#e0e0e0')

const openDetail = (booking: any) => { selectedBooking.value = booking; detailDrawer.value = true }

const confirmCancel = (booking: any) => { cancelTarget.value = booking; cancelReason.value = ''; cancelDialog.value = true }

const doCancel = async () => {
  cancelling.value = true
  try {
    await bookingsStore.cancelBooking(cancelTarget.value.id, cancelReason.value)
    cancelDialog.value = false
    detailDrawer.value = false
  } finally { cancelling.value = false }
}
</script>

<style scoped>
.booking-hero { direction: ltr  !important; background: linear-gradient(135deg, #fff8ee 0%, #ffffff 100%); border-bottom: 1px solid #f0f0f0; }
.booking-card { cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; overflow: hidden; }
.booking-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
.status-bar { height: 4px; }
</style>