<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LogoUrl from './icons/Logo.png?url'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const router = useRouter()

function close() {
  emit('update:modelValue', false)
}

function navigate(to) {
  router.push(to)
  close()
}

const isActive = (name) => computed(() => route.name === name)
</script>

<template>
  <v-navigation-drawer
    v-model="props.modelValue"
    class="sidebar"
    location="left"
    width="280"
    temporary
    scrim
    elevation="12"
  >
    <v-list density="comfortable" class="text-white">
      <!-- Secciones principales -->
      <v-list-item
        :active="isActive('dashboard')"
        active-class="sidebar-active"
        prepend-icon="mdi-view-dashboard-outline"
        title="Dashboard"
        @click="navigate({ name: 'dashboard' })"
      />
      <v-list-item
        :active="isActive('movimientos')"
        active-class="sidebar-active"
        prepend-icon="mdi-swap-horizontal"
        title="Movimientos"
        @click="navigate({ name: 'movimientos' })"
      />
      <v-list-item
        :active="isActive('ahorros')"
        active-class="sidebar-active"
        prepend-icon="mdi-piggy-bank"
        title="Ahorros"
        @click="navigate({ name: 'ahorros' })"
      />
      <v-list-item
        :active="isActive('compras')"
        active-class="sidebar-active"
        prepend-icon="mdi-credit-card-outline"
        title="Compras con Tarjeta/Cuotas"
        @click="navigate({ name: 'compras' })"
      />

      <div class="flex-grow-1" />

      <!-- Parte inferior -->
      <v-divider class="my-4" />
      <v-list-item
        active-class="sidebar-active"
        @click="navigate({ name: 'perfil' })"
      >
        <template #prepend>
          <img :src="LogoUrl" alt="Spendly" class="sidebar__avatar" />
        </template>
        <v-list-item-title>Perfil de usuario</v-list-item-title>
      </v-list-item>
      <v-list-item
        :active="isActive('configuracion')"
        active-class="sidebar-active"
        prepend-icon="mdi-cog"
        title="Configuración"
        @click="navigate({ name: 'configuracion' })"
      />
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, #379237 0%, #54B435 100%);
  color: #fff;
  transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.2s ease;
}
.sidebar .v-list-item {
  color: #fff;
}
.sidebar__avatar {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.sidebar-active {
  background: rgba(0, 0, 0, 0.22) !important;
  border-radius: 12px;
}
</style>