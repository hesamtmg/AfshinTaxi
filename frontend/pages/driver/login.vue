<template>
  <v-app>
    <v-main style="background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%); min-height:100vh" class="d-flex align-center">
      <v-container style="max-width:420px">

        <!-- لوگو -->
        <div class="text-center mb-8">
          <div class="d-flex justify-center mb-4">
            <v-avatar color="primary" size="72" rounded="xl">
              <v-icon size="40" color="white">mdi-account-tie</v-icon>
            </v-avatar>
          </div>
          <h1 class="text-h4 font-weight-bold text-white mb-2">پنل راننده</h1>
          <p class="text-body-2 text-grey">با شماره تلفن ثبت‌شده خود وارد شوید</p>
        </div>

        <v-card rounded="xl" class="pa-6">
          <v-form ref="form" v-model="valid" @submit.prevent="handleLogin">
            <div class="text-caption text-grey font-weight-bold mb-2">شماره تلفن</div>
            <v-text-field
              v-model="phone"
              placeholder="۰۹۱۲..."
              prepend-inner-icon="mdi-phone"
              variant="outlined"
              rounded="lg"
              :rules="[rules.required, rules.phone]"
              class="mb-4"
              autofocus
            />

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              rounded="lg"
              class="mb-4"
              :text="error"
            />

            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              :loading="loading"
              :disabled="!valid"
            >
              <v-icon start>mdi-message-lock</v-icon>
              ارسال کد تأیید
            </v-btn>
          </v-form>

          <v-divider class="my-5" />

          <div class="text-center">
            <div class="text-caption text-grey mb-3">مشتری یا ادمین هستید؟</div>
            <div class="d-flex gap-3 flex-col justify-center">
              <v-btn variant="outlined" size="small" color="secondary" to="/auth/login">
                ورود مشتری
              </v-btn>
              <v-btn variant="outlined" size="small" color="secondary" to="/auth/admin-login">
                ورود ادمین
              </v-btn>
            </div>
          </div>
        </v-card>

        <v-card color="rgba(255,255,255,0.05)" rounded="xl" class="pa-4 mt-4" flat>
          <div class="d-flex align-center gap-3">
            <v-icon color="primary" size="20">mdi-information-outline</v-icon>
            <div class="text-caption text-grey-lighten-1">
              حساب‌های راننده توسط ادمین ایجاد می‌شود. در صورت مشکل در ورود با dispatcher خود تماس بگیرید.
            </div>
          </div>
        </v-card>

      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
const { $api } = useNuxtApp()
const driverStore = useDriverStore()

onMounted(() => {
  driverStore.hydrate()
  if (driverStore.isAuthenticated) navigateTo('/driver')
})

const form    = ref()
const valid   = ref(false)
const loading = ref(false)
const error   = ref('')
const phone   = ref('')

const rules = {
  required: (v: string) => !!v || 'الزامی',
  phone: (v: string) => /^\+?[0-9]{10,15}$/.test(v) || 'شماره تلفن نامعتبر است',
}

const handleLogin = async () => {
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return
  loading.value = true
  error.value = ''
  try {
    await $api.post('/drivers/auth/send-otp', { phone: phone.value })
    driverStore.setPendingPhone(phone.value)
    navigateTo('/driver/verify-otp')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'شماره تلفن یافت نشد. با ادمین تماس بگیرید.'
  } finally { loading.value = false }
}
</script>