<template>
  <v-app>
    <v-main class="auth-bg d-flex align-center">
      <v-container style="max-width: 420px">
        <div class="text-center mb-8">
          <v-icon color="primary" size="48" class="mb-3">mdi-taxi</v-icon>
          <h1 class="text-h4 font-weight-bold text-secondary">Welcome Back</h1>
          <p class="text-body-2 text-grey-darken-1 mt-2">Enter your phone to receive a login code</p>
        </div>

        <v-card rounded="xl" class="pa-6">
          <v-form ref="form" v-model="valid" @submit.prevent="handleLogin">
            <v-text-field
              v-model="phone"
              label="Phone Number"
              prepend-inner-icon="mdi-phone"
              placeholder="+98..."
              :rules="[rules.required, rules.phone]"
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
              Send Code
            </v-btn>
          </v-form>

          <div class="text-center mt-4">
            <span class="text-body-2 text-grey">Don't have an account?</span>
            <NuxtLink to="/auth/register" class="text-primary ml-1 font-weight-medium">
              Register
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
const phone = ref('')

const rules = {
  required: (v: string) => !!v || 'Required',
  phone: (v: string) => /^\+?[0-9]{10,15}$/.test(v) || 'Invalid phone number',
}

const handleLogin = async () => {
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return
  loading.value = true
  error.value = ''
  try {
    await $api.post('/auth/login', { phone: phone.value })
    authStore.setPendingPhone(phone.value)
    navigateTo('/auth/verify-otp')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Login failed'
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
