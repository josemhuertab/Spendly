<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTransactionStore } from '../store/transactionStore'
import { useUserStore } from '../store/userStore'
import { useCurrencyStore } from '../store/currencyStore'
import TransactionForm from '../components/TransactionForm.vue'
import TransactionTable from '../components/TransactionTable.vue'
import MonthlyTransactionSummary from '../components/MonthlyTransactionSummary.vue'

const transactionStore = useTransactionStore()
const userStore = useUserStore()
const currencyStore = useCurrencyStore()

// Local state
const showForm = ref(false)
const editingTransaction = ref(null)
const isEditing = ref(false)
const activeTab = ref('all')
const showAdvancedFilters = ref(false)

// Summary period filter
const summaryPeriod = ref('current') // 'all', 'current', 'currentYear', 'custom'
const summaryYear = ref(new Date().getFullYear())
const summaryMonth = ref(new Date().getMonth() + 1)
const summaryYearTo = ref(new Date().getFullYear())
const summaryMonthTo = ref(new Date().getMonth() + 1)

// Advanced filters
const selectedYear = ref(null)
const selectedMonth = ref(null)
const selectedYearTo = ref(null)
const selectedMonthTo = ref(null)
const selectedCategory = ref(null)
const selectedPaymentMethod = ref(null)
const dateFrom = ref('')
const dateTo = ref('')
const amountFrom = ref(null)
const amountTo = ref(null)

// Computed properties
const summary = computed(() => {
  if (summaryPeriod.value === 'all') {
    return transactionStore.summary
  }
  
  // Calculate summary for specific period
  let filteredTransactions = transactionStore.transactions
  
  if (summaryPeriod.value === 'current') {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    filteredTransactions = transactionStore.transactions.filter(t => {
      const date = new Date(t.date)
      return date.getFullYear() === currentYear && (date.getMonth() + 1) === currentMonth
    })
  } else if (summaryPeriod.value === 'currentYear') {
    const currentYear = new Date().getFullYear()
    
    filteredTransactions = transactionStore.transactions.filter(t => {
      const date = new Date(t.date)
      return date.getFullYear() === currentYear
    })
  } else if (summaryPeriod.value === 'custom') {
    filteredTransactions = transactionStore.transactions.filter(t => {
      const date = new Date(t.date)
      const transactionYear = date.getFullYear()
      const transactionMonth = date.getMonth() + 1
      
      // Create date objects for comparison
      const transactionDate = new Date(transactionYear, transactionMonth - 1, 1)
      const fromDate = new Date(summaryYear.value, (summaryMonth.value || 1) - 1, 1)
      const toDate = new Date(summaryYearTo.value, (summaryMonthTo.value || 12) - 1, 1)
      
      return transactionDate >= fromDate && transactionDate <= toDate
    })
  }
  
  // Calculate totals
  const totals = {
    totalIngresos: 0,
    totalGastos: 0,
    balance: 0,
    totalTransacciones: filteredTransactions.length
  }
  
  filteredTransactions.forEach(t => {
    const amount = currencyStore.convertAmount(
      Number(t.amount || 0), 
      t.currency || currencyStore.currentCurrency, 
      currencyStore.currentCurrency
    )
    if (t.type === 'ingreso') totals.totalIngresos += amount
    else if (t.type === 'gasto') totals.totalGastos += amount
  })
  
  totals.balance = totals.totalIngresos - totals.totalGastos
  return totals
})

const formattedBalance = computed(() => {
  const balance = Number(summary.value.balance || 0)
  const formatted = currencyStore.formatAmount(Math.abs(balance))
  return {
    amount: formatted,
    isPositive: balance >= 0,
    color: balance >= 0 ? 'success' : 'error'
  }
})

const formattedIngresos = computed(() => {
  return currencyStore.formatAmount(Number(summary.value.totalIngresos || 0))
})

const formattedGastos = computed(() => {
  return currencyStore.formatAmount(Number(summary.value.totalGastos || 0))
})

// Advanced filters computed properties
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

const paymentMethodOptions = computed(() => [
  { title: 'Efectivo', value: 'efectivo' },
  { title: 'Tarjeta de Débito', value: 'tarjeta_debito' },
  { title: 'Tarjeta de Crédito', value: 'tarjeta_credito' },
  { title: 'Transferencia', value: 'transferencia' },
  { title: 'Cheque', value: 'cheque' }
])

const hasActiveFilters = computed(() => {
  return transactionStore.filters.type || 
         transactionStore.filters.category ||
         transactionStore.filters.dateFrom ||
         transactionStore.filters.dateTo ||
         transactionStore.filters.paymentMethod ||
         transactionStore.filters.amountFrom ||
         transactionStore.filters.amountTo
})

const summaryPeriodOptions = computed(() => [
  { title: 'Todos los períodos', value: 'all' },
  { title: 'Mes actual', value: 'current' },
  { title: 'Año actual', value: 'currentYear' },
  { title: 'Período personalizado', value: 'custom' }
])

const summaryTitle = computed(() => {
  if (summaryPeriod.value === 'all') return 'Resumen General'
  if (summaryPeriod.value === 'current') {
    const now = new Date()
    return `Resumen de ${now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
  }
  if (summaryPeriod.value === 'currentYear') {
    return `Resumen de ${new Date().getFullYear()}`
  }
  if (summaryPeriod.value === 'custom') {
    const fromDate = new Date(summaryYear.value, (summaryMonth.value || 1) - 1)
    const toDate = new Date(summaryYearTo.value, (summaryMonthTo.value || 12) - 1)
    
    // Same year
    if (summaryYear.value === summaryYearTo.value) {
      // Same month
      if (summaryMonth.value === summaryMonthTo.value && summaryMonth.value) {
        return `Resumen de ${fromDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
      }
      // Year range or month range in same year
      if (summaryMonth.value && summaryMonthTo.value) {
        return `Resumen de ${fromDate.toLocaleDateString('es-ES', { month: 'long' })} - ${toDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
      }
      return `Resumen de ${summaryYear.value}`
    }
    
    // Different years
    const fromStr = summaryMonth.value 
      ? fromDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      : summaryYear.value.toString()
    const toStr = summaryMonthTo.value 
      ? toDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      : summaryYearTo.value.toString()
    
    return `Resumen de ${fromStr} - ${toStr}`
  }
  return 'Resumen'
})

// Methods
function openNewTransactionForm() {
  editingTransaction.value = null
  isEditing.value = false
  showForm.value = true
}

function onEditTransaction(transaction) {
  editingTransaction.value = transaction
  isEditing.value = true
  showForm.value = true
}

function onTransactionSaved() {
  showForm.value = false
  editingTransaction.value = null
  isEditing.value = false
  // Refresh data
  transactionStore.loadTransactions()
}

function onTransactionDeleted() {
  // Data is already updated by the store
}

function onFormCancelled() {
  showForm.value = false
  editingTransaction.value = null
  isEditing.value = false
}

function setFilter(type) {
  transactionStore.setFilter('type', type === 'all' ? null : type)
  activeTab.value = type
}

function clearAllFilters() {
  transactionStore.clearFilters()
  activeTab.value = 'all'
  
  // Clear advanced filters
  selectedYear.value = null
  selectedMonth.value = null
  selectedYearTo.value = null
  selectedMonthTo.value = null
  selectedCategory.value = null
  selectedPaymentMethod.value = null
  dateFrom.value = ''
  dateTo.value = ''
  amountFrom.value = null
  amountTo.value = null
}

function applyDateFilters() {
  if (selectedYear.value || selectedYearTo.value) {
    const fromYear = selectedYear.value || selectedYearTo.value
    const toYear = selectedYearTo.value || selectedYear.value
    const fromMonth = selectedMonth.value || 1
    const toMonth = selectedMonthTo.value || 12
    
    const startDate = new Date(fromYear, fromMonth - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(toYear, toMonth, 0).toISOString().split('T')[0]
    
    transactionStore.setFilter('dateFrom', startDate)
    transactionStore.setFilter('dateTo', endDate)
  } else {
    transactionStore.setFilter('dateFrom', null)
    transactionStore.setFilter('dateTo', null)
  }
}

function applyCategoryFilter() {
  transactionStore.setFilter('category', selectedCategory.value)
}

function applyPaymentMethodFilter() {
  transactionStore.setFilter('paymentMethod', selectedPaymentMethod.value)
}

function applyCustomDateRange() {
  if (dateFrom.value || dateTo.value) {
    // Clear year/month filters when using custom range
    selectedYear.value = null
    selectedMonth.value = null
    selectedYearTo.value = null
    selectedMonthTo.value = null
  }
  
  transactionStore.setFilter('dateFrom', dateFrom.value || null)
  transactionStore.setFilter('dateTo', dateTo.value || null)
}

function applyAmountFilter() {
  transactionStore.setFilter('amountFrom', amountFrom.value)
  transactionStore.setFilter('amountTo', amountTo.value)
}

// Sync summary period with main filters when using year/month
function syncFiltersWithSummary() {
  if (summaryPeriod.value === 'custom' && summaryYear.value) {
    selectedYear.value = summaryYear.value
    selectedMonth.value = summaryMonth.value
    selectedYearTo.value = summaryYearTo.value
    selectedMonthTo.value = summaryMonthTo.value
    applyDateFilters()
  }
}

// Reset only the summary to current month (not the transaction filters)
function resetSummaryToCurrentMonth() {
  summaryPeriod.value = 'current'
  summaryYear.value = new Date().getFullYear()
  summaryMonth.value = new Date().getMonth() + 1
  summaryYearTo.value = new Date().getFullYear()
  summaryMonthTo.value = new Date().getMonth() + 1
}

// Lifecycle
onMounted(async () => {
  // Asegurar usuario
  if (!userStore.initialized) {
    await userStore.init()
  }
  if (userStore.isAuthenticated) {
    // Suscripción en tiempo real
    transactionStore.startRealtime()
    // Carga inicial (por si ya hay datos)
    await transactionStore.loadTransactions()
  }
  // Recalcular resumen si cambia la moneda
  watch(() => currencyStore.currentCurrency, () => {
    transactionStore.loadSummary()
  })
  
  // Watch for summary period changes to optionally sync with main filters
  watch([summaryPeriod, summaryYear, summaryMonth], () => {
    // Optional: Auto-sync main filters when summary period changes
    // Uncomment if you want automatic synchronization
    // syncFiltersWithSummary()
  })
})

onUnmounted(() => {
  transactionStore.stopRealtime()
})
</script>

<template>
  <v-container fluid class="pa-6 theme-bg min-h-screen">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold theme-text-primary mb-2">Movimientos</h1>
          <p class="theme-text-secondary">Gestiona tus ingresos y gastos de manera inteligente</p>
        </div>
        
        <v-btn
          @click="openNewTransactionForm"
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          class="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Nueva Transacción
        </v-btn>
      </div>

      <!-- Summary Period Selector -->
      <div class="mb-6">
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <h2 class="text-lg font-semibold theme-text-primary">{{ summaryTitle }}</h2>
            
            <v-select
              v-model="summaryPeriod"
              :items="summaryPeriodOptions"
              variant="outlined"
              density="compact"
              hide-details
              class="min-w-[220px] sm:max-w-[220px]"
              style="min-width: 220px;"
            />
          </div>
          
          <!-- Custom period selectors - Separado del flex principal -->
          <div v-if="summaryPeriod === 'custom'" class="space-y-4">
            <!-- Layout completamente vertical en mobile -->
            <div class="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
              <!-- Desde -->
              <div class="space-y-3">
                <span class="text-sm text-gray-600 font-medium">Desde:</span>
                <div class="grid grid-cols-2 gap-2">
                  <v-select
                    v-model="summaryYear"
                    :items="availableYears"
                    label="Año"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                  
                  <v-select
                    v-model="summaryMonth"
                    :items="[{ title: 'Enero', value: 1 }, ...monthOptions.slice(1)]"
                    label="Mes"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                  />
                </div>
              </div>
              
              <!-- Hasta -->
              <div class="space-y-3">
                <span class="text-sm text-gray-600 font-medium">Hasta:</span>
                <div class="grid grid-cols-2 gap-2">
                  <v-select
                    v-model="summaryYearTo"
                    :items="availableYears"
                    label="Año"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                  
                  <v-select
                    v-model="summaryMonthTo"
                    :items="[{ title: 'Diciembre', value: 12 }, ...monthOptions.slice(0, -1)]"
                    label="Mes"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                  />
                </div>
              </div>
            </div>
            
            <div class="flex justify-center">
              <v-btn
                @click="resetSummaryToCurrentMonth"
                variant="outlined"
                size="small"
                prepend-icon="mdi-refresh"
                color="primary"
              >
                Resetear al mes actual
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Balance Card -->
        <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <v-card-text class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 mb-1">Balance Total</p>
                <p :class="`text-2xl font-bold ${formattedBalance.isPositive ? 'text-green-600' : 'text-red-600'}`">
                  {{ formattedBalance.isPositive ? '+' : '-' }}{{ formattedBalance.amount }}
                </p>
              </div>
              <div :class="`p-3 rounded-full ${formattedBalance.isPositive ? 'bg-green-100' : 'bg-red-100'}`">
                <v-icon 
                  :color="formattedBalance.color" 
                  size="24"
                  :icon="formattedBalance.isPositive ? 'mdi-trending-up' : 'mdi-trending-down'"
                />
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Ingresos Card -->
        <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <v-card-text class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 mb-1">Total Ingresos</p>
                <p class="text-2xl font-bold text-green-600">+{{ formattedIngresos }}</p>
              </div>
              <div class="p-3 rounded-full bg-green-100">
                <v-icon color="success" size="24">mdi-plus-circle</v-icon>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Gastos Card -->
        <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <v-card-text class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 mb-1">Total Gastos</p>
                <p class="text-2xl font-bold text-red-600">-{{ formattedGastos }}</p>
              </div>
              <div class="p-3 rounded-full bg-red-100">
                <v-icon color="error" size="24">mdi-minus-circle</v-icon>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Transacciones Card -->
        <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <v-card-text class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 mb-1">Transacciones</p>
                <p class="text-2xl font-bold text-blue-600">{{ summary.totalTransacciones }}</p>
              </div>
              <div class="p-3 rounded-full bg-blue-100">
                <v-icon color="primary" size="24">mdi-receipt-text</v-icon>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6">
      <!-- Quick Filters -->
      <div class="flex flex-wrap gap-3 items-center mb-4">
        <v-btn-toggle
          v-model="activeTab"
          mandatory
          variant="outlined"
          divided
          class="rounded-xl overflow-hidden"
        >
          <v-btn value="all" @click="setFilter('all')" class="px-6">
            <v-icon start>mdi-all-inclusive</v-icon>
            Todas
          </v-btn>
          <v-btn value="ingreso" @click="setFilter('ingreso')" class="px-6">
            <v-icon start>mdi-plus-circle</v-icon>
            Ingresos
          </v-btn>
          <v-btn value="gasto" @click="setFilter('gasto')" class="px-6">
            <v-icon start>mdi-minus-circle</v-icon>
            Gastos
          </v-btn>
        </v-btn-toggle>

        <v-btn
          @click="showAdvancedFilters = !showAdvancedFilters"
          variant="outlined"
          prepend-icon="mdi-filter-cog"
          :color="showAdvancedFilters ? 'primary' : 'default'"
        >
          Filtros Avanzados
        </v-btn>

        <v-btn
          v-if="hasActiveFilters"
          @click="clearAllFilters"
          variant="outlined"
          prepend-icon="mdi-filter-remove"
          class="ml-auto"
        >
          Limpiar Filtros
        </v-btn>
      </div>

      <!-- Advanced Filters -->
      <v-expand-transition>
        <v-card v-show="showAdvancedFilters" class="rounded-xl border-0 shadow-md mb-4">
          <v-card-text class="p-6">
            <!-- Period Range Filters -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-3">Rango de Período</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex gap-2 items-center">
                  <span class="text-sm text-gray-600 font-medium" style="min-width: 60px;">Desde:</span>
                  <v-select
                    v-model="selectedYear"
                    :items="availableYears"
                    label="Año"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    @update:model-value="applyDateFilters"
                    style="min-width: 90px; flex: 0 0 90px;"
                  />
                  <v-select
                    v-model="selectedMonth"
                    :items="monthOptions"
                    label="Mes"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    @update:model-value="applyDateFilters"
                    style="min-width: 140px; flex: 1;"
                  />
                </div>
                
                <div class="flex gap-2 items-center">
                  <span class="text-sm text-gray-600 font-medium" style="min-width: 60px;">Hasta:</span>
                  <v-select
                    v-model="selectedYearTo"
                    :items="availableYears"
                    label="Año"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    @update:model-value="applyDateFilters"
                    style="min-width: 90px; flex: 0 0 90px;"
                  />
                  <v-select
                    v-model="selectedMonthTo"
                    :items="monthOptions"
                    label="Mes"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    @update:model-value="applyDateFilters"
                    style="min-width: 140px; flex: 1;"
                  />
                </div>
              </div>
            </div>

            <!-- Other Filters -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Category Filter -->
              <v-select
                v-model="selectedCategory"
                :items="transactionStore.categoriesUsed"
                label="Categoría"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-tag"
                clearable
                @update:model-value="applyCategoryFilter"
                style="min-width: 200px;"
              />

              <!-- Payment Method Filter -->
              <v-select
                v-model="selectedPaymentMethod"
                :items="paymentMethodOptions"
                label="Método de Pago"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-credit-card"
                clearable
                @update:model-value="applyPaymentMethodFilter"
                style="min-width: 200px;"
              />
            </div>

            <!-- Date Range -->
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-3">Rango de Fechas Personalizado</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <v-text-field
                  v-model="dateFrom"
                  label="Desde"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-start"
                  @update:model-value="applyCustomDateRange"
                  style="min-width: 200px;"
                />
                
                <v-text-field
                  v-model="dateTo"
                  label="Hasta"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-end"
                  @update:model-value="applyCustomDateRange"
                  style="min-width: 200px;"
                />
              </div>
            </div>

            <!-- Amount Range -->
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-3">Rango de Montos</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <v-text-field
                  v-model.number="amountFrom"
                  label="Monto mínimo"
                  type="number"
                  step="0.01"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-currency-usd"
                  @update:model-value="applyAmountFilter"
                  style="min-width: 200px;"
                />
                
                <v-text-field
                  v-model.number="amountTo"
                  label="Monto máximo"
                  type="number"
                  step="0.01"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-currency-usd"
                  @update:model-value="applyAmountFilter"
                  style="min-width: 200px;"
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-expand-transition>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Transaction Table -->
      <div class="lg:col-span-2">
        <TransactionTable
          @edit-transaction="onEditTransaction"
          @delete-transaction="onTransactionDeleted"
        />
      </div>
      
      <!-- Monthly Summary Sidebar -->
      <div class="lg:col-span-1">
        <MonthlyTransactionSummary />
      </div>
    </div>

    <!-- Transaction Form Dialog -->
    <v-dialog 
      v-model="showForm" 
      max-width="600" 
      persistent
      class="transaction-dialog"
    >
      <TransactionForm
        :transaction="editingTransaction"
        :is-edit="isEditing"
        @saved="onTransactionSaved"
        @cancelled="onFormCancelled"
      />
    </v-dialog>

    <!-- Loading Overlay -->
    <v-overlay
      v-model="transactionStore.loading"
      class="align-center justify-center"
      persistent
    >
      <div class="text-center">
        <v-progress-circular
          color="primary"
          indeterminate
          size="64"
          class="mb-4"
        />
        <p class="text-white text-lg">Cargando transacciones...</p>
      </div>
    </v-overlay>

    <!-- Error Snackbar -->
    <v-snackbar
      v-model="transactionStore.error"
      color="error"
      timeout="5000"
      location="top"
    >
      {{ transactionStore.error }}
      <template #actions>
        <v-btn
          variant="text"
          @click="transactionStore.clearError()"
        >
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.transaction-dialog :deep(.v-overlay__content) {
  margin: 24px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

:deep(.v-btn-toggle) {
  border-radius: 12px;
}

:deep(.v-btn-toggle .v-btn) {
  border-radius: 0;
  text-transform: none;
  font-weight: 500;
}

:deep(.v-btn-toggle .v-btn:first-child) {
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}

:deep(.v-btn-toggle .v-btn:last-child) {
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}
</style>