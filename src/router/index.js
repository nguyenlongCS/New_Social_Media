/*
src/router/index.js - Router với admin guard cập nhật và thêm Settings route
Cập nhật để kiểm tra role admin từ collection users thay vì collection admin
Thêm route /settings cho trang cài đặt ứng dụng
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
import SettingsView from '../views/SettingsView.vue'

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
      path: '/settings',
      name: 'settings',
      component: SettingsView,
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

// Helper function để kiểm tra quyền admin từ collection users
const checkAdminPermission = async (userId) => {
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const { db } = await import('@/firebase/config')
    
    // Query collection users để tìm user với UserID và kiểm tra Role
    const usersQuery = query(
      collection(db, 'users'),
      where('UserID', '==', userId)
    )
    
    const snapshot = await getDocs(usersQuery)
    
    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data()
      // Kiểm tra field Role trong document user
      return userData.Role === 'admin'
    }
    
    return false
  } catch (error) {
    console.error('Error checking admin permission from users collection:', error)
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
    
    // Kiểm tra quyền admin cho route /admin từ collection users
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