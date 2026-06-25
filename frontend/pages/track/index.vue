<template>
  <div class="track-page" style="direction: rtl; min-height: 100vh">

    <!-- Header -->
    <div class="track-header pa-5 d-flex align-center justify-space-between">
      <div class="d-flex align-center gap-2">
        <v-icon color="primary" size="28">mdi-taxi</v-icon>
        <span class="text-h6 font-weight-bold text-white">آفشین‌تاکسی</span>
      </div>
      <div class="text-caption text-grey-lighten-1">پیگیری سفر</div>
    </div>

    <v-container style="max-width: 560px" class="py-8">

      <!-- Search box -->
      <v-card rounded="xl" class="pa-6 mb-6 search-card">
        <div class="text-center mb-5">
          <v-icon color="primary" size="48" class="mb-3">mdi-map-search</v-icon>
          <div class="text-h5 font-weight-bold text-secondary">پیگیری وضعیت سفر</div>
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
            :rules="[rules.required, rules.minLength]"
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

      <!-- Result -->
      <v-card v-if="booking" rounded="xl" class="result-card overflow-hidden">

        <!-- Status banner -->
        <div
          class="status-banner pa-5 d-flex align-center gap-4"
          :style="{ background: statusGradient(booking.status) }"
        >
          <div
            class="status-icon-wrap d-flex align-center justify-center rounded-xl"
            style="width:56px;height:56px;background:rgba(255,255,255,0.2);flex-shrink:0"
          >
            <v-icon color="white" size="28">{{ statusIcon(booking.status) }}</v-icon>
          </div>
          <div>
            <div class="text-white text-h6 font-weight-bold">{{ statusLabel(booking.status) }}</div>
            <div class="text-white text-caption opacity-80">
              رزرو #{{ booking.id.slice(0,8).toUpperCase() }}
            </div>
          </div>
          <!-- Live pulse for in_progress -->
          <div v-if="booking.status === 'in_progress'" class="mr-auto">
            <div class="live-dot" />
          </div>
        </div>

        <div class="pa-5">

          <!-- Timeline -->
          <div class="timeline mb-5">
            <div
              v-for="(step, i) in timeline"
              :key="step.status"
              class="timeline-item"
              :class="{
                done:      isStatusDone(step.status),
                active:    booking.status === step.status,
                cancelled: booking.status === 'cancelled' && step.status === 'cancelled',
              }"
            >
              <div class="timeline-dot">
                <v-icon size="14" :color="dotColor(step.status)">
                  {{ isStatusDone(step.status) ? 'mdi-check' : step.icon }}
                </v-icon>
              </div>
              <div v-if="i < timeline.length - 1" class="timeline-line" />
              <div class="timeline-content">
                <div
                  class="text-body-2 font-weight-bold"
                  :class="isStatusDone(step.status) ? 'text-secondary' : 'text-grey'"
                >
                  {{ step.label }}
                </div>
                <div class="text-caption text-grey">{{ step.desc }}</div>
              </div>
            </div>
          </div>

          <v-divider class="mb-4" />

          <!-- Driver card — shown when assigned -->
          <div v-if="booking.driver" class="mb-4">
            <div class="text-caption text-grey font-weight-bold mb-2">راننده شما</div>
            <v-card color="grey-lighten-5" rounded="lg" class="pa-4">
              <div class="d-flex align-center gap-3">
                <v-avatar color="info" size="52">
                  <v-img
                    v-if="booking.driver.avatarUrl"
                    :src="avatarSrc(booking.driver.avatarUrl)"
                    cover
                  />
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
                      {{ booking.driver.carColor ? `(${booking.driver.carColor})` : '' }}
                    </v-chip>
                    <v-chip size="x-small" color="primary" variant="tonal">
                      {{ booking.driver.carPlate }}
                    </v-chip>
                  </div>
                </div>
              </div>
            </v-card>
          </div>

          <!-- Route -->
          <div class="text-caption text-grey font-weight-bold mb-2">مسیر سفر</div>
          <v-card color="grey-lighten-5" rounded="lg" class="pa-4 mb-4">
            <div class="d-flex align-start gap-3">
              <div class="d-flex flex-column align-center mt-1">
                <v-icon color="success" size="16">mdi-circle</v-icon>
                <div style="width:2px;height:28px;background:#e0e0e0;margin:3px 0" />
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
          </v-card>

          <!-- Trip details -->
          <div class="text-caption text-grey font-weight-bold mb-2">جزئیات</div>
          <v-card color="grey-lighten-5" rounded="lg" class="pa-4 mb-4">
            <v-row dense>
              <v-col cols="6">
                <div class="text-caption text-grey">زمان سفر</div>
                <div class="text-body-2 font-weight-medium text-secondary">
                  {{ new Date(booking.scheduledAt).toLocaleDateString('fa-IR') }}
                </div>
                <div class="text-caption text-secondary">
                  {{ new Date(booking.scheduledAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) }}
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-grey">مسافت</div>
                <div class="text-body-2 font-weight-medium text-secondary">
                  {{ booking.distanceKm }} کیلومتر
                </div>
              </v-col>
              <v-col cols="6" class="mt-3">
                <div class="text-caption text-grey">تعداد مسافران</div>
                <div class="text-body-2 font-weight-medium text-secondary">
                  {{ booking.passengerCount || 1 }} نفر
                </div>
              </v-col>
              <v-col cols="6" class="mt-3">
                <div class="text-caption text-grey">کرایه</div>
                <div class="text-body-2 font-weight-bold text-primary">
                  {{ formatToman(booking.finalFare || booking.estimatedFare) }}
                  <span v-if="!booking.finalFare" class="text-caption text-grey font-weight-regular"> (تخمینی)</span>
                </div>
              </v-col>
            </v-row>
          </v-card>

          <!-- Refresh button -->
          <v-btn
            variant="tonal"
            color="primary"
            block
            prepend-icon="mdi-refresh"
            :loading="refreshing"
            @click="refreshStatus"
          >
            بروزرسانی وضعیت
          </v-btn>

          <!-- Last updated -->
          <div class="text-center text-caption text-grey mt-2">
            آخرین بروزرسانی: {{ lastUpdated }}
          </div>
        </div>
      </v-card>

      <!-- Footer -->
      <div class="text-center mt-8">
        <div class="text-caption text-grey">
          برای رزرو سفر جدید
          <a href="/auth/login" class="text-primary text-decoration-none font-weight-medium">
            وارد شوید
          </a>
        </div>
      </div>

    </v-container>
  </div>
</template>

<script setup lang="ts">
import { formatToman } from '~/utils/currency'

definePageMeta({ layout: 'public' })

const route   = useRoute()
const { $api } = useNuxtApp()
const config   = useRuntimeConfig()

// Pre-fill from URL query param: /track?id=ABC123
const bookingId  = ref((route.query.id as string) || '')
const booking    = ref<any>(null)
const searching  = ref(false)
const refreshing = ref(false)
const searchError = ref('')
const lastUpdated = ref('')

let autoRefreshTimer: NodeJS.Timeout | null = null

const rules = {
  required:  (v: string) => !!v || 'شماره رزرو را وارد کنید',
  minLength: (v: string) => v?.length >= 6 || 'شماره رزرو معتبر نیست',
}

// Auto-track if ID in URL
onMounted(() => {
  if (bookingId.value) trackBooking()
})

onUnmounted(() => {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer)
})

const trackBooking = async () => {
  if (!bookingId.value || bookingId.value.length < 6) return
  searching.value  = true
  searchError.value = ''
  booking.value    = null

  try {
    // Support short 8-char ID prefix or full UUID
    const { data } = await $api.get(`/bookings/track/${bookingId.value.trim()}`)
    booking.value    = data
    lastUpdated.value = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })

    // Auto-refresh every 30s while trip is active
    startAutoRefresh()
  } catch (e: any) {
    searchError.value = e.response?.status === 404
      ? 'رزروی با این شماره یافت نشد'
      : 'خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید'
  } finally {
    searching.value = false
  }
}

const refreshStatus = async () => {
  if (!booking.value) return
  refreshing.value = true
  try {
    const { data } = await $api.get(`/bookings/track/${booking.value.id}`)
    booking.value    = data
    lastUpdated.value = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
  } catch {}
  finally { refreshing.value = false }
}

const startAutoRefresh = () => {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer)
  // Only auto-refresh for active statuses
  const activeStatuses = ['pending', 'confirmed', 'in_progress']
  if (!activeStatuses.includes(booking.value?.status)) return
  autoRefreshTimer = setInterval(async () => {
    await refreshStatus()
    // Stop auto-refresh if trip is done
    if (!activeStatuses.includes(booking.value?.status)) {
      clearInterval(autoRefreshTimer!)
    }
  }, 30000) // every 30 seconds
}

const avatarSrc = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${config.public.apiBase.replace('/api', '')}${url}`
}

// ── Status helpers ────────────────────────────────────────────────────────────
const statusOrder = ['pending', 'confirmed', 'in_progress', 'completed']

const timeline = [
  { status: 'pending',     label: 'رزرو ثبت شد',         icon: 'mdi-clock-outline',  desc: 'رزرو شما دریافت شد و در حال بررسی است' },
  { status: 'confirmed',   label: 'راننده تخصیص یافت',   icon: 'mdi-check-circle',   desc: 'راننده به سفر شما اختصاص داده شد' },
  { status: 'in_progress', label: 'سفر در جریان است',     icon: 'mdi-car',            desc: 'راننده شما را سوار کرده و در راه است' },
  { status: 'completed',   label: 'سفر با موفقیت انجام شد', icon: 'mdi-flag-checkered', desc: 'به مقصد رسیدید. از سفر لذت بردید!' },
  { status: 'cancelled',   label: 'رزرو لغو شد',           icon: 'mdi-close-circle',   desc: 'این رزرو لغو شده است' },
]

const isStatusDone = (status: string) => {
  if (!booking.value) return false
  if (booking.value.status === 'cancelled') return status === 'cancelled'
  return statusOrder.indexOf(status) <= statusOrder.indexOf(booking.value.status)
}

const dotColor = (status: string) =>
  isStatusDone(status) ? (status === 'cancelled' ? 'error' : 'success') : 'grey-lighten-1'

const statusLabel = (s: string) =>
  ({ pending: 'در انتظار تأیید', confirmed: 'راننده تخصیص یافت', in_progress: 'در حال سفر', completed: 'سفر انجام شد', cancelled: 'لغو شده' }[s] || s)

const statusIcon = (s: string) =>
  ({ pending: 'mdi-clock-outline', confirmed: 'mdi-check-circle', in_progress: 'mdi-car', completed: 'mdi-flag-checkered', cancelled: 'mdi-close-circle' }[s] || 'mdi-help-circle')

const statusGradient = (s: string) =>
  ({
    pending:     'linear-gradient(135deg, #FF9800, #F57C00)',
    confirmed:   'linear-gradient(135deg, #2196F3, #1565C0)',
    in_progress: 'linear-gradient(135deg, #F5A623, #E65100)',
    completed:   'linear-gradient(135deg, #4CAF50, #2E7D32)',
    cancelled:   'linear-gradient(135deg, #F44336, #B71C1C)',
  }[s] || 'linear-gradient(135deg, #9E9E9E, #616161)')
</script>

<style scoped>
.track-page {
  background: linear-gradient(160deg, #0D0D1A 0%, #1A1A2E 60%, #0D0D1A 100%);
}

.track-header {
  background: rgba(255,255,255,0.04);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.search-card {
  background: white;
  box-shadow: 0 8px 40px rgba(0,0,0,0.3) !important;
}

.result-card {
  background: white;
  box-shadow: 0 8px 40px rgba(0,0,0,0.3) !important;
}

/* Status banner */
.status-banner { position: relative; overflow: hidden; }
.status-banner::after {
  content: '';
  position: absolute;
  top: -40px; left: -40px;
  width: 160px; height: 160px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
}

/* Live pulse dot */
.live-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: white;
  animation: livePulse 1.5s infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
  50%       { opacity: 0.8; transform: scale(1.1); box-shadow: 0 0 0 8px rgba(255,255,255,0); }
}

/* Timeline */
.timeline { display: flex; flex-direction: column; }
.timeline-item { display: flex; align-items: flex-start; gap: 14px; position: relative; padding-bottom: 18px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot {
  width: 30px; height: 30px; min-width: 30px;
  border-radius: 50%;
  background: #f5f5f5;
  border: 2px solid #e0e0e0;
  display: flex; align-items: center; justify-content: center;
  z-index: 1; transition: all 0.3s;
}
.timeline-item.done .timeline-dot  { background: #E8F5E9; border-color: #4CAF50; }
.timeline-item.active .timeline-dot {
  background: #FFF8E1; border-color: #F5A623;
  box-shadow: 0 0 0 4px rgba(245,166,35,0.15);
}
.timeline-item.cancelled .timeline-dot { background: #FFEBEE; border-color: #F44336; }
.timeline-line {
  position: absolute;
  right: 14px; top: 30px;
  width: 2px; height: calc(100% - 30px);
  background: #e0e0e0;
}
.timeline-item.done .timeline-line { background: #4CAF50; }
.timeline-content { flex: 1; padding-top: 4px; }
</style>
