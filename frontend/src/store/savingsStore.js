import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import {
  addSaving,
  getSavings,
  updateSaving,
  deleteSaving,
  subscribeSavings,
  getSavingsSummary
} from '../services/savingsService'

export const useSavingsStore = defineStore('savings', {
  state: () => ({
    savings: [],
    loading: false,
    error: null,
    filterYear: new Date().getFullYear(),
    summary: {
      totalAll: 0,
      totalYear: 0,
      byMonth: Array.from({ length: 12 }, () => 0),
      count: 0,
    },
    _unsubscribe: null,
  }),

  getters: {
    savingsOfYear: (state) => state.savings.filter(s => Number(s.year) === Number(state.filterYear)),
  },

  actions: {
    async loadSavings() {
      const userStore = useUserStore()
      if (!userStore.userId) { this.error = 'Usuario no autenticado'; return }
      this.loading = true
      this.error = null
      try {
        this.savings = await getSavings(userStore.userId, this.filterYear)
        await this.loadSummary()
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    startRealtime() {
      const userStore = useUserStore()
      if (!userStore.userId) return
      if (this._unsubscribe) return
      this._unsubscribe = subscribeSavings(userStore.userId, this.filterYear, async (list) => {
        this.savings = list
        await this.loadSummary()
      })
    },

    stopRealtime() {
      if (this._unsubscribe) {
        try { this._unsubscribe() } catch {}
        this._unsubscribe = null
      }
    },

    async loadSummary() {
      const userStore = useUserStore()
      if (!userStore.userId) return
      try {
        this.summary = await getSavingsSummary(userStore.userId, this.filterYear)
      } catch (e) {
        console.error('Error loading savings summary:', e)
      }
    },

    async addSavingEntry(data) {
      const userStore = useUserStore()
      if (!userStore.userId) throw new Error('Usuario no autenticado')
      this.loading = true
      this.error = null
      try {
        const id = await addSaving(userStore.userId, data)
        if (!this._unsubscribe) {
          this.savings.push({ id, ...data, userId: userStore.userId, createdAt: new Date(), updatedAt: new Date() })
          await this.loadSummary()
        }
        return id
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateSavingEntry(id, data) {
      const userStore = useUserStore()
      if (!userStore.userId) throw new Error('Usuario no autenticado')
      this.loading = true
      this.error = null
      try {
        await updateSaving(userStore.userId, id, data)
        if (!this._unsubscribe) {
          const idx = this.savings.findIndex(s => s.id === id)
          if (idx !== -1) {
            this.savings[idx] = { ...this.savings[idx], ...data, updatedAt: new Date() }
          }
          await this.loadSummary()
        }
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteSavingEntry(id) {
      const userStore = useUserStore()
      if (!userStore.userId) throw new Error('Usuario no autenticado')
      this.loading = true
      this.error = null
      try {
        await deleteSaving(userStore.userId, id)
        if (!this._unsubscribe) {
          this.savings = this.savings.filter(s => s.id !== id)
          await this.loadSummary()
        }
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    setYear(year) {
      this.filterYear = Number(year)
      // Reiniciar suscripción si está activa
      if (this._unsubscribe) {
        this.stopRealtime()
        this.startRealtime()
      }
      this.loadSavings()
    },

    clearError() { this.error = null },
  }
})