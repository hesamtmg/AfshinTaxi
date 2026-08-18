import axios from 'axios'

export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const axiosConfig: any = {
    baseURL: config.public.apiBase,
    headers: { 'Content-Type': 'application/json' },
  }
  console.log('API Base URL:', axiosConfig.baseURL)
  // Handle FormData in SSR context
  if (process.server) {
    // Dynamic import so these node: built-ins never end up in the client bundle
    const { globalAgent: httpAgent } = await import('node:http')
    const { globalAgent: httpsAgent } = await import('node:https')
    axiosConfig.httpAgent = httpAgent
    axiosConfig.httpsAgent = httpsAgent
    // Avoid FormData imports during SSR
    axiosConfig.maxRedirects = 5
  }

  const api = axios.create(axiosConfig)

  // Attach token to every request
  api.interceptors.request.use((config) => {
    const token = authStore.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Handle 401 globally -- redirect back to whichever portal's login page
  // matches where the user actually is, instead of always bouncing to the
  // customer login (e.g. a stale token after a DB reset was sending admins
  // and drivers there too).
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const path = useRoute().path
        if (path.startsWith('/driver')) {
          useDriverStore().logout()
          navigateTo('/driver/login')
        } else if (path.startsWith('/admin') || path.startsWith('/auth/admin')) {
          authStore.logout()
          navigateTo('/auth/admin-login')
        } else {
          authStore.logout()
          navigateTo('/auth/login')
        }
      }
      return Promise.reject(error)
    },
  )

  return { provide: { api } }
})
