import { defineStore } from 'pinia'
import { 
  createTransaction, 
  getUserTransactions, 
  updateTransaction, 
  deleteTransaction,
  getTransactionsSummary,
  getTransactionsByType,
  getTransactionsByCategory,
  subscribeUserTransactions
} from '../services/firestoreService'
import { useUserStore } from './userStore'

export const useTransactionStore = defineStore('transactions', {
  state: () => ({
    transactions: [],
    loading: false,
    error: null,
    summary: {
      totalIngresos: 0,
      totalGastos: 0,
      balance: 0,
      totalTransacciones: 0
    },
    filters: {
      type: null, // 'gasto' | 'ingreso' | null
      category: null,
      dateFrom: null,
      dateTo: null
    },
    _unsubscribe: null,
  }),
  
  getters: {
    filteredTransactions: (state) => {
      let filtered = [...state.transactions]
      
      if (state.filters.type) {
        filtered = filtered.filter(t => t.type === state.filters.type)
      }
      
      if (state.filters.category) {
        filtered = filtered.filter(t => t.category === state.filters.category)
      }
      
      if (state.filters.dateFrom) {
        filtered = filtered.filter(t => t.date >= state.filters.dateFrom)
      }
      
      if (state.filters.dateTo) {
        filtered = filtered.filter(t => t.date <= state.filters.dateTo)
      }
      
      return filtered
    },
    
    gastos: (state) => state.transactions.filter(t => t.type === 'gasto'),
    ingresos: (state) => state.transactions.filter(t => t.type === 'ingreso'),
    
    categoriesUsed: (state) => {
      const categories = new Set()
      state.transactions.forEach(t => {
        if (t.category) categories.add(t.category)
      })
      return Array.from(categories).sort()
    },
    
    recentTransactions: (state) => {
      return state.transactions.slice(0, 10)
    }
  },
  
  actions: {
    async loadTransactions() {
      const userStore = useUserStore()
      if (!userStore.userId) {
        this.error = 'Usuario no autenticado'
        return
      }
      
      this.loading = true
      this.error = null
      
      try {
        this.transactions = await getUserTransactions(userStore.userId)
        await this.loadSummary()
      } catch (error) {
        this.error = error.message
        console.error('Error loading transactions:', error)
      } finally {
        this.loading = false
      }
    },

    startRealtime() {
      const userStore = useUserStore()
      if (!userStore.userId) return
      if (this._unsubscribe) return
      this._unsubscribe = subscribeUserTransactions(userStore.userId, async (txs) => {
        this.transactions = txs
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
        this.summary = await getTransactionsSummary(userStore.userId)
      } catch (error) {
        console.error('Error loading summary:', error)
      }
    },
    
    async addTransaction(transactionData) {
      const userStore = useUserStore()
      if (!userStore.userId) {
        throw new Error('Usuario no autenticado')
      }
      
      this.loading = true
      this.error = null
      
      try {
        const transactionId = await createTransaction(transactionData, userStore.userId)
        // Cuando hay suscripción en tiempo real, el estado se actualizará automáticamente.
        if (!this._unsubscribe) {
          const newTransaction = {
            id: transactionId,
            ...transactionData,
            userId: userStore.userId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          this.transactions.unshift(newTransaction)
          await this.loadSummary()
        }
        
        return transactionId
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async updateTransactionData(transactionId, updateData) {
      const userStore = useUserStore()
      if (!userStore.userId) {
        throw new Error('Usuario no autenticado')
      }
      
      this.loading = true
      this.error = null
      
      try {
        await updateTransaction(transactionId, updateData, userStore.userId)
        // Si no hay suscripción, actualizamos localmente
        if (!this._unsubscribe) {
          const index = this.transactions.findIndex(t => t.id === transactionId)
          if (index !== -1) {
            this.transactions[index] = {
              ...this.transactions[index],
              ...updateData,
              updatedAt: new Date()
            }
          }
          await this.loadSummary()
        }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async removeTransaction(transactionId) {
      const userStore = useUserStore()
      if (!userStore.userId) {
        throw new Error('Usuario no autenticado')
      }
      
      this.loading = true
      this.error = null
      
      try {
        await deleteTransaction(transactionId, userStore.userId)
        // Si no hay suscripción, removemos localmente
        if (!this._unsubscribe) {
          this.transactions = this.transactions.filter(t => t.id !== transactionId)
          await this.loadSummary()
        }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async loadTransactionsByType(type) {
      const userStore = useUserStore()
      if (!userStore.userId) return
      
      this.loading = true
      try {
        this.transactions = await getTransactionsByType(userStore.userId, type)
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    async loadTransactionsByCategory(category) {
      const userStore = useUserStore()
      if (!userStore.userId) return
      
      this.loading = true
      try {
        this.transactions = await getTransactionsByCategory(userStore.userId, category)
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    setFilter(filterType, value) {
      this.filters[filterType] = value
    },
    
    clearFilters() {
      this.filters = {
        type: null,
        category: null,
        dateFrom: null,
        dateTo: null
      }
    },
    
    clearError() {
      this.error = null
    }
  }
})