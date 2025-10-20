<script setup>
import { useUserStore } from '../store/userStore'
const userStore = useUserStore()
</script>

<template>
  <v-container class="py-8">
    <h2>Dashboard</h2>
    <p>Bienvenido, {{ userStore.displayName || 'usuario' }}</p>
  </v-container>
</template>