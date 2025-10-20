<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/userStore'
import { logoutUser } from '../services/authService'

const router = useRouter()
const userStore = useUserStore()

async function onLogout() {
  try {
    await logoutUser()
  } finally {
    userStore.clearUser()
    router.push('/login')
  }
}
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Spendly</v-app-bar-title>
    <v-spacer />
    <v-btn v-if="userStore.isAuthenticated" variant="tonal" @click="onLogout">Salir</v-btn>
  </v-app-bar>
</template>