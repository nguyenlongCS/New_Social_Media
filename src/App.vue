<!--
src/App.vue - Refactored
Root component với auth state management đơn giản
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from './composables/useAuth'

export default {
  name: 'App',
  setup() {
    const isAuthLoading = ref(true)
    const { initAuth, cleanup } = useAuth()
    
    onMounted(() => {
      try {
        initAuth(() => {
          isAuthLoading.value = false
        })
      } catch (error) {
        isAuthLoading.value = false
      }
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