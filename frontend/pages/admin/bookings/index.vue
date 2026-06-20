<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <div class="text-h5 font-weight-bold text-secondary">رزروها</div>
        <div class="text-body-2 text-grey">مدیریت همه رزروهای مشتریان</div>
      </div>
    </div>

    <v-card rounded="xl" class="mb-4 pa-1">
      <v-tabs v-model="statusFilter" color="primary" show-arrows>
        <v-tab v-for="tab in statusTabs" :key="tab.value" :value="tab.value" class="text-caption">
          <v-icon start size="16">{{ tab.icon }}</v-icon>
          {{ tab.label }}
          <v-chip size="x-small" :color="tab.color" class="ml-1">{{ statusCount(tab.value) }}</v-chip>
        </v-tab>
      </v-tabs>
    </v-card>

    <v-card rounded="xl" class="pa-0">
      <v-data-table
        :headers="headers"
        :items="filteredBookings"
        :loading="bookingsStore.loading"
        :search="search"
        hover
        @click:row="(_, { item }) => openDetail(item)"
      >
        <template #top>
          <div class="pa-4 d-flex align-center gap-3">
            <v-text-field
              v-model="search"
              placeholder="جستجوی رزروها..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              rounded="lg"
              hide-details
              density="compact"
              style="max-width:320px"
            />
            <v-spacer />
            <v-btn variant="tonal" color="primary" prepend-icon="mdi-refresh" @click="bookingsStore.fetchAllBookings()">بروزرسانی</v-btn>
          </div>
        </template>

        <template #item.user.fullName="{ item }">
          <div class="d-flex align-center gap-2 py-2">
            <v-avatar color="primary" size="32">
              <span class="text-caption font-weight-bold text-white">{{ item.user?.fullName?.charAt(0) }}</span>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">{{ item.user?.fullName }}</div>
              <div class="text-caption text-grey">{{ item.user?.phone }}</div>
            </div>
          </div>
        </template>

        <template #item.pickupAddress="{ item }">
          <div class="py-2" style="max-width:200px">
            <div class="d-flex align-center gap-1 mb-1">
              <v-icon color="success" size="10">mdi-circle</v-icon>
              <span class="text-caption text-truncate">{{ item.pickupAddress }}</span>
            </div>
            <div class="d-flex align-center gap-1">
              <v-icon color="error" size="10">mdi-map-marker</v-icon>
              <span class="text-caption text-truncate">{{ item.dropoffAddress }}</span>
            </div>
          </div>
        </template>

        <template #item.scheduledAt="{ item }">
          <div class="text-body-2">{{ new Date(item.scheduledAt).toLocaleDateString() }}</div>
          <div class="text-caption text-grey">{{ new Date(item.scheduledAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }}</div>
        </template>

        <template #item.driver="{ item }">
          <v-chip v-if="item.driver" size="small" color="info" variant="tonal">
            <v-icon start size="12">mdi-account</v-icon>{{ item.driver.fullName }}
          </v-chip>
          <v-chip v-else size="small" color="warning" variant="tonal">اختصاص نیافته</v-chip>
        </template>

        <template #item.estimatedFare="{ item }">
          <span class="font-weight-bold text-primary">{{ formatToman(item.finalFare || item.estimatedFare) }}</span>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" label>
            <v-icon start size="12">{{ statusIcon(item.status) }}</v-icon>
            {{ item.status.replace('_',' ') }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn icon="mdi-eye" size="small" variant="text" @click.stop="openDetail(item)" />
          <v-btn
            v-if="!item.driver && item.status === 'pending'"
            icon="mdi-account-plus"
            size="small"
            variant="text"
            color="primary"
            @click.stop="openAssign(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- پنجره کناری جزئیات -->
    <v-navigation-drawer v-model="detailDrawer" location="right" width="460" temporary>
      <div v-if="selectedBooking" class="pa-6">
        <div class="d-flex align-center justify-space-between mb-5">
          <div class="text-h6 font-weight-bold text-secondary">جزئیات رزرو</div>
          <v-btn icon="mdi-close" variant="text" @click="detailDrawer = false" />
        </div>

        <div class="d-flex align-center justify-space-between mb-4">
          <v-chip :color="statusColor(selectedBooking.status)" label>
            <v-icon start size="14">{{ statusIcon(selectedBooking.status) }}</v-icon>
            {{ selectedBooking.status.replace('_',' ').toUpperCase() }}
          </v-chip>
          <span class="text-caption text-grey font-weight-bold">#{{ selectedBooking.id.slice(0,8).toUpperCase() }}</span>
        </div>

        <!-- هشدار مهلت لغو -->
        <v-alert
          v-if="deadlineWarning(selectedBooking)"
          type="warning"
          variant="tonal"
          rounded="lg"
          density="compact"
          class="mb-4"
          prepend-icon="mdi-clock-alert"
          :text="deadlineWarning(selectedBooking)"
        />

        <div class="text-caption text-grey font-weight-bold mb-2">مشتری</div>
        <v-card color="grey-lighten-5" rounded="lg" class="pa-4 mb-4">
          <div class="d-flex align-center gap-3">
            <v-avatar color="primary" size="44">
              <span class="font-weight-bold text-white">{{ selectedBooking.user?.fullName?.charAt(0) }}</span>
            </v-avatar>
            <div>
              <div class="text-body-1 font-weight-bold text-secondary">{{ selectedBooking.user?.fullName }}</div>
              <div class="text-caption text-grey">{{ selectedBooking.user?.phone }}</div>
            </div>
          </div>
        </v-card>

        <div class="text-caption text-grey font-weight-bold mb-2">راننده</div>
        <v-card v-if="selectedBooking.driver" color="grey-lighten-5" rounded="lg" class="pa-4 mb-4">
          <div class="d-flex align-center gap-3">
            <v-avatar color="info" size="44"><v-icon color="white">mdi-account-tie</v-icon></v-avatar>
            <div>
              <div class="text-body-1 font-weight-bold text-secondary">{{ selectedBooking.driver.fullName }}</div>
              <div class="text-caption text-grey">{{ selectedBooking.driver.phone }}</div>
              <div class="d-flex gap-2 mt-1">
                <v-chip size="x-small" color="secondary" variant="tonal">{{ selectedBooking.driver.carModel }}</v-chip>
                <v-chip size="x-small" color="primary" variant="tonal">{{ selectedBooking.driver.carPlate }}</v-chip>
              </div>
            </div>
          </div>
        </v-card>
        <v-btn v-else color="primary" variant="tonal" block rounded="lg" class="mb-4" prepend-icon="mdi-account-plus" @click="openAssign(selectedBooking)">
          اختصاص راننده
        </v-btn>

        <div class="text-caption text-grey font-weight-bold mb-2">مسیر</div>
        <v-card color="grey-lighten-5" rounded="lg" class="pa-4 mb-4">
          <div class="d-flex align-start gap-3">
            <div class="d-flex flex-column align-center mt-1">
              <v-icon color="success" size="14">mdi-circle</v-icon>
              <div style="width:2px;height:28px;background:#e0e0e0;margin:2px 0" />
              <v-icon color="error" size="14">mdi-map-marker</v-icon>
            </div>
            <div>
              <div class="text-body-2 font-weight-medium text-secondary mb-2">{{ selectedBooking.pickupAddress }}</div>
              <div class="text-body-2 font-weight-medium text-secondary">{{ selectedBooking.dropoffAddress }}</div>
            </div>
          </div>
        </v-card>

        <v-list lines="two" density="compact" class="mb-4">
          <v-list-item prepend-icon="mdi-calendar-clock">
            <template #title><span class="text-caption text-grey">زمان برنامه‌ریزی شده</span></template>
            <template #subtitle>{{ new Date(selectedBooking.scheduledAt).toLocaleString() }}</template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-map-marker-distance">
            <template #title><span class="text-caption text-grey">مسافت</span></template>
            <template #subtitle>{{ selectedBooking.distanceKm }} کیلومتر</template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-currency-usd">
            <template #title><span class="text-caption text-grey">کرایه</span></template>
            <template #subtitle>
              <span class="text-primary font-weight-bold">{{ formatToman(selectedBooking.finalFare || selectedBooking.estimatedFare) }}</span>
              <span v-if="!selectedBooking.finalFare" class="text-caption text-grey ml-1">(تخمینی)</span>
            </template>
          </v-list-item>
          <v-list-item v-if="selectedBooking.notes" prepend-icon="mdi-note-text">
            <template #title><span class="text-caption text-grey">یادداشت</span></template>
            <template #subtitle>{{ selectedBooking.notes }}</template>
          </v-list-item>
        </v-list>

        <div class="text-caption text-grey font-weight-bold mb-2">بروزرسانی وضعیت</div>
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            v-for="action in statusActions(selectedBooking.status)"
            :key="action.status"
            :color="action.color"
            variant="tonal"
            size="small"
            :loading="updatingStatus === action.status"
            @click="updateStatus(selectedBooking.id, action.status)"
          >
            {{ action.label }}
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- دیالوگ اختصاص راننده — فقط رانندگان موجود -->
    <v-dialog v-model="assignDialog" max-width="520">
      <v-card rounded="xl" class="pa-6">
        <div class="text-h6 font-weight-bold text-secondary mb-1">اختصاص راننده</div>
        <div class="text-body-2 text-grey mb-4">رزرو #{{ assignTarget?.id?.slice(0,8).toUpperCase() }}</div>

        <!-- نشانگر بازه زمانی -->
        <v-alert
          v-if="assignTarget"
          type="info"
          variant="tonal"
          rounded="lg"
          density="compact"
          class="mb-4"
          prepend-icon="mdi-calendar-clock"
        >
          نمایش رانندگان آزاد برای
          <strong>{{ new Date(assignTarget.scheduledAt).toLocaleString() }}</strong>
          <span class="text-caption ml-1">(±{{ bufferMinutes }}دقیقه بافر)</span>
        </v-alert>

        <!-- در حال بارگذاری -->
        <div v-if="loadingAvailable" class="d-flex flex-column align-center pa-8 gap-3">
          <v-progress-circular indeterminate color="primary" />
          <span class="text-caption text-grey">بررسی در دسترس بودن رانندگان...</span>
        </div>

        <div v-else>
          <!-- هیچ راننده‌ای موجود نیست -->
          <v-alert
            v-if="availableDrivers.length === 0"
            type="error"
            variant="tonal"
            rounded="xl"
            class="mb-4"
            prepend-icon="mdi-account-off"
          >
            <div class="font-weight-bold mb-1">هیچ راننده‌ای در دسترس نیست</div>
            همه رانندگان فعال در بازه ±{{ bufferMinutes }} دقیقه از این سفر رزرو تداخلی دارند.
            پنجره بافر را در تنظیمات تنظیم کنید یا زمان رزرو را تغییر دهید.
          </v-alert>

          <div v-else>
            <div class="d-flex align-center justify-space-between mb-3">
              <v-chip size="small" color="success" variant="tonal">
                <v-icon start size="14">mdi-check-circle</v-icon>
                {{ availableDrivers.length }} راننده در دسترس
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
                      <v-icon start size="10">mdi-check</v-icon>آزاد
                    </v-chip>
                  </div>
                </v-card>
                <div v-if="filteredAvailableDrivers.length === 0" class="text-center pa-4 text-grey text-body-2">
                  هیچ راننده‌ای با جستجوی شما مطابقت ندارد
                </div>
              </v-radio-group>
            </div>
          </div>

          <v-text-field
            v-model="finalFareInput"
            label="کرایه نهایی (تومان، اختیاری)"
            prepend-inner-icon="mdi-cash"
            type="number"
            variant="outlined"
            rounded="lg"
            hide-details
            density="compact"
            class="mb-5"
          />

          <div class="d-flex gap-3 flex-col">
            <v-btn variant="outlined" color="secondary" block @click="assignDialog = false">لغو</v-btn>
            <v-btn
              color="primary"
              block
              :loading="assigning"
              :disabled="!selectedDriverId || availableDrivers.length === 0"
              @click="doAssign"
            >
              اختصاص راننده
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

const bookingsStore = useBookingsStore()
const { $api } = useNuxtApp()

onMounted(async () => {
  await bookingsStore.fetchAllBookings()
  await loadSettings()
})

const search            = ref('')
const statusFilter      = ref('all')
const detailDrawer      = ref(false)
const selectedBooking   = ref<any>(null)
const assignDialog      = ref(false)
const assignTarget      = ref<any>(null)
const selectedDriverId  = ref('')
const finalFareInput    = ref('')
const driverSearch      = ref('')
const assigning         = ref(false)
const updatingStatus    = ref('')
const availableDrivers  = ref<any[]>([])
const loadingAvailable  = ref(false)
const bufferMinutes     = ref(60)
const cancellationDeadlineMinutes = ref(60)

const loadSettings = async () => {
  try {
    const { data } = await $api.get('/settings')
    const buf = data.find((s: any) => s.key === 'driver_buffer_minutes')
    const can = data.find((s: any) => s.key === 'cancellation_deadline_minutes')
    if (buf) bufferMinutes.value = parseInt(buf.value)
    if (can) cancellationDeadlineMinutes.value = parseInt(can.value)
  } catch {}
}

const statusTabs = [
  { label: 'همه',         value: 'all',         icon: 'mdi-view-list',      color: 'secondary' },
  { label: 'در انتظار',     value: 'pending',      icon: 'mdi-clock-outline',  color: 'warning' },
  { label: 'تأیید شده',   value: 'confirmed',    icon: 'mdi-check-circle',   color: 'info' },
  { label: 'در حال انجام', value: 'in_progress',  icon: 'mdi-car',            color: 'primary' },
  { label: 'تکمیل شده',   value: 'completed',    icon: 'mdi-flag-checkered', color: 'success' },
  { label: 'لغو شده',   value: 'cancelled',    icon: 'mdi-close-circle',   color: 'error' },
]

const filteredBookings = computed(() =>
  statusFilter.value === 'all'
    ? bookingsStore.allBookings
    : bookingsStore.allBookings.filter((b) => b.status === statusFilter.value),
)

const filteredAvailableDrivers = computed(() =>
  availableDrivers.value.filter((d) =>
    !driverSearch.value ||
    d.fullName.toLowerCase().includes(driverSearch.value.toLowerCase()) ||
    d.carPlate.toLowerCase().includes(driverSearch.value.toLowerCase()),
  ),
)

const statusCount = (val: string) =>
  val === 'all'
    ? bookingsStore.allBookings.length
    : bookingsStore.allBookings.filter((b) => b.status === val).length

const headers = [
  { title: 'مشتری',  key: 'user.fullName',  sortable: true },
  { title: 'مسیر',     key: 'pickupAddress',  sortable: false },
  { title: 'زمان برنامه‌ریزی شده', key: 'scheduledAt',    sortable: true },
  { title: 'راننده',    key: 'driver',         sortable: false },
  { title: 'کرایه',      key: 'estimatedFare',  sortable: true },
  { title: 'وضعیت',    key: 'status',         sortable: true },
  { title: '',          key: 'actions',        sortable: false, width: '80px' },
]

const statusColor = (s: string) =>
  ({ pending: 'warning', confirmed: 'info', in_progress: 'primary', completed: 'success', cancelled: 'error' }[s] || 'grey')

const statusIcon = (s: string) =>
  ({ pending: 'mdi-clock-outline', confirmed: 'mdi-check-circle', in_progress: 'mdi-car', completed: 'mdi-flag-checkered', cancelled: 'mdi-close-circle' }[s] || 'mdi-help-circle')

const statusActions = (status: string) =>
  ({
    confirmed:   [{ status: 'in_progress', label: 'شروع سفر',    color: 'primary' }, { status: 'cancelled', label: 'لغو', color: 'error' }],
    in_progress: [{ status: 'completed',   label: 'تکمیل سفر', color: 'success' }],
    pending:     [{ status: 'cancelled',   label: 'لغو',        color: 'error' }],
  } as any)[status] || []

// نمایش هشدار ادمین وقتی رزرو در بازه مهلت لغو است
const deadlineWarning = (booking: any) => {
  if (!['pending', 'confirmed'].includes(booking.status)) return null
  if (cancellationDeadlineMinutes.value <= 0) return null
  const minutesUntil = (new Date(booking.scheduledAt).getTime() - Date.now()) / (1000 * 60)
  if (minutesUntil > 0 && minutesUntil < cancellationDeadlineMinutes.value) {
    return `مشتری نمی‌تواند خودش لغو کند — سفر در ${Math.round(minutesUntil)} دقیقه است (در بازه ${cancellationDeadlineMinutes.value}-دقیقه‌ای لغو). ادمین همچنان می‌تواند به صورت دستی لغو کند.`
  }
  return null
}

const openDetail = (booking: any) => {
  selectedBooking.value = booking
  detailDrawer.value    = true
}

const openAssign = async (booking: any) => {
  assignTarget.value     = booking
  selectedDriverId.value = ''
  finalFareInput.value   = ''
  driverSearch.value     = ''
  availableDrivers.value = []
  assignDialog.value     = true
  loadingAvailable.value = true
  try {
    const { data } = await $api.get('/bookings/available-drivers', {
      params: { scheduledAt: booking.scheduledAt },
    })
    availableDrivers.value = data
  } catch {
    availableDrivers.value = []
  } finally {
    loadingAvailable.value = false
  }
}

const doAssign = async () => {
  assigning.value = true
  try {
    await bookingsStore.assignDriver(
      assignTarget.value.id,
      selectedDriverId.value,
      finalFareInput.value ? parseFloat(finalFareInput.value) : undefined,
    )
    assignDialog.value = false
    if (selectedBooking.value?.id === assignTarget.value.id)
      selectedBooking.value = bookingsStore.allBookings.find((b) => b.id === assignTarget.value.id)
  } finally { assigning.value = false }
}

const updateStatus = async (bookingId: string, status: string) => {
  updatingStatus.value = status
  try {
    await $api.patch(`/bookings/${bookingId}/status`, { status })
    await bookingsStore.fetchAllBookings()
    selectedBooking.value = bookingsStore.allBookings.find((b) => b.id === bookingId)
  } finally { updatingStatus.value = '' }
}
</script>