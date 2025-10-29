<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
const showAdvancedFilters = ref(false)

// Advanced filters
const filterType = ref('single') // 'single', 'range'
const fromYear = ref(savingsStore.filterYear)
const fromMonth = ref(savingsStore.filterMonth)
const toYear = ref(savingsStore.filterYearTo || new Date().getFullYear())
const toMonth = ref(savingsStore.filterMonthTo)


const years = computed(() => {
  const current = new Date().getFullYear()
  const minYear = 2024
  const set = new Set()
  
  // Agregar años desde 2024 hasta el año siguiente
  for (let year = minYear; year <= current + 1; year++) {
    set.add(year)
  }
  
  // Agregar años existentes en la data (solo si son >= 2024)
  savingsStore.savings.forEach(s => {
    const year = Number(s.year)
    if (year >= minYear) {
      set.add(year)
    }
  })
  
  return Array.from(set).sort((a, b) => b - a)
})

const monthItems = [
  { value: null, label: 'Todos' },
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
]

const monthItemsNoAll = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
]

const filterTypeOptions = [
  { title: 'Período único', value: 'single' },
  { title: 'Rango de períodos', value: 'range' }
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

function applyFilters() {
  if (filterType.value === 'single') {
    // Limpiar filtros de rango
    savingsStore.filterYearTo = null
    savingsStore.filterMonthTo = null
    savingsStore.setYear(fromYear.value)
    savingsStore.setMonth(fromMonth.value)
  } else {
    savingsStore.setDateRange(fromYear.value, fromMonth.value, toYear.value, toMonth.value)
  }
}

function clearAllFilters() {
  filterType.value = 'single'
  fromYear.value = new Date().getFullYear()
  fromMonth.value = null
  toYear.value = new Date().getFullYear()
  toMonth.value = null
  savingsStore.clearFilters()
  // Aplicar los filtros limpios
  applyFilters()
}

const hasActiveFilters = computed(() => {
  return savingsStore.filterMonth || 
         savingsStore.filterYearTo || 
         savingsStore.filterMonthTo ||
         savingsStore.filterYear !== new Date().getFullYear()
})

const currentPeriodTitle = computed(() => {
  if (savingsStore.filterYearTo || savingsStore.filterMonthTo) {
    // Modo rango
    const fromYear = savingsStore.filterYear
    const toYear = savingsStore.filterYearTo || fromYear
    const fromMonth = savingsStore.filterMonth
    const toMonth = savingsStore.filterMonthTo
    
    if (fromYear === toYear) {
      if (fromMonth && toMonth) {
        const fromMonthName = monthItems.find(m => m.value === fromMonth)?.label
        const toMonthName = monthItems.find(m => m.value === toMonth)?.label
        return `${fromMonthName} - ${toMonthName} ${fromYear}`
      }
      return `Año ${fromYear}`
    }
    return `${fromYear} - ${toYear}`
  } else if (savingsStore.filterMonth) {
    // Mes específico
    const monthName = monthItems.find(m => m.value === savingsStore.filterMonth)?.label
    return `${monthName} ${savingsStore.filterYear}`
  } else {
    // Año completo
    return `Año ${savingsStore.filterYear}`
  }
})

// Watchers para sincronizar filtros
watch(() => savingsStore.filterYear, (newYear) => {
  if (filterType.value === 'single') {
    fromYear.value = newYear
  }
})

watch(() => savingsStore.filterMonth, (newMonth) => {
  if (filterType.value === 'single') {
    fromMonth.value = newMonth
  }
})

// Detectar cuando se cambia el tipo de filtro para inicializar valores
watch(filterType, (newType) => {
  if (newType === 'range') {
    // Inicializar con valores actuales del store
    fromYear.value = savingsStore.filterYear
    fromMonth.value = savingsStore.filterMonth || 1
    toYear.value = savingsStore.filterYearTo || savingsStore.filterYear
    toMonth.value = savingsStore.filterMonthTo || 12
  } else {
    // Modo single, usar valores actuales del store
    fromYear.value = savingsStore.filterYear
    fromMonth.value = savingsStore.filterMonth
  }
  // Aplicar los filtros después del cambio
  applyFilters()
})

onMounted(async () => {
  // Asegurar que inicie con el año actual y todos los meses
  const currentYear = new Date().getFullYear()
  
  // Si no hay filtros establecidos, usar año actual con todos los meses
  if (!savingsStore.filterYear || savingsStore.filterYear !== currentYear) {
    savingsStore.filterYear = currentYear
    savingsStore.filterMonth = null // null = todos los meses
    savingsStore.filterYearTo = null
    savingsStore.filterMonthTo = null
  }
  
  // Inicializar filtros locales con valores del store
  fromYear.value = savingsStore.filterYear
  fromMonth.value = savingsStore.filterMonth
  toYear.value = savingsStore.filterYearTo || savingsStore.filterYear
  toMonth.value = savingsStore.filterMonthTo
  
  await savingsStore.loadSavings(savingsStore.filterYear)
  await savingsStore.loadAnnualGoal()
  savingsStore.startRealtime()
  goalAmountInput.value = Number(savingsStore.annualGoal || 0)
})

onUnmounted(() => savingsStore.stopRealtime())
</script>

<template>
  <v-container fluid class="pa-6 theme-bg min-h-screen">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold theme-text-primary mb-2">Ahorros</h1>
          <p class="theme-text-secondary">Registra tus ahorros mensuales y visualiza tu progreso</p>
          <div class="mt-2">
            <v-chip
              color="primary"
              variant="flat"
              size="small"
              prepend-icon="mdi-calendar"
            >
              {{ currentPeriodTitle }}
            </v-chip>
          </div>
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
          <v-btn
            @click="showAdvancedFilters = !showAdvancedFilters"
            variant="outlined"
            prepend-icon="mdi-filter-cog"
            :color="showAdvancedFilters ? 'primary' : 'default'"
          >
            Filtros Avanzados
          </v-btn>

        </div>
      </div>

      <!-- Advanced Filters -->
      <v-expand-transition>
        <v-card v-show="showAdvancedFilters" class="rounded-xl border-0 shadow-md mb-6">
          <v-card-text class="p-6">
            <div class="flex items-center gap-4 mb-4">
              <v-select
                v-model="filterType"
                :items="filterTypeOptions"
                label="Tipo de filtro"
                variant="outlined"
                density="comfortable"
                hide-details
                style="min-width: 200px;"
              />
              
              <v-btn
                v-if="hasActiveFilters"
                @click="clearAllFilters"
                variant="outlined"
                prepend-icon="mdi-filter-remove"
              >
                Limpiar Filtros
              </v-btn>
            </div>
            
            <div v-if="filterType === 'single'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <v-select
                v-model="fromYear"
                :items="years"
                label="Año"
                variant="outlined"
                density="comfortable"
                @update:model-value="applyFilters"
                style="min-width: 120px;"
              />
              
              <v-select
                v-model="fromMonth"
                :items="monthItems"
                item-title="label"
                item-value="value"
                label="Mes"
                variant="outlined"
                density="comfortable"
                clearable
                @update:model-value="applyFilters"
                style="min-width: 150px;"
              />
            </div>
            
            <div v-else class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex gap-2 items-center">
                  <span class="text-sm text-gray-600 font-medium" style="min-width: 60px;">Desde:</span>
                  <v-select
                    v-model="fromYear"
                    :items="years"
                    label="Año"
                    variant="outlined"
                    density="comfortable"
                    @update:model-value="applyFilters"
                    style="min-width: 90px; flex: 0 0 90px;"
                  />
                  <v-select
                    v-model="fromMonth"
                    :items="monthItemsNoAll"
                    item-title="label"
                    item-value="value"
                    label="Mes"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    @update:model-value="applyFilters"
                    style="min-width: 140px; flex: 1;"
                  />
                </div>
                
                <div class="flex gap-2 items-center">
                  <span class="text-sm text-gray-600 font-medium" style="min-width: 60px;">Hasta:</span>
                  <v-select
                    v-model="toYear"
                    :items="years"
                    label="Año"
                    variant="outlined"
                    density="comfortable"
                    @update:model-value="applyFilters"
                    style="min-width: 90px; flex: 0 0 90px;"
                  />
                  <v-select
                    v-model="toMonth"
                    :items="monthItemsNoAll"
                    item-title="label"
                    item-value="value"
                    label="Mes"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    @update:model-value="applyFilters"
                    style="min-width: 140px; flex: 1;"
                  />
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-expand-transition>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <v-card-text class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 mb-1">{{ currentPeriodTitle }}</p>
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

        <!-- Meta Anual Card -->
        <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer" @click="openGoalDialog">
          <v-card-text class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 mb-1">Meta {{ savingsStore.filterYear }}</p>
                <p class="text-2xl font-bold text-teal-600">{{ currencyStore.formatAmount(savingsStore.annualGoal || 0) }}</p>
                <div class="mt-2">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        class="bg-teal-500 h-2 rounded-full transition-all duration-300"
                        :style="{ width: Math.min(100, (summary.totalYear / Math.max(1, savingsStore.annualGoal)) * 100) + '%' }"
                      ></div>
                    </div>
                    <span class="text-xs text-gray-500">
                      {{ Math.round((summary.totalYear / Math.max(1, savingsStore.annualGoal)) * 100) }}%
                    </span>
                  </div>
                </div>
              </div>
              <div class="p-3 rounded-full bg-teal-100">
                <v-icon color="teal" size="24">mdi-target</v-icon>
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
    <v-dialog v-model="showGoalDialog" max-width="480" persistent>
      <v-card class="rounded-xl">
        <v-card-title class="px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
          <div class="flex items-center gap-3">
            <v-icon size="24">mdi-target</v-icon>
            <span class="text-lg font-semibold">Meta de Ahorro {{ savingsStore.filterYear }}</span>
          </div>
        </v-card-title>
        
        <v-card-text class="px-6 py-6">
          <div class="mb-4">
            <div class="text-center mb-4">
              <p class="text-sm text-gray-600 mb-2">Progreso actual</p>
              <div class="relative">
                <div class="w-32 h-32 mx-auto">
                  <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      stroke-width="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#14b8a6"
                      stroke-width="2"
                      :stroke-dasharray="`${Math.min(100, (summary.totalYear / Math.max(1, savingsStore.annualGoal)) * 100)}, 100`"
                    />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div class="text-center">
                      <div class="text-2xl font-bold text-teal-600">
                        {{ Math.round((summary.totalYear / Math.max(1, savingsStore.annualGoal)) * 100) }}%
                      </div>
                      <div class="text-xs text-gray-500">completado</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-3 text-sm text-gray-600">
                {{ currencyStore.formatAmount(summary.totalYear) }} de {{ currencyStore.formatAmount(savingsStore.annualGoal || 0) }}
              </div>
            </div>
          </div>
          
          <v-text-field
            v-model.number="goalAmountInput"
            :label="`Nueva meta (${currencyStore.currentCurrencyInfo.code})`"
            type="number"
            min="0"
            step="100"
            variant="outlined"
            density="comfortable"
            :prepend-inner-icon="currencyStore.currentCurrency === 'USD' ? 'mdi-currency-usd' : 'mdi-cash'"
            class="mb-3"
          >
            <template #append-inner>
              <span class="text-sm text-gray-500 font-medium">{{ currencyStore.currentCurrencyInfo.symbol }}</span>
            </template>
          </v-text-field>
          
          <div class="text-xs text-gray-500 text-center">
            Esta meta te ayuda a mantener el enfoque en tus objetivos de ahorro
          </div>
        </v-card-text>
        
        <v-card-actions class="px-6 pb-6">
          <v-btn @click="showGoalDialog=false" variant="outlined" class="flex-1">
            Cancelar
          </v-btn>
          <v-btn 
            color="teal" 
            :loading="savingsStore.loading" 
            @click="saveAnnualGoal"
            variant="flat"
            class="flex-1"
          >
            <v-icon start>mdi-content-save</v-icon>
            Guardar Meta
          </v-btn>
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