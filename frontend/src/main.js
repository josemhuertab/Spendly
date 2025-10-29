import './assets/tailwind.css'
import './assets/main.css'
import './assets/theme.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { createPinia } from 'pinia'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'spendlyLight',
    themes: {
      spendlyLight: {
        dark: false,
        colors: {
          primary: '#54B435',
          secondary: '#379237',
          accent: '#82CD47',
          background: '#FFFFFF',
          surface: '#FFFFFF',
          success: '#54B435',
          error: '#ef4444',
          warning: '#f59e0b',
          info: '#3b82f6',
        },
      },
      spendlyDark: {
        dark: true,
        colors: {
          primary: '#10b981',
          secondary: '#059669',
          accent: '#22c55e',
          background: '#0f172a',
          surface: '#1e293b',
          success: '#22c55e',
          error: '#f87171',
          warning: '#fbbf24',
          info: '#60a5fa',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
