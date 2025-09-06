// src/composables/useAuth.js
// Composable quản lý authentication với Firebase

import { ref } from 'vue'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '../firebase/config'

// State quản lý user và loading
const user = ref(null)
const isLoading = ref(false)
const error = ref('')

export function useAuth() {
  // Đăng nhập với email và password
  const login = async (email, password) => {
    try {
      isLoading.value = true
      error.value = ''
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      
      return { success: true, user: userCredential.user }
    } catch (err) {
      error.value = getErrorMessage(err.code)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }
  
  // Đăng ký tài khoản mới
  const register = async (email, password) => {
    try {
      isLoading.value = true
      error.value = ''
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      
      return { success: true, user: userCredential.user }
    } catch (err) {
      error.value = getErrorMessage(err.code)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }
  
  // Đăng xuất
  const logout = async () => {
    try {
      await signOut(auth)
      user.value = null
      return { success: true }
    } catch (err) {
      error.value = getErrorMessage(err.code)
      return { success: false, error: error.value }
    }
  }
  
  // Gửi email reset password
  const resetPassword = async (email) => {
    try {
      isLoading.value = true
      error.value = ''
      
      await sendPasswordResetEmail(auth, email)
      return { success: true }
    } catch (err) {
      error.value = getErrorMessage(err.code)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }
  
  // Theo dõi trạng thái authentication
  const initAuth = (callback) => {
    onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      
      // Gọi callback nếu có
      if (callback && typeof callback === 'function') {
        callback(firebaseUser)
      }
    })
  }
  
  // Chuyển đổi error code thành message tiếng Việt
  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Không tìm thấy tài khoản với email này'
      case 'auth/wrong-password':
        return 'Mật khẩu không chính xác'
      case 'auth/email-already-in-use':
        return 'Email đã được sử dụng cho tài khoản khác'
      case 'auth/weak-password':
        return 'Mật khẩu quá yếu (tối thiểu 6 ký tự)'
      case 'auth/invalid-email':
        return 'Địa chỉ email không hợp lệ'
      case 'auth/too-many-requests':
        return 'Quá nhiều lần thử. Vui lòng thử lại sau'
      default:
        return 'Đã xảy ra lỗi. Vui lòng thử lại'
    }
  }
  
  // Clear error
  const clearError = () => {
    error.value = ''
  }
  
  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    resetPassword,
    initAuth,
    clearError
  }
}