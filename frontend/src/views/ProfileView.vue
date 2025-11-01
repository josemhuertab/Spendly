<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/userStore'
import { auth } from '../services/firebaseConfig'
import {
  changeUserEmail,
  updateUserPassword,
  uploadUserProfilePhoto,
  sendVerification,
  deleteAccount,
  logoutUser
} from '../services/authService'
import DeleteAccountDialog from '../components/DeleteAccountDialog.vue'
import UserProfileManager from '../components/UserProfileManager.vue'

const router = useRouter()
const userStore = useUserStore()

const emailInput = ref(userStore.userEmail || '')
const emailCurrentPassword = ref('')
const passCurrent = ref('')
const passNew = ref('')
const passConfirm = ref('')
const selectedFile = ref(null)
const previewUrl = ref(userStore.user?.photoURL || '')

const loadingEmail = ref(false)
const loadingPassword = ref(false)
const uploadingPhoto = ref(false)

const error = ref('')
const success = ref('')
const showDeleteDialog = ref(false)

const emailVerified = computed(() => userStore.user?.emailVerified)

function clearMessages() { error.value = ''; success.value = '' }

async function saveEmail() {
  clearMessages()
  if (!emailCurrentPassword.value.trim()) {
    error.value = 'Debes ingresar tu contraseña actual para cambiar el correo'
    return
  }
  
  loadingEmail.value = true
  try {
    await changeUserEmail(emailInput.value.trim(), emailCurrentPassword.value)
    userStore.setUser(auth.currentUser)
    success.value = 'Correo actualizado correctamente. Te enviamos un email de verificación al nuevo correo.'
    emailCurrentPassword.value = '' // Limpiar contraseña por seguridad
  } catch (e) {
    console.error(e)
    error.value = e?.message || 'Error al actualizar correo'
  } finally { loadingEmail.value = false }
}

async function sendVerificationEmail() {
  clearMessages()
  try {
    await sendVerification()
    success.value = 'Correo de verificación enviado'
  } catch (e) {
    console.error(e)
    error.value = e?.message || 'Error al enviar verificación'
  }
}

function passwordStrength(p) {
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[a-z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
}
const passStrength = computed(() => passwordStrength(passNew.value))
function strengthText() { return passStrength.value <= 2 ? 'Débil' : passStrength.value <= 3 ? 'Media' : 'Fuerte' }
function strengthColor() { return passStrength.value <= 2 ? 'error' : passStrength.value <= 3 ? 'warning' : 'success' }

async function savePassword() {
  clearMessages()
  if (passNew.value !== passConfirm.value) { error.value = 'Las contraseñas no coinciden'; return }
  if (passStrength.value < 3) { error.value = 'La contraseña debe ser más fuerte'; return }
  loadingPassword.value = true
  try {
    await updateUserPassword(passCurrent.value, passNew.value)
    success.value = 'Contraseña actualizada'
    passCurrent.value = ''
    passNew.value = ''
    passConfirm.value = ''
  } catch (e) {
    console.error(e)
    error.value = e?.message || 'Error al actualizar contraseña'
  } finally { loadingPassword.value = false }
}

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const fileInputRef = ref(null)
function selectPhoto() { fileInputRef.value?.click() }
function onFileChange(e) {
  const file = e?.target?.files?.[0]
  if (!file) { selectedFile.value = null; return }
  if (!ALLOWED_TYPES.includes(file.type)) { error.value = 'Formato no permitido. Usa JPG, PNG, WEBP o SVG'; selectedFile.value = null; return }
  if (file.size > MAX_SIZE) { error.value = 'La imagen supera 5 MB'; selectedFile.value = null; return }
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

async function uploadPhoto() {
  clearMessages()
  if (!selectedFile.value) { error.value = 'Selecciona una imagen'; return }
  uploadingPhoto.value = true
  try {
    const url = await uploadUserProfilePhoto(selectedFile.value)
    userStore.setUser(auth.currentUser)
    previewUrl.value = url
    success.value = 'Foto de perfil actualizada'
  } catch (e) {
    console.error(e)
    error.value = e?.message || 'Error al subir la foto'
  } finally { uploadingPhoto.value = false }
}

async function signOut() {
  await logoutUser()
  userStore.clearUser()
  router.push('/login')
}

function openDeleteDialog() {
  showDeleteDialog.value = true
}

async function handleDeleteAccount(password) {
  try {
    await deleteAccount(password)
    userStore.clearUser()
    success.value = 'Cuenta eliminada correctamente'
    setTimeout(() => {
      router.push('/register')
    }, 2000)
  } catch (e) {
    console.error(e)
    error.value = e?.message || 'Error al eliminar la cuenta'
    throw e // Re-throw para que el modal maneje el loading
  }
}
</script>

<template>
  <v-container class="py-8">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Perfil de Usuario</h1>
      <p class="text-gray-600">Gestiona tu información personal y seguridad de la cuenta</p>
    </div>

    <!-- Información Personal -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Información Personal</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Foto de perfil -->
        <v-card class="rounded-xl border-0 shadow-md">
           <v-card-title class="px-6 py-4">Foto de perfil</v-card-title>
           <v-card-text class="px-6 py-4">
             <div class="flex items-center gap-6">
               <img :src="(userStore.user?.photoURL) || 'https://via.placeholder.com/96'" alt="Avatar" class="w-24 h-24 rounded-full object-cover border" />
               <div class="flex-1 text-sm text-gray-700">
                  Subir/actualizar foto: Próximamente.
                </div>
             </div>
           </v-card-text>
         </v-card>

        <!-- Configuración de Usuario Unificada -->
        <v-card class="rounded-xl border-0 shadow-md">
          <v-card-title class="px-6 py-4">
            <div class="flex items-center space-x-2">
              <v-icon color="primary">mdi-account-cog</v-icon>
              <span>Configuración de Usuario</span>
            </div>
          </v-card-title>
          <v-card-text class="px-6 py-4">
            <UserProfileManager />
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Seguridad de la Cuenta -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Seguridad de la Cuenta</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Correo -->
      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4">Correo electrónico</v-card-title>
        <v-card-text class="px-6 py-4">
          <div class="flex items-center justify-between mb-4 p-3 rounded-lg" :class="emailVerified ? 'bg-green-50' : 'bg-orange-50'">
            <div class="flex items-center gap-2">
              <v-icon :color="emailVerified ? 'success' : 'warning'" size="20">
                {{ emailVerified ? 'mdi-check-circle' : 'mdi-alert-circle' }}
              </v-icon>
              <span class="text-sm font-medium">
                Estado: <span :class="emailVerified ? 'text-green-700' : 'text-orange-700'">
                  {{ emailVerified ? 'Verificado' : 'No verificado' }}
                </span>
              </span>
            </div>
            <v-btn 
              v-if="!emailVerified" 
              variant="outlined" 
              size="small" 
              color="warning"
              prepend-icon="mdi-email-send"
              @click="sendVerificationEmail"
            >
              Reenviar verificación
            </v-btn>
          </div>
          
          <div class="mb-3">
            <label class="text-sm font-medium text-gray-700 mb-2 block">Correo actual</label>
            <div class="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              {{ userStore.userEmail }}
            </div>
          </div>
          
          <v-text-field 
            v-model="emailInput" 
            label="Nuevo correo electrónico" 
            type="email" 
            variant="outlined" 
            density="comfortable" 
            prepend-inner-icon="mdi-email" 
            class="mb-4"
          />
          
          <v-text-field 
            v-model="emailCurrentPassword" 
            label="Contraseña actual (requerida)" 
            type="password" 
            variant="outlined" 
            density="comfortable" 
            prepend-inner-icon="mdi-lock" 
            class="mb-4"
            :rules="[v => !!v || 'La contraseña es requerida para cambiar el correo']"
          />
          
          <div class="mt-4">
            <v-btn 
              color="primary" 
              :loading="loadingEmail" 
              @click="saveEmail" 
              prepend-icon="mdi-content-save"
              :disabled="!emailInput.trim() || !emailCurrentPassword.trim() || emailInput === userStore.userEmail"
              size="large"
            >
              Actualizar Correo
            </v-btn>
          </div>
          
          <v-alert 
            v-if="!emailVerified" 
            type="info" 
            variant="tonal" 
            class="mt-4 text-sm"
          >
            <v-icon start>mdi-information</v-icon>
            Después de cambiar tu correo, recibirás un email de verificación. 
            Algunas funciones pueden estar limitadas hasta que verifiques tu nuevo correo.
          </v-alert>
        </v-card-text>
      </v-card>

      <!-- Contraseña -->
      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4">Actualizar contraseña</v-card-title>
        <v-card-text class="px-6 py-4">
          <v-text-field v-model="passCurrent" label="Contraseña actual" type="password" variant="outlined" density="comfortable" prepend-inner-icon="mdi-lock" />
          <v-text-field v-model="passNew" label="Nueva contraseña" type="password" variant="outlined" density="comfortable" prepend-inner-icon="mdi-lock-check" @input="() => {}" />
          <div v-if="passNew" class="mb-3">
            <v-progress-linear :model-value="passStrength * 20" :color="strengthColor()" height="8" rounded />
            <div class="text-xs text-gray-600 mt-1">Fortaleza: {{ strengthText() }}</div>
          </div>
          <v-text-field v-model="passConfirm" label="Confirmar contraseña" type="password" variant="outlined" density="comfortable" prepend-inner-icon="mdi-lock" />
          <div class="mt-2">
            <v-btn color="primary" :loading="loadingPassword" @click="savePassword" prepend-icon="mdi-lock-reset">Actualizar</v-btn>
          </div>
        </v-card-text>
      </v-card>
      </div>
    </div>

    <!-- Opciones de cuenta -->
    <div class="mt-6">
      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4">Opciones de cuenta</v-card-title>
        <v-card-text class="px-6 py-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <v-btn 
              variant="outlined" 
              prepend-icon="mdi-logout" 
              @click="signOut"
              size="large"
              class="w-full"
            >
              Cerrar Sesión
            </v-btn>
            
            <v-btn 
              variant="outlined" 
              color="error" 
              prepend-icon="mdi-delete-forever" 
              @click="openDeleteDialog"
              size="large"
              class="w-full"
            >
              Eliminar Cuenta
            </v-btn>
          </div>
          
          <v-alert 
            type="warning" 
            variant="tonal" 
            class="mt-4 text-sm"
          >
            <v-icon start>mdi-shield-lock</v-icon>
            Por tu seguridad, eliminar la cuenta requiere confirmar tu contraseña actual.
          </v-alert>
        </v-card-text>
      </v-card>
    </div>

    <!-- Mensajes -->
    <v-snackbar :model-value="!!error" color="error" timeout="5000" location="top">
      {{ error }}
      <template #actions>
        <v-btn variant="text" @click="error=''">Cerrar</v-btn>
      </template>
    </v-snackbar>
    <v-snackbar :model-value="!!success" color="success" timeout="4000" location="top">
      {{ success }}
      <template #actions>
        <v-btn variant="text" @click="success=''">Ok</v-btn>
      </template>
    </v-snackbar>

    <!-- Delete Account Dialog -->
    <DeleteAccountDialog 
      v-model="showDeleteDialog" 
      @confirm="handleDeleteAccount"
    />
  </v-container>
</template>