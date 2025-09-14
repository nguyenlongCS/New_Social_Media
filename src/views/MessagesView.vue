<!--
src/views/MessagesView.vue - Trang tin nhắn với layout 3 cột
Sử dụng LeftSide có sẵn, MessMain cho vùng chat, MessRight cho danh sách hội thoại
-->
<template>
  <div class="messages-view">
    <Header />
    
    <div v-if="isAuthLoading" class="loading-overlay" style="top: 3.75rem; height: calc(100vh - 3.75rem);">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Đang tải...</p>
      </div>
    </div>
    
    <div v-else class="messages-container">
      <!-- Left Side - Sử dụng component có sẵn -->
      <LeftSide />
      
      <!-- Main Content - Vùng chat -->
      <MessMain
        :selected-conversation="selectedConversation"
        :messages="conversationMessages"
        :is-loading-messages="isLoadingMessages"
        @send-message="handleSendMessage"
        @delete-message="handleDeleteMessage"
      />
      
      <!-- Right Panel - Danh sách hội thoại -->
      <MessRight
        :conversations="conversations"
        :users-list="usersList"
        :selected-conversation="selectedConversation"
        :is-loading="isLoading"
        :search-query="searchQuery"
        @select-conversation="handleSelectConversation"
        @start-new-conversation="handleStartNewConversation"
        @search-users="handleSearchUsers"
        @update-search="handleUpdateSearch"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import Header from '../components/Header.vue'
import LeftSide from '../components/LeftSide.vue'
import MessMain from '../components/MessMain.vue'
import MessRight from '../components/MessRight.vue'
import { useAuthUser } from '../composables/useAuthUser'
import { useMessages } from '../composables/useMessages'

export default {
  name: 'MessagesView',
  components: {
    Header,
    LeftSide,
    MessMain,
    MessRight
  },
  setup() {
    const searchQuery = ref('')
    
    // Auth user state
    const { user, isAuthLoading, waitForUserWithTimeout } = useAuthUser()
    
    // Messages composable
    const {
      conversations,
      conversationMessages,
      usersList,
      selectedConversation,
      isLoading,
      isLoadingMessages,
      loadConversations,
      loadConversationMessages,
      searchUsers,
      sendMessage,
      deleteMessage,
      selectConversation,
      startNewConversation,
      setupRealtimeListeners,
      cleanup
    } = useMessages()
    
    // Xử lý chọn cuộc hội thoại
    const handleSelectConversation = async (conversation) => {
      try {
        const currentUser = await waitForUserWithTimeout(3000)
        if (!currentUser?.uid) return
        
        selectConversation(conversation)
        await loadConversationMessages(currentUser.uid, conversation.partnerId)
      } catch (error) {
        console.error('Error selecting conversation:', error)
      }
    }
    
    // Xử lý bắt đầu cuộc hội thoại mới
    const handleStartNewConversation = async (targetUser) => {
      try {
        const currentUser = await waitForUserWithTimeout(3000)
        if (!currentUser?.uid) return
        
        const conversation = startNewConversation(currentUser, targetUser)
        await loadConversationMessages(currentUser.uid, targetUser.userId)
      } catch (error) {
        console.error('Error starting new conversation:', error)
      }
    }
    
    // Xử lý gửi tin nhắn
    const handleSendMessage = async (messageData) => {
      try {
        const currentUser = await waitForUserWithTimeout(3000)
        if (!currentUser?.uid) return
        
        if (!selectedConversation.value) return
        
        await sendMessage(currentUser, selectedConversation.value.partnerId, messageData)
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }
    
    // Xử lý xóa tin nhắn
    const handleDeleteMessage = async (messageId) => {
      try {
        await deleteMessage(messageId)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }
    
    // Xử lý tìm kiếm người dùng
    const handleSearchUsers = async (query) => {
      if (query.trim()) {
        await searchUsers(query.trim())
      }
    }
    
    // Xử lý cập nhật query tìm kiếm
    const handleUpdateSearch = (query) => {
      searchQuery.value = query
    }
    
    // Khởi tạo khi component mount
    onMounted(async () => {
      try {
        const currentUser = await waitForUserWithTimeout(5000)
        if (currentUser?.uid) {
          // Load danh sách cuộc hội thoại
          await loadConversations(currentUser.uid)
          
          // Setup realtime listeners cho tin nhắn mới
          setupRealtimeListeners(currentUser.uid)
        }
      } catch (error) {
        console.error('Error on mount:', error)
      }
    })
    
    // Cleanup khi component unmount
    onUnmounted(() => {
      cleanup()
    })
    
    return {
      searchQuery,
      isAuthLoading,
      conversations,
      conversationMessages,
      usersList,
      selectedConversation,
      isLoading,
      isLoadingMessages,
      handleSelectConversation,
      handleStartNewConversation,
      handleSendMessage,
      handleDeleteMessage,
      handleSearchUsers,
      handleUpdateSearch
    }
  }
}
</script>

<style scoped>
.messages-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 3.75rem;
}

.messages-container {
  display: flex;
  width: 100%;
  min-height: calc(100vh - 3.75rem);
}
</style>