<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useTransactionStore } from '@/store/transactionStore'
import { useCurrencyStore } from '@/store/currencyStore'
import { useSavingsStore } from '@/store/savingsStore'
import { useThemeStore } from '@/store/themeStore'
import { Line, Bar, Doughnut, Scatter } from 'vue-chartjs'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const transactionStore = useTransactionStore()
const currencyStore = useCurrencyStore()
const savingsStore = useSavingsStore()
const themeStore = useThemeStore()

function toDisplay(amount, fromCurrency = currencyStore.currentCurrency) {
  const converted = currencyStore.convertAmount(Number(amount || 0), fromCurrency, currencyStore.currentCurrency)
  return converted
}
function formatAmount(amount) {
  return currencyStore.formatAmount(toDisplay(amount))
}

const summary = computed(() => transactionStore.summary)
const formattedIngresos = computed(() => currencyStore.formatAmount(Number(summary.value.totalIngresos || 0)))
const formattedGastos = computed(() => currencyStore.formatAmount(Number(summary.value.totalGastos || 0)))
const formattedBalance = computed(() => currencyStore.formatAmount(Number(summary.value.balance || 0)))

const transactions = computed(() => transactionStore.transactions)
const monthLabels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const monthlyExpenses = computed(() => {
  const totals = Array.from({ length: 12 }, () => 0)
  transactions.value.forEach(t => {
    if (t.type !== 'gasto') return
    const m = Number(String(t.date).split('-')[1] || 1) - 1
    if (m >= 0 && m < 12) totals[m] += toDisplay(t.amount, t.currency || currencyStore.currentCurrency)
  })
  return totals
})

const monthlyIncomes = computed(() => {
  const totals = Array.from({ length: 12 }, () => 0)
  transactions.value.forEach(t => {
    if (t.type !== 'ingreso') return
    const m = Number(String(t.date).split('-')[1] || 1) - 1
    if (m >= 0 && m < 12) totals[m] += toDisplay(t.amount, t.currency || currencyStore.currentCurrency)
  })
  return totals
})

const categoryDistribution = computed(() => {
  const map = new Map()
  transactions.value.forEach(t => {
    if (t.type !== 'gasto') return
    const key = t.category || 'Sin categoría'
    map.set(key, (map.get(key) || 0) + toDisplay(t.amount, t.currency || currencyStore.currentCurrency))
  })
  const labels = Array.from(map.keys())
  const data = Array.from(map.values())
  return { labels, data }
})

const expenseScatter = computed(() => {
  const points = []
  transactions.value.forEach(t => {
    if (t.type !== 'gasto') return
    const d = new Date(t.date)
    if (!isNaN(d)) points.push({ x: d, y: toDisplay(t.amount, t.currency || currencyStore.currentCurrency) })
  })
  return points
})

const lineData = computed(() => ({
  labels: monthLabels,
  datasets: [{
    label: 'Gastos mensuales',
    data: monthlyExpenses.value,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.2)',
    tension: 0.3,
    fill: true
  }]
}))

const barData = computed(() => ({
  labels: monthLabels,
  datasets: [
    {
      label: 'Ingresos',
      data: monthlyIncomes.value,
      backgroundColor: 'rgba(34,197,94,0.6)'
    },
    {
      label: 'Gastos',
      data: monthlyExpenses.value,
      backgroundColor: 'rgba(239,68,68,0.6)'
    }
  ]
}))

const pieData = computed(() => ({
  labels: categoryDistribution.value.labels,
  datasets: [{
    data: categoryDistribution.value.data,
    backgroundColor: ['#10b981','#ef4444','#3b82f6','#f59e0b','#6366f1','#22c55e','#06b6d4','#a855f7','#f97316','#14b8a6']
  }]
}))

const scatterData = computed(() => ({
  datasets: [{
    label: 'Gastos por fecha',
    data: expenseScatter.value,
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59,130,246,0.6)'
  }]
}))

const chartColors = computed(() => {
  if (themeStore.isDark) {
    return {
      textColor: '#cbd5e1',
      gridColor: 'rgba(203, 213, 225, 0.1)',
      legendColor: '#f1f5f9'
    }
  } else {
    return {
      textColor: '#64748b',
      gridColor: 'rgba(148, 163, 184, 0.15)',
      legendColor: '#334155'
    }
  }
})

const baseOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      position: 'bottom', 
      labels: { 
        color: chartColors.value.legendColor,
        font: {
          size: 12
        }
      } 
    },
    tooltip: { 
      enabled: true,
      backgroundColor: themeStore.isDark ? '#334155' : '#ffffff',
      titleColor: themeStore.isDark ? '#f1f5f9' : '#1f2937',
      bodyColor: themeStore.isDark ? '#cbd5e1' : '#374151',
      borderColor: themeStore.isDark ? '#475569' : '#e5e7eb',
      borderWidth: 1
    }
  },
  scales: {
    x: { 
      ticks: { color: chartColors.value.textColor },
      grid: { color: chartColors.value.gridColor },
      border: { color: chartColors.value.gridColor }
    },
    y: { 
      ticks: { color: chartColors.value.textColor },
      grid: { color: chartColors.value.gridColor },
      border: { color: chartColors.value.gridColor }
    }
  }
}))

const lineOptions = computed(() => baseOptions.value)
const barOptions = computed(() => baseOptions.value)
const pieOptions = computed(() => ({
  ...baseOptions.value,
  scales: undefined
}))
const scatterOptions = computed(() => ({
  ...baseOptions.value,
  parsing: { xAxisKey: 'x', yAxisKey: 'y' }
}))

import { computed as vueComputed } from 'vue'
const goalAmount = vueComputed(() => Number(savingsStore.annualGoal || 0))

onMounted(async () => {
  await transactionStore.loadTransactions()
  transactionStore.startRealtime()
  await savingsStore.loadSavings(savingsStore.filterYear)
  await savingsStore.loadSummary()
  await savingsStore.loadAnnualGoal()
  
  const { watch } = await import('vue')
  watch(() => currencyStore.currentCurrency, () => {
    transactionStore.loadSummary()
    savingsStore.loadSummary()
  })
  watch(() => savingsStore.filterYear, () => {
    savingsStore.loadAnnualGoal()
  })
})

onUnmounted(() => {
  transactionStore.stopRealtime()
  savingsStore.stopRealtime?.()
})
</script>

<template>
  <v-container fluid class="pa-6 theme-bg min-h-screen">
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow">
        <v-card-text class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium theme-text-secondary mb-1">Balance</p>
              <p class="text-2xl font-bold" :class="summary.balance >= 0 ? 'text-green-600' : 'text-red-600'">{{ formattedBalance }}</p>
            </div>
            <div :class="`p-3 rounded-full ${summary.balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`">
              <v-icon :color="summary.balance >= 0 ? 'success' : 'error'" size="24">{{ summary.balance >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}</v-icon>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow">
        <v-card-text class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium theme-text-secondary mb-1">Total Ingresos</p>
              <p class="text-2xl font-bold text-green-600">+{{ formattedIngresos }}</p>
            </div>
            <div class="p-3 rounded-full bg-green-100">
              <v-icon color="success" size="24">mdi-plus-circle</v-icon>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow">
        <v-card-text class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium theme-text-secondary mb-1">Total Gastos</p>
              <p class="text-2xl font-bold text-red-600">-{{ formattedGastos }}</p>
            </div>
            <div class="p-3 rounded-full bg-red-100">
              <v-icon color="error" size="24">mdi-minus-circle</v-icon>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow">
        <v-card-text class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium theme-text-secondary mb-1">Ahorros acumulados</p>
              <p class="text-2xl font-bold text-teal-600">{{ currencyStore.formatAmount(savingsStore.summary.totalAll) }}</p>
            </div>
            <div class="p-3 rounded-full bg-teal-100">
              <v-icon color="teal" size="24">mdi-piggy-bank</v-icon>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
      <!-- Line: monthly expenses -->
      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4 theme-text-primary">Gastos mensuales</v-card-title>
        <v-card-text style="height: 320px" class="px-6 pb-6">
          <Line :data="lineData" :options="lineOptions" />
        </v-card-text>
      </v-card>

      <!-- Bar: incomes vs expenses -->
      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4 theme-text-primary">Ingresos vs Gastos</v-card-title>
        <v-card-text style="height: 320px" class="px-6 pb-6">
          <Bar :data="barData" :options="barOptions" />
        </v-card-text>
      </v-card>

      <!-- Pie: distribution by category -->
      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4 theme-text-primary">Distribución de gastos por categoría</v-card-title>
        <v-card-text style="height: 320px" class="px-6 pb-6">
          <Doughnut :data="pieData" :options="pieOptions" />
        </v-card-text>
      </v-card>

      <!-- Scatter: expenses by date -->
      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4 theme-text-primary">Gastos por fecha</v-card-title>
        <v-card-text style="height: 320px" class="px-6 pb-6">
          <Scatter :data="scatterData" :options="scatterOptions" />
        </v-card-text>
      </v-card>
    </div>

    <!-- Credit card history and pending payments -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4 theme-text-primary">Últimas compras con tarjeta de crédito</v-card-title>
        <v-card-text class="px-6 pb-6">
          <div v-for="tx in transactionStore.transactions.filter(t => t.paymentMethod==='tarjeta_credito' && t.type==='gasto').slice(0,5)" :key="tx.id" class="flex justify-between items-center py-2 border-b theme-border-light">
            <div>
              <div class="text-sm font-medium theme-text-primary">{{ tx.description || tx.category }}</div>
              <div class="text-xs theme-text-muted">{{ new Date(tx.date).toLocaleDateString('es-ES') }}</div>
            </div>
            <div class="text-sm font-semibold text-red-600">
              {{ currencyStore.formatAmount(currencyStore.convertAmount(tx.amount, tx.currency || currencyStore.currentCurrency, currencyStore.currentCurrency)) }}
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4 theme-text-primary">Productos pendientes de pago</v-card-title>
        <v-card-text class="px-6 pb-6">
          <div v-for="tx in transactionStore.transactions.filter(t => t.paymentMethod==='tarjeta_credito' && t.type==='gasto' && Number(t.installmentsPaid||0) < Number(t.installments||0)).slice(0,5)" :key="tx.id" class="flex justify-between items-center py-2 border-b theme-border-light">
            <div>
              <div class="text-sm font-medium theme-text-primary">{{ tx.description || tx.category }}</div>
              <div class="text-xs theme-text-muted">Cuotas: {{ tx.installmentsPaid || 0 }} / {{ tx.installments || 0 }}</div>
            </div>
            <div class="text-sm font-semibold text-orange-600">
              <!-- Saldo pendiente -->
              {{ currencyStore.formatAmount(
                currencyStore.convertAmount((Number(tx.amount||0) - (Number(tx.amount||0)/(Number(tx.installments||1)))*(Number(tx.installmentsPaid||0))), tx.currency || currencyStore.currentCurrency, currencyStore.currentCurrency)
              ) }}
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Goals progress -->
    <div class="mt-8">
      <v-card class="rounded-xl border-0 shadow-md">
        <v-card-title class="px-6 py-4 theme-text-primary">Progreso de metas financieras</v-card-title>
        <v-card-text class="px-6 pb-6">
          <div class="flex items-center gap-6">
            <v-progress-circular :model-value="(savingsStore.summary.totalYear && goalAmount>0) ? Math.min(100, Math.round((savingsStore.summary.totalYear/goalAmount)*100)) : 0" color="primary" size="96" width="10">
              {{ (savingsStore.summary.totalYear && goalAmount>0) ? Math.min(100, Math.round((savingsStore.summary.totalYear/goalAmount)*100)) : 0 }}%
            </v-progress-circular>
            <div>
              <div class="text-sm theme-text-secondary">Meta anual</div>
              <div class="text-xl font-bold theme-text-primary">{{ currencyStore.formatAmount(goalAmount) }}</div>
              <div class="text-sm theme-text-secondary mt-1">Ahorros del año: {{ currencyStore.formatAmount(savingsStore.summary.totalYear) }}</div>
              <div v-if="!goalAmount" class="text-xs theme-text-muted mt-2">Configura tu meta en Ahorros → Meta anual</div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>