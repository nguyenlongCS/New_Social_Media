<!-- src/views/HomeView.vue -->
<!-- Trang chính hiển thị giao diện social media -->

<template>
  <div class="home-view">
    <!-- Header -->
    <AppHeader />
    
    <div class="flex w-full min-h-screen pt-16">
      <!-- Menu bên trái -->
      <LeftSidebar />
      
      <!-- Feed chính -->
      <PostFeed />
      
      <!-- Panel bên phải -->
      <RightSidebar />
    </div>
  </div>
</template>

<script>
import AppHeader from '../components/AppHeader.vue'
import LeftSidebar from '../components/LeftSidebar.vue'
import PostFeed from '../components/PostFeed.vue'
import RightSidebar from '../components/RightSidebar.vue'

export default {
  name: 'HomeView',
  components: {
    AppHeader,
    LeftSidebar,
    PostFeed,
    RightSidebar
  }
}
</script>