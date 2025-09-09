<!--
src/components/PostFeed.vue - Refactored
Component hiển thị danh sách bài viết trong feed chính
-->
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
import PostItem from './PostItem.vue'
import { useSocialData } from '../composables/useSocialData'

export default {
  name: 'PostFeed',
  components: {
    PostItem
  },
  setup() {
    const { posts, selectedPostId, setSelectedPost } = useSocialData()
    
    // Xử lý khi post hiển thị trong viewport
    const handlePostVisible = (postId) => {
      setSelectedPost(postId)
    }
    
    // Xử lý like bài viết
    const handleLikePost = (postId) => {
      // Logic like sẽ được thêm sau
    }
    
    return {
      posts,
      selectedPostId,
      handlePostVisible,
      handleLikePost
    }
  }
}
</script>