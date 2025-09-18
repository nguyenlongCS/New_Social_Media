<!--
src/views/CreatePostView.vue - Fixed Version
Trang tạo bài viết mới với auth user state management cải tiến
-->
<template>
  <div class="create-post-view">
    <Header />
    
    <!-- Loading khi đang kiểm tra auth -->
    <div v-if="isAuthLoading" class="loading-overlay" style="top: 3.75rem; height: calc(100vh - 3.75rem);">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Đang khởi tạo...</p>
      </div>
    </div>
    
    <div v-else class="create-post-container">
      <div class="create-post-card">
        <!-- Header -->
        <div class="create-post-header">
          <h1 class="page-title">Tạo bài viết mới</h1>
          <p class="page-subtitle">Chia sẻ khoảnh khắc của bạn với mọi người</p>
        </div>
        
        <!-- Media Upload Section -->
        <div class="media-upload-section">
          <div class="upload-area" @click="triggerFileInput" @drop="handleDrop" @dragover.prevent @dragenter.prevent>
            <input 
              ref="fileInput"
              type="file" 
              multiple 
              accept="image/*,video/*"
              @change="handleFileSelect"
              style="display: none;"
            >
            <div v-if="selectedFiles.length === 0" class="upload-placeholder">
              <div class="upload-icon">📁</div>
              <h3>Chọn ảnh hoặc video</h3>
              <p>Kéo thả hoặc click để chọn tệp</p>
              <p class="upload-limit">Tối đa 10 tệp</p>
            </div>
            
            <!-- Preview Carousel -->
            <div v-else class="media-preview">
              <div class="carousel-container">
                <div class="media-item" v-for="(file, index) in selectedFiles" :key="index">
                  <img v-if="file.type.startsWith('image/')" :src="file.preview" :alt="`Preview ${index + 1}`" class="preview-image">
                  <video v-else-if="file.type.startsWith('video/')" :src="file.preview" class="preview-video" controls></video>
                  <button class="remove-media" @click.stop="removeFile(index)">
                    <span class="close-icon">×</span>
                  </button>
                </div>
              </div>
              <div class="media-counter">{{ selectedFiles.length }}/10 tệp</div>
              <button class="add-more-btn" @click="triggerFileInput" :disabled="selectedFiles.length >= 10">
                Thêm tệp
              </button>
            </div>
          </div>
        </div>
        
        <!-- Post Content Form -->
        <form @submit.prevent="handleCreatePost" class="post-form">
          <div class="form-group">
            <label for="caption">Post Title</label>
            <input 
              id="caption"
              type="text" 
              v-model="postData.caption"
              placeholder="Enter a title for your post..."
              maxlength="200"
              required
            >
            <div class="char-counter">{{ postData.caption.length }}/200</div>
          </div>
          
          <div class="form-group">
            <label for="content">Post content</label>
            <textarea 
              id="content"
              v-model="postData.content"
              placeholder="Share your thoughts..."
              rows="5"
              maxlength="2000"
              required
            ></textarea>
            <div class="char-counter">{{ postData.content.length }}/2000</div>
          </div>
          
          <!-- Error message -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          
          <!-- Success message -->
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>
          
          <!-- Form actions -->
          <div class="form-actions">
            <button type="button" @click="resetForm" class="cancel-btn" :disabled="isUploading">
              Cancel
            </button>
            <button type="submit" :disabled="isUploading || selectedFiles.length === 0 || !isLoggedIn" class="publish-btn">
              <span v-if="isUploading">Đang đăng bài...</span>
              <span v-else-if="!isLoggedIn">Chưa đăng nhập</span>
              <span v-else>Post</span>
            </button>
          </div>
        </form>
        
        <!-- Upload Progress -->
        <div v-if="isUploading" class="upload-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
          </div>
          <p class="progress-text">Đang upload... {{ uploadProgress }}%</p>
        </div>
      </div>
    </div>

    <div>
      <LeftSide />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Header from '../components/Header.vue'
import LeftSide from '../components/LeftSide.vue'
import { useAuthUser } from '../composables/useAuthUser'
import { useCreatePost } from '../composables/useCreatePost'

export default {
  name: 'CreatePostView',
  components: {
    Header,
    LeftSide
  },
  setup() {
    const router = useRouter()
    const fileInput = ref(null)
    
    // Sử dụng useAuthUser thay vì useAuth
    const { 
      user, 
      isLoggedIn, 
      isAuthLoading, 
      waitForUserWithTimeout 
    } = useAuthUser()
    
    const {
      selectedFiles,
      postData,
      isUploading,
      uploadProgress,
      errorMessage,
      successMessage,
      createPost,
      addFiles,
      removeFile,
      resetForm: resetCreatePost
    } = useCreatePost()
    
    // Trigger file input
    const triggerFileInput = () => {
      if (fileInput.value && selectedFiles.value.length < 10) {
        fileInput.value.click()
      }
    }
    
    // Xử lý chọn file
    const handleFileSelect = async (event) => {
      const files = Array.from(event.target.files)
      await addFiles(files)
      // Reset input để có thể chọn cùng file lại
      event.target.value = ''
    }
    
    // Xử lý drag & drop
    const handleDrop = async (event) => {
      event.preventDefault()
      const files = Array.from(event.dataTransfer.files)
      await addFiles(files)
    }
    
    // Xử lý tạo bài viết với auth state management cải tiến
    const handleCreatePost = async () => {
      try {
        // Đợi user được khởi tạo (với timeout 5s)
        const currentUser = await waitForUserWithTimeout(5000)
        
        if (!currentUser) {
          errorMessage.value = 'Bạn cần đăng nhập để đăng bài'
          return
        }
        
        const success = await createPost(currentUser)
        if (success) {
          // Chuyển về trang chủ sau khi đăng bài thành công
          setTimeout(() => {
            router.push('/home')
          }, 2000)
        }
        
      } catch (error) {
        console.error('Error in handleCreatePost:', error)
        if (error.message === 'Auth timeout') {
          errorMessage.value = 'Không thể xác thực người dùng. Vui lòng đăng nhập lại.'
        } else {
          errorMessage.value = 'Có lỗi xảy ra khi đăng bài. Vui lòng thử lại.'
        }
      }
    }
    
    // Reset form
    const resetForm = () => {
      resetCreatePost()
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }
    
    // Kiểm tra auth state khi component mount
    onMounted(async () => {
      try {
        await waitForUserWithTimeout(3000)
      } catch (error) {
        console.warn('Auth check timeout on mount:', error)
      }
    })
    
    return {
      fileInput,
      user,
      isLoggedIn,
      isAuthLoading,
      selectedFiles,
      postData,
      isUploading,
      uploadProgress,
      errorMessage,
      successMessage,
      triggerFileInput,
      handleFileSelect,
      handleDrop,
      handleCreatePost,
      removeFile,
      resetForm
    }
  }
}
</script>

<style scoped>
.create-post-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 3.75rem;
}

.create-post-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.create-post-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
}

.create-post-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
}

.media-upload-section {
  margin-bottom: 2rem;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.upload-area:hover {
  border-color: #2563eb;
  background: #f8fafc;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  font-size: 48px;
  opacity: 0.5;
}

.upload-placeholder h3 {
  margin: 0;
  color: #374151;
  font-size: 1.125rem;
  font-weight: 600;
}

.upload-placeholder p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.upload-limit {
  color: #9ca3af !important;
  font-size: 0.75rem !important;
}

.media-preview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.carousel-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.media-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #f1f5f9;
}

.preview-image,
.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
}

.remove-media {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.remove-media:hover {
  background: rgba(0, 0, 0, 0.9);
}

.close-icon {
  width: 12px;
  height: 12px;
  filter: brightness(0) invert(1);
}

.media-counter {
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.add-more-btn {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s ease;
  align-self: center;
}

.add-more-btn:hover:not(:disabled) {
  background: #e2e8f0;
}

.add-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.post-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.char-counter {
  align-self: flex-end;
  font-size: 0.75rem;
  color: #9ca3af;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #fecaca;
}

.success-message {
  background: #f0fdf4;
  color: #16a34a;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #bbf7d0;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: #f1f5f9;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.cancel-btn:hover:not(:disabled) {
  background: #e2e8f0;
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.publish-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.publish-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.publish-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-progress {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
  
  .carousel-container {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>