import { defineStore } from 'pinia'

interface User {
  id: string
  fullName: string
  phone: string
  email?: string
  role: 'client' | 'admin'
  isVerified: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  pendingPhone: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    pendingPhone: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    isClient: (state) => state.user?.role === 'client',
  },

  actions: {
    setAuth(token: string, user: User) {
      this.token = token
      this.user = user
      if (process.client) {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_user', JSON.stringify(user))
      }
    },

    setPendingPhone(phone: string) {
      this.pendingPhone = phone
    },

    logout() {
      this.token = null
      this.user = null
      this.pendingPhone = null
      if (process.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    },

    hydrate() {
      if (process.client) {
        const token = localStorage.getItem('auth_token')
        const user = localStorage.getItem('auth_user')
        if (token && user) {
          this.token = token
          this.user = JSON.parse(user)
        }
      }
    },
  },
})
