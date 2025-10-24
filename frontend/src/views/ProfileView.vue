<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/userStore'
import { auth } from '../services/firebaseConfig'
import {
  updateUserDisplayName,
  changeUserEmail,
  updateUserPassword,
  uploadUserProfilePhoto,
  sendVerification,
  deleteAccount,
  logoutUser
} from '../services/authService'

const router = useRouter()
const userStore = useUserStore()

const nameInput = ref(userStore.displayName || '')
const emailInput = ref(userStore.userEmail || '')
const emailCurrentPassword = ref('')
const passCurrent = ref('')
const passNew = ref('')
const passConfirm = ref('')
const selectedFile = ref(null)
const previewUrl = ref(userStore.user?.photoURL || '')

const loadingName = ref(false)
const loadingEmail = ref(false)
const loadingPassword = ref(false)
const uploadingPhoto = ref(false)

const error = ref('')
const success = ref('')

const emailVerified = computed(() => userStore.user?.emailVerified)

function clearMessages() { error.value = ''; success.value = '' }

async function saveName() {
  clearMessages()
  loadingName.value = true
  try {
    await updateUserDisplayName(nameInput.value.trim())
    userStore.setUser(auth.currentUser)
    success.value = 'Nombre actualizado'
  } catch (e) {
    console.error(e)
    error.value = e?.message || 'Error al actualizar nombre'
  } finally { loadingName.value = false }
}

async function saveEmail() {
  clearMessages()
  loadingEmail.value = true
  try {
    await changeUserEmail(emailInput.value.trim(), emailCurrentPassword.value)
    userStore.setUser(auth.currentUser)
    success.value = 'Correo actualizado. Te enviamos un email de verificación.'
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

async function confirmDeleteAccount() {
  if (!confirm('¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) return
  try {
    await deleteAccount(passCurrent.value)
    userStore.clearUser()
    router.push('/register')
  } catch (e) {
    console.error(e)
    error.value = e?.message || 'Error al eliminar la cuenta'
  }
}
</script>

<template>
  <v-container class="py-8">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Perfil de Usuario</h1>
      <p class="text-gray-600">Gestiona tu información personal y seguridad de la cuenta</p>
    </div>

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

      <!-- Nombre -->
      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4">Nombre</v-card-title>
        <v-card-text class="px-6 py-4">
          <v-text-field v-model="nameInput" label="Nombre para mostrar" variant="outlined" density="comfortable" prepend-inner-icon="mdi-account" />
          <div class="mt-2">
            <v-btn color="primary" :loading="loadingName" @click="saveName" prepend-icon="mdi-content-save">Guardar</v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Correo -->
      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4">Correo electrónico</v-card-title>
        <v-card-text class="px-6 py-4">
          <div class="flex items-center justify-between mb-2">
            <div class="text-sm text-gray-600">Estado: <span :class="emailVerified ? 'text-green-600' : 'text-orange-600'">{{ emailVerified ? 'Verificado' : 'No verificado' }}</span></div>
            <v-btn v-if="!emailVerified" variant="text" size="small" @click="sendVerificationEmail">Enviar verificación</v-btn>
          </div>
          <v-text-field v-model="emailInput" label="Nuevo correo" type="email" variant="outlined" density="comfortable" prepend-inner-icon="mdi-email" />
          <v-text-field v-model="emailCurrentPassword" label="Contraseña actual (requerida para cambiar correo)" type="password" variant="outlined" density="comfortable" prepend-inner-icon="mdi-lock" />
          <div class="mt-2">
            <v-btn color="primary" :loading="loadingEmail" @click="saveEmail" prepend-icon="mdi-content-save">Guardar</v-btn>
          </div>
          <div class="text-xs text-gray-500 mt-2">Por seguridad, algunas operaciones requieren autenticación reciente.</div>
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

    <!-- Opciones de cuenta -->
    <div class="mt-6">
      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4">Opciones de cuenta</v-card-title>
        <v-card-text class="px-6 py-4">
          <div class="flex gap-3">
            <v-btn variant="outlined" prepend-icon="mdi-logout" @click="signOut">Cerrar sesión</v-btn>
            <v-btn variant="outlined" color="error" prepend-icon="mdi-account-remove" @click="confirmDeleteAccount">Eliminar cuenta</v-btn>
          </div>
          <div class="text-xs text-gray-500 mt-2">Eliminar la cuenta requiere autenticación reciente.</div>
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
  </v-container>
</template>