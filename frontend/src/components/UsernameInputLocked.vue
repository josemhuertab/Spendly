<template>
  <div class="space-y-2">
    <label class="block text-sm font-semibold text-gray-900 dark:text-gray-100">
      Nombre de usuario
    </label>
    
    <!-- Modo bloqueado (mostrar username actual) -->
    <div v-if="!isEditing" class="relative">
      <div class="w-full px-3 py-3 rounded-md shadow-sm flex items-center justify-between bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-600 min-h-[56px]">
        <div class="flex items-center space-x-2 flex-1">
          <span class="text-gray-900 font-semibold text-base dark:text-white">
            {{ currentUsername ? `@${currentUsername}` : 'Sin username configurado' }}
          </span>
        </div>
        
        <v-btn
          @click="startEditing"
          variant="text"
          size="small"
          prepend-icon="mdi-pencil"
          color="primary"
        >
          Cambiar
        </v-btn>
      </div>
      
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ currentUsername ? 'Tu nombre de usuario único' : 'Debes configurar un nombre de usuario' }}
      </p>
    </div>

    <!-- Modo edición (componente completo SIN label duplicado) -->
    <div v-else>
      <div class="space-y-2">
        <div class="relative">
          <input
            v-model="localUsername"
            type="text"
            placeholder="ej: juan_perez"
            class="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 bg-white text-gray-900 border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            :class="{
              'border-red-500 focus:ring-red-500 focus:border-red-500': validationError,
              'border-green-500 focus:ring-green-500 focus:border-green-500': isValid && localUsername,
              'pr-10': isChecking || validationError || (isValid && localUsername)
            }"
            @input="handleInput"
            @blur="handleBlur"
            maxlength="20"
          />
          
          <!-- Loading spinner -->
          <div v-if="isChecking" class="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg class="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          
          <!-- Success icon -->
          <div v-else-if="isValid && localUsername" class="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg class="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
          
          <!-- Error icon -->
          <div v-else-if="validationError" class="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg class="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        
        <!-- Error message -->
        <p v-if="validationError" class="text-sm text-red-600 dark:text-red-400">
          {{ validationError }}
        </p>
        
        <!-- Success message -->
        <p v-else-if="isValid && localUsername" class="text-sm text-green-600 dark:text-green-400">
          ¡Username disponible!
        </p>
        
        <!-- Help text -->
        <p v-else class="text-sm text-gray-500 dark:text-gray-400">
          3-20 caracteres, solo letras, números y guiones bajos
        </p>
        
        <!-- Suggestions -->
        <div v-if="suggestions.length > 0" class="mt-2">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Sugerencias disponibles:</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="suggestion in suggestions"
              :key="suggestion"
              @click="selectSuggestion(suggestion)"
              class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-3 mt-3">
        <v-btn
          @click="saveUsername"
          :loading="saving"
          :disabled="!isValid || !localUsername"
          color="primary"
          size="default"
          prepend-icon="mdi-content-save"
        >
          Guardar
        </v-btn>
        
        <v-btn
          @click="cancelEditing"
          variant="outlined"
          size="default"
          prepend-icon="mdi-close"
        >
          Cancelar
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import UsernameInput from './UsernameInput.vue'
import { 
  getCurrentUserUsername, 
  updateUserUsername, 
  registerUserUsername 
} from '../services/authService'
import { UsernameService } from '../services/usernameService'

export default {
  name: 'UsernameInputLocked',
  components: {
    UsernameInput
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    baseName: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'validation-change', 'username-updated'],
  setup(props, { emit }) {
    const currentUsername = ref('')
    const localUsername = ref('')
    const isEditing = ref(false)
    const isValid = ref(false)
    const saving = ref(false)
    const loading = ref(true)
    const isChecking = ref(false)
    const validationError = ref('')
    const suggestions = ref([])
    const checkTimeout = ref(null)

    // Cargar username actual
    const loadCurrentUsername = async () => {
      try {
        loading.value = true
        const username = await getCurrentUserUsername()
        currentUsername.value = username || ''
        
        // Si no hay username, entrar en modo edición automáticamente
        if (!username) {
          isEditing.value = true
        }
        
        emit('update:modelValue', currentUsername.value)
        emit('validation-change', !!currentUsername.value)
      } catch (error) {
        console.error('Error cargando username:', error)
      } finally {
        loading.value = false
      }
    }

    // Iniciar edición
    const startEditing = () => {
      localUsername.value = currentUsername.value
      isEditing.value = true
    }

    // Cancelar edición
    const cancelEditing = () => {
      localUsername.value = ''
      isValid.value = false
      
      // Si no hay username actual, no permitir cancelar
      if (!currentUsername.value) {
        return
      }
      
      isEditing.value = false
    }

    // Manejar cambios de validación
    const onValidationChange = (valid) => {
      isValid.value = valid
      emit('validation-change', valid && !!localUsername.value)
    }

    // Guardar username
    const saveUsername = async () => {
      try {
        saving.value = true

        if (currentUsername.value && localUsername.value !== currentUsername.value) {
          // Actualizar username existente
          await updateUserUsername(currentUsername.value, localUsername.value)
        } else if (!currentUsername.value && localUsername.value) {
          // Crear nuevo username
          await registerUserUsername(localUsername.value)
        }

        // Actualizar estado local
        currentUsername.value = localUsername.value
        isEditing.value = false
        
        // Emitir eventos
        emit('update:modelValue', currentUsername.value)
        emit('validation-change', true)
        emit('username-updated', currentUsername.value)

      } catch (error) {
        console.error('Error guardando username:', error)
        throw error // Re-lanzar para que el componente padre lo maneje
      } finally {
        saving.value = false
      }
    }

    // Watch para cambios en el prop
    watch(() => props.modelValue, (newValue) => {
      if (newValue !== currentUsername.value) {
        currentUsername.value = newValue
      }
    })

    // Función para validar formato
    const validateFormat = (username) => {
      if (!username) {
        return { valid: true, error: '' }
      }

      if (username.length < 3) {
        return { valid: false, error: 'Mínimo 3 caracteres' }
      }

      if (username.length > 20) {
        return { valid: false, error: 'Máximo 20 caracteres' }
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { valid: false, error: 'Solo letras, números y guiones bajos' }
      }

      return { valid: true, error: '' }
    }

    // Función para verificar disponibilidad
    const checkAvailability = async (username) => {
      if (!username) return

      isChecking.value = true
      validationError.value = ''
      isValid.value = false

      try {
        // Validar formato primero
        const formatValidation = validateFormat(username)
        if (!formatValidation.valid) {
          validationError.value = formatValidation.error
          return
        }

        // Verificar disponibilidad
        const isAvailable = await UsernameService.isUsernameAvailable(username)
        if (!isAvailable) {
          validationError.value = 'Username no disponible'
          // Generar sugerencias si no está disponible
          if (props.baseName) {
            suggestions.value = await UsernameService.generateUsernameSuggestions(props.baseName)
          }
        } else {
          isValid.value = true
          suggestions.value = []
        }
      } catch (error) {
        console.error('Error verificando username:', error)
        validationError.value = 'Error al verificar disponibilidad'
      } finally {
        isChecking.value = false
      }
    }

    // Manejar input con debounce
    const handleInput = () => {
      // Limpiar timeout anterior
      if (checkTimeout.value) {
        clearTimeout(checkTimeout.value)
      }

      // Resetear estados
      isValid.value = false
      validationError.value = ''
      suggestions.value = []

      // Si está vacío, no validar
      if (!localUsername.value.trim()) {
        emit('validation-change', false)
        return
      }

      // Validar formato inmediatamente
      const formatValidation = validateFormat(localUsername.value)
      if (!formatValidation.valid) {
        validationError.value = formatValidation.error
        emit('validation-change', false)
        return
      }

      // Verificar disponibilidad con debounce
      checkTimeout.value = setTimeout(() => {
        checkAvailability(localUsername.value)
      }, 500)
    }

    // Manejar blur
    const handleBlur = () => {
      if (localUsername.value && !isChecking.value && !validationError.value && !isValid.value) {
        checkAvailability(localUsername.value)
      }
    }

    // Seleccionar sugerencia
    const selectSuggestion = (suggestion) => {
      localUsername.value = suggestion
      suggestions.value = []
      checkAvailability(suggestion)
    }

    // Watch para emitir cambios de validación
    watch(isValid, (newValue) => {
      emit('validation-change', newValue && !!localUsername.value)
    })

    onMounted(() => {
      loadCurrentUsername()
    })

    return {
      currentUsername,
      localUsername,
      isEditing,
      isValid,
      saving,
      loading,
      isChecking,
      validationError,
      suggestions,
      startEditing,
      cancelEditing,
      onValidationChange,
      saveUsername,
      handleInput,
      handleBlur,
      selectSuggestion
    }
  }
}
</script>