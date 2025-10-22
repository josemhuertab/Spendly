import { defineStore } from 'pinia'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebaseConfig'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    initialized: false,
    loading: true,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    displayName: (state) => state.user?.displayName || '',
    userId: (state) => state.user?.uid || null,
    userEmail: (state) => state.user?.email || '',
    ready: (state) => state.initialized,
  },
  actions: {
    setUser(user) {
      this.user = user
      this.loading = false
    },
    clearUser() {
      this.user = null
      this.loading = false
    },
    init() {
      if (this.initialized) return

      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          this.user = user
          this.loading = false
          this.initialized = true
          unsubscribe()
          resolve(user)
        })
      })
    },
    async initAuth() {
      // Mantener compatibilidad con código existente
      return this.init()
    },
  },
})