<script setup>
import { ref, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'
import CurrencyChangePrompt from './components/CurrencyChangePrompt.vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from './store/themeStore'

const route = useRoute()
const drawer = ref(false)
const theme = useTheme()
const themeStore = useThemeStore()

onMounted(() => {
  // Inicializar el tema
  themeStore.initTheme()
  
  // Sincronizar con Vuetify
  theme.global.name.value = themeStore.isDark ? 'spendlyDark' : 'spendlyLight'
  
  // Escuchar cambios en el tema
  themeStore.$subscribe(() => {
    theme.global.name.value = themeStore.isDark ? 'spendlyDark' : 'spendlyLight'
  })
})
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
