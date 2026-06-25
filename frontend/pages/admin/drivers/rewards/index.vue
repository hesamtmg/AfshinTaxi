<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">مدیریت جوایز رانندگان</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">بررسی و تأیید جوایز در انتظار</p>
      </div>
      <div class="d-flex gap-3">
        <v-btn
          variant="tonal"
          color="primary"
          prepend-icon="mdi-calendar-check"
          :loading="runningMonthly"
          @click="runMonthlyCheck"
        >
          بررسی بهترین ماه
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="showCustomDialog = true"
        >
          جایزه دستی
        </v-btn>
      </div>
    </div>

    <!-- Stats row -->
    <v-row class="mb-6">
      <v-col v-for="stat in stats" :key="stat.label" cols="6" md="3">
        <v-card rounded="lg" variant="tonal" :color="stat.color">
          <v-card-text class="text-center pa-4">
            <div class="text-h4 font-weight-bold">{{ stat.value }}</div>
            <div class="text-body-2 mt-1">{{ stat.label }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tab filter -->
    <v-tabs v-model="activeTab" class="mb-4" color="primary">
      <v-tab value="pending">
        در انتظار تأیید
        <v-chip v-if="pendingCount" class="ms-2" size="x-small" color="warning">
          {{ pendingCount }}
        </v-chip>
      </v-tab>
      <v-tab value="approved">تأییدشده</v-tab>
      <v-tab value="rejected">ردشده</v-tab>
      <v-tab value="all">همه</v-tab>
    </v-tabs>

    <!-- Rewards table -->
    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="filteredRewards"
        :loading="loading"
        no-data-text="جایزه‌ای یافت نشد"
        loading-text="در حال بارگذاری..."
        items-per-page-text="ردیف در صفحه"
      >
        <!-- Icon + Title -->
        <template #item.title="{ item }">
          <div class="d-flex align-center gap-2 py-2">
            <span class="text-h5">{{ item.icon }}</span>
            <div>
              <div class="font-weight-medium">{{ item.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.description }}</div>
            </div>
          </div>
        </template>

        <!-- Type chip -->
        <template #item.type="{ item }">
          <v-chip :color="typeColor(item.type)" size="small" variant="tonal">
            {{ typeLabel(item.type) }}
          </v-chip>
        </template>

        <!-- Status chip -->
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" variant="tonal">
            <v-icon start size="12">{{ statusIcon(item.status) }}</v-icon>
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Date -->
        <template #item.createdAt="{ item }">
          <span class="text-body-2">{{ formatDate(item.createdAt) }}</span>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div v-if="item.status === 'pending_approval'" class="d-flex gap-2">
            <v-btn
              size="small"
              color="success"
              variant="tonal"
              prepend-icon="mdi-check"
              @click="openApprove(item)"
            >
              تأیید
            </v-btn>
            <v-btn
              size="small"
              color="error"
              variant="tonal"
              prepend-icon="mdi-close"
              @click="openReject(item)"
            >
              رد
            </v-btn>
          </div>
          <div v-else class="text-caption text-medium-emphasis">
            {{ item.adminNote || '—' }}
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Approve dialog -->
    <v-dialog v-model="approveDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="pa-6 pb-2">
          <span class="text-h5 me-2">{{ selectedReward?.icon }}</span>
          تأیید جایزه
        </v-card-title>
        <v-card-text class="pa-6 pt-2">
          <p class="text-body-1 mb-4">
            آیا مطمئنید که جایزه <strong>{{ selectedReward?.title }}</strong> را تأیید می‌کنید؟
          </p>
          <v-textarea
            v-model="adminNote"
            label="یادداشت (اختیاری)"
            variant="outlined"
            rows="3"
            placeholder="توضیحات اضافه برای راننده یا سوابق..."
          />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 gap-2">
          <v-btn variant="text" @click="approveDialog = false">انصراف</v-btn>
          <v-spacer />
          <v-btn
            color="success"
            :loading="actionLoading"
            @click="confirmApprove"
          >
            تأیید جایزه
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reject dialog -->
    <v-dialog v-model="rejectDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="pa-6 pb-2">رد جایزه</v-card-title>
        <v-card-text class="pa-6 pt-2">
          <p class="text-body-1 mb-4">
            دلیل رد جایزه <strong>{{ selectedReward?.title }}</strong> را وارد کنید:
          </p>
          <v-textarea
            v-model="adminNote"
            label="دلیل رد"
            variant="outlined"
            rows="3"
            placeholder="مثال: شرایط لازم برای این جایزه کامل نشده است."
          />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-btn variant="text" @click="rejectDialog = false">انصراف</v-btn>
          <v-spacer />
          <v-btn
            color="error"
            :loading="actionLoading"
            @click="confirmReject"
          >
            رد جایزه
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Custom reward dialog -->
    <v-dialog v-model="showCustomDialog" max-width="520">
      <v-card rounded="lg">
        <v-card-title class="pa-6 pb-2">ایجاد جایزه دستی</v-card-title>
        <v-card-text class="pa-6 pt-2">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="customForm.driverId"
                label="شناسه راننده"
                variant="outlined"
                type="number"
              />
            </v-col>
            <v-col cols="9">
              <v-text-field
                v-model="customForm.title"
                label="عنوان جایزه"
                variant="outlined"
                placeholder="مثال: راننده نمونه بهار"
              />
            </v-col>
            <v-col cols="3">
              <v-text-field
                v-model="customForm.icon"
                label="آیکون"
                variant="outlined"
                placeholder="🎖️"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="customForm.description"
                label="توضیحات"
                variant="outlined"
                rows="2"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-btn variant="text" @click="showCustomDialog = false">انصراف</v-btn>
          <v-spacer />
          <v-btn color="primary" :loading="actionLoading" @click="submitCustom">
            ایجاد جایزه
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
const { $api } = useNuxtApp()

definePageMeta({ layout: 'admin'})

// ── State ────────────────────────────────────────────────────────
const loading = ref(false)
const actionLoading = ref(false)
const runningMonthly = ref(false)
const activeTab = ref('pending')
const allRewards = ref<any[]>([])
const approveDialog = ref(false)
const rejectDialog = ref(false)
const showCustomDialog = ref(false)
const selectedReward = ref<any>(null)
const adminNote = ref('')
const snackbar = ref({ show: false, text: '', color: 'success' })
const customForm = ref({ driverId: '', title: '', description: '', icon: '🎖️' })
const config     = useRuntimeConfig()
const authStore  = useAuthStore()
const adminToken = computed(() => authStore.token)
// ── Headers ──────────────────────────────────────────────────────
const headers = [
  { title: 'جایزه', key: 'title', sortable: false },
  { title: 'نوع', key: 'type' },
  { title: 'راننده', key: 'driverId' },
  { title: 'وضعیت', key: 'status' },
  { title: 'تاریخ ایجاد', key: 'createdAt' },
  { title: 'عملیات', key: 'actions', sortable: false },
]

// ── Computed ─────────────────────────────────────────────────────
const filteredRewards = computed(() => {
  if (activeTab.value === 'all') return allRewards.value
  if (activeTab.value === 'pending') return allRewards.value.filter(r => r.status === 'pending_approval')
  return allRewards.value.filter(r => r.status === activeTab.value)
})

const pendingCount = computed(() =>
  allRewards.value.filter(r => r.status === 'pending_approval').length
)

const stats = computed(() => [
  { label: 'در انتظار تأیید', value: allRewards.value.filter(r => r.status === 'pending_approval').length, color: 'warning' },
  { label: 'تأییدشده', value: allRewards.value.filter(r => r.status === 'approved').length, color: 'success' },
  { label: 'ردشده', value: allRewards.value.filter(r => r.status === 'rejected').length, color: 'error' },
  { label: 'مجموع', value: allRewards.value.length, color: 'primary' },
])

// ── Helpers ──────────────────────────────────────────────────────
const typeLabel = (t: string) => ({
  trip_milestone: 'مایلستون سفر',
  high_rating: 'امتیاز بالا',
  monthly_top: 'بهترین ماه',
  custom: 'دستی',
}[t] || t)

const typeColor = (t: string) => ({
  trip_milestone: 'blue',
  high_rating: 'amber',
  monthly_top: 'purple',
  custom: 'teal',
}[t] || 'grey')

const statusLabel = (s: string) => ({
  pending_approval: 'در انتظار',
  approved: 'تأییدشده',
  rejected: 'ردشده',
}[s] || s)

const statusColor = (s: string) => ({
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'error',
}[s] || 'grey')

const statusIcon = (s: string) => ({
  pending_approval: 'mdi-clock-outline',
  approved: 'mdi-check-circle',
  rejected: 'mdi-close-circle',
}[s] || 'mdi-help')

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('fa-IR') : '—'

// ── API calls ────────────────────────────────────────────────────
const fetchRewards = async () => {
  loading.value = true
  try {
    allRewards.value = await $api.get('/rewards/admin/all')
  } catch {
    showSnack('خطا در بارگذاری جوایز', 'error')
  } finally {
    loading.value = false
  }
}

const openApprove = (reward: any) => {
  selectedReward.value = reward
  adminNote.value = ''
  approveDialog.value = true
}

const openReject = (reward: any) => {
  selectedReward.value = reward
  adminNote.value = ''
  rejectDialog.value = true
}

const confirmApprove = async () => {
  actionLoading.value = true
  try {
    await $api.patch(`/rewards/admin/${selectedReward.value.id}/approve`, { note: adminNote.value })
    showSnack('جایزه با موفقیت تأیید شد ✅')
    approveDialog.value = false
    await fetchRewards()
  } catch {
    showSnack('خطا در تأیید جایزه', 'error')
  } finally {
    actionLoading.value = false
  }
}

const confirmReject = async () => {
  actionLoading.value = true
  try {
    await $api.patch(`/rewards/admin/${selectedReward.value.id}/reject`, { note: adminNote.value })
    showSnack('جایزه رد شد')
    rejectDialog.value = false
    await fetchRewards()
  } catch {
    showSnack('خطا در رد جایزه', 'error')
  } finally {
    actionLoading.value = false
  }
}

const submitCustom = async () => {
  actionLoading.value = true
  try {
    await $api.post('/rewards/admin/custom', {
        driverId: Number(customForm.value.driverId),
        title: customForm.value.title,
        description: customForm.value.description,
        icon: customForm.value.icon,
      })
    showSnack('جایزه دستی ایجاد شد و منتظر تأیید است')
    showCustomDialog.value = false
    customForm.value = { driverId: '', title: '', description: '', icon: '🎖️' }
    await fetchRewards()
  } catch {
    showSnack('خطا در ایجاد جایزه', 'error')
  } finally {
    actionLoading.value = false
  }
}

const runMonthlyCheck = async () => {
  runningMonthly.value = true
  try {
    await $api.post('/rewards/admin/run-monthly-check')
    showSnack('بررسی بهترین راننده ماه انجام شد')
    await fetchRewards()
  } catch {
    showSnack('خطا در اجرای بررسی ماهانه', 'error')
  } finally {
    runningMonthly.value = false
  }
}

const showSnack = (text: string, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

onMounted(fetchRewards)
</script>
