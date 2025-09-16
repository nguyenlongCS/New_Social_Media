<!--
src/App.vue - Fixed Version với Touch
Root component với useAuthUser thay vì useAuth để quản lý auth state nhất quán
Tích hợp Touch component hiển thị trên tất cả trang trừ /login
-->
<template>
  <div id="app">
    <div v-if="isAuthLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Đang khởi tạo...</p>
      </div>
    </div>
    
    <router-view v-else />
    
    <!-- AssistiveTouch component - hiển thị trên tất cả trang trừ /login -->
    <AssistiveTouch />
  </div>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'
import { useAuthUser } from './composables/useAuthUser'
import AssistiveTouch from './components/Touch.vue'

export default {
  name: 'App',
  components: {
    AssistiveTouch
  },
  setup() {
    // Sử dụng useAuthUser thay vì useAuth để quản lý auth state nhất quán
    const { isAuthLoading, initAuthListener, cleanup } = useAuthUser()
    
    onMounted(() => {
      // Khởi tạo auth listener (tự động được gọi trong useAuthUser)
      initAuthListener()
    })

    onUnmounted(() => {
      cleanup()
    })
    
    return {
      isAuthLoading
    }
  }
}
</script>