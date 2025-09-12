<!--
src/components/RightSide.vue - Updated Version
Sidebar bên phải hiển thị chi tiết bài viết sử dụng shared posts instance
-->
<template>
  <aside class="right-panel">
    <div id="post-info" class="post-details">
      <!-- Hiển thị chi tiết post được chọn -->
      <div v-if="selectedPost">
        <h3 class="post-title">{{ selectedPost.title }}</h3>
        <p class="post-content">{{ selectedPost.content }}</p>
        <hr>
        <p class="likes">{{ selectedPost.likes }} Likes</p>
        <hr>
        <h4 class="comments-title">Comments</h4>
        <div>
          <div 
            v-for="comment in selectedPost.comments"
            :key="comment.id || comment.user"
            class="comment"
          >
            <div class="comment-avatar"></div>
            <div>
              <p class="comment-user">{{ comment.user }}</p>
              <p class="comment-text">{{ comment.text }}</p>
            </div>
          </div>
          
          <!-- Placeholder comments nếu chưa có comments -->
          <div v-if="selectedPost.comments.length === 0" class="no-comments">
            <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          </div>
        </div>
      </div>
      
      <!-- Hiển thị message khi chưa chọn post -->
      <div v-else>
        <h3>Chọn bài viết để xem chi tiết</h3>
        <p>Cuộn qua các bài viết bên trái để xem thông tin chi tiết và bình luận.</p>
      </div>
    </div>
    
    <!-- Input comment khi có post được chọn -->
    <input 
      v-if="selectedPost"
      type="text" 
      placeholder="Viết bình luận..."
      class="comment-input"
      v-model="commentText"
      @keyup.enter="handleAddComment"
    >
  </aside>
</template>

<script>
import { ref, watch } from 'vue'
import { usePosts } from '../composables/usePosts'

export default {
  name: 'RightSide',
  setup() {
    const commentText = ref('')
    
    // Sử dụng trực tiếp usePosts
    const { selectedPost } = usePosts()
    
    // Debug: theo dõi selectedPost thay đổi
    watch(selectedPost, (newPost, oldPost) => {
      console.log('RightSide - Selected post changed from', oldPost?.id, 'to', newPost?.id, newPost?.title)
    }, { immediate: true })
    
    // Xử lý thêm comment
    const handleAddComment = () => {
      if (commentText.value.trim()) {
        // TODO: Implement add comment functionality
        console.log('Add comment:', commentText.value, 'to post:', selectedPost.value?.id)
        commentText.value = ''
      }
    }
    
    return {
      commentText,
      selectedPost,
      handleAddComment
    }
  }
}
</script>

<style scoped>
.no-comments {
  text-align: center;
  padding: 1rem 0;
}

.no-comments p {
  color: #9ca3af;
  font-size: 0.875rem;
  font-style: italic;
  margin: 0;
}
</style>