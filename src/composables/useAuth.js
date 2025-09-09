/*
src/composables/useAuth.js - Fixed Version
Quản lý authentication với Firebase Auth - đã sửa lỗi handleSocialLogin
*/
import { ref } from 'vue'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth'
import { auth } from '@/firebase/config'

export function useAuth() {
  const user = ref(null)
  const isLoading = ref(false)
  let unsubscribe = null

  // Đăng nhập bằng email/password
  const loginWithEmail = async (email, password) => {
    if (!email || !password) throw new Error('Vui lòng nhập đầy đủ thông tin!')

    isLoading.value = true
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('Email không tồn tại!')
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Mật khẩu không đúng!')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email không hợp lệ!')
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Quá nhiều lần thử. Vui lòng thử lại sau!')
      } else {
        throw new Error('Đăng nhập thất bại!')
      }
    } finally {
      isLoading.value = false
    }
  }

  // Đăng ký bằng email/password
  const signupWithEmail = async (email, password, confirmPassword) => {
    if (!email || !password || !confirmPassword) throw new Error('Vui lòng nhập đầy đủ thông tin!')
    if (password !== confirmPassword) throw new Error('Mật khẩu không khớp!')
    if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự!')

    isLoading.value = true
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email đã được sử dụng!')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email không hợp lệ!')
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự!')
      } else {
        throw new Error('Đăng ký thất bại!')
      }
    } finally {
      isLoading.value = false
    }
  }

  // Đăng nhập Google
  const loginWithGoogle = async () => {
    isLoading.value = true
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      const result = await signInWithPopup(auth, provider)
      return result.user
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Đăng nhập bị hủy!')
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup bị chặn! Vui lòng cho phép popup.')
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại!')
      } else {
        throw new Error('Đăng nhập Google thất bại!')
      }
    } finally {
      isLoading.value = false
    }
  }

  // Đăng nhập Facebook
  const loginWithFacebook = async () => {
    isLoading.value = true
    try {
      const provider = new FacebookAuthProvider()
      provider.addScope('email')
      provider.addScope('public_profile')
      provider.setCustomParameters({ 'display': 'popup' })
      
      const result = await signInWithPopup(auth, provider)
      return result.user
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Đăng nhập bị hủy!')
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup bị chặn! Vui lòng cho phép popup.')
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('Tài khoản đã tồn tại với phương thức đăng nhập khác!')
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại!')
      } else {
        throw new Error('Đăng nhập Facebook thất bại!')
      }
    } finally {
      isLoading.value = false
    }
  }

  // Đặt lại mật khẩu
  const resetPassword = async (email) => {
    if (!email) throw new Error('Vui lòng nhập email!')
    
    isLoading.value = true
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('Email không tồn tại!')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email không hợp lệ!')
      } else {
        throw new Error('Gửi email đặt lại mật khẩu thất bại!')
      }
    } finally {
      isLoading.value = false
    }
  }

  // Đăng xuất
  const logout = async () => {
    isLoading.value = true
    try {
      await signOut(auth)
    } finally {
      isLoading.value = false
    }
  }

  // Khởi tạo auth state listener
  const initAuth = (callback) => {
    unsubscribe = onAuthStateChanged(auth, (authUser) => {
      user.value = authUser
      if (callback && typeof callback === 'function') {
        callback(authUser)
      }
    })
  }

  // Cleanup auth listener
  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  return {
    user,
    isLoading,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    loginWithFacebook,
    resetPassword,
    logout,
    initAuth,
    cleanup
  }
}