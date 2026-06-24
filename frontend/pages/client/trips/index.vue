<template>
  <div style="direction: rtl">
    <div class="booking-hero pa-8 mb-6">
      <v-container>
        <div class="text-overline text-primary font-weight-bold mb-1">تاریخچه</div>
        <h1 class="text-h4 font-weight-bold text-secondary">سفرهای من</h1>
        <p class="text-body-2 text-grey-darken-1 mt-1">تمام رزروهای گذشته و آینده</p>
      </v-container>
    </div>

    <v-container>
      <!-- Filter tabs -->
      <v-tabs v-model="activeTab" color="primary" class="mb-6">
        <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
          {{ tab.label }}
          <v-chip v-if="tabCount(tab.value) > 0" size="x-small" :color="tab.color" class="mr-2">
            {{ tabCount(tab.value) }}
          </v-chip>
        </v-tab>
      </v-tabs>

      <!-- Loading -->
      <div v-if="bookingsStore.loading" class="d-flex justify-center pa-12">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <!-- Empty -->
      <div v-else-if="filteredBookings.length === 0" class="text-center pa-16">
        <v-icon size="72" color="grey-lighten-2" class="mb-4">mdi-calendar-blank</v-icon>
        <div class="text-h6 text-grey mb-2">سفری یافت نشد</div>
        <div class="text-body-2 text-grey mb-6">
          {{ activeTab === 'all' ? 'هنوز هیچ رزروی ثبت نکرده‌اید.' : `رزرو ${tabs.find(t=>t.value===activeTab)?.label} وجود ندارد.` }}
        </div>
        <v-btn color="primary" to="/client/booking" prepend-icon="mdi-plus">رزرو سفر جدید</v-btn>
      </div>

      <!-- Bookings list -->
      <v-row v-else>
        <v-col v-for="booking in filteredBookings" :key="booking.id" cols="12" md="6">
          <v-card rounded="xl" class="booking-card" @click="openDetail(booking)">
            <div class="status-bar" :style="{ background: statusGradient(booking.status) }" />
            <div class="pa-5">
              <div class="d-flex align-start justify-space-between mb-4">
                <div>
                  <v-chip :color="statusColor(booking.status)" size="small" label class="mb-2">
                    <v-icon start size="14">{{ statusIcon(booking.status) }}</v-icon>
                    {{ statusLabel(booking.status) }}
                  </v-chip>
                  <div class="text-caption text-grey">#{{ booking.id.slice(0,8).toUpperCase() }}</div>
                </div>
                <div class="text-left">
                  <div class="text-h6 font-weight-bold text-primary">
                    {{ formatToman(booking.finalFare || booking.estimatedFare) }}
                  </div>
                  <div class="text-caption text-grey">{{ booking.distanceKm }} کیلومتر</div>
                </div>
              </div>

              <!-- Route -->
              <div class="d-flex align-start gap-3 mb-4">
                <div class="d-flex flex-column align-center mt-1">
                  <v-icon color="success" size="14">mdi-circle</v-icon>
                  <div style="width:1px;height:20px;background:#e0e0e0;margin:2px 0" />
                  <v-icon color="error" size="14">mdi-map-marker</v-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-body-2 font-weight-medium text-secondary text-truncate mb-2">{{ booking.pickupAddress }}</div>
                  <div class="text-body-2 font-weight-medium text-secondary text-truncate">{{ booking.dropoffAddress }}</div>
                </div>
              </div>

              <v-divider class="mb-3" />

              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center gap-1">
                  <v-icon size="14" color="grey">mdi-calendar-clock</v-icon>
                  <span class="text-caption text-grey">
                    {{ new Date(booking.scheduledAt).toLocaleDateString('fa-IR') }}
                    {{ new Date(booking.scheduledAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) }}
                  </span>
                </div>

                <!-- Driver assigned -->
                <v-chip v-if="booking.driver" size="small" color="info" variant="tonal">
                  <v-icon start size="12">mdi-account</v-icon>
                  {{ booking.driver.fullName }}
                </v-chip>

                <!-- Pending + no driver: edit + cancel buttons -->
                <div v-else-if="booking.status === 'pending'" class="d-flex gap-1">
                  <v-btn
                    size="x-small"
                    color="primary"
                    variant="tonal"
                    icon="mdi-pencil"
                    @click.stop="openEdit(booking)"
                  />
                  <v-tooltip v-if="isCancellationBlocked(booking)" location="top">
                    <template #activator="{ props }">
                      <v-chip v-bind="props" size="small" color="warning" variant="tonal">
                        <v-icon start size="12">mdi-clock-alert</v-icon>
                        لغو ممکن نیست
                      </v-chip>
                    </template>
                    سفر در بازه {{ cancellationDeadline }} دقیقه‌ای است
                  </v-tooltip>
                  <v-btn
                    v-else
                    size="x-small"
                    color="error"
                    variant="tonal"
                    @click.stop="confirmCancel(booking)"
                  >
                    لغو
                  </v-btn>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- ── Detail Drawer ──────────────────────────────────────────────────── -->
    <v-navigation-drawer v-model="detailDrawer" location="right" width="420" temporary>
      <div v-if="selectedBooking" class="pa-6">
        <div class="d-flex align-center justify-space-between mb-6">
          <div class="text-h6 font-weight-bold text-secondary">جزئیات سفر</div>
          <v-btn icon="mdi-close" variant="text" @click="detailDrawer = false" />
        </div>

        <!-- Status -->
        <v-card :color="statusColor(selectedBooking.status)" variant="tonal" rounded="lg" class="pa-4 mb-4">
          <div class="d-flex align-center gap-3">
            <v-icon :color="statusColor(selectedBooking.status)" size="32">{{ statusIcon(selectedBooking.status) }}</v-icon>
            <div>
              <div class="text-body-2 font-weight-bold">{{ statusLabel(selectedBooking.status) }}</div>
              <div class="text-caption">شماره رزرو: #{{ selectedBooking.id.slice(0,8).toUpperCase() }}</div>
            </div>
          </div>
        </v-card>

        <!-- Cancellation deadline warning -->
        <v-alert
          v-if="isCancellationBlocked(selectedBooking) && ['pending','confirmed'].includes(selectedBooking.status)"
          type="warning"
          variant="tonal"
          rounded="lg"
          density="compact"
          class="mb-4"
          prepend-icon="mdi-clock-alert"
        >
          <div class="text-body-2 font-weight-bold mb-1">مهلت لغو گذشته</div>
          <div class="text-caption">
            این سفر در بازه {{ cancellationDeadline }} دقیقه‌ای قرار دارد و دیگر قابل لغو نیست.
            برای کمک با پشتیبانی تماس بگیرید.
          </div>
        </v-alert>

        <!-- Driver -->
        <v-card v-if="selectedBooking.driver" color="grey-lighten-5" rounded="lg" class="pa-4 mb-4">
          <div class="text-caption text-grey mb-2 font-weight-bold">راننده شما</div>
          <div class="d-flex align-center gap-3">
            <v-avatar color="primary" size="48">
                <v-img v-if="selectedBooking.driver?.avatarUrl" :src="avatarSrc(selectedBooking.driver?.avatarUrl)" cover />
              <v-icon v-else color="white">mdi-account</v-icon>
            </v-avatar>
            <div>
              <div class="text-body-1 font-weight-bold text-secondary">{{ selectedBooking.driver.fullName }}</div>
              <div class="text-caption text-grey">{{ selectedBooking.driver.phone }}</div>
            </div>
          </div>
          <v-divider class="my-3" />
          <div class="d-flex gap-3 flex-col">
            <v-chip size="small" color="secondary" variant="tonal">
              <v-icon start size="12">mdi-car</v-icon>
              {{ selectedBooking.driver.carModel }}
            </v-chip>
            <v-chip size="small" color="primary" variant="tonal">{{ selectedBooking.driver.carPlate }}</v-chip>
          </div>
        </v-card>

        <!-- Route -->
        <div class="text-caption text-grey mb-2 font-weight-bold">مسیر سفر</div>
        <v-card color="grey-lighten-5" rounded="lg" class="pa-4 mb-4">
          <div class="d-flex align-start gap-3">
            <div class="d-flex flex-column align-center mt-1">
              <v-icon color="success" size="16">mdi-circle</v-icon>
              <div style="width:2px;height:32px;background:#e0e0e0;margin:3px 0" />
              <v-icon color="error" size="16">mdi-map-marker</v-icon>
            </div>
            <div>
              <div class="text-body-2 font-weight-medium text-secondary mb-3">{{ selectedBooking.pickupAddress }}</div>
              <div class="text-body-2 font-weight-medium text-secondary">{{ selectedBooking.dropoffAddress }}</div>
            </div>
          </div>
        </v-card>

        <!-- Details -->
        <v-list lines="two" class="mb-4">
          <v-list-item prepend-icon="mdi-calendar-clock" density="compact">
            <template #title><span class="text-caption text-grey">زمان سفر</span></template>
            <template #subtitle>{{ new Date(selectedBooking.scheduledAt).toLocaleString('fa-IR') }}</template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-map-marker-distance" density="compact">
            <template #title><span class="text-caption text-grey">مسافت</span></template>
            <template #subtitle>{{ selectedBooking.distanceKm }} کیلومتر</template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-account-group" density="compact">
            <template #title><span class="text-caption text-grey">تعداد مسافران</span></template>
            <template #subtitle>{{ selectedBooking.passengerCount || 1 }} نفر</template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-cash" density="compact">
            <template #title><span class="text-caption text-grey">کرایه</span></template>
            <template #subtitle>
              <span class="text-primary font-weight-bold">{{ formatToman(selectedBooking.finalFare || selectedBooking.estimatedFare) }}</span>
              <span v-if="!selectedBooking.finalFare" class="text-grey text-caption"> (تخمینی)</span>
            </template>
          </v-list-item>
          <v-list-item v-if="selectedBooking.notes" prepend-icon="mdi-note-text" density="compact">
            <template #title><span class="text-caption text-grey">یادداشت</span></template>
            <template #subtitle>{{ selectedBooking.notes }}</template>
          </v-list-item>
        </v-list>

        <!-- Action buttons — only for pending + no driver -->
        <div v-if="selectedBooking.status === 'pending' && !selectedBooking.driver" class="d-flex flex-column gap-2">
          <v-btn
            color="primary"
            variant="tonal"
            block
            prepend-icon="mdi-pencil"
            @click="openEdit(selectedBooking)"
          >
            ویرایش رزرو
          </v-btn>
          <v-btn
            v-if="!isCancellationBlocked(selectedBooking)"
            color="error"
            variant="tonal"
            block
            prepend-icon="mdi-cancel"
            @click="confirmCancel(selectedBooking)"
          >
            لغو رزرو
          </v-btn>
          <v-card v-else color="warning" variant="tonal" rounded="lg" class="pa-3">
            <div class="d-flex align-center gap-2">
              <v-icon color="warning" size="20">mdi-phone</v-icon>
              <div class="text-body-2">برای لغو با پشتیبانی تماس بگیرید.</div>
            </div>
          </v-card>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- ── Edit Dialog ──────────────────────────────────────────────────────── -->
    <v-dialog v-model="editDialog" max-width="460" persistent>
      <v-card rounded="xl" class="pa-6" style="direction:rtl">
        <div class="d-flex align-center justify-space-between mb-5">
          <div>
            <div class="text-h6 font-weight-bold text-secondary">ویرایش رزرو</div>
            <div class="text-caption text-grey">#{{ editTarget?.id?.slice(0,8).toUpperCase() }}</div>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="editDialog = false" />
        </div>

        <!-- Info — what can/cannot be changed -->
        <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
          <div class="text-caption">
            فقط زمان، تعداد مسافران و یادداشت قابل تغییر است.
            مسیر سفر قابل ویرایش نیست — برای تغییر مسیر رزرو را لغو و دوباره ثبت کنید.
          </div>
        </v-alert>

        <v-form ref="editForm" v-model="editValid" @submit.prevent="saveEdit">
          <!-- Route preview — readonly -->
          <v-card color="grey-lighten-5" rounded="lg" class="pa-3 mb-4">
            <div class="d-flex align-start gap-3">
              <div class="d-flex flex-column align-center mt-1">
                <v-icon color="success" size="13">mdi-circle</v-icon>
                <div style="width:2px;height:18px;background:#e0e0e0;margin:2px 0" />
                <v-icon color="error" size="13">mdi-map-marker</v-icon>
              </div>
              <div>
                <div class="text-caption font-weight-medium text-secondary mb-2">{{ editTarget?.pickupAddress }}</div>
                <div class="text-caption font-weight-medium text-secondary">{{ editTarget?.dropoffAddress }}</div>
              </div>
            </div>
            <v-divider class="my-2" />
            <div class="d-flex justify-space-between text-caption">
              <span class="text-grey">مسافت</span>
              <span class="font-weight-bold">{{ editTarget?.distanceKm }} کیلومتر</span>
            </div>
            <div class="d-flex justify-space-between text-caption mt-1">
              <span class="text-grey">کرایه تخمینی</span>
              <span class="font-weight-bold text-primary">{{ formatToman(editTarget?.estimatedFare) }}</span>
            </div>
          </v-card>

          <!-- Editable fields -->
          <v-text-field
            v-model="editFields.scheduledAt"
            label="تاریخ و زمان جدید"
            type="datetime-local"
            prepend-inner-icon="mdi-calendar-clock"
            :min="minDateTime"
            :rules="[rules.required]"
            variant="outlined"
            rounded="lg"
            class="mb-3"
          />

          <v-select
            v-model="editFields.passengerCount"
            label="تعداد مسافران"
            :items="[1,2,3,4,5,6,7,8]"
            prepend-inner-icon="mdi-account-group"
            variant="outlined"
            rounded="lg"
            class="mb-3"
          />

          <v-textarea
            v-model="editFields.notes"
            label="یادداشت (اختیاری)"
            prepend-inner-icon="mdi-note-text"
            variant="outlined"
            rounded="lg"
            rows="2"
            auto-grow
            class="mb-4"
          />

          <v-alert
            v-if="editError"
            type="error"
            variant="tonal"
            rounded="lg"
            density="compact"
            class="mb-4"
            :text="editError"
          />
          <v-alert
            v-if="editSuccess"
            type="success"
            variant="tonal"
            rounded="lg"
            density="compact"
            class="mb-4"
            text="رزرو با موفقیت ویرایش شد."
          />

          <div class="d-flex gap-3 flex-col">
            <v-btn variant="outlined" color="secondary" @click="editDialog = false">انصراف</v-btn>
            <v-btn
              type="submit"
              color="primary"
              class="flex-1"
              :loading="saving"
              :disabled="!editValid"
              prepend-icon="mdi-content-save"
            >
              ذخیره تغییرات
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- ── Cancel Dialog ────────────────────────────────────────────────────── -->
    <v-dialog v-model="cancelDialog" max-width="400">
      <v-card rounded="xl" class="pa-6" style="direction:rtl">
        <div class="text-center mb-4">
          <v-icon color="error" size="48" class="mb-3">mdi-alert-circle</v-icon>
          <div class="text-h6 font-weight-bold text-secondary">لغو رزرو؟</div>
          <div class="text-body-2 text-grey mt-2">این عمل قابل برگشت نیست.</div>
        </div>
        <v-alert
          v-if="cancelError"
          type="error"
          variant="tonal"
          rounded="lg"
          density="compact"
          class="mb-4"
          :text="cancelError"
          prepend-icon="mdi-clock-alert"
        />
        <v-textarea
          v-model="cancelReason"
          label="دلیل لغو (اختیاری)"
          rows="2"
          rounded="lg"
          variant="outlined"
          class="mb-4"
        />
        <div class="d-flex gap-3 flex-col">
          <v-btn variant="outlined" color="secondary" block @click="cancelDialog = false">نگه داشتن</v-btn>
          <v-btn color="error" block :loading="cancelling" @click="doCancel">لغو رزرو</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { formatToman } from '~/utils/currency'
definePageMeta({ layout: 'client' })

const bookingsStore = useBookingsStore()
const { $api }      = useNuxtApp()

onMounted(async () => {
  await bookingsStore.fetchMyBookings()
  await loadSettings()
})

// ── Settings ──────────────────────────────────────────────────────────────────
const cancellationDeadline = ref(60)

const loadSettings = async () => {
  try {
    const { data } = await $api.get('/settings')
    const s = data.find((s: any) => s.key === 'cancellation_deadline_minutes')
    if (s) cancellationDeadline.value = parseInt(s.value)
  } catch {}
}

const isCancellationBlocked = (booking: any) => {
  if (cancellationDeadline.value <= 0) return false
  return (new Date(booking.scheduledAt).getTime() - Date.now()) / (1000 * 60) < cancellationDeadline.value
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const activeTab = ref('all')
const tabs = [
  { label: 'همه',          value: 'all',        color: 'secondary' },
  { label: 'در انتظار',   value: 'pending',    color: 'warning' },
  { label: 'تأیید شده',   value: 'confirmed',  color: 'info' },
  { label: 'انجام شده',   value: 'completed',  color: 'success' },
  { label: 'لغو شده',     value: 'cancelled',  color: 'error' },
]

const filteredBookings = computed(() =>
  activeTab.value === 'all'
    ? bookingsStore.myBookings
    : bookingsStore.myBookings.filter((b) => b.status === activeTab.value),
)

const tabCount = (val: string) =>
  val === 'all' ? 0 : bookingsStore.myBookings.filter((b) => b.status === val).length

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusColor = (s: string) =>
  ({ pending: 'warning', confirmed: 'info', in_progress: 'primary', completed: 'success', cancelled: 'error' }[s] || 'grey')

const statusIcon = (s: string) =>
  ({ pending: 'mdi-clock-outline', confirmed: 'mdi-check-circle', in_progress: 'mdi-car', completed: 'mdi-flag-checkered', cancelled: 'mdi-close-circle' }[s] || 'mdi-help-circle')

const statusLabel = (s: string) =>
  ({ pending: 'در انتظار', confirmed: 'تأیید شده', in_progress: 'در حال سفر', completed: 'انجام شده', cancelled: 'لغو شده' }[s] || s)

const statusGradient = (s: string) =>
  ({ pending: 'linear-gradient(90deg,#FF9800,#FFB74D)', confirmed: 'linear-gradient(90deg,#2196F3,#64B5F6)', in_progress: 'linear-gradient(90deg,#F5A623,#FFD180)', completed: 'linear-gradient(90deg,#4CAF50,#81C784)', cancelled: 'linear-gradient(90deg,#F44336,#E57373)' }[s] || '#e0e0e0')

// ── Detail drawer ─────────────────────────────────────────────────────────────
const detailDrawer    = ref(false)
const selectedBooking = ref<any>(null)

const openDetail = (booking: any) => {
  selectedBooking.value = booking
  detailDrawer.value    = true
}

// ── Edit ──────────────────────────────────────────────────────────────────────
const editDialog  = ref(false)
const editTarget  = ref<any>(null)
const editValid   = ref(false)
const saving      = ref(false)
const editError   = ref('')
const editSuccess = ref(false)
const editForm    = ref()

const editFields = ref({ scheduledAt: '', passengerCount: 1, notes: '' })

const minDateTime = computed(() => new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16))

const rules = { required: (v: string) => !!v || 'این فیلد الزامی است' }

const openEdit = (booking: any) => {
  editTarget.value  = booking
  editError.value   = ''
  editSuccess.value = false
  // Pre-fill with current values
  editFields.value = {
    scheduledAt:    new Date(booking.scheduledAt).toISOString().slice(0, 16),
    passengerCount: booking.passengerCount || 1,
    notes:          booking.notes || '',
  }
  editDialog.value = true
}

const saveEdit = async () => {
  const { valid } = await editForm.value.validate()
  if (!valid) return

  saving.value     = true
  editError.value  = ''
  editSuccess.value = false
  console.log(bookingsStore.editBooking)
  try {
    await bookingsStore.editBooking(editTarget.value.id, {
      scheduledAt:    new Date(editFields.value.scheduledAt).toISOString(),
      passengerCount: editFields.value.passengerCount,
      notes:          editFields.value.notes,
    })

    editSuccess.value = true

    // Update selected booking in detail drawer if open
    if (selectedBooking.value?.id === editTarget.value.id) {
      selectedBooking.value = bookingsStore.myBookings.find(
        (b) => b.id === editTarget.value.id,
      )
    }

    setTimeout(() => { editDialog.value = false; editSuccess.value = false }, 1200)
  } catch (e: any) {
    console.log('w',e)
    editError.value = e.response?.data?.message || 'خطا در ذخیره تغییرات'
  } finally {
    saving.value = false
  }
}

// ── Cancel ────────────────────────────────────────────────────────────────────
const cancelDialog = ref(false)
const cancelTarget = ref<any>(null)
const cancelReason = ref('')
const cancelling   = ref(false)
const cancelError  = ref('')

const confirmCancel = (booking: any) => {
  if (isCancellationBlocked(booking)) return
  cancelTarget.value = booking
  cancelReason.value = ''
  cancelError.value  = ''
  cancelDialog.value = true
}

const doCancel = async () => {
  cancelling.value  = true
  cancelError.value = ''
  try {
    await bookingsStore.cancelBooking(cancelTarget.value.id, cancelReason.value)
    cancelDialog.value = false
    detailDrawer.value = false
  } catch (e: any) {
    cancelError.value = e.response?.data?.message || 'خطا در لغو رزرو'
  } finally {
    cancelling.value = false
  }
}
const avatarSrc = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const base = useRuntimeConfig().public.apiBase.replace('/api', '')
  return `${base}${url}`
}
</script>

<style scoped>
.booking-hero { background: linear-gradient(135deg, #fff8ee 0%, #ffffff 100%); border-bottom: 1px solid #f0f0f0; }
.booking-card { cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; overflow: hidden; }
.booking-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
.status-bar { height: 4px; }
</style>
