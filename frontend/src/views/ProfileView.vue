<script setup>
import { useUserStore } from '../store/userStore'
const userStore = useUserStore()
</script>

<template>
  <v-container class="py-8">
    <h2>Perfil de Usuario</h2>
    <p>Usuario: {{ userStore.displayName || 'Sin nombre' }}</p>
    <p>Aquí podrás ver y editar tus datos próximamente.</p>
  </v-container>
</template>