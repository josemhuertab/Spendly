import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import DashboardView from '../views/DashboardView.vue'
import MovimientosView from '../views/MovimientosView.vue'
import AhorrosView from '../views/AhorrosView.vue'
import ComprasView from '../views/ComprasView.vue'
import ProfileView from '../views/ProfileView.vue'
import SettingsView from '../views/SettingsView.vue'
import { useUserStore } from '../store/userStore'

const routes = [
  { 
    path: '/', 
    redirect: (to) => {
      // Redirect to dashboard if authenticated, otherwise to login
      const userStore = useUserStore()
      return userStore.isAuthenticated ? '/dashboard' : '/login'
    }
  },
  { 
    path: '/login', 
    name: 'login', 
    component: LoginView, 
    meta: { 
      hideNavbar: true, 
      requiresGuest: true 
    } 
  },
  { 
    path: '/register', 
    name: 'register', 
    component: RegisterView, 
    meta: { 
      hideNavbar: true, 
      requiresGuest: true 
    } 
  },
  { 
    path: '/forgot-password', 
    name: 'forgot-password', 
    component: ForgotPasswordView, 
    meta: { 
      hideNavbar: true, 
      requiresGuest: true 
    } 
  },
  { 
    path: '/dashboard', 
    name: 'dashboard', 
    component: DashboardView, 
    meta: { 
      requiresAuth: true,
      title: 'Dashboard'
    } 
  },
  { 
    path: '/movimientos', 
    name: 'movimientos', 
    component: MovimientosView, 
    meta: { 
      requiresAuth: true,
      title: 'Movimientos'
    } 
  },
  { 
    path: '/ahorros', 
    name: 'ahorros', 
    component: AhorrosView, 
    meta: { 
      requiresAuth: true,
      title: 'Ahorros'
    } 
  },
  { 
    path: '/compras', 
    name: 'compras', 
    component: ComprasView, 
    meta: { 
      requiresAuth: true,
      title: 'Compras'
    } 
  },
  { 
    path: '/perfil', 
    name: 'perfil', 
    component: ProfileView, 
    meta: { 
      requiresAuth: true,
      title: 'Perfil'
    } 
  },
  { 
    path: '/configuracion', 
    name: 'configuracion', 
    component: SettingsView, 
    meta: { 
      requiresAuth: true,
      title: 'Configuración'
    } 
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Global navigation guard
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // Initialize user store if not already initialized
  if (!userStore.initialized) {
    await userStore.init()
  }
  
  // Wait for auth state to be ready
  if (userStore.loading) {
    // Show loading or wait for auth state
    await new Promise(resolve => {
      const unwatch = userStore.$subscribe((mutation, state) => {
        if (!state.loading) {
          unwatch()
          resolve()
        }
      })
    })
  }
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  const isAuthenticated = userStore.isAuthenticated
  
  // Handle authentication requirements
  if (requiresAuth && !isAuthenticated) {
    // User needs to be authenticated but isn't
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  if (requiresGuest && isAuthenticated) {
    // User is authenticated but trying to access guest-only pages
    next('/dashboard')
    return
  }
  
  // Set page title if provided
  if (to.meta.title) {
    document.title = `${to.meta.title} - Spendly`
  } else {
    document.title = 'Spendly'
  }
  
  next()
})

// Global after hook for additional cleanup or tracking
router.afterEach((to, from) => {
  // Navigation tracking can be added here if needed
})

export default router