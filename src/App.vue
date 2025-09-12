<!--
src/App.vue - Fixed Version
Root component với useAuthUser thay vì useAuth để quản lý auth state nhất quán
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
  </div>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'
import { useAuthUser } from './composables/useAuthUser'

export default {
  name: 'App',
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