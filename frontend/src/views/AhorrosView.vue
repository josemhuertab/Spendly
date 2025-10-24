<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSavingsStore } from '@/store/savingsStore'
import { useCurrencyStore } from '@/store/currencyStore'
import SavingsForm from '../components/SavingsForm.vue'
import SavingsTable from '../components/SavingsTable.vue'
import SavingsYearForm from '../components/SavingsYearForm.vue'

const savingsStore = useSavingsStore()
const currencyStore = useCurrencyStore()

const showForm = ref(false)
const showYearForm = ref(false)
const editingSaving = ref(null)
const isEditing = ref(false)
const showGoalDialog = ref(false)
const goalAmountInput = ref(0)


const years = computed(() => {
  const current = new Date().getFullYear()
  const set = new Set([current, current - 1, current - 2, current - 3, current + 1])
  // Agregar años existentes en la data
  savingsStore.savings.forEach(s => set.add(Number(s.year)))
  return Array.from(set).sort((a, b) => b - a)
})

const monthItems = [
  { value: null, label: 'Todos' },
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
]

const summary = computed(() => savingsStore.summary)
const selectedMonthTotal = computed(() => {
  if (!savingsStore.filterMonth) return 0
  const idx = Number(savingsStore.filterMonth) - 1
  const val = summary.value.byMonth[idx] || 0
  return Number(val)
})

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

function openGoalDialog() {
  showGoalDialog.value = true
  goalAmountInput.value = Number(savingsStore.annualGoal || 0)
}

async function saveAnnualGoal() {
  try {
    await savingsStore.setAnnualGoalAmount(goalAmountInput.value)
    showGoalDialog.value = false
  } catch (e) {
    // El snackbar de error del store se mostrará automáticamente
  }
}

onMounted(async () => {
  await savingsStore.loadSavings(savingsStore.filterYear)
  await savingsStore.loadAnnualGoal()
  savingsStore.startRealtime()
  goalAmountInput.value = Number(savingsStore.annualGoal || 0)
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
          <v-select
            v-model="savingsStore.filterMonth"
            :items="monthItems"
            item-title="label"
            item-value="value"
            label="Mes"
            variant="outlined"
            density="comfortable"
            hide-details
            style="max-width:180px"
            @update:model-value="savingsStore.setMonth($event)"
          />
          <v-btn color="primary" size="large" prepend-icon="mdi-plus" class="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:shadow-xl" @click="openNew">
            Nuevo Ahorro
          </v-btn>
          <v-btn color="secondary" size="large" prepend-icon="mdi-calendar-multiselect" class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg hover:shadow-xl" @click="showYearForm=true">
            Registrar por Año
          </v-btn>
          <v-btn color="teal" size="large" prepend-icon="mdi-target" class="bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg hover:shadow-xl" @click="openGoalDialog">
            Meta anual
          </v-btn>

        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                <p class="text-sm font-medium text-gray-600 mb-1">Total General</p>
                <p class="text-2xl font-bold text-teal-600">{{ currencyStore.formatAmount(summary.totalAll) }}</p>
              </div>
              <div class="p-3 rounded-full bg-teal-100">
                <v-icon color="teal" size="24">mdi-sigma</v-icon>
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
      </div>
    </div>

    <!-- Savings Table -->
    <SavingsTable @edit-saving="onEditSaving" />

    <!-- Dialogs -->
    <v-dialog v-model="showForm" max-width="600" persistent>
      <SavingsForm :saving="editingSaving" :is-edit="isEditing" @saved="onSaved" @cancelled="onCancelled" />
    </v-dialog>
    <v-dialog v-model="showYearForm" max-width="980" persistent>
      <SavingsYearForm @saved="showYearForm=false; savingsStore.loadSavings()" @cancelled="showYearForm=false" />
    </v-dialog>

    <!-- Annual Goal Dialog -->
    <v-dialog v-model="showGoalDialog" max-width="520" persistent>
      <v-card>
        <v-card-title class="px-6 py-4">Configurar meta anual</v-card-title>
        <v-card-text class="px-6 py-4">
          <div class="mb-3 text-sm text-gray-600">Año seleccionado: {{ savingsStore.filterYear }}</div>
          <v-text-field
            v-model.number="goalAmountInput"
            :label="'Meta anual (' + currencyStore.currentCurrencyInfo.code + ')'"
            type="number"
            min="0"
            variant="outlined"
            density="comfortable"
            :prepend-inner-icon="currencyStore.currentCurrencyInfo.symbol === '$' ? 'mdi-cash' : 'mdi-currency-usd'"
          />
          <div class="text-xs text-gray-500 mt-2">Esta meta se guarda en tu cuenta y se usa para el progreso en el Dashboard.</div>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showGoalDialog=false">Cancelar</v-btn>
          <v-btn color="primary" :loading="savingsStore.loading" @click="saveAnnualGoal">Guardar</v-btn>
        </v-card-actions>
      </v-card>
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