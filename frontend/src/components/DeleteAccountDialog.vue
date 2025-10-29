<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const password = ref('')
const confirmText = ref('')
const loading = ref(false)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isFormValid = computed(() => {
  return password.value.trim() !== '' && 
         confirmText.value.toLowerCase() === 'eliminar mi cuenta'
})

function closeDialog() {
  isOpen.value = false
  resetForm()
}

function resetForm() {
  password.value = ''
  confirmText.value = ''
  loading.value = false
}

async function confirmDelete() {
  if (!isFormValid.value) return
  
  loading.value = true
  try {
    await emit('confirm', password.value)
    closeDialog()
  } catch (error) {
    // El error se maneja en el componente padre
    loading.value = false
  }
}
</script>

<template>
  <v-dialog 
    v-model="isOpen" 
    max-width="600" 
    persistent
    class="delete-account-dialog"
  >
    <v-card class="rounded-xl overflow-hidden">
      <!-- Header con gradiente rojo -->
      <v-card-title class="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-red-500 bg-opacity-30 rounded-lg">
            <v-icon size="28" color="white">mdi-alert-octagon</v-icon>
          </div>
          <div>
            <h3 class="text-xl font-bold">¡Eliminar Cuenta Permanentemente!</h3>
            <p class="text-red-100 text-sm mt-1">Esta acción no se puede deshacer</p>
          </div>
        </div>
      </v-card-title>

      <v-card-text class="px-6 py-6">
        <!-- Advertencia principal -->
        <v-alert
          type="error"
          variant="tonal"
          class="mb-6"
          prominent
        >
          <template #prepend>
            <v-icon size="32">mdi-delete-forever</v-icon>
          </template>
          <div class="font-semibold text-lg mb-2">¿Estás completamente seguro?</div>
          <div class="text-sm">
            Al eliminar tu cuenta se perderán <strong>TODOS</strong> tus datos de forma permanente:
          </div>
        </v-alert>

        <!-- Lista de datos que se perderán -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <v-icon color="error">mdi-database-remove</v-icon>
            Datos que se eliminarán permanentemente:
          </h4>
          <ul class="space-y-2 text-sm text-gray-700">
            <li class="flex items-center gap-2">
              <v-icon size="16" color="error">mdi-circle-small</v-icon>
              Todas tus transacciones (gastos e ingresos)
            </li>
            <li class="flex items-center gap-2">
              <v-icon size="16" color="error">mdi-circle-small</v-icon>
              Configuraciones personalizadas de categorías
            </li>
            <li class="flex items-center gap-2">
              <v-icon size="16" color="error">mdi-circle-small</v-icon>
              Datos de ahorros y metas financieras
            </li>
            <li class="flex items-center gap-2">
              <v-icon size="16" color="error">mdi-circle-small</v-icon>
              Historial de compras y reportes
            </li>
            <li class="flex items-center gap-2">
              <v-icon size="16" color="error">mdi-circle-small</v-icon>
              Información de perfil y preferencias
            </li>
          </ul>
        </div>

        <!-- Formulario de confirmación -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">
              Para continuar, ingresa tu contraseña actual:
            </label>
            <v-text-field
              v-model="password"
              type="password"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-lock"
              placeholder="Tu contraseña actual"
              :rules="[v => !!v || 'La contraseña es requerida']"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">
              Escribe exactamente: <code class="bg-gray-200 px-2 py-1 rounded text-red-600 font-mono">eliminar mi cuenta</code>
            </label>
            <v-text-field
              v-model="confirmText"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-keyboard"
              placeholder="eliminar mi cuenta"
              :rules="[v => v.toLowerCase() === 'eliminar mi cuenta' || 'Debes escribir exactamente: eliminar mi cuenta']"
            />
          </div>
        </div>

        <!-- Advertencia final -->
        <v-alert
          type="warning"
          variant="tonal"
          class="mt-6"
        >
          <template #prepend>
            <v-icon>mdi-backup-restore</v-icon>
          </template>
          <div class="text-sm">
            <strong>Recomendación:</strong> Considera exportar tus datos importantes antes de eliminar tu cuenta. 
            Una vez eliminada, no podremos recuperar ninguna información.
          </div>
        </v-alert>
      </v-card-text>

      <!-- Acciones -->
      <v-card-actions class="px-6 py-4 bg-gray-50">
        <v-btn
          @click="closeDialog"
          variant="outlined"
          size="large"
          prepend-icon="mdi-arrow-left"
          class="flex-1"
        >
          Cancelar y Mantener Cuenta
        </v-btn>
        
        <v-btn
          @click="confirmDelete"
          color="error"
          variant="flat"
          size="large"
          :loading="loading"
          :disabled="!isFormValid"
          prepend-icon="mdi-delete-forever"
          class="flex-1"
        >
          Sí, Eliminar Permanentemente
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

.delete-account-dialog :deep(.v-overlay__content) {
  margin: 24px;
}
</style>