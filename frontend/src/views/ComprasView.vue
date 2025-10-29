<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTransactionStore } from '@/store/transactionStore'
import { useCurrencyStore } from '@/store/currencyStore'
import TransactionForm from '@/components/TransactionForm.vue'
import CreditPurchasesTable from '@/components/CreditPurchasesTable.vue'

const transactionStore = useTransactionStore()
const currencyStore = useCurrencyStore()

const showForm = ref(false)
const isEditing = ref(false)
const editingTransaction = ref(null)
const showAdvancedFilters = ref(false)

// Filtros avanzados
const filterType = ref('all') // 'all', 'current', 'currentYear', 'custom'
const fromYear = ref(new Date().getFullYear())
const fromMonth = ref(null)
const toYear = ref(new Date().getFullYear())
const toMonth = ref(null)
const statusFilter = ref('all') // 'all', 'pending', 'completed'
const categoryFilter = ref(null)

const creditPurchases = computed(() => {
  let filtered = transactionStore.transactions.filter(t => t.type === 'gasto' && t.paymentMethod === 'tarjeta_credito')
  
  // Aplicar filtros de fecha
  if (filterType.value !== 'all') {
    filtered = filtered.filter(t => {
      const transactionDate = new Date(t.date)
      
      if (filterType.value === 'current') {
        const now = new Date()
        return transactionDate.getFullYear() === now.getFullYear() && 
               transactionDate.getMonth() === now.getMonth()
      } else if (filterType.value === 'currentYear') {
        return transactionDate.getFullYear() === new Date().getFullYear()
      } else if (filterType.value === 'custom') {
        const fromDate = new Date(fromYear.value, (fromMonth.value || 1) - 1, 1)
        const toDate = new Date(toYear.value, (toMonth.value || 12) - 1, 31)
        return transactionDate >= fromDate && transactionDate <= toDate
      }
      
      return true
    })
  }
  
  // Aplicar filtro de estado
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(t => {
      const installments = Number(t.installments || 1)
      const paid = Number(t.installmentsPaid || 0)
      const isCompleted = paid >= installments
      
      return statusFilter.value === 'completed' ? isCompleted : !isCompleted
    })
  }
  
  // Aplicar filtro de categoría
  if (categoryFilter.value) {
    filtered = filtered.filter(t => t.category === categoryFilter.value)
  }
  
  return filtered
})

// Opciones para los filtros
const filterTypeOptions = [
  { title: 'Todos los períodos', value: 'all' },
  { title: 'Mes actual', value: 'current' },
  { title: 'Año actual', value: 'currentYear' },
  { title: 'Período personalizado', value: 'custom' }
]

const statusFilterOptions = [
  { title: 'Todos los estados', value: 'all' },
  { title: 'Pendientes', value: 'pending' },
  { title: 'Completados', value: 'completed' }
]

const monthOptions = [
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
]

const availableYears = computed(() => {
  const years = new Set()
  transactionStore.transactions.forEach(t => {
    if (t.type === 'gasto' && t.paymentMethod === 'tarjeta_credito' && t.date) {
      const year = new Date(t.date).getFullYear()
      years.add(year)
    }
  })
  // Agregar años actuales si no hay datos
  const currentYear = new Date().getFullYear()
  years.add(currentYear)
  years.add(currentYear - 1)
  years.add(currentYear + 1)
  
  return Array.from(years).sort((a, b) => b - a)
})

const availableCategories = computed(() => {
  const categories = new Set()
  transactionStore.transactions.forEach(t => {
    if (t.type === 'gasto' && t.paymentMethod === 'tarjeta_credito' && t.category) {
      categories.add(t.category)
    }
  })
  return Array.from(categories).sort()
})

const summary = computed(() => {
  const totals = {
    totalCompras: 0,
    totalPagado: 0,
    saldoPendiente: 0,
    cuotasTotales: 0,
    cuotasPagadas: 0,
    maxCuotasSimultaneas: 0,
    cuotasPendientes: 0,
    productosPendientes: 0,
  }
  
  // Calcular totales básicos
  creditPurchases.value.forEach(t => {
    const amount = Number(t.amount || 0)
    const installments = Number(t.installments || 1)
    const paid = Math.min(Number(t.installmentsPaid || 0), installments)
    const perInstallment = installments > 0 ? amount / installments : amount
    
    totals.totalCompras += amount
    totals.totalPagado += perInstallment * paid
    
    // Contar productos pendientes (no completamente pagados)
    if (paid < installments) {
      totals.productosPendientes += 1
    }
  })
  
  totals.saldoPendiente = Math.max(0, totals.totalCompras - totals.totalPagado)
  
  // Calcular cuotas pendientes como funciona realmente una tarjeta de crédito
  // (el máximo de cuotas pendientes entre todos los productos)
  let maxCuotasPendientes = 0
  creditPurchases.value.forEach(t => {
    const installments = Number(t.installments || 1)
    const paid = Math.min(Number(t.installmentsPaid || 0), installments)
    const pending = installments - paid
    maxCuotasPendientes = Math.max(maxCuotasPendientes, pending)
  })
  totals.cuotasPendientes = maxCuotasPendientes
  
  // Calcular cuotas mensuales simuladas para información adicional si se necesita
  const monthlyInstallments = calculateMonthlyInstallments(creditPurchases.value)
  totals.maxCuotasSimultaneas = monthlyInstallments.maxSimultaneous
  
  // Para compatibilidad, mantener el cálculo anterior pero agregar la nueva lógica
  creditPurchases.value.forEach(t => {
    const installments = Number(t.installments || 1)
    const paid = Math.min(Number(t.installmentsPaid || 0), installments)
    totals.cuotasTotales += installments
    totals.cuotasPagadas += paid
  })
  
  return totals
})

// Nueva función para calcular cuotas mensuales como funciona realmente una tarjeta de crédito
function calculateMonthlyInstallments(purchases) {
  const monthlyMap = new Map()
  const currentDate = new Date()
  const currentMonth = currentDate.getFullYear() * 12 + currentDate.getMonth()
  
  purchases.forEach(purchase => {
    const purchaseDate = new Date(purchase.date)
    const startMonth = purchaseDate.getFullYear() * 12 + purchaseDate.getMonth()
    const installments = Number(purchase.installments || 1)
    const paid = Math.min(Number(purchase.installmentsPaid || 0), installments)
    
    // Agregar cada cuota mensual
    for (let i = 0; i < installments; i++) {
      const month = startMonth + i
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { total: 0, paid: 0 })
      }
      
      const monthData = monthlyMap.get(month)
      monthData.total += 1
      
      if (i < paid) {
        monthData.paid += 1
      }
    }
  })
  
  // Encontrar el máximo de cuotas simultáneas
  let maxSimultaneous = 0
  let currentPending = 0
  
  monthlyMap.forEach((data, month) => {
    maxSimultaneous = Math.max(maxSimultaneous, data.total)
    
    // Si es el mes actual o futuro, contar pendientes
    if (month >= currentMonth) {
      currentPending += (data.total - data.paid)
    }
  })
  
  return {
    maxSimultaneous,
    currentPending,
    monthlyMap
  }
}

function openNew() {
  isEditing.value = false
  editingTransaction.value = null
  showForm.value = true
}

function onEditTransaction(tx) {
  isEditing.value = true
  editingTransaction.value = tx
  showForm.value = true
}

function onSaved() {
  showForm.value = false
  editingTransaction.value = null
  isEditing.value = false
  transactionStore.loadTransactions()
}

async function payAllPendingInstallments() {
  // Simplificar: pagar una cuota a todos los productos que no estén completamente pagados
  const purchasesToUpdate = []
  
  creditPurchases.value.forEach(purchase => {
    const installments = Number(purchase.installments || 1)
    const paid = Number(purchase.installmentsPaid || 0)
    
    // Si no está completamente pagado, agregar una cuota
    if (paid < installments) {
      purchasesToUpdate.push({
        id: purchase.id,
        newPaid: Math.min(paid + 1, installments)
      })
    }
  })
  
  // Actualizar todas las compras
  try {
    for (const update of purchasesToUpdate) {
      await transactionStore.updateTransactionData(update.id, { 
        installmentsPaid: update.newPaid 
      })
    }
  } catch (error) {
    console.error('Error al pagar cuotas:', error)
  }
}

function clearAllFilters() {
  filterType.value = 'all'
  fromYear.value = new Date().getFullYear()
  fromMonth.value = null
  toYear.value = new Date().getFullYear()
  toMonth.value = null
  statusFilter.value = 'all'
  categoryFilter.value = null
}

const hasActiveFilters = computed(() => {
  return filterType.value !== 'all' || 
         statusFilter.value !== 'all' || 
         categoryFilter.value !== null
})

const filterTitle = computed(() => {
  if (filterType.value === 'all') return 'Todas las compras'
  if (filterType.value === 'current') {
    const now = new Date()
    return `Compras de ${now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
  }
  if (filterType.value === 'currentYear') {
    return `Compras de ${new Date().getFullYear()}`
  }
  if (filterType.value === 'custom') {
    const fromDate = new Date(fromYear.value, (fromMonth.value || 1) - 1)
    const toDate = new Date(toYear.value, (toMonth.value || 12) - 1)
    
    if (fromYear.value === toYear.value) {
      if (fromMonth.value === toMonth.value && fromMonth.value) {
        return `Compras de ${fromDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
      }
      if (fromMonth.value && toMonth.value) {
        return `Compras de ${fromDate.toLocaleDateString('es-ES', { month: 'long' })} - ${toDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
      }
      return `Compras de ${fromYear.value}`
    }
    
    const fromStr = fromMonth.value 
      ? fromDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      : fromYear.value.toString()
    const toStr = toMonth.value 
      ? toDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      : toYear.value.toString()
    
    return `Compras de ${fromStr} - ${toStr}`
  }
  return 'Compras'
})

// Watchers para inicializar filtros
watch(filterType, (newType) => {
  if (newType === 'custom') {
    fromYear.value = new Date().getFullYear()
    fromMonth.value = 1
    toYear.value = new Date().getFullYear()
    toMonth.value = 12
  }
})

onMounted(async () => {
  // Inicializar con año actual por defecto
  filterType.value = 'currentYear'
  
  await transactionStore.loadTransactions()
  transactionStore.startRealtime()
})

onUnmounted(() => transactionStore.stopRealtime())
</script>

<template>
  <v-container fluid class="pa-6 theme-bg min-h-screen">
    <div class="mb-8">
      <div class="space-y-4 mb-6">
        <!-- Título y descripción -->
        <div>
          <h1 class="text-3xl font-bold theme-text-primary mb-2">Compras con Tarjeta / Cuotas</h1>
          <p class="theme-text-secondary">Registra tus compras con tarjeta de crédito y controla las cuotas pagadas.</p>
        </div>
        
        <!-- Botones de acción - Responsive -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <v-btn
            @click="showAdvancedFilters = !showAdvancedFilters"
            variant="outlined"
            prepend-icon="mdi-filter-cog"
            :color="showAdvancedFilters || hasActiveFilters ? 'primary' : 'default'"
            size="large"
            block
          >
            <span class="hidden sm:inline">Filtros Avanzados</span>
            <span class="sm:hidden">Filtros</span>
          </v-btn>
          
          <v-btn 
            color="success" 
            size="large" 
            prepend-icon="mdi-credit-card-check" 
            class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg hover:shadow-xl"
            @click="payAllPendingInstallments"
            :disabled="summary.productosPendientes === 0"
            block
          >
            <span class="hidden sm:inline">Pagar Cuota Mensual</span>
            <span class="sm:hidden">Pagar Cuota</span>
          </v-btn>
          
          <v-btn 
            color="primary" 
            size="large" 
            prepend-icon="mdi-plus" 
            class="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:shadow-xl" 
            @click="openNew"
            block
          >
            <span class="hidden sm:inline">Nueva Compra</span>
            <span class="sm:hidden">Nueva</span>
          </v-btn>
        </div>
      </div>

      <!-- Título del período actual -->
      <div class="mb-4">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold theme-text-primary">{{ filterTitle }}</h2>
          <v-chip
            v-if="hasActiveFilters"
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-filter"
          >
            Filtros activos
          </v-chip>
        </div>
      </div>

      <!-- Advanced Filters -->
      <v-expand-transition>
        <v-card v-show="showAdvancedFilters" class="rounded-xl border-0 shadow-md mb-6">
          <v-card-text class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <!-- Tipo de período -->
              <v-select
                v-model="filterType"
                :items="filterTypeOptions"
                label="Período"
                variant="outlined"
                density="comfortable"
                style="min-width: 200px;"
              />
              
              <!-- Estado -->
              <v-select
                v-model="statusFilter"
                :items="statusFilterOptions"
                label="Estado"
                variant="outlined"
                density="comfortable"
                style="min-width: 180px;"
              />
              
              <!-- Categoría -->
              <v-select
                v-model="categoryFilter"
                :items="availableCategories"
                label="Categoría"
                variant="outlined"
                density="comfortable"
                clearable
                style="min-width: 180px;"
              />
            </div>
            
            <!-- Período personalizado -->
            <div v-if="filterType === 'custom'" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div class="flex gap-2 items-center">
                <span class="text-sm text-gray-600 font-medium" style="min-width: 60px;">Desde:</span>
                <v-select
                  v-model="fromYear"
                  :items="availableYears"
                  label="Año"
                  variant="outlined"
                  density="comfortable"
                  style="min-width: 90px; flex: 0 0 90px;"
                />
                <v-select
                  v-model="fromMonth"
                  :items="monthOptions"
                  label="Mes"
                  variant="outlined"
                  density="comfortable"
                  clearable
                  style="min-width: 140px; flex: 1;"
                />
              </div>
              
              <div class="flex gap-2 items-center">
                <span class="text-sm text-gray-600 font-medium" style="min-width: 60px;">Hasta:</span>
                <v-select
                  v-model="toYear"
                  :items="availableYears"
                  label="Año"
                  variant="outlined"
                  density="comfortable"
                  style="min-width: 90px; flex: 0 0 90px;"
                />
                <v-select
                  v-model="toMonth"
                  :items="monthOptions"
                  label="Mes"
                  variant="outlined"
                  density="comfortable"
                  clearable
                  style="min-width: 140px; flex: 1;"
                />
              </div>
            </div>
            
            <!-- Botón limpiar filtros -->
            <div class="flex justify-end">
              <v-btn
                v-if="hasActiveFilters"
                @click="clearAllFilters"
                variant="outlined"
                prepend-icon="mdi-filter-remove"
              >
                Limpiar Filtros
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-expand-transition>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <v-card-text class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 mb-1">Total Compras</p>
                <p class="text-2xl font-bold text-green-600">+{{ currencyStore.formatAmount(summary.totalCompras) }}</p>
              </div>
              <div class="p-3 rounded-full bg-green-100">
                <v-icon color="success" size="24">mdi-credit-card</v-icon>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <v-card-text class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 mb-1">Saldo Pendiente</p>
                <p class="text-2xl font-bold text-red-600">-{{ currencyStore.formatAmount(summary.saldoPendiente) }}</p>
              </div>
              <div class="p-3 rounded-full bg-red-100">
                <v-icon color="error" size="24">mdi-cash-remove</v-icon>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <v-card-text class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 mb-1">Cuotas Pendientes</p>
                <p class="text-2xl font-bold text-blue-600">{{ summary.cuotasPendientes }}</p>
                <p class="text-xs text-gray-500 mt-1">Elementos por pagar: {{ summary.productosPendientes }}</p>
              </div>
              <div class="p-3 rounded-full bg-blue-100">
                <v-icon color="primary" size="24">mdi-calendar-multiple-check</v-icon>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Credit Purchases Table -->
    <CreditPurchasesTable @edit-transaction="onEditTransaction" />

    <!-- Dialogs -->
    <v-dialog v-model="showForm" max-width="720" persistent>
      <TransactionForm :transaction="editingTransaction" :is-edit="isEditing" :preset-payment-method="'tarjeta_credito'" :preset-type="'gasto'" @saved="onSaved" @cancelled="showForm=false" />
    </v-dialog>

    <!-- Loading Overlay -->
    <v-overlay v-model="transactionStore.loading" class="align-center justify-center" persistent>
      <div class="text-center">
        <v-progress-circular color="primary" indeterminate size="64" class="mb-4" />
        <p class="text-white text-lg">Cargando compras...</p>
      </div>
    </v-overlay>

    <!-- Error Snackbar -->
    <v-snackbar v-model="transactionStore.error" color="error" timeout="5000" location="top">
      {{ transactionStore.error }}
      <template #actions>
        <v-btn variant="text" @click="transactionStore.clearError()">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>