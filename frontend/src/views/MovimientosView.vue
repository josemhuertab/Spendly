<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTransactionStore } from '../store/transactionStore'
import { useUserStore } from '../store/userStore'
import { useCurrencyStore } from '../store/currencyStore'
import TransactionForm from '../components/TransactionForm.vue'
import TransactionTable from '../components/TransactionTable.vue'

const transactionStore = useTransactionStore()
const userStore = useUserStore()
const currencyStore = useCurrencyStore()

// Local state
const showForm = ref(false)
const editingTransaction = ref(null)
const isEditing = ref(false)
const activeTab = ref('all')

// Computed properties
const summary = computed(() => transactionStore.summary)

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
})

onUnmounted(() => {
  transactionStore.stopRealtime()
})
</script>

<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Movimientos</h1>
          <p class="text-gray-600">Gestiona tus ingresos y gastos de manera inteligente</p>
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
      <div class="flex flex-wrap gap-3 items-center">
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
          v-if="transactionStore.filters.type || transactionStore.filters.category"
          @click="clearAllFilters"
          variant="outlined"
          prepend-icon="mdi-filter-remove"
          class="ml-auto"
        >
          Limpiar Filtros
        </v-btn>
      </div>
    </div>

    <!-- Transaction Table -->
    <TransactionTable
      @edit-transaction="onEditTransaction"
      @delete-transaction="onTransactionDeleted"
    />

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