<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
import { sendPasswordReset, resetPassword } from '../services/authService'
import LogoUrl from '../components/icons/Logo.png?url'

const router = useRouter()
const route = useRoute()

const currentStep = ref(1)
const email = ref('')
const oobCode = ref(route.query.oobCode || '') // Código de la URL si viene del email
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

const passwordStrength = ref(0)

function checkPasswordStrength(password) {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  return strength
}

function onPasswordChange() {
  passwordStrength.value = checkPasswordStrength(newPassword.value)
}

function getStrengthColor() {
  if (passwordStrength.value <= 2) return 'error'
  if (passwordStrength.value <= 3) return 'warning'
  return 'success'
}

function getStrengthText() {
  if (passwordStrength.value <= 2) return 'Débil'
  if (passwordStrength.value <= 3) return 'Media'
  return 'Fuerte'
}

if (oobCode.value) {
  currentStep.value = 3
}

async function sendResetEmail() {
  error.value = ''
  loading.value = true
  
  try {
    await sendPasswordReset(email.value)
    currentStep.value = 2
    successMessage.value = 'Si el correo existe, se enviará un código de recuperación. Revisa tu bandeja de entrada y spam.'
  } catch (e) {
    console.error('Password reset error:', e)
    error.value = e?.message || 'Error al enviar el correo de recuperación'
  } finally {
    loading.value = false
  }
}

async function resetUserPassword() {
  error.value = ''
  
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  
  if (passwordStrength.value < 3) {
    error.value = 'La contraseña debe ser más fuerte'
    return
  }
  
  loading.value = true
  
  try {
    await resetPassword(oobCode.value, newPassword.value)
    currentStep.value = 4
    successMessage.value = '¡Contraseña actualizada! Vuelve al login para iniciar sesión'
  } catch (e) {
    console.error('Password reset error:', e)
    error.value = e?.message || 'Error al restablecer la contraseña'
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  router.push('/login')
}

function goToRegister() {
  router.push('/register')
}

const stepTitle = computed(() => {
  switch (currentStep.value) {
    case 1: return 'Recuperar Contraseña'
    case 2: return 'Código Enviado'
    case 3: return 'Nueva Contraseña'
    case 4: return 'Contraseña Actualizada'
    default: return 'Recuperar Contraseña'
  }
})
</script>

<template>
  <AuthLayout>
    <template #brand>
      <div class="auth__brand">
        <img :src="LogoUrl" alt="Spendly" class="auth__logo" />
        <h1 class="auth__title gradient-text">Recupera tu Acceso</h1>
        <p class="auth__subtitle">
          No te preocupes, es normal olvidar las contraseñas. Te ayudaremos a recuperar el acceso a tu cuenta de manera segura.
        </p>
        <ul class="auth__benefits">
          <li>
            <v-icon class="benefit-icon">mdi-shield-check</v-icon>
            Proceso 100% seguro y encriptado
          </li>
          <li>
            <v-icon class="benefit-icon">mdi-email-fast</v-icon>
            Recuperación rápida por correo
          </li>
          <li>
            <v-icon class="benefit-icon">mdi-lock-reset</v-icon>
            Nueva contraseña en minutos
          </li>
        </ul>
      </div>
    </template>

    <template #form>
      <div class="auth__form">
        <h2 class="text-h5 text-white mb-6 text-center font-weight-bold">{{ stepTitle }}</h2>
        
        <!-- Paso 1: Solicitar email -->
        <div v-if="currentStep === 1">
          <v-form @submit.prevent="sendResetEmail">
            <v-text-field 
              v-model="email" 
              label="Correo electrónico" 
              type="email" 
              autocomplete="email" 
              variant="outlined" 
              density="comfortable" 
              required 
              class="mb-6"
              prepend-inner-icon="mdi-email-outline"
              :rules="[v => !!v || 'El correo es requerido', v => /.+@.+\..+/.test(v) || 'Correo inválido']"
            />

            <div 
              v-if="error" 
              class="auth__error"
            >
              <div class="d-flex align-center">
                <v-icon color="error" class="mr-3">mdi-alert-circle</v-icon>
                <div>
                  <div class="font-weight-medium">{{ error }}</div>
                </div>
              </div>
            </div>

            <div class="auth__actions">
              <v-btn 
                type="submit" 
                :loading="loading" 
                color="primary" 
                class="btn-primary text-none" 
                block
                size="large"
                rounded="xl"
                prepend-icon="mdi-email-send"
              >
                Enviar Código
              </v-btn>
            </div>
          </v-form>
        </div>

        <!-- Paso 2: Código enviado -->
        <div v-if="currentStep === 2" class="text-center">
          <v-icon color="success" size="64" class="mb-4">mdi-email-check</v-icon>
          <p class="text-body-1 text-white mb-6">{{ successMessage }}</p>
          <p class="text-body-2 text-white mb-6">
            Haz clic en el enlace del correo para continuar con el restablecimiento de tu contraseña.
          </p>
          
          <div class="auth__actions">
            <v-btn 
              color="primary" 
              class="btn-primary text-none" 
              block
              size="large"
              rounded="xl"
              prepend-icon="mdi-arrow-left"
              @click="currentStep = 1"
            >
              Volver a Intentar
            </v-btn>
          </div>
        </div>

        <!-- Paso 3: Nueva contraseña -->
        <div v-if="currentStep === 3">
          <v-form @submit.prevent="resetUserPassword">
            <v-text-field 
              v-model="newPassword" 
              label="Nueva contraseña" 
              type="password" 
              autocomplete="new-password" 
              variant="outlined" 
              density="comfortable" 
              required 
              class="mb-2"
              prepend-inner-icon="mdi-lock-outline"
              :rules="[v => !!v || 'La contraseña es requerida', v => v.length >= 6 || 'Mínimo 6 caracteres']"
              @input="onPasswordChange"
            />
            
            <div v-if="newPassword" class="mb-4">
              <v-progress-linear 
                :model-value="passwordStrength * 20" 
                :color="getStrengthColor()"
                height="4"
                rounded
                class="mb-1"
              />
              <p class="text-caption text-white" :class="`text-${getStrengthColor()}`">
                Fortaleza: {{ getStrengthText() }}
              </p>
            </div>
            
            <v-text-field 
              v-model="confirmPassword" 
              label="Confirmar nueva contraseña" 
              type="password" 
              autocomplete="new-password" 
              variant="outlined" 
              density="comfortable" 
              required 
              class="mb-6"
              prepend-inner-icon="mdi-lock-check-outline"
              :rules="[v => !!v || 'Confirma tu contraseña', v => v === newPassword || 'Las contraseñas no coinciden']"
            />

            <div 
              v-if="error" 
              class="auth__error"
            >
              <div class="d-flex align-center">
                <v-icon color="error" class="mr-3">mdi-alert-circle</v-icon>
                <div>
                  <div class="font-weight-medium">{{ error }}</div>
                </div>
              </div>
            </div>

            <div class="auth__actions">
              <v-btn 
                type="submit" 
                :loading="loading" 
                color="primary" 
                class="btn-primary text-none" 
                block
                size="large"
                rounded="xl"
                prepend-icon="mdi-lock-reset"
              >
                Actualizar Contraseña
              </v-btn>
            </div>
          </v-form>
        </div>

        <!-- Paso 4: Éxito -->
        <div v-if="currentStep === 4" class="text-center">
          <v-icon color="success" size="64" class="mb-4">mdi-check-circle</v-icon>
          <p class="text-h6 text-white mb-4">{{ successMessage }}</p>
          
          <div class="auth__actions">
            <v-btn 
              color="primary" 
              class="btn-primary text-none" 
              block
              size="large"
              rounded="xl"
              prepend-icon="mdi-login"
              @click="goToLogin"
            >
              Ir al Login
            </v-btn>
          </div>
        </div>
        
        <!-- Enlaces de navegación -->
        <div class="auth__link mt-6">
          <div v-if="currentStep === 1 || currentStep === 2">
            <RouterLink to="/login" class="link-primary">
              ¿Recordaste tu contraseña? Vuelve al login
            </RouterLink>
          </div>
          <div v-if="currentStep === 4">
            <a href="#" @click.prevent="goToRegister" class="link-primary">
              ¿No tienes cuenta? Regístrate aquí
            </a>
          </div>
        </div>
      </div>
    </template>
  </AuthLayout>
</template>

<style scoped>
.v-field--focused .v-field__outline {
  --v-field-border-width: 2px;
  --v-field-border-opacity: 1;
}

.v-field .v-field__outline {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-field:hover .v-field__outline {
  --v-field-border-opacity: 0.8;
}
</style>