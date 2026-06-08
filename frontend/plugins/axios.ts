import axios from 'axios'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const api = axios.create({
    baseURL: config.public.apiBase,
    headers: { 'Content-Type': 'application/json' },
  })

  // Attach token to every request
  api.interceptors.request.use((config) => {
    const token = authStore.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Handle 401 globally
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        authStore.logout()
        navigateTo('/auth/login')
      }
      return Promise.reject(error)
    },
  )

  return { provide: { api } }
})
