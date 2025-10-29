import { defineStore } from 'pinia'
import { useTheme } from 'vuetify'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: false,
  }),

  getters: {
    currentTheme: (state) => state.isDark ? 'dark' : 'light',
    
    // Colores para modo claro
    lightColors: () => ({
      background: '#ffffff',
      surface: '#ffffff',
      cardBackground: '#ffffff',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      textMuted: '#9ca3af',
      border: '#e5e7eb',
      borderLight: '#f3f4f6',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
      primary: '#059669', // Verde principal
      primaryLight: '#d1fae5',
      primaryDark: '#047857',
    }),
    
    // Colores para modo oscuro
    darkColors: () => ({
      background: '#0f172a',
      surface: '#1e293b',
      cardBackground: '#334155',
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      border: '#475569',
      borderLight: '#64748b',
      success: '#22c55e',
      error: '#f87171',
      warning: '#fbbf24',
      info: '#60a5fa',
      primary: '#10b981', // Verde principal más brillante para modo oscuro
      primaryLight: '#064e3b',
      primaryDark: '#059669',
    }),
    
    // Colores actuales basados en el tema
    colors: (state) => {
      return state.isDark ? state.darkColors : state.lightColors
    }
  },

  actions: {
    toggleTheme() {
      this.isDark = !this.isDark
      this.applyTheme()
      this.saveThemePreference()
    },
    
    setTheme(isDark) {
      this.isDark = isDark
      this.applyTheme()
      this.saveThemePreference()
    },
    
    applyTheme() {
      // Aplicar clases CSS al documento
      const html = document.documentElement
      
      if (this.isDark) {
        html.classList.add('dark-theme')
        html.classList.remove('light-theme')
      } else {
        html.classList.add('light-theme')
        html.classList.remove('dark-theme')
      }
      
      // Aplicar variables CSS personalizadas
      const colors = this.colors
      const root = document.documentElement
      
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value)
      })
    },
    
    saveThemePreference() {
      localStorage.setItem('spendly-theme', this.isDark ? 'dark' : 'light')
    },
    
    loadThemePreference() {
      const saved = localStorage.getItem('spendly-theme')
      if (saved) {
        this.isDark = saved === 'dark'
      } else {
        // Detectar preferencia del sistema
        this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      this.applyTheme()
    },
    
    initTheme() {
      this.loadThemePreference()
      
      // Escuchar cambios en la preferencia del sistema
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('spendly-theme')) {
          this.isDark = e.matches
          this.applyTheme()
        }
      })
    }
  }
})