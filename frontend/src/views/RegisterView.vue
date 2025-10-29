<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
import { registerUser } from '../services/authService'
import { useUserStore } from '../store/userStore'
import LogoUrl from '../components/icons/Logo.png?url'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const errorCode = ref('')
const router = useRouter()
const userStore = useUserStore()

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
  passwordStrength.value = checkPasswordStrength(password.value)
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

async function onSubmit() {
  error.value = ''
  errorCode.value = ''
  
  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  
  loading.value = true
  try {
    const user = await registerUser(email.value, password.value, name.value)
    userStore.setUser(user)
    router.push('/dashboard')
  } catch (e) {
    console.error('Register error:', e)
    error.value = e?.message || 'Error al registrarse'
    errorCode.value = e?.code || ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <template #brand>
      <div class="auth__brand">
        <img :src="LogoUrl" alt="Spendly" class="auth__logo" />
        <h1 class="auth__title gradient-text">Únete a Spendly</h1>
        <p class="auth__subtitle">
          Comienza tu viaje hacia la libertad financiera y transforma la manera en que manejas tu dinero.
        </p>
        <ul class="auth__benefits">
          <li>
            <v-icon class="benefit-icon">mdi-rocket-launch</v-icon>
            Comienza en menos de 2 minutos
          </li>
          <li>
            <v-icon class="benefit-icon">mdi-lock-outline</v-icon>
            Datos protegidos con encriptación avanzada
          </li>
          <li>
            <v-icon class="benefit-icon">mdi-trending-up</v-icon>
            Mejora tus hábitos financieros
          </li>
        </ul>
      </div>
    </template>

    <template #form>
      <div class="auth__form">
        <h2 class="text-h5 mb-6 text-center font-weight-bold">Crear Cuenta</h2>
        
        <v-form @submit.prevent="onSubmit">
          <v-text-field 
            v-model="name" 
            label="Nombre completo" 
            type="text" 
            autocomplete="name" 
            variant="outlined" 
            density="comfortable" 
            required 
            class="mb-4"
            prepend-inner-icon="mdi-account-outline"
            :rules="[v => !!v || 'El nombre es requerido']"
          />
          
          <v-text-field 
            v-model="email" 
            label="Correo electrónico" 
            type="email" 
            autocomplete="email" 
            variant="outlined" 
            density="comfortable" 
            required 
            class="mb-4"
            prepend-inner-icon="mdi-email-outline"
            :rules="[v => !!v || 'El correo es requerido', v => /.+@.+\..+/.test(v) || 'Correo inválido']"
          />
          
          <v-text-field 
            v-model="password" 
            label="Contraseña" 
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
          
          <div v-if="password" class="mb-4">
            <v-progress-linear 
              :model-value="passwordStrength * 20" 
              :color="getStrengthColor()"
              height="4"
              rounded
              class="mb-1"
            />
            <p class="text-caption" :class="`text-${getStrengthColor()}`">
              Fortaleza: {{ getStrengthText() }}
            </p>
          </div>
          
          <v-text-field 
            v-model="confirmPassword" 
            label="Confirmar contraseña" 
            type="password" 
            autocomplete="new-password" 
            variant="outlined" 
            density="comfortable" 
            required 
            class="mb-6"
            prepend-inner-icon="mdi-lock-check-outline"
            :rules="[v => !!v || 'Confirma tu contraseña', v => v === password || 'Las contraseñas no coinciden']"
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
              prepend-icon="mdi-account-plus"
            >
              Crear Cuenta
            </v-btn>
          </div>
        </v-form>
        
        <div class="auth__link mt-6">
          <RouterLink to="/login" class="link-primary">
            ¿Ya tienes cuenta? Inicia sesión aquí
          </RouterLink>
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