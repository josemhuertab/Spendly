import { computed } from 'vue'
import { useThemeStore } from '../store/themeStore'

export function useAppTheme() {
  const themeStore = useThemeStore()
  
  const isDark = computed(() => themeStore.isDark)
  const colors = computed(() => themeStore.colors)
  
  // Clases CSS dinámicas
  const themeClasses = computed(() => ({
    background: isDark.value ? 'theme-bg' : 'bg-white',
    surface: isDark.value ? 'theme-surface' : 'bg-white',
    card: isDark.value ? 'theme-card' : 'bg-white',
    textPrimary: isDark.value ? 'theme-text-primary' : 'text-gray-900',
    textSecondary: isDark.value ? 'theme-text-secondary' : 'text-gray-600',
    textMuted: isDark.value ? 'theme-text-muted' : 'text-gray-500',
    border: isDark.value ? 'theme-border' : 'border-gray-200',
    borderLight: isDark.value ? 'theme-border-light' : 'border-gray-100',
  }))
  
  // Estilos inline para casos específicos
  const themeStyles = computed(() => ({
    background: { backgroundColor: colors.value.background },
    surface: { backgroundColor: colors.value.surface },
    card: { backgroundColor: colors.value.cardBackground },
    textPrimary: { color: colors.value.textPrimary },
    textSecondary: { color: colors.value.textSecondary },
    textMuted: { color: colors.value.textMuted },
    border: { borderColor: colors.value.border },
  }))
  
  return {
    isDark,
    colors,
    themeClasses,
    themeStyles,
    toggleTheme: () => themeStore.toggleTheme(),
    setTheme: (dark) => themeStore.setTheme(dark)
  }
}