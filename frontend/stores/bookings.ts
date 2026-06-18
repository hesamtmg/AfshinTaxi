import { defineStore } from 'pinia'

export interface Booking {
  id: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  dropoffAddress: string
  dropoffLat: number
  dropoffLng: number
  distanceKm: number
  estimatedFare: number
  finalFare?: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  scheduledAt: string
  passengerCount?: number
  notes?: string
  cancellationReason?: string
  driver?: {
    fullName: string
    phone: string
    carModel: string
    carPlate: string
    carColor?: string
    avatarUrl?: string
  }
  user?: {
    id: string
    fullName: string
    phone: string
    email?: string
  }
  createdAt: string
  updatedAt: string
}

export const useBookingsStore = defineStore('bookings', {
  state: () => ({
    myBookings: [] as Booking[],
    allBookings: [] as Booking[],
    currentBooking: null as Booking | null,
    loading: false,
    stats: null as any,
  }),

  actions: {
    async fetchMyBookings() {
      const { $api } = useNuxtApp()
      this.loading = true
      try {
        const { data } = await $api.get('/bookings/my')
        this.myBookings = data
      } finally { this.loading = false }
    },

    async fetchAllBookings(status?: string) {
      const { $api } = useNuxtApp()
      this.loading = true
      try {
        const params = status ? { status } : {}
        const { data } = await $api.get('/bookings', { params })
        this.allBookings = data
      } finally { this.loading = false }
    },

    async fetchStats() {
      const { $api } = useNuxtApp()
      const { data } = await $api.get('/bookings/stats')
      this.stats = data
    },

    async createBooking(payload: Partial<Booking>) {
      const { $api } = useNuxtApp()
      const { data } = await $api.post('/bookings', payload)
      this.myBookings.unshift(data)
      return data
    },

    async assignDriver(bookingId: string, driverId: string, finalFare?: number) {
      const { $api } = useNuxtApp()
      const { data } = await $api.patch(`/bookings/${bookingId}/assign-driver`, { driverId, finalFare })
      const idx = this.allBookings.findIndex((b) => b.id === bookingId)
      if (idx !== -1) this.allBookings[idx] = data
      return data
    },

    // Re-throws so the UI can catch and display the server error message
    async cancelBooking(bookingId: string, reason?: string) {
      const { $api } = useNuxtApp()
      const { data } = await $api.patch(`/bookings/my/${bookingId}/cancel`, { reason })
      const idx = this.myBookings.findIndex((b) => b.id === bookingId)
      if (idx !== -1) this.myBookings[idx] = data
      return data
    },
    async editBooking(bookingId: string, payload: { scheduledAt?: string; passengerCount?: number; notes?: string }) {
      const { $api } = useNuxtApp()
      const { data } = await $api.patch(`/bookings/my/${bookingId}/edit`, payload)
      const idx = this.myBookings.findIndex((b) => b.id === bookingId)
      if (idx !== -1) this.myBookings[idx] = data
      return data
    },
  },
})
