<!-- src/views/HomeView.vue -->
<!-- Trang chính hiển thị giao diện social media -->

<template>
  <div class="home-view">
    <!-- Header -->
    <Header />
    
    <div class="flex w-full min-h-screen pt-16">
      <!-- Menu bên trái -->
      <LeftSide.vue />
      
      <!-- Feed chính -->
      <PostFeed />
      
      <!-- Panel bên phải -->
      <RightSide />
    </div>
  </div>
</template>

<script>
import Header from '../components/Header.vue'
import LeftSide.vue from '../components/LeftSide.vue.vue'
import PostFeed from '../components/PostFeed.vue'
import RightSide from '../components/RightSide.vue'

export default {
  name: 'HomeView',
  components: {
    Header,
    LeftSide.vue,
    PostFeed,
    RightSide
  }
}
</script>