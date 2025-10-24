<script setup>
import { ref, computed } from 'vue'
import { useTransactionStore } from '../store/transactionStore'
import { useCurrencyStore } from '../store/currencyStore'

const emit = defineEmits(['edit-transaction'])

const transactionStore = useTransactionStore()
const currencyStore = useCurrencyStore()

const search = ref('')
const sortBy = ref([{ key: 'date', order: 'desc' }])
const headers = computed(() => [
  { title: 'Fecha', key: 'date', sortable: true, width: '120px' },
  { title: 'Descripción', key: 'description', sortable: false },
  { title: 'Categoría', key: 'category', sortable: true, width: '140px' },
  { title: 'Monto', key: 'amount', sortable: true, width: '140px' },
  { title: 'Cuotas', key: 'installments', sortable: true, width: '100px' },
  { title: 'Pagadas', key: 'installmentsPaid', sortable: true, width: '110px' },
  { title: 'Valor Cuota', key: 'installmentAmount', sortable: true, width: '140px' },
  { title: 'Pendiente', key: 'remainingAmount', sortable: true, width: '140px' },
  { title: 'Acciones', key: 'actions', sortable: false, width: '220px' },
])

const creditPurchases = computed(() => {
  return transactionStore.transactions.filter(t => 
    t.type === 'gasto' && t.paymentMethod === 'tarjeta_credito'
  )
})

const items = computed(() => {
  const q = search.value.trim().toLowerCase()
  const base = creditPurchases.value.map(t => {
    const installments = Number(t.installments || 1)
    const installmentsPaid = Math.min(Number(t.installmentsPaid || 0), installments)
    const installmentAmount = installments > 0 ? Number(t.amount || 0) / installments : Number(t.amount || 0)
    const paidAmount = installmentAmount * installmentsPaid
    const remainingAmount = Math.max(0, Number(t.amount || 0) - paidAmount)
    return {
      ...t,
      installmentAmount,
      remainingAmount,
    }
  })
  if (!q) return base
  return base.filter(t => (
    String(t.date).toLowerCase().includes(q) ||
    String(t.description || '').toLowerCase().includes(q) ||
    String(t.category || '').toLowerCase().includes(q)
  ))
})

function formatAmount(amount, fromCurrency) {
  const converted = currencyStore.convertAmount(Number(amount || 0), fromCurrency || currencyStore.currentCurrency, currencyStore.currentCurrency)
  return currencyStore.formatAmount(converted)
}

async function refresh() {
  await transactionStore.loadTransactions()
}

async function markInstallmentPaid(item) {
  const total = Number(item.installments || 1)
  const paid = Math.min(Number(item.installmentsPaid || 0) + 1, total)
  await transactionStore.updateTransactionData(item.id, { installmentsPaid: paid })
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 overflow-hidden">
    <div class="flex items-center gap-3 p-4">
      <v-text-field
        v-model="search"
        placeholder="Buscar compra..."
        variant="outlined"
        density="comfortable"
        prepend-inner-icon="mdi-magnify"
        hide-details
        class="flex-1"
      />
      <v-btn @click="refresh" :loading="transactionStore.loading" variant="outlined" prepend-icon="mdi-refresh">Actualizar</v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="items"
      :sort-by="sortBy"
      item-key="id"
      class="border-t"
    >
      <template #item.amount="{ item }">
        <span class="font-semibold">{{ formatAmount(item.amount, item.currency) }}</span>
      </template>
      <template #item.installmentAmount="{ item }">
        <span>{{ formatAmount(item.installmentAmount, item.currency) }}</span>
      </template>
      <template #item.remainingAmount="{ item }">
        <span class="font-semibold text-red-600">{{ formatAmount(item.remainingAmount, item.currency) }}</span>
      </template>
      <template #item.actions="{ item }">
        <div class="flex gap-2">
          <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-pencil" @click="emit('edit-transaction', item)">Editar</v-btn>
          <v-btn size="small" variant="tonal" color="success" prepend-icon="mdi-check" @click="markInstallmentPaid(item)" :disabled="(item.installmentsPaid||0) >= (item.installments||1)">Pagar cuota</v-btn>
        </div>
      </template>
    </v-data-table>
  </div>
</template>