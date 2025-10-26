<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTransactionStore } from '@/store/transactionStore'
import { useCurrencyStore } from '@/store/currencyStore'
import TransactionForm from '@/components/TransactionForm.vue'
import CreditPurchasesTable from '@/components/CreditPurchasesTable.vue'

const transactionStore = useTransactionStore()
const currencyStore = useCurrencyStore()

const showForm = ref(false)
const isEditing = ref(false)
const editingTransaction = ref(null)

const creditPurchases = computed(() => {
  return transactionStore.transactions.filter(t => t.type === 'gasto' && t.paymentMethod === 'tarjeta_credito')
})

const summary = computed(() => {
  const totals = {
    totalCompras: 0,
    totalPagado: 0,
    saldoPendiente: 0,
    cuotasTotales: 0,
    cuotasPagadas: 0,
  }
  creditPurchases.value.forEach(t => {
    const amount = Number(t.amount || 0)
    const installments = Number(t.installments || 1)
    const paid = Math.min(Number(t.installmentsPaid || 0), installments)
    const perInstallment = installments > 0 ? amount / installments : amount
    totals.totalCompras += amount
    totals.cuotasTotales += installments
    totals.cuotasPagadas += paid
    totals.totalPagado += perInstallment * paid
  })
  totals.saldoPendiente = Math.max(0, totals.totalCompras - totals.totalPagado)
  return totals
})

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

onMounted(async () => {
  await transactionStore.loadTransactions()
  transactionStore.startRealtime()
})

onUnmounted(() => transactionStore.stopRealtime())
</script>

<template>
  <v-container fluid class="pa-6">
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Compras con Tarjeta / Cuotas</h1>
          <p class="text-gray-600">Registra tus compras con tarjeta de crédito y controla las cuotas pagadas.</p>
        </div>
        <div class="flex items-center gap-3">
          <v-btn color="primary" size="large" prepend-icon="mdi-plus" class="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:shadow-xl" @click="openNew">
            Nueva Compra
          </v-btn>
        </div>
      </div>

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

        <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow duración-200">
          <v-card-text class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 mb-1">Cuotas Pagadas / Totales</p>
                <p class="text-2xl font-bold text-blue-600">{{ summary.cuotasPagadas }} / {{ summary.cuotasTotales }}</p>
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