/*
src/router/index.js
Router với auth guards
*/
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const { onAuthStateChanged } = await import('firebase/auth')
  const { auth } = await import('@/firebase/config')
  
  const checkAuthState = () => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe()
        resolve(user)
      })
    })
  }
  
  try {
    const user = await checkAuthState()
    
    if (to.meta.requiresAuth && !user) {
      next('/login')
      return
    }
    
    if (to.meta.requiresGuest && user) {
      next('/home')
      return
    }
    
    next()
  } catch (error) {
    console.error('Auth check error:', error)
    if (to.path !== '/login') {
      next('/login')
    } else {
      next()
    }
  }
})

export default router