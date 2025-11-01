<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTransactionStore } from '../store/transactionStore'
import { useCurrencyStore } from '../store/currencyStore'
import { parseLocalDate } from '../utils/dateUtils'

const emit = defineEmits(['edit-transaction', 'delete-transaction'])

const transactionStore = useTransactionStore()
const currencyStore = useCurrencyStore()

// Local state
const loading = ref(false)
const deleteDialog = ref(false)
const transactionToDelete = ref(null)
const search = ref('')
const sortBy = ref([{ key: 'date', order: 'desc' }])

// Table headers
const headers = computed(() => [
  { title: 'Fecha', key: 'date', sortable: true, width: '120px' },
  { title: 'Tipo', key: 'type', sortable: true, width: '100px' },
  { title: 'Categoría', key: 'category', sortable: true, width: '150px' },
  { title: 'Descripción', key: 'description', sortable: false, width: '200px' },
  { title: `Monto (${currencyStore.currentCurrencyInfo.code})`, key: 'amount', sortable: true, width: '140px', align: 'end' },
  { title: 'Método', key: 'paymentMethod', sortable: true, width: '130px' },
  { title: 'Acciones', key: 'actions', sortable: false, width: '120px', align: 'center' }
])

// Computed properties
const filteredTransactions = computed(() => {
  if (!search.value) return transactionStore.filteredTransactions
  
  const searchLower = search.value.toLowerCase()
  return transactionStore.filteredTransactions.filter(transaction => 
    transaction.description?.toLowerCase().includes(searchLower) ||
    transaction.category?.toLowerCase().includes(searchLower) ||
    transaction.subcategory?.toLowerCase().includes(searchLower) ||
    transaction.paymentMethod?.toLowerCase().includes(searchLower)
  )
})

const hasTransactions = computed(() => filteredTransactions.value.length > 0)

const hasActiveFilters = computed(() => {
  return transactionStore.filters.type || 
         transactionStore.filters.category ||
         transactionStore.filters.dateFrom ||
         transactionStore.filters.dateTo ||
         transactionStore.filters.paymentMethod ||
         transactionStore.filters.amountFrom !== null ||
         transactionStore.filters.amountTo !== null
})

// Methods
function formatAmount(amount, type, fromCurrency) {
  // Convert from transaction currency to current currency for display
  const convertedAmount = currencyStore.convertAmount(Number(amount || 0), fromCurrency || currencyStore.currentCurrency, currencyStore.currentCurrency)
  const formatted = currencyStore.formatAmount(convertedAmount)
  
  return type === 'ingreso' ? `+${formatted}` : `-${formatted}`
}

function formatDate(dateString) {
  if (!dateString) return ''
  
  const date = parseLocalDate(dateString)
  if (!date) return dateString
  
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatPaymentMethod(method) {
  const methods = {
    'efectivo': 'Efectivo',
    'tarjeta_debito': 'T. Débito',
    'tarjeta_credito': 'T. Crédito',
    'transferencia': 'Transferencia',
    'cheque': 'Cheque'
  }
  return methods[method] || method
}

function getTypeColor(type) {
  return type === 'ingreso' ? 'success' : 'error'
}

function getTypeIcon(type) {
  return type === 'ingreso' ? 'mdi-plus-circle' : 'mdi-minus-circle'
}

function getAmountClass(type) {
  return type === 'ingreso' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
}

function onEditTransaction(transaction) {
  emit('edit-transaction', transaction)
}

function confirmDelete(transaction) {
  transactionToDelete.value = transaction
  deleteDialog.value = true
}

async function deleteTransaction() {
  if (!transactionToDelete.value) return
  
  loading.value = true
  try {
    await transactionStore.removeTransaction(transactionToDelete.value.id)
    emit('delete-transaction', transactionToDelete.value)
  } catch (error) {
    console.error('Error deleting transaction:', error)
  } finally {
    loading.value = false
    deleteDialog.value = false
    transactionToDelete.value = null
  }
}

function cancelDelete() {
  deleteDialog.value = false
  transactionToDelete.value = null
}

async function refreshTransactions() {
  loading.value = true
  try {
    await transactionStore.loadTransactions()
  } finally {
    loading.value = false
  }
}

function clearDateFilters() {
  transactionStore.setFilter('dateFrom', null)
  transactionStore.setFilter('dateTo', null)
}

function clearAmountFilters() {
  transactionStore.setFilter('amountFrom', null)
  transactionStore.setFilter('amountTo', null)
}

function formatDateRange() {
  const from = transactionStore.filters.dateFrom
  const to = transactionStore.filters.dateTo
  
  if (from && to) {
    const fromDate = parseLocalDate(from)
    const toDate = parseLocalDate(to)
    
    if (!fromDate || !toDate) {
      return `${from} - ${to}`
    }
    
    // Check if it's a month range
    if (fromDate.getDate() === 1 && toDate.getDate() === new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0).getDate()) {
      if (fromDate.getFullYear() === toDate.getFullYear() && fromDate.getMonth() === toDate.getMonth()) {
        return fromDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      }
      return `${fromDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })} - ${toDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`
    }
    
    return `${formatDate(from)} - ${formatDate(to)}`
  } else if (from) {
    return `Desde ${formatDate(from)}`
  } else if (to) {
    return `Hasta ${formatDate(to)}`
  }
  return 'Rango de fechas'
}

function formatAmountRange() {
  const from = transactionStore.filters.amountFrom
  const to = transactionStore.filters.amountTo
  
  if (from !== null && to !== null) {
    return `${currencyStore.formatAmount(from)} - ${currencyStore.formatAmount(to)}`
  } else if (from !== null) {
    return `Desde ${currencyStore.formatAmount(from)}`
  } else if (to !== null) {
    return `Hasta ${currencyStore.formatAmount(to)}`
  }
  return 'Rango de montos'
}

// Lifecycle
onMounted(() => {
  if (transactionStore.transactions.length === 0) {
    refreshTransactions()
  }
})
</script>

<template>
  <div class="transaction-table">
    <!-- Header with search and refresh -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <v-text-field
        v-model="search"
        label="Buscar transacciones..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        clearable
        class="flex-1"
      />
      
      <v-btn
        @click="refreshTransactions"
        :loading="loading"
        variant="outlined"
        prepend-icon="mdi-refresh"
        class="h-12"
      >
        Actualizar
      </v-btn>
    </div>

    <!-- Filters Summary -->
    <div v-if="hasActiveFilters" class="mb-4">
      <div class="flex flex-wrap gap-2">
        <v-chip
          v-if="transactionStore.filters.type"
          :color="getTypeColor(transactionStore.filters.type)"
          variant="flat"
          closable
          @click:close="transactionStore.setFilter('type', null)"
        >
          <v-icon start :icon="getTypeIcon(transactionStore.filters.type)" />
          {{ transactionStore.filters.type === 'gasto' ? 'Gastos' : 'Ingresos' }}
        </v-chip>
        
        <v-chip
          v-if="transactionStore.filters.category"
          color="primary"
          variant="flat"
          closable
          @click:close="transactionStore.setFilter('category', null)"
        >
          <v-icon start icon="mdi-tag" />
          {{ transactionStore.filters.category }}
        </v-chip>
        
        <v-chip
          v-if="transactionStore.filters.paymentMethod"
          color="info"
          variant="flat"
          closable
          @click:close="transactionStore.setFilter('paymentMethod', null)"
        >
          <v-icon start icon="mdi-credit-card" />
          {{ formatPaymentMethod(transactionStore.filters.paymentMethod) }}
        </v-chip>
        
        <v-chip
          v-if="transactionStore.filters.dateFrom || transactionStore.filters.dateTo"
          color="warning"
          variant="flat"
          closable
          @click:close="clearDateFilters"
        >
          <v-icon start icon="mdi-calendar" />
          {{ formatDateRange() }}
        </v-chip>
        
        <v-chip
          v-if="transactionStore.filters.amountFrom !== null || transactionStore.filters.amountTo !== null"
          color="secondary"
          variant="flat"
          closable
          @click:close="clearAmountFilters"
        >
          <v-icon start icon="mdi-currency-usd" />
          {{ formatAmountRange() }}
        </v-chip>
      </div>
    </div>

    <!-- Data Table -->
    <v-card elevation="0" class="border border-gray-200 rounded-xl overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="filteredTransactions"
        :loading="transactionStore.loading"
        :sort-by="sortBy"
        class="transaction-data-table"
        no-data-text="No hay transacciones registradas"
        loading-text="Cargando transacciones..."
        items-per-page-text="Transacciones por página"
        page-text="{0}-{1} de {2}"
      >
        <!-- Date column -->
        <template #item.date="{ item }">
          <span class="text-sm font-medium text-gray-700">
            {{ formatDate(item.date) }}
          </span>
        </template>

        <!-- Type column -->
        <template #item.type="{ item }">
          <v-chip
            :color="getTypeColor(item.type)"
            variant="flat"
            size="small"
            class="font-medium"
          >
            <v-icon start :icon="getTypeIcon(item.type)" size="16" />
            {{ item.type === 'gasto' ? 'Gasto' : 'Ingreso' }}
          </v-chip>
        </template>

        <!-- Category column -->
        <template #item.category="{ item }">
          <div>
            <div class="font-medium text-gray-900">{{ item.category }}</div>
            <div v-if="item.subcategory" class="text-xs text-gray-500">
              {{ item.subcategory }}
            </div>
          </div>
        </template>

        <!-- Description column -->
        <template #item.description="{ item }">
          <div class="text-sm text-gray-700 max-w-[200px] truncate" :title="item.description">
            {{ item.description || '-' }}
          </div>
        </template>

        <!-- Amount column -->
        <template #item.amount="{ item }">
          <span :class="getAmountClass(item.type)" class="text-sm font-bold">
            {{ formatAmount(item.amount, item.type, item.currency) }}
          </span>
        </template>

        <!-- Payment method column -->
        <template #item.paymentMethod="{ item }">
          <span class="text-sm text-gray-600">
            {{ formatPaymentMethod(item.paymentMethod) }}
          </span>
        </template>

        <!-- Actions column -->
        <template #item.actions="{ item }">
          <div class="flex gap-1">
            <v-btn
              @click="onEditTransaction(item)"
              icon="mdi-pencil"
              variant="text"
              size="small"
              color="primary"
              :title="`Editar ${item.type}`"
            />
            
            <v-btn
              @click="confirmDelete(item)"
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              :title="`Eliminar ${item.type}`"
            />
          </div>
        </template>

        <!-- No data slot -->
        <template #no-data>
          <div class="text-center py-12">
            <v-icon size="64" color="grey-400" class="mb-4">mdi-receipt-text-outline</v-icon>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No hay transacciones</h3>
            <p class="text-gray-500 mb-4">Comienza agregando tu primera transacción</p>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card class="rounded-xl">
        <v-card-title class="px-6 py-4 bg-red-50">
          <div class="flex items-center gap-3">
            <v-icon color="error" size="24">mdi-delete-alert</v-icon>
            <span class="text-lg font-semibold text-red-800">Confirmar Eliminación</span>
          </div>
        </v-card-title>

        <v-card-text class="px-6 py-6">
          <p class="text-gray-700 mb-4">
            ¿Estás seguro de que deseas eliminar esta transacción?
          </p>
          
          <div v-if="transactionToDelete" class="bg-gray-50 rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <span class="font-medium">{{ transactionToDelete.category }}</span>
              <span :class="getAmountClass(transactionToDelete.type)" class="font-bold">
                {{ formatAmount(transactionToDelete.amount, transactionToDelete.type) }}
              </span>
            </div>
            <div class="text-sm text-gray-600">
              {{ formatDate(transactionToDelete.date) }}
            </div>
            <div v-if="transactionToDelete.description" class="text-sm text-gray-600 mt-1">
              {{ transactionToDelete.description }}
            </div>
          </div>
          
          <p class="text-sm text-red-600 mt-4">
            Esta acción no se puede deshacer.
          </p>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn @click="cancelDelete" variant="outlined">
            Cancelar
          </v-btn>
          <v-btn
            @click="deleteTransaction"
            :loading="loading"
            color="error"
            variant="flat"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.transaction-table :deep(.v-data-table) {
  border-radius: 0;
}

.transaction-table :deep(.v-data-table__wrapper) {
  border-radius: 0;
}

.transaction-table :deep(.v-data-table-header) {
  background-color: #f8fafc;
}

.transaction-table :deep(.v-data-table-header th) {
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.transaction-table :deep(.v-data-table__td) {
  border-bottom: 1px solid #f3f4f6;
  padding: 12px 16px;
}

.transaction-table :deep(.v-data-table__tr:hover) {
  background-color: #f9fafb;
}

.transaction-data-table {
  font-size: 14px;
}
</style>