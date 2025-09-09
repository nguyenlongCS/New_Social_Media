<!--
src/views/HomeView.vue - Refactored
Trang chính của social media interface
-->
<template>
  <div class="home-view">
    <Header />
    
    <div v-if="isAuthLoading" class="loading-overlay" style="top: 3.75rem; height: calc(100vh - 3.75rem);">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Đang tải...</p>
      </div>
    </div>
    
    <div v-else class="flex w-full min-h-screen pt-16">
      <LeftSide />
      <PostFeed />
      <RightSide />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import Header from '../components/Header.vue'
import LeftSide from '../components/LeftSide.vue'
import PostFeed from '../components/PostFeed.vue'
import RightSide from '../components/RightSide.vue'

export default {
  name: 'HomeView',
  components: {
    Header,
    LeftSide,
    PostFeed,
    RightSide
  },
  setup() {
    const isAuthLoading = ref(true)
    
    onMounted(() => {
      setTimeout(() => {
        isAuthLoading.value = false
      }, 500)
    })
    
    return {
      isAuthLoading
    }
  }
}
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: #f5f5f5;
}
</style>