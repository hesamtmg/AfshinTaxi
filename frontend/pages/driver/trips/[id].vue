<template>
  <div style="direction: rtl">
    <div class="driver-hero pa-8 mb-6">
      <v-container>
        <div class="d-flex align-center gap-3 mb-2">
          <v-btn icon="mdi-arrow-right" variant="tonal" color="secondary" size="small" @click="$router.back()" />
          <div class="text-overline text-primary font-weight-bold">جزئیات سفر</div>
        </div>
        <div class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div>
            <h1 class="text-h4 font-weight-bold text-secondary">سفر #{{ trip?.id?.slice(0, 8).toUpperCase() }}</h1>
            <p class="text-body-2 text-grey mt-1">{{ trip ? new Date(trip.scheduledAt).toLocaleString('fa-IR') : '' }}</p>
          </div>
          <div class="d-flex align-center gap-2">
            <!-- Live location indicator -->
            <v-chip
              v-if="isTrackingActive"
              color="success"
              size="small"
              variant="tonal"
            >
              <div class="live-dot ml-1" />
              موقعیت ارسال می‌شود
            </v-chip>
            <v-chip v-if="trip" :color="statusColor(trip.status)" size="large" label>
              <v-icon start>{{ statusIcon(trip.status) }}</v-icon>
              {{ statusLabel(trip.status) }}
            </v-chip>
          </div>
        </div>
      </v-container>
    </div>

    <v-container>
      <div v-if="loading" class="d-flex justify-center pa-16">
        <v-progress-circular indeterminate color="primary" size="56" />
      </div>

      <div v-else-if="!trip" class="text-center pa-16">
        <v-icon size="72" color="grey-lighten-2" class="mb-4">mdi-car-off</v-icon>
        <div class="text-h6 text-grey">سفر یافت نشد</div>
        <v-btn class="mt-4" to="/driver/trips" color="primary" variant="tonal">بازگشت به سفرها</v-btn>
      </div>

      <v-row v-else>
        <!-- Left: Map + navigation + info -->
        <v-col cols="12" md="7">

          <!-- Neshan Map -->
          <v-card rounded="xl" class="mb-4" style="overflow:hidden">
            <div id="driver-trip-map" style="width:100%;height:300px" />
            <div class="pa-4 d-flex align-center gap-3 flex-wrap">
              <div class="d-flex align-center gap-2">
                <v-icon color="success" size="14">mdi-circle</v-icon>
                <span class="text-caption text-grey text-truncate" style="max-width:160px">{{ trip.pickupAddress }}</span>
              </div>
              <v-icon size="14" color="grey">mdi-arrow-left</v-icon>
              <div class="d-flex align-center gap-2">
                <v-icon color="error" size="14">mdi-map-marker</v-icon>
                <span class="text-caption text-grey text-truncate" style="max-width:160px">{{ trip.dropoffAddress }}</span>
              </div>
            </div>
          </v-card>

          <!-- Navigation Card -->
          <v-card rounded="xl" class="pa-5 mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">
              <v-icon color="primary" class="ml-2">mdi-navigation</v-icon>
              ناوبری
            </div>

            <!-- Group 1: به مبدأ -->
            <div class="mb-3">
              <div class="d-flex align-center mb-2">
                <v-icon color="success" size="16" class="ml-1">mdi-circle</v-icon>
                <span class="text-caption font-weight-bold text-grey">رفتن به مبدأ</span>
              </div>
              <div class="d-flex gap-2 flex-wrap">
                <v-btn size="small" color="success" variant="tonal" :href="googleMapsUrl('pickup')" target="_blank" prepend-icon="mdi-google-maps">گوگل مپ</v-btn>
                <v-btn size="small" color="info"    variant="tonal" :href="wazeUrl('pickup')"      target="_blank" prepend-icon="mdi-navigation">ویز</v-btn>
                <v-btn size="small" color="primary" variant="tonal" :href="neshanUrl('pickup')"    target="_blank" prepend-icon="mdi-map">نشان</v-btn>
              </div>
            </div>
            <v-divider class="my-3" />

            <!-- Group 2: به مقصد -->
            <div class="mb-3">
              <div class="d-flex align-center mb-2">
                <v-icon color="error" size="16" class="ml-1">mdi-map-marker</v-icon>
                <span class="text-caption font-weight-bold text-grey">رفتن به مقصد</span>
              </div>
              <div class="d-flex gap-2 flex-wrap">
                <v-btn size="small" color="success" variant="tonal" :href="googleMapsUrl('dropoff')" target="_blank" prepend-icon="mdi-google-maps">گوگل مپ</v-btn>
                <v-btn size="small" color="info"    variant="tonal" :href="wazeUrl('dropoff')"       target="_blank" prepend-icon="mdi-navigation">ویز</v-btn>
                <v-btn size="small" color="primary" variant="tonal" :href="neshanUrl('dropoff')"     target="_blank" prepend-icon="mdi-map">نشان</v-btn>
              </div>
            </div>
            <v-divider class="my-3" />

            <!-- Group 3: مسیر کامل -->
            <div>
              <div class="d-flex align-center mb-2">
                <v-icon color="primary" size="16" class="ml-1">mdi-routes</v-icon>
                <span class="text-caption font-weight-bold text-grey">مسیر کامل (مبدأ به مقصد)</span>
              </div>
              <div class="d-flex gap-2 flex-wrap">
                <v-btn size="small" color="success" variant="tonal" :href="googleMapsUrl('full')" target="_blank" prepend-icon="mdi-google-maps">گوگل مپ</v-btn>
                <v-btn size="small" color="info"    variant="tonal" :href="wazeUrl('full')"       target="_blank" prepend-icon="mdi-navigation">ویز</v-btn>
                <v-btn size="small" color="primary" variant="tonal" :href="neshanUrl('full')"     target="_blank" prepend-icon="mdi-map">نشان</v-btn>
              </div>
            </div>
          </v-card>

          <!-- Trip Info -->
          <v-card rounded="xl" class="pa-6 mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">اطلاعات سفر</div>
            <v-row>
              <v-col cols="12" sm="6">
                <div class="mb-4">
                  <div class="text-caption text-grey font-weight-bold mb-2">مبدأ</div>
                  <div class="d-flex align-start gap-2">
                    <v-icon color="success" size="16">mdi-circle</v-icon>
                    <div>
                      <div class="text-body-2 font-weight-medium text-secondary">{{ trip.pickupAddress }}</div>
                      <div class="text-caption text-grey mt-1">{{ trip.pickupLat }}, {{ trip.pickupLng }}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div class="text-caption text-grey font-weight-bold mb-2">مقصد</div>
                  <div class="d-flex align-start gap-2">
                    <v-icon color="error" size="16">mdi-map-marker</v-icon>
                    <div>
                      <div class="text-body-2 font-weight-medium text-secondary">{{ trip.dropoffAddress }}</div>
                      <div class="text-caption text-grey mt-1">{{ trip.dropoffLat }}, {{ trip.dropoffLng }}</div>
                    </div>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" sm="6">
                <v-list density="compact" class="pa-0">
                  <v-list-item prepend-icon="mdi-calendar-clock" class="px-0">
                    <template #title><span class="text-caption text-grey">زمان سفر</span></template>
                    <template #subtitle><span class="font-weight-medium">{{ new Date(trip.scheduledAt).toLocaleString('fa-IR') }}</span></template>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-map-marker-distance" class="px-0">
                    <template #title><span class="text-caption text-grey">مسافت</span></template>
                    <template #subtitle>{{ trip.distanceKm }} کیلومتر</template>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-account-group" class="px-0">
                    <template #title><span class="text-caption text-grey">مسافران</span></template>
                    <template #subtitle>{{ trip.passengerCount || 1 }} نفر</template>
                  </v-list-item>
                  <v-list-item v-if="trip.notes" prepend-icon="mdi-note-text" class="px-0">
                    <template #title><span class="text-caption text-grey">یادداشت</span></template>
                    <template #subtitle>{{ trip.notes }}</template>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-card>
        </v-col>

        <!-- Right: Actions + Fare + Customer + Timeline -->
        <v-col cols="12" md="5">

          <!-- Start trip action -->
          <v-card v-if="trip.status === 'confirmed'" color="primary" rounded="xl" class="pa-5 mb-4">
            <div class="text-white text-body-2 opacity-80 mb-2">مسافر آماده سوار شدن است</div>
            <div class="text-white text-h6 font-weight-bold mb-4">آیا مسافر را سوار کردید؟</div>
            <v-btn color="white" size="large" block :loading="updatingStatus" @click="startTrip">
              <v-icon start color="primary">mdi-car</v-icon>
              <span class="text-primary font-weight-bold">شروع سفر</span>
            </v-btn>
          </v-card>

          <!-- Complete trip action -->
          <v-card v-else-if="trip.status === 'in_progress'" color="success" rounded="xl" class="pa-5 mb-4">
            <div class="text-white text-body-2 opacity-80 mb-2">سفر در حال انجام است</div>
            <div class="text-white text-h6 font-weight-bold mb-4">آیا به مقصد رسیدید؟</div>
            <v-btn color="white" size="large" block :loading="updatingStatus" @click="completeTrip">
              <v-icon start color="success">mdi-flag-checkered</v-icon>
              <span class="text-success font-weight-bold">پایان سفر</span>
            </v-btn>
          </v-card>

          <!-- Completed -->
          <v-card v-else-if="trip.status === 'completed'" color="success" variant="tonal" rounded="xl" class="pa-5 mb-4">
            <div class="d-flex align-center gap-3">
              <v-icon color="success" size="40">mdi-check-circle</v-icon>
              <div>
                <div class="text-body-1 font-weight-bold text-success">سفر با موفقیت انجام شد</div>
                <div class="text-caption text-grey">کرایه از مسافر دریافت شد</div>
              </div>
            </div>
          </v-card>

          <!-- Location tracking status -->
          <v-card
            v-if="['confirmed','in_progress'].includes(trip.status)"
            :color="locationError ? 'error' : 'grey-lighten-5'"
            :variant="locationError ? 'tonal' : 'flat'"
            rounded="xl"
            class="pa-4 mb-4"
          >
            <div class="d-flex align-center gap-3">
              <v-icon :color="isTrackingActive ? 'success' : 'grey'" size="24">
                {{ isTrackingActive ? 'mdi-crosshairs-gps' : 'mdi-crosshairs-off' }}
              </v-icon>
              <div class="flex-1">
                <div class="text-body-2 font-weight-bold" :class="isTrackingActive ? 'text-success' : 'text-grey'">
                  {{ isTrackingActive ? 'ردیابی زنده فعال' : 'ردیابی غیرفعال' }}
                </div>
                <div class="text-caption text-grey">
                  {{ locationError || (isTrackingActive ? 'موقعیت شما هر ۵ ثانیه ارسال می‌شود' : 'دسترسی به GPS لازم است') }}
                </div>
              </div>
              <v-btn
                v-if="!isTrackingActive"
                size="small"
                color="primary"
                variant="tonal"
                @click="startTracking"
              >
                فعال‌سازی
              </v-btn>
            </div>
          </v-card>

          <!-- Fare -->
          <v-card color="secondary" rounded="xl" class="pa-5 mb-4 text-white">
            <div class="text-body-2 opacity-80 mb-1">کرایه سفر</div>
            <div class="text-h2 font-weight-bold text-primary mb-1">{{ formatToman(trip.finalFare || trip.estimatedFare) }}</div>
            <div class="text-caption opacity-70 mb-4">
              {{ trip.distanceKm }} کیلومتر · {{ trip.finalFare ? 'کرایه نهایی' : 'تخمینی' }}
            </div>
            <v-divider color="white" opacity="0.15" class="mb-4" />
            <v-row dense>
              <v-col cols="4" class="text-center">
                <div class="text-h6 font-weight-bold">{{ trip.distanceKm }}</div>
                <div class="text-caption opacity-70">کیلومتر</div>
              </v-col>
              <v-col cols="4" class="text-center">
                <div class="text-h6 font-weight-bold">{{ trip.passengerCount || 1 }}</div>
                <div class="text-caption opacity-70">مسافر</div>
              </v-col>
              <v-col cols="4" class="text-center">
                <div class="text-h6 font-weight-bold">{{ trip.finalFare ? 'نهایی' : 'تخمین' }}</div>
                <div class="text-caption opacity-70">نوع کرایه</div>
              </v-col>
            </v-row>
          </v-card>

          <!-- Customer -->
          <v-card rounded="xl" class="pa-5 mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">مسافر</div>
            <div class="d-flex align-center gap-3 mb-4">
              <v-avatar color="primary" size="52">
                <span class="text-h6 font-weight-bold text-white">{{ trip.user?.fullName?.charAt(0) }}</span>
              </v-avatar>
              <div>
                <div class="text-body-1 font-weight-bold text-secondary">{{ trip.user?.fullName }}</div>
                <div class="text-body-2 text-grey">{{ trip.user?.phone }}</div>
              </div>
            </div>
            <div class="d-flex gap-3">
              <v-btn color="success" variant="tonal" prepend-icon="mdi-phone"   block :href="`tel:${trip.user?.phone}`">تماس</v-btn>
              <v-btn color="info"    variant="tonal" prepend-icon="mdi-message" block :href="`sms:${trip.user?.phone}`">پیامک</v-btn>
            </div>
          </v-card>

          <!-- Timeline -->
          <v-card rounded="xl" class="pa-5 mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">مراحل سفر</div>
            <div class="timeline">
              <div
                v-for="(step, i) in timeline"
                :key="step.status"
                class="timeline-item"
                :class="{ done: isStatusDone(step.status), active: trip.status === step.status, cancelled: trip.status === 'cancelled' && step.status === 'cancelled' }"
              >
                <div class="timeline-dot">
                  <v-icon size="14" :color="dotColor(step.status)">{{ isStatusDone(step.status) ? 'mdi-check' : step.icon }}</v-icon>
                </div>
                <div v-if="i < timeline.length - 1" class="timeline-line" />
                <div class="timeline-content">
                  <div class="text-body-2 font-weight-bold" :class="isStatusDone(step.status) ? 'text-secondary' : 'text-grey'">{{ step.label }}</div>
                  <div class="text-caption text-grey">{{ step.desc }}</div>
                </div>
              </div>
            </div>
          </v-card>

          <v-alert type="info" variant="tonal" rounded="xl">
            <div class="text-body-2 font-weight-bold mb-1">دریافت کرایه</div>
            <div class="text-caption">کرایه را به صورت نقدی از مسافر دریافت کنید.</div>
          </v-alert>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { formatToman } from '~/utils/currency'
definePageMeta({ layout: 'driver' })

const route       = useRoute()
const { $api }    = useNuxtApp()
const driverStore = useDriverStore()
const config      = useRuntimeConfig()

const trip           = ref<any>(null)
const loading        = ref(true)
const updatingStatus = ref(false)
const isTrackingActive = ref(false)
const locationError    = ref('')

let neshanMap: any        = null
let routeLayerAdded       = false
let driverMarker: any     = null
let locationTimer: any    = null
let watchId: number | null = null

onMounted(async () => {
  driverStore.hydrate()
  if (!driverStore.isAuthenticated) { navigateTo('/driver/login'); return }
  await fetchTrip()
  loadNeshanSDK()
})

onUnmounted(() => {
  stopTracking()
})

async function fetchTrip() {
  loading.value = true
  try {
    const { data } = await $api.get(`/drivers/me/trips/${route.params.id}`, {
      headers: { Authorization: `Bearer ${driverStore.token}` },
    })
    trip.value = data
    // Auto-start tracking if trip is active
    if (['confirmed', 'in_progress'].includes(trip.value?.status)) {
      await nextTick()
      startTracking()
    }
  } finally { loading.value = false }
}

// ── Live location tracking ────────────────────────────────────────────────────
const startTracking = () => {
  if (!navigator.geolocation) {
    locationError.value = 'مرورگر شما از GPS پشتیبانی نمی‌کند'
    return
  }

  locationError.value = ''

  // Get initial position immediately
  navigator.geolocation.getCurrentPosition(
    (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude),
    (err) => { locationError.value = 'دسترسی به GPS رد شد' },
    { enableHighAccuracy: true, timeout: 10000 },
  )

  // Then send every 5 seconds
  locationTimer = setInterval(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, timeout: 5000 },
    )
  }, 5000)

  isTrackingActive.value = true
}

const stopTracking = () => {
  if (locationTimer) { clearInterval(locationTimer); locationTimer = null }
  if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null }
  isTrackingActive.value = false
}

const sendLocation = async (lat: number, lng: number) => {
  try {
    await $api.patch('/drivers/me/location', { lat, lng }, {
      headers: { Authorization: `Bearer ${driverStore.token}` },
    })
    // Update driver marker on map
    updateDriverMarker(lat, lng)
  } catch {}
}

const updateDriverMarker = (lat: number, lng: number) => {
  if (!neshanMap) return
  const nmp = (window as any).nmp_mapboxgl
  if (!nmp) return

  if (driverMarker) {
    driverMarker.setLngLat([lng, lat])
  } else {
    // Create taxi-styled marker
    const el = document.createElement('div')
    el.innerHTML = `<div style="
      background:#F5A623;
      border:3px solid white;
      border-radius:50%;
      width:38px;height:38px;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 12px rgba(0,0,0,0.3);
      font-size:18px;
    ">🚖</div>`
    driverMarker = new nmp.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat])
      .addTo(neshanMap)
  }
}

// ── Trip actions ──────────────────────────────────────────────────────────────
const startTrip = async () => {
  updatingStatus.value = true
  try {
    const { data } = await $api.patch(
      `/drivers/me/trips/${trip.value.id}/status`,
      { status: 'in_progress' },
      { headers: { Authorization: `Bearer ${driverStore.token}` } },
    )
    trip.value = { ...trip.value, status: data.status }
    startTracking()
  } catch (e: any) { console.error(e) }
  finally { updatingStatus.value = false }
}

const completeTrip = async () => {
  updatingStatus.value = true
  try {
    const { data } = await $api.patch(
      `/drivers/me/trips/${trip.value.id}/status`,
      { status: 'completed' },
      { headers: { Authorization: `Bearer ${driverStore.token}` } },
    )
    trip.value = { ...trip.value, status: data.status }
    stopTracking()
    await fetchTrip()
  } catch (e: any) { console.error(e) }
  finally { updatingStatus.value = false }
}

// ── Navigation URLs ───────────────────────────────────────────────────────────
const googleMapsUrl = (type: 'pickup' | 'dropoff' | 'full') => {
  if (!trip.value) return '#'
  const { pickupLat, pickupLng, dropoffLat, dropoffLng } = trip.value
  const base = 'https://www.google.com/maps/dir/?api=1&travelmode=driving'
  if (type === 'pickup')  return `${base}&destination=${pickupLat},${pickupLng}`
  if (type === 'dropoff') return `${base}&destination=${dropoffLat},${dropoffLng}`
  return `${base}&origin=${pickupLat},${pickupLng}&destination=${dropoffLat},${dropoffLng}`
}

const wazeUrl = (type: 'pickup' | 'dropoff' | 'full') => {
  if (!trip.value) return '#'
  const { pickupLat, pickupLng, dropoffLat, dropoffLng } = trip.value
  if (type === 'pickup')  return `https://waze.com/ul?ll=${pickupLat},${pickupLng}&navigate=yes`
  if (type === 'dropoff') return `https://waze.com/ul?ll=${dropoffLat},${dropoffLng}&navigate=yes`
  return `https://waze.com/ul?ll=${pickupLat},${pickupLng}&navigate=yes`
}

const neshanUrl = (type: 'pickup' | 'dropoff' | 'full') => {
  if (!trip.value) return '#'
  const { pickupLat, pickupLng, dropoffLat, dropoffLng } = trip.value
  const base = 'https://neshan.org/maps/directions'
  if (type === 'pickup')  return `${base}/?destination=${pickupLat},${pickupLng}`
  if (type === 'dropoff') return `${base}/?destination=${dropoffLat},${dropoffLng}`
  return `${base}/?origin=${pickupLat},${pickupLng}&destination=${dropoffLat},${dropoffLng}`
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
  if (!trip.value) return
  const nmp = (window as any).nmp_mapboxgl
  if (!nmp) return
  neshanMap = new nmp.Map({
    mapType: nmp.Map.mapTypes.neshanVector,
    container: 'driver-trip-map',
    zoom: 13,
    center: [trip.value.pickupLng, trip.value.pickupLat],
    mapKey: config.public.neshanWebKey,
    poi: true, traffic: false,
  })
  neshanMap.on('load', () => {
    new nmp.Marker({ color: '#4CAF50' }).setLngLat([trip.value.pickupLng, trip.value.pickupLat]).addTo(neshanMap)
    new nmp.Marker({ color: '#F44336' }).setLngLat([trip.value.dropoffLng, trip.value.dropoffLat]).addTo(neshanMap)
    drawRoute()
  })
}

const drawRoute = async () => {
  if (!trip.value) return
  try {
    const res = await fetch(
      `https://api.neshan.org/v4/direction?type=car&origin=${trip.value.pickupLat},${trip.value.pickupLng}&destination=${trip.value.dropoffLat},${trip.value.dropoffLng}&alternative=false`,
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
    neshanMap.fitBounds(new nmp.LngLatBounds([trip.value.pickupLng, trip.value.pickupLat], [trip.value.dropoffLng, trip.value.dropoffLat]), { padding: 60 })
  } catch (e) { console.error('Route error', e) }
}

// ── Status helpers ─────────────────────────────────────────────────────────────
const timeline = [
  { status: 'pending',     label: 'تخصیص به شما',    icon: 'mdi-clock-outline',  desc: 'این سفر به شما تخصیص داده شده' },
  { status: 'confirmed',   label: 'تأیید شده',        icon: 'mdi-check-circle',   desc: 'سفر تأیید شد، مسافر مطلع شد' },
  { status: 'in_progress', label: 'در حال سفر',       icon: 'mdi-car',            desc: 'مسافر سوار شده، در حال رفتن' },
  { status: 'completed',   label: 'سفر انجام شد',     icon: 'mdi-flag-checkered', desc: 'کرایه دریافت شد، سفر تمام شد' },
  { status: 'cancelled',   label: 'لغو شده',           icon: 'mdi-close-circle',   desc: 'این سفر لغو شده است' },
]

const statusOrder = ['pending', 'confirmed', 'in_progress', 'completed']
const isStatusDone = (status: string) => {
  if (!trip.value) return false
  if (trip.value.status === 'cancelled') return status === 'cancelled'
  return statusOrder.indexOf(status) <= statusOrder.indexOf(trip.value.status)
}
const dotColor    = (s: string) => isStatusDone(s) ? (s === 'cancelled' ? 'error' : 'success') : 'grey'
const statusColor = (s: string) => ({ pending: 'warning', confirmed: 'info', in_progress: 'primary', completed: 'success', cancelled: 'error' }[s] || 'grey')
const statusIcon  = (s: string) => ({ pending: 'mdi-clock-outline', confirmed: 'mdi-check-circle', in_progress: 'mdi-car', completed: 'mdi-flag-checkered', cancelled: 'mdi-close-circle' }[s] || 'mdi-help-circle')
const statusLabel = (s: string) => ({ pending: 'در انتظار', confirmed: 'تأیید شده', in_progress: 'در حال سفر', completed: 'انجام شده', cancelled: 'لغو شده' }[s] || s)
</script>

<style scoped>
.driver-hero { background: linear-gradient(135deg, #fff8ee 0%, #ffffff 100%); border-bottom: 1px solid #f0f0f0; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #4CAF50; animation: livePulse 1.5s infinite; display: inline-block; }
@keyframes livePulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(1.3); } }
.timeline { display: flex; flex-direction: column; }
.timeline-item { display: flex; align-items: flex-start; gap: 14px; position: relative; padding-bottom: 20px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot { width: 32px; height: 32px; min-width: 32px; border-radius: 50%; background: #f5f5f5; border: 2px solid #e0e0e0; display: flex; align-items: center; justify-content: center; z-index: 1; }
.timeline-item.done .timeline-dot { background: #E8F5E9; border-color: #4CAF50; }
.timeline-item.active .timeline-dot { background: #FFF8E1; border-color: #F5A623; box-shadow: 0 0 0 4px rgba(245,166,35,0.15); }
.timeline-item.cancelled .timeline-dot { background: #FFEBEE; border-color: #F44336; }
.timeline-line { position: absolute; right: 15px; top: 32px; width: 2px; height: calc(100% - 32px); background: #e0e0e0; }
.timeline-item.done .timeline-line { background: #4CAF50; }
.timeline-content { flex: 1; padding-top: 4px; }
</style>
