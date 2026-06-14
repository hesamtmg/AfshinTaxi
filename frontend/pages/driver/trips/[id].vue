<template>
  <div>
    <!-- بازگشت + هدر -->
    <div class="driver-hero pa-8 mb-6">
      <v-container>
        <div class="d-flex align-center gap-3 mb-2">
          <v-btn
            icon="mdi-arrow-right"
            variant="tonal"
            color="secondary"
            size="small"
            @click="$router.back()"
          />
          <div class="text-overline text-primary font-weight-bold">جزئیات سفر</div>
        </div>
        <div class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div>
            <h1 class="text-h4 font-weight-bold text-secondary">
              سفر #{{ trip?.id?.slice(0, 8).toUpperCase() }}
            </h1>
            <p class="text-body-2 text-grey mt-1">
              {{ trip ? new Date(trip.scheduledAt).toLocaleString('fa-IR') : '' }}
            </p>
          </div>
          <v-chip v-if="trip" :color="statusColor(trip.status)" size="large" label>
            <v-icon start>{{ statusIcon(trip.status) }}</v-icon>
            {{ getStatusText(trip.status).toUpperCase() }}
          </v-chip>
        </div>
      </v-container>
    </div>

    <v-container>
      <!-- در حال بارگذاری -->
      <div v-if="loading" class="d-flex justify-center pa-16">
        <v-progress-circular indeterminate color="primary" size="56" />
      </div>

      <div v-else-if="!trip" class="text-center pa-16">
        <v-icon size="72" color="grey-lighten-2" class="mb-4">mdi-car-off</v-icon>
        <div class="text-h6 text-grey">سفر یافت نشد</div>
        <v-btn class="mt-4" to="/driver/trips" color="primary" variant="tonal">بازگشت به سفرها</v-btn>
      </div>

      <v-row v-else>
        <!-- ستون چپ: نقشه + مسیر -->
        <v-col cols="12" md="7">
          <!-- نقشه -->
          <v-card rounded="xl" class="mb-4" style="overflow:hidden">
            <div ref="mapRef" style="width:100%;height:300px" />
            <div class="pa-4 d-flex align-center gap-3 flex-wrap">
              <div class="d-flex align-center gap-2">
                <v-icon color="success" size="14">mdi-circle</v-icon>
                <span class="text-caption text-grey text-truncate" style="max-width:180px">
                  {{ trip.pickupAddress }}
                </span>
              </div>
              <v-icon size="14" color="grey">mdi-arrow-left</v-icon>
              <div class="d-flex align-center gap-2">
                <v-icon color="error" size="14">mdi-map-marker</v-icon>
                <span class="text-caption text-grey text-truncate" style="max-width:180px">
                  {{ trip.dropoffAddress }}
                </span>
              </div>
            </div>
          </v-card>

          <!-- اطلاعات سفر -->
          <v-card rounded="xl" class="pa-6 mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">اطلاعات سفر</div>
            <v-row>
              <v-col cols="12" sm="6">
                <div class="mb-4">
                  <div class="text-caption text-grey font-weight-bold mb-2">نقطه سوار شدن</div>
                  <div class="d-flex align-start gap-2">
                    <v-icon color="success" size="16" class="mt-0">mdi-circle</v-icon>
                    <div>
                      <div class="text-body-2 font-weight-medium text-secondary">{{ trip.pickupAddress }}</div>
                      <div class="text-caption text-grey mt-1">
                        {{ trip.pickupLat }}, {{ trip.pickupLng }}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div class="text-caption text-grey font-weight-bold mb-2">نقطه پیاده شدن</div>
                  <div class="d-flex align-start gap-2">
                    <v-icon color="error" size="16" class="mt-0">mdi-map-marker</v-icon>
                    <div>
                      <div class="text-body-2 font-weight-medium text-secondary">{{ trip.dropoffAddress }}</div>
                      <div class="text-caption text-grey mt-1">
                        {{ trip.dropoffLat }}, {{ trip.dropoffLng }}
                      </div>
                    </div>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" sm="6">
                <v-list density="compact" class="pa-0">
                  <v-list-item prepend-icon="mdi-calendar-clock" class="px-0">
                    <template #title><span class="text-caption text-grey">زمان رزرو</span></template>
                    <template #subtitle>
                      <span class="font-weight-medium">{{ new Date(trip.scheduledAt).toLocaleString('fa-IR') }}</span>
                    </template>
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
                    <template #title><span class="text-caption text-grey">یادداشت مشتری</span></template>
                    <template #subtitle>{{ trip.notes }}</template>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-card>

          <!-- کمک‌های ناوبری -->
          <v-card rounded="xl" class="pa-5">
            <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">ناوبری</div>
            <div class="d-flex gap-3 flex-wrap">
              <v-btn
                color="success"
                variant="tonal"
                prepend-icon="mdi-google-maps"
                :href="`https://www.google.com/maps/dir/?api=1&origin=${trip.pickupLat},${trip.pickupLng}&destination=${trip.dropoffLat},${trip.dropoffLng}&travelmode=driving`"
                target="_blank"
              >
                باز کردن در گوگل مپ
              </v-btn>
              <v-btn
                color="info"
                variant="tonal"
                prepend-icon="mdi-navigation"
                :href="`https://waze.com/ul?ll=${trip.dropoffLat},${trip.dropoffLng}&navigate=yes`"
                target="_blank"
              >
                باز کردن در Waze
              </v-btn>
            </div>
          </v-card>
        </v-col>

        <!-- ستون راست: مشتری + کرایه -->
        <v-col cols="12" md="5">

          <!-- کارت کرایه -->
          <v-card color="primary" rounded="xl" class="pa-5 mb-4 text-white">
            <div class="text-body-2 opacity-80 mb-1">کرایه سفر</div>
            <div class="text-h2 font-weight-bold mb-1">
              {{ (trip.finalFare || trip.estimatedFare)?.toLocaleString() }} تومان
            </div>
            <div class="text-caption opacity-70 mb-4">
              {{ trip.distanceKm }} کیلومتر
              {{ trip.finalFare ? '· کرایه نهایی تعیین شده توسط ادمین' : '· کرایه تخمینی' }}
            </div>
            <v-divider color="white" opacity="0.2" class="mb-4" />
            <div class="d-flex justify-space-between">
              <div class="text-center">
                <div class="text-h6 font-weight-bold">{{ trip.distanceKm }}</div>
                <div class="text-caption opacity-70">کیلومتر</div>
              </div>
              <div class="text-center">
                <div class="text-h6 font-weight-bold">{{ trip.passengerCount || 1 }}</div>
                <div class="text-caption opacity-70">مسافر</div>
              </div>
              <div class="text-center">
                <div class="text-h6 font-weight-bold">
                  {{ trip.finalFare ? 'نهایی' : 'تخمینی' }}
                </div>
                <div class="text-caption opacity-70">نوع کرایه</div>
              </div>
            </div>
          </v-card>

          <!-- کارت مشتری -->
          <v-card rounded="xl" class="pa-5 mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">مشتری</div>
            <div class="d-flex align-center gap-3 mb-4">
              <v-avatar color="primary" size="52">
                <span class="text-h6 font-weight-bold text-white">
                  {{ trip.user?.fullName?.charAt(0) }}
                </span>
              </v-avatar>
              <div>
                <div class="text-body-1 font-weight-bold text-secondary">{{ trip.user?.fullName }}</div>
                <div class="text-body-2 text-grey">{{ trip.user?.phone }}</div>
              </div>
            </div>

            <!-- دکمه‌های تماس / پیامک -->
            <div class="d-flex gap-3" style="flex-direction: column">
              <v-btn
                color="success"
                variant="tonal"
                prepend-icon="mdi-phone"
                block
                :href="`tel:${trip.user?.phone}`"
              >
                تماس
              </v-btn>
              <v-btn
                color="info"
                variant="tonal"
                prepend-icon="mdi-message"
                block
                :href="`sms:${trip.user?.phone}`"
              >
                پیامک
              </v-btn>
            </div>
          </v-card>

          <!-- زمان‌بندی وضعیت سفر -->
          <v-card rounded="xl" class="pa-5 mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary mb-4">وضعیت سفر</div>
            <div class="timeline">
              <div
                v-for="(step, i) in timeline"
                :key="step.status"
                class="timeline-item"
                :class="{
                  done:      isStatusDone(step.status),
                  active:    trip.status === step.status,
                  cancelled: trip.status === 'cancelled' && step.status === 'cancelled',
                }"
              >
                <div class="timeline-dot">
                  <v-icon size="14" :color="dotColor(step.status)">
                    {{ isStatusDone(step.status) ? 'mdi-check' : step.icon }}
                  </v-icon>
                </div>
                <div v-if="i < timeline.length - 1" class="timeline-line" />
                <div class="timeline-content">
                  <div class="text-body-2 font-weight-bold" :class="isStatusDone(step.status) ? 'text-secondary' : 'text-grey'">
                    {{ step.label }}
                  </div>
                  <div class="text-caption text-grey">{{ step.desc }}</div>
                </div>
              </div>
            </div>
          </v-card>

          <!-- نکات مهم -->
          <v-alert
            type="info"
            variant="tonal"
            rounded="xl"
            class="mb-4"
          >
            <div class="text-body-2 font-weight-bold mb-1">دستورالعمل پرداخت</div>
            <div class="text-caption">
              مبلغ کرایه را به صورت نقدی از مشتری در پایان سفر دریافت کنید.
              مبلغ نشان داده شده {{ trip.finalFare ? 'مبلغ نهایی تعیین شده توسط ادمین است' : 'یک تخمین است - در صورت نیاز با ادمین تأیید کنید' }}.
            </div>
          </v-alert>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'driver' })

const route = useRoute()
const { $api } = useNuxtApp()
const driverStore = useDriverStore()

const trip    = ref<any>(null)
const loading = ref(true)
const mapRef  = ref<HTMLElement | null>(null)
let map: any = null

const getStatusText = (status: string) => ({
  pending: 'در انتظار',
  confirmed: 'تأیید شده',
  in_progress: 'در حال انجام',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده',
}[status] || status)

onMounted(async () => {
  driverStore.hydrate()
  if (!driverStore.isAuthenticated) { navigateTo('/driver/login'); return }
  await fetchTrip()
  await loadMap()
})

async function fetchTrip() {
  loading.value = true
  try {
    const { data } = await $api.get(`/drivers/me/trips/${route.params.id}`, {
      headers: { Authorization: `Bearer ${driverStore.token}` },
    })
    trip.value = data
  } finally { loading.value = false }
}

// ── نقشه ────────────────────────────────────────────────────────────────────────
const loadMap = async () => {
  const L = await import("leaflet");
  if (!mapRef.value || !trip.value) return;

  map = L.map(mapRef.value as HTMLElement, { worldCopyJump: true, renderer: L.canvas() }).setView(
    [trip.value.pickupLat, trip.value.pickupLng],
    13
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "",
  }).addTo(map);

  // نشانگر سوار شدن
  L.circleMarker([trip.value.pickupLat, trip.value.pickupLng], {
    radius: 10,
    fillColor: "#4CAF50",
    color: "#fff",
    weight: 2,
    opacity: 1,
    fillOpacity: 1,
  }).addTo(map).bindTooltip("نقطه سوار شدن", { permanent: true, offset: [0, -15] });

  // نشانگر پیاده شدن
  L.marker([trip.value.dropoffLat, trip.value.dropoffLng], {
    icon: L.divIcon({
      html: `<div style="background:#F44336;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;color:white;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);"><span style="font-size:12px;">📍</span></div>`,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    }),
  }).addTo(map).bindTooltip("نقطه پیاده شدن", { permanent: true, offset: [0, -15] });

  // محاسبه و نمایش مسیر با OSRM
  const url = `https://router.project-osrm.org/route/v1/driving/${trip.value.pickupLng},${trip.value.pickupLat};${trip.value.dropoffLng},${trip.value.dropoffLat}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.routes && data.routes.length > 0) {
    const coordinates = data.routes[0].geometry.coordinates;
    const latlngs = coordinates.map((coord: number[]) => [coord[1], coord[0]]);
    L.polyline(latlngs, { color: 'blue', weight: 4, opacity: 0.9 }).addTo(map);
  }

  // تنظیم نمای نقشه
  const bounds = L.latLngBounds(
    [trip.value.pickupLat, trip.value.pickupLng],
    [trip.value.dropoffLat, trip.value.dropoffLng]
  );
  map.fitBounds(bounds, { padding: [40, 40] });
};

// ── راهنماهای وضعیت ─────────────────────────────────────────────────────────────
const timeline = [
  { status: 'pending',     label: 'اختصاص به شما',   icon: 'mdi-clock-outline',   desc: 'این سفر به شما اختصاص داده شده است' },
  { status: 'confirmed',   label: 'تأیید شده',          icon: 'mdi-check-circle',    desc: 'سفر تأیید شد، به مشتری اطلاع داده شد' },
  { status: 'in_progress', label: 'سفر در حال انجام',   icon: 'mdi-car',             desc: 'مشتری را سوار کردید' },
  { status: 'completed',   label: 'سفر تکمیل شد',     icon: 'mdi-flag-checkered',  desc: 'کرایه دریافت شد، سفر به پایان رسید' },
  { status: 'cancelled',   label: 'لغو شده',          icon: 'mdi-close-circle',    desc: 'سفر لغو شد' },
]

const statusOrder = ['pending', 'confirmed', 'in_progress', 'completed']

const isStatusDone = (status: string) => {
  if (!trip.value) return false
  if (trip.value.status === 'cancelled') return status === 'cancelled'
  return statusOrder.indexOf(status) <= statusOrder.indexOf(trip.value.status)
}

const dotColor = (status: string) => {
  if (isStatusDone(status)) return status === 'cancelled' ? 'error' : 'success'
  return 'grey'
}

const statusColor = (s: string) =>
  ({ pending: 'warning', confirmed: 'info', in_progress: 'primary', completed: 'success', cancelled: 'error' }[s] || 'grey')

const statusIcon = (s: string) =>
  ({ pending: 'mdi-clock-outline', confirmed: 'mdi-check-circle', in_progress: 'mdi-car', completed: 'mdi-flag-checkered', cancelled: 'mdi-close-circle' }[s] || 'mdi-help-circle')
</script>

<style scoped>
.driver-hero { background: linear-gradient(135deg, #fff8ee 0%, #ffffff 100%); border-bottom: 1px solid #f0f0f0; }
.timeline { display: flex; flex-direction: column; }
.timeline-item { display: flex; align-items: flex-start; gap: 14px; position: relative; padding-bottom: 20px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot { width: 32px; height: 32px; min-width: 32px; border-radius: 50%; background: #f5f5f5; border: 2px solid #e0e0e0; display: flex; align-items: center; justify-content: center; z-index: 1; transition: all 0.3s; }
.timeline-item.done .timeline-dot { background: #E8F5E9; border-color: #4CAF50; }
.timeline-item.active .timeline-dot { background: #FFF8E1; border-color: #F5A623; box-shadow: 0 0 0 4px rgba(245,166,35,0.15); }
.timeline-item.cancelled .timeline-dot { background: #FFEBEE; border-color: #F44336; }
.timeline-line { position: absolute; right: 15px; top: 32px; width: 2px; height: calc(100% - 32px); background: #e0e0e0; }
.timeline-item.done .timeline-line { background: #4CAF50; }
.timeline-content { flex: 1; padding-top: 4px; }
</style>