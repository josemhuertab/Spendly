<template>
  <div class="user-display" :class="{ 'user-display--loading': loading }">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center space-x-2">
      <v-skeleton-loader type="avatar" width="24" height="24"></v-skeleton-loader>
      <v-skeleton-loader type="text" width="80"></v-skeleton-loader>
    </div>
    
    <!-- User found -->
    <div v-else-if="userInfo" class="flex items-center space-x-2">
      <v-avatar 
        :size="avatarSize" 
        :image="userInfo.photoURL"
        :color="userInfo.photoURL ? undefined : 'primary'"
      >
        <span v-if="!userInfo.photoURL" class="text-white text-sm">
          {{ getInitials(userInfo.displayName) }}
        </span>
      </v-avatar>
      
      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-1">
          <span 
            v-if="showDisplayName && userInfo.displayName" 
            class="font-medium text-gray-900 dark:text-white truncate"
            :class="displayNameClass"
          >
            {{ userInfo.displayName }}
          </span>
          
          <span 
            v-if="showUsername && userInfo.username" 
            class="text-gray-600 dark:text-gray-400 truncate"
            :class="usernameClass"
          >
            @{{ userInfo.username }}
          </span>
        </div>
        
        <div v-if="showUid && showDebugInfo" class="text-xs text-gray-400 truncate">
          {{ userInfo.uid }}
        </div>
      </div>
      
      <!-- Actions slot -->
      <div v-if="$slots.actions" class="flex-shrink-0">
        <slot name="actions" :user="userInfo"></slot>
      </div>
    </div>
    
    <!-- User not found or error -->
    <div v-else class="flex items-center space-x-2">
      <v-avatar :size="avatarSize" color="grey-lighten-2">
        <v-icon color="grey-darken-1">mdi-account-question</v-icon>
      </v-avatar>
      
      <div class="flex-1">
        <span class="text-gray-500 dark:text-gray-400">
          {{ fallbackText }}
        </span>
        
        <div v-if="showUid && showDebugInfo" class="text-xs text-gray-400 truncate">
          {{ uid }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { UserUtils } from '../utils/userUtils'

export default {
  name: 'UserDisplay',
  props: {
    // UID del usuario a mostrar
    uid: {
      type: String,
      required: true
    },
    // Username del usuario (opcional, para evitar búsquedas innecesarias)
    username: {
      type: String,
      default: null
    },
    // Mostrar nombre de usuario
    showDisplayName: {
      type: Boolean,
      default: true
    },
    // Mostrar username
    showUsername: {
      type: Boolean,
      default: true
    },
    // Mostrar UID (solo para debug)
    showUid: {
      type: Boolean,
      default: false
    },
    // Tamaño del avatar
    avatarSize: {
      type: [String, Number],
      default: 32
    },
    // Texto de fallback cuando no se encuentra el usuario
    fallbackText: {
      type: String,
      default: 'Usuario no encontrado'
    },
    // Clases CSS adicionales para el nombre
    displayNameClass: {
      type: String,
      default: ''
    },
    // Clases CSS adicionales para el username
    usernameClass: {
      type: String,
      default: ''
    },
    // Mostrar información de debug
    showDebugInfo: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const userInfo = ref(null)
    const loading = ref(false)

    // Función para obtener iniciales del nombre
    const getInitials = (name) => {
      if (!name) return '?'
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    // Cargar información del usuario
    const loadUserInfo = async () => {
      if (!props.uid) {
        userInfo.value = null
        return
      }

      loading.value = true
      try {
        const info = await UserUtils.getPublicUserInfo(props.uid)
        userInfo.value = info
      } catch (error) {
        console.error('Error cargando información del usuario:', error)
        userInfo.value = null
      } finally {
        loading.value = false
      }
    }

    // Watch para cambios en el UID
    watch(() => props.uid, loadUserInfo, { immediate: true })

    // Si se proporciona username, usarlo directamente
    watch(() => props.username, (newUsername) => {
      if (newUsername && userInfo.value) {
        userInfo.value.username = newUsername
      }
    }, { immediate: true })

    onMounted(() => {
      loadUserInfo()
    })

    return {
      userInfo,
      loading,
      getInitials
    }
  }
}
</script>

<style scoped>
.user-display {
  @apply flex items-center;
}

.user-display--loading {
  @apply opacity-75;
}
</style>