/*
src/router/index.js - Router với route /admin mới và guard kiểm tra quyền admin
Thêm route /admin với meta requiresAdmin để kiểm tra quyền truy cập
*/
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import CreatePostView from '../views/CreatePostView.vue'
import DiscoverView from '../views/DiscoverView.vue'
import FriendsView from '../views/FriendsView.vue'
import NewsView from '../views/NewsView.vue'
import MessagesView from '../views/MessagesView.vue'
import AdminView from '../views/AdminView.vue'

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
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/create-post',
      name: 'createPost',
      component: CreatePostView,
      meta: { requiresAuth: true }
    },
    {
      path: '/discover',
      name: 'discover',
      component: DiscoverView,
      meta: { requiresAuth: true }
    },
    {
      path: '/friends',
      name: 'friends',
      component: FriendsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/news',
      name: 'news',
      component: NewsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/messages',
      name: 'messages',
      component: MessagesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true, requiresAdmin: true }
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

// Helper function để kiểm tra quyền admin
const checkAdminPermission = async (userId) => {
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const { db } = await import('@/firebase/config')
    
    const usersQuery = query(
      collection(db, 'users'),
      where('UserID', '==', userId)
    )
    
    const snapshot = await getDocs(usersQuery)
    
    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data()
      return userData.Role === 'admin'
    }
    
    return false
  } catch (error) {
    console.error('Error checking admin permission:', error)
    return false
  }
}

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
    
    // Kiểm tra auth cơ bản
    if (to.meta.requiresAuth && !user) {
      next('/login')
      return
    }
    
    if (to.meta.requiresGuest && user) {
      next('/home')
      return
    }
    
    // Kiểm tra quyền admin cho route /admin
    if (to.meta.requiresAdmin && user) {
      const isAdmin = await checkAdminPermission(user.uid)
      
      if (!isAdmin) {
        // Redirect về home nếu không có quyền admin
        next('/home')
        return
      }
    }
    
    next()
  } catch (error) {
    if (to.path !== '/login') {
      next('/login')
    } else {
      next()
    }
  }
})

export default router