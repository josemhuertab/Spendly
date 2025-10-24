<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSavingsStore } from '../store/savingsStore'
import { useCurrencyStore } from '../store/currencyStore'
import SavingsForm from '../components/SavingsForm.vue'
import SavingsTable from '../components/SavingsTable.vue'

const savingsStore = useSavingsStore()
const currencyStore = useCurrencyStore()

const showForm = ref(false)
const editingSaving = ref(null)
const isEditing = ref(false)

const years = computed(() => {
  const current = new Date().getFullYear()
  const set = new Set([current, current - 1, current - 2, current - 3, current + 1])
  // Agregar años existentes en la data
  savingsStore.savings.forEach(s => set.add(Number(s.year)))
  return Array.from(set).sort((a, b) => b - a)
})

const summary = computed(() => savingsStore.summary)

function openNew() {
  editingSaving.value = null
  isEditing.value = false
  showForm.value = true
}

function onEditSaving(s) {
  editingSaving.value = s
  isEditing.value = true
  showForm.value = true
}

function onSaved() {
  showForm.value = false
  editingSaving.value = null
  isEditing.value = false
  savingsStore.loadSavings()
}

function onCancelled() { showForm.value = false }

onMounted(async () => {
  await savingsStore.loadSavings()
  savingsStore.startRealtime()
})

onUnmounted(() => savingsStore.stopRealtime())
</script>

<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Ahorros</h1>
          <p class="text-gray-600">Registra tus ahorros mensuales y visualiza tu progreso</p>
        </div>

        <div class="flex items-center gap-3">
          <v-select
            v-model="savingsStore.filterYear"
            :items="years"
            label="Año"
            variant="outlined"
            density="comfortable"
            hide-details
            style="max-width:160px"
            @update:model-value="savingsStore.setYear($event)"
          />
          <v-btn color="primary" size="large" prepend-icon="mdi-plus" class="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:shadow-xl" @click="openNew">
            Nuevo Ahorro
          </v-btn>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <v-card-text class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 mb-1">Total Año {{ savingsStore.filterYear }}</p>
                <p class="text-2xl font-bold text-green-600">+{{ currencyStore.formatAmount(summary.totalYear) }}</p>
              </div>
              <div class="p-3 rounded-full bg-green-100">
                <v-icon color="success" size="24">mdi-piggy-bank</v-icon>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <v-card-text class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 mb-1">Promedio Mensual</p>
                <p class="text-2xl font-bold text-blue-600">{{ currencyStore.formatAmount(summary.totalYear / Math.max(1, summary.byMonth.filter(m => m>0).length)) }}</p>
              </div>
              <div class="p-3 rounded-full bg-blue-100">
                <v-icon color="primary" size="24">mdi-chart-line</v-icon>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <v-card-text class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 mb-1">Meses con ahorro</p>
                <p class="text-2xl font-bold text-purple-600">{{ summary.byMonth.filter(m => m>0).length }}</p>
              </div>
              <div class="p-3 rounded-full bg-purple-100">
                <v-icon color="purple" size="24">mdi-calendar-month</v-icon>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <v-card-text class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 mb-1">Registros</p>
                <p class="text-2xl font-bold text-gray-700">{{ summary.count }}</p>
              </div>
              <div class="p-3 rounded-full bg-gray-100">
                <v-icon color="grey" size="24">mdi-receipt</v-icon>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Savings Table -->
    <SavingsTable @edit-saving="onEditSaving" />

    <!-- Dialog -->
    <v-dialog v-model="showForm" max-width="600" persistent>
      <SavingsForm :saving="editingSaving" :is-edit="isEditing" @saved="onSaved" @cancelled="onCancelled" />
    </v-dialog>

    <!-- Loading Overlay -->
    <v-overlay v-model="savingsStore.loading" class="align-center justify-center" persistent>
      <div class="text-center">
        <v-progress-circular color="primary" indeterminate size="64" class="mb-4" />
        <p class="text-white text-lg">Cargando ahorros...</p>
      </div>
    </v-overlay>

    <!-- Error Snackbar -->
    <v-snackbar v-model="savingsStore.error" color="error" timeout="5000" location="top">
      {{ savingsStore.error }}
      <template #actions>
        <v-btn variant="text" @click="savingsStore.clearError()">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>