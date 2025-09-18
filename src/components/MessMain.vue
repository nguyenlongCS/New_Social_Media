<!--
src/components/MessMain.vue - Component vùng chat chính
Hiển thị danh sách tin nhắn và form gửi tin nhắn mới, hỗ trợ gửi ảnh/video
-->
<template>
  <div class="mess-main">
    <!-- Header cuộc hội thoại -->
    <div v-if="selectedConversation" class="chat-header">
      <div class="partner-info">
        <div class="partner-avatar">
          <img 
            v-if="selectedConversation.partnerAvatar" 
            :src="selectedConversation.partnerAvatar" 
            alt="Avatar" 
            class="avatar-image"
          >
          <div v-else class="default-avatar">
            {{ selectedConversation.partnerName?.[0]?.toUpperCase() || 'U' }}
          </div>
        </div>
        <div class="partner-details">
          <h3 class="partner-name">{{ selectedConversation.partnerName }}</h3>
          <span class="online-status">Active</span>
        </div>
      </div>
    </div>
    
    <!-- Vùng tin nhắn -->
    <div class="messages-area">
      <!-- Trạng thái chưa chọn cuộc hội thoại -->
      <div v-if="!selectedConversation" class="no-conversation">
        <div class="no-conversation-icon">
          <img src="@/assets/icons/mess.png" alt="Messages" width="64" height="64">
        </div>
        <h3>Chọn một cuộc hội thoại</h3>
        <p>Chọn từ danh sách bên phải hoặc bắt đầu cuộc trò chuyện mới</p>
      </div>
      
      <!-- Loading tin nhắn -->
      <div v-else-if="isLoadingMessages" class="loading-messages">
        <div class="spinner"></div>
        <p>Đang tải tin nhắn...</p>
      </div>
      
      <!-- Danh sách tin nhắn -->
      <div v-else class="messages-list" ref="messagesContainer">
        <div 
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :class="{ 'own-message': message.isSentByMe }"
        >
          <div class="message-content">
            <!-- Tin nhắn văn bản -->
            <div v-if="message.type === 'text'" class="message-text">
              {{ message.content }}
            </div>
            
            <!-- Tin nhắn hình ảnh -->
            <div v-else-if="message.type === 'image'" class="message-media">
              <img :src="message.mediaUrl" alt="Image" class="message-image" @error="handleMediaError">
            </div>
            
            <!-- Tin nhắn video -->
            <div v-else-if="message.type === 'video'" class="message-media">
              <video :src="message.mediaUrl" class="message-video" controls @error="handleMediaError">
                Your browser does not support video.
              </video>
            </div>
            
            <div class="message-info">
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              <button 
                v-if="message.isSentByMe"
                @click="handleDeleteClick(message.id)"
                class="delete-message-btn"
                title="Xóa tin nhắn"
              >
                <img src="@/assets/icons/delete.png" alt="Delete" width="12" height="12">
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Form gửi tin nhắn -->
    <div v-if="selectedConversation" class="message-form">
      <div class="message-input-container">
        <!-- Input file ẩn -->
        <input 
          ref="fileInput"
          type="file" 
          accept="image/*,video/*"
          @change="handleFileSelect"
          style="display: none;"
        >
        
        <!-- Nút đính kèm file -->
        <button 
          type="button"
          @click="triggerFileInput"
          class="attach-btn"
          title="Đính kèm ảnh/video"
        >
          <img src="@/assets/icons/camera.png" alt="Attach" width="20" height="20">
        </button>
        
        <!-- Input tin nhắn -->
        <input 
          v-model="messageText"
          type="text" 
          placeholder="Enter message..."
          class="message-input"
          @keyup.enter="handleSendText"
          :disabled="isSending"
        >
        
        <!-- Nút gửi -->
        <button 
          type="button"
          @click="handleSendText"
          class="send-btn"
          :disabled="!messageText.trim() && !selectedFile || isSending"
        >
          <img src="@/assets/icons/send.png" alt="Send" width="20" height="20">
        </button>
      </div>
      
      <!-- Preview file được chọn -->
      <div v-if="selectedFile" class="file-preview">
        <div class="preview-container">
          <img v-if="selectedFile.type.startsWith('image/')" :src="filePreview" alt="Preview" class="preview-image">
          <video v-else-if="selectedFile.type.startsWith('video/')" :src="filePreview" class="preview-video" controls></video>
          
          <button @click="cancelFileSelection" class="cancel-file-btn">
            <img src="@/assets/icons/delete.png" alt="Cancel" width="16" height="16">
          </button>
        </div>
        
        <button @click="handleSendFile" :disabled="isSending" class="send-file-btn">
          <span v-if="isSending">Đang gửi...</span>
          <span v-else>Gửi file</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, watch } from 'vue'

export default {
  name: 'MessMain',
  props: {
    selectedConversation: {
      type: Object,
      default: null
    },
    messages: {
      type: Array,
      default: () => []
    },
    isLoadingMessages: {
      type: Boolean,
      default: false
    }
  },
  emits: ['send-message', 'delete-message'],
  setup(props, { emit }) {
    const messageText = ref('')
    const selectedFile = ref(null)
    const filePreview = ref('')
    const isSending = ref(false)
    const fileInput = ref(null)
    const messagesContainer = ref(null)
    
    // Trigger chọn file
    const triggerFileInput = () => {
      if (fileInput.value) {
        fileInput.value.click()
      }
    }
    
    // Xử lý chọn file
    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (!file) return
      
      // Kiểm tra loại file
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert('Chỉ hỗ trợ file ảnh và video')
        return
      }
      
      // Kiểm tra kích thước file (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('File quá lớn. Kích thước tối đa 50MB')
        return
      }
      
      selectedFile.value = file
      filePreview.value = URL.createObjectURL(file)
      
      // Reset input
      event.target.value = ''
    }
    
    // Hủy chọn file
    const cancelFileSelection = () => {
      if (filePreview.value) {
        URL.revokeObjectURL(filePreview.value)
      }
      selectedFile.value = null
      filePreview.value = ''
    }
    
    // Xử lý gửi tin nhắn văn bản
    const handleSendText = async () => {
      if (!messageText.value.trim() || isSending.value) return
      
      isSending.value = true
      
      try {
        await emit('send-message', {
          type: 'text',
          content: messageText.value.trim()
        })
        
        messageText.value = ''
      } catch (error) {
        console.error('Error sending text message:', error)
      } finally {
        isSending.value = false
      }
    }
    
    // Xử lý gửi file
    const handleSendFile = async () => {
      if (!selectedFile.value || isSending.value) return
      
      isSending.value = true
      
      try {
        const messageData = {
          type: selectedFile.value.type.startsWith('image/') ? 'image' : 'video',
          file: selectedFile.value,
          content: messageText.value.trim() || '' // Có thể kèm text
        }
        
        await emit('send-message', messageData)
        
        // Reset form
        messageText.value = ''
        cancelFileSelection()
      } catch (error) {
        console.error('Error sending file message:', error)
      } finally {
        isSending.value = false
      }
    }
    
    // Xử lý xóa tin nhắn
    const handleDeleteClick = (messageId) => {
      if (confirm('Bạn có chắc muốn xóa tin nhắn này?')) {
        emit('delete-message', messageId)
      }
    }
    
    // Format thời gian hiển thị
    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      
      try {
        const date = new Date(timestamp)
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        
        if (messageDate.getTime() === today.getTime()) {
          // Hôm nay - chỉ hiển thị giờ
          return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        } else {
          // Khác ngày - hiển thị ngày và giờ
          return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      } catch (error) {
        return ''
      }
    }
    
    // Xử lý lỗi load media
    const handleMediaError = (event) => {
      event.target.style.display = 'none'
      const errorDiv = document.createElement('div')
      errorDiv.className = 'media-error'
      errorDiv.textContent = 'Không thể tải file media'
      event.target.parentElement.appendChild(errorDiv)
    }
    
    // Scroll to bottom khi có tin nhắn mới
    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    }
    
    // Watch tin nhắn để auto scroll
    watch(() => props.messages, () => {
      scrollToBottom()
    }, { deep: true })
    
    // Watch conversation để scroll xuống bottom
    watch(() => props.selectedConversation, () => {
      scrollToBottom()
    })
    
    return {
      messageText,
      selectedFile,
      filePreview,
      isSending,
      fileInput,
      messagesContainer,
      triggerFileInput,
      handleFileSelect,
      cancelFileSelection,
      handleSendText,
      handleSendFile,
      handleDeleteClick,
      formatTime,
      handleMediaError
    }
  }
}
</script>

<style scoped>
.mess-main {
  width: calc(50vw - 2rem);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 3.75rem);
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.chat-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.partner-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.partner-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
}

.partner-details {
  flex: 1;
}

.partner-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.online-status {
  font-size: 0.75rem;
  color: #16a34a;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.no-conversation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #6b7280;
}

.no-conversation-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-conversation h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.no-conversation p {
  margin: 0;
  font-size: 0.875rem;
}

.loading-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.loading-messages .spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-messages p {
  color: #6b7280;
  margin: 0;
}

.messages-list {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
}

.message-item {
  display: flex;
  align-items: flex-end;
}

.message-item.own-message {
  justify-content: flex-end;
}

.message-content {
  max-width: 70%;
  position: relative;
}

.message-text {
  background: #f1f5f9;
  padding: 0.75rem;
  border-radius: 1rem;
  color: #1e293b;
  line-height: 1.4;
}

.own-message .message-text {
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  color: white;
}

.message-media {
  border-radius: 0.75rem;
  overflow: hidden;
}

.message-image,
.message-video {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: 0.75rem;
}

.message-video {
  max-width: 300px;
}

.media-error {
  background: #fef2f2;
  color: #dc2626;
  padding: 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  text-align: center;
}

.message-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.own-message .message-info {
  justify-content: flex-end;
}

.message-time {
  font-size: 0.75rem;
}

.delete-message-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.delete-message-btn:hover {
  opacity: 1;
}

.message-form {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.message-input-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border-radius: 1.5rem;
  padding: 0.5rem;
}

.attach-btn,
.send-btn {
  background: none;
  border: none;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.attach-btn:hover,
.send-btn:hover:not(:disabled) {
  background: #e2e8f0;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #1e293b;
}

.message-input::placeholder {
  color: #9ca3af;
}

.file-preview {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preview-image,
.preview-video {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 0.375rem;
}

.cancel-file-btn {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  width: 20px;
  height: 20px;
  background: #dc2626;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.send-file-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.send-file-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.send-file-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>