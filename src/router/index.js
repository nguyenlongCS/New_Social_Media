// src/router/index.js
// Cấu hình routing cho ứng dụng

import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import { useAuth } from '../composables/useAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login' // Redirect từ / về /login
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true } // Yêu cầu đăng nhập
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true } // Chỉ cho phép khi chưa đăng nhập
    }
  ]
})

// Navigation guards để kiểm tra authentication
router.beforeEach((to, from, next) => {
  const { user } = useAuth()
  
  // Route yêu cầu đăng nhập
  if (to.meta.requiresAuth && !user.value) {
    next('/login')
    return
  }
  
  // Route chỉ cho guest (chưa đăng nhập)
  // Chỉ redirect nếu không phải từ register action
  if (to.meta.requiresGuest && user.value) {
    // Kiểm tra nếu đang từ register, không redirect ngay
    if (from.path === '/login' && to.path === '/login') {
      next()
      return
    }
    next('/home')
    return
  }
  
  next()
})

export default router