<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-h5 font-weight-bold">مدیریت امتیازات سفر</h1>
      <p class="text-body-2 text-medium-emphasis mt-1">
        مشاهده، پنهان‌سازی و حذف نظرات مشتریان
      </p>
    </div>

    <!-- Stats -->
    <v-row class="mb-6">
      <v-col cols="6" md="3">
        <v-card rounded="lg" variant="tonal" color="primary">
          <v-card-text class="text-center pa-4">
            <div class="text-h4 font-weight-bold">
              {{ stats?.totalRatings }}
            </div>
            <div class="text-body-2 mt-1">مجموع امتیازات</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card rounded="lg" variant="tonal" color="amber">
          <v-card-text class="text-center pa-4">
            <div
              class="text-h4 font-weight-bold d-flex align-center justify-center gap-1"
            >
              {{ stats?.averageOverall }}
              <v-icon size="24" color="amber">mdi-star</v-icon>
            </div>
            <div class="text-body-2 mt-1">میانگین کل</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card rounded="lg" variant="tonal" color="error">
          <v-card-text class="text-center pa-4">
            <div class="text-h4 font-weight-bold">{{ stats?.hiddenCount }}</div>
            <div class="text-body-2 mt-1">پنهان‌شده</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card rounded="lg" variant="tonal" color="success">
          <v-card-text class="text-center pa-4">
            <div class="text-h4 font-weight-bold">{{ stats?.recentCount }}</div>
            <div class="text-body-2 mt-1">۳۰ روز اخیر</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Distribution bar -->
    <v-card rounded="lg" class="mb-6 pa-5">
      <div class="text-body-2 font-weight-bold mb-4">توزیع امتیازات</div>
      <div class="d-flex flex-column gap-2">
        <div
          v-for="star in [5, 4, 3, 2, 1]"
          :key="star"
          class="d-flex align-center gap-3"
        >
          <div class="d-flex align-center gap-1" style="width: 60px">
            <span class="text-body-2">{{ star }}</span>
            <v-icon size="14" color="amber">mdi-star</v-icon>
          </div>
          <v-progress-linear
            :model-value="distPercent(star)"
            color="amber"
            height="10"
            rounded
            class="flex-grow-1"
          />
          <span
            class="text-caption text-medium-emphasis"
            style="width: 30px; text-align: left"
          >
            {{ stats?.distribution?.[star] || 0 }}
          </span>
        </div>
      </div>
    </v-card>

    <!-- Filters -->
    <v-card rounded="lg" class="mb-4 pa-4">
      <v-row align="center" dense>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.driverId"
            label="شناسه راننده"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            type="number"
          />
        </v-col>
        <v-col cols="6" md="2">
          <v-select
            v-model="filters.minStars"
            :items="starOptions"
            label="حداقل ستاره"
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="6" md="2">
          <v-select
            v-model="filters.maxStars"
            :items="starOptions"
            label="حداکثر ستاره"
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.isVisible"
            :items="visibilityOptions"
            item-title="label"
            item-value="value"
            label="وضعیت نمایش"
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-btn block color="primary" variant="tonal" @click="fetchRatings">
            اعمال فیلتر
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Table -->
    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="ratings"
        :loading="loading"
        no-data-text="امتیازی یافت نشد"
        loading-text="در حال بارگذاری..."
        items-per-page-text="ردیف در صفحه"
      >
        <!-- Stars -->
        <template #item.stars="{ item }">
          <div class="d-flex align-center gap-1 py-2">
            <v-icon
              v-for="i in 5"
              :key="i"
              size="16"
              :color="i <= item.stars ? 'amber' : 'grey-lighten-3'"
            >
              mdi-star
            </v-icon>
            <span class="text-caption ms-1 font-weight-bold">{{
              item.stars
            }}</span>
          </div>
        </template>

        <!-- Comment -->
        <template #item.comment="{ item }">
          <span class="text-body-2">{{ item.comment || "—" }}</span>
        </template>

        <!-- Visibility -->
        <template #item.isVisible="{ item }">
          <v-chip
            :color="item.isVisible ? 'success' : 'error'"
            size="small"
            variant="tonal"
          >
            <v-icon start size="12">
              {{ item.isVisible ? "mdi-eye" : "mdi-eye-off" }}
            </v-icon>
            {{ item.isVisible ? "نمایش" : "پنهان" }}
          </v-chip>
        </template>

        <!-- Date -->
        <template #item.createdAt="{ item }">
          <span class="text-body-2">{{ formatDate(item.createdAt) }}</span>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-tooltip v-if="item.isVisible" text="پنهان کردن" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-eye-off"
                  size="small"
                  variant="text"
                  color="warning"
                  @click="openHide(item)"
                />
              </template>
            </v-tooltip>
            <v-tooltip v-else text="بازگردانی" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  color="success"
                  @click="restoreRating(item.id)"
                />
              </template>
            </v-tooltip>
            <v-tooltip text="حذف دائمی" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="deleteRating(item.id)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Hide dialog -->
    <v-dialog v-model="hideDialog" max-width="440">
      <v-card rounded="lg">
        <v-card-title class="pa-6 pb-2">پنهان کردن امتیاز</v-card-title>
        <v-card-text class="pa-6 pt-2">
          <p class="mb-4 text-body-2">
            این امتیاز از میانگین راننده حذف می‌شود و برای عموم نمایش داده
            نخواهد شد.
          </p>
          <v-textarea
            v-model="hideNote"
            label="دلیل پنهان‌سازی (اختیاری)"
            variant="outlined"
            rows="2"
          />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-btn variant="text" @click="hideDialog = false">انصراف</v-btn>
          <v-spacer />
          <v-btn color="warning" :loading="actionLoading" @click="confirmHide">
            پنهان کردن
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
const { $api } = useNuxtApp();

definePageMeta({ layout: "admin" });

// ── State ────────────────────────────────────────────────────────
const loading = ref(false);
const actionLoading = ref(false);
const ratings = ref<any[]>([]);
const stats = ref<any>({
  totalRatings: 0,
  averageOverall: 0,
  distribution: {},
  hiddenCount: 0,
  recentCount: 0,
});
const hideDialog = ref(false);
const selectedRating = ref<any>(null);
const hideNote = ref("");
const snackbar = ref({ show: false, text: "", color: "success" });

const filters = ref({
  driverId: "",
  minStars: null,
  maxStars: null,
  isVisible: null,
});

const starOptions = [1, 2, 3, 4, 5];
const visibilityOptions = [
  { label: "همه", value: null },
  { label: "نمایش‌داده‌شده", value: "true" },
  { label: "پنهان‌شده", value: "false" },
];

const headers = [
  { title: "شناسه سفر", key: "booking.dropoffAddress", width: 100 },
  { title: "مشتری", key: "user.fullName", width: 90 },
  { title: "راننده", key: "driver.fullName", width: 90 },
  { title: "امتیاز", key: "stars" },
  { title: "نظر", key: "comment" },
  { title: "وضعیت", key: "isVisible" },
  { title: "تاریخ", key: "createdAt" },
  { title: "عملیات", key: "actions", sortable: false },
];

// ── Computed ─────────────────────────────────────────────────────
const distPercent = (star: number) => {
  const total = Object.values(stats.value.distribution || {}).reduce(
    (a: number, b: any) => a + b,
    0
  ) as number;
  return total
    ? Math.round(((stats.value.distribution?.[star] || 0) / total) * 100)
    : 0;
};

// ── API ──────────────────────────────────────────────────────────
const fetchStats = async () => {
  try {
    const { data } = await $api.get("/ratings/admin/stats");

    stats.value = data;
  } catch {}
};

const fetchRatings = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (filters.value.driverId) params.set("driverId", filters.value.driverId);
    if (filters.value.minStars)
      params.set("minStars", String(filters.value.minStars));
    if (filters.value.maxStars)
      params.set("maxStars", String(filters.value.maxStars));
    if (filters.value.isVisible !== null)
      params.set("isVisible", String(filters.value.isVisible));

    const { data } = await $api.get(`/ratings/admin/all?${params.toString()}`);
    ratings.value = data;
  } catch {
    showSnack("خطا در بارگذاری امتیازات", "error");
  } finally {
    loading.value = false;
  }
};

const openHide = (r: any) => {
  selectedRating.value = r;
  hideNote.value = "";
  hideDialog.value = true;
};

const confirmHide = async () => {
  actionLoading.value = true;
  try {
    await $api.patch(`/ratings/admin/${selectedRating.value.id}/hide`, { note: hideNote.value });
    showSnack("امتیاز پنهان شد");
    hideDialog.value = false;
    await Promise.all([fetchRatings(), fetchStats()]);
  } catch {
    showSnack("خطا در پنهان‌سازی", "error");
  } finally {
    actionLoading.value = false;
  }
};

const restoreRating = async (id: number) => {
  try {
    await $api.patch(`/ratings/admin/${id}/restore`);
    showSnack("امتیاز بازگردانده شد ✅");
    await Promise.all([fetchRatings(), fetchStats()]);
  } catch {
    showSnack("خطا در بازگردانی", "error");
  }
};

const deleteRating = async (id: number) => {
  if (!confirm("این امتیاز به طور دائمی حذف می‌شود. مطمئنید؟")) return;
  try {
    await $api.delete(`/ratings/admin/${id}`);
    showSnack("امتیاز حذف شد");
    await Promise.all([fetchRatings(), fetchStats()]);
  } catch {
    showSnack("خطا در حذف", "error");
  }
};

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("fa-IR") : "—";
const showSnack = (text: string, color = "success") => {
  snackbar.value = { show: true, text, color };
};

onMounted(() => {
  fetchRatings();
  fetchStats();
});
</script>
