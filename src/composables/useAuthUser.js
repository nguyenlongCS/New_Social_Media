/*
src/composables/useAuthUser.js - Composable quản lý auth user state
Giải quyết triệt để vấn đề user chưa được khởi tạo khi component mount
*/
import { ref, computed } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { useUsers } from './useUsers'

// Global auth state - chia sẻ giữa tất cả components
const currentUser = ref(null)
const isAuthReady = ref(false)
const isAuthLoading = ref(true)
let authUnsubscribe = null

export function useAuthUser() {
  const { syncUserToFirestore } = useUsers()
  
  // Computed properties
  const user = computed(() => currentUser.value)
  const isLoggedIn = computed(() => !!currentUser.value && isAuthReady.value)
  const userId = computed(() => currentUser.value?.uid || null)
  
  // Khởi tạo auth listener (chỉ chạy một lần)
  const initAuthListener = () => {
    if (authUnsubscribe) return // Đã được khởi tạo
    
    authUnsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        currentUser.value = authUser
        
        // Đồng bộ user data với Firestore nếu user đã đăng nhập
        if (authUser) {
          await syncUserToFirestore(authUser)
        }
        
      } catch (error) {
        console.warn('Failed to sync user on auth state change:', error)
      } finally {
        isAuthReady.value = true
        isAuthLoading.value = false
      }
    })
  }
  
  // Đợi user được khởi tạo (Promise-based)
  const waitForUser = () => {
    return new Promise((resolve) => {
      if (isAuthReady.value) {
        resolve(currentUser.value)
        return
      }
      
      // Khởi tạo listener nếu chưa có
      if (!authUnsubscribe) {
        initAuthListener()
      }
      
      // Đợi cho đến khi auth ready
      const unwatch = () => {
        if (isAuthReady.value) {
          resolve(currentUser.value)
        } else {
          setTimeout(unwatch, 50) // Kiểm tra lại sau 50ms
        }
      }
      unwatch()
    })
  }
  
  // Đợi user với timeout
  const waitForUserWithTimeout = (timeoutMs = 5000) => {
    return Promise.race([
      waitForUser(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), timeoutMs)
      )
    ])
  }
  
  // Cleanup auth listener
  const cleanup = () => {
    if (authUnsubscribe) {
      authUnsubscribe()
      authUnsubscribe = null
    }
  }
  
  // Reset auth state
  const resetAuthState = () => {
    currentUser.value = null
    isAuthReady.value = false
    isAuthLoading.value = true
  }
  
  // Auto-init khi composable được sử dụng
  if (!authUnsubscribe) {
    initAuthListener()
  }
  
  return {
    user,
    currentUser, // Raw ref cho trường hợp cần thiết
    isLoggedIn,
    isAuthReady,
    isAuthLoading,
    userId,
    waitForUser,
    waitForUserWithTimeout,
    initAuthListener,
    cleanup,
    resetAuthState
  }
}