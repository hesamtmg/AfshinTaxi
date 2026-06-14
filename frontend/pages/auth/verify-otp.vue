<template>
  <v-app>
    <v-main class="auth-bg d-flex align-center">
      <v-container style="max-width: 420px">
        <div class="text-center mb-8">
          <v-icon color="primary" size="48" class="mb-3">mdi-message-lock</v-icon>
          <h1 class="text-h4 font-weight-bold text-secondary">تأیید تلفن</h1>
          <p class="text-body-2 text-grey-darken-1 mt-2">
            کد ۶ رقمی ارسال شده به<br />
            <strong>{{ authStore.pendingPhone }}</strong>
            را وارد کنید
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
              style="width: 50px"
              class="text-center otp-field"
              hide-details
              @input="handleInput(i)"
              @keydown.backspace="handleBackspace(i)"
              @paste.prevent="handlePaste"
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
            @click="handleVerify"
          >
            تأیید و ادامه
          </v-btn>

          <div class="text-center mt-4">
            <v-btn
              variant="text"
              size="small"
              color="primary"
              :disabled="resendCooldown > 0"
              @click="handleResend"
            >
              {{ resendCooldown > 0 ? `ارسال مجدد در ${resendCooldown} ثانیه` : 'ارسال مجدد کد' }}
            </v-btn>
          </div>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
const { $api } = useNuxtApp()
const authStore = useAuthStore()

if (!authStore.pendingPhone) navigateTo('/auth/register')

const otpDigits = ref(Array(6).fill(''))
const inputRefs = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const resendCooldown = ref(0)

const otp = computed(() => otpDigits.value.join(''))

const handleInput = (index: number) => {
  const val = otpDigits.value[index]
  if (val && index < 5) inputRefs.value[index + 1]?.focus()
}

const handleBackspace = (index: number) => {
  if (!otpDigits.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
}

const handlePaste = (e: ClipboardEvent) => {
  const text = e.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6)
  if (text) {
    text.split('').forEach((ch, i) => { otpDigits.value[i] = ch })
  }
}

const handleVerify = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await $api.post('/auth/verify-otp', {
      phone: authStore.pendingPhone,
      otp: otp.value,
    })
    authStore.setAuth(data.token, data.user)
    navigateTo('/client/booking')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'کد نامعتبر است'
  } finally {
    loading.value = false
  }
}

const handleResend = async () => {
  await $api.post('/auth/login', { phone: authStore.pendingPhone })
  resendCooldown.value = 60
  const timer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) clearInterval(timer)
  }, 1000)
}
</script>

<style scoped>
.auth-bg {
  background: linear-gradient(135deg, #fff8ee 0%, #ffffff 100%);
  min-height: 100vh;
}
.otp-field :deep(input) {
  text-align: center;
  font-size: 1.4rem;
  font-weight: 700;
  padding: 8px 4px;
}
</style>