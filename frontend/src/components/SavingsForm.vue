<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSavingsStore } from '../store/savingsStore'
import { useCurrencyStore } from '../store/currencyStore'

const props = defineProps({
  saving: { type: Object, default: null },
  isEdit: { type: Boolean, default: false }
})

const emit = defineEmits(['saved', 'cancelled'])

const savingsStore = useSavingsStore()
const currencyStore = useCurrencyStore()

const months = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i)

const formData = ref({
  year: currentYear,
  month: new Date().getMonth() + 1,
  amount: null,
  note: ''
})

const rules = {
  required: v => !!v || 'Este campo es requerido',
  amount: v => (v && v > 0) || 'El monto debe ser mayor a 0',
}

const title = computed(() => props.isEdit ? 'Editar Ahorro' : 'Registrar Ahorro')
const submitText = computed(() => props.isEdit ? 'Actualizar' : 'Guardar')

function initialize() {
  if (props.isEdit && props.saving) {
    formData.value = {
      year: props.saving.year,
      month: props.saving.month,
      amount: props.saving.amount,
      note: props.saving.note || ''
    }
  } else {
    formData.value.year = savingsStore.filterYear || currentYear
  }
}

async function onSubmit() {
  if (!formData.value.amount || formData.value.amount <= 0) return
  try {
    const payload = { ...formData.value, amount: Number(formData.value.amount) }
    if (props.isEdit && props.saving?.id) {
      await savingsStore.updateSavingEntry(props.saving.id, payload)
    } else {
      await savingsStore.addSavingEntry(payload)
    }
    emit('saved')
  } catch (e) {
    console.error('SavingForm submit error:', e)
  }
}

function onCancel() { emit('cancelled') }

onMounted(() => initialize())
</script>

<template>
  <v-card class="rounded-xl border-0 shadow-md">
    <v-card-title class="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
      <div class="flex items-center gap-3">
        <v-icon size="24">mdi-piggy-bank</v-icon>
        <span class="text-lg font-semibold">{{ title }}</span>
      </div>
    </v-card-title>

    <v-card-text class="px-6 py-6">
      <v-form @submit.prevent="onSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <v-select
            v-model="formData.year"
            :items="years"
            label="Año"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-calendar"
            :rules="[rules.required]"
            required
          />
          <v-select
            v-model="formData.month"
            :items="months"
            item-title="label"
            item-value="value"
            label="Mes"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-calendar-month"
            :rules="[rules.required]"
            required
          />
        </div>

        <v-text-field
          v-model.number="formData.amount"
          :label="'Monto (' + currencyStore.currentCurrencyInfo.code + ')'"
          type="number"
          min="0"
          step="0.01"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-cash"
          :rules="[rules.required, rules.amount]"
          required
          class="mb-4"
        >
          <template #append-inner>
            <span class="text-sm text-gray-500 font-medium">{{ currencyStore.currentCurrencyInfo.symbol }}</span>
          </template>
        </v-text-field>

        <v-textarea
          v-model="formData.note"
          label="Nota (opcional)"
          variant="outlined"
          density="comfortable"
          rows="2"
          prepend-inner-icon="mdi-text"
          class="mb-4"
        />

        <div class="flex gap-3 pt-2">
          <v-btn type="submit" color="primary" variant="flat" size="large" class="flex-1">
            <v-icon start>{{ props.isEdit ? 'mdi-content-save' : 'mdi-plus' }}</v-icon>
            {{ submitText }}
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