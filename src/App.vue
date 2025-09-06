<!-- src/App.vue -->
<!-- Component chính của ứng dụng, xử lý auth state và routing -->

<template>
  <div id="app">
    <!-- Hiển thị loading đơn giản khi đang kiểm tra auth state -->
    <div v-if="isAuthLoading" class="auth-loading">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Đang kiểm tra đăng nhập...</p>
      </div>
    </div>
    
    <!-- Hiển thị app khi đã load xong auth state -->
    <router-view v-else />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    const isAuthLoading = ref(true)
    const { initAuth, user } = useAuth()
    
    onMounted(() => {
      // Khởi tạo auth với callback để xử lý khi auth state thay đổi
      initAuth(() => {
        // Khi auth state đã được xác định
        isAuthLoading.value = false
        
        // Xử lý redirect dựa trên auth state và route hiện tại
        const currentPath = router.currentRoute.value.path
        
        if (user.value) {
          // Đã đăng nhập
          if (currentPath === '/login' || currentPath === '/') {
            // Nếu đang ở login hoặc root, chuyển về home
            router.push('/home')
          }
          // Nếu đang ở trang khác (như /home), giữ nguyên
        } else {
          // Chưa đăng nhập
          if (currentPath !== '/login') {
            // Nếu không ở trang login, chuyển về login
            router.push('/login')
          }
        }
      })
    })
    
    return {
      isAuthLoading
    }
  }
}
</script>

<style scoped>
.auth-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 0.25rem solid #f3f4f6;
  border-top: 0.25rem solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}
</style>