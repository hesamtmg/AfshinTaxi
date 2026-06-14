<template>
  <v-app>
    <v-main class="auth-bg d-flex align-center">
      <v-container style="max-width: 460px">
        <div class="text-center mb-8">
          <v-icon color="primary" size="48" class="mb-3">mdi-taxi</v-icon>
          <h1 class="text-h4 font-weight-bold text-secondary">ایجاد حساب</h1>
          <p class="text-body-2 text-grey-darken-1 mt-2">
            برای شروع رزرو سفر ثبت نام کنید
          </p>
        </div>

        <v-card rounded="xl" class="pa-6">
          <v-form ref="form" v-model="valid" @submit.prevent="handleRegister">
            <v-text-field
              v-model="fields.fullName"
              label="نام و نام خانوادگی"
              prepend-inner-icon="mdi-account"
              :rules="[rules.required]"
              class="mb-3"
            />
            <v-text-field
              v-model="fields.phone"
              label="شماره تلفن"
              prepend-inner-icon="mdi-phone"
              placeholder="۰۹۱۲..."
              :rules="[rules.required, rules.phone]"
              class="mb-3"
            />
            <v-text-field
              v-model="fields.email"
              label="ایمیل (اختیاری)"
              prepend-inner-icon="mdi-email"
              :rules="[rules.email]"
              class="mb-4"
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
              ارسال کد تأیید
            </v-btn>
          </v-form>

          <div class="text-center mt-4">
            <span class="text-body-2 text-grey">قبلاً ثبت نام کرده‌اید؟</span>
            <NuxtLink to="/auth/login" class="text-primary ml-1 font-weight-medium">
              ورود
            </NuxtLink>
          </div>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
const { $api } = useNuxtApp()
const authStore = useAuthStore()

const form = ref()
const valid = ref(false)
const loading = ref(false)
const error = ref('')

const fields = reactive({ fullName: '', phone: '', email: '' })

const rules = {
  required: (v: string) => !!v || 'الزامی',
  phone: (v: string) => /^\+?[0-9]{10,15}$/.test(v) || 'شماره تلفن نامعتبر است',
  email: (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'ایمیل نامعتبر است',
}

const handleRegister = async () => {
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return

  loading.value = true
  error.value = ''

  try {
    await $api.post('/auth/register', fields)
    authStore.setPendingPhone(fields.phone)
    navigateTo('/auth/verify-otp')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'ثبت نام ناموفق بود'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-bg {
  background: linear-gradient(135deg, #fff8ee 0%, #ffffff 100%);
  min-height: 100vh;
}
</style>