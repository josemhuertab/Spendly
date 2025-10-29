<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    categoryName: {
        type: String,
        default: ''
    },
    subcategoryName: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: 'category'
    }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const loading = ref(false)

const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const isSubcategory = computed(() => props.type === 'subcategory')

const title = computed(() => {
    return isSubcategory.value
        ? `Eliminar Subcategoría "${props.subcategoryName}"`
        : `Eliminar Categoría "${props.categoryName}"`
})

const description = computed(() => {
    if (isSubcategory.value) {
        return `¿Estás seguro de que quieres eliminar la subcategoría "${props.subcategoryName}" de la categoría "${props.categoryName}"?`
    } else {
        return `¿Estás seguro de que quieres eliminar la categoría "${props.categoryName}" y todas sus subcategorías?`
    }
})

function closeDialog() {
    isOpen.value = false
    loading.value = false
}

async function confirmDelete() {
    loading.value = true
    try {
        // Emit the confirm event and wait for the parent to handle it
        emit('confirm')
        // Don't close immediately, let the parent handle the success/error
    } catch (error) {
        console.error('Error in confirmDelete:', error)
        loading.value = false
    }
}
</script>

<template>
    <v-dialog v-model="isOpen" max-width="500" persistent>
        <v-card class="rounded-xl overflow-hidden">
            <!-- Header -->
            <v-card-title class="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-red-400 bg-opacity-30 rounded-lg">
                        <v-icon size="24" color="white">
                            {{ isSubcategory ? 'mdi-tag-remove' : 'mdi-folder-remove' }}
                        </v-icon>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold">{{ title }}</h3>
                        <p class="text-red-100 text-sm mt-1">Esta acción no se puede deshacer</p>
                    </div>
                </div>
            </v-card-title>

            <v-card-text class="px-6 py-6">
                <!-- Descripción -->
                <div class="mb-4">
                    <p class="text-gray-700 mb-4">{{ description }}</p>
                </div>

                <!-- Advertencia -->
                <v-alert type="warning" variant="tonal" class="mb-4">
                    <template #prepend>
                        <v-icon>mdi-alert</v-icon>
                    </template>
                    <div class="text-sm">
                        <div v-if="isSubcategory" class="space-y-1">
                            <p><strong>Importante:</strong></p>
                            <p>• La subcategoría se eliminará permanentemente</p>
                            <p>• Las transacciones existentes con esta subcategoría mantendrán el valor</p>
                        </div>
                        <div v-else class="space-y-1">
                            <p><strong>Importante:</strong></p>
                            <p>• Se eliminará la categoría y <strong>todas sus subcategorías</strong></p>
                            <p>• Las transacciones existentes con esta categoría mantendrán el valor</p>
                            <p>• No podrás crear nuevas transacciones con esta categoría</p>
                        </div>
                    </div>
                </v-alert>
            </v-card-text>

            <!-- Acciones -->
            <v-card-actions class="px-6 py-4 bg-gray-50">
                <v-btn @click="closeDialog" variant="outlined" size="large" prepend-icon="mdi-close" class="flex-1">
                    Cancelar
                </v-btn>

                <v-btn @click="confirmDelete" color="error" variant="flat" size="large" :loading="loading"
                    prepend-icon="mdi-delete" class="flex-1">
                    Sí, Eliminar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>