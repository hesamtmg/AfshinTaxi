import { defineStore } from 'pinia'

interface Driver {
  id: string
  fullName: string
  phone: string
  email?: string
  status: 'active' | 'inactive' | 'suspended'
  carModel: string
  carPlate: string
  carColor?: string
  carYear?: string
  licenseNumber?: string
  avatarUrl?: string
}

export const useDriverStore = defineStore('driver', {
  state: () => ({
    driver:       null as Driver | null,
    token:        null as string | null,
    pendingPhone: null as string | null,
    trips:        [] as any[],
    stats:        null as any,
    loading:      false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.driver,
  },

  actions: {
    setAuth(token: string, driver: Driver) {
      this.token  = token
      this.driver = driver
      if (process.client) {
        localStorage.setItem('driver_token', token)
        localStorage.setItem('driver_data', JSON.stringify(driver))
      }
    },

    setPendingPhone(phone: string) {
      this.pendingPhone = phone
    },

    logout() {
      this.token        = null
      this.driver       = null
      this.pendingPhone = null
      this.trips        = []
      this.stats        = null
      if (process.client) {
        localStorage.removeItem('driver_token')
        localStorage.removeItem('driver_data')
      }
    },

    hydrate() {
      if (process.client) {
        const token  = localStorage.getItem('driver_token')
        const driver = localStorage.getItem('driver_data')
        if (token && driver) {
          this.token  = token
          this.driver = JSON.parse(driver)
        }
      }
    },

    async fetchTrips() {
      const { $api } = useNuxtApp()
      this.loading = true
      try {
        const { data } = await $api.get('/drivers/me/trips', {
          headers: { Authorization: `Bearer ${this.token}` },
        })
        this.trips = data
      } finally { this.loading = false }
    },

    async fetchStats() {
      const { $api } = useNuxtApp()
      const { data } = await $api.get('/drivers/me/stats', {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      this.stats = data
    },
  },
})
