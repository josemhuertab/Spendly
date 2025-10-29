<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCurrencyStore } from '../store/currencyStore'
import { useUserStore } from '../store/userStore'
import { useThemeStore } from '../store/themeStore'
import CategoryManager from '../components/CategoryManager.vue'

const currencyStore = useCurrencyStore()
const userStore = useUserStore()
const themeStore = useThemeStore()

// Local state
const selectedCurrency = ref(currencyStore.currentCurrency)
const showExchangeRates = ref(false)
const isUpdatingRates = ref(false)

// Computed
const exchangeRateInfo = computed(() => currencyStore.getExchangeRateInfo())

const lastUpdatedFormatted = computed(() => {
  if (!exchangeRateInfo.value.lastUpdated) return 'Nunca'
  
  const date = new Date(exchangeRateInfo.value.lastUpdated)
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
})

// Methods
function handleCurrencyChange() {
  currencyStore.setCurrency(selectedCurrency.value)
  // Show success message
  showSuccessMessage()
}

function showSuccessMessage() {
  // You can implement a toast/snackbar here
  console.log(`Moneda cambiada a ${currencyStore.currentCurrencyInfo.name}`)
}

async function updateExchangeRates() {
  isUpdatingRates.value = true
  try {
    await currencyStore.updateExchangeRates()
  } finally {
    isUpdatingRates.value = false
  }
}

function formatExchangeRate(rate, currencyCode) {
  if (currencyCode === 'USD') return '1.00'
  return rate.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  })
}

// Lifecycle
onMounted(() => {
  selectedCurrency.value = currencyStore.currentCurrency
})
</script>

<template>
  <v-container fluid class="pa-6 theme-bg min-h-screen">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold theme-text-primary mb-2">Configuración</h1>
      <p class="theme-text-secondary">Personaliza tu experiencia en Spendly</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Currency Settings -->
      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 rounded-lg">
              <v-icon color="primary" size="24">mdi-currency-usd</v-icon>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Moneda</h3>
              <p class="text-sm text-gray-600">Selecciona tu moneda preferida</p>
            </div>
          </div>
        </v-card-title>

        <v-card-text class="p-6">
          <!-- Current Currency Display -->
          <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ currencyStore.currentCurrencyInfo.flag }}</span>
                <div>
                  <p class="font-semibold text-gray-900">{{ currencyStore.currentCurrencyInfo.name }}</p>
                  <p class="text-sm text-gray-600">{{ currencyStore.currentCurrencyInfo.code }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold text-blue-600">{{ currencyStore.currentCurrencyInfo.symbol }}</p>
                <p class="text-xs text-gray-500">Símbolo</p>
              </div>
            </div>
          </div>

          <!-- Currency Selection -->
          <v-select
            v-model="selectedCurrency"
            :items="currencyStore.availableCurrencies"
            item-title="name"
            item-value="code"
            label="Seleccionar Moneda"
            variant="outlined"
            class="mb-4"
            @update:model-value="handleCurrencyChange"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <span class="text-xl mr-3">{{ item.raw.flag }}</span>
                </template>
                <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.raw.code }} - {{ item.raw.symbol }}</v-list-item-subtitle>
              </v-list-item>
            </template>
            
            <template #selection="{ item }">
              <div class="flex items-center gap-2">
                <span>{{ item.raw.flag }}</span>
                <span>{{ item.raw.name }}</span>
                <span class="text-gray-500">({{ item.raw.code }})</span>
              </div>
            </template>
          </v-select>

          <!-- Exchange Rate Info -->
          <div class="mt-6">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-semibold text-gray-900">Tasas de Cambio</h4>
              <v-btn
                @click="updateExchangeRates"
                :loading="isUpdatingRates"
                variant="outlined"
                size="small"
                prepend-icon="mdi-refresh"
              >
                Actualizar
              </v-btn>
            </div>
            
            <div class="text-sm text-gray-600 mb-3">
              Última actualización: {{ lastUpdatedFormatted }}
            </div>

            <v-btn
              @click="showExchangeRates = !showExchangeRates"
              variant="text"
              size="small"
              :prepend-icon="showExchangeRates ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              class="mb-3"
            >
              {{ showExchangeRates ? 'Ocultar' : 'Ver' }} tasas de cambio
            </v-btn>

            <v-expand-transition>
              <div v-show="showExchangeRates" class="space-y-2">
                <div
                  v-for="currency in currencyStore.availableCurrencies"
                  :key="currency.code"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div class="flex items-center gap-2">
                    <span>{{ currency.flag }}</span>
                    <span class="font-medium">{{ currency.code }}</span>
                    <span class="text-gray-600 text-sm">{{ currency.name }}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-mono text-sm">
                      1 USD = {{ formatExchangeRate(exchangeRateInfo.rates[currency.code], currency.code) }} {{ currency.code }}
                    </span>
                  </div>
                </div>
              </div>
            </v-expand-transition>
          </div>
        </v-card-text>
      </v-card>

      <!-- User Preferences -->
      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-100 rounded-lg">
              <v-icon color="success" size="24">mdi-account-cog</v-icon>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Preferencias de Usuario</h3>
              <p class="text-sm text-gray-600">Configuración de tu cuenta</p>
            </div>
          </div>
        </v-card-title>

        <v-card-text class="p-6">
          <!-- User Info Display with Profile Button -->
          <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <v-avatar color="primary" size="48">
                  <v-icon size="24">mdi-account</v-icon>
                </v-avatar>
                <div>
                  <p class="font-semibold text-gray-900">{{ userStore.displayName || 'Usuario' }}</p>
                  <p class="text-sm text-gray-600">{{ userStore.userEmail }}</p>
                </div>
              </div>
              <v-btn
                to="/perfil"
                variant="outlined"
                prepend-icon="mdi-account-cog"
                size="small"
                class="text-xs sm:text-sm whitespace-nowrap"
              >
                <span class="hidden sm:inline">Configurar Perfil</span>
                <span class="sm:hidden">Perfil</span>
              </v-btn>
            </div>
          </div>

          <!-- Theme Settings -->
          <div class="space-y-4">
            <v-divider class="my-4"></v-divider>
            
            <!-- Dark Mode Option -->
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gray-200 rounded-lg">
                  <v-icon :color="themeStore.isDark ? 'primary' : 'gray'" size="24">
                    {{ themeStore.isDark ? 'mdi-weather-night' : 'mdi-weather-sunny' }}
                  </v-icon>
                </div>
                <div>
                  <p class="font-semibold text-gray-900">Modo Oscuro</p>
                  <p class="text-sm text-gray-600">
                    Actualmente: {{ themeStore.isDark ? 'Modo Oscuro' : 'Modo Claro' }}
                  </p>
                </div>
              </div>
              <v-switch
                :model-value="themeStore.isDark"
                @update:model-value="themeStore.toggleTheme"
                color="primary"
                hide-details
              />
            </div>
            
            <p class="text-xs text-gray-500 text-center">
              El tema se guarda automáticamente y se aplica en toda la aplicación
            </p>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Category Management -->
    <CategoryManager class="mt-8" />

    <!-- Currency Conversion Info -->
    <v-card class="rounded-xl border-0 shadow-md mt-8">
      <v-card-title class="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-purple-100 rounded-lg">
            <v-icon color="purple" size="24">mdi-information</v-icon>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              <span class="hidden sm:inline">Información sobre Conversión de Moneda</span>
              <span class="sm:hidden">Conversión de Moneda</span>
            </h3>
            <p class="text-sm text-gray-600">Cómo funciona el sistema de monedas</p>
          </div>
        </div>
      </v-card-title>

      <v-card-text class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-semibold text-gray-900 mb-3">💰 Almacenamiento de Datos</h4>
            <p class="text-gray-600 text-sm mb-4">
              Todas las transacciones se guardan en USD como moneda base. Esto garantiza consistencia 
              y permite conversiones precisas entre diferentes monedas.
            </p>
          </div>
          
          <div>
            <h4 class="font-semibold text-gray-900 mb-3">🔄 Conversión Automática</h4>
            <p class="text-gray-600 text-sm mb-4">
              Los montos se convierten automáticamente a tu moneda preferida usando tasas de cambio 
              actualizadas. Puedes cambiar de moneda en cualquier momento.
            </p>
          </div>
          
          <div>
            <h4 class="font-semibold text-gray-900 mb-3">📊 Tasas de Cambio</h4>
            <p class="text-gray-600 text-sm mb-4">
              Las tasas se actualizan automáticamente cada hora usando APIs confiables. 
              También puedes actualizarlas manualmente cuando lo necesites.
            </p>
          </div>
          
          <div>
            <h4 class="font-semibold text-gray-900 mb-3">🌍 Monedas Soportadas</h4>
            <p class="text-gray-600 text-sm mb-4">
              Soportamos las principales monedas de América Latina, América del Norte y Europa. 
              ¡Más monedas próximamente!
            </p>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="currencyStore.isLoading"
      color="info"
      timeout="-1"
      location="bottom"
    >
      <div class="flex items-center gap-2">
        <v-progress-circular size="20" indeterminate></v-progress-circular>
        Actualizando tasas de cambio...
      </div>
    </v-snackbar>
  </v-container>
</template>

<style scoped>
:deep(.v-select .v-field__input) {
  padding-top: 8px;
  padding-bottom: 8px;
}

:deep(.v-list-item__prepend) {
  margin-right: 8px;
}
</style>