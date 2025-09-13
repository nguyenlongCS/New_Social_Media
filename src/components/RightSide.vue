<!--
src/components/RightSide.vue - Final Fix Version  
Sidebar bên phải hiển thị chi tiết bài viết - Fix load comments bằng cách fetch trực tiếp từ Firestore
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
        <h4 class="comments-title">Comments ({{ comments.length }})</h4>
        
        <!-- Loading comments -->
        <div v-if="isLoadingComments" class="loading-comments">
          <div class="spinner-small"></div>
          <p>Đang tải bình luận...</p>
        </div>
        
        <!-- Comments list -->
        <div v-else-if="comments && comments.length > 0" class="comments-list">
          <div 
            v-for="comment in comments"
            :key="comment.id"
            class="comment"
          >
            <div class="comment-avatar">
              <img v-if="comment.avatar" :src="comment.avatar" alt="Avatar" class="avatar-img">
              <div v-else class="default-comment-avatar">{{ comment.user?.[0]?.toUpperCase() || 'U' }}</div>
            </div>
            <div class="comment-content">
              <p class="comment-user">{{ comment.user }}</p>
              <p class="comment-text">{{ comment.text }}</p>
            </div>
          </div>
        </div>
        
        <!-- No comments state -->
        <div v-else class="no-comments">
          <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        </div>
      </div>
      
      <!-- Hiển thị message khi chưa chọn post -->
      <div v-else>
        <h3>Chọn bài viết để xem chi tiết</h3>
        <p>Cuộn qua các bài viết bên trái để xem thông tin chi tiết và bình luận.</p>
      </div>
    </div>
    
    <!-- Input comment khi có post được chọn -->
    <div v-if="selectedPost" class="comment-input-section">
      <!-- Error message cho comment -->
      <div v-if="commentError" class="comment-error">
        {{ commentError }}
      </div>
      
      <div class="comment-input-container">
        <input 
          ref="commentInputRef"
          type="text" 
          placeholder="Viết bình luận..."
          class="comment-input"
          v-model="commentText"
          @keyup.enter="handleAddComment"
          :disabled="isAddingComment"
        >
        <button 
          @click="handleAddComment" 
          class="send-comment-btn"
          :disabled="!commentText.trim() || isAddingComment"
        >
          <span v-if="isAddingComment">Đang gửi...</span>
          <span v-else>Gửi</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script>
import { ref, watch, nextTick } from 'vue'
import { usePosts } from '../composables/usePosts'
import { useAuthUser } from '../composables/useAuthUser'
import { useComments } from '../composables/useComments'

export default {
  name: 'RightSide',
  setup() {
    const commentText = ref('')
    const commentInputRef = ref(null)
    const isLoadingComments = ref(false)
    const isAddingComment = ref(false)
    const commentError = ref('')
    
    // Local state cho comments
    const comments = ref([])
    
    // Sử dụng composables
    const { selectedPost } = usePosts()
    const { user } = useAuthUser()
    const { getPostComments, addComment } = useComments()
    
    // Function load comments từ Firestore
    const loadComments = async (postId) => {
      if (!postId) {
        comments.value = []
        return
      }
      
      isLoadingComments.value = true
      commentError.value = ''
      
      try {
        console.log('RightSide: Loading comments for post', postId)
        
        // Fetch comments từ Firestore collection 'comments' theo PostID
        const fetchedComments = await getPostComments(postId)
        
        console.log('RightSide: Fetched comments:', fetchedComments.length, fetchedComments)
        
        // Update local comments state
        comments.value = fetchedComments
        
      } catch (error) {
        console.error('Error loading comments:', error)
        commentError.value = 'Không thể tải bình luận'
        comments.value = []
      } finally {
        isLoadingComments.value = false
      }
    }
    
    // Watch selectedPost thay đổi và load comments
    watch(
      selectedPost, 
      async (newPost, oldPost) => {
        // Reset error khi chuyển post
        commentError.value = ''
        
        console.log('RightSide: selectedPost changed', {
          from: oldPost?.id,
          to: newPost?.id
        })
        
        if (newPost?.id !== oldPost?.id) {
          await loadComments(newPost?.id)
        }
      }, 
      { immediate: true }
    )
    
    // Xử lý thêm comment
    const handleAddComment = async () => {
      if (!commentText.value.trim()) {
        commentError.value = 'Vui lòng nhập bình luận'
        return
      }
      
      if (!selectedPost.value) {
        commentError.value = 'Không có bài viết được chọn'
        return
      }
      
      if (!user.value) {
        commentError.value = 'Bạn cần đăng nhập để bình luận'
        return
      }
      
      isAddingComment.value = true
      commentError.value = ''
      
      try {
        console.log('RightSide: Adding comment to post', selectedPost.value.id)
        
        // Thêm comment vào Firestore
        const newComment = await addComment(user.value, selectedPost.value.id, commentText.value)
        
        console.log('RightSide: Comment added:', newComment)
        
        // Thêm comment vào local state ngay lập tức
        comments.value.unshift(newComment)
        
        // Clear input
        commentText.value = ''
        
        // Focus lại vào input
        await nextTick()
        if (commentInputRef.value) {
          commentInputRef.value.focus()
        }
        
      } catch (error) {
        console.error('Error adding comment:', error)
        commentError.value = 'Không thể thêm bình luận. Vui lòng thử lại!'
      } finally {
        isAddingComment.value = false
      }
    }
    
    return {
      commentText,
      commentInputRef,
      isLoadingComments,
      isAddingComment,
      commentError,
      comments,
      selectedPost,
      handleAddComment
    }
  }
}
</script>

<style scoped>
.loading-comments {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 1rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.comments-list {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.comment {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  background: #f8fafc;
}

.comment-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.default-comment-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-user {
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.comment-text {
  font-size: 0.8125rem;
  color: #4b5563;
  margin: 0;
  line-height: 1.4;
  word-wrap: break-word;
}

.no-comments {
  text-align: center;
  padding: 2rem 1rem;
}

.no-comments p {
  color: #9ca3af;
  font-size: 0.875rem;
  font-style: italic;
  margin: 0;
}

.comment-input-section {
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.comment-error {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
  border: 1px solid #fecaca;
}

.comment-input-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.comment-input {
  flex: 1;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  background: #f1f5f9;
  border: 1px solid #d1d5db;
  font-size: 0.8125rem;
  color: #1e293b;
  outline: none;
  transition: border-color 0.2s ease;
}

.comment-input:focus {
  border-color: #2563eb;
  background: white;
}

.comment-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-comment-btn {
  padding: 0.375rem 0.75rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.send-comment-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.send-comment-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #9ca3af;
}

/* Scrollbar styling */
.comments-list::-webkit-scrollbar {
  width: 4px;
}

.comments-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.comments-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.comments-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>