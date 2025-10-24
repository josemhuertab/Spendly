<script setup>
import { ref, computed } from 'vue'
import { useSavingsStore } from '../store/savingsStore'
import { useCurrencyStore } from '../store/currencyStore'

const emit = defineEmits(['edit-saving'])

const savingsStore = useSavingsStore()
const currencyStore = useCurrencyStore()

const search = ref('')
const sortBy = ref([{ key: 'year', order: 'desc' }, { key: 'month', order: 'asc' }])
const deleteDialog = ref(false)
const savingToDelete = ref(null)

const headers = computed(() => [
  { title: 'Año', key: 'year', sortable: true, width: '100px' },
  { title: 'Mes', key: 'monthLabel', sortable: true, width: '130px' },
  { title: 'Monto', key: 'amount', sortable: true, width: '160px' },
  { title: 'Nota', key: 'note', sortable: false },
  { title: 'Acciones', key: 'actions', sortable: false, width: '160px' },
])

const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const items = computed(() => {
  const base = savingsStore.filterMonth ? savingsStore.savingsOfMonth : savingsStore.savingsOfYear
  return base.map(s => ({
    ...s,
    monthLabel: monthNames[(Number(s.month) || 1) - 1]
  })).filter(s => {
    const q = search.value.trim().toLowerCase()
    if (!q) return true
    return (
      String(s.year).includes(q) ||
      s.monthLabel.toLowerCase().includes(q) ||
      String(s.amount).includes(q) ||
      (s.note || '').toLowerCase().includes(q)
    )
  })
})

function openDelete(saving) {
  savingToDelete.value = saving
  deleteDialog.value = true
}

async function confirmDelete() {
  if (!savingToDelete.value) return
  try {
    await savingsStore.deleteSavingEntry(savingToDelete.value.id)
    deleteDialog.value = false
    savingToDelete.value = null
  } catch (e) {
    console.error('Error deleting saving:', e)
  }
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 overflow-hidden">
    <div class="flex items-center gap-3 p-4">
      <v-text-field
        v-model="search"
        placeholder="Buscar ahorro..."
        variant="outlined"
        density="comfortable"
        prepend-inner-icon="mdi-magnify"
        hide-details
        class="flex-1"
      />
      <v-btn @click="() => savingsStore.loadSavings()" :loading="savingsStore.loading" variant="outlined" prepend-icon="mdi-refresh">Actualizar</v-btn>
    </div>

    <v-data-table
      :items="items"
      :headers="headers"
      :sort-by="sortBy"
      item-key="id"
      class="border-t"
    >
      <template #item.amount="{ item }">
        <span class="font-semibold">
          {{ currencyStore.formatAmount(item.amount) }}
        </span>
      </template>

      <template #item.actions="{ item }">
        <div class="flex gap-2">
          <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-pencil" @click="emit('edit-saving', item)">Editar</v-btn>
          <v-btn size="small" variant="tonal" color="error" prepend-icon="mdi-delete" @click="openDelete(item)">Eliminar</v-btn>
        </div>
      </template>
    </v-data-table>

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>Eliminar ahorro</v-card-title>
        <v-card-text>¿Seguro que deseas eliminar este registro?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog=false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>