<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCategoryStore } from '../store/categoryStore'
import ResetCategoriesDialog from './ResetCategoriesDialog.vue'
import DeleteCategoryDialog from './DeleteCategoryDialog.vue'

const categoryStore = useCategoryStore()

const activeTab = ref('gastos')
const showAddDialog = ref(false)
const showSubcategoryDialog = ref(false)
const selectedCategory = ref('')
const newCategoryName = ref('')
const newSubcategoryName = ref('')
const loading = ref(false)
const showResetDialog = ref(false)
const showDeleteDialog = ref(false)
const deleteTarget = ref({
  type: 'category', // 'category' or 'subcategory'
  categoryName: '',
  subcategoryName: ''
})

const currentCategories = computed(() => {
  return activeTab.value === 'gastos' 
    ? categoryStore.getExpenseCategories 
    : categoryStore.getIncomeCategories
})

const tabItems = [
  { value: 'gastos', title: 'Categorías de Gastos', icon: 'mdi-minus-circle', color: 'error' },
  { value: 'ingresos', title: 'Categorías de Ingresos', icon: 'mdi-plus-circle', color: 'success' }
]

function openAddDialog() {
  newCategoryName.value = ''
  showAddDialog.value = true
}

function openSubcategoryDialog(category) {
  selectedCategory.value = category
  newSubcategoryName.value = ''
  showSubcategoryDialog.value = true
}

async function addCategory() {
  if (!newCategoryName.value.trim()) return
  
  loading.value = true
  try {
    const success = await categoryStore.addCategory(activeTab.value === 'gastos' ? 'gasto' : 'ingreso', newCategoryName.value)
    if (success) {
      showAddDialog.value = false
      newCategoryName.value = ''
    }
  } catch (error) {
    console.error('Error adding category:', error)
  } finally {
    loading.value = false
  }
}

function openDeleteCategoryDialog(categoryName) {
  deleteTarget.value = {
    type: 'category',
    categoryName: categoryName,
    subcategoryName: ''
  }
  showDeleteDialog.value = true
}

async function handleDeleteCategory() {
  loading.value = true
  try {
    await categoryStore.removeCategory(
      activeTab.value === 'gastos' ? 'gasto' : 'ingreso', 
      deleteTarget.value.categoryName
    )
    // Close dialog on success
    showDeleteDialog.value = false
  } catch (error) {
    console.error('Error removing category:', error)
  } finally {
    loading.value = false
  }
}

async function addSubcategory() {
  if (!newSubcategoryName.value.trim()) return
  
  loading.value = true
  try {
    const success = await categoryStore.addSubcategory(selectedCategory.value, newSubcategoryName.value)
    if (success) {
      showSubcategoryDialog.value = false
      newSubcategoryName.value = ''
    }
  } catch (error) {
    console.error('Error adding subcategory:', error)
  } finally {
    loading.value = false
  }
}

function openDeleteSubcategoryDialog(categoryName, subcategoryName) {
  deleteTarget.value = {
    type: 'subcategory',
    categoryName: categoryName,
    subcategoryName: subcategoryName
  }
  showDeleteDialog.value = true
}

async function handleDeleteSubcategory() {
  loading.value = true
  try {
    await categoryStore.removeSubcategory(
      deleteTarget.value.categoryName, 
      deleteTarget.value.subcategoryName
    )
    // Close dialog on success
    showDeleteDialog.value = false
  } catch (error) {
    console.error('Error removing subcategory:', error)
  } finally {
    loading.value = false
  }
}

async function handleDeleteConfirm() {
  if (deleteTarget.value.type === 'category') {
    await handleDeleteCategory()
  } else {
    await handleDeleteSubcategory()
  }
}

function openResetDialog() {
  showResetDialog.value = true
}

async function handleResetCategories() {
  loading.value = true
  try {
    await categoryStore.resetToDefaults()
    // Close dialog on success
    showResetDialog.value = false
  } catch (error) {
    console.error('Error resetting categories:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await categoryStore.loadUserCategories()
})
</script>

<template>
  <v-card class="rounded-xl border-0 shadow-md">
    <v-card-title class="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-purple-100 rounded-lg">
            <v-icon color="purple" size="24">mdi-tag-multiple</v-icon>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Gestión de Categorías</h3>
            <p class="text-sm text-gray-600 hidden sm:block">Personaliza tus categorías y subcategorías</p>
          </div>
        </div>
        <v-btn
          @click="openResetDialog"
          variant="outlined"
          size="small"
          prepend-icon="mdi-restore"
          color="warning"
          class="text-xs sm:text-sm whitespace-nowrap"
        >
          <span class="hidden sm:inline">Restaurar por defecto</span>
          <span class="sm:hidden">Restaurar</span>
        </v-btn>
      </div>
    </v-card-title>

    <v-card-text class="p-6">
      <!-- Tabs -->
      <v-tabs v-model="activeTab" class="mb-6">
        <v-tab
          v-for="tab in tabItems"
          :key="tab.value"
          :value="tab.value"
          class="text-none"
        >
          <v-icon :color="tab.color" start>{{ tab.icon }}</v-icon>
          {{ tab.title }}
        </v-tab>
      </v-tabs>

      <!-- Categories List -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-gray-900">
            {{ activeTab === 'gastos' ? 'Categorías de Gastos' : 'Categorías de Ingresos' }}
          </h4>
          <v-btn
            @click="openAddDialog"
            :color="activeTab === 'gastos' ? 'error' : 'success'"
            prepend-icon="mdi-plus"
            variant="flat"
          >
            Agregar Categoría
          </v-btn>
        </div>

        <div class="space-y-3">
          <v-card
            v-for="category in currentCategories"
            :key="category"
            variant="outlined"
            class="rounded-lg"
          >
            <v-card-text class="p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <v-icon :color="activeTab === 'gastos' ? 'error' : 'success'">
                    mdi-tag
                  </v-icon>
                  <span class="font-semibold text-gray-900">{{ category }}</span>
                </div>
                <div class="flex gap-2">
                  <v-btn
                    @click="openSubcategoryDialog(category)"
                    size="small"
                    variant="outlined"
                    prepend-icon="mdi-plus"
                  >
                    Subcategoría
                  </v-btn>
                  <v-btn
                    @click="openDeleteCategoryDialog(category)"
                    size="small"
                    variant="outlined"
                    color="error"
                    icon="mdi-delete"
                  />
                </div>
              </div>

              <!-- Subcategories -->
              <div v-if="categoryStore.getSubcategoriesForCategory(category).length > 0" class="ml-8">
                <p class="text-sm text-gray-600 mb-2">Subcategorías:</p>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="subcategory in categoryStore.getSubcategoriesForCategory(category)"
                    :key="subcategory"
                    class="relative"
                  >
                    <v-chip
                      size="small"
                      variant="outlined"
                      class="pr-8"
                    >
                      <v-icon start size="16">mdi-tag-outline</v-icon>
                      {{ subcategory }}
                    </v-chip>
                    <v-btn
                      @click="openDeleteSubcategoryDialog(category, subcategory)"
                      size="x-small"
                      variant="text"
                      icon="mdi-close"
                      class="absolute -top-1 -right-1 bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-full"
                      style="width: 20px; height: 20px; min-width: 20px;"
                    />
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </v-card-text>

    <!-- Add Category Dialog -->
    <v-dialog v-model="showAddDialog" max-width="500">
      <v-card class="rounded-xl">
        <v-card-title class="px-6 py-4">
          <div class="flex items-center gap-3">
            <v-icon :color="activeTab === 'gastos' ? 'error' : 'success'">mdi-tag-plus</v-icon>
            <span>Agregar Nueva Categoría</span>
          </div>
        </v-card-title>

        <v-card-text class="px-6 py-4">
          <v-text-field
            v-model="newCategoryName"
            label="Nombre de la categoría"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-tag"
            @keyup.enter="addCategory"
          />
        </v-card-text>

        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <v-btn @click="showAddDialog = false" variant="outlined">
            Cancelar
          </v-btn>
          <v-btn
            @click="addCategory"
            :color="activeTab === 'gastos' ? 'error' : 'success'"
            variant="flat"
            :disabled="!newCategoryName.trim()"
          >
            Agregar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Subcategory Dialog -->
    <v-dialog v-model="showSubcategoryDialog" max-width="500">
      <v-card class="rounded-xl">
        <v-card-title class="px-6 py-4">
          <div class="flex items-center gap-3">
            <v-icon color="primary">mdi-tag-outline</v-icon>
            <span>Agregar Subcategoría a "{{ selectedCategory }}"</span>
          </div>
        </v-card-title>

        <v-card-text class="px-6 py-4">
          <v-text-field
            v-model="newSubcategoryName"
            label="Nombre de la subcategoría"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-tag-outline"
            @keyup.enter="addSubcategory"
          />
        </v-card-text>

        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <v-btn @click="showSubcategoryDialog = false" variant="outlined">
            Cancelar
          </v-btn>
          <v-btn
            @click="addSubcategory"
            color="primary"
            variant="flat"
            :disabled="!newSubcategoryName.trim()"
          >
            Agregar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reset Categories Dialog -->
    <ResetCategoriesDialog 
      v-model="showResetDialog" 
      @confirm="handleResetCategories"
    />

    <!-- Delete Category/Subcategory Dialog -->
    <DeleteCategoryDialog 
      v-model="showDeleteDialog"
      :category-name="deleteTarget.categoryName"
      :subcategory-name="deleteTarget.subcategoryName"
      :type="deleteTarget.type"
      @confirm="handleDeleteConfirm"
    />
  </v-card>
</template>

<style scoped>
:deep(.v-tab) {
  text-transform: none;
}
</style>