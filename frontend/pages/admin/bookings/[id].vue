<template>
  <div style="direction: rtl">
    <div class="d-flex align-center gap-3 mb-6">
      <v-btn icon="mdi-arrow-right" variant="tonal" color="secondary" @click="$router.back()" />
      <div>
        <div class="text-h5 font-weight-bold text-secondary">
          رزرو #{{ booking?.id?.slice(0, 8).toUpperCase() }}
        </div>
        <div class="text-body-2 text-grey">جزئیات کامل و مدیریت رزرو</div>
      </div>
      <v-spacer />
      <v-chip v-if="booking" :color="statusColor(booking.status)" size="large" label>
        <v-icon start>{{ statusIcon(booking.status) }}</v-icon>
        {{ statusLabel(booking.status) }}
      </v-chip>
    </div>

    <div v-if="loading" class="d-flex justify-center pa-16">
      <v-progress-circular indeterminate color="primary" size="56" />
    </div>

    <div v-else-if="!booking" class="text-center pa-16">
      <v-icon size="72" color="grey-lighten-2" class="mb-4">mdi-calendar-remove</v-icon>
      <div class="text-h6 text-grey">رزرو یافت نشد</div>
      <v-btn class="mt-4" to="/admin/bookings" color="primary" variant="tonal">بازگشت به لیست</v-btn>
    </div>

    <v-row v-else>
      <!-- Left column -->
      <v-col cols="12" md="8">

        <!-- Neshan Map -->
        <v-card rounded="xl" class="mb-4" style="overflow:hidden">
          <div id="admin-booking-map" style="width:100%;height:320px" />
          <div class="pa-4 d-flex align-center gap-4 flex-wrap">
            <div class="d-flex align-center gap-2">
              <v-icon color="success" size="14">mdi-circle</v-icon>
              <span class="text-caption text-grey text-truncate" style="max-width:200px">{{ booking.pickupAddress }}</span>
            </div>
            <v-icon size="14" color="grey">mdi-arrow-left</v-icon>
            <div class="d-flex align-center gap-2">
              <v-icon color="error" size="14">mdi-map-marker</v-icon>
              <span class="text-caption text-grey text-truncate" style="max-width:200px">{{ booking.dropoffAddress }}</span>
            </div>
            <v-spacer />
            <v-chip size="small" color="primary" variant="tonal" prepend-icon="mdi-map-marker-distance">
              {{ booking.distanceKm}} کیلومتر
            </v-chip>
          </div>
        </v-card>

        <!-- Trip details -->
        <v-card rounded="xl" class="pa-6 mb-4">
          <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">جزئیات سفر</div>
          <v-row>
            <v-col cols="12" sm="6">
              <div class="mb-4">
                <div class="text-caption text-grey font-weight-bold mb-1">مکان سوار شدن</div>
                <div class="d-flex align-start gap-2">
                  <v-icon color="success" size="18">mdi-circle</v-icon>
                  <div>
                    <div class="text-body-2 font-weight-medium text-secondary">{{ booking.pickupAddress }}</div>
                    <div class="text-caption text-grey mt-1">{{ booking.pickupLat }}, {{ booking.pickupLng }}</div>
                  </div>
                </div>
              </div>
              <div>
                <div class="text-caption text-grey font-weight-bold mb-1">مکان پیاده شدن</div>
                <div class="d-flex align-start gap-2">
                  <v-icon color="error" size="18">mdi-map-marker</v-icon>
                  <div>
                    <div class="text-body-2 font-weight-medium text-secondary">{{ booking.dropoffAddress }}</div>
                    <div class="text-caption text-grey mt-1">{{ booking.dropoffLat }}, {{ booking.dropoffLng }}</div>
                  </div>
                </div>
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <v-list lines="two" density="compact">
                <v-list-item prepend-icon="mdi-calendar-clock">
                  <template #title><span class="text-caption text-grey">زمان رزرو</span></template>
                  <template #subtitle>
                    <span class="font-weight-medium">{{ new Date(booking.scheduledAt).toLocaleString('fa-IR') }}</span>
                  </template>
                </v-list-item>
                <v-list-item prepend-icon="mdi-map-marker-distance">
                  <template #title><span class="text-caption text-grey">مسافت</span></template>
                  <template #subtitle>{{ booking.distanceKm }} کیلومتر</template>
                </v-list-item>
                <v-list-item prepend-icon="mdi-account-group">
                  <template #title><span class="text-caption text-grey">تعداد مسافران</span></template>
                  <template #subtitle>{{ booking.passengerCount || 1 }} نفر</template>
                </v-list-item>
                <v-list-item v-if="booking.notes" prepend-icon="mdi-note-text">
                  <template #title><span class="text-caption text-grey">یادداشت</span></template>
                  <template #subtitle>{{ booking.notes }}</template>
                </v-list-item>
                <v-list-item v-if="booking.cancellationReason" prepend-icon="mdi-cancel">
                  <template #title><span class="text-caption text-grey">دلیل لغو</span></template>
                  <template #subtitle>{{ booking.cancellationReason }}</template>
                </v-list-item>
                <v-list-item prepend-icon="mdi-clock-outline">
                  <template #title><span class="text-caption text-grey">تاریخ ثبت</span></template>
                  <template #subtitle>{{ new Date(booking.createdAt).toLocaleString('fa-IR') }}</template>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card>

        <!-- Status timeline -->
        <v-card rounded="xl" class="pa-6">
          <div class="text-subtitle-1 font-weight-bold text-secondary mb-5">مراحل رزرو</div>
          <div class="timeline">
            <div
              v-for="(step, i) in statusTimeline"
              :key="step.status"
              class="timeline-item"
              :class="{ done: isStatusDone(step.status), active: booking.status === step.status, cancelled: booking.status === 'cancelled' && step.status === 'cancelled' }"
            >
              <div class="timeline-dot">
                <v-icon size="16" :color="timelineDotColor(step.status)">
                  {{ isStatusDone(step.status) ? 'mdi-check' : step.icon }}
                </v-icon>
              </div>
              <div v-if="i < statusTimeline.length - 1" class="timeline-line" />
              <div class="timeline-content">
                <div class="text-body-2 font-weight-bold" :class="isStatusDone(step.status) ? 'text-secondary' : 'text-grey'">{{ step.label }}</div>
                <div class="text-caption text-grey">{{ step.desc }}</div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Right column -->
      <v-col cols="12" md="4">

        <!-- Fare -->
        <v-card rounded="xl" class="pa-6 mb-4">
          <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">کرایه</div>
          <div class="d-flex justify-space-between align-center mb-3">
            <span class="text-body-2 text-grey">کرایه تخمینی</span>
            <span class="text-body-1 font-weight-bold">{{ formatToman(booking.estimatedFare) }}</span>
          </div>
          <div class="d-flex justify-space-between align-center mb-3">
            <span class="text-body-2 text-grey">مسافت ({{ booking.distanceKm}} کیلومتر)</span>
            <span class="text-body-2 text-grey">محاسبه شده</span>
          </div>
          <v-divider class="mb-3" />
          <div class="d-flex justify-space-between align-center mb-4">
            <span class="text-body-1 font-weight-bold text-secondary">کرایه نهایی</span>
            <span class="text-h5 font-weight-bold text-primary">{{ formatToman(booking.finalFare || booking.estimatedFare) }}</span>
          </div>
          <v-expand-transition>
            <div v-if="editingFare">
              <v-text-field
                v-model="newFare"
                label="کرایه نهایی (تومان)"
                type="number"
                variant="outlined"
                rounded="lg"
                density="compact"
                class="mb-3"
              />
              <div class="d-flex gap-2">
                <v-btn variant="outlined" size="small" color="secondary" @click="editingFare = false">انصراف</v-btn>
                <v-btn color="primary" size="small" :loading="savingFare" @click="saveFare">ذخیره</v-btn>
              </div>
            </div>
          </v-expand-transition>
          <v-btn
            v-if="!editingFare && booking.status !== 'cancelled'"
            variant="tonal"
            color="primary"
            size="small"
            block
            prepend-icon="mdi-pencil"
            @click="openEditFare"
          >
            ویرایش کرایه نهایی
          </v-btn>
        </v-card>

        <!-- Customer -->
        <v-card rounded="xl" class="pa-6 mb-4">
          <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">مشتری</div>
          <div class="d-flex align-center gap-3 mb-4">
            <v-avatar color="primary" size="52">
              <span class="text-h6 font-weight-bold text-white">{{ booking.user?.fullName?.charAt(0) }}</span>
            </v-avatar>
            <div>
              <div class="text-body-1 font-weight-bold text-secondary">{{ booking.user?.fullName }}</div>
              <div class="text-body-2 text-grey">{{ booking.user?.phone }}</div>
              <div v-if="booking.user?.email" class="text-caption text-grey">{{ booking.user.email }}</div>
            </div>
          </div>
          <v-btn variant="tonal" color="secondary" size="small" block prepend-icon="mdi-account" to="/admin/customers">
            مشاهده پروفایل
          </v-btn>
        </v-card>

        <!-- Driver -->
        <v-card rounded="xl" class="pa-6 mb-4">
          <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">راننده</div>

          <!-- Driver assigned -->
          <div v-if="booking.driver">
            <div class="d-flex align-center gap-3 mb-3">
              <v-avatar color="info" size="52">
                <v-icon color="white" size="26">mdi-account-tie</v-icon>
              </v-avatar>
              <div>
                <div class="text-body-1 font-weight-bold text-secondary">{{ booking.driver.fullName }}</div>
                <div class="text-body-2 text-grey">{{ booking.driver.phone }}</div>
              </div>
            </div>
            <v-divider class="mb-3" />
            <v-list density="compact" class="pa-0 mb-3">
              <v-list-item prepend-icon="mdi-car" density="compact" class="pa-0">
                <template #title><span class="text-caption text-grey">خودرو</span></template>
                <template #subtitle>
                  {{ booking.driver.carModel }}
                  {{ booking.driver.carColor ? `(${booking.driver.carColor})` : '' }}
                </template>
              </v-list-item>
              <v-list-item prepend-icon="mdi-card-text" density="compact" class="pa-0">
                <template #title><span class="text-caption text-grey">پلاک</span></template>
                <template #subtitle>
                  <v-chip size="x-small" color="primary" variant="tonal">{{ booking.driver.carPlate }}</v-chip>
                </template>
              </v-list-item>
            </v-list>
            <v-btn
              v-if="booking.status !== 'cancelled' && booking.status !== 'completed'"
              variant="tonal"
              color="warning"
              size="small"
              block
              prepend-icon="mdi-swap-horizontal"
              @click="openAssignDialog"
            >
              تغییر راننده
            </v-btn>
          </div>

          <!-- No driver -->
          <div v-else>
            <div class="text-center py-4">
              <v-icon size="48" color="grey-lighten-2" class="mb-2">mdi-account-off</v-icon>
              <div class="text-body-2 text-grey mb-4">هنوز راننده‌ای تخصیص داده نشده</div>
            </div>
            <v-btn
              v-if="booking.status !== 'cancelled'"
              color="primary"
              block
              prepend-icon="mdi-account-plus"
              @click="openAssignDialog"
            >
              تخصیص راننده
            </v-btn>
          </div>
        </v-card>

        <!-- Actions -->
        <v-card rounded="xl" class="pa-6">
          <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">عملیات</div>
          <div class="d-flex flex-column gap-2">
            <v-btn
              v-for="action in availableActions"
              :key="action.status"
              :color="action.color"
              variant="tonal"
              block
              :prepend-icon="action.icon"
              :loading="updatingStatus === action.status"
              @click="doUpdateStatus(action.status)"
            >
              {{ action.label }}
            </v-btn>
            <div v-if="availableActions.length === 0" class="text-center text-grey text-body-2 py-2">
              عملیاتی در دسترس نیست
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Assign / Reassign Driver Dialog — with availability check ── -->
    <v-dialog v-model="assignDialog" max-width="520" persistent>
      <v-card rounded="xl" class="pa-6" style="direction:rtl">
        <div class="d-flex align-center justify-space-between mb-1">
          <div class="text-h6 font-weight-bold text-secondary">
            {{ booking?.driver ? 'تغییر راننده' : 'تخصیص راننده' }}
          </div>
          <v-btn icon="mdi-close" variant="text" @click="assignDialog = false" />
        </div>
        <div class="text-body-2 text-grey mb-4">
          رزرو #{{ booking?.id?.slice(0,8).toUpperCase() }}
        </div>

        <!-- Time slot info -->
        <v-alert
          type="info"
          variant="tonal"
          rounded="lg"
          density="compact"
          class="mb-4"
          prepend-icon="mdi-calendar-clock"
        >
          رانندگان آزاد برای زمان
          <strong>{{ booking ? new Date(booking.scheduledAt).toLocaleString('fa-IR') : '' }}</strong>
          نمایش داده می‌شوند
          <span class="text-caption"> (بازه ±{{ bufferMinutes }} دقیقه)</span>
        </v-alert>

        <!-- Loading available drivers -->
        <div v-if="loadingAvailable" class="d-flex flex-column align-center pa-8 gap-3">
          <v-progress-circular indeterminate color="primary" />
          <span class="text-caption text-grey">بررسی برنامه رانندگان...</span>
        </div>

        <div v-else>
          <!-- No available drivers -->
          <v-alert
            v-if="availableDrivers.length === 0"
            type="error"
            variant="tonal"
            rounded="xl"
            class="mb-4"
            prepend-icon="mdi-account-off"
          >
            <div class="font-weight-bold mb-1">هیچ راننده‌ای در دسترس نیست</div>
            <div class="text-caption">
              تمام رانندگان فعال در این بازه زمانی رزرو دارند.
              بازه زمانی را در تنظیمات کاهش دهید یا رزرو را به زمان دیگری تغییر دهید.
            </div>
          </v-alert>

          <div v-else>
            <!-- Available count + search -->
            <div class="d-flex align-center justify-space-between mb-3">
              <v-chip size="small" color="success" variant="tonal">
                <v-icon start size="14">mdi-check-circle</v-icon>
                {{ availableDrivers.length }} راننده آزاد
              </v-chip>
              <v-text-field
                v-model="driverSearch"
                placeholder="جستجو..."
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                rounded="lg"
                hide-details
                density="compact"
                style="max-width:180px"
              />
            </div>

            <!-- Driver list -->
            <div style="max-height:280px;overflow-y:auto" class="mb-4">
              <v-radio-group v-model="selectedDriverId" hide-details>
                <v-card
                  v-for="driver in filteredAvailableDrivers"
                  :key="driver.id"
                  class="mb-2 pa-3 cursor-pointer"
                  rounded="lg"
                  :style="selectedDriverId === driver.id ? 'border:2px solid #F5A623' : 'border:2px solid transparent'"
                  @click="selectedDriverId = driver.id"
                >
                  <div class="d-flex align-center gap-3">
                    <v-radio :value="driver.id" hide-details />
                    <v-avatar color="info" size="40">
                      <v-icon color="white" size="20">mdi-account-tie</v-icon>
                    </v-avatar>
                    <div class="flex-1">
                      <div class="text-body-2 font-weight-bold text-secondary">{{ driver.fullName }}</div>
                      <div class="text-caption text-grey">{{ driver.carModel }} · {{ driver.carPlate }}</div>
                    </div>
                    <v-chip size="x-small" color="success">
                      <v-icon start size="10">mdi-check</v-icon>
                      آزاد
                    </v-chip>
                  </div>
                </v-card>
                <div v-if="filteredAvailableDrivers.length === 0" class="text-center pa-4 text-grey text-body-2">
                  راننده‌ای یافت نشد
                </div>
              </v-radio-group>
            </div>
          </div>

          <!-- Final fare override -->
          <v-text-field
            v-model="finalFareInput"
            label="تغییر کرایه نهایی (تومان، اختیاری)"
            prepend-inner-icon="mdi-cash"
            type="number"
            variant="outlined"
            rounded="lg"
            hide-details
            density="compact"
            class="mb-5"
          />

          <!-- Assignment error -->
          <v-alert
            v-if="assignError"
            type="error"
            variant="tonal"
            rounded="lg"
            density="compact"
            class="mb-4"
            :text="assignError"
          />

          <div class="d-flex gap-3">
            <v-btn variant="outlined" color="secondary" block @click="assignDialog = false">انصراف</v-btn>
            <v-btn
              color="primary"
              block
              :loading="assigning"
              :disabled="!selectedDriverId || availableDrivers.length === 0"
              @click="doAssign"
            >
              {{ booking?.driver ? 'تغییر راننده' : 'تخصیص راننده' }}
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { formatToman } from '~/utils/currency'
definePageMeta({ layout: 'admin' })

const route    = useRoute()
const { $api } = useNuxtApp()
const config   = useRuntimeConfig()

const booking        = ref<any>(null)
const loading        = ref(true)
const updatingStatus = ref('')
const editingFare    = ref(false)
const newFare        = ref('')
const savingFare     = ref(false)

// ── Driver assignment state ───────────────────────────────────────────────────
const assignDialog       = ref(false)
const assigning          = ref(false)
const assignError        = ref('')
const availableDrivers   = ref<any[]>([])
const loadingAvailable   = ref(false)
const selectedDriverId   = ref('')
const finalFareInput     = ref('')
const driverSearch       = ref('')
const bufferMinutes      = ref(60)

let neshanMap: any  = null
let routeLayerAdded = false

onMounted(async () => {
  await fetchBooking()
  await loadSettings()
  loadNeshanSDK()
})

async function fetchBooking() {
  loading.value = true
  try {
    const { data } = await $api.get(`/bookings/${route.params.id}`)
    booking.value = data
  } finally { loading.value = false }
}

async function loadSettings() {
  try {
    const { data } = await $api.get('/settings')
    const buf = data.find((s: any) => s.key === 'driver_buffer_minutes')
    if (buf) bufferMinutes.value = parseInt(buf.value)
  } catch {}
}

// ── Open assign dialog — fetch available drivers for this time slot ───────────
const openAssignDialog = async () => {
  selectedDriverId.value  = ''
  finalFareInput.value    = ''
  driverSearch.value      = ''
  availableDrivers.value  = []
  assignError.value       = ''
  assignDialog.value      = true
  loadingAvailable.value  = true

  try {
    const { data } = await $api.get('/bookings/available-drivers', {
      params: { scheduledAt: booking.value.scheduledAt },
    })
    // If reassigning, include the currently assigned driver too
    // (they are already "busy" with this booking, so they would be excluded)
    availableDrivers.value = data

    // If current driver exists, add them back to the top of the list
    // so admin can "keep" them while changing fare
    if (booking.value.driver) {
      const alreadyIn = data.find((d: any) => d.id === booking.value.driverId)
      if (!alreadyIn) {
        availableDrivers.value = [booking.value.driver, ...data]
      }
      // Pre-select current driver
      selectedDriverId.value = booking.value.driverId
    }
  } catch {
    availableDrivers.value = []
  } finally {
    loadingAvailable.value = false
  }
}

const filteredAvailableDrivers = computed(() =>
  availableDrivers.value.filter((d) =>
    !driverSearch.value ||
    d.fullName.toLowerCase().includes(driverSearch.value.toLowerCase()) ||
    d.carPlate.toLowerCase().includes(driverSearch.value.toLowerCase()),
  ),
)

const doAssign = async () => {
  assigning.value   = true
  assignError.value = ''
  try {
    const { data } = await $api.patch(`/bookings/${booking.value.id}/assign-driver`, {
      driverId:  selectedDriverId.value,
      finalFare: finalFareInput.value ? parseFloat(finalFareInput.value) : undefined,
    })
    booking.value    = data
    assignDialog.value = false
  } catch (e: any) {
    assignError.value = e.response?.data?.message || 'خطا در تخصیص راننده'
  } finally {
    assigning.value = false
  }
}

// ── Neshan Map ────────────────────────────────────────────────────────────────
const loadNeshanSDK = () => {
  const loadLink = (href: string) => {
    if (document.querySelector(`link[href="${href}"]`)) return
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href
    document.head.appendChild(l)
  }
  const loadScript = (src: string) => new Promise<void>((res) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return }
    const s = document.createElement('script'); s.src = src; s.onload = () => res()
    document.head.appendChild(s)
  })
  loadLink('https://static.neshan.org/sdk/mapboxgl/v1.13.2/neshan-sdk/v1.1.3/index.css')
  Promise.all([
    loadScript('https://static.neshan.org/sdk/mapboxgl/v1.13.2/neshan-sdk/v1.1.3/index.js'),
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/mapbox-polyline/1.2.1/polyline.js'),
  ]).then(initMap)
}

const initMap = () => {
  if (!booking.value) return
  const nmp = (window as any).nmp_mapboxgl
  if (!nmp) return
  neshanMap = new nmp.Map({
    mapType:   nmp.Map.mapTypes.neshanVector,
    container: 'admin-booking-map',
    zoom:      13,
    center:   [booking.value.pickupLng, booking.value.pickupLat],
    mapKey:    config.public.neshanWebKey,
    poi:       true,
    traffic:   false,
  })
  neshanMap.on('load', () => {
    new nmp.Marker({ color: '#4CAF50' }).setLngLat([booking.value.pickupLng,  booking.value.pickupLat]).addTo(neshanMap)
    new nmp.Marker({ color: '#F44336' }).setLngLat([booking.value.dropoffLng, booking.value.dropoffLat]).addTo(neshanMap)
    drawRoute()
  })
}

const drawRoute = async () => {
  if (!booking.value) return
  try {
    const res  = await fetch(
      `https://api.neshan.org/v4/direction?type=car&origin=${booking.value.pickupLat},${booking.value.pickupLng}&destination=${booking.value.dropoffLat},${booking.value.dropoffLng}&alternative=false`,
      { headers: { 'Api-Key': config.public.neshanApiKey } },
    )
    const data = await res.json()
    if (!data.routes?.length) return
    const polylineLib = (window as any).polyline
    const coords: number[][][] = []
    data.routes[0].legs[0].steps.forEach((step: any) => {
      const decoded = polylineLib.decode(step.polyline, 5)
      decoded.forEach((pt: number[]) => pt.reverse())
      coords.push(decoded)
    })
    if (routeLayerAdded) {
      if (neshanMap.getLayer('route-line')) neshanMap.removeLayer('route-line')
      if (neshanMap.getSource('route'))     neshanMap.removeSource('route')
    }
    neshanMap.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'MultiLineString', coordinates: coords } }] } })
    neshanMap.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#F5A623', 'line-width': 5, 'line-opacity': 0.9 } })
    routeLayerAdded = true
    const nmp = (window as any).nmp_mapboxgl
    neshanMap.fitBounds(new nmp.LngLatBounds([booking.value.pickupLng, booking.value.pickupLat], [booking.value.dropoffLng, booking.value.dropoffLat]), { padding: 60 })
  } catch (e) { console.error('Route error', e) }
}

// ── Status ─────────────────────────────────────────────────────────────────────
const statusOrder = ['pending', 'confirmed', 'in_progress', 'completed']

const statusTimeline = [
  { status: 'pending',     label: 'رزرو دریافت شد',    icon: 'mdi-clock-outline',  desc: 'مشتری رزرو را ثبت کرده' },
  { status: 'confirmed',   label: 'راننده تخصیص یافت', icon: 'mdi-check-circle',   desc: 'راننده تأیید و پیامک ارسال شد' },
  { status: 'in_progress', label: 'سفر در جریان است',   icon: 'mdi-car',            desc: 'راننده مشتری را سوار کرده' },
  { status: 'completed',   label: 'سفر پایان یافت',     icon: 'mdi-flag-checkered', desc: 'سفر انجام شد' },
  { status: 'cancelled',   label: 'لغو شده',             icon: 'mdi-close-circle',   desc: 'رزرو لغو شد' },
]

const isStatusDone = (status: string) => {
  if (!booking.value) return false
  if (booking.value.status === 'cancelled') return status === 'cancelled'
  return statusOrder.indexOf(status) <= statusOrder.indexOf(booking.value.status)
}
const timelineDotColor = (status: string) => isStatusDone(status) ? (status === 'cancelled' ? 'error' : 'success') : 'grey'
const statusColor  = (s: string) => ({ pending: 'warning', confirmed: 'info', in_progress: 'primary', completed: 'success', cancelled: 'error' }[s] || 'grey')
const statusIcon   = (s: string) => ({ pending: 'mdi-clock-outline', confirmed: 'mdi-check-circle', in_progress: 'mdi-car', completed: 'mdi-flag-checkered', cancelled: 'mdi-close-circle' }[s] || 'mdi-help-circle')
const statusLabel  = (s: string) => ({ pending: 'در انتظار', confirmed: 'تأیید شده', in_progress: 'در حال سفر', completed: 'انجام شده', cancelled: 'لغو شده' }[s] || s)

const availableActions = computed(() => {
  if (!booking.value) return []
  return ({
    pending:     [{ status: 'cancelled',   label: 'لغو رزرو',      icon: 'mdi-close-circle',  color: 'error' }],
    confirmed:   [{ status: 'in_progress', label: 'شروع سفر',      icon: 'mdi-car',            color: 'primary' }, { status: 'cancelled', label: 'لغو', icon: 'mdi-close-circle', color: 'error' }],
    in_progress: [{ status: 'completed',   label: 'پایان سفر',     icon: 'mdi-flag-checkered', color: 'success' }],
    completed: [], cancelled: [],
  } as any)[booking.value.status] || []
})

const doUpdateStatus = async (status: string) => {
  updatingStatus.value = status
  try {
    const { data } = await $api.patch(`/bookings/${booking.value.id}/status`, { status })
    booking.value = data
  } finally { updatingStatus.value = '' }
}

const openEditFare = () => {
  newFare.value = String(booking.value.finalFare || booking.value.estimatedFare || '')
  editingFare.value = true
}

const saveFare = async () => {
  savingFare.value = true
  try {
    const { data } = await $api.patch(`/bookings/${booking.value.id}/assign-driver`, {
      driverId:  booking.value.driverId,
      finalFare: parseFloat(newFare.value),
    })
    booking.value = data
    editingFare.value = false
  } finally { savingFare.value = false }
}
</script>

<style scoped>
.timeline { display: flex; flex-direction: column; }
.timeline-item { display: flex; align-items: flex-start; gap: 16px; position: relative; padding-bottom: 24px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot { width: 36px; height: 36px; min-width: 36px; border-radius: 50%; background: #f5f5f5; border: 2px solid #e0e0e0; display: flex; align-items: center; justify-content: center; z-index: 1; transition: all 0.3s; }
.timeline-item.done .timeline-dot { background: #E8F5E9; border-color: #4CAF50; }
.timeline-item.active .timeline-dot { background: #FFF8E1; border-color: #F5A623; box-shadow: 0 0 0 4px rgba(245,166,35,0.15); }
.timeline-item.cancelled .timeline-dot { background: #FFEBEE; border-color: #F44336; }
.timeline-line { position: absolute; right: 17px; top: 36px; width: 2px; height: calc(100% - 36px); background: #e0e0e0; }
.timeline-item.done .timeline-line { background: #4CAF50; }
.timeline-content { flex: 1; padding-top: 6px; }
</style>
