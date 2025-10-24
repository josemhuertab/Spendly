<script setup>
import { ref, watch, onMounted } from 'vue'
import { useCurrencyStore } from '@/store/currencyStore'
import { useTransactionStore } from '@/store/transactionStore'
import { useUserStore } from '@/store/userStore'

const currencyStore = useCurrencyStore()
const transactionStore = useTransactionStore()
const userStore = useUserStore()

const show = ref(false)
const isApplying = ref(false)
const applyResult = ref('')
const noAskAgain = ref(false)
const lastCurrency = ref(localStorage.getItem('spendly_currency') || currencyStore.currentCurrency)

function shouldSkipFor(currency) {
  return localStorage.getItem(`spendly_skip_prompt_${currency}`) === '1'
}

function markSkipFor(currency) {
  try { localStorage.setItem(`spendly_skip_prompt_${currency}`, '1') } catch {}
}

async function ensureAuthAndData() {
  if (!userStore.initialized) { await userStore.init() }
  if (userStore.isAuthenticated && transactionStore.transactions.length === 0) {
    await transactionStore.loadTransactions()
  }
}

async function onApply() {
  isApplying.value = true
  applyResult.value = ''
  try {
    await ensureAuthAndData()
    const updater = typeof transactionStore.applyCurrencyToLegacyTransactions === 'function'
      ? transactionStore.applyCurrencyToLegacyTransactions
      : async (newCurrency) => {
          const legacy = transactionStore.transactions.filter(t => !t.currency)
          let count = 0
          for (const t of legacy) {
            await transactionStore.updateTransactionData(t.id, { currency: newCurrency })
            count++
          }
          await transactionStore.loadSummary()
          return count
        }
    const updatedCount = await updater(currencyStore.currentCurrency)
    applyResult.value = `Actualizadas ${updatedCount} transacciones antiguas.`
    if (noAskAgain.value) markSkipFor(currencyStore.currentCurrency)
    show.value = false
  } catch (e) {
    applyResult.value = e?.message || 'Error al actualizar moneda en transacciones.'
  } finally {
    isApplying.value = false
  }
}

function onCancel() {
  if (noAskAgain.value) markSkipFor(currencyStore.currentCurrency)
  show.value = false
}

onMounted(() => {
  // Si al cargar ya estamos en otra moneda (y no saltada), mostramos
  if (currencyStore.currentCurrency !== lastCurrency.value && !shouldSkipFor(currencyStore.currentCurrency)) {
    show.value = true
  }
})

watch(() => currencyStore.currentCurrency, async (newVal, oldVal) => {
  if (newVal === oldVal) return
  // Evitar mostrar si el usuario ya indicó que no quiere ver para esta moneda
  if (shouldSkipFor(newVal)) return
  // Mostrar prompt al cambiar de moneda
  show.value = true
  lastCurrency.value = newVal
})
</script>

<template>
  <v-dialog v-model="show" max-width="540" persistent>
    <v-card class="rounded-xl">
      <v-card-title class="px-6 py-4">Actualizar moneda en transacciones antiguas</v-card-title>
      <v-card-text class="px-6 py-4">
        <p class="text-gray-700 mb-3">
          Detectamos que cambiaste tu moneda a <strong>{{ currencyStore.currentCurrency }}</strong>.
        </p>
        <p class="text-gray-700 mb-4">
          ¿Quieres establecer <strong>{{ currencyStore.currentCurrency }}</strong> como moneda en tus transacciones anteriores que no tienen moneda registrada?
          Esto no alterará montos ni transacciones que ya tienen su moneda.
        </p>
        <v-checkbox v-model="noAskAgain" label="No preguntar de nuevo" density="comfortable" />
        <v-alert v-if="applyResult" type="info" variant="tonal" class="mt-4">{{ applyResult }}</v-alert>
      </v-card-text>
      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="onCancel">No</v-btn>
        <v-btn color="primary" :loading="isApplying" @click="onApply">Aplicar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>