<!-- src/views/LoginView.vue -->
<!-- Trang đăng nhập và đăng ký với Firebase Auth -->

<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Header với logo -->
      <div class="login-header">
        <h1 class="logo">Social Media</h1>
        <p class="subtitle">Kết nối với bạn bè và thế giới xung quanh</p>
      </div>
      
      <!-- Tab buttons -->
      <div class="tab-buttons">
        <button 
          :class="{ active: activeTab === 'login' }"
          @click="switchTab('login')"
        >
          Đăng nhập
        </button>
        <button 
          :class="{ active: activeTab === 'register' }"
          @click="switchTab('register')"
        >
          Đăng ký
        </button>
      </div>
      
      <!-- Form đăng nhập -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="login-email">Email</label>
          <input 
            id="login-email"
            type="email" 
            v-model="loginForm.email"
            placeholder="Nhập địa chỉ email"
            required
          >
        </div>
        
        <div class="form-group">
          <label for="login-password">Mật khẩu</label>
          <input 
            id="login-password"
            type="password" 
            v-model="loginForm.password"
            placeholder="Nhập mật khẩu"
            required
          >
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
        
        <!-- Hiển thị lỗi -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading">Đang đăng nhập...</span>
          <span v-else>Đăng nhập</span>
        </button>
      </form>
      
      <!-- Form đăng ký -->
      <form v-if="activeTab === 'register'" @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="register-email">Email</label>
          <input 
            id="register-email"
            type="email" 
            v-model="registerForm.email"
            placeholder="Nhập địa chỉ email"
            required
          >
        </div>
        
        <div class="form-group">
          <label for="register-password">Mật khẩu</label>
          <input 
            id="register-password"
            type="password" 
            v-model="registerForm.password"
            placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
            required
          >
        </div>
        
        <div class="form-group">
          <label for="confirm-password">Xác nhận mật khẩu</label>
          <input 
            id="confirm-password"
            type="password" 
            v-model="registerForm.confirmPassword"
            placeholder="Nhập lại mật khẩu"
            required
          >
        </div>
        
        <!-- Hiển thị lỗi -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <!-- Hiển thị lỗi confirm password -->
        <div v-if="passwordError" class="error-message">
          {{ passwordError }}
        </div>
        
        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading">Đang tạo tài khoản...</span>
          <span v-else>Đăng ký</span>
        </button>
      </form>
      
      <!-- Success message cho forgot password -->
      <div v-if="resetEmailSent" class="success-message">
        Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.
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
    const { login, register, resetPassword, isLoading, error, clearError } = useAuth()
    
    // State cho tabs và forms
    const activeTab = ref('login')
    const resetEmailSent = ref(false)
    
    // Form data cho đăng nhập
    const loginForm = ref({
      email: '',
      password: '',
      rememberMe: false
    })
    
    // Form data cho đăng ký
    const registerForm = ref({
      email: '',
      password: '',
      confirmPassword: ''
    })
    
    // Validation cho confirm password
    const passwordError = computed(() => {
      if (registerForm.value.confirmPassword && 
          registerForm.value.password !== registerForm.value.confirmPassword) {
        return 'Mật khẩu xác nhận không khớp'
      }
      return ''
    })
    
    return {
      activeTab,
      resetEmailSent,
      loginForm,
      registerForm,
      passwordError,
      isLoading,
      error,
      login,
      register,
      resetPassword,
      clearError,
      router
    }
  },
  methods: {
    // Chuyển đổi tab
    switchTab(tab) {
      this.activeTab = tab
      this.clearError()
      this.resetEmailSent = false
    },
    
    // Xử lý đăng nhập
    async handleLogin() {
      this.clearError()
      
      const result = await this.login(this.loginForm.email, this.loginForm.password)
      
      if (result.success) {
        // Chuyển về trang chủ sau khi đăng nhập thành công
        this.router.push('/home')
      }
    },
    
    // Xử lý đăng ký
    async handleRegister() {
      this.clearError()
      
      // Kiểm tra mật khẩu xác nhận
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        return
      }
      
      const result = await this.register(this.registerForm.email, this.registerForm.password)
      
      if (result.success) {
        // Reset form đăng ký
        this.registerForm.email = ''
        this.registerForm.password = ''
        this.registerForm.confirmPassword = ''
        
        // Chuyển về tab đăng nhập
        this.activeTab = 'login'
        this.resetEmailSent = false
        
        // Đợi một chút để Firebase Auth state cập nhật
        setTimeout(() => {
          // Hiển thị thông báo thành công
          alert('Đăng ký tài khoản thành công! Vui lòng đăng nhập để tiếp tục.')
        }, 100)
      }
    },
    
    // Xử lý quên mật khẩu
    async handleForgotPassword() {
      if (!this.loginForm.email) {
        alert('Vui lòng nhập email để đặt lại mật khẩu')
        return
      }
      
      const result = await this.resetPassword(this.loginForm.email)
      
      if (result.success) {
        this.resetEmailSent = true
        this.clearError()
      }
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

.login-card {
  background: white;
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175);
  width: 100%;
  max-width: 28rem;
  min-height: 32rem;
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
</style>