// src/composables/useAuth.js
// Composable quản lý authentication với Firebase
// Thêm chức năng đăng nhập bằng Facebook và Google

import { ref } from 'vue'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signInWithPopup,
  FacebookAuthProvider,
  GoogleAuthProvider
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
  
  // Đăng nhập với Facebook
  const loginWithFacebook = async () => {
    try {
      isLoading.value = true
      error.value = ''
      
      const provider = new FacebookAuthProvider()
      // Yêu cầu quyền truy cập email và thông tin công khai
      provider.addScope('email')
      provider.addScope('public_profile')
      
      const result = await signInWithPopup(auth, provider)
      user.value = result.user
      
      return { success: true, user: result.user }
    } catch (err) {
      error.value = getErrorMessage(err.code)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }
  
  // Đăng nhập với Google
  const loginWithGoogle = async () => {
    try {
      isLoading.value = true
      error.value = ''
      
      const provider = new GoogleAuthProvider()
      // Yêu cầu quyền truy cập email và profile
      provider.addScope('email')
      provider.addScope('profile')
      
      const result = await signInWithPopup(auth, provider)
      user.value = result.user
      
      return { success: true, user: result.user }
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
      case 'auth/popup-closed-by-user':
        return 'Cửa sổ đăng nhập đã bị đóng'
      case 'auth/popup-blocked':
        return 'Trình duyệt đã chặn cửa sổ popup'
      case 'auth/cancelled-popup-request':
        return 'Yêu cầu đăng nhập đã bị hủy'
      case 'auth/account-exists-with-different-credential':
        return 'Tài khoản đã tồn tại với phương thức đăng nhập khác'
      case 'auth/network-request-failed':
        return 'Lỗi kết nối mạng. Vui lòng thử lại'
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
    loginWithFacebook,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    initAuth,
    clearError
  }
}