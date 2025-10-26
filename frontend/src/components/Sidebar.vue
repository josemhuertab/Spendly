<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const router = useRouter()

// Badge "¡Nuevo!" visible hasta que el usuario visite Compras por primera vez
const showNewBadge = ref(true)

onMounted(() => {
  const seen = localStorage.getItem('spendly_seen_compras') === '1'
  showNewBadge.value = !seen
  // Si ya estamos en compras al cargar, marcar como visto
  if (route.name === 'compras') {
    localStorage.setItem('spendly_seen_compras', '1')
    showNewBadge.value = false
  }
})

watch(() => route.name, (name) => {
  if (name === 'compras') {
    localStorage.setItem('spendly_seen_compras', '1')
    showNewBadge.value = false
  }
})

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
        title="Compras T. de Crédito"
        @click="navigate({ name: 'compras' })"
      >
        <template #append>
          <span v-if="showNewBadge" class="nuevo-chip">¡Nuevo!</span>
        </template>
      </v-list-item>

      <div class="flex-grow-1" />

      <v-divider class="my-4" />
      <v-list-item
        :active="isActive('perfil')"
        active-class="sidebar-active"
        prepend-icon="mdi-account-circle"
        title="Perfil de usuario"
        @click="navigate({ name: 'perfil' })"
      />
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
/* Badge "¡Nuevo!" en la opción de Compras */
.sidebar .v-list-item { position: relative; }
.nuevo-chip {
  position: absolute;
  top: 4px;
  right: 10px;
  background: #b91c1c; /* rojo */
  color: #fff;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 6px;
  letter-spacing: 0.2px;
  text-transform: uppercase;
  line-height: 1;
  pointer-events: none;
}
@media (min-width: 768px) {
  .nuevo-chip { font-size: 10px; padding: 2px 7px; top: 6px; right: 12px; }
}
@media (min-width: 1024px) {
  .nuevo-chip { font-size: 10px; padding: 2px 7px; top: 6px; right: 12px; }
}
</style>