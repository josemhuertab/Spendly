<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
import { loginUser } from '../services/authService'
import { useUserStore } from '../store/userStore'
import LogoUrl from '../components/icons/Logo.png?url'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const errorCode = ref('')
const router = useRouter()
const userStore = useUserStore()

async function onSubmit() {
  error.value = ''
  errorCode.value = ''
  loading.value = true
  try {
    const user = await loginUser(email.value, password.value)
    userStore.setUser(user)
    router.push('/dashboard')
  } catch (e) {
    console.error('Login error:', e)
    error.value = e?.message || 'Error al iniciar sesión'
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
        <h1 class="auth__title gradient-text">Bienvenido a Spendly</h1>
        <p class="auth__subtitle">
          Tu compañero inteligente para gestionar finanzas personales de manera simple y efectiva.
        </p>
        <ul class="auth__benefits">
          <li>
            <v-icon class="benefit-icon">mdi-chart-line</v-icon>
            Controla tus finanzas en tiempo real
          </li>
          <li>
            <v-icon class="benefit-icon">mdi-shield-check</v-icon>
            Seguridad total, no interferimos con tu banco
          </li>
          <li>
            <v-icon class="benefit-icon">mdi-piggy-bank</v-icon>
            Lleva un control inteligente de ahorro
          </li>
          <li>
            <v-icon class="benefit-icon">mdi-target</v-icon>
            Establece y alcanza tus metas financieras
          </li>
        </ul>
      </div>
    </template>

    <template #form>
      <div class="auth__form">
        <h2 class="text-h5 text-white mb-6 text-center font-weight-bold">Iniciar Sesión</h2>
        
        <v-form @submit.prevent="onSubmit">
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
            autocomplete="current-password" 
            variant="outlined" 
            density="comfortable" 
            required 
            class="mb-6"
            prepend-inner-icon="mdi-lock-outline"
            :rules="[v => !!v || 'La contraseña es requerida']"
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
              prepend-icon="mdi-login"
            >
              Iniciar Sesión
            </v-btn>
          </div>
        </v-form>
        
        <div class="auth__link mt-4">
          <RouterLink to="/forgot-password" class="link-primary">
            ¿Olvidaste tu contraseña?
          </RouterLink>
        </div>
        
        <div class="auth__link mt-2">
          <RouterLink to="/register" class="link-primary">
            ¿No tienes cuenta? Regístrate aquí
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