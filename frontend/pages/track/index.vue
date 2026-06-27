<template>
  <div class="track-page" style="direction: rtl; min-height: 100vh">
    <div class="track-header pa-5 d-flex align-center justify-space-between">
      <div class="d-flex align-center gap-2">
        <v-icon color="primary" size="28">mdi-taxi</v-icon>
        <span class="text-h6 font-weight-bold text-white">آفشین‌تاکسی</span>
      </div>
      <div class="text-caption text-grey-lighten-1">پیگیری سفر</div>
    </div>

    <v-container style="max-width: 620px" class="py-8">
      <!-- Search -->
      <v-card rounded="xl" class="pa-6 mb-6 search-card">
        <div class="text-center mb-5">
          <v-icon color="primary" size="48" class="mb-3">mdi-map-search</v-icon>
          <div class="text-h5 font-weight-bold text-secondary">
            پیگیری وضعیت سفر
          </div>
          <div class="text-body-2 text-grey mt-2">
            شماره رزرو خود را وارد کنید
          </div>
        </div>
        <v-form @submit.prevent="trackBooking">
          <v-text-field
            v-model="bookingId"
            label="شماره رزرو"
            placeholder="مثال: A1B2C3D4"
            prepend-inner-icon="mdi-identifier"
            variant="outlined"
            rounded="lg"
            :error-messages="searchError"
            clearable
            class="mb-3"
            @input="searchError = ''"
          />
          <v-btn
            type="submit"
            color="primary"
            size="large"
            block
            :loading="searching"
            prepend-icon="mdi-magnify"
          >
            پیگیری سفر
          </v-btn>
        </v-form>
      </v-card>

      <div v-if="booking">
        <!-- Status banner -->
        <v-card rounded="xl" class="mb-4 overflow-hidden result-card">
          <div
            class="status-banner pa-5 d-flex align-center gap-4"
            :style="{ background: statusGradient(booking.status) }"
          >
            <div
              class="d-flex align-center justify-center rounded-xl"
              style="
                width: 56px;
                height: 56px;
                background: rgba(255, 255, 255, 0.2);
                flex-shrink: 0;
              "
            >
              <v-icon color="white" size="28">{{
                statusIcon(booking.status)
              }}</v-icon>
            </div>
            <div class="flex-1">
              <div class="text-white text-h6 font-weight-bold">
                {{ statusLabel(booking.status) }}
              </div>
              <div class="text-white text-caption opacity-80">
                رزرو #{{ booking.id.slice(0, 8).toUpperCase() }}
              </div>
            </div>
            <div
              v-if="booking.status === 'in_progress'"
              class="d-flex align-center gap-2"
            >
              <div class="live-dot" />
              <span class="text-white text-caption opacity-90">زنده</span>
            </div>
          </div>

          <!-- Timeline -->
          <div class="pa-5">
            <div class="timeline">
              <div
                v-for="(step, i) in timeline"
                :key="step.status"
                class="timeline-item"
                :class="{
                  done: isStatusDone(step.status),
                  active: booking.status === step.status,
                  cancelled:
                    booking.status === 'cancelled' &&
                    step.status === 'cancelled',
                }"
              >
                <div class="timeline-dot">
                  <v-icon size="14" :color="dotColor(step.status)">{{
                    isStatusDone(step.status) ? "mdi-check" : step.icon
                  }}</v-icon>
                </div>
                <div v-if="i < timeline.length - 1" class="timeline-line" />
                <div class="timeline-content">
                  <div
                    class="text-body-2 font-weight-bold"
                    :class="
                      isStatusDone(step.status) ? 'text-secondary' : 'text-grey'
                    "
                  >
                    {{ step.label }}
                  </div>
                  <div class="text-caption text-grey">{{ step.desc }}</div>
                </div>
              </div>
            </div>
          </div>
        </v-card>

        <!-- Live map -->
        <v-card
          v-if="showLiveMap"
          rounded="xl"
          class="mb-4 overflow-hidden result-card"
        >
          <div class="pa-4 d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <div class="live-dot" />
              <span class="text-body-2 font-weight-bold text-secondary"
                >موقعیت زنده راننده</span
              >
            </div>
            <v-chip size="x-small" color="success" variant="tonal">
              {{ driverLocation?.isFresh ? "لحظه‌ای پیش" : "چند ثانیه پیش" }}
            </v-chip>
          </div>
          <div id="track-map" style="width: 100%; height: 280px" />
          <div class="pa-3 d-flex align-center gap-4 text-caption text-grey">
            <div class="d-flex align-center gap-1">
              <div
                style="
                  width: 10px;
                  height: 10px;
                  border-radius: 50%;
                  background: #f5a623;
                  border: 2px solid white;
                "
              />
              راننده
            </div>
            <div class="d-flex align-center gap-1">
              <v-icon color="success" size="12">mdi-circle</v-icon> مبدأ
            </div>
            <div class="d-flex align-center gap-1">
              <v-icon color="error" size="12">mdi-map-marker</v-icon> مقصد
            </div>
          </div>
        </v-card>

        <!-- Driver card -->
        <v-card v-if="booking.driver" rounded="xl" class="mb-4 result-card">
          <div class="pa-5">
            <div class="text-caption text-grey font-weight-bold mb-3">
              راننده شما
            </div>
            <div class="d-flex align-center gap-3">
              <v-avatar color="info" size="52">
                <v-img
                  v-if="booking.driver.avatarUrl"
                  :src="avatarSrc(booking.driver.avatarUrl)"
                  cover
                >
                  <template #error
                    ><v-icon color="white" size="28"
                      >mdi-account-tie</v-icon
                    ></template
                  >
                </v-img>
                <v-icon v-else color="white" size="28">mdi-account-tie</v-icon>
              </v-avatar>
              <div class="flex-1">
                <div class="text-body-1 font-weight-bold text-secondary">
                  {{ booking.driver.fullName }}
                </div>
                <div class="d-flex gap-2 mt-1 flex-wrap">
                  <v-chip size="x-small" color="secondary" variant="tonal">
                    <v-icon start size="10">mdi-car</v-icon>
                    {{ booking.driver.carModel }}
                    {{
                      booking.driver.carColor
                        ? `(${booking.driver.carColor})`
                        : ""
                    }}
                  </v-chip>




                 
                </div>

                    <div style="margin-top: 20px">
                      <IranLicensePlate :plate=" booking.driver.carPlate" />
                    </div>


              </div>
            </div>
          </div>
        </v-card>

        <!-- Route + details -->
        <v-card rounded="xl" class="mb-4 result-card">
          <div class="pa-5">
            <div class="text-caption text-grey font-weight-bold mb-3">
              مسیر سفر
            </div>
            <div class="d-flex align-start gap-3 mb-4">
              <div class="d-flex flex-column align-center mt-1">
                <v-icon color="success" size="16">mdi-circle</v-icon>
                <div
                  style="
                    width: 2px;
                    height: 28px;
                    background: #e0e0e0;
                    margin: 3px 0;
                  "
                />
                <v-icon color="error" size="16">mdi-map-marker</v-icon>
              </div>
              <div>
                <div class="text-body-2 font-weight-medium text-secondary mb-3">
                  {{ booking.pickupAddress }}
                </div>
                <div class="text-body-2 font-weight-medium text-secondary">
                  {{ booking.dropoffAddress }}
                </div>
              </div>
            </div>
            <v-divider class="mb-4" />
            <v-row dense>
              <v-col cols="6">
                <div class="text-caption text-grey">زمان سفر</div>
                <div class="text-body-2 font-weight-medium text-secondary">
                  {{
                    new Date(booking.scheduledAt).toLocaleDateString("fa-IR")
                  }}
                </div>
                <div class="text-caption text-secondary">
                  {{
                    new Date(booking.scheduledAt).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }}
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-grey">مسافت</div>
                <div class="text-body-2 font-weight-medium text-secondary">
                  {{ booking.distanceKm }} کیلومتر
                </div>
              </v-col>
              <v-col cols="6" class="mt-3">
                <div class="text-caption text-grey">مسافران</div>
                <div class="text-body-2 font-weight-medium text-secondary">
                  {{ booking.passengerCount || 1 }} نفر
                </div>
              </v-col>
              <v-col cols="6" class="mt-3">
                <div class="text-caption text-grey">کرایه</div>
                <div class="text-body-2 font-weight-bold text-primary">
                  {{ formatToman(booking.finalFare || booking.estimatedFare) }}
                  <span
                    v-if="!booking.finalFare"
                    class="text-caption text-grey font-weight-regular"
                  >
                    (تخمینی)</span
                  >
                </div>
              </v-col>
            </v-row>
          </div>
        </v-card>

        <!-- Refresh -->
        <v-card rounded="xl" class="pa-4 result-card">
          <div class="d-flex align-center justify-space-between">
            <div class="text-caption text-grey">
              آخرین بروزرسانی: {{ lastUpdated }}
              <span v-if="autoRefreshActive" class="text-success mr-1"
                >• خودکار</span
              >
            </div>
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              prepend-icon="mdi-refresh"
              :loading="refreshing"
              @click="refreshStatus"
            >
              بروزرسانی
            </v-btn>
          </div>
        </v-card>
      </div>

      <div class="text-center mt-8">
        <div class="text-caption text-grey">
          برای رزرو سفر جدید
          <a
            href="/auth/login"
            class="text-primary text-decoration-none font-weight-medium"
            >وارد شوید</a
          >
        </div>
      </div>
    </v-container>
  </div>
</template>

<script setup lang="ts">

import IranLicensePlate from "~/components/driver/IranLicensePlate.vue";

import { formatToman } from "~/utils/currency";
definePageMeta({ layout: "public" });


const route = useRoute();
const { $api } = useNuxtApp();
const config = useRuntimeConfig();

const bookingId = ref((route.query.id as string) || "");
const booking = ref<any>(null);
const driverLocation = ref<any>(null);
const searching = ref(false);
const refreshing = ref(false);
const searchError = ref("");
const lastUpdated = ref("");
const autoRefreshActive = ref(false);

let autoRefreshTimer: any = null;
let locationTimer: any = null;
let neshanMap: any = null;
let driverMarker: any = null;
let routeLayerAdded = false;
let mapInitialized = false;

const showLiveMap = computed(
  () =>
    ["confirmed", "in_progress"].includes(booking.value?.status) &&
    booking.value?.driver &&
    driverLocation.value?.hasLocation
);

onMounted(() => {
  if (bookingId.value) trackBooking();
});
onUnmounted(() => {
  clearInterval(autoRefreshTimer);
  clearInterval(locationTimer);
});

// ── Track ──────────────────────────────────────────────────────────────────────
const trackBooking = async () => {
  if (!bookingId.value) return;
  searching.value = true;
  searchError.value = "";
  booking.value = null;
  driverLocation.value = null;
  try {
    const { data } = await $api.get(
      `/bookings/track/${bookingId.value.trim()}`
    );
    booking.value = data;
    lastUpdated.value = now();
    await fetchDriverLocation();
    startAutoRefresh();
  } catch (e: any) {
    searchError.value =
      e.response?.status === 404
        ? "رزروی با این شماره یافت نشد"
        : "خطا در دریافت اطلاعات";
  } finally {
    searching.value = false;
  }
};

const refreshStatus = async () => {
  if (!booking.value) return;
  refreshing.value = true;
  try {
    const { data } = await $api.get(`/bookings/track/${booking.value.id}`);
    booking.value = data;
    lastUpdated.value = now();
    await fetchDriverLocation();
  } catch {
  } finally {
    refreshing.value = false;
  }
};

// ── Driver live location ───────────────────────────────────────────────────────
const fetchDriverLocation = async () => {
  if (
    !booking.value?.driver ||
    !["confirmed", "in_progress"].includes(booking.value.status)
  ) {
    driverLocation.value = null;
    return;
  }
  try {
    const { data } = await $api.get(
      `/drivers/location/booking/${booking.value.id}`
    );
    driverLocation.value = data;
    if (data.hasLocation) {
      await nextTick();
      if (!mapInitialized) loadNeshanSDK();
      else updateDriverMarkerOnMap(data.lat, data.lng);
    }
  } catch {}
};

// ── Auto refresh ───────────────────────────────────────────────────────────────
const startAutoRefresh = () => {
  clearInterval(autoRefreshTimer);
  clearInterval(locationTimer);
  const active = ["pending", "confirmed", "in_progress"];
  if (!active.includes(booking.value?.status)) return;
  autoRefreshActive.value = true;

  autoRefreshTimer = setInterval(async () => {
    await refreshStatus();
    if (!active.includes(booking.value?.status)) {
      clearInterval(autoRefreshTimer);
      clearInterval(locationTimer);
      autoRefreshActive.value = false;
    }
  }, 30000);

  if (["confirmed", "in_progress"].includes(booking.value?.status)) {
    locationTimer = setInterval(() => fetchDriverLocation(), 5000);
  }
};

// ── Neshan Map ─────────────────────────────────────────────────────────────────
const loadNeshanSDK = () => {
  const loadLink = (href: string) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  };
  const loadScript = (src: string) =>
    new Promise<void>((res) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        res();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => res();
      document.head.appendChild(s);
    });
  loadLink(
    "https://static.neshan.org/sdk/mapboxgl/v1.13.2/neshan-sdk/v1.1.3/index.css"
  );
  Promise.all([
    loadScript(
      "https://static.neshan.org/sdk/mapboxgl/v1.13.2/neshan-sdk/v1.1.3/index.js"
    ),
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/mapbox-polyline/1.2.1/polyline.js"
    ),
  ]).then(initMap);
};

const initMap = async () => {
  await nextTick();
  const el = document.getElementById("track-map");
  if (!el || !booking.value) return;
  const nmp = (window as any).nmp_mapboxgl;
  if (!nmp) return;

  // Validate coordinates before using them
  const pLat = parseFloat(booking.value.pickupLat);
  const pLng = parseFloat(booking.value.pickupLng);
  const dLat = parseFloat(booking.value.dropoffLat);
  const dLng = parseFloat(booking.value.dropoffLng);

  // if (isNaN(pLat) || isNaN(pLng)) return // Can't render without pickup coords

  neshanMap = new nmp.Map({
    mapType: nmp.Map.mapTypes.neshanVector,
    container: "track-map",
    zoom: 13,
    center: [pLng, pLat],
    mapKey: config.public.neshanWebKey,
    poi: false,
    traffic: false,
  });

  neshanMap.on("load", async () => {
    mapInitialized = true;

    // Pickup marker — always valid here
    new nmp.Marker({ color: "#4CAF50" })
      .setLngLat([pLng, pLat])
      .addTo(neshanMap);

    // Dropoff marker — only if valid
    if (!isNaN(dLat) && !isNaN(dLng)) {
      new nmp.Marker({ color: "#F44336" })
        .setLngLat([dLng, dLat])
        .addTo(neshanMap);
      await drawRoute();
    }

    if (driverLocation.value?.hasLocation) {
      updateDriverMarkerOnMap(
        driverLocation.value.lat,
        driverLocation.value.lng
      );
    }
  });
};

const drawRoute = async () => {
  if (!booking.value || !neshanMap) return;

  const pLat = parseFloat(booking.value.pickupLat);
  const pLng = parseFloat(booking.value.pickupLng);
  const dLat = parseFloat(booking.value.dropoffLat);
  const dLng = parseFloat(booking.value.dropoffLng);

  // Both endpoints must be valid numbers
  if (isNaN(pLat) || isNaN(pLng) || isNaN(dLat) || isNaN(dLng)) return;

  try {
    const res = await fetch(
      `https://api.neshan.org/v4/direction?type=car&origin=${pLat},${pLng}&destination=${dLat},${dLng}&alternative=false`,
      { headers: { "Api-Key": config.public.neshanApiKey } }
    );
    const data = await res.json();
    if (!data.routes?.length) {
      // No route from API — just fit to the two markers
      fitMapToBounds(pLat, pLng, dLat, dLng);
      return;
    }
    const polylineLib = (window as any).polyline;
    const coords: number[][][] = [];
    data.routes[0].legs[0].steps.forEach((step: any) => {
      const decoded = polylineLib.decode(step.polyline, 5);
      decoded.forEach((pt: number[]) => pt.reverse());
      coords.push(decoded);
    });
    if (routeLayerAdded) {
      if (neshanMap.getLayer("route-line")) neshanMap.removeLayer("route-line");
      if (neshanMap.getSource("route")) neshanMap.removeSource("route");
    }
    neshanMap.addSource("route", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "MultiLineString", coordinates: coords },
          },
        ],
      },
    });
    neshanMap.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#F5A623", "line-width": 4, "line-opacity": 0.8 },
    });
    routeLayerAdded = true;
    fitMapToBounds(pLat, pLng, dLat, dLng);
  } catch (e) {
    console.error("Route error", e);
  }
};

const fitMapToBounds = (
  pLat: number,
  pLng: number,
  dLat: number,
  dLng: number
) => {
  try {
    if (!neshanMap) return;
    const nmp = (window as any).nmp_mapboxgl;
    if (!nmp) return;
    const bounds = new nmp.LngLatBounds([pLng, pLat], [dLng, dLat]);
    neshanMap.fitBounds(bounds, { padding: 50, maxZoom: 16 });
  } catch (e) {
    console.error("fitBounds error", e);
  }
};

const updateDriverMarkerOnMap = (lat: number, lng: number) => {
  if (!neshanMap) return;
  const nmp = (window as any).nmp_mapboxgl;
  if (!nmp) return;

  // Validate
  const latF = parseFloat(String(lat));
  const lngF = parseFloat(String(lng));
  if (isNaN(latF) || isNaN(lngF)) return;

  try {
    if (driverMarker) {
      driverMarker.setLngLat([lngF, latF]);
    } else {
      const el = document.createElement("div");
      el.innerHTML = `<div style="background:#F5A623;border:3px solid white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 14px rgba(0,0,0,0.35);font-size:20px;">🚖</div>`;
      driverMarker = new nmp.Marker({ element: el, anchor: "center" })
        .setLngLat([lngF, latF])
        .addTo(neshanMap);
    }
    if (booking.value?.status === "in_progress") {
      neshanMap.panTo([lngF, latF], { duration: 800 });
    }
  } catch (e) {
    console.error("Marker error", e);
  }
};

watch(showLiveMap, async (val) => {
  if (val && !mapInitialized) {
    await nextTick();
    loadNeshanSDK();
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────────
const now = () =>
  new Date().toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
const avatarSrc = (url: string) =>
  url?.startsWith("http")
    ? url
    : `${config.public.apiBase.replace("/api", "")}${url}`;

const statusOrder = ["pending", "confirmed", "in_progress", "completed"];
const timeline = [
  {
    status: "pending",
    label: "رزرو ثبت شد",
    icon: "mdi-clock-outline",
    desc: "رزرو شما دریافت شد و در حال بررسی است",
  },
  {
    status: "confirmed",
    label: "راننده تخصیص یافت",
    icon: "mdi-check-circle",
    desc: "راننده به سفر شما اختصاص داده شد",
  },
  {
    status: "in_progress",
    label: "سفر در جریان است",
    icon: "mdi-car",
    desc: "راننده شما را سوار کرده و در راه است",
  },
  {
    status: "completed",
    label: "سفر با موفقیت انجام شد",
    icon: "mdi-flag-checkered",
    desc: "به مقصد رسیدید. از سفر لذت بردید!",
  },
  {
    status: "cancelled",
    label: "رزرو لغو شد",
    icon: "mdi-close-circle",
    desc: "این رزرو لغو شده است",
  },
];
const isStatusDone = (s: string) => {
  if (!booking.value) return false;
  if (booking.value.status === "cancelled") return s === "cancelled";
  return statusOrder.indexOf(s) <= statusOrder.indexOf(booking.value.status);
};
const dotColor = (s: string) =>
  isStatusDone(s)
    ? s === "cancelled"
      ? "error"
      : "success"
    : "grey-lighten-1";
const statusLabel = (s: string) =>
  ({
    pending: "در انتظار تأیید",
    confirmed: "راننده تخصیص یافت",
    in_progress: "در حال سفر",
    completed: "سفر انجام شد",
    cancelled: "لغو شده",
  }[s] || s);
const statusIcon = (s: string) =>
  ({
    pending: "mdi-clock-outline",
    confirmed: "mdi-check-circle",
    in_progress: "mdi-car",
    completed: "mdi-flag-checkered",
    cancelled: "mdi-close-circle",
  }[s] || "mdi-help-circle");
const statusGradient = (s: string) =>
  ({
    pending: "linear-gradient(135deg,#FF9800,#F57C00)",
    confirmed: "linear-gradient(135deg,#2196F3,#1565C0)",
    in_progress: "linear-gradient(135deg,#F5A623,#E65100)",
    completed: "linear-gradient(135deg,#4CAF50,#2E7D32)",
    cancelled: "linear-gradient(135deg,#F44336,#B71C1C)",
  }[s] || "linear-gradient(135deg,#9E9E9E,#616161)");
</script>

<style scoped>
.track-page {
  background: linear-gradient(160deg, #0d0d1a 0%, #1a1a2e 60%, #0d0d1a 100%);
}
.track-header {
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.search-card,
.result-card {
  background: white;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3) !important;
}
.status-banner {
  position: relative;
  overflow: hidden;
}
.status-banner::after {
  content: "";
  position: absolute;
  top: -40px;
  left: -40px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}
.live-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4caf50;
  display: inline-block;
  animation: livePulse 1.5s infinite;
}
@keyframes livePulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
    box-shadow: 0 0 0 6px rgba(76, 175, 80, 0);
  }
}
.timeline {
  display: flex;
  flex-direction: column;
}
.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  position: relative;
  padding-bottom: 18px;
}
.timeline-item:last-child {
  padding-bottom: 0;
}
.timeline-dot {
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 50%;
  background: #f5f5f5;
  border: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.timeline-item.done .timeline-dot {
  background: #e8f5e9;
  border-color: #4caf50;
}
.timeline-item.active .timeline-dot {
  background: #fff8e1;
  border-color: #f5a623;
  box-shadow: 0 0 0 4px rgba(245, 166, 35, 0.15);
}
.timeline-item.cancelled .timeline-dot {
  background: #ffebee;
  border-color: #f44336;
}
.timeline-line {
  position: absolute;
  right: 14px;
  top: 30px;
  width: 2px;
  height: calc(100% - 30px);
  background: #e0e0e0;
}
.timeline-item.done .timeline-line {
  background: #4caf50;
}
.timeline-content {
  flex: 1;
  padding-top: 4px;
}
</style>
