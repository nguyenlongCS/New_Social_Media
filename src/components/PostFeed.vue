<!--
src/components/PostFeed.vue - Fixed Version
Component hiển thị danh sách bài viết với real-time data từ Firestore, load user liked posts
-->
<template>
  <main class="main-feed">
    <!-- Loading state -->
    <div v-if="isLoading && posts.length === 0" class="loading-posts">
      <div class="spinner"></div>
      <p>Đang tải bài viết...</p>
    </div>
    
    <!-- Posts list -->
    <PostItem 
      v-for="post in posts"
      :key="post.id"
      :post="post"
      :class="{ selected: selectedPostId === post.id }"
      @post-visible="handlePostVisible"
      @like-post="handleLikePost"
    />
    
    <!-- Empty state -->
    <div v-if="!isLoading && posts.length === 0" class="empty-posts">
      <h3>Chưa có bài viết nào</h3>
      <p>Hãy là người đầu tiên chia sẻ khoảnh khắc của bạn!</p>
    </div>
  </main>
</template>

<script>
import { onMounted, onUnmounted, watch } from 'vue'
import PostItem from './PostItem.vue'
import { usePosts } from '../composables/usePosts'
import { useAuthUser } from '../composables/useAuthUser'

export default {
  name: 'PostFeed',
  components: {
    PostItem
  },
  setup() {
    // Sử dụng trực tiếp usePosts
    const { 
      posts, 
      isLoading, 
      hasMore,
      selectedPostId, 
      loadPosts,
      loadMorePosts,
      loadUserLikedPosts,
      setSelectedPost,
      toggleLike,
      cleanup
    } = usePosts()
    
    // Lấy thông tin user để truyền vào like function
    const { user } = useAuthUser()
    
    // Load posts khi component mount
    onMounted(() => {
      console.log('PostFeed mounted, posts length:', posts.value.length)
      if (posts.value.length === 0) {
        loadPosts(10) // Load 10 posts đầu tiên
      }
    })
    
    // Watch user để load liked posts khi user đã sẵn sàng
    watch(user, async (newUser) => {
      if (newUser && posts.value.length > 0) {
        console.log('PostFeed: Loading user liked posts for', newUser.uid)
        await loadUserLikedPosts(newUser)
      }
    }, { immediate: true })
    
    // Watch posts để load liked status khi posts đã load
    watch(posts, async (newPosts) => {
      if (user.value && newPosts.length > 0) {
        console.log('PostFeed: Posts loaded, loading liked status')
        await loadUserLikedPosts(user.value)
      }
    }, { immediate: true })
    
    // Cleanup khi component unmount
    onUnmounted(() => {
      cleanup()
    })
    
    // Xử lý khi post hiển thị trong viewport
    const handlePostVisible = (postId) => {
      console.log('PostFeed - Post visible:', postId)
      setSelectedPost(postId)
    }
    
    // Xử lý like bài viết với user authentication
    const handleLikePost = (postId) => {
      if (user.value) {
        toggleLike(postId, user.value)
      } else {
        console.warn('User not logged in')
      }
    }
    
    // Xử lý load thêm posts
    const handleLoadMore = async () => {
      await loadMorePosts(10)
      
      // Load liked status cho posts mới
      if (user.value) {
        await loadUserLikedPosts(user.value)
      }
    }
    
    return {
      posts,
      isLoading,
      hasMore,
      selectedPostId,
      handlePostVisible,
      handleLikePost,
      handleLoadMore
    }
  }
}
</script>

<style scoped>
.loading-posts,
.empty-posts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.loading-posts .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-posts p,
.empty-posts p {
  color: #6b7280;
  margin: 0;
}

.empty-posts h3 {
  color: #374151;
  margin: 0 0 0.5rem 0;
}
</style>