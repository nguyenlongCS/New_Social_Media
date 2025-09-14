<!--
src/components/MessRight.vue - Component panel bên phải cho tin nhắn
Hiển thị danh sách cuộc hội thoại và tìm kiếm người dùng để bắt đầu chat mới
-->
<template>
  <div class="mess-right-panel">
    <!-- Header tìm kiếm -->
    <div class="search-header">
      <h3 class="panel-title">Tin nhắn</h3>
      
      <div class="search-container">
        <div class="search-input-wrapper">
          <img src="@/assets/icons/search.png" alt="Search" class="search-icon">
          <input 
            type="text" 
            placeholder="Tìm kiếm người dùng..."
            class="search-input"
            v-model="searchQuery"
            @input="handleSearchInput"
          >
          <button 
            v-if="searchQuery"
            @click="clearSearch"
            class="clear-search-btn"
          >
            <img src="@/assets/icons/delete.png" alt="Clear" width="12" height="12">
          </button>
        </div>
      </div>
    </div>
    
    <!-- Kết quả tìm kiếm user -->
    <div v-if="showSearchResults" class="search-results">
      <h4 class="results-title">Kết quả tìm kiếm</h4>
      
      <div v-if="isLoading" class="loading-users">
        <div class="spinner-small"></div>
        <span>Đang tìm kiếm...</span>
      </div>
      
      <div v-else-if="usersList.length === 0" class="no-results">
        <p>Không tìm thấy người dùng nào</p>
      </div>
      
      <div v-else class="users-list">
        <div 
          v-for="user in usersList"
          :key="user.userId"
          class="user-item"
          @click="handleStartChat(user)"
        >
          <div class="user-avatar">
            <img 
              v-if="user.avatar" 
              :src="user.avatar" 
              alt="Avatar" 
              class="avatar-image"
            >
            <div v-else class="default-avatar">
              {{ user.userName?.[0]?.toUpperCase() || 'U' }}
            </div>
          </div>
          
          <div class="user-info">
            <div class="user-name">{{ user.userName }}</div>
            <div class="user-bio">{{ user.bio || 'Không có mô tả' }}</div>
          </div>
          
          <div class="chat-action">
            <img src="@/assets/icons/mess.png" alt="Chat" width="20" height="20">
          </div>
        </div>
      </div>
    </div>
    
    <!-- Danh sách cuộc hội thoại -->
    <div v-else class="conversations-section">
      <h4 class="section-title">Cuộc hội thoại</h4>
      
      <div v-if="isLoading && conversations.length === 0" class="loading-conversations">
        <div class="spinner-small"></div>
        <span>Đang tải...</span>
      </div>
      
      <div v-else-if="conversations.length === 0" class="no-conversations">
        <div class="no-conversations-icon">
          <img src="@/assets/icons/mess.png" alt="Messages" width="48" height="48">
        </div>
        <p>Chưa có cuộc hội thoại nào</p>
        <p class="no-conversations-hint">Tìm kiếm người dùng để bắt đầu trò chuyện</p>
      </div>
      
      <div v-else class="conversations-list">
        <div 
          v-for="conversation in conversations"
          :key="conversation.id"
          class="conversation-item"
          :class="{ active: selectedConversation?.id === conversation.id }"
          @click="handleSelectConversation(conversation)"
        >
          <div class="conversation-avatar">
            <img 
              v-if="conversation.partnerAvatar" 
              :src="conversation.partnerAvatar" 
              alt="Avatar" 
              class="avatar-image"
            >
            <div v-else class="default-avatar">
              {{ conversation.partnerName?.[0]?.toUpperCase() || 'U' }}
            </div>
            
            <!-- Chấm báo tin nhắn chưa đọc -->
            <div v-if="conversation.hasUnread" class="unread-indicator"></div>
          </div>
          
          <div class="conversation-info">
            <div class="conversation-header">
              <div class="partner-name">{{ conversation.partnerName }}</div>
              <div class="last-message-time">{{ formatTime(conversation.lastMessageTime) }}</div>
            </div>
            
            <div class="last-message">
              <span v-if="conversation.lastMessageType === 'image'" class="media-message">
                <img src="@/assets/icons/camera.png" alt="Image" width="12" height="12">
                Hình ảnh
              </span>
              <span v-else-if="conversation.lastMessageType === 'video'" class="media-message">
                <img src="@/assets/icons/video.png" alt="Video" width="12" height="12">
                Video
              </span>
              <span v-else>{{ conversation.lastMessage || 'Chưa có tin nhắn' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'MessRight',
  props: {
    conversations: {
      type: Array,
      default: () => []
    },
    usersList: {
      type: Array,
      default: () => []
    },
    selectedConversation: {
      type: Object,
      default: null
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    searchQuery: {
      type: String,
      default: ''
    }
  },
  emits: ['select-conversation', 'start-new-conversation', 'search-users', 'update-search'],
  setup(props, { emit }) {
    const searchQuery = ref(props.searchQuery || '')
    const searchTimeout = ref(null)
    
    // Kiểm tra có đang hiển thị kết quả tìm kiếm không
    const showSearchResults = computed(() => {
      return searchQuery.value.trim().length > 0
    })
    
    // Xử lý input tìm kiếm với debounce
    const handleSearchInput = () => {
      emit('update-search', searchQuery.value)
      
      // Clear timeout cũ
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
      }
      
      // Debounce tìm kiếm 500ms
      if (searchQuery.value.trim()) {
        searchTimeout.value = setTimeout(() => {
          emit('search-users', searchQuery.value.trim())
        }, 500)
      }
    }
    
    // Xóa tìm kiếm
    const clearSearch = () => {
      searchQuery.value = ''
      emit('update-search', '')
      
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
      }
    }
    
    // Xử lý chọn cuộc hội thoại
    const handleSelectConversation = (conversation) => {
      emit('select-conversation', conversation)
    }
    
    // Xử lý bắt đầu chat mới với user
    const handleStartChat = (user) => {
      emit('start-new-conversation', user)
      // Clear search sau khi chọn
      clearSearch()
    }
    
    // Format thời gian hiển thị
    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      
      try {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now - date
        
        const minutes = Math.floor(diff / (1000 * 60))
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        
        if (minutes < 1) return 'Vừa xong'
        if (minutes < 60) return `${minutes}p`
        if (hours < 24) return `${hours}h`
        if (days < 7) return `${days}d`
        
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
      } catch (error) {
        return ''
      }
    }
    
    return {
      searchQuery,
      showSearchResults,
      handleSearchInput,
      clearSearch,
      handleSelectConversation,
      handleStartChat,
      formatTime
    }
  }
}
</script>

<style scoped>
.mess-right-panel {
  width: 15vw;
  background: white;
  box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
  position: fixed;
  right: 0;
  top: 3.75rem;
  height: calc(100vh - 3.75rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.panel-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

.search-container {
  position: relative;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  width: 16px;
  height: 16px;
  opacity: 0.5;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 1.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: #2563eb;
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.clear-search-btn:hover {
  background: #f1f5f9;
}

.search-results,
.conversations-section {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.results-title,
.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
}

.loading-users,
.loading-conversations {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-results,
.no-conversations {
  text-align: center;
  padding: 2rem 1rem;
  color: #6b7280;
}

.no-results p,
.no-conversations p {
  margin: 0;
  font-size: 0.875rem;
}

.no-conversations-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-conversations-hint {
  font-size: 0.75rem !important;
  opacity: 0.7;
}

.users-list,
.conversations-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-item,
.conversation-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.user-item:hover,
.conversation-item:hover {
  background: #f8fafc;
}

.conversation-item.active {
  background: #e0f2fe;
  border: 1px solid #0284c7;
}

.user-avatar,
.conversation-avatar {
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.default-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  font-weight: 600;
}

.unread-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #dc2626;
  border: 2px solid white;
  border-radius: 50%;
}

.user-info,
.conversation-info {
  flex: 1;
  min-width: 0;
}

.user-name,
.partner-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-bio {
  font-size: 0.75rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.last-message-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.last-message {
  font-size: 0.75rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-message {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.chat-action {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 50%;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.user-item:hover .chat-action {
  opacity: 1;
}
</style>