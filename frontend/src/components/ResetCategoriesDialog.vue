<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const confirmText = ref('')
const loading = ref(false)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isFormValid = computed(() => {
  return confirmText.value.toLowerCase() === 'restaurar categorías'
})

function closeDialog() {
  isOpen.value = false
  resetForm()
}

function resetForm() {
  confirmText.value = ''
  loading.value = false
}

async function confirmReset() {
  if (!isFormValid.value) return
  
  loading.value = true
  try {
    emit('confirm')
    // Don't close immediately, let the parent handle it
  } catch (error) {
    // El error se maneja en el componente padre
    loading.value = false
  }
}
</script>

<template>
  <v-dialog 
    v-model="isOpen" 
    max-width="550" 
    persistent
    class="reset-categories-dialog"
    :fullscreen="$vuetify.display.xs"
    scrollable
  >
    <v-card class="rounded-xl overflow-hidden">
      <!-- Header con gradiente naranja -->
      <v-card-title class="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-orange-400 bg-opacity-30 rounded-lg">
            <v-icon size="28" color="white">mdi-restore</v-icon>
          </div>
          <div>
            <h3 class="text-lg sm:text-xl font-bold">
              <span class="hidden sm:inline">Restaurar Categorías por Defecto</span>
              <span class="sm:hidden">Restaurar Categorías</span>
            </h3>
            <p class="text-orange-100 text-sm mt-1">Esta acción no se puede deshacer</p>
          </div>
        </div>
      </v-card-title>

      <v-card-text class="px-6 py-6">
        <!-- Advertencia principal -->
        <v-alert
          type="warning"
          variant="tonal"
          class="mb-6"
          prominent
        >
          <template #prepend>
            <v-icon size="32">mdi-backup-restore</v-icon>
          </template>
          <div class="font-semibold text-lg mb-2">¿Estás seguro de restaurar las categorías?</div>
          <div class="text-sm">
            Esta acción <strong>eliminará todas tus categorías personalizadas</strong> y las reemplazará con las categorías por defecto de Spendly.
          </div>
        </v-alert>

        <!-- Información de lo que se perderá -->
        <div class="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <v-icon color="warning">mdi-information</v-icon>
            Lo que sucederá:
          </h4>
          <ul class="space-y-2 text-sm text-amber-800">
            <li class="flex items-center gap-2">
              <v-icon size="16" color="warning">mdi-circle-small</v-icon>
              Se eliminarán todas las categorías que hayas creado
            </li>
            <li class="flex items-center gap-2">
              <v-icon size="16" color="warning">mdi-circle-small</v-icon>
              Se eliminarán todas las subcategorías personalizadas
            </li>
            <li class="flex items-center gap-2">
              <v-icon size="16" color="warning">mdi-circle-small</v-icon>
              Se restaurarán las categorías originales de Spendly
            </li>
            <li class="flex items-center gap-2">
              <v-icon size="16" color="success">mdi-check-circle</v-icon>
              Tus transacciones existentes NO se verán afectadas
            </li>
          </ul>
        </div>

        <!-- Formulario de confirmación -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">
              <span class="hidden sm:inline">Para continuar, escribe exactamente:</span>
              <span class="sm:hidden">Escribe:</span>
              <code class="bg-gray-200 px-2 py-1 rounded text-orange-600 font-mono text-xs sm:text-sm block sm:inline mt-1 sm:mt-0">restaurar categorías</code>
            </label>
            <v-text-field
              v-model="confirmText"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-keyboard"
              placeholder="restaurar categorías"
              :rules="[v => v.toLowerCase() === 'restaurar categorías' || 'Debes escribir exactamente: restaurar categorías']"
            />
          </div>
        </div>

        <!-- Información adicional -->
        <v-alert
          type="info"
          variant="tonal"
          class="mt-6"
        >
          <template #prepend>
            <v-icon>mdi-lightbulb</v-icon>
          </template>
          <div class="text-sm">
            <strong>Consejo:</strong> Después de restaurar, podrás volver a personalizar tus categorías desde esta misma sección. 
            Las categorías por defecto incluyen las opciones más comunes para gastos e ingresos.
          </div>
        </v-alert>
      </v-card-text>

      <!-- Acciones -->
      <v-card-actions class="px-4 py-3 bg-gray-50 gap-2">
        <v-btn
          @click="closeDialog"
          variant="outlined"
          size="default"
          prepend-icon="mdi-arrow-left"
          class="flex-1 text-xs sm:text-sm"
        >
          Cancelar
        </v-btn>
        
        <v-btn
          @click="confirmReset"
          color="warning"
          variant="flat"
          size="default"
          :loading="loading"
          :disabled="!isFormValid"
          prepend-icon="mdi-restore"
          class="flex-1 text-xs sm:text-sm"
        >
          <span class="hidden sm:inline">Sí, Restaurar Categorías</span>
          <span class="sm:hidden">Restaurar</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
:deep(.v-alert__prepend) {
  align-self: flex-start;
  margin-top: 4px;
}

code {
  font-size: 0.875rem;
}

.reset-categories-dialog :deep(.v-overlay__content) {
  margin: 16px;
  max-height: calc(100vh - 32px);
}

@media (max-width: 600px) {
  .reset-categories-dialog :deep(.v-overlay__content) {
    margin: 0;
    height: 100vh;
    max-height: 100vh;
  }
}

/* Estilos para botones responsivos */
.reset-categories-dialog :deep(.v-btn) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

@media (max-width: 480px) {
  .reset-categories-dialog :deep(.v-btn .v-btn__content) {
    font-size: 0.75rem;
  }
}
</style>