<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">جوایز مشتریان</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">مدیریت قوانین جایزه و تأیید پاداش‌ها</p>
      </div>
    </div>

    <!-- Stats -->
    <v-row class="mb-6">
      <v-col v-for="s in stats" :key="s.label" cols="6" md="3">
        <v-card rounded="lg" variant="tonal" :color="s.color">
          <v-card-text class="text-center pa-4">
            <div class="text-h4 font-weight-bold">{{ s.value }}</div>
            <div class="text-body-2 mt-1">{{ s.label }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-tabs v-model="tab" color="primary" class="mb-5">
      <v-tab value="rules">قوانین جایزه</v-tab>
      <v-tab value="approvals">
        تأیید جوایز
        <v-chip v-if="pendingCount" class="ms-2" size="x-small" color="warning">
          {{ pendingCount }}
        </v-chip>
      </v-tab>
    </v-tabs>

    <!-- ── RULES tab ─────────────────────────────────────────── -->
    <div v-if="tab === 'rules'">
      <div class="d-flex justify-end mb-4">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openRuleDialog()">
          قانون جدید
        </v-btn>
      </div>

      <v-card rounded="lg">
        <v-data-table
          :headers="ruleHeaders"
          :items="rules"
          :loading="rulesLoading"
          no-data-text="هیچ قانونی تعریف نشده است"
          loading-text="در حال بارگذاری..."
          items-per-page-text="ردیف در صفحه"
        >
          <template #item.isActive="{ item }">
            <v-switch
              :model-value="item.isActive"
              density="compact"
              hide-details
              color="success"
              @change="toggleRule(item)"
            />
          </template>

          <template #item.triggerType="{ item }">
            <v-chip size="small" color="blue" variant="tonal">
              {{ triggerLabel(item.triggerType) }}
              <span v-if="item.triggerValue"> ({{ item.triggerValue }})</span>
            </v-chip>
          </template>

          <template #item.rewardType="{ item }">
            <div class="d-flex flex-column gap-1 py-1">
              <v-chip
                v-if="item.rewardType !== 'coupon'"
                size="x-small"
                color="purple"
                variant="tonal"
              >
                🪙 {{ item.pointsAmount?.toLocaleString('fa-IR') }} امتیاز
              </v-chip>
              <v-chip
                v-if="item.rewardType !== 'points'"
                size="x-small"
                color="green"
                variant="tonal"
              >
                🎟️ {{ item.couponDiscountPercent }}٪ تخفیف
                <span v-if="item.couponMaxDiscount">
                  (حداکثر {{ formatToman(item.couponMaxDiscount) }})
                </span>
              </v-chip>
            </div>
          </template>

          <template #item.couponValidityDays="{ item }">
            <span class="text-body-2">{{ item.couponValidityDays }} روز</span>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex gap-2">
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="openRuleDialog(item)" />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="deleteRule(item.id)"
              />
            </div>
          </template>
        </v-data-table>
      </v-card>
    </div>

    <!-- ── APPROVALS tab ─────────────────────────────────────── -->
    <div v-if="tab === 'approvals'">
      <v-tabs v-model="approvalFilter" density="compact" class="mb-4">
        <v-tab value="pending_approval">در انتظار</v-tab>
        <v-tab value="approved">تأییدشده</v-tab>
        <v-tab value="rejected">ردشده</v-tab>
      </v-tabs>

      <v-card rounded="lg">
        <v-data-table
          :headers="rewardHeaders"
          :items="filteredRewards"
          :loading="rewardsLoading"
          no-data-text="جایزه‌ای یافت نشد"
          loading-text="در حال بارگذاری..."
          items-per-page-text="ردیف در صفحه"
        >
          <template #item.type="{ item }">
            <v-chip
              :color="item.type === 'points' ? 'purple' : 'green'"
              size="small"
              variant="tonal"
            >
              {{ item.type === 'points' ? '🪙 امتیاز' : '🎟️ کوپن' }}
            </v-chip>
          </template>

          <template #item.value="{ item }">
            <span v-if="item.type === 'points'" class="font-weight-medium">
              {{ item.pointsAmount?.toLocaleString('fa-IR') }} امتیاز
            </span>
            <span v-else>
              {{ item.couponDiscountPercent }}٪ — کد: <code>{{ item.couponCode }}</code>
            </span>
          </template>

          <template #item.status="{ item }">
            <v-chip :color="statusColor(item.status)" size="small" variant="tonal">
              {{ statusLabel(item.status) }}
            </v-chip>
          </template>

          <template #item.createdAt="{ item }">
            <span class="text-body-2">{{ formatDate(item.createdAt) }}</span>
          </template>

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
            <span v-else class="text-caption text-medium-emphasis">
              {{ item.adminNote || '—' }}
            </span>
          </template>
        </v-data-table>
      </v-card>
    </div>

    <!-- Rule dialog -->
    <v-dialog v-model="ruleDialog" max-width="580" scrollable>
      <v-card rounded="lg">
        <v-card-title class="pa-6 pb-2">
          {{ editingRule ? 'ویرایش قانون' : 'قانون جدید' }}
        </v-card-title>
        <v-card-text class="pa-6 pt-2">
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="ruleForm.name" label="نام قانون" variant="outlined" />
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="ruleForm.description" label="توضیحات" variant="outlined" rows="2" />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="ruleForm.triggerType"
                :items="triggerOptions"
                item-title="label"
                item-value="value"
                label="نوع شرط"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="ruleForm.triggerValue"
                label="مقدار شرط (تعداد سفر)"
                variant="outlined"
                type="number"
                :disabled="ruleForm.triggerType === 'first_trip'"
                :hint="triggerHint"
                persistent-hint
              />
            </v-col>

            <v-col cols="12">
              <v-select
                v-model="ruleForm.rewardType"
                :items="rewardTypeOptions"
                item-title="label"
                item-value="value"
                label="نوع جایزه"
                variant="outlined"
              />
            </v-col>

            <!-- Points fields -->
            <template v-if="ruleForm.rewardType !== 'coupon'">
              <v-col cols="12">
                <v-text-field
                  v-model.number="ruleForm.pointsAmount"
                  label="تعداد امتیاز"
                  variant="outlined"
                  type="number"
                  prefix="🪙"
                />
              </v-col>
            </template>

            <!-- Coupon fields -->
            <template v-if="ruleForm.rewardType !== 'points'">
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="ruleForm.couponDiscountPercent"
                  label="درصد تخفیف"
                  variant="outlined"
                  type="number"
                  suffix="٪"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="ruleForm.couponMaxDiscount"
                  label="سقف تخفیف (تومان)"
                  variant="outlined"
                  type="number"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="ruleForm.couponValidityDays"
                  label="اعتبار (روز)"
                  variant="outlined"
                  type="number"
                />
              </v-col>
            </template>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-btn variant="text" @click="ruleDialog = false">انصراف</v-btn>
          <v-spacer />
          <v-btn color="primary" :loading="actionLoading" @click="submitRule">
            {{ editingRule ? 'ذخیره تغییرات' : 'ایجاد قانون' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Approve dialog -->
    <v-dialog v-model="approveDialog" max-width="460">
      <v-card rounded="lg">
        <v-card-title class="pa-6 pb-2">تأیید جایزه</v-card-title>
        <v-card-text class="pa-6 pt-2">
          <p class="mb-4">
            جایزه
            <strong>{{ selectedReward?.type === 'points' ? `${selectedReward?.pointsAmount} امتیاز` : `کوپن ${selectedReward?.couponDiscountPercent}٪` }}</strong>
            برای مشتری شماره {{ selectedReward?.customerId }} تأیید شود؟
          </p>
          <v-textarea v-model="adminNote" label="یادداشت (اختیاری)" variant="outlined" rows="2" />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-btn variant="text" @click="approveDialog = false">انصراف</v-btn>
          <v-spacer />
          <v-btn color="success" :loading="actionLoading" @click="confirmApprove">تأیید</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reject dialog -->
    <v-dialog v-model="rejectDialog" max-width="460">
      <v-card rounded="lg">
        <v-card-title class="pa-6 pb-2">رد جایزه</v-card-title>
        <v-card-text class="pa-6 pt-2">
          <v-textarea v-model="adminNote" label="دلیل رد" variant="outlined" rows="3" />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-btn variant="text" @click="rejectDialog = false">انصراف</v-btn>
          <v-spacer />
          <v-btn color="error" :loading="actionLoading" @click="confirmReject">رد جایزه</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
const { $api } = useNuxtApp()

definePageMeta({ layout: 'admin'})

// ── State ────────────────────────────────────────────────────────
const tab = ref('rules')
const approvalFilter = ref('pending_approval')
const rulesLoading = ref(false)
const rewardsLoading = ref(false)
const actionLoading = ref(false)
const rules = ref<any[]>([])
const allRewards = ref<any[]>([])
const ruleDialog = ref(false)
const approveDialog = ref(false)
const rejectDialog = ref(false)
const editingRule = ref<any>(null)
const selectedReward = ref<any>(null)
const adminNote = ref('')
const snackbar = ref({ show: false, text: '', color: 'success' })

const defaultRuleForm = () => ({
  name: '',
  description: '',
  triggerType: 'every_n_trips',
  triggerValue: 5,
  rewardType: 'both',
  pointsAmount: 100,
  couponDiscountPercent: 10,
  couponMaxDiscount: 50000,
  couponValidityDays: 30,
})
const ruleForm = ref(defaultRuleForm())

// ── Table headers ────────────────────────────────────────────────
const ruleHeaders = [
  { title: 'نام قانون', key: 'name' },
  { title: 'شرط', key: 'triggerType' },
  { title: 'جایزه', key: 'rewardType', sortable: false },
  { title: 'اعتبار کوپن', key: 'couponValidityDays' },
  { title: 'فعال', key: 'isActive' },
  { title: 'عملیات', key: 'actions', sortable: false },
]

const rewardHeaders = [
  { title: 'نوع', key: 'type' },
  { title: 'مقدار', key: 'value', sortable: false },
  { title: 'مشتری', key: 'customerId' },
  { title: 'سفر', key: 'bookingId' },
  { title: 'وضعیت', key: 'status' },
  { title: 'تاریخ', key: 'createdAt' },
  { title: 'عملیات', key: 'actions', sortable: false },
]

// ── Options ──────────────────────────────────────────────────────
const triggerOptions = [
  { label: 'هر N سفر', value: 'every_n_trips' },
  { label: 'مایلستون سفر (N‌امین سفر)', value: 'trip_milestone' },
  { label: 'اولین سفر', value: 'first_trip' },
]

const rewardTypeOptions = [
  { label: 'فقط امتیاز', value: 'points' },
  { label: 'فقط کوپن تخفیف', value: 'coupon' },
  { label: 'هر دو (امتیاز + کوپن)', value: 'both' },
]

// ── Computed ─────────────────────────────────────────────────────
const pendingCount = computed(() =>
  allRewards.value.filter(r => r.status === 'pending_approval').length
)

const filteredRewards = computed(() =>
  allRewards.value.filter(r => r.status === approvalFilter.value)
)

const stats = computed(() => [
  { label: 'قوانین فعال', value: rules.value.filter(r => r.isActive).length, color: 'primary' },
  { label: 'در انتظار تأیید', value: pendingCount.value, color: 'warning' },
  { label: 'تأییدشده', value: allRewards.value.filter(r => r.status === 'approved').length, color: 'success' },
  { label: 'ردشده', value: allRewards.value.filter(r => r.status === 'rejected').length, color: 'error' },
])

const triggerHint = computed(() => {
  if (ruleForm.value.triggerType === 'every_n_trips') return `هر ${ruleForm.value.triggerValue} سفر یک‌بار`
  if (ruleForm.value.triggerType === 'trip_milestone') return `دقیقاً در سفر ${ruleForm.value.triggerValue}ام`
  return 'فقط برای اولین سفر'
})

// ── Helpers ──────────────────────────────────────────────────────
const triggerLabel = (t: string) => ({
  every_n_trips: 'هر N سفر',
  trip_milestone: 'مایلستون',
  first_trip: 'اولین سفر',
}[t] || t)

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

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fa-IR') : '—'
const formatToman = (n: number) => n?.toLocaleString('fa-IR') + ' ت'

// ── API ──────────────────────────────────────────────────────────
const fetchRules = async () => {
  rulesLoading.value = true
  try { rules.value = await $api.get('/customer-rewards/admin/rules') }
  catch { showSnack('خطا در بارگذاری قوانین', 'error') }
  finally { rulesLoading.value = false }
}

const fetchRewards = async () => {
  rewardsLoading.value = true
  try { allRewards.value = await $api.get('/customer-rewards/admin/all') }
  catch { showSnack('خطا در بارگذاری جوایز', 'error') }
  finally { rewardsLoading.value = false }
}

const openRuleDialog = (rule?: any) => {
  editingRule.value = rule || null
  ruleForm.value = rule ? { ...rule } : defaultRuleForm()
  ruleDialog.value = true
}

const submitRule = async () => {
  actionLoading.value = true
  try {
    if (editingRule.value) {
      await $api.patch(`/customer-rewards/admin/rules/${editingRule.value.id}`, ruleForm.value)
    } else {
      await $api.post('/customer-rewards/admin/rules',  ruleForm.value )
    }
    showSnack(editingRule.value ? 'قانون ویرایش شد' : 'قانون ایجاد شد')
    ruleDialog.value = false
    await fetchRules()
  } catch { showSnack('خطا در ذخیره قانون', 'error') }
  finally { actionLoading.value = false }
}

const toggleRule = async (rule: any) => {
  try {
    await $api.patch(`/customer-rewards/admin/rules/${rule.id}`,  { isActive: !rule.isActive })
    await fetchRules()
  } catch { showSnack('خطا در تغییر وضعیت', 'error') }
}

const deleteRule = async (id: number) => {
  if (!confirm('آیا مطمئنید؟')) return
  try {
    await $api.delete(`/customer-rewards/admin/rules/${id}`)
    showSnack('قانون حذف شد')
    await fetchRules()
  } catch { showSnack('خطا در حذف قانون', 'error') }
}

const openApprove = (r: any) => { selectedReward.value = r; adminNote.value = ''; approveDialog.value = true }
const openReject = (r: any) => { selectedReward.value = r; adminNote.value = ''; rejectDialog.value = true }

const confirmApprove = async () => {
  actionLoading.value = true
  try {
    await $api.patch(`/customer-rewards/admin/${selectedReward.value.id}/approve`, { note: adminNote.value })
    showSnack('جایزه تأیید شد ✅')
    approveDialog.value = false
    await fetchRewards()
  } catch { showSnack('خطا در تأیید', 'error') }
  finally { actionLoading.value = false }
}

const confirmReject = async () => {
  actionLoading.value = true
  try {
    await $api.patch(`/customer-rewards/admin/${selectedReward.value.id}/reject`, { note: adminNote.value })
    showSnack('جایزه رد شد')
    rejectDialog.value = false
    await fetchRewards()
  } catch { showSnack('خطا در رد جایزه', 'error') }
  finally { actionLoading.value = false }
}

const showSnack = (text: string, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

onMounted(() => { fetchRules(); fetchRewards() })
</script>
