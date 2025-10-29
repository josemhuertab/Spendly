import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import {
  addSaving,
  getSavings,
  updateSaving,
  deleteSaving,
  subscribeSavings,
  getSavingsSummary,
  upsertMonthlySavings,
  getAnnualGoal,
  setAnnualGoal
} from '../services/savingsService'

export const useSavingsStore = defineStore('savings', {
  state: () => ({
    savings: [],
    loading: false,
    error: null,
    filterYear: new Date().getFullYear(),
    filterMonth: null,
    filterYearTo: null,
    filterMonthTo: null,
    summary: {
      totalAll: 0,
      totalYear: 0,
      byMonth: Array.from({ length: 12 }, () => 0),
      count: 0,
    },
    annualGoal: 0,
    _unsubscribe: null,
  }),

  getters: {
    savingsOfYear: (state) => {
      return state.savings.filter(s => {
        const year = Number(s.year)
        const month = Number(s.month)
        
        // Filtro por rango de años
        const fromYear = state.filterYear
        const toYear = state.filterYearTo || state.filterYear
        
        if (year < fromYear || year > toYear) return false
        
        // Si hay filtro de meses y estamos en el rango de años
        if (state.filterMonth || state.filterMonthTo) {
          const fromMonth = state.filterMonth || 1
          const toMonth = state.filterMonthTo || 12
          
          // Si es el mismo año, filtrar por meses
          if (fromYear === toYear) {
            return month >= fromMonth && month <= toMonth
          }
          
          // Si son años diferentes
          if (year === fromYear) {
            return month >= fromMonth
          } else if (year === toYear) {
            return month <= toMonth
          } else {
            return true
          }
        }
        
        return true
      })
    },
    
    savingsOfMonth: (state) => {
      // Mantener compatibilidad con filtro de mes específico
      if (state.filterMonth && !state.filterMonthTo && !state.filterYearTo) {
        return state.savings.filter(s => 
          Number(s.year) === Number(state.filterYear) && 
          Number(s.month) === Number(state.filterMonth)
        )
      }
      // Usar el getter savingsOfYear que ya maneja rangos
      return state.savingsOfYear
    },
  },

  actions: {
    async loadSavings(year = null) {
      this.loading = true
      this.error = null
      
      try {
        const userStore = useUserStore()
        
        if (!userStore.user) {
          throw new Error('Usuario no autenticado')
        }

        const savingsData = await getSavings(userStore.user.uid, year)
        this.savings = savingsData
        await this.loadSummary()
      } catch (error) {
        console.error('Error al cargar ahorros:', error)
        this.error = error.message
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

    async loadAnnualGoal() {
      const userStore = useUserStore()
      if (!userStore.userId) return
      try {
        this.annualGoal = await getAnnualGoal(userStore.userId, this.filterYear)
      } catch (e) {
        console.error('Error loading annual goal:', e)
      }
    },

    async setAnnualGoalAmount(amount) {
      const userStore = useUserStore()
      if (!userStore.userId) throw new Error('Usuario no autenticado')
      this.loading = true
      this.error = null
      try {
        await setAnnualGoal(userStore.userId, this.filterYear, Number(amount || 0))
        this.annualGoal = Number(amount || 0)
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
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

    async saveYearMonths(monthsArray) {
      const userStore = useUserStore()
      if (!userStore.userId) throw new Error('Usuario no autenticado')
      this.loading = true
      this.error = null
      try {
        await upsertMonthlySavings(userStore.userId, this.filterYear, monthsArray)
        if (!this._unsubscribe) {
          await this.loadSavings()
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
      this.loadSavings(this.filterYear)
      this.loadAnnualGoal()
    },

    setMonth(month) {
      this.filterMonth = month ? Number(month) : null
    },
    
    setDateRange(fromYear, fromMonth, toYear, toMonth) {
      this.filterYear = fromYear
      this.filterMonth = fromMonth
      this.filterYearTo = toYear
      this.filterMonthTo = toMonth
      
      // Reiniciar suscripción si está activa
      if (this._unsubscribe) {
        this.stopRealtime()
        this.startRealtime()
      }
      this.loadSavings(this.filterYear)
      this.loadAnnualGoal()
    },
    
    clearFilters() {
      this.filterYear = new Date().getFullYear()
      this.filterMonth = null
      this.filterYearTo = null
      this.filterMonthTo = null
      
      // Reiniciar suscripción si está activa
      if (this._unsubscribe) {
        this.stopRealtime()
        this.startRealtime()
      }
      this.loadSavings(this.filterYear)
      this.loadAnnualGoal()
    },

    clearError() { this.error = null },
  }
})