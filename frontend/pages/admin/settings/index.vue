<template>
  <div>
    <div class="mb-6">
      <div class="text-h5 font-weight-bold text-secondary">تنظیمات</div>
      <div class="text-body-2 text-grey">تنظیمات سیستم</div>
    </div>

    <v-row>
      <!-- قیمت‌گذاری -->
      <v-col cols="12" md="6">
        <v-card rounded="xl" class="pa-6 mb-4">
          <div class="d-flex align-center gap-3 mb-5">
            <v-avatar color="primary" size="44" rounded="lg">
              <v-icon color="white">mdi-cash</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold text-secondary">قیمت‌گذاری</div>
              <div class="text-caption text-grey">تنظیمات کرایه و نرخ‌ها</div>
            </div>
          </div>
          <v-form @submit.prevent="savePricing">
            <div class="text-caption text-grey font-weight-bold mb-3">تنظیمات کرایه پایه</div>
            <v-text-field
              v-model="pricing.farePerKm"
              label="کرایه هر کیلومتر (تومان)"
              type="number"
              step="0.1"
              min="0"
              prepend-inner-icon="mdi-map-marker-distance"
              variant="outlined"
              rounded="lg"
              :hint="`مثال: سفر ۱۰ کیلومتری: ${formatToman(parseFloat(pricing.farePerKm||'0')*10)}`"
              persistent-hint
              class="mb-4"
            />
            <v-text-field
              v-model="pricing.baseFare"
              label="کرایه پایه (تومان)"
              type="number"
              step="0.5"
              min="0"
              prepend-inner-icon="mdi-tag"
              variant="outlined"
              rounded="lg"
              hint="به هر رزرو اضافه می‌شود بدون توجه به مسافت"
              persistent-hint
              class="mb-4"
            />
            <v-text-field
              v-model="pricing.minimumFare"
              label="حداقل کرایه (تومان)"
              type="number"
              step="0.5"
              min="0"
              prepend-inner-icon="mdi-arrow-down-circle"
              variant="outlined"
              rounded="lg"
              hint="هیچ رزروی کمتر از این مبلغ نخواهد بود"
              persistent-hint
              class="mb-5"
            />
            <!-- پیش‌نمایش کرایه -->
            <v-card color="primary" variant="tonal" rounded="lg" class="pa-4 mb-5">
              <div class="text-caption font-weight-bold text-primary mb-2">پیش‌نمایش کرایه</div>
              <v-row dense>
                <v-col v-for="ex in fareExamples" :key="ex.km" cols="4" class="text-center">
                  <div class="text-body-2 font-weight-bold text-secondary">{{ calculatedFare(ex.km) }}</div>
                  <div class="text-caption text-grey">{{ ex.km }} کیلومتر</div>
                </v-col>
              </v-row>
            </v-card>
            <v-alert v-if="pricingSuccess" type="success" variant="tonal" rounded="lg" class="mb-3" text="تنظیمات قیمت ذخیره شد." />
            <v-alert v-if="pricingError"   type="error"   variant="tonal" rounded="lg" class="mb-3" :text="pricingError" />
            <v-btn type="submit" color="primary" block :loading="savingPricing" prepend-icon="mdi-content-save">
              ذخیره قیمت‌گذاری
            </v-btn>
          </v-form>
        </v-card>
      </v-col>

      <!-- ستون راست -->
      <v-col cols="12" md="6">

        <!-- ── ویژگی ۲: سیاست لغو ── -->
        <v-card rounded="xl" class="pa-6 mb-4">
          <div class="d-flex align-center gap-3 mb-5">
            <v-avatar color="error" size="44" rounded="lg">
              <v-icon color="white">mdi-cancel</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold text-secondary">سیاست لغو</div>
              <div class="text-caption text-grey">کنترل زمان لغو مشتریان</div>
            </div>
          </div>
          <v-form @submit.prevent="saveCancellation">
            <v-text-field
              v-model="cancellation.deadlineMinutes"
              label="مهلت لغو (دقیقه قبل از سفر)"
              type="number"
              min="0"
              prepend-inner-icon="mdi-clock-alert"
              variant="outlined"
              rounded="lg"
              class="mb-2"
            />
            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
              <div class="text-caption">
                <strong>{{ cancellation.deadlineMinutes }} دقیقه</strong> قبل از زمان سوار شدن برنامه‌ریزی شده،
                مشتریان دیگر نمی‌توانند خودشان لغو کنند.
                برای اجازه لغو در هر زمان، <strong>۰</strong> را تنظیم کنید.
              </div>
            </v-alert>
            <!-- مثال‌ها -->
            <v-card color="grey-lighten-5" rounded="lg" class="pa-3 mb-5">
              <div class="text-caption font-weight-bold text-grey mb-2">مثال‌ها</div>
              <div v-for="ex in cancellationExamples" :key="ex.label" class="d-flex justify-space-between text-caption py-1">
                <span class="text-grey">سفر در {{ ex.label }}</span>
                <span :class="ex.allowed ? 'text-success font-weight-bold' : 'text-error font-weight-bold'">
                  {{ ex.allowed ? '✓ می‌تواند لغو کند' : '✗ نمی‌تواند لغو کند' }}
                </span>
              </div>
            </v-card>
            <v-alert v-if="cancellationSuccess" type="success" variant="tonal" rounded="lg" class="mb-3" text="سیاست لغو ذخیره شد." />
            <v-btn type="submit" color="error" block :loading="savingCancellation" prepend-icon="mdi-content-save">
              ذخیره سیاست
            </v-btn>
          </v-form>
        </v-card>

        <!-- ── ویژگی ۳: در دسترس بودن راننده ── -->
        <v-card rounded="xl" class="pa-6 mb-4">
          <div class="d-flex align-center gap-3 mb-5">
            <v-avatar color="info" size="44" rounded="lg">
              <v-icon color="white">mdi-car-clock</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold text-secondary">دسترسی راننده</div>
              <div class="text-caption text-grey">پنجره بافر تشخیص تداخل</div>
            </div>
          </div>
          <v-form @submit.prevent="saveDriverBuffer">
            <v-text-field
              v-model="driverBuffer.minutes"
              label="پنجره بافر (دقیقه)"
              type="number"
              min="0"
              prepend-inner-icon="mdi-timer-sand"
              variant="outlined"
              rounded="lg"
              class="mb-2"
            />
            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
              <div class="text-caption">
                هنگام اختصاص راننده، سیستم برای رزروهای موجود در بازه
                <strong>±{{ driverBuffer.minutes }} دقیقه</strong> از زمان برنامه‌ریزی شده سفر جدید بررسی می‌کند.
                اگر تداخلی پیدا شود، راننده نمی‌تواند اختصاص داده شود.
              </div>
            </v-alert>
            <!-- مثال تصویری بافر -->
            <v-card color="grey-lighten-5" rounded="lg" class="pa-3 mb-5">
              <div class="text-caption font-weight-bold text-grey mb-2">نحوه عملکرد</div>
              <div class="d-flex align-center gap-2 text-caption">
                <v-icon color="error" size="14">mdi-block-helper</v-icon>
                <span class="text-grey">منطقه مسدود:</span>
                <v-chip size="x-small" color="error" variant="tonal">-{{ driverBuffer.minutes }}دقیقه</v-chip>
                <span class="text-grey">تا</span>
                <v-chip size="x-small" color="primary" variant="tonal">زمان سفر</v-chip>
                <span class="text-grey">تا</span>
                <v-chip size="x-small" color="error" variant="tonal">+{{ driverBuffer.minutes }}دقیقه</v-chip>
              </div>
            </v-card>
            <v-alert v-if="bufferSuccess" type="success" variant="tonal" rounded="lg" class="mb-3" text="تنظیمات بافر راننده ذخیره شد." />
            <v-btn type="submit" color="info" block :loading="savingBuffer" prepend-icon="mdi-content-save">
              ذخیره بافر
            </v-btn>
          </v-form>
        </v-card>

        <!-- تنظیمات عمومی -->
        <v-card rounded="xl" class="pa-6 mb-4">
          <div class="d-flex align-center gap-3 mb-5">
            <v-avatar color="secondary" size="44" rounded="lg">
              <v-icon color="white">mdi-cog</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold text-secondary">عمومی</div>
              <div class="text-caption text-grey">تنظیمات رزرو و اعلان‌ها</div>
            </div>
          </div>
          <v-form @submit.prevent="saveGeneral">
            <div class="text-caption text-grey font-weight-bold mb-3">رزرو</div>
            <v-text-field v-model="general.minAdvanceMinutes" label="حداقل زمان پیش‌رزرو (دقیقه)" type="number" min="0" prepend-inner-icon="mdi-clock-fast" variant="outlined" rounded="lg" class="mb-3" />
            <v-text-field v-model="general.maxPassengers" label="حداکثر مسافران" type="number" min="1" max="20" prepend-inner-icon="mdi-account-group" variant="outlined" rounded="lg" class="mb-3" />
            <v-divider class="mb-4" />
            <div class="text-caption text-grey font-weight-bold mb-3">اعلان‌ها</div>
            <v-switch v-model="general.smsOnBooking" label="پیامک در رزرو جدید" color="primary" hide-details class="mb-2" />
            <v-switch v-model="general.smsOnDriverAssigned" label="پیامک هنگام اختصاص راننده" color="primary" hide-details class="mb-4" />
            <v-alert v-if="generalSuccess" type="success" variant="tonal" rounded="lg" class="mb-3" text="تنظیمات عمومی ذخیره شد." />
            <v-btn type="submit" color="secondary" block :loading="savingGeneral" prepend-icon="mdi-content-save">ذخیره تنظیمات</v-btn>
          </v-form>
        </v-card>

        <!-- مشاهده خام همه تنظیمات -->
        <v-card rounded="xl" class="pa-6">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary">همه تنظیمات</div>
            <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-refresh" @click="loadSettings">بروزرسانی</v-btn>
          </div>
          <v-data-table :headers="settingsHeaders" :items="allSettings" :loading="loadingSettings" density="compact" hide-default-footer>
            <template #item.value="{ item }">
              <code class="text-primary">{{ item.value }}</code>
            </template>
            <template #item.updatedAt="{ item }">
              <span class="text-caption text-grey">{{ new Date(item.updatedAt).toLocaleDateString() }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { formatToman } from '~/utils/currency'
definePageMeta({ layout: 'admin' })

const { $api } = useNuxtApp()

const allSettings    = ref<any[]>([])
const loadingSettings = ref(false)

const pricing     = ref({ farePerKm: '5000', baseFare: '10000', minimumFare: '20000' })
const cancellation = ref({ deadlineMinutes: '60' })
const driverBuffer = ref({ minutes: '60' })
const general     = ref({ minAdvanceMinutes: '30', maxPassengers: '8', smsOnBooking: true, smsOnDriverAssigned: true })

const savingPricing      = ref(false)
const savingCancellation = ref(false)
const savingBuffer       = ref(false)
const savingGeneral      = ref(false)

const pricingSuccess      = ref(false)
const cancellationSuccess = ref(false)
const bufferSuccess       = ref(false)
const generalSuccess      = ref(false)
const pricingError        = ref('')

const fareExamples = [{ km: 5 }, { km: 10 }, { km: 20 }]

const calculatedFare = (km: number) => {
  const base  = parseFloat(pricing.value.baseFare   || '0')
  const perKm = parseFloat(pricing.value.farePerKm  || '0')
  const min   = parseFloat(pricing.value.minimumFare || '0')
  return formatToman(Math.max(base + km * perKm, min))
}

// نمایش مثال‌های زنده لغو بر اساس تنظیمات مهلت فعلی
const cancellationExamples = computed(() => {
  const deadline = parseInt(cancellation.value.deadlineMinutes || '0')
  return [
    { label: `اکنون + ${deadline + 30} دقیقه`, allowed: true },
    { label: `اکنون + ${deadline} دقیقه`,      allowed: false },
    { label: `اکنون + ${Math.max(0, deadline - 30)} دقیقه`, allowed: false },
  ]
})

const settingsHeaders = [
  { title: 'کلید',     key: 'key',       sortable: true },
  { title: 'مقدار',   key: 'value',     sortable: false },
  { title: 'بروزرسانی', key: 'updatedAt', sortable: true },
]

onMounted(loadSettings)

async function loadSettings() {
  loadingSettings.value = true
  try {
    const { data } = await $api.get('/settings')
    allSettings.value = data
    const get = (key: string, fb: string) => data.find((s: any) => s.key === key)?.value ?? fb
    pricing.value.farePerKm           = get('fare_per_km', '5000')
    pricing.value.baseFare            = get('base_fare', '10000')
    pricing.value.minimumFare         = get('minimum_fare', '20000')
    cancellation.value.deadlineMinutes = get('cancellation_deadline_minutes', '60')
    driverBuffer.value.minutes        = get('driver_buffer_minutes', '60')
    general.value.minAdvanceMinutes   = get('min_advance_minutes', '30')
    general.value.maxPassengers       = get('max_passengers', '8')
    general.value.smsOnBooking        = get('sms_on_booking', 'true') === 'true'
    general.value.smsOnDriverAssigned = get('sms_on_driver_assigned', 'true') === 'true'
  } finally { loadingSettings.value = false }
}

const saveSetting = (key: string, value: string, description?: string) =>
  $api.put('/settings', { key, value, description })

const flash = (ref: Ref<boolean>) => { ref.value = true; setTimeout(() => { ref.value = false }, 3000) }

const savePricing = async () => {
  savingPricing.value = true; pricingError.value = ''
  try {
    await Promise.all([
      saveSetting('fare_per_km',   pricing.value.farePerKm,  'کرایه به ازای هر کیلومتر (تومان)'),
      saveSetting('base_fare',     pricing.value.baseFare,   'کرایه پایه ثابت برای هر سفر (تومان)'),
      saveSetting('minimum_fare',  pricing.value.minimumFare,'حداقل کرایه برای هر سفر (تومان)'),
    ])
    flash(pricingSuccess); await loadSettings()
  } catch (e: any) { pricingError.value = e.response?.data?.message || 'ذخیره ناموفق بود' }
  finally { savingPricing.value = false }
}

const saveCancellation = async () => {
  savingCancellation.value = true
  try {
    await saveSetting('cancellation_deadline_minutes', cancellation.value.deadlineMinutes, 'دقیقه قبل از سفر که لغو مشتری مسدود می‌شود (۰ = همیشه مجاز)')
    flash(cancellationSuccess); await loadSettings()
  } finally { savingCancellation.value = false }
}

const saveDriverBuffer = async () => {
  savingBuffer.value = true
  try {
    await saveSetting('driver_buffer_minutes', driverBuffer.value.minutes, 'پنجره بافر بر حسب دقیقه برای تشخیص تداخل در دسترس بودن راننده')
    flash(bufferSuccess); await loadSettings()
  } finally { savingBuffer.value = false }
}

const saveGeneral = async () => {
  savingGeneral.value = true
  try {
    await Promise.all([
      saveSetting('min_advance_minutes',       general.value.minAdvanceMinutes, 'حداقل زمان پیش‌رزرو (دقیقه)'),
      saveSetting('max_passengers',            general.value.maxPassengers,     'حداکثر مسافران در هر رزرو'),
      saveSetting('sms_on_booking',            String(general.value.smsOnBooking),         'ارسال پیامک در رزرو جدید'),
      saveSetting('sms_on_driver_assigned',    String(general.value.smsOnDriverAssigned),  'ارسال پیامک هنگام اختصاص راننده'),
    ])
    flash(generalSuccess); await loadSettings()
  } finally { savingGeneral.value = false }
}
</script>