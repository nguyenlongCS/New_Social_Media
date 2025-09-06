<!-- src/views/HomeView.vue -->
<!-- Trang chính hiển thị giao diện social media -->

<template>
  <div class="home-view">
    <!-- Header -->
    <Header />
    
    <div class="flex w-full min-h-screen pt-16">
      <!-- Menu bên trái -->
      <LeftSide />
      
      <!-- Feed chính -->
      <PostFeed />
      
      <!-- Panel bên phải -->
      <RightSide />
    </div>
  </div>
</template>

<script>
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
  }
}
</script>