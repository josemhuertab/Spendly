<template>
  <div class="space-y-2">
    <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      Nombre de usuario *
    </label>
    <div class="relative">
      <input
        id="username"
        v-model="localUsername"
        type="text"
        placeholder="ej: juan_perez"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
      Requerido: 3-20 caracteres, solo letras, números y guiones bajos
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
</template>

<script>
import { ref, watch, computed } from 'vue'
import { UsernameService } from '../services/usernameService'

export default {
  name: 'UsernameInput',
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
  emits: ['update:modelValue', 'validation-change'],
  setup(props, { emit }) {
    const localUsername = ref(props.modelValue)
    const isChecking = ref(false)
    const validationError = ref('')
    const isValid = ref(false)
    const suggestions = ref([])
    const checkTimeout = ref(null)

    // Computed para determinar si el username es válido
    const isUsernameValid = computed(() => {
      return isValid.value && !validationError.value && localUsername.value
    })

    // Watch para sincronizar con el prop
    watch(() => props.modelValue, (newValue) => {
      localUsername.value = newValue
    })

    // Watch para emitir cambios de validación
    watch(isUsernameValid, (newValue) => {
      emit('validation-change', newValue)
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
      emit('update:modelValue', localUsername.value)
      
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
        return
      }

      // Validar formato inmediatamente
      const formatValidation = validateFormat(localUsername.value)
      if (!formatValidation.valid) {
        validationError.value = formatValidation.error
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
      emit('update:modelValue', suggestion)
      suggestions.value = []
      checkAvailability(suggestion)
    }

    // Generar sugerencias iniciales si se proporciona baseName
    watch(() => props.baseName, async (newBaseName) => {
      if (newBaseName && !localUsername.value) {
        try {
          suggestions.value = await UsernameService.generateUsernameSuggestions(newBaseName)
        } catch (error) {
          console.error('Error generando sugerencias:', error)
        }
      }
    }, { immediate: true })

    return {
      localUsername,
      isChecking,
      validationError,
      isValid,
      suggestions,
      handleInput,
      handleBlur,
      selectSuggestion
    }
  }
}
</script>