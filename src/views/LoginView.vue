<!--
src/views/LoginView.vue - Refactored
Trang đăng nhập/đăng ký với error handling đơn giản
-->
<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-card">
        <!-- Header -->
        <div class="login-header">
          <h1 class="logo">Social Media</h1>
          <p class="subtitle">Kết nối với bạn bè và thế giới xung quanh</p>
        </div>

        <!-- Tab buttons -->
        <div class="tab-buttons">
          <button :class="{ active: activeTab === 'login' }" @click="switchTab('login')">
            Đăng nhập
          </button>
          <button :class="{ active: activeTab === 'register' }" @click="switchTab('register')">
            Đăng ký
          </button>
        </div>

        <!-- Form đăng nhập -->
        <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="login-email">Email</label>
            <input id="login-email" type="email" v-model="loginForm.email" placeholder="Nhập địa chỉ email" required>
          </div>

          <div class="form-group">
            <label for="login-password">Mật khẩu</label>
            <input id="login-password" type="password" v-model="loginForm.password" placeholder="Nhập mật khẩu"
              required>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="loginForm.rememberMe">
              <span class="checkmark"></span>
              Ghi nhớ đăng nhập
            </label>

            <button type="button" class="forgot-password" @click="handleForgotPassword">
              Quên mật khẩu?
            </button>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            <span v-if="isLoading">Đang đăng nhập...</span>
            <span v-else>Đăng nhập</span>
          </button>

          <div class="divider"></div>

          <div class="social-buttons">
            <button type="button" class="social-btn facebook-btn" @click="handleFacebookLogin" :disabled="isLoading">
              <img src="/src/assets/icons/facebook.png" alt="Facebook" width="20" height="20">
              <span>Đăng nhập với Facebook</span>
            </button>

            <button type="button" class="social-btn google-btn" @click="handleGoogleLogin" :disabled="isLoading">
              <img src="/src/assets/icons/google.png" alt="Google" width="20" height="20">
              <span>Đăng nhập với Google</span>
            </button>
          </div>
        </form>

        <!-- Form đăng ký -->
        <form v-if="activeTab === 'register'" @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="register-email">Email</label>
            <input id="register-email" type="email" v-model="registerForm.email" placeholder="Nhập địa chỉ email"
              required>
          </div>

          <div class="form-group">
            <label for="register-password">Mật khẩu</label>
            <input id="register-password" type="password" v-model="registerForm.password"
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)" required>
          </div>

          <div class="form-group">
            <label for="confirm-password">Xác nhận mật khẩu</label>
            <input id="confirm-password" type="password" v-model="registerForm.confirmPassword"
              placeholder="Nhập lại mật khẩu" required>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <div v-if="passwordError" class="error-message">
            {{ passwordError }}
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            <span v-if="isLoading">Đang tạo tài khoản...</span>
            <span v-else>Đăng ký</span>
          </button>

          <div class="divider">
            <span>hoặc</span>
          </div>

          <div class="social-buttons">
            <button type="button" class="social-btn facebook-btn" @click="handleFacebookLogin" :disabled="isLoading">
              <img src="/src/assets/icons/facebook.png" alt="Facebook" width="20" height="20">
              <span>Đăng ký với Facebook</span>
            </button>

            <button type="button" class="social-btn google-btn" @click="handleGoogleLogin" :disabled="isLoading">
              <img src="/src/assets/icons/google.png" alt="Google" width="20" height="20">
              <span>Đăng ký với Google</span>
            </button>
          </div>
        </form>

        <!-- Success message cho forgot password -->
        <div v-if="resetEmailSent" class="success-message">
          Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.
        </div>
      </div>
      <!-- Video bên phải -->
      <div class="intro-video">
        <video autoplay muted loop playsinline>
          <source src="/src/assets/videos/intro.mp4" type="video/mp4" />
          Trình duyệt của bạn không hỗ trợ video.
        </video>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter()
    const {
      loginWithEmail,
      signupWithEmail,
      loginWithFacebook,
      loginWithGoogle,
      resetPassword,
      isLoading
    } = useAuth()

    const activeTab = ref('login')
    const resetEmailSent = ref(false)
    const errorMessage = ref('')

    const loginForm = ref({
      email: '',
      password: '',
      rememberMe: false
    })

    const registerForm = ref({
      email: '',
      password: '',
      confirmPassword: ''
    })

    // Kiểm tra password confirm
    const passwordError = computed(() => {
      if (registerForm.value.confirmPassword &&
        registerForm.value.password !== registerForm.value.confirmPassword) {
        return 'Mật khẩu xác nhận không khớp'
      }
      return ''
    })

    // Xử lý đăng nhập
    const handleLogin = async () => {
      errorMessage.value = ''

      try {
        const user = await loginWithEmail(
          loginForm.value.email,
          loginForm.value.password
        )

        if (user) {
          router.push('/home')
        }
      } catch (error) {
        errorMessage.value = error.message || 'Đăng nhập thất bại!'
      }
    }

    // Xử lý đăng nhập Facebook
    const handleFacebookLogin = async () => {
      errorMessage.value = ''

      try {
        const user = await loginWithFacebook()
        if (user) {
          router.push('/home')
        }
      } catch (error) {
        errorMessage.value = error.message || 'Đăng nhập Facebook thất bại!'
      }
    }

    // Xử lý đăng nhập Google
    const handleGoogleLogin = async () => {
      errorMessage.value = ''

      try {
        const user = await loginWithGoogle()
        if (user) {
          router.push('/home')
        }
      } catch (error) {
        errorMessage.value = error.message || 'Đăng nhập Google thất bại!'
      }
    }

    // Xử lý đăng ký
    const handleRegister = async () => {
      errorMessage.value = ''

      if (registerForm.value.password !== registerForm.value.confirmPassword) {
        return
      }

      try {
        const user = await signupWithEmail(
          registerForm.value.email,
          registerForm.value.password,
          registerForm.value.confirmPassword
        )

        if (user) {
          registerForm.value.email = ''
          registerForm.value.password = ''
          registerForm.value.confirmPassword = ''
          activeTab.value = 'login'
          resetEmailSent.value = false
          alert('Đăng ký thành công!')
        }
      } catch (error) {
        errorMessage.value = error.message || 'Đăng ký thất bại!'
      }
    }

    // Xử lý quên mật khẩu
    const handleForgotPassword = async () => {
      if (!loginForm.value.email) {
        errorMessage.value = 'Vui lòng nhập email để đặt lại mật khẩu'
        return
      }

      try {
        await resetPassword(loginForm.value.email)
        resetEmailSent.value = true
        errorMessage.value = ''
      } catch (error) {
        errorMessage.value = error.message || 'Gửi email đặt lại mật khẩu thất bại!'
      }
    }

    // Chuyển đổi tab
    const switchTab = (tab) => {
      activeTab.value = tab
      errorMessage.value = ''
      resetEmailSent.value = false
    }

    return {
      activeTab,
      resetEmailSent,
      errorMessage,
      loginForm,
      registerForm,
      passwordError,
      isLoading,
      handleLogin,
      handleFacebookLogin,
      handleGoogleLogin,
      handleRegister,
      handleForgotPassword,
      switchTab
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-wrapper {
  display: flex;
  align-items: stretch; /* để video cao bằng login-card */
  gap: 2rem;
  max-width: 100rem;
  width: 100%;
}

.login-card {
  background: white;
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175);
  width: 100%;
  max-width: 28rem;
  min-height: 32rem;
  flex: 0 0 28rem; /* giữ kích thước như cũ */
}

.intro-video {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.intro-video video {
  width: 100%;
  height: 100%;
  object-fit: cover; /* cho video lấp đầy vùng hiển thị */
  border-radius: 1rem;
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.tab-buttons {
  display: flex;
  margin-bottom: 2rem;
  border-radius: 0.5rem;
  background: #f1f5f9;
  padding: 0.25rem;
}

.tab-buttons button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-buttons button.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  padding: 0.75rem;
  border: 0.0625rem solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 0.1875rem rgba(37, 99, 235, 0.1);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
}

.forgot-password {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

.submit-btn {
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.submit-btn:hover {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  border: 0.0625rem solid #fecaca;
}

.success-message {
  background: #f0fdf4;
  color: #16a34a;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  border: 0.0625rem solid #bbf7d0;
  margin-top: 1rem;
}

.divider {
  position: relative;
  text-align: center;
  margin: 1rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 0.0625rem;
  background: #e5e7eb;
}

.divider span {
  background: white;
  padding: 0 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 0.0625rem solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.social-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.social-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.facebook-btn {
  color: #1877f2;
}

.facebook-btn:hover {
  background: #f0f6ff;
  border-color: #1877f2;
}

.google-btn {
  color: #4285f4;
}

.google-btn:hover {
  background: #f0f6ff;
  border-color: #4285f4;
}
</style>