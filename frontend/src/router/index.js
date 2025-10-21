import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import MovimientosView from '../views/MovimientosView.vue'
import AhorrosView from '../views/AhorrosView.vue'
import ComprasView from '../views/ComprasView.vue'
import ProfileView from '../views/ProfileView.vue'
import SettingsView from '../views/SettingsView.vue'
import { auth } from '../services/firebaseConfig'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: LoginView, meta: { hideNavbar: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { hideNavbar: true } },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/movimientos', name: 'movimientos', component: MovimientosView, meta: { requiresAuth: true } },
  { path: '/ahorros', name: 'ahorros', component: AhorrosView, meta: { requiresAuth: true } },
  { path: '/compras', name: 'compras', component: ComprasView, meta: { requiresAuth: true } },
  { path: '/perfil', name: 'perfil', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/configuracion', name: 'configuracion', component: SettingsView, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const requiresAuth = to.matched.some((r) => r.meta?.requiresAuth)
  if (requiresAuth && !(auth && auth.currentUser)) {
    return { path: '/login' }
  }
})

export default router