<template>
  <div class="booking-page" style="direction: rtl">
    <!-- نقشه نشان (Neshan) -->
    <div id="neshan-map" class="map-container" />

    <!-- نوار جستجو -->
    <div class="map-search pa-3">
      <v-autocomplete
        :model-value="selectedSearchResult"
        :items="searchResults"
        :loading="searchLoading"
        item-title="display_name"
        item-value="display_name"
        placeholder="جستجوی مکان..."
        prepend-inner-icon="mdi-magnify"
        rounded="lg"
        variant="outlined"
        density="compact"
        clearable
        @update:search="handleSearch"
        @update:model-value="selectSearchResult"
      >
        <template #item="{ props: itemProps, item }">
          <v-list-item
            v-bind="itemProps"
            :title="item.raw.display_name"
            :subtitle="item.raw.raw?.address?.city || ''"
          >
            <template #prepend>
              <v-icon size="18" color="primary">mdi-map-marker</v-icon>
            </template>
          </v-list-item>
        </template>
      </v-autocomplete>
    </div>

    <!-- راهنمای نقشه -->
    <div
      v-if="activePin"
      class="map-hint pa-3 d-flex align-center gap-2"
      :style="{
        background: activePin === 'pickup' ? '#4CAF50' : '#F44336',
      }"
    >
      <v-icon color="white" size="18">mdi-cursor-default-click</v-icon>
      <span class="text-white text-body-2 font-weight-medium">
        برای تعیین نقطه <strong>{{ activePin === 'pickup' ? 'سوار شدن' : 'پیاده شدن' }}</strong> روی نقشه کلیک کنید یا جستجو کنید
      </span>
    </div>

    <!-- فرم (پایین سمت چپ) -->
    <div class="form-container">
      <v-card rounded="xl" class="form-card">
        <!-- نشانگر مرحله -->
        <div class="d-flex align-center gap-2 mb-4 px-6 pt-6">
          <div
            v-for="(step, i) in steps"
            :key="i"
            class="d-flex align-center"
          >
            <div
              class="step-dot d-flex align-center justify-center rounded-circle"
              :class="
                currentStep >= i + 1 ? 'bg-primary' : 'bg-grey-lighten-2'
              "
            >
              <v-icon
                :color="currentStep >= i + 1 ? 'white' : 'grey'"
                size="12"
              >
                {{ currentStep > i + 1 ? "mdi-check" : step.icon }}
              </v-icon>
            </div>
            <span
              class="text-caption mr-1"
              :class="
                currentStep >= i + 1
                  ? 'text-primary font-weight-bold'
                  : 'text-grey'
              "
            >
              {{ step.label }}
            </span>
            <v-divider
              v-if="i < steps.length - 1"
              class="mx-2"
              style="max-width: 16px"
            />
          </div>
        </div>

        <!-- مرحله ۱: مکان‌ها -->
        <div v-show="currentStep === 1" class="pa-6">
          <div class="text-subtitle-2 font-weight-bold text-secondary mb-3">
            تعیین مکان‌ها
          </div>
          <div class="d-flex align-center gap-2 mb-2">
            <v-avatar color="success" size="28" rounded="circle">
              <v-icon size="14" color="white">mdi-circle</v-icon>
            </v-avatar>
            <v-text-field
              v-model="form.pickupAddress"
              label="مکان سوار شدن"
              placeholder="برای تعیین روی نقشه کلیک کنید"
              variant="outlined"
              rounded="lg"
              hide-details
              readonly
              density="compact"
              :class="activePin === 'pickup' ? 'field-active' : ''"
              @click="setActivePin('pickup')"
            >
              <template #append-inner>
                <v-btn
                  v-if="form.pickupAddress"
                  icon="mdi-close"
                  size="x-small"
                  variant="text"
                  @click.stop="clearPickup"
                />
              </template>
            </v-text-field>
          </div>
          <div class="connector-line mr-4 my-1" />
          <div class="d-flex align-center gap-2 mb-3">
            <v-avatar color="error" size="28" rounded="circle">
              <v-icon size="14" color="white">mdi-map-marker</v-icon>
            </v-avatar>
            <v-text-field
              v-model="form.dropoffAddress"
              label="مکان پیاده شدن"
              placeholder="برای تعیین روی نقشه کلیک کنید"
              variant="outlined"
              rounded="lg"
              hide-details
              readonly
              density="compact"
              :class="activePin === 'dropoff' ? 'field-active' : ''"
              @click="setActivePin('dropoff')"
            >
              <template #append-inner>
                <v-btn
                  v-if="form.dropoffAddress"
                  icon="mdi-close"
                  size="x-small"
                  variant="text"
                  @click.stop="clearDropoff"
                />
              </template>
            </v-text-field>
          </div>
          <v-alert
            v-if="activePin"
            :color="activePin === 'pickup' ? 'success' : 'error'"
            variant="tonal"
            rounded="lg"
            density="compact"
            class="mb-3"
          >
            <template #prepend
              ><v-icon size="16">mdi-cursor-default-click</v-icon></template
            >
            روی نقشه کلیک کنید یا جستجو کنید
          </v-alert>
          <v-btn
            color="primary"
            size="small"
            block
            :disabled="!form.pickupAddress || !form.dropoffAddress"
            @click="currentStep = 2"
          >
            ادامه <v-icon end size="18">mdi-arrow-left</v-icon>
          </v-btn>
        </div>

        <!-- مرحله ۲: جزئیات سفر -->
        <div v-show="currentStep === 2" class="pa-6">
          <div class="text-subtitle-2 font-weight-bold text-secondary mb-3">
            جزئیات سفر
          </div>
          <v-card color="grey-lighten-5" rounded="lg" class="pa-3 mb-3">
            <div class="d-flex align-start gap-2">
              <div class="d-flex flex-column align-center mt-1">
                <v-icon color="success" size="14">mdi-circle</v-icon>
                <div
                  style="
                    width: 2px;
                    height: 20px;
                    background: #e0e0e0;
                    margin: 2px 0;
                  "
                />
                <v-icon color="error" size="14">mdi-map-marker</v-icon>
              </div>
              <div style="font-size: 12px">
                <div
                  class="text-body-2 font-weight-medium text-secondary mb-2"
                >
                  {{ form.pickupAddress }}
                </div>
                <div class="text-body-2 font-weight-medium text-secondary">
                  {{ form.dropoffAddress }}
                </div>
              </div>
            </div>
            <v-divider class="my-2" />
            <div class="d-flex justify-space-between text-caption">
              <span class="text-grey">مسافت</span>
              <span class="font-weight-bold"
                >{{ form.distanceKm.toFixed(1) }} کیلومتر</span
              >
            </div>
            <div v-if="routeDuration" class="d-flex justify-space-between text-caption mt-1">
              <span class="text-grey">زمان تخمینی</span>
              <span class="font-weight-bold">{{ routeDuration }}</span>
            </div>
          </v-card>

          <v-text-field
            v-model="form.scheduledAt"
            label="تاریخ و زمان سوار شدن"
            type="datetime-local"
            prepend-inner-icon="mdi-calendar-clock"
            :min="minDateTime"
            density="compact"
            class="mb-2"
          />
          <v-select
            v-model="form.passengerCount"
            label="تعداد مسافران"
            :items="[1, 2, 3, 4, 5, 6, 7, 8]"
            prepend-inner-icon="mdi-account-group"
            density="compact"
            class="mb-2"
          />
          <v-textarea
            v-model="form.notes"
            label="یادداشت (اختیاری)"
            prepend-inner-icon="mdi-note-text"
            rows="2"
            density="compact"
            class="mb-3"
          />
          <div class="d-flex gap-2">
            <v-btn
              variant="outlined"
              color="secondary"
              size="small"
              @click="currentStep = 1"
              >بازگشت</v-btn
            >
            <v-btn
              color="primary"
              class="flex-1"
              size="small"
              :disabled="!form.scheduledAt"
              @click="currentStep = 3"
              >مرور</v-btn
            >
          </div>
        </div>

        <!-- مرحله ۳: تأیید -->
        <div v-show="currentStep === 3" class="pa-6">
          <div class="text-subtitle-2 font-weight-bold text-secondary mb-3">
            تأیید رزرو
          </div>
          <v-card color="primary" rounded="lg" class="pa-3 mb-3 text-white">
            <div class="text-caption opacity-80 mb-1">کرایه تخمینی</div>
            <div class="text-h5 font-weight-bold mb-1">
              {{ formatToman(estimatedFare) }}  
            </div>
            <div class="text-caption opacity-70">
                <div class="text-caption opacity-70">{{ form.distanceKm }} کیلومتر × {{ formatToman(farePerKm) }}/کیلومتر</div>
            </div>
          </v-card>
          <v-list lines="one" class="mb-3" density="compact">
            <v-list-item
              v-for="d in bookingSummary"
              :key="d.label"
              :prepend-icon="d.icon"
            >
              <template #title
                ><span class="text-caption text-grey">{{
                  d.label
                }}</span></template
              >
              <template #subtitle
                ><span class="text-caption font-weight-medium text-secondary"
                  >{{ d.value }}</span
                ></template
              >
            </v-list-item>
          </v-list>
          <div class="d-flex gap-2">
            <v-btn
              variant="outlined"
              color="secondary"
              size="small"
              @click="currentStep = 2"
              >بازگشت</v-btn
            >
            <v-btn
              color="primary"
              class="flex-1"
              size="small"
              :loading="submitting"
              @click="submitBooking"
            >
              <v-icon start size="16">mdi-check</v-icon> تأیید
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>

    <!-- راهنمای نقشه -->
    <div class="map-legend pa-2 d-flex gap-3 align-center">
      <div v-if="form.pickupAddress" class="d-flex align-center gap-1">
        <v-icon color="success" size="16">mdi-circle</v-icon>
        <span class="text-caption text-grey">سوار شدن</span>
      </div>
      <div v-if="form.dropoffAddress" class="d-flex align-center gap-1">
        <v-icon color="error" size="16">mdi-map-marker</v-icon>
        <span class="text-caption text-grey">پیاده شدن</span>
      </div>
      <v-spacer />
      <v-btn
        v-if="form.pickupLat && form.dropoffLat"
        size="x-small"
        variant="tonal"
        color="primary"
        prepend-icon="mdi-map-search"
        @click="fitBounds"
      >
        نمایش مسیر
      </v-btn>
    </div>

    <!-- دیالوگ موفقیت -->
    <v-dialog v-model="successDialog" max-width="420" persistent>
      <v-card rounded="xl" class="pa-6 text-center">
        <v-icon color="success" size="72" class="mb-4">mdi-check-circle</v-icon>
        <div class="text-h5 font-weight-bold text-secondary mb-2">
          رزرو تأیید شد!
        </div>
        <div class="text-body-2 text-grey mb-6">
          سفر شما رزرو شد. به محض تعیین راننده پیامک دریافت خواهید کرد.
        </div>
        <v-card color="grey-lighten-5" rounded="lg" class="pa-4 mb-6 text-right">
          <div class="d-flex justify-space-between mb-2">
            <span class="text-caption text-grey">شماره رزرو</span>
            <span class="text-caption font-weight-bold text-secondary"
              >#{{ createdBookingId?.slice(0, 8).toUpperCase() }}</span
            >
          </div>
          <div class="d-flex justify-space-between">
            <span class="text-caption text-grey">کرایه تخمینی</span>
            <span class="text-caption font-weight-bold text-primary"
              >{{ formatToman(estimatedFare) }}</span
            >
          </div>
        </v-card>
        <div class="d-flex gap-3" style="flex-direction: column;">
          <v-btn variant="outlined" color="secondary" to="/client/trips" block
            >مشاهده سفرهای من</v-btn
          >
          <v-btn color="primary" block @click="resetForm">رزرو جدید</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { formatToman } from '~/utils/currency'
definePageMeta({ layout: "client" });

const config = useRuntimeConfig();
const { $api } = useNuxtApp();

// ── متغیرهای نقشه نشان (Neshan) ────────────────────────────────────────────────
let neshanMap: any = null;
let pickupMarker: any = null;
let dropoffMarker: any = null;
let routeLayerAdded = false;

const activePin = ref<"pickup" | "dropoff" | null>("pickup");
const searchQuery = ref("");
const searchResults = ref<any[]>([]);
const searchLoading = ref(false);
const selectedSearchResult = ref("");
const routeDuration = ref("");
let searchTimeout: NodeJS.Timeout;

onMounted(() => {
  loadNeshanSDK();
  fetchFare();
});

// ── بارگذاری SDK نقشه نشان ──────────────────────────────────────────────────────
const loadNeshanSDK = () => {
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

  const loadLink = (href: string) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  };

  loadLink("https://static.neshan.org/sdk/mapboxgl/v1.13.2/neshan-sdk/v1.1.3/index.css");

  Promise.all([
    loadScript("https://static.neshan.org/sdk/mapboxgl/v1.13.2/neshan-sdk/v1.1.3/index.js"),
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/mapbox-polyline/1.2.1/polyline.js"),
  ]).then(initMap);
};

// ── مقداردهی اولیه نقشه ─────────────────────────────────────────────────────────
const initMap = () => {
  const nmp = (window as any).nmp_mapboxgl;
  if (!nmp) return;

  neshanMap = new nmp.Map({
    mapType: nmp.Map.mapTypes.neshanVector,
    container: "neshan-map",
    zoom: 10,
    center: [51.389, 35.6892], // تهران
    minZoom: 2,
    maxZoom: 21,
    trackResize: true,
    mapKey: config.public.neshanWebKey,
    poi: true,
    traffic: false,
  });

  neshanMap.on("load", () => {
    neshanMap.on("click", (e: any) => {
      if (!activePin.value) return;
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;
      reverseGeocode(lat, lng, activePin.value);
    });
  });
};

// ── تبدیل مختصات به آدرس با API نشان ────────────────────────────────────────────
const reverseGeocode = async (
  lat: number,
  lng: number,
  type: "pickup" | "dropoff"
) => {
  try {
    const res = await fetch(
      `https://api.neshan.org/v5/reverse?lat=${lat}&lng=${lng}`,
      { headers: { "Api-Key": config.public.neshanApiKey } }
    );
    const data = await res.json();
    const address = data.formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    if (type === "pickup") {
      form.value.pickupAddress = address;
      form.value.pickupLat = lat;
      form.value.pickupLng = lng;
      setMarker("pickup", lat, lng);
      activePin.value = form.value.dropoffAddress ? null : "dropoff";
    } else {
      form.value.dropoffAddress = address;
      form.value.dropoffLat = lat;
      form.value.dropoffLng = lng;
      setMarker("dropoff", lat, lng);
      activePin.value = null;
    }

    if (form.value.pickupLat && form.value.dropoffLat) {
      await drawRoute();
    }
  } catch (e) {
    console.error("خطا در تبدیل مختصات به آدرس:", e);
  }
};

// ── نشانگرهای نقشه ──────────────────────────────────────────────────────────────
const setMarker = (type: "pickup" | "dropoff", lat: number, lng: number) => {
  const nmp = (window as any).nmp_mapboxgl;
  if (!nmp) return;

  if (type === "pickup") {
    if (pickupMarker) pickupMarker.remove();
    pickupMarker = new nmp.Marker({ color: "#4CAF50" })
      .setLngLat([lng, lat])
      .addTo(neshanMap);
  } else {
    if (dropoffMarker) dropoffMarker.remove();
    dropoffMarker = new nmp.Marker({ color: "#F44336" })
      .setLngLat([lng, lat])
      .addTo(neshanMap);
  }
};

// ── رسم مسیر با API نشان ────────────────────────────────────────────────────────
const drawRoute = async () => {
  try {
    const origin = `${form.value.pickupLat},${form.value.pickupLng}`;
    const destination = `${form.value.dropoffLat},${form.value.dropoffLng}`;

    const res = await fetch(
      `https://api.neshan.org/v4/direction?type=car&origin=${origin}&destination=${destination}&alternative=false`,
      { headers: { "Api-Key": config.public.neshanApiKey } }
    );
    const data = await res.json();

    if (!data.routes?.length) return;

    const route = data.routes[0];
    const leg = route.legs[0];

    // مسافت و زمان
    form.value.distanceKm = leg.distance.value / 1000;
    routeDuration.value = leg.duration.text;

    // رمزگشایی polyline
    const polylineLib = (window as any).polyline;
    const routes: number[][][] = [];

    leg.steps.forEach((step: any) => {
      const decoded = polylineLib.decode(step.polyline, 5);
      decoded.forEach((pt: number[]) => pt.reverse()); // [lat,lng] → [lng,lat]
      routes.push(decoded);
    });

    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "MultiLineString", coordinates: routes },
        },
      ],
    };

    // حذف مسیر قبلی
    if (routeLayerAdded) {
      if (neshanMap.getLayer("neshan-route-line"))
        neshanMap.removeLayer("neshan-route-line");
      if (neshanMap.getSource("neshan-route"))
        neshanMap.removeSource("neshan-route");
    }

    neshanMap.addSource("neshan-route", { type: "geojson", data: geojson });
    neshanMap.addLayer({
      id: "neshan-route-line",
      type: "line",
      source: "neshan-route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "blue", "line-width": 5, "line-opacity": 0.9 },
    });
    routeLayerAdded = true;

    fitBounds();
  } catch (e) {
    console.error("خطا در رسم مسیر:", e);
  }
};

// ── تنظیم نمای نقشه بر روی مسیر ──────────────────────────────────────────────────
const fitBounds = () => {
  if (!form.value.pickupLat || !form.value.dropoffLat || !neshanMap) return;
  const nmp = (window as any).nmp_mapboxgl;
  const bounds = new nmp.LngLatBounds(
    [form.value.pickupLng, form.value.pickupLat],
    [form.value.dropoffLng, form.value.dropoffLat]
  );
  neshanMap.fitBounds(bounds, { padding: 80 });
};

// ── جستجوی مکان با Nominatim ───────────────────────────────────────────────────
// ── جستجوی مکان با API نشان ─────────────────────────────────────────────────────
const handleSearch = async (query: string) => {
  if (!query || query.length < 2) {
    searchResults.value = [];
    return;
  }

  searchLoading.value = true;
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(async () => {
    try {
      const response = await fetch(
        `https://api.neshan.org/v1/search?term=${encodeURIComponent(query)}&lat=35.6892&lng=51.389`,
        { headers: { 'Api-Key': config.public.neshanApiKey } }
      );
      const data = await response.json();
      // Map Neshan search results to a common shape
      searchResults.value = (data.items || []).slice(0, 6).map((item: any) => ({
        display_name: item.title + (item.address?.city ? '، ' + item.address.city : '') + (item.address?.district ? '، ' + item.address.district : ''),
        lat: item.location?.y,
        lon: item.location?.x,
        raw: item,
      }));
    } catch (e) {
      console.error("خطا در جستجو:", e);
      searchResults.value = [];
    } finally {
      searchLoading.value = false;
    }
  }, 500);
};

const selectSearchResult = async (result: string) => {
  if (!result) return;

  const selectedResult = searchResults.value.find(
    (r) => r.display_name === result
  );
  if (!selectedResult || !activePin.value) return;

  const lat = parseFloat(selectedResult.lat);
  const lng = parseFloat(selectedResult.lon);

  await reverseGeocode(lat, lng, activePin.value);

  searchQuery.value = "";
  selectedSearchResult.value = "";
  searchResults.value = [];

  if (neshanMap) {
    neshanMap.setCenter([lng, lat]);
    neshanMap.setZoom(16);
  }
};

// ── وضعیت فرم ───────────────────────────────────────────────────────────────────
const setActivePin = (type: "pickup" | "dropoff") => {
  activePin.value = type;
};

const currentStep = ref(1);
const submitting = ref(false);
const successDialog = ref(false);
const createdBookingId = ref<string | null>(null);
const farePerKm = ref(14000);

const form = ref({
  pickupAddress: "",
  pickupLat: 0,
  pickupLng: 0,
  dropoffAddress: "",
  dropoffLat: 0,
  dropoffLng: 0,
  distanceKm: 0,
  scheduledAt: "",
  passengerCount: 1,
  notes: "",
});

const steps = [
  { label: "مکان‌ها", icon: "mdi-map-marker" },
  { label: "جزئیات", icon: "mdi-calendar" },
  { label: "تأیید", icon: "mdi-check" },
];

const minDateTime = computed(() =>
  new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)
);

const estimatedFare = computed(() =>
  parseFloat(((form.value.distanceKm || 0) * farePerKm.value).toFixed(2))
);

const bookingSummary = computed(() => [
  { label: "سوار شدن", icon: "mdi-circle-outline", value: form.value.pickupAddress },
  { label: "پیاده شدن", icon: "mdi-map-marker", value: form.value.dropoffAddress },
  {
    label: "تاریخ و زمان",
    icon: "mdi-calendar-clock",
    value: form.value.scheduledAt
      ? new Date(form.value.scheduledAt).toLocaleString("fa-IR")
      : "",
  },
  { label: "مسافران", icon: "mdi-account-group", value: `${form.value.passengerCount} نفر` },
]);

const fetchFare = async () => {
  try {
    const { data } = await $api.get("/settings");
    const s = data.find((s: any) => s.key === "fare_per_km");
    if (s) farePerKm.value = parseFloat(s.value);
  } catch {}
};

const clearRoute = () => {
  if (routeLayerAdded && neshanMap) {
    if (neshanMap.getLayer("neshan-route-line"))
      neshanMap.removeLayer("neshan-route-line");
    if (neshanMap.getSource("neshan-route"))
      neshanMap.removeSource("neshan-route");
    routeLayerAdded = false;
  }
  form.value.distanceKm = 0;
  routeDuration.value = "";
};

const clearPickup = () => {
  form.value.pickupAddress = "";
  form.value.pickupLat = 0;
  form.value.pickupLng = 0;
  if (pickupMarker) {
    pickupMarker.remove();
    pickupMarker = null;
  }
  clearRoute();
  activePin.value = "pickup";
};

const clearDropoff = () => {
  form.value.dropoffAddress = "";
  form.value.dropoffLat = 0;
  form.value.dropoffLng = 0;
  if (dropoffMarker) {
    dropoffMarker.remove();
    dropoffMarker = null;
  }
  clearRoute();
  activePin.value = "dropoff";
};

const submitBooking = async () => {
  submitting.value = true;
  try {
    const { data } = await $api.post("/bookings", {
      ...form.value,
      scheduledAt: new Date(form.value.scheduledAt).toISOString(),
    });
    createdBookingId.value = data.id;
    successDialog.value = true;
  } catch (e: any) {
    console.error(e);
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  successDialog.value = false;
  currentStep.value = 1;
  form.value = {
    pickupAddress: "",
    pickupLat: 0,
    pickupLng: 0,
    dropoffAddress: "",
    dropoffLat: 0,
    dropoffLng: 0,
    distanceKm: 0,
    scheduledAt: "",
    passengerCount: 1,
    notes: "",
  };
  if (pickupMarker) {
    pickupMarker.remove();
    pickupMarker = null;
  }
  if (dropoffMarker) {
    dropoffMarker.remove();
    dropoffMarker = null;
  }
  clearRoute();
  activePin.value = "pickup";
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.booking-page {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.map-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

#neshan-map {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.map-search {
  position: absolute;
  top: 12px;
  right: 60px;
  width: 320px;
  z-index: 50;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.map-hint {
  position: absolute;
  top: 0;
  width: 30%;
  right: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 0 0 12px 12px;
}

.form-container {
  position: absolute;
  bottom: 102px;
  left: 12px;
  right: auto;
  z-index: 30;
  max-height: calc(100vh - 100px);
}

.form-card {
  width: 360px;
  max-height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.form-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 12px;
  max-height: calc(100vh - 200px);
}

.form-content::-webkit-scrollbar {
  width: 6px;
}

.form-content::-webkit-scrollbar-track {
  background: transparent;
}

.form-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.map-legend {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border-top: 1px solid #f0f0f0;
  z-index: 20;
}

.step-dot {
  width: 24px;
  height: 24px;
  min-width: 24px;
  transition: background 0.2s;
}

.connector-line {
  width: 2px;
  height: 24px;
  background: #e0e0e0;
  margin-right: 11px;
}

.field-active :deep(.v-field) {
  border-color: #f5a623 !important;
  box-shadow: 0 0 0 2px rgba(245, 166, 35, 0.2);
}

@media (max-width: 600px) {
  .form-card {
    width: 100%;
    max-width: 100%;
  }

  .form-container {
    left: 0;
    right: 0;
    bottom: 0;
  }

  .map-search {
    width: calc(100% - 24px);
    left: 12px;
    right: 12px;
  }
}
</style>