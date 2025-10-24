<script setup>
import { ref } from 'vue'
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'
import CurrencyChangePrompt from './components/CurrencyChangePrompt.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const drawer = ref(false)
</script>

<template>
  <v-app>
    <Navbar v-if="!route.meta.hideNavbar" @toggle-drawer="drawer = !drawer" />
    <Sidebar v-if="!route.meta.hideNavbar" v-model="drawer" />
    <CurrencyChangePrompt />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
