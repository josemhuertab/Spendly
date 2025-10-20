import { defineStore } from 'pinia'
import { getCurrentUser } from '../services/authService'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    displayName: (state) => state.user?.displayName || '',
  },
  actions: {
    setUser(user) {
      this.user = user
    },
    clearUser() {
      this.user = null
    },
    async initAuth() {
      if (this.initialized) return
      this.user = await getCurrentUser()
      this.initialized = true
    },
  },
})