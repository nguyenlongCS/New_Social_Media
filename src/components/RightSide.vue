<!-- src/components/RightSide.vue -->
<!-- Component sidebar bên phải hiển thị chi tiết bài viết -->

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
        </div>
      </div>
      
      <!-- Hiển thị message khi chưa chọn post -->
      <div v-else>
        <h3>Select a post to view details</h3>
      </div>
    </div>
    
    <!-- Input comment khi có post được chọn -->
    <input 
      v-if="selectedPost"
      type="text" 
      placeholder="Write a comment..."
      class="comment-input"
      v-model="commentText"
      @keyup.enter="handleAddComment"
    >
  </aside>
</template>

<script>
import { ref, computed } from 'vue'
import { useSocialData } from '../composables/useSocialData'

export default {
  name: 'RightSide',
  setup() {
    const commentText = ref('') // Text input comment
    
    // Sử dụng composable
    const { getSelectedPost } = useSocialData()
    
    // Computed để lấy post được chọn
    const selectedPost = computed(() => {
      return getSelectedPost()
    })
    
    return {
      commentText,
      selectedPost
    }
  },
  methods: {
    // Xử lý thêm comment
    handleAddComment() {
      if (this.commentText.trim()) {
        console.log('Add comment:', this.commentText)
        // Logic thêm comment sẽ được thêm sau
        this.commentText = ''
      }
    }
  }
}
</script>