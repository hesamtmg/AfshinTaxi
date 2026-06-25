<template>
  <div>
    <!-- Points wallet card -->
    <v-card rounded="lg" class="mb-4" variant="tonal" color="purple">
      <v-card-text class="pa-5">
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-caption text-medium-emphasis mb-1">موجودی امتیاز شما</div>
            <div class="text-h4 font-weight-bold">
              🪙 {{ wallet?.balance?.toLocaleString('fa-IR') || '۰' }}
            </div>
            <div class="text-caption mt-1 text-medium-emphasis">
              مجموع کسب‌شده: {{ wallet?.totalEarned?.toLocaleString('fa-IR') || '۰' }}
            </div>
          </div>
          <v-icon size="48" color="purple-lighten-3">mdi-star-circle</v-icon>
        </div>

        <v-divider class="my-3 opacity-20" />

        <div class="d-flex align-center gap-2">
          <v-icon size="16" color="purple-lighten-2">mdi-clock-outline</v-icon>
          <span class="text-caption text-medium-emphasis">
            {{ pendingCount }} جایزه در انتظار تأیید مدیر
          </span>
        </div>
      </v-card-text>
    </v-card>

    <!-- Active coupons -->
    <v-card v-if="coupons.length" rounded="lg" class="mb-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-bold">
        <v-icon start color="green">mdi-ticket-percent</v-icon>
        کوپن‌های تخفیف فعال
      </v-card-title>
      <v-card-text class="pa-4 pt-0">
        <div class="d-flex flex-column gap-3">
          <div
            v-for="coupon in coupons"
            :key="coupon.id"
            class="coupon-card pa-4 rounded-lg d-flex align-center justify-space-between"
          >
            <div>
              <div class="text-h6 font-weight-bold text-green">
                {{ coupon.couponDiscountPercent }}٪ تخفیف
              </div>
              <div class="text-caption text-medium-emphasis">
                <span v-if="coupon.couponMaxDiscount">
                  حداکثر {{ coupon.couponMaxDiscount?.toLocaleString('fa-IR') }} تومان
                </span>
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                انقضا: {{ formatDate(coupon.couponExpiresAt) }}
              </div>
            </div>
            <div class="text-left">
              <v-chip
                color="green"
                variant="outlined"
                class="coupon-code font-weight-bold"
                @click="copyCode(coupon.couponCode)"
              >
                {{ coupon.couponCode }}
                <v-icon end size="14">mdi-content-copy</v-icon>
              </v-chip>
              <div class="text-caption text-medium-emphasis mt-1 text-center">
                کپی کد
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Empty coupons -->
    <v-card v-else-if="!loading" rounded="lg" variant="outlined" class="mb-4">
      <v-card-text class="text-center py-6 text-medium-emphasis">
        <v-icon size="36" class="mb-2">mdi-ticket-outline</v-icon>
        <p class="text-body-2">کوپن فعالی ندارید</p>
        <p class="text-caption">با هر سفر، امتیاز و کوپن کسب کنید!</p>
      </v-card-text>
    </v-card>

    <!-- Copy snackbar -->
    <v-snackbar v-model="copied" color="success" timeout="2000" location="bottom">
      کد کوپن کپی شد ✓
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
const { $api } = useNuxtApp()

const loading = ref(true)
const wallet = ref<any>(null)
const coupons = ref<any[]>([])
const pendingCount = ref(0)
const copied = ref(false)

const fetchRewards = async () => {
  loading.value = true
  try {
    const data = await $api('/customer-rewards/my')
    wallet.value = data.wallet
    coupons.value = data.coupons
    pendingCount.value = data.pendingCount
  } catch {
    wallet.value = { balance: 0, totalEarned: 0 }
    coupons.value = []
  } finally {
    loading.value = false
  }
}

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('fa-IR') : '—'

const copyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
  } catch {
    // fallback for older browsers
  }
}

onMounted(fetchRewards)

// Expose for parent (e.g. booking page can call refresh after a trip)
defineExpose({ fetchRewards })
</script>

<style scoped>
.coupon-card {
  border: 1.5px dashed rgba(var(--v-theme-success), 0.4);
  background: rgba(var(--v-theme-success), 0.04);
}
.coupon-code {
  font-family: monospace;
  letter-spacing: 2px;
  cursor: pointer;
}
</style>
