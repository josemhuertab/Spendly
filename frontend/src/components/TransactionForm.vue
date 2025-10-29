<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useTransactionStore } from '../store/transactionStore'
import { useCurrencyStore } from '../store/currencyStore'
import { useCategoryStore } from '../store/categoryStore'

const props = defineProps({
  transaction: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  presetPaymentMethod: {
    type: String,
    default: null
  },
  presetType: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['saved', 'cancelled'])

const transactionStore = useTransactionStore()
const currencyStore = useCurrencyStore()
const categoryStore = useCategoryStore()

// Form data
const formData = ref({
  type: 'gasto',
  category: '',
  subcategory: '',
  amount: null,
  description: '',
  date: new Date().toISOString().split('T')[0],
  paymentMethod: 'efectivo',
  installments: 1,
  installmentsPaid: 0
})

const loading = ref(false)
const error = ref('')

// Validation rules
const rules = {
  required: value => !!value || 'Este campo es requerido',
  amount: value => (value && value > 0) || 'El monto debe ser mayor a 0',
  installments: value => (value && value >= 1) || 'Las cuotas deben ser al menos 1'
}

// Categories from store

const paymentMethods = [
  'efectivo',
  'tarjeta_debito',
  'tarjeta_credito',
  'transferencia',
  'cheque'
]

// Computed properties
const availableCategories = computed(() => {
  return formData.value.type === 'gasto' 
    ? categoryStore.getExpenseCategories 
    : categoryStore.getIncomeCategories
})

const availableSubcategories = computed(() => {
  if (!formData.value.category) return []
  return categoryStore.getSubcategoriesForCategory(formData.value.category)
})

const isFormValid = computed(() => {
  return formData.value.type &&
         formData.value.category &&
         formData.value.amount > 0 &&
         formData.value.date &&
         formData.value.paymentMethod
})

const formTitle = computed(() => {
  return props.isEdit ? 'Editar Transacción' : 'Nueva Transacción'
})

const submitButtonText = computed(() => {
  return props.isEdit ? 'Actualizar' : 'Guardar'
})

const submitButtonColor = computed(() => {
  return formData.value.type === 'gasto' ? 'error' : 'success'
})

// Currency-related computed properties
const currentCurrencySymbol = computed(() => {
  return currencyStore.currentCurrencyInfo.symbol
})

const amountLabel = computed(() => {
  return `Monto (${currencyStore.currentCurrencyInfo.code})`
})

const formattedAmount = computed(() => {
  if (!formData.value.amount) return ''
  return currencyStore.formatAmount(formData.value.amount)
})

// Flag to track if form is being initialized
const isInitializing = ref(false)

// Watchers
watch(() => formData.value.type, (newType, oldType) => {
  // Only reset category when type actually changes and not during initialization
  if (!isInitializing.value && oldType && oldType !== newType) {
    formData.value.category = ''
    formData.value.subcategory = ''
  }
})

watch(() => formData.value.category, (newCategory, oldCategory) => {
  // Reset subcategory when category changes and not during initialization
  if (!isInitializing.value && oldCategory && oldCategory !== newCategory) {
    formData.value.subcategory = ''
  }
})

watch(() => formData.value.installments, (newInstallments) => {
  // Reset installments paid when installments change
  if (newInstallments < formData.value.installmentsPaid) {
    formData.value.installmentsPaid = 0
  }
})

watch(() => formData.value.paymentMethod, (newPaymentMethod) => {
  // Reset installments when payment method is not credit card
  if (newPaymentMethod !== 'tarjeta_credito') {
    formData.value.installments = 1
    formData.value.installmentsPaid = 0
  }
})

// Methods
function initializeForm() {
  // Set initialization flag to prevent watchers from resetting values
  isInitializing.value = true
  
  if (props.isEdit && props.transaction) {
    formData.value = {
      type: props.transaction.type || 'gasto',
      category: props.transaction.category || '',
      subcategory: props.transaction.subcategory || '',
      amount: props.transaction.amount || null,
      description: props.transaction.description || '',
      date: props.transaction.date || new Date().toISOString().split('T')[0],
      paymentMethod: props.transaction.paymentMethod || 'efectivo',
      installments: props.transaction.installments || 1,
      installmentsPaid: props.transaction.installmentsPaid || 0
    }
  } else {
    if (props.presetPaymentMethod) {
      formData.value.paymentMethod = props.presetPaymentMethod
    }
    if (props.presetType) {
      formData.value.type = props.presetType
    }
  }
  
  // Clear initialization flag after a short delay to allow Vue to process
  setTimeout(() => {
    isInitializing.value = false
  }, 100)
}

async function onSubmit() {
  if (!isFormValid.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const transactionData = {
      ...formData.value,
      amount: Number(formData.value.amount),
      currency: currencyStore.currentCurrency
    }
    
    if (props.isEdit && props.transaction) {
      await transactionStore.updateTransactionData(props.transaction.id, transactionData)
    } else {
      await transactionStore.addTransaction(transactionData)
    }
    
    emit('saved')
    resetForm()
  } catch (e) {
    error.value = e.message || 'Error al guardar la transacción'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  if (!props.isEdit) {
    const baseForm = {
      type: props.presetType || 'gasto',
      category: '',
      subcategory: '',
      amount: null,
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: props.presetPaymentMethod || 'efectivo',
      installments: 1,
      installmentsPaid: 0
    }
    
    // Reset installments if not credit card
    if (baseForm.paymentMethod !== 'tarjeta_credito') {
      baseForm.installments = 1
      baseForm.installmentsPaid = 0
    }
    
    formData.value = baseForm
  }
}

function onCancel() {
  emit('cancelled')
  if (!props.isEdit) {
    resetForm()
  }
}

function formatPaymentMethod(method) {
  const methods = {
    'efectivo': 'Efectivo',
    'tarjeta_debito': 'Tarjeta de Débito',
    'tarjeta_credito': 'Tarjeta de Crédito',
    'transferencia': 'Transferencia',
    'cheque': 'Cheque'
  }
  return methods[method] || method
}

// Lifecycle
onMounted(async () => {
  await categoryStore.loadUserCategories()
  initializeForm()
})
</script>

<template>
  <v-card class="transaction-form" elevation="0">
    <v-card-title class="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
      <div class="flex items-center gap-3">
        <v-icon size="24">
          {{ formData.type === 'gasto' ? 'mdi-minus-circle' : 'mdi-plus-circle' }}
        </v-icon>
        <span class="text-lg font-semibold">{{ formTitle }}</span>
      </div>
    </v-card-title>

    <v-card-text class="px-6 py-6">
      <v-form @submit.prevent="onSubmit">
        <!-- Type Selection -->
        <div class="mb-6" v-if="!props.presetType">
          <label class="block text-sm font-medium text-gray-700 mb-3">Tipo de Transacción</label>
          <v-btn-toggle
            v-model="formData.type"
            mandatory
            variant="outlined"
            divided
            class="w-full"
          >
            <v-btn value="gasto" class="flex-1" color="error">
              <v-icon start>mdi-minus-circle</v-icon>
              Gasto
            </v-btn>
            <v-btn value="ingreso" class="flex-1" color="success">
              <v-icon start>mdi-plus-circle</v-icon>
              Ingreso
            </v-btn>
          </v-btn-toggle>
        </div>
        
        <!-- Type Display (when preset) -->
        <div class="mb-6" v-if="props.presetType">
          <label class="block text-sm font-medium text-gray-700 mb-3">Tipo de Transacción</label>
          <v-chip 
            :color="formData.type === 'gasto' ? 'error' : 'success'" 
            size="large" 
            class="px-4 py-2"
          >
            <v-icon start>
              {{ formData.type === 'gasto' ? 'mdi-minus-circle' : 'mdi-plus-circle' }}
            </v-icon>
            {{ formData.type === 'gasto' ? 'Gasto' : 'Ingreso' }}
          </v-chip>
        </div>

        <!-- Amount -->
        <v-text-field
          v-model.number="formData.amount"
          :label="amountLabel"
          type="number"
          step="0.01"
          min="0"
          variant="outlined"
          density="comfortable"
          :prepend-inner-icon="currencyStore.currentCurrency === 'USD' ? 'mdi-currency-usd' : 'mdi-cash'"
          :rules="[rules.required, rules.amount]"
          class="mb-4"
          required
        >
          <template #append-inner>
            <span class="text-sm text-gray-500 font-medium">{{ currentCurrencySymbol }}</span>
          </template>
        </v-text-field>
        

        <!-- Category -->
        <v-select
          v-model="formData.category"
          :items="availableCategories"
          label="Categoría"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-tag"
          :rules="[rules.required]"
          class="mb-4"
          required
        />

        <!-- Subcategory -->
        <v-select
          v-model="formData.subcategory"
          :items="availableSubcategories"
          label="Subcategoría (opcional)"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-tag-outline"
          class="mb-4"
          clearable
          :disabled="!formData.category || availableSubcategories.length === 0"
        >
          <template #no-data>
            <v-list-item>
              <v-list-item-title class="text-gray-500">
                {{ formData.category ? 'No hay subcategorías para esta categoría' : 'Selecciona una categoría primero' }}
              </v-list-item-title>
            </v-list-item>
          </template>
        </v-select>

        <!-- Description -->
        <v-textarea
          v-model="formData.description"
          label="Descripción (opcional)"
          variant="outlined"
          density="comfortable"
          rows="2"
          prepend-inner-icon="mdi-text"
          class="mb-4"
        />

        <!-- Date -->
        <v-text-field
          v-model="formData.date"
          label="Fecha"
          type="date"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-calendar"
          :rules="[rules.required]"
          class="mb-4"
          required
        />

        <!-- Payment Method -->
        <v-select
          v-model="formData.paymentMethod"
          :items="paymentMethods"
          :item-title="formatPaymentMethod"
          :item-value="(item) => item"
          label="Método de Pago"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-credit-card"
          :rules="[rules.required]"
          class="mb-4"
          required
        />

        <!-- Installments (only for credit card expenses) -->
        <div v-if="formData.type === 'gasto' && formData.paymentMethod === 'tarjeta_credito'" class="grid grid-cols-2 gap-4 mb-4">
          <v-text-field
            v-model.number="formData.installments"
            label="Cuotas"
            type="number"
            min="1"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-calendar-multiple"
            :rules="[rules.installments]"
          />
          
          <v-text-field
            v-model.number="formData.installmentsPaid"
            label="Cuotas Pagadas"
            type="number"
            min="0"
            :max="formData.installments"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-check-circle"
          />
        </div>

        <!-- Error Message -->
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="error = ''"
        >
          {{ error }}
        </v-alert>

        <!-- Actions -->
        <div class="flex gap-3 pt-4">
          <v-btn
            type="submit"
            :color="submitButtonColor"
            :loading="loading"
            :disabled="!isFormValid"
            variant="flat"
            size="large"
            class="flex-1"
          >
            <v-icon start>
              {{ props.isEdit ? 'mdi-content-save' : 'mdi-plus' }}
            </v-icon>
            {{ submitButtonText }}
          </v-btn>
          
          <v-btn
            @click="onCancel"
            variant="outlined"
            size="large"
            class="flex-1"
          >
            <v-icon start>mdi-close</v-icon>
            Cancelar
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.transaction-form {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.transaction-form :deep(.v-btn-toggle) {
  border-radius: 12px;
  overflow: hidden;
}

.transaction-form :deep(.v-btn-toggle .v-btn) {
  border-radius: 0;
  height: 48px;
}

.transaction-form :deep(.v-field) {
  border-radius: 12px;
}

.transaction-form :deep(.v-btn) {
  border-radius: 12px;
  text-transform: none;
  font-weight: 500;
}
</style>