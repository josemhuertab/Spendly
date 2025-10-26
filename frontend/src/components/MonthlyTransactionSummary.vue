<script setup>
import { ref, computed } from 'vue'
import { useTransactionStore } from '../store/transactionStore'
import { useCurrencyStore } from '../store/currencyStore'

const transactionStore = useTransactionStore()
const currencyStore = useCurrencyStore()

// Local filters for monthly summary - default to current year
const summaryYear = ref(new Date().getFullYear())
const summaryMonth = ref(null) // null means all months of the year
const showFilters = ref(false)

// Available years and months for filtering
const availableYears = computed(() => {
  const years = new Set()
  transactionStore.transactions.forEach(t => {
    if (t.date) {
      const year = new Date(t.date).getFullYear()
      years.add(year)
    }
  })
  return Array.from(years).sort((a, b) => b - a)
})

const monthOptions = computed(() => [
  { title: 'Enero', value: 1 },
  { title: 'Febrero', value: 2 },
  { title: 'Marzo', value: 3 },
  { title: 'Abril', value: 4 },
  { title: 'Mayo', value: 5 },
  { title: 'Junio', value: 6 },
  { title: 'Julio', value: 7 },
  { title: 'Agosto', value: 8 },
  { title: 'Septiembre', value: 9 },
  { title: 'Octubre', value: 10 },
  { title: 'Noviembre', value: 11 },
  { title: 'Diciembre', value: 12 }
])

// Group transactions by month and year
const monthlyData = computed(() => {
  const grouped = {}
  
  // Start with filtered transactions from the main store
  let baseTransactions = transactionStore.filteredTransactions
  
  // Apply local summary filters
  if (summaryYear.value || summaryMonth.value) {
    baseTransactions = baseTransactions.filter(transaction => {
      const date = new Date(transaction.date)
      const yearMatch = summaryYear.value ? date.getFullYear() === summaryYear.value : true
      const monthMatch = summaryMonth.value ? (date.getMonth() + 1) === summaryMonth.value : true
      return yearMatch && monthMatch
    })
  }
  
  baseTransactions.forEach(transaction => {
    const date = new Date(transaction.date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    
    if (!grouped[key]) {
      grouped[key] = {
        key,
        monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        ingresos: 0,
        gastos: 0,
        balance: 0,
        transactions: []
      }
    }
    
    const amount = currencyStore.convertAmount(
      Number(transaction.amount || 0), 
      transaction.currency || currencyStore.currentCurrency, 
      currencyStore.currentCurrency
    )
    
    grouped[key].transactions.push(transaction)
    
    if (transaction.type === 'ingreso') {
      grouped[key].ingresos += amount
    } else {
      grouped[key].gastos += amount
    }
    
    grouped[key].balance = grouped[key].ingresos - grouped[key].gastos
  })
  
  return Object.values(grouped).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
})

function formatAmount(amount) {
  return currencyStore.formatAmount(Math.abs(amount))
}

function getBalanceColor(balance) {
  return balance >= 0 ? 'success' : 'error'
}

function getBalanceIcon(balance) {
  return balance >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'
}

function clearSummaryFilters() {
  summaryYear.value = null
  summaryMonth.value = null
}

const hasLocalFilters = computed(() => {
  return summaryYear.value || summaryMonth.value
})
</script>

<template>
  <div class="monthly-summary">
    <!-- Header with filters -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Resumen Mensual</h3>
        <div v-if="hasLocalFilters" class="flex gap-1 mt-1">
          <v-chip
            v-if="summaryYear"
            size="x-small"
            color="primary"
            variant="flat"
          >
            {{ summaryYear }}
          </v-chip>
          <v-chip
            v-if="summaryMonth"
            size="x-small"
            color="primary"
            variant="flat"
          >
            {{ monthOptions.find(m => m.value === summaryMonth)?.title }}
          </v-chip>
        </div>
      </div>
      <v-btn
        @click="showFilters = !showFilters"
        :color="showFilters || hasLocalFilters ? 'primary' : 'default'"
        variant="text"
        size="small"
        icon="mdi-filter-variant"
      />
    </div>
    
    <!-- Compact Filters -->
    <v-expand-transition>
      <div v-show="showFilters" class="mb-4">
        <v-card class="rounded-lg border-0 shadow-sm">
          <v-card-text class="p-4">
            <div class="grid grid-cols-2 gap-3 mb-3">
              <v-select
                v-model="summaryYear"
                :items="availableYears"
                label="Año"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
              
              <v-select
                v-model="summaryMonth"
                :items="monthOptions"
                label="Mes"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
            </div>
            
            <div class="flex justify-end">
              <v-btn
                v-if="hasLocalFilters"
                @click="clearSummaryFilters"
                variant="text"
                size="small"
                prepend-icon="mdi-filter-remove"
              >
                Limpiar
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </v-expand-transition>
    
    <div v-if="monthlyData.length === 0" class="text-center py-8">
      <v-icon size="48" color="grey-400" class="mb-2">mdi-calendar-blank</v-icon>
      <p class="text-gray-500">No hay datos para mostrar</p>
    </div>
    
    <div v-else class="space-y-4">
      <v-card
        v-for="month in monthlyData"
        :key="month.key"
        class="rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <v-card-text class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-semibold text-gray-900">{{ month.monthName }}</h4>
            <v-chip
              :color="getBalanceColor(month.balance)"
              variant="flat"
              size="small"
            >
              <v-icon start :icon="getBalanceIcon(month.balance)" size="16" />
              {{ month.balance >= 0 ? '+' : '-' }}{{ formatAmount(month.balance) }}
            </v-chip>
          </div>
          
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-sm text-gray-600 mb-1">Ingresos</p>
              <p class="text-lg font-bold text-green-600">+{{ formatAmount(month.ingresos) }}</p>
            </div>
            
            <div class="text-center">
              <p class="text-sm text-gray-600 mb-1">Gastos</p>
              <p class="text-lg font-bold text-red-600">-{{ formatAmount(month.gastos) }}</p>
            </div>
            
            <div class="text-center">
              <p class="text-sm text-gray-600 mb-1">Transacciones</p>
              <p class="text-lg font-bold text-blue-600">{{ month.transactions.length }}</p>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.monthly-summary {
  max-height: 600px;
  overflow-y: auto;
}
</style>