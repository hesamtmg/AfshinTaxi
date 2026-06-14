<template>
  <div class="booking-page" style="direction: rtl">
    <!-- نقشه تمام صفحه -->
    <div ref="mapRef" class="map-container" />

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
            :title="item.raw.display_name?.slice(0, 50)"
            :subtitle="`${item.raw.lat}, ${item.raw.lon}`"
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
              class="text-caption ml-1"
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
          <div class="connector-line ml-4 my-1" />
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
              {{ estimatedFare.toLocaleString() }} تومان 
            </div>
            <div class="text-caption opacity-70">
              {{ form.distanceKm.toFixed(1) }} کیلومتر  
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
        <v-card color="grey-lighten-5" rounded="lg" class="pa-4 mb-6 text-left">
          <div class="d-flex justify-space-between mb-2">
            <span class="text-caption text-grey">شماره رزرو</span>
            <span class="text-caption font-weight-bold text-secondary"
              >#{{ createdBookingId?.slice(0, 8).toUpperCase() }}</span
            >
          </div>
          <div class="d-flex justify-space-between">
            <span class="text-caption text-grey">کرایه تخمینی</span>
            <span class="text-caption font-weight-bold text-primary"
              >تومان{{ estimatedFare.toFixed(2) }}</span
            >
          </div>
        </v-card>
        <div class="d-flex gap-3 " style="flex-direction: column;">
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
import "leaflet/dist/leaflet.css";

definePageMeta({ layout: "client" });

const config = useRuntimeConfig();
const { $api } = useNuxtApp();

const mapRef = ref<HTMLElement | null>(null);
let map: any = null;
let pickupMarker: any = null;
let dropoffMarker: any = null;
let routePolyline: any = null;

const activePin = ref<"pickup" | "dropoff" | null>("pickup");
const searchQuery = ref("");
const searchResults = ref<any[]>([]);
const searchLoading = ref(false);
const selectedSearchResult = ref("");
let searchTimeout: NodeJS.Timeout;

onMounted(() => {
  loadMap();
  fetchFare();
});

const loadMap = async () => {
  const L = await import("leaflet");

  if (!mapRef.value) return;

  map = L.map(mapRef.value as HTMLElement, { worldCopyJump: true, renderer: L.canvas() }).setView(
    [35.6892, 51.389],
    12
  );

  const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "",
  }).addTo(map);

  const trafficLayer = L.tileLayer(
    `https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${config.public.tomtomApiKey}`,
    { opacity: 0.8, maxZoom: 22 }
  );

  trafficLayer.addTo(map);

  L.control
    .layers(
      { "OpenStreetMap": osmLayer },
      { "ترافیک": trafficLayer }
    )
    .addTo(map);

  map.on("click", (e: any) => {
    if (!activePin.value) return;
    reverseGeocode(e.latlng.lat, e.latlng.lng, activePin.value);
  });
};

const reverseGeocode = async (
  lat: number,
  lng: number,
  type: "pickup" | "dropoff"
) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?accept-language=fa&format=json&lat=${lat}&lon=${lng}`
    );
    const result = await response.json();
    const address =
      `${result.address?.city || ""} - ${result.address?.neighbourhood || ""} - ${
        result.address?.road || ""
      }` || result.display_name ||
      `${lat}, ${lng}`;

    if (type === "pickup") {
      form.value.pickupAddress = address;
      form.value.pickupLat = lat;
      form.value.pickupLng = lng;
      setPickupMarker(lat, lng);
      activePin.value = form.value.dropoffAddress ? null : "dropoff";
    } else {
      form.value.dropoffAddress = address;
      form.value.dropoffLat = lat;
      form.value.dropoffLng = lng;
      setDropoffMarker(lat, lng);
      activePin.value = null;
    }

    if (form.value.pickupLat && form.value.dropoffLat) calculateRoute();
  } catch (e) {
    console.error("خطا در تبدیل مختصات به آدرس:", e);
  }
};

const setPickupMarker = (lat: number, lng: number) => {
  if (pickupMarker) map.removeLayer(pickupMarker);

  const greenIcon = L.divIcon({
    className: "pickup-marker",
    html: '<div style="width:24px;height:24px;background:#4CAF50;border:3px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  pickupMarker = L.marker([lat, lng], { icon: greenIcon }).addTo(map);
  pickupMarker.bindPopup("نقطه سوار شدن");
};

const setDropoffMarker = (lat: number, lng: number) => {
  if (dropoffMarker) map.removeLayer(dropoffMarker);

  const redIcon = L.divIcon({
    className: "dropoff-marker",
    html: '<div style="width:20px;height:28px;background:#F44336;border-radius:10px 10px 0 0;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);position:relative"><div style="width:8px;height:8px;background:white;border-radius:50%;position:absolute;top:6px;left:6px"></div></div>',
    iconSize: [20, 28],
    iconAnchor: [10, 28],
  });

  dropoffMarker = L.marker([lat, lng], { icon: redIcon }).addTo(map);
  dropoffMarker.bindPopup("نقطه پیاده شدن");
};

const calculateRoute = async () => {
  try {
    if (routePolyline) map.removeLayer(routePolyline);

    const url = `https://router.project-osrm.org/route/v1/driving/${form.value.pickupLng},${form.value.pickupLat};${form.value.dropoffLng},${form.value.dropoffLat}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distance = route.distance / 1000;
      form.value.distanceKm = parseFloat(distance.toFixed(2));

      const coordinates = route.geometry.coordinates;
      const latlngs = coordinates.map((coord: number[]) => [
        coord[1],
        coord[0],
      ]);

      routePolyline = L.polyline(latlngs, {
        color: "blue",
        weight: 4,
        opacity: 0.9,
        dashArray: "0",
      }).addTo(map);

      fitBounds();
    }
  } catch (e) {
    console.error("خطا در محاسبه مسیر:", e);
  }
};

const fitBounds = () => {
  if (!form.value.pickupLat || !form.value.dropoffLat || !map) return;

  const bounds = L.latLngBounds(
    [form.value.pickupLat, form.value.pickupLng],
    [form.value.dropoffLat, form.value.dropoffLng]
  );

  map.fitBounds(bounds, { padding: [60, 60] });
};

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
  { label: "تاریخ و زمان", icon: "mdi-calendar-clock", value: form.value.scheduledAt ? new Date(form.value.scheduledAt).toLocaleString("fa-IR") : "" },
  { label: "مسافران", icon: "mdi-account-group", value: `${form.value.passengerCount} نفر` },
]);

const fetchFare = async () => {
  try {
    const { data } = await $api.get("/settings");
    const s = data.find((s: any) => s.key === "fare_per_km");
    if (s) farePerKm.value = parseFloat(s.value);
  } catch {}
};

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
        `https://nominatim.openstreetmap.org/search?accept-language=fa&format=json&q=${encodeURIComponent(query)}&viewbox=50.5,35.0,52.5,36.0&bounded=1`
      );
      const results = await response.json();
      searchResults.value = results.slice(0, 5);
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

  if (map) {
    map.setView([lat, lng], 16);
  }
};

const clearPickup = () => {
  form.value.pickupAddress = "";
  form.value.pickupLat = 0;
  form.value.pickupLng = 0;
  if (pickupMarker) map.removeLayer(pickupMarker);
  if (routePolyline) map.removeLayer(routePolyline);
  form.value.distanceKm = 0;
  activePin.value = "pickup";
};

const clearDropoff = () => {
  form.value.dropoffAddress = "";
  form.value.dropoffLat = 0;
  form.value.dropoffLng = 0;
  if (dropoffMarker) map.removeLayer(dropoffMarker);
  if (routePolyline) map.removeLayer(routePolyline);
  form.value.distanceKm = 0;
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
  if (pickupMarker) map.removeLayer(pickupMarker);
  if (dropoffMarker) map.removeLayer(dropoffMarker);
  if (routePolyline) map.removeLayer(routePolyline);
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

.map-search {
  position: absolute;
  top: 12px;
  left: 60px;
  right: auto;
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
  left: 0;
  right: 100px;

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
  right: 12px;
  left: auto;
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
    right: 0;
    left: 0;
    bottom: 0;
  }

  .map-search {
    width: calc(100% - 24px);
    left: 12px;
    right: 12px;
  }
}
</style>