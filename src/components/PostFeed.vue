<!-- src/components/PostFeed.vue -->
<!-- Component hiển thị danh sách bài viết trong feed chính -->

<template>
  <main class="main-feed">
    <PostItem 
      v-for="post in posts"
      :key="post.id"
      :post="post"
      :class="{ selected: selectedPostId === post.id }"
      @post-visible="handlePostVisible"
      @like-post="handleLikePost"
    />
  </main>
</template>

<script>
import { ref, onMounted } from 'vue'
import PostItem from './PostItem.vue'
import { useSocialData } from '../composables/useSocialData'

export default {
  name: 'PostFeed',
  components: {
    PostItem
  },
  setup() {
    // Sử dụng composable để quản lý posts và selection
    const { posts, selectedPostId, setSelectedPost } = useSocialData()
    
    return {
      posts,
      selectedPostId,
      setSelectedPost
    }
  },
  methods: {
    // Xử lý khi post hiển thị trong viewport
    handlePostVisible(postId) {
      this.setSelectedPost(postId)
    },
    
    // Xử lý like bài viết
    handleLikePost(postId) {
      console.log('Like post:', postId)
      // Logic like sẽ được thêm sau
    }
  }
}
</script>