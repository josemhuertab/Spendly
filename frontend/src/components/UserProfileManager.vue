<template>
  <div class="user-profile-manager">
    <!-- Nombre para mostrar -->
    <div class="mb-6">
      <label class="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Nombre para mostrar
      </label>
      <v-text-field 
        v-model="displayName" 
        label="Nombre completo" 
        variant="outlined" 
        density="comfortable" 
        prepend-inner-icon="mdi-account"
        placeholder="Ej: José Huerta"
        :rules="[v => !!v || 'El nombre es requerido']"
      />
      
      <!-- Botones de acción para nombre (debajo del campo) -->
      <div class="flex flex-wrap gap-3 mt-3">
        <v-btn
          @click="saveDisplayName"
          :loading="saving"
          :disabled="!hasDisplayNameChanges || !displayName.trim()"
          color="primary"
          prepend-icon="mdi-content-save"
          size="default"
        >
          Guardar Cambios
        </v-btn>
        
        <v-btn
          v-if="hasDisplayNameChanges"
          @click="resetDisplayName"
          variant="outlined"
          prepend-icon="mdi-refresh"
          size="default"
        >
          Descartar Cambios
        </v-btn>
      </div>
    </div>

    <!-- Username -->
    <div class="mb-6">
      <UsernameInputLocked
        v-model="username"
        :base-name="baseName"
        @validation-change="onUsernameValidationChange"
        @username-updated="onUsernameUpdated"
      />
    </div>

    <!-- Snackbar para mensajes -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="4000"
    >
      {{ snackbarMessage }}
      <template #actions>
        <v-btn @click="showSnackbar = false" icon="mdi-close"></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '../store/userStore'
import { auth } from '../services/firebaseConfig'
import UsernameInputLocked from './UsernameInputLocked.vue'
import { 
  updateUserDisplayName
} from '../services/authService'

export default {
  name: 'UserProfileManager',
  components: {
    UsernameInputLocked
  },
  setup() {
    const userStore = useUserStore()
    
    // Estados locales
    const displayName = ref('')
    const username = ref('')
    const currentDisplayName = ref('')
    const usernameValid = ref(false)
    const saving = ref(false)
    const loading = ref(true)
    const showSnackbar = ref(false)
    const snackbarMessage = ref('')
    const snackbarColor = ref('success')

    // Computed para el nombre base
    const baseName = computed(() => {
      const name = displayName.value || currentDisplayName.value || ''
      return name.split(' ')[0] || 'user'
    })

    // Computed para detectar cambios solo en el nombre
    const hasDisplayNameChanges = computed(() => {
      return displayName.value !== currentDisplayName.value
    })

    // Cargar datos actuales
    const loadCurrentData = async () => {
      try {
        loading.value = true
        
        // Cargar nombre actual
        const user = userStore.user || auth.currentUser
        currentDisplayName.value = user?.displayName || ''
        displayName.value = currentDisplayName.value

      } catch (error) {
        console.error('Error cargando datos del usuario:', error)
        showMessage('Error al cargar información del usuario', 'error')
      } finally {
        loading.value = false
      }
    }

    // Manejar cambios de validación del username
    const onUsernameValidationChange = (isValid) => {
      usernameValid.value = isValid
    }

    // Manejar actualización de username
    const onUsernameUpdated = (newUsername) => {
      username.value = newUsername
      showMessage('Username actualizado correctamente', 'success')
    }

    // Guardar solo el nombre para mostrar
    const saveDisplayName = async () => {
      try {
        saving.value = true
        
        await updateUserDisplayName(displayName.value.trim())
        userStore.setUser(auth.currentUser)
        currentDisplayName.value = displayName.value
        
        showMessage('Nombre actualizado correctamente', 'success')

      } catch (error) {
        console.error('Error guardando nombre:', error)
        showMessage(error.message || 'Error al guardar el nombre', 'error')
      } finally {
        saving.value = false
      }
    }

    // Descartar cambios del nombre
    const resetDisplayName = () => {
      displayName.value = currentDisplayName.value
    }

    // Mostrar mensaje
    const showMessage = (message, color = 'success') => {
      snackbarMessage.value = message
      snackbarColor.value = color
      showSnackbar.value = true
    }

    // Cargar datos al montar
    onMounted(() => {
      loadCurrentData()
    })

    // Watch para cambios en el usuario del store
    watch(() => userStore.user, (newUser) => {
      if (newUser && newUser.displayName !== currentDisplayName.value) {
        currentDisplayName.value = newUser.displayName || ''
        displayName.value = currentDisplayName.value
      }
    })

    return {
      displayName,
      username,
      currentDisplayName,
      usernameValid,
      saving,
      loading,
      showSnackbar,
      snackbarMessage,
      snackbarColor,
      baseName,
      hasDisplayNameChanges,
      onUsernameValidationChange,
      onUsernameUpdated,
      saveDisplayName,
      resetDisplayName
    }
  }
}
</script>

<style scoped>
.user-profile-manager {
  max-width: 600px;
}
</style>