<template>
  <v-card class="ma-4" v-if="showDebug">
    <v-card-title class="bg-orange-100">
      <v-icon color="warning" class="mr-2">mdi-alert-circle</v-icon>
      Debug: Estado de Firebase
    </v-card-title>
    <v-card-text>
      <div class="space-y-3">
        <div class="flex items-center space-x-2">
          <v-icon :color="connectionStatus.color">{{ connectionStatus.icon }}</v-icon>
          <span>Conexión a Firestore: {{ connectionStatus.text }}</span>
        </div>
        
        <div class="flex items-center space-x-2">
          <v-icon :color="rulesStatus.color">{{ rulesStatus.icon }}</v-icon>
          <span>Reglas de Username: {{ rulesStatus.text }}</span>
        </div>
        
        <div v-if="!rulesDeployed" class="mt-4 p-3 bg-yellow-50 rounded-lg">
          <h4 class="font-semibold text-yellow-800 mb-2">Acción Requerida:</h4>
          <p class="text-sm text-yellow-700 mb-3">
            Las reglas de Firestore necesitan ser desplegadas para que funcionen los usernames.
          </p>
          <v-btn 
            color="warning" 
            size="small" 
            @click="showInstructions = !showInstructions"
            :prepend-icon="showInstructions ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          >
            {{ showInstructions ? 'Ocultar' : 'Ver' }} Instrucciones
          </v-btn>
        </div>
        
        <div v-if="showInstructions" class="mt-3 p-3 bg-blue-50 rounded-lg">
          <h5 class="font-semibold text-blue-800 mb-2">Cómo desplegar las reglas:</h5>
          <ol class="text-sm text-blue-700 space-y-1 ml-4">
            <li>1. Ve a <a href="https://console.firebase.google.com" target="_blank" class="underline">Firebase Console</a></li>
            <li>2. Selecciona tu proyecto</li>
            <li>3. Ve a Firestore Database → Reglas</li>
            <li>4. Copia el contenido de <code>frontend/firestore.rules</code></li>
            <li>5. Pégalo y haz clic en "Publicar"</li>
          </ol>
        </div>
        
        <div class="mt-4">
          <v-btn 
            @click="testConnection" 
            :loading="testing" 
            size="small" 
            prepend-icon="mdi-refresh"
          >
            Probar Conexión
          </v-btn>
          
          <v-btn 
            @click="testUsernameRules" 
            :loading="testingRules" 
            size="small" 
            class="ml-2"
            prepend-icon="mdi-shield-check"
          >
            Probar Reglas
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { db } from '../services/firebaseConfig'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { useUserStore } from '../store/userStore'

export default {
  name: 'FirebaseDebug',
  setup() {
    const userStore = useUserStore()
    const connected = ref(false)
    const rulesDeployed = ref(false)
    const testing = ref(false)
    const testingRules = ref(false)
    const showInstructions = ref(false)
    
    // Solo mostrar en desarrollo o si hay problemas
    const showDebug = computed(() => {
      return process.env.NODE_ENV === 'development' || !rulesDeployed.value
    })

    const connectionStatus = computed(() => {
      if (connected.value) {
        return { color: 'success', icon: 'mdi-check-circle', text: 'Conectado' }
      }
      return { color: 'error', icon: 'mdi-close-circle', text: 'Desconectado' }
    })

    const rulesStatus = computed(() => {
      if (rulesDeployed.value) {
        return { color: 'success', icon: 'mdi-check-circle', text: 'Desplegadas' }
      }
      return { color: 'warning', icon: 'mdi-alert-circle', text: 'Pendientes' }
    })

    const testConnection = async () => {
      testing.value = true
      try {
        // Intentar leer un documento simple
        await getDoc(doc(db, 'test', 'connection'))
        connected.value = true
        console.log('✅ Conexión a Firestore exitosa')
      } catch (error) {
        connected.value = false
        console.error('❌ Error de conexión:', error)
      } finally {
        testing.value = false
      }
    }

    const testUsernameRules = async () => {
      if (!userStore.user) {
        console.warn('Usuario no autenticado para probar reglas')
        return
      }

      testingRules.value = true
      try {
        const testUsername = `test_${Date.now()}`
        
        // Intentar leer la colección usernames
        await getDoc(doc(db, 'usernames', testUsername))
        
        // Si llegamos aquí, las reglas de lectura funcionan
        rulesDeployed.value = true
        console.log('✅ Reglas de username funcionando')
        
      } catch (error) {
        if (error.code === 'permission-denied') {
          rulesDeployed.value = false
          console.warn('⚠️ Reglas de username no desplegadas')
        } else {
          // Otros errores no relacionados con reglas
          rulesDeployed.value = true
          console.log('✅ Reglas OK, error diferente:', error.message)
        }
      } finally {
        testingRules.value = false
      }
    }

    onMounted(async () => {
      await testConnection()
      if (connected.value) {
        await testUsernameRules()
      }
    })

    return {
      showDebug,
      connected,
      rulesDeployed,
      testing,
      testingRules,
      showInstructions,
      connectionStatus,
      rulesStatus,
      testConnection,
      testUsernameRules
    }
  }
}
</script>