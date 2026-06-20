<template>
  <div style="direction: rtl">
    <!-- Header -->
    <div class="profile-hero pa-8 mb-6">
      <v-container>
        <div class="text-overline text-primary font-weight-bold mb-1">حساب کاربری</div>
        <h1 class="text-h4 font-weight-bold text-secondary">پروفایل من</h1>
        <p class="text-body-2 text-grey mt-1">مشاهده و ویرایش اطلاعات حساب کاربری</p>
      </v-container>
    </div>

    <v-container style="max-width: 800px">
      <v-row>
        <!-- Left: Avatar + stats -->
        <v-col cols="12" md="4">

          <!-- Avatar card -->
          <v-card rounded="xl" class="pa-6 text-center mb-4">
            <v-avatar color="primary" size="80" class="mb-4">
              <span class="text-h3 font-weight-bold text-white">
                {{ authStore.user?.fullName?.charAt(0) }}
              </span>
            </v-avatar>
            <div class="text-h6 font-weight-bold text-secondary mb-1">
              {{ authStore.user?.fullName }}
            </div>
            <div class="text-body-2 text-grey mb-3">{{ authStore.user?.phone }}</div>
            <v-chip
              :color="authStore.user?.isVerified ? 'success' : 'warning'"
              size="small"
              label
            >
              <v-icon start size="14">
                {{ authStore.user?.isVerified ? 'mdi-check-circle' : 'mdi-clock-outline' }}
              </v-icon>
              {{ authStore.user?.isVerified ? 'تأیید شده' : 'در انتظار تأیید' }}
            </v-chip>
          </v-card>

          <!-- Trip stats -->
          <v-card rounded="xl" class="pa-5 mb-4">
            <div class="text-subtitle-2 font-weight-bold text-secondary mb-4">آمار سفرها</div>

            <div v-if="loadingStats" class="d-flex justify-center pa-4">
              <v-progress-circular indeterminate color="primary" size="32" />
            </div>

            <v-list v-else density="compact" class="pa-0">
              <v-list-item class="px-0 py-2">
                <template #prepend>
                  <v-avatar color="primary" size="36" rounded="lg" class="ml-3">
                    <v-icon color="white" size="18">mdi-calendar-check</v-icon>
                  </v-avatar>
                </template>
                <template #title>
                  <span class="text-caption text-grey">کل رزروها</span>
                </template>
                <template #subtitle>
                  <span class="text-body-2 font-weight-bold text-secondary">{{ stats.total }}</span>
                </template>
              </v-list-item>

              <v-list-item class="px-0 py-2">
                <template #prepend>
                  <v-avatar color="success" size="36" rounded="lg" class="ml-3">
                    <v-icon color="white" size="18">mdi-flag-checkered</v-icon>
                  </v-avatar>
                </template>
                <template #title>
                  <span class="text-caption text-grey">سفرهای انجام شده</span>
                </template>
                <template #subtitle>
                  <span class="text-body-2 font-weight-bold text-secondary">{{ stats.completed }}</span>
                </template>
              </v-list-item>

              <v-list-item class="px-0 py-2">
                <template #prepend>
                  <v-avatar color="warning" size="36" rounded="lg" class="ml-3">
                    <v-icon color="white" size="18">mdi-clock-outline</v-icon>
                  </v-avatar>
                </template>
                <template #title>
                  <span class="text-caption text-grey">رزروهای آینده</span>
                </template>
                <template #subtitle>
                  <span class="text-body-2 font-weight-bold text-secondary">{{ stats.upcoming }}</span>
                </template>
              </v-list-item>

              <v-list-item class="px-0 py-2">
                <template #prepend>
                  <v-avatar color="info" size="36" rounded="lg" class="ml-3">
                    <v-icon color="white" size="18">mdi-cash</v-icon>
                  </v-avatar>
                </template>
                <template #title>
                  <span class="text-caption text-grey">مجموع پرداختی</span>
                </template>
                <template #subtitle>
                  <span class="text-body-2 font-weight-bold text-primary">
                    {{ formatToman(stats.totalSpent) }}
                  </span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>

          <!-- Quick links -->
          <v-card rounded="xl" class="pa-2">
            <v-list density="compact" rounded="lg">
              <v-list-item
                prepend-icon="mdi-history"
                title="سفرهای من"
                to="/client/trips"
                rounded="lg"
              >
                <template #append>
                  <v-icon size="16" color="grey">mdi-chevron-left</v-icon>
                </template>
              </v-list-item>
              <v-list-item
                prepend-icon="mdi-plus-circle"
                title="رزرو سفر جدید"
                to="/client/booking"
                color="primary"
                rounded="lg"
              >
                <template #append>
                  <v-icon size="16" color="grey">mdi-chevron-left</v-icon>
                </template>
              </v-list-item>
              <v-list-item
                prepend-icon="mdi-logout"
                title="خروج از حساب"
                color="error"
                rounded="lg"
                @click="logout"
              >
                <template #append>
                  <v-icon size="16" color="grey">mdi-chevron-left</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- Right: Edit form -->
        <v-col cols="12" md="8">

          <!-- Personal info -->
          <v-card rounded="xl" class="pa-6 mb-4">
            <div class="d-flex align-center justify-space-between mb-5">
              <div class="text-subtitle-1 font-weight-bold text-secondary">اطلاعات شخصی</div>
              <v-btn
                v-if="!editingInfo"
                variant="tonal"
                color="primary"
                size="small"
                prepend-icon="mdi-pencil"
                @click="startEditInfo"
              >
                ویرایش
              </v-btn>
            </div>

            <!-- View mode -->
            <div v-if="!editingInfo">
              <v-list density="compact" class="pa-0">
                <v-list-item prepend-icon="mdi-account" class="px-0">
                  <template #title><span class="text-caption text-grey">نام و نام خانوادگی</span></template>
                  <template #subtitle>
                    <span class="text-body-2 font-weight-medium text-secondary">
                      {{ authStore.user?.fullName || '—' }}
                    </span>
                  </template>
                </v-list-item>
                <v-divider class="my-2" />
                <v-list-item prepend-icon="mdi-phone" class="px-0">
                  <template #title><span class="text-caption text-grey">شماره موبایل</span></template>
                  <template #subtitle>
                    <div class="d-flex align-center gap-2">
                      <span class="text-body-2 font-weight-medium text-secondary">
                        {{ authStore.user?.phone }}
                      </span>
                      <v-chip size="x-small" color="success" variant="tonal">تأیید شده</v-chip>
                    </div>
                  </template>
                </v-list-item>
                <v-divider class="my-2" />
                <v-list-item prepend-icon="mdi-email" class="px-0">
                  <template #title><span class="text-caption text-grey">ایمیل</span></template>
                  <template #subtitle>
                    <span class="text-body-2 font-weight-medium text-secondary">
                      {{ authStore.user?.email || 'وارد نشده' }}
                    </span>
                  </template>
                </v-list-item>
              </v-list>
            </div>

            <!-- Edit mode -->
            <v-form v-else ref="infoForm" v-model="infoValid" @submit.prevent="saveInfo">
              <v-text-field
                v-model="infoFields.fullName"
                label="نام و نام خانوادگی"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                rounded="lg"
                :rules="[rules.required]"
                class="mb-3"
              />
              <v-text-field
                v-model="infoFields.email"
                label="ایمیل (اختیاری)"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                rounded="lg"
                :rules="[rules.email]"
                class="mb-3"
              />

              <!-- Phone — readonly, can't change -->
              <v-text-field
                :model-value="authStore.user?.phone"
                label="شماره موبایل"
                prepend-inner-icon="mdi-phone"
                variant="outlined"
                rounded="lg"
                readonly
                disabled
                hint="شماره موبایل قابل تغییر نیست"
                persistent-hint
                class="mb-4"
              />

              <v-alert v-if="infoError" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4" :text="infoError" />
              <v-alert v-if="infoSuccess" type="success" variant="tonal" rounded="lg" density="compact" class="mb-4" text="اطلاعات با موفقیت ذخیره شد." />

              <div class="d-flex gap-3 flex-col">
                <v-btn variant="outlined" color="secondary" @click="cancelEditInfo">انصراف</v-btn>
                <v-btn
                  type="submit"
                  color="primary"
                  class="flex-1"
                  :loading="savingInfo"
                  :disabled="!infoValid"
                  prepend-icon="mdi-content-save"
                >
                  ذخیره تغییرات
                </v-btn>
              </div>
            </v-form>
          </v-card>

          <!-- Account security -->
          <v-card rounded="xl" class="pa-6 mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary mb-5">امنیت حساب</div>

            <v-list density="compact" class="pa-0">
              <v-list-item class="px-0 py-3">
                <template #prepend>
                  <v-icon color="success" class="ml-3">mdi-shield-check</v-icon>
                </template>
                <template #title>
                  <span class="text-body-2 font-weight-medium">احراز هویت دو مرحله‌ای</span>
                </template>
                <template #subtitle>
                  <span class="text-caption text-grey">از طریق پیامک فعال است</span>
                </template>
                <template #append>
                  <v-chip size="x-small" color="success" variant="tonal">فعال</v-chip>
                </template>
              </v-list-item>

              <v-divider />

              <v-list-item class="px-0 py-3">
                <template #prepend>
                  <v-icon color="primary" class="ml-3">mdi-cellphone</v-icon>
                </template>
                <template #title>
                  <span class="text-body-2 font-weight-medium">شماره موبایل تأیید شده</span>
                </template>
                <template #subtitle>
                  <span class="text-caption text-grey">{{ authStore.user?.phone }}</span>
                </template>
                <template #append>
                  <v-chip size="x-small" color="success" variant="tonal">تأیید شده</v-chip>
                </template>
              </v-list-item>

              <v-divider />

              <v-list-item class="px-0 py-3">
                <template #prepend>
                  <v-icon color="grey" class="ml-3">mdi-calendar</v-icon>
                </template>
                <template #title>
                  <span class="text-body-2 font-weight-medium">تاریخ عضویت</span>
                </template>
                <template #subtitle>
                  <span class="text-caption text-grey">
                    {{ authStore.user?.createdAt
                      ? new Date(authStore.user.createdAt).toLocaleDateString('fa-IR')
                      : '—'
                    }}
                  </span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>

          <!-- Danger zone -->
          <v-card rounded="xl" class="pa-6" color="error" variant="tonal">
            <div class="text-subtitle-1 font-weight-bold text-error mb-2">خروج از حساب</div>
            <div class="text-body-2 text-grey mb-4">
              با خروج از حساب، نشست جاری شما پایان می‌یابد.
            </div>
            <v-btn
              color="error"
              variant="tonal"
              prepend-icon="mdi-logout"
              @click="logout"
            >
              خروج از حساب کاربری
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { formatToman } from '~/utils/currency'

definePageMeta({ layout: 'client' })

const { $api }    = useNuxtApp()
const authStore   = useAuthStore()
const bookingsStore = useBookingsStore()

// ── Stats ─────────────────────────────────────────────────────────────────────
const loadingStats = ref(false)
const stats = ref({ total: 0, completed: 0, upcoming: 0, totalSpent: 0 })

onMounted(async () => {
  if (!authStore.isAuthenticated) { navigateTo('/auth/login'); return }
  await loadStats()
})

const loadStats = async () => {
  loadingStats.value = true
  try {
    await bookingsStore.fetchMyBookings()
    const bookings = bookingsStore.myBookings
    stats.value = {
      total:      bookings.length,
      completed:  bookings.filter((b) => b.status === 'completed').length,
      upcoming:   bookings.filter((b) => ['pending', 'confirmed'].includes(b.status)).length,
      totalSpent: bookings
        .filter((b) => b.status === 'completed')
        .reduce((sum, b) => sum + parseFloat((b.finalFare || b.estimatedFare || 0) as any), 0),
    }
  } finally { loadingStats.value = false }
}

// ── Edit profile ──────────────────────────────────────────────────────────────
const editingInfo = ref(false)
const infoValid   = ref(false)
const savingInfo  = ref(false)
const infoError   = ref('')
const infoSuccess = ref(false)
const infoForm    = ref()

const infoFields = ref({ fullName: '', email: '' })

const rules = {
  required: (v: string) => !!v || 'این فیلد الزامی است',
  email:    (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'ایمیل معتبر نیست',
}

const startEditInfo = () => {
  infoFields.value = {
    fullName: authStore.user?.fullName || '',
    email:    authStore.user?.email    || '',
  }
  infoError.value   = ''
  infoSuccess.value = false
  editingInfo.value = true
}

const cancelEditInfo = () => {
  editingInfo.value = false
  infoError.value   = ''
  infoSuccess.value = false
}

const saveInfo = async () => {
  const { valid } = await infoForm.value.validate()
  if (!valid) return

  savingInfo.value  = true
  infoError.value   = ''
  infoSuccess.value = false

  try {
    const { data } = await $api.patch('/users/me', {
      fullName: infoFields.value.fullName,
      email:    infoFields.value.email || null,
    })

    // Update local store
    authStore.setAuth(authStore.token!, {
      ...authStore.user!,
      fullName: data.fullName,
      email:    data.email,
    })

    infoSuccess.value = true
    setTimeout(() => {
      editingInfo.value = false
      infoSuccess.value = false
    }, 1500)
  } catch (e: any) {
    infoError.value = e.response?.data?.message || 'خطا در ذخیره اطلاعات'
  } finally {
    savingInfo.value = false
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = () => {
  authStore.logout()
  navigateTo('/auth/login')
}
</script>

<style scoped>
.profile-hero {
  background: linear-gradient(135deg, #fff8ee 0%, #ffffff 100%);
  border-bottom: 1px solid #f0f0f0;
}
</style>
