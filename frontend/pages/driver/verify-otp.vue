<template>
  <v-app>
    <v-main style="background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%); min-height:100vh" class="d-flex align-center">
      <v-container style="max-width:420px">

        <!-- لوگو -->
        <div class="text-center mb-8">
          <div class="d-flex justify-center mb-4">
            <v-avatar color="primary" size="72" rounded="xl">
              <v-icon size="40" color="white">mdi-message-lock</v-icon>
            </v-avatar>
          </div>
          <h1 class="text-h4 font-weight-bold text-white mb-2">ورود کد</h1>
          <p class="text-body-2 text-grey">
            کد ۶ رقمی به شماره<br />
            <strong class="text-white">{{ driverStore.pendingPhone }}</strong>
            ارسال شد
          </p>
        </div>

        <v-card rounded="xl" class="pa-6">
          <!-- ورودی کد -->
          <div class="d-flex justify-center gap-2 mb-6">
            <v-text-field
              v-for="(_, i) in otpDigits"
              :key="i"
              :ref="(el) => (inputRefs[i] = el)"
              v-model="otpDigits[i]"
              maxlength="1"
              variant="outlined"
              style="width:52px"
              class="otp-field"
              hide-details
              @input="handleInput(i)"
              @keydown.backspace="handleBackspace(i)"
              @paste.prevent="handlePaste"
            />
          </div>

          <!-- نقطه‌های پیشرفت -->
          <div class="d-flex justify-center gap-2 mb-6">
            <div
              v-for="(_, i) in otpDigits"
              :key="i"
              class="otp-dot"
              :class="otpDigits[i] ? 'filled' : ''"
            />
          </div>

          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            rounded="lg"
            class="mb-4"
            :text="error"
          />

          <v-btn
            color="primary"
            size="large"
            block
            :loading="loading"
            :disabled="otp.length < 6"
            class="mb-4"
            @click="handleVerify"
          >
            <v-icon start>mdi-check-circle</v-icon>
            تأیید و ورود
          </v-btn>

          <!-- ارسال مجدد -->
          <div class="text-center">
            <v-btn
              variant="text"
              size="small"
              color="primary"
              :disabled="resendCooldown > 0"
              @click="handleResend"
            >
              <v-icon start size="16">mdi-refresh</v-icon>
              {{ resendCooldown > 0 ? `ارسال مجدد در ${resendCooldown} ثانیه` : 'ارسال مجدد کد' }}
            </v-btn>
          </div>
        </v-card>

        <!-- بازگشت -->
        <div class="text-center mt-4">
          <v-btn
            variant="text"
            color="grey"
            prepend-icon="mdi-arrow-right"
            to="/driver/login"
          >
            بازگشت به ورود
          </v-btn>
        </div>

      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
const { $api }    = useNuxtApp()
const driverStore = useDriverStore()

// بررسی وجود شماره تلفن در انتظار
onMounted(() => {
  if (!driverStore.pendingPhone) navigateTo('/driver/login')
})

const otpDigits      = ref(Array(6).fill(''))
const inputRefs      = ref<any[]>([])
const loading        = ref(false)
const error          = ref('')
const resendCooldown = ref(0)

const otp = computed(() => otpDigits.value.join(''))

// فوکوس خودکار روی اولین فیلد
onMounted(() => {
  setTimeout(() => inputRefs.value[0]?.focus(), 100)
})

const handleInput = (index: number) => {
  // فقط اعداد مجاز هستند
  otpDigits.value[index] = otpDigits.value[index].replace(/\D/, '')
  if (otpDigits.value[index] && index < 5) {
    inputRefs.value[index + 1]?.focus()
  }
  // ارسال خودکار وقتی همه ۶ رقم پر شد
  if (otp.value.length === 6) handleVerify()
}

const handleBackspace = (index: number) => {
  if (!otpDigits.value[index] && index > 0) {
    otpDigits.value[index - 1] = ''
    inputRefs.value[index - 1]?.focus()
  }
}

const handlePaste = (e: ClipboardEvent) => {
  const text = e.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6)
  if (!text) return
  text.split('').forEach((ch, i) => { otpDigits.value[i] = ch })
  // فوکوس روی آخرین یا اولین فیلد خالی
  const nextEmpty = otpDigits.value.findIndex((d) => !d)
  if (nextEmpty !== -1) inputRefs.value[nextEmpty]?.focus()
  else inputRefs.value[5]?.focus()
}

const handleVerify = async () => {
  if (otp.value.length < 6 || loading.value) return
  loading.value = true
  error.value   = ''
  try {
    const { data } = await $api.post('/drivers/auth/verify-otp', {
      phone: driverStore.pendingPhone,
      otp:   otp.value,
    })
    driverStore.setAuth(data.token, data.driver)
    navigateTo('/driver')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'کد نامعتبر است. لطفاً دوباره تلاش کنید.'
    // پاک کردن فیلدها در صورت خطا
    otpDigits.value = Array(6).fill('')
    inputRefs.value[0]?.focus()
  } finally { loading.value = false }
}

const handleResend = async () => {
  try {
    await $api.post('/drivers/auth/send-otp', { phone: driverStore.pendingPhone })
    otpDigits.value = Array(6).fill('')
    inputRefs.value[0]?.focus()
    error.value = ''
    // شروع زمان انتظار
    resendCooldown.value = 60
    const timer = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'ارسال مجدد کد ناموفق بود'
  }
}
</script>

<style scoped>
.otp-field :deep(input) {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  padding: 10px 4px;
  letter-spacing: 2px;
}

.otp-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e0e0e0;
  transition: background 0.2s, transform 0.2s;
}

.otp-dot.filled {
  background: #F5A623;
  transform: scale(1.2);
}
</style>