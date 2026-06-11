<template>
  <div>
    <!-- Page Header -->
    <div class="booking-hero pa-8 mb-6">
      <v-container>
        <div class="text-overline text-primary font-weight-bold mb-1">New Booking</div>
        <h1 class="text-h4 font-weight-bold text-secondary">Book Your Ride</h1>
        <p class="text-body-2 text-grey-darken-1 mt-1">
          Select your pickup and dropoff locations on the map
        </p>
      </v-container>
    </div>

    <v-container>
      <v-row>
        <!-- Left: Form -->
        <v-col cols="12" md="5" order="2" order-md="1">
          <v-card rounded="xl" class="pa-6">
            <!-- Step indicator -->
            <div class="d-flex align-center gap-3 mb-6">
              <div v-for="(step, i) in steps" :key="i" class="d-flex align-center">
                <div
                  class="step-dot d-flex align-center justify-center rounded-circle"
                  :class="currentStep >= i + 1 ? 'bg-primary' : 'bg-grey-lighten-2'"
                >
                  <v-icon :color="currentStep >= i + 1 ? 'white' : 'grey'" size="14">
                    {{ currentStep > i + 1 ? 'mdi-check' : step.icon }}
                  </v-icon>
                </div>
                <span class="text-caption ml-1" :class="currentStep >= i + 1 ? 'text-primary font-weight-bold' : 'text-grey'">
                  {{ step.label }}
                </span>
                <v-divider v-if="i < steps.length - 1" class="mx-3" style="max-width:24px" />
              </div>
            </div>

            <!-- Step 1: Locations -->
            <div v-show="currentStep === 1">
              <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">Set Locations</div>
              <div class="d-flex align-center gap-3 mb-2">
                <v-avatar color="success" size="32" rounded="circle">
                  <v-icon size="16" color="white">mdi-circle</v-icon>
                </v-avatar>
                <v-text-field
                  v-model="form.pickupAddress"
                  label="Pickup Location"
                  placeholder="Click on map to set pickup"
                  variant="outlined"
                  rounded="lg"
                  hide-details
                  readonly
                  :class="activePin === 'pickup' ? 'field-active' : ''"
                  @click="setActivePin('pickup')"
                >
                  <template #append-inner>
                    <v-btn v-if="form.pickupAddress" icon="mdi-close" size="x-small" variant="text" @click.stop="clearPickup" />
                  </template>
                </v-text-field>
              </div>
              <div class="connector-line ml-4 my-1" />
              <div class="d-flex align-center gap-3 mb-4">
                <v-avatar color="error" size="32" rounded="circle">
                  <v-icon size="16" color="white">mdi-map-marker</v-icon>
                </v-avatar>
                <v-text-field
                  v-model="form.dropoffAddress"
                  label="Dropoff Location"
                  placeholder="Click on map to set dropoff"
                  variant="outlined"
                  rounded="lg"
                  hide-details
                  readonly
                  :class="activePin === 'dropoff' ? 'field-active' : ''"
                  @click="setActivePin('dropoff')"
                >
                  <template #append-inner>
                    <v-btn v-if="form.dropoffAddress" icon="mdi-close" size="x-small" variant="text" @click.stop="clearDropoff" />
                  </template>
                </v-text-field>
              </div>
              <v-alert v-if="activePin" :color="activePin === 'pickup' ? 'success' : 'error'" variant="tonal" rounded="lg" density="compact" class="mb-4">
                <template #prepend><v-icon size="18">mdi-cursor-default-click</v-icon></template>
                Click the map to set your <strong>{{ activePin }}</strong> location
              </v-alert>
              <v-btn color="primary" size="large" block :disabled="!form.pickupAddress || !form.dropoffAddress" @click="currentStep = 2">
                Continue <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
            </div>

            <!-- Step 2: Trip Details -->
            <div v-show="currentStep === 2">
              <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">Trip Details</div>
              <v-card color="grey-lighten-5" rounded="lg" class="pa-4 mb-4">
                <div class="d-flex align-start gap-3">
                  <div class="d-flex flex-column align-center mt-1">
                    <v-icon color="success" size="16">mdi-circle</v-icon>
                    <div style="width:2px;height:24px;background:#e0e0e0;margin:3px 0" />
                    <v-icon color="error" size="16">mdi-map-marker</v-icon>
                  </div>
                  <div>
                    <div class="text-body-2 font-weight-medium text-secondary mb-3">{{ form.pickupAddress }}</div>
                    <div class="text-body-2 font-weight-medium text-secondary">{{ form.dropoffAddress }}</div>
                  </div>
                </div>
                <v-divider class="my-3" />
                <div class="d-flex justify-space-between text-body-2">
                  <span class="text-grey">Distance</span>
                  <span class="font-weight-bold">{{ form.distanceKm.toFixed(1) }} km</span>
                </div>
              </v-card>
              <v-text-field v-model="form.scheduledAt" label="Pickup Date & Time" type="datetime-local" prepend-inner-icon="mdi-calendar-clock" :min="minDateTime" class="mb-3" />
              <v-select v-model="form.passengerCount" label="Passengers" :items="[1,2,3,4,5,6,7,8]" prepend-inner-icon="mdi-account-group" class="mb-3" />
              <v-textarea v-model="form.notes" label="Notes (optional)" prepend-inner-icon="mdi-note-text" rows="2" auto-grow class="mb-4" />
              <div class="d-flex gap-3">
                <v-btn variant="outlined" color="secondary" @click="currentStep = 1">Back</v-btn>
                <v-btn color="primary" class="flex-1" :disabled="!form.scheduledAt" @click="currentStep = 3">Review Booking</v-btn>
              </div>
            </div>

            <!-- Step 3: Confirm -->
            <div v-show="currentStep === 3">
              <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">Confirm Your Booking</div>
              <v-card color="primary" rounded="xl" class="pa-5 mb-4 text-white">
                <div class="text-body-2 opacity-80 mb-1">Estimated Fare</div>
                <div class="text-h3 font-weight-bold mb-1">${{ estimatedFare.toFixed(2) }}</div>
                <div class="text-caption opacity-70">{{ form.distanceKm.toFixed(1) }} km × ${{ farePerKm }}/km</div>
              </v-card>
              <v-list lines="two" class="mb-4">
                <v-list-item v-for="d in bookingSummary" :key="d.label" :prepend-icon="d.icon" density="compact">
                  <template #title><span class="text-caption text-grey">{{ d.label }}</span></template>
                  <template #subtitle><span class="text-body-2 font-weight-medium text-secondary">{{ d.value }}</span></template>
                </v-list-item>
              </v-list>
              <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4" text="Payment will be collected at the time of your ride." />
              <div class="d-flex gap-3">
                <v-btn variant="outlined" color="secondary" @click="currentStep = 2">Back</v-btn>
                <v-btn color="primary" class="flex-1" size="large" :loading="submitting" @click="submitBooking">
                  <v-icon start>mdi-check</v-icon> Confirm Booking
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>

        <!-- Right: Map -->
        <v-col cols="12" md="7" order="1" order-md="2">
          <v-card rounded="xl" overflow="hidden" style="height:560px;position:sticky;top:80px">
            <div v-if="activePin" class="map-hint pa-3 d-flex align-center gap-2" :style="{ background: activePin === 'pickup' ? '#4CAF50' : '#F44336' }">
              <v-icon color="white" size="18">mdi-cursor-default-click</v-icon>
              <span class="text-white text-body-2 font-weight-medium">
                Click the map to set your <strong>{{ activePin }}</strong> point
              </span>
            </div>
            <div ref="mapRef" style="width:100%;height:100%" />
            <div class="map-legend pa-3 d-flex gap-4 align-center">
              <div v-if="form.pickupAddress" class="d-flex align-center gap-1">
                <v-icon color="success" size="16">mdi-circle</v-icon>
                <span class="text-caption text-grey">Pickup</span>
              </div>
              <div v-if="form.dropoffAddress" class="d-flex align-center gap-1">
                <v-icon color="error" size="16">mdi-map-marker</v-icon>
                <span class="text-caption text-grey">Dropoff</span>
              </div>
              <v-spacer />
              <v-btn v-if="form.pickupLat && form.dropoffLat" size="x-small" variant="tonal" color="primary" prepend-icon="mdi-map-search" @click="fitBounds">
                Fit Route
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Success Dialog -->
    <v-dialog v-model="successDialog" max-width="420" persistent>
      <v-card rounded="xl" class="pa-6 text-center">
        <v-icon color="success" size="72" class="mb-4">mdi-check-circle</v-icon>
        <div class="text-h5 font-weight-bold text-secondary mb-2">Booking Confirmed!</div>
        <div class="text-body-2 text-grey mb-6">
          Your ride has been booked. You'll receive an SMS once a driver is assigned.
        </div>
        <v-card color="grey-lighten-5" rounded="lg" class="pa-4 mb-6 text-left">
          <div class="d-flex justify-space-between mb-2">
            <span class="text-caption text-grey">Booking ID</span>
            <span class="text-caption font-weight-bold text-secondary">#{{ createdBookingId?.slice(0,8).toUpperCase() }}</span>
          </div>
          <div class="d-flex justify-space-between">
            <span class="text-caption text-grey">Est. Fare</span>
            <span class="text-caption font-weight-bold text-primary">${{ estimatedFare.toFixed(2) }}</span>
          </div>
        </v-card>
        <div class="d-flex gap-3">
          <v-btn variant="outlined" color="secondary" to="/client/trips" block>View My Trips</v-btn>
          <v-btn color="primary" block @click="resetForm">New Booking</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">

import 'leaflet/dist/leaflet.css'

definePageMeta({ layout: 'client' })

const config = useRuntimeConfig()
const { $api } = useNuxtApp()

const mapRef = ref<HTMLElement | null>(null)
let map: any = null
let pickupMarker: any = null
let dropoffMarker: any = null
let routePolyline: any = null

const activePin = ref<'pickup' | 'dropoff' | null>('pickup')

onMounted(() => {
  loadMap()
  fetchFare()
})

const loadMap = async () => {
    const L = await import('leaflet')


  if (!mapRef.value) return
  
  // Initialize Leaflet map
  map = L.map(mapRef.value as HTMLElement).setView([35.6892, 51.389], 12)
  
  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)
  
  // Add click listener
  map.on('click', (e: any) => {
    if (!activePin.value) return
    reverseGeocode(e.latlng.lat, e.latlng.lng, activePin.value)
  })
}

const reverseGeocode = async (lat: number, lng: number, type: 'pickup' | 'dropoff') => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lang=fa&format=json&lat=${lat}&lon=${lng}`
    )
    const result = await response.json()
    console.log('Reverse geocode result:', result)
    const address = result.address?.road || result.display_name || `${lat}, ${lng}`
    
    if (type === 'pickup') {
      form.value.pickupAddress = address
      form.value.pickupLat = lat
      form.value.pickupLng = lng
      setPickupMarker(lat, lng)
      activePin.value = form.value.dropoffAddress ? null : 'dropoff'
    } else {
      form.value.dropoffAddress = address
      form.value.dropoffLat = lat
      form.value.dropoffLng = lng
      setDropoffMarker(lat, lng)
      activePin.value = null
    }
    
    if (form.value.pickupLat && form.value.dropoffLat) calculateRoute()
  } catch (e) {
    console.error('Reverse geocode error:', e)
  }
}

const setPickupMarker = (lat: number, lng: number) => {
  if (pickupMarker) map.removeLayer(pickupMarker)
  
  const greenIcon = L.divIcon({
    className: 'pickup-marker',
    html: '<div style="width:24px;height:24px;background:#4CAF50;border:3px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
  
  pickupMarker = L.marker([lat, lng], { icon: greenIcon }).addTo(map)
  pickupMarker.bindPopup('Pickup Location')
}

const setDropoffMarker = (lat: number, lng: number) => {
  if (dropoffMarker) map.removeLayer(dropoffMarker)
  
  const redIcon = L.divIcon({
    className: 'dropoff-marker',
    html: '<div style="width:20px;height:28px;background:#F44336;border-radius:10px 10px 0 0;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);position:relative"><div style="width:8px;height:8px;background:white;border-radius:50%;position:absolute;top:6px;left:6px"></div></div>',
    iconSize: [20, 28],
    iconAnchor: [10, 28],
  })
  
  dropoffMarker = L.marker([lat, lng], { icon: redIcon }).addTo(map)
  dropoffMarker.bindPopup('Dropoff Location')
}

const calculateRoute = async () => {
  try {
    if (routePolyline) map.removeLayer(routePolyline)
    
    // Use OSRM (Open Source Routing Machine) for route calculation
    const url = `https://router.project-osrm.org/route/v1/driving/${form.value.pickupLng},${form.value.pickupLat};${form.value.dropoffLng},${form.value.dropoffLat}?overview=full&geometries=geojson`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      const distance = route.distance / 1000 // Convert to km
      form.value.distanceKm = parseFloat(distance.toFixed(2))
      
      // Draw polyline
      const coordinates = route.geometry.coordinates
      const latlngs = coordinates.map((coord: number[]) => [coord[1], coord[0]])
      
      routePolyline = L.polyline(latlngs, {
        color: '#F5A623',
        weight: 4,
        opacity: 0.9,
        dashArray: '0',
      }).addTo(map)
      
      fitBounds()
    }
  } catch (e) {
    console.error('Route calculation error:', e)
  }
}

const fitBounds = () => {
  if (!form.value.pickupLat || !form.value.dropoffLat || !map) return
  
  const bounds = L.latLngBounds(
    [form.value.pickupLat, form.value.pickupLng],
    [form.value.dropoffLat, form.value.dropoffLng]
  )
  
  map.fitBounds(bounds, { padding: [60, 60] })
}

const setActivePin = (type: 'pickup' | 'dropoff') => {
  activePin.value = type
}

const currentStep = ref(1)
const submitting = ref(false)
const successDialog = ref(false)
const createdBookingId = ref<string | null>(null)
const farePerKm = ref(1.5)

const form = ref({
  pickupAddress: '', pickupLat: 0, pickupLng: 0,
  dropoffAddress: '', dropoffLat: 0, dropoffLng: 0,
  distanceKm: 0, scheduledAt: '', passengerCount: 1, notes: '',
})

const steps = [
  { label: 'Locations', icon: 'mdi-map-marker' },
  { label: 'Details', icon: 'mdi-calendar' },
  { label: 'Confirm', icon: 'mdi-check' },
]

const minDateTime = computed(() => new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16))
const estimatedFare = computed(() => parseFloat(((form.value.distanceKm || 0) * farePerKm.value).toFixed(2)))

const bookingSummary = computed(() => [
  { label: 'Pickup', icon: 'mdi-circle-outline', value: form.value.pickupAddress },
  { label: 'Dropoff', icon: 'mdi-map-marker', value: form.value.dropoffAddress },
  { label: 'Date & Time', icon: 'mdi-calendar-clock', value: form.value.scheduledAt ? new Date(form.value.scheduledAt).toLocaleString() : '' },
  { label: 'Passengers', icon: 'mdi-account-group', value: `${form.value.passengerCount} passenger(s)` },
])

const fetchFare = async () => {
  try {
    const { data } = await $api.get('/settings')
    const s = data.find((s: any) => s.key === 'fare_per_km')
    if (s) farePerKm.value = parseFloat(s.value)
  } catch {}
}

const clearPickup = () => {
  form.value.pickupAddress = ''
  form.value.pickupLat = 0
  form.value.pickupLng = 0
  if (pickupMarker) map.removeLayer(pickupMarker)
  if (routePolyline) map.removeLayer(routePolyline)
  form.value.distanceKm = 0
  activePin.value = 'pickup'
}

const clearDropoff = () => {
  form.value.dropoffAddress = ''
  form.value.dropoffLat = 0
  form.value.dropoffLng = 0
  if (dropoffMarker) map.removeLayer(dropoffMarker)
  if (routePolyline) map.removeLayer(routePolyline)
  form.value.distanceKm = 0
  activePin.value = 'dropoff'
}

const submitBooking = async () => {
  submitting.value = true
  try {
    const { data } = await $api.post('/bookings', { 
      ...form.value, 
      scheduledAt: new Date(form.value.scheduledAt).toISOString() 
    })
    createdBookingId.value = data.id
    successDialog.value = true
  } catch (e: any) {
    console.error(e)
  }
  finally {
    submitting.value = false
  }
}

const resetForm = () => {
  successDialog.value = false
  currentStep.value = 1
  form.value = {
    pickupAddress: '', pickupLat: 0, pickupLng: 0,
    dropoffAddress: '', dropoffLat: 0, dropoffLng: 0,
    distanceKm: 0, scheduledAt: '', passengerCount: 1, notes: ''
  }
  if (pickupMarker) map.removeLayer(pickupMarker)
  if (dropoffMarker) map.removeLayer(dropoffMarker)
  if (routePolyline) map.removeLayer(routePolyline)
  activePin.value = 'pickup'
}
</script>

<style scoped>
.booking-hero { background: linear-gradient(135deg, #fff8ee 0%, #ffffff 100%); border-bottom: 1px solid #f0f0f0; }
.step-dot { width: 28px; height: 28px; min-width: 28px; transition: background 0.2s; }
.connector-line { width: 2px; height: 28px; background: #e0e0e0; margin-left: 11px; }
.field-active :deep(.v-field) { border-color: #F5A623 !important; box-shadow: 0 0 0 2px rgba(245,166,35,0.2); }
.map-hint { position: absolute; top: 0; left: 0; right: 0; z-index: 10; }
.map-legend { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(255,255,255,0.95); backdrop-filter: blur(4px); border-top: 1px solid #f0f0f0; z-index: 10; }
</style>
