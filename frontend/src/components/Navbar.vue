<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/userStore'
import { logoutUser } from '../services/authService'
import { useDisplay } from 'vuetify'
import LogoUrl from './icons/Logo-blanco.png?url'

const router = useRouter()
const userStore = useUserStore()
const { smAndDown } = useDisplay()
const mobile = smAndDown

const emit = defineEmits(['toggle-drawer'])

async function onLogout() {
  try {
    await logoutUser()
  } finally {
    userStore.clearUser()
    router.push('/login')
  }
}

const menuItems = [
  { name: 'dashboard', label: 'Dashboard', icon: 'mdi-view-dashboard-outline' },
  { name: 'movimientos', label: 'Movimientos', icon: 'mdi-swap-horizontal' },
  { name: 'ahorros', label: 'Ahorros', icon: 'mdi-piggy-bank' },
  { name: 'compras', label: 'Compras T. de Crédito', icon: 'mdi-credit-card-outline' },
]
</script>

<template>
  <v-app-bar color="primary" density="comfortable" class="navbar-theme">
    <template v-if="mobile">
      <v-app-bar-nav-icon icon="mdi-menu" @click="emit('toggle-drawer')" />
      <v-app-bar-title class="text-center">Spendly</v-app-bar-title>
      <div class="d-flex align-center" style="gap:8px">
        <v-btn v-if="userStore.isAuthenticated" variant="tonal" class="text-none" prepend-icon="mdi-logout" @click="onLogout">Salir</v-btn>
      </div>
    </template>

    <template v-else>
      <img :src="LogoUrl" alt="Spendly" class="nav-logo" @click="router.push({ name: 'dashboard' })" />
      <v-toolbar-items class="ml-4">
        <v-btn
          v-for="item in menuItems"
          :key="item.name"
          :to="{ name: item.name }"
          variant="text"
          class="text-white text-none"
          :prepend-icon="item.icon"
        >
          {{ item.label }}
        </v-btn>
      </v-toolbar-items>

      <v-spacer />

      <v-btn :to="{ name: 'perfil' }" variant="text" class="text-white text-none" prepend-icon="mdi-account-circle">
        {{ userStore.displayName || 'Perfil' }}
      </v-btn>
      <v-btn :to="{ name: 'configuracion' }" variant="text" class="text-white text-none" prepend-icon="mdi-cog">
        Configuración
      </v-btn>
      <v-btn v-if="userStore.isAuthenticated" variant="tonal" class="ml-2 text-none" prepend-icon="mdi-logout" @click="onLogout">
        Salir
      </v-btn>
    </template>
  </v-app-bar>
</template>

<style scoped>
.nav-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  margin-left: 8px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.nav-logo:hover {
  opacity: 0.8;
}

.navbar-theme {
  background: linear-gradient(90deg, #379237 0%, #54B435 100%) !important;
  z-index: 1000 !important;
}

/* Scrolling navbar on desktop and tablet */
@media (min-width: 961px) {
  .navbar-theme {
    position: relative !important;
  }
}

/* Fixed navbar only on mobile */
@media (max-width: 960px) {
  .navbar-theme {
    position: fixed !important;
    top: 0 !important;
  }
}

:global(.dark-theme) .navbar-theme {
  background: linear-gradient(90deg, #047857 0%, #059669 100%) !important;
}
</style>