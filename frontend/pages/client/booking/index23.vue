<template>
  <div>
    <div class="booking-hero pa-8 mb-6">
      <v-container>
        <div class="text-overline text-primary font-weight-bold mb-1">History</div>
        <h1 class="text-h4 font-weight-bold text-secondary">My Trips</h1>
        <p class="text-body-2 text-grey-darken-1 mt-1">All your past and upcoming bookings</p>
      </v-container>
    </div>

    <v-container>
      <!-- Filter tabs -->
      <v-tabs v-model="activeTab" color="primary" class="mb-6">
        <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
          {{ tab.label }}
          <v-chip v-if="tabCount(tab.value) > 0" size="x-small" :color="tab.color" class="ml-2">
            {{ tabCount(tab.value) }}
          </v-chip>
        </v-tab>
      </v-tabs>

      <!-- Loading -->
      <div v-if="bookingsStore.loading" class="d-flex justify-center pa-12">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <!-- Empty -->
      <div v-else-if="filteredBookings.length === 0" class="text-center pa-16">
        <v-icon size="72" color="grey-lighten-2" class="mb-4">mdi-calendar-blank</v-icon>
        <div class="text-h6 text-grey mb-2">No trips found</div>
        <div class="text-body-2 text-grey mb-6">
          {{ activeTab === 'all' ? "You haven't made any bookings yet." : `No ${activeTab} trips.` }}
        </div>
        <v-btn color="primary" to="/client/booking" prepend-icon="mdi-plus">Book a Ride</v-btn>
      </div>

      <!-- Bookings list -->
      <v-row v-else>
        <v-col v-for="booking in filteredBookings" :key="booking.id" cols="12" md="6">
          <v-card rounded="xl" class="booking-card" @click="openDetail(booking)">
            <div class="status-bar" :style="{ background: statusGradient(booking.status) }" />
            <div class="pa-5">
              <div class="d-flex align-start justify-space-between mb-4">
                <div>
                  <v-chip :color="statusColor(booking.status)" size="small" label class="mb-2">
                    <v-icon start size="14">{{ statusIcon(booking.status) }}</v-icon>
                    {{ booking.status.replace('_', ' ').toUpperCase() }}
                  </v-chip>
                  <div class="text-caption text-grey">#{{ booking.id.slice(0, 8).toUpperCase() }}</div>
                </div>
                <div class="text-right">
                  <div class="text-h6 font-weight-bold text-primary">
                    ${{ (booking.finalFare || booking.estimatedFare) }}
                  </div>
                  <div class="text-caption text-grey">{{ booking.distanceKm }} km</div>
                </div>
              </div>

              <!-- Route -->
              <div class="d-flex align-start gap-3 mb-4">
                <div class="d-flex flex-column align-center mt-1">
                  <v-icon color="success" size="14">mdi-circle</v-icon>
                  <div style="width:1px;height:20px;background:#e0e0e0;margin:2px 0" />
                  <v-icon color="error" size="14">mdi-map-marker</v-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-body-2 font-weight-medium text-secondary text-truncate mb-2">{{ booking.pickupAddress }}</div>
                  <div class="text-body-2 font-weight-medium text-secondary text-truncate">{{ booking.dropoffAddress }}</div>
                </div>
              </div>

              <v-divider class="mb-3" />

              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center gap-1">
                  <v-icon size="14" color="grey">mdi-calendar-clock</v-icon>
                  <span class="text-caption text-grey">
                    {{ new Date(booking.scheduledAt).toLocaleDateString() }}
                    {{ new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                  </span>
                </div>
                <v-chip v-if="booking.driver" size="small" color="info" variant="tonal">
                  <v-icon start size="12">mdi-account</v-icon>
                  {{ booking.driver.fullName }}
                </v-chip>
                <!-- Cancellation deadline warning on card -->
                <v-tooltip v-else-if="booking.status === 'pending' && isCancellationBlocked(booking)" location="top">
                  <template #activator="{ props }">
                    <v-chip v-bind="props" size="small" color="warning" variant="tonal">
                      <v-icon start size="12">mdi-clock-alert</v-icon>
                      Can't cancel
                    </v-chip>
                  </template>
                  Trip is within the {{ cancellationDeadline }}-minute cancellation window
                </v-tooltip>
                <v-btn
                  v-else-if="booking.status === 'pending'"
                  size="x-small"
                  color="error"
                  variant="tonal"
                  @click.stop="confirmCancel(booking)"
                >
                  Cancel
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Booking Detail Drawer -->
    <v-navigation-drawer v-model="detailDrawer" location="right" width="420" temporary>
      <div v-if="selectedBooking" class="pa-6">
        <div class="d-flex align-center justify-space-between mb-6">
          <div class="text-h6 font-weight-bold text-secondary">Trip Details</div>
          <v-btn icon="mdi-close" variant="text" @click="detailDrawer = false" />
        </div>

        <!-- Status -->
        <v-card :color="statusColor(selectedBooking.status)" variant="tonal" rounded="lg" class="pa-4 mb-4">
          <div class="d-flex align-center gap-3">
            <v-icon :color="statusColor(selectedBooking.status)" size="32">{{ statusIcon(selectedBooking.status) }}</v-icon>
            <div>
              <div class="text-body-2 font-weight-bold">{{ selectedBooking.status.replace('_', ' ').toUpperCase() }}</div>
              <div class="text-caption">Booking #{{ selectedBooking.id.slice(0, 8).toUpperCase() }}</div>
            </div>
          </div>
        </v-card>

        <!-- Cancellation deadline warning -->
        <v-alert
          v-if="isCancellationBlocked(selectedBooking) && ['pending','confirmed'].includes(selectedBooking.status)"
          type="warning"
          variant="tonal"
          rounded="lg"
          density="compact"
          class="mb-4"
          prepend-icon="mdi-clock-alert"
        >
          <div class="text-body-2 font-weight-bold mb-1">Cancellation window passed</div>
          <div class="text-caption">
            This trip is within {{ cancellationDeadline }} minutes of its scheduled time and can no longer be cancelled.
            Please contact support if you need assistance.
          </div>
        </v-alert>

        <!-- Driver info -->
        <v-card v-if="selectedBooking.driver" color="grey-lighten-5" rounded="lg" class="pa-4 mb-4">
          <div class="text-caption text-grey mb-2 font-weight-bold">YOUR DRIVER</div>
          <div class="d-flex align-center gap-3">
            <v-avatar color="primary" size="48">
              <v-icon color="white">mdi-account</v-icon>
            </v-avatar>
            <div>
              <div class="text-body-1 font-weight-bold text-secondary">{{ selectedBooking.driver.fullName }}</div>
              <div class="text-caption text-grey">{{ selectedBooking.driver.phone }}</div>
            </div>
          </div>
          <v-divider class="my-3" />
          <div class="d-flex gap-3">
            <v-chip size="small" color="secondary" variant="tonal">
              <v-icon start size="12">mdi-car</v-icon>
              {{ selectedBooking.driver.carModel }}
            </v-chip>
            <v-chip size="small" color="primary" variant="tonal">{{ selectedBooking.driver.carPlate }}</v-chip>
          </div>
        </v-card>

        <!-- Route -->
        <div class="text-caption text-grey mb-2 font-weight-bold">TRIP ROUTE</div>
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

        <!-- Details -->
        <v-list lines="two">
          <v-list-item prepend-icon="mdi-calendar-clock" density="compact">
            <template #title><span class="text-caption text-grey">Scheduled</span></template>
            <template #subtitle>{{ new Date(selectedBooking.scheduledAt).toLocaleString() }}</template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-map-marker-distance" density="compact">
            <template #title><span class="text-caption text-grey">Distance</span></template>
            <template #subtitle>{{ selectedBooking.distanceKm }} km</template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-account-group" density="compact">
            <template #title><span class="text-caption text-grey">Passengers</span></template>
            <template #subtitle>{{ selectedBooking.passengerCount || 1 }}</template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-currency-usd" density="compact">
            <template #title><span class="text-caption text-grey">Fare</span></template>
            <template #subtitle>
              <span class="text-primary font-weight-bold">${{ (selectedBooking.finalFare || selectedBooking.estimatedFare) }}</span>
              <span v-if="!selectedBooking.finalFare" class="text-grey text-caption"> (estimated)</span>
            </template>
          </v-list-item>
          <v-list-item v-if="selectedBooking.notes" prepend-icon="mdi-note-text" density="compact">
            <template #title><span class="text-caption text-grey">Notes</span></template>
            <template #subtitle>{{ selectedBooking.notes }}</template>
          </v-list-item>
        </v-list>

        <!-- Cancel button — hidden if deadline passed -->
        <v-btn
          v-if="selectedBooking.status === 'pending' && !isCancellationBlocked(selectedBooking)"
          color="error"
          variant="tonal"
          block
          class="mt-4"
          prepend-icon="mdi-cancel"
          @click="confirmCancel(selectedBooking)"
        >
          Cancel Booking
        </v-btn>

        <!-- Deadline passed message -->
        <v-card
          v-else-if="selectedBooking.status === 'pending' && isCancellationBlocked(selectedBooking)"
          color="warning"
          variant="tonal"
          rounded="lg"
          class="pa-4 mt-4"
        >
          <div class="d-flex align-center gap-2">
            <v-icon color="warning">mdi-phone</v-icon>
            <div class="text-body-2">Need to cancel? Contact support directly.</div>
          </div>
        </v-card>
      </div>
    </v-navigation-drawer>

    <!-- Cancel Confirm Dialog -->
    <v-dialog v-model="cancelDialog" max-width="400">
      <v-card rounded="xl" class="pa-6">
        <div class="text-center mb-4">
          <v-icon color="error" size="48" class="mb-3">mdi-alert-circle</v-icon>
          <div class="text-h6 font-weight-bold text-secondary">Cancel Booking?</div>
          <div class="text-body-2 text-grey mt-2">This action cannot be undone.</div>
        </div>

        <!-- Error from server (e.g. deadline passed between open and submit) -->
        <v-alert
          v-if="cancelError"
          type="error"
          variant="tonal"
          rounded="lg"
          density="compact"
          class="mb-4"
          :text="cancelError"
          prepend-icon="mdi-clock-alert"
        />

        <v-textarea v-model="cancelReason" label="Reason (optional)" rows="2" rounded="lg" variant="outlined" class="mb-4" />
        <div class="d-flex gap-3">
          <v-btn variant="outlined" color="secondary" block @click="cancelDialog = false">Keep Booking</v-btn>
          <v-btn color="error" block :loading="cancelling" @click="doCancel">Cancel Ride</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'client' })

const bookingsStore = useBookingsStore()
const { $api }      = useNuxtApp()

onMounted(async () => {
  await bookingsStore.fetchMyBookings()
  await loadCancellationDeadline()
})

const activeTab    = ref('all')
const detailDrawer = ref(false)
const selectedBooking = ref<any>(null)
const cancelDialog = ref(false)
const cancelTarget = ref<any>(null)
const cancelReason = ref('')
const cancelling   = ref(false)
const cancelError  = ref('')
const cancellationDeadline = ref(60) // minutes — loaded from settings

const loadCancellationDeadline = async () => {
  try {
    const { data } = await $api.get('/settings')
    const s = data.find((s: any) => s.key === 'cancellation_deadline_minutes')
    if (s) cancellationDeadline.value = parseInt(s.value)
  } catch {}
}

// Returns true if the booking is within the cancellation deadline window
const isCancellationBlocked = (booking: any) => {
  if (cancellationDeadline.value <= 0) return false
  const minutesUntilTrip = (new Date(booking.scheduledAt).getTime() - Date.now()) / (1000 * 60)
  return minutesUntilTrip < cancellationDeadline.value
}

const tabs = [
  { label: 'All',       value: 'all',        color: 'secondary' },
  { label: 'Upcoming',  value: 'pending',    color: 'warning' },
  { label: 'Confirmed', value: 'confirmed',  color: 'info' },
  { label: 'Completed', value: 'completed',  color: 'success' },
  { label: 'Cancelled', value: 'cancelled',  color: 'error' },
]

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

const openDetail = (booking: any) => {
  selectedBooking.value = booking
  detailDrawer.value    = true
}

const confirmCancel = (booking: any) => {
  // Double-check deadline before opening dialog
  if (isCancellationBlocked(booking)) return
  cancelTarget.value = booking
  cancelReason.value = ''
  cancelError.value  = ''
  cancelDialog.value = true
}

const doCancel = async () => {
  cancelling.value = true
  cancelError.value = ''
  try {
    await bookingsStore.cancelBooking(cancelTarget.value.id, cancelReason.value)
    cancelDialog.value = false
    detailDrawer.value = false
  } catch (e: any) {
    // Show the server error message (e.g. deadline passed between opening dialog and submitting)
    cancelError.value = e.response?.data?.message || 'Cancellation failed. Please try again.'
  } finally {
    cancelling.value = false
  }
}
</script>

<style scoped>
.booking-hero { background: linear-gradient(135deg, #fff8ee 0%, #ffffff 100%); border-bottom: 1px solid #f0f0f0; }
.booking-card { cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; overflow: hidden; }
.booking-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
.status-bar { height: 4px; }
</style>
