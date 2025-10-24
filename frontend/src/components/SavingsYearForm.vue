<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSavingsStore } from '../store/savingsStore'
import { useCurrencyStore } from '../store/currencyStore'

const emit = defineEmits(['saved', 'cancelled'])

const savingsStore = useSavingsStore()
const currencyStore = useCurrencyStore()

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i)

const year = ref(savingsStore.filterYear || currentYear)
// Array de 12 posiciones, índice 0 -> Enero
const months = ref(Array.from({ length: 12 }, () => null))

const monthLabels = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

onMounted(() => {
  // Si hay datos cargados del año, prellenar
  const byMonth = savingsStore.summary?.byMonth || []
  months.value = Array.from({ length: 12 }, (_, i) => {
    const val = Number(byMonth[i] || 0)
    return val > 0 ? val : null
  })
})

const totalEntered = computed(() => {
  return months.value.reduce((sum, v) => sum + (Number(v) || 0), 0)
})

async function onSubmit() {
  try {
    await savingsStore.setYear(year.value)
    await savingsStore.saveYearMonths(months.value)
    emit('saved')
  } catch (e) {
    console.error('SavingsYearForm submit error', e)
  }
}

function onCancel() { emit('cancelled') }
</script>

<template>
  <v-card class="rounded-xl border-0 shadow-md">
    <v-card-title class="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
      <div class="flex items-center gap-3">
        <v-icon size="24">mdi-calendar-multiselect</v-icon>
        <span class="text-lg font-semibold">Registrar Ahorros por Año</span>
      </div>
    </v-card-title>

    <v-card-text class="px-6 py-6">
      <v-form @submit.prevent="onSubmit">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <v-select
            v-model="year"
            :items="years"
            label="Año"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-calendar"
            hide-details
          />

          <v-text-field
            :model-value="currencyStore.formatAmount(totalEntered)"
            label="Total ingresado"
            variant="outlined"
            density="comfortable"
            disabled
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="(label, idx) in monthLabels" :key="idx" class="p-4 bg-gray-50 rounded-lg border">
            <div class="flex items-center justify-between mb-3">
              <span class="font-medium text-gray-700">{{ label }}</span>
              <v-icon color="grey">mdi-calendar-month</v-icon>
            </div>
            <v-text-field
              v-model.number="months[idx]"
              :label="'Monto (' + currencyStore.currentCurrencyInfo.code + ')'"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-cash"
              hide-details
            >
              <template #append-inner>
                <span class="text-sm text-gray-500 font-medium">{{ currencyStore.currentCurrencyInfo.symbol }}</span>
              </template>
            </v-text-field>
          </div>
        </div>

        <div class="flex gap-3 pt-6">
          <v-btn type="submit" color="primary" variant="flat" size="large" class="flex-1">
            <v-icon start>mdi-content-save</v-icon>
            Guardar Año
          </v-btn>
          <v-btn @click="onCancel" variant="outlined" size="large" class="flex-1">
            <v-icon start>mdi-close</v-icon>
            Cancelar
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>