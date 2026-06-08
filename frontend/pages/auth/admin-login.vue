<template>
  <v-app>
    <v-main style="background: #1A1A2E; min-height: 100vh" class="d-flex align-center">
      <v-container style="max-width: 400px">
        <div class="text-center mb-8">
          <v-icon color="primary" size="48" class="mb-3">mdi-shield-account</v-icon>
          <h1 class="text-h4 font-weight-bold text-white">Admin Login</h1>
          <p class="text-body-2 text-grey mt-2">AfshinTaxi Control Panel</p>
        </div>

        <v-card rounded="xl" class="pa-6">
          <v-form ref="form" v-model="valid" @submit.prevent="handleLogin">
            <v-text-field
              v-model="fields.email"
              label="Email"
              prepend-inner-icon="mdi-email"
              :rules="[rules.required, rules.email]"
              class="mb-3"
            />
            <v-text-field
              v-model="fields.password"
              label="Password"
              prepend-inner-icon="mdi-lock"
              :type="showPass ? 'text' : 'password'"
              :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
              :rules="[rules.required]"
              class="mb-4"
              @click:append-inner="showPass = !showPass"
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
              Sign In
            </v-btn>
          </v-form>
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
const showPass = ref(false)
const fields = reactive({ email: '', password: '' })

const rules = {
  required: (v: string) => !!v || 'Required',
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Invalid email',
}

const handleLogin = async () => {
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return
  loading.value = true
  error.value = ''
  try {
    const { data } = await $api.post('/auth/admin/login', fields)
    authStore.setAuth(data.token, data.user)
    navigateTo('/admin')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Invalid credentials'
  } finally {
    loading.value = false
  }
}
</script>
