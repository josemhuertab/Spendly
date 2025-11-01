<template>
  <div class="username-manager">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Nombre de usuario
      </h3>
      <v-btn
        v-if="!isEditing && currentUsername"
        @click="startEditing"
        variant="outlined"
        size="small"
        prepend-icon="mdi-pencil"
      >
        Editar
      </v-btn>
    </div>

    <!-- Mostrar username actual -->
    <div v-if="!isEditing" class="space-y-3">
      <div v-if="currentUsername" class="flex items-center space-x-3">
        <div class="flex-1">
          <p class="text-sm text-gray-600 dark:text-gray-400">Tu nombre de usuario actual:</p>
          <p class="text-lg font-medium text-gray-900 dark:text-white">
            @{{ currentUsername }}
          </p>
        </div>
        <div class="flex items-center space-x-2">
          <v-chip color="success" size="small" variant="outlined">
            <v-icon start>mdi-check-circle</v-icon>
            Activo
          </v-chip>
        </div>
      </div>
      
      <div v-else class="text-center py-6">
        <v-icon size="48" color="grey-lighten-1" class="mb-3">mdi-account-question</v-icon>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          No tienes un nombre de usuario configurado
        </p>
        <v-btn
          @click="startEditing"
          color="primary"
          prepend-icon="mdi-plus"
        >
          Crear nombre de usuario
        </v-btn>
      </div>
    </div>

    <!-- Formulario de edición -->
    <div v-else class="space-y-4">
      <UsernameInput
        v-model="newUsername"
        :base-name="baseName"
        @validation-change="onValidationChange"
      />
      
      <div class="flex space-x-3">
        <v-btn
          @click="saveUsername"
          :loading="saving"
          :disabled="!isValid || (!newUsername && !currentUsername)"
          color="primary"
          prepend-icon="mdi-content-save"
        >
          {{ currentUsername ? 'Actualizar' : 'Crear' }}
        </v-btn>
        
        <v-btn
          @click="cancelEditing"
          variant="outlined"
          prepend-icon="mdi-close"
        >
          Cancelar
        </v-btn>
        
        <v-btn
          v-if="currentUsername"
          @click="confirmDelete"
          color="error"
          variant="outlined"
          prepend-icon="mdi-delete"
        >
          Eliminar
        </v-btn>
      </div>
    </div>

    <!-- Dialog de confirmación para eliminar -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          ¿Eliminar nombre de usuario?
        </v-card-title>
        <v-card-text>
          ¿Estás seguro de que quieres eliminar tu nombre de usuario <strong>@{{ currentUsername }}</strong>?
          Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDeleteDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            @click="deleteUsername"
            :loading="deleting"
            color="error"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../store/userStore'
import UsernameInput from './UsernameInput.vue'
import { 
  getCurrentUserUsername, 
  updateUserUsername, 
  registerUserUsername 
} from '../services/authService'
import { UsernameService } from '../services/usernameService'

export default {
  name: 'UsernameManager',
  components: {
    UsernameInput
  },
  setup() {
    const userStore = useUserStore()
    const currentUsername = ref('')
    const newUsername = ref('')
    const isEditing = ref(false)
    const isValid = ref(false)
    const saving = ref(false)
    const deleting = ref(false)
    const loading = ref(true)
    const showDeleteDialog = ref(false)
    const showSnackbar = ref(false)
    const snackbarMessage = ref('')
    const snackbarColor = ref('success')

    // Computed para el nombre base
    const baseName = computed(() => {
      const displayName = userStore.user?.displayName || ''
      return displayName.split(' ')[0] || 'user'
    })

    // Cargar username actual
    const loadCurrentUsername = async () => {
      try {
        loading.value = true
        const username = await getCurrentUserUsername()
        currentUsername.value = username || ''
      } catch (error) {
        console.error('Error cargando username:', error)
        showMessage('Error al cargar el nombre de usuario', 'error')
      } finally {
        loading.value = false
      }
    }

    // Iniciar edición
    const startEditing = () => {
      newUsername.value = currentUsername.value
      isEditing.value = true
    }

    // Cancelar edición
    const cancelEditing = () => {
      newUsername.value = ''
      isValid.value = false
      isEditing.value = false
    }

    // Manejar cambios de validación
    const onValidationChange = (valid) => {
      isValid.value = valid
    }

    // Guardar username
    const saveUsername = async () => {
      try {
        saving.value = true

        if (currentUsername.value) {
          // Actualizar username existente
          if (newUsername.value && newUsername.value !== currentUsername.value) {
            await updateUserUsername(currentUsername.value, newUsername.value)
            currentUsername.value = newUsername.value
            showMessage('Nombre de usuario actualizado correctamente', 'success')
          } else if (!newUsername.value) {
            // Eliminar username
            await UsernameService.deleteUsername(currentUsername.value)
            currentUsername.value = ''
            showMessage('Nombre de usuario eliminado', 'info')
          }
        } else {
          // Crear nuevo username
          if (newUsername.value) {
            await registerUserUsername(newUsername.value)
            currentUsername.value = newUsername.value
            showMessage('Nombre de usuario creado correctamente', 'success')
          }
        }

        isEditing.value = false
        newUsername.value = ''
      } catch (error) {
        console.error('Error guardando username:', error)
        showMessage(error.message || 'Error al guardar el nombre de usuario', 'error')
      } finally {
        saving.value = false
      }
    }

    // Confirmar eliminación
    const confirmDelete = () => {
      showDeleteDialog.value = true
    }

    // Eliminar username
    const deleteUsername = async () => {
      try {
        deleting.value = true
        await UsernameService.deleteUsername(currentUsername.value)
        currentUsername.value = ''
        showDeleteDialog.value = false
        isEditing.value = false
        showMessage('Nombre de usuario eliminado correctamente', 'info')
      } catch (error) {
        console.error('Error eliminando username:', error)
        showMessage(error.message || 'Error al eliminar el nombre de usuario', 'error')
      } finally {
        deleting.value = false
      }
    }

    // Mostrar mensaje
    const showMessage = (message, color = 'success') => {
      snackbarMessage.value = message
      snackbarColor.value = color
      showSnackbar.value = true
    }

    // Cargar datos al montar
    onMounted(() => {
      loadCurrentUsername()
    })

    return {
      currentUsername,
      newUsername,
      isEditing,
      isValid,
      saving,
      deleting,
      loading,
      showDeleteDialog,
      showSnackbar,
      snackbarMessage,
      snackbarColor,
      baseName,
      startEditing,
      cancelEditing,
      onValidationChange,
      saveUsername,
      confirmDelete,
      deleteUsername
    }
  }
}
</script>

<style scoped>
.username-manager {
  max-width: 600px;
}
</style>