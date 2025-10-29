import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import { saveUserCategories, getUserCategories } from '../services/firestoreService'

export const useCategoryStore = defineStore('categories', {
  state: () => ({
    expenseCategories: [
      'Alimentación',
      'Transporte', 
      'Vivienda',
      'Salud',
      'Entretenimiento',
      'Educación',
      'Ropa',
      'Servicios',
      'Otros gastos'
    ],
    incomeCategories: [
      'Salario',
      'Freelance',
      'Inversiones',
      'Ventas',
      'Regalos',
      'Otros ingresos'
    ],
    subcategories: {
      // Subcategorías por defecto para gastos
      'Alimentación': ['Supermercado', 'Restaurantes', 'Comida rápida', 'Delivery'],
      'Transporte': ['Combustible', 'Transporte público', 'Taxi/Uber', 'Mantenimiento vehículo'],
      'Vivienda': ['Alquiler', 'Servicios básicos', 'Internet', 'Mantenimiento'],
      'Salud': ['Medicamentos', 'Consultas médicas', 'Seguro médico', 'Emergencias'],
      'Entretenimiento': ['Cine', 'Streaming', 'Juegos', 'Deportes', 'Salidas'],
      'Educación': ['Cursos', 'Libros', 'Material escolar', 'Certificaciones'],
      'Ropa': ['Ropa casual', 'Ropa formal', 'Calzado', 'Accesorios'],
      'Servicios': ['Telefonía', 'Seguros', 'Bancarios', 'Profesionales'],
      'Otros gastos': ['Regalos', 'Donaciones', 'Varios'],
      
      // Subcategorías por defecto para ingresos
      'Salario': ['Sueldo base', 'Bonos', 'Horas extra', 'Aguinaldo'],
      'Freelance': ['Proyectos', 'Consultoría', 'Servicios'],
      'Inversiones': ['Dividendos', 'Intereses', 'Ganancias capital'],
      'Ventas': ['Productos', 'Servicios', 'Comisiones'],
      'Regalos': ['Dinero recibido', 'Obsequios'],
      'Otros ingresos': ['Reembolsos', 'Varios']
    },
    loading: false,
    error: null
  }),

  getters: {
    getExpenseCategories: (state) => state.expenseCategories,
    getIncomeCategories: (state) => state.incomeCategories,
    
    getSubcategoriesForCategory: (state) => (category) => {
      return state.subcategories[category] || []
    },
    
    getAllCategories: (state) => {
      return [...state.expenseCategories, ...state.incomeCategories]
    }
  },

  actions: {
    // Cargar categorías personalizadas del usuario desde Firebase
    async loadUserCategories() {
      const userStore = useUserStore()
      if (!userStore.userId) {
        console.log('No user ID found, skipping category load')
        return
      }

      this.loading = true
      this.error = null

      try {
        // Limpiar localStorage legacy si existe
        const legacyKey = `categories_${userStore.userId}`
        if (localStorage.getItem(legacyKey)) {
          localStorage.removeItem(legacyKey)
        }

        const savedCategories = await getUserCategories(userStore.userId)
        
        if (savedCategories) {
          if (savedCategories.expenseCategories) this.expenseCategories = savedCategories.expenseCategories
          if (savedCategories.incomeCategories) this.incomeCategories = savedCategories.incomeCategories
          if (savedCategories.subcategories) this.subcategories = savedCategories.subcategories
        }
      } catch (error) {
        console.error('Error loading user categories:', error)
        this.error = 'Error al cargar las categorías personalizadas'
      } finally {
        this.loading = false
      }
    },

    // Guardar categorías personalizadas del usuario en Firebase
    async saveUserCategories() {
      const userStore = useUserStore()
      if (!userStore.userId) {
        console.log('No user ID found, skipping category save')
        return
      }

      const categoriesToSave = {
        expenseCategories: this.expenseCategories,
        incomeCategories: this.incomeCategories,
        subcategories: this.subcategories
      }

      try {
        await saveUserCategories(userStore.userId, categoriesToSave)
      } catch (error) {
        console.error('Error saving user categories:', error)
        this.error = 'Error al guardar las categorías personalizadas'
        throw error
      }
    },

    // Agregar nueva categoría
    async addCategory(type, categoryName) {
      if (!categoryName || categoryName.trim() === '') return false
      
      const trimmedName = categoryName.trim()
      const categories = type === 'gasto' ? this.expenseCategories : this.incomeCategories
      
      if (categories.includes(trimmedName)) return false
      
      categories.push(trimmedName)
      
      // Inicializar subcategorías vacías para la nueva categoría
      if (!this.subcategories[trimmedName]) {
        this.subcategories[trimmedName] = []
      }
      
      await this.saveUserCategories()
      return true
    },

    // Eliminar categoría
    async removeCategory(type, categoryName) {
      const categories = type === 'gasto' ? this.expenseCategories : this.incomeCategories
      const index = categories.indexOf(categoryName)
      
      if (index > -1) {
        categories.splice(index, 1)
        // También eliminar las subcategorías asociadas
        delete this.subcategories[categoryName]
        await this.saveUserCategories()
        return true
      }
      return false
    },

    // Agregar subcategoría
    async addSubcategory(categoryName, subcategoryName) {
      if (!subcategoryName || subcategoryName.trim() === '') return false
      
      const trimmedName = subcategoryName.trim()
      
      if (!this.subcategories[categoryName]) {
        this.subcategories[categoryName] = []
      }
      
      if (this.subcategories[categoryName].includes(trimmedName)) return false
      
      this.subcategories[categoryName].push(trimmedName)
      await this.saveUserCategories()
      return true
    },

    // Eliminar subcategoría
    async removeSubcategory(categoryName, subcategoryName) {
      if (!this.subcategories[categoryName]) return false
      
      const index = this.subcategories[categoryName].indexOf(subcategoryName)
      if (index > -1) {
        this.subcategories[categoryName].splice(index, 1)
        await this.saveUserCategories()
        return true
      }
      return false
    },

    // Resetear a categorías por defecto
    async resetToDefaults() {
      this.expenseCategories = [
        'Alimentación',
        'Transporte', 
        'Vivienda',
        'Salud',
        'Entretenimiento',
        'Educación',
        'Ropa',
        'Servicios',
        'Otros gastos'
      ]
      
      this.incomeCategories = [
        'Salario',
        'Freelance',
        'Inversiones',
        'Ventas',
        'Regalos',
        'Otros ingresos'
      ]
      
      this.subcategories = {
        'Alimentación': ['Supermercado', 'Restaurantes', 'Comida rápida', 'Delivery'],
        'Transporte': ['Combustible', 'Transporte público', 'Taxi/Uber', 'Mantenimiento vehículo'],
        'Vivienda': ['Alquiler', 'Servicios básicos', 'Internet', 'Mantenimiento'],
        'Salud': ['Medicamentos', 'Consultas médicas', 'Seguro médico', 'Emergencias'],
        'Entretenimiento': ['Cine', 'Streaming', 'Juegos', 'Deportes', 'Salidas'],
        'Educación': ['Cursos', 'Libros', 'Material escolar', 'Certificaciones'],
        'Ropa': ['Ropa casual', 'Ropa formal', 'Calzado', 'Accesorios'],
        'Servicios': ['Telefonía', 'Seguros', 'Bancarios', 'Profesionales'],
        'Otros gastos': ['Regalos', 'Donaciones', 'Varios'],
        'Salario': ['Sueldo base', 'Bonos', 'Horas extra', 'Aguinaldo'],
        'Freelance': ['Proyectos', 'Consultoría', 'Servicios'],
        'Inversiones': ['Dividendos', 'Intereses', 'Ganancias capital'],
        'Ventas': ['Productos', 'Servicios', 'Comisiones'],
        'Regalos': ['Dinero recibido', 'Obsequios'],
        'Otros ingresos': ['Reembolsos', 'Varios']
      }
      
      await this.saveUserCategories()
    }
  }
})