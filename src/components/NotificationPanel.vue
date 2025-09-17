<!--
src/components/NotificationPanel.vue - Panel thả xuống hiển thị danh sách thông báo
Chức năng:
- Hiển thị danh sách thông báo realtime từ Firestore
- Icon, nội dung, thời gian của từng thông báo
- Phân loại thông báo theo type (like, comment, friend_accept)
- Đánh dấu đã đọc khi click vào thông báo
- Nút đánh dấu tất cả đã đọc
- Tự động ẩn panel khi click bên ngoài
-->
<template>
  <div class="notification-panel" v-if="isVisible" ref="panelRef">
    <!-- Header -->
    <div class="panel-header">
      <h3 class="panel-title">Thông báo</h3>
      <button 
        v-if="unreadCount > 0"
        @click="handleMarkAllAsRead" 
        class="mark-all-read-btn"
      >
        Đánh dấu tất cả đã đọc
      </button>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải thông báo...</p>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="notifications.length === 0" class="empty-state">
      <div class="empty-icon">
        <img src="@/assets/icons/notification.png" alt="No notifications" width="48" height="48">
      </div>
      <p>Chưa có thông báo nào</p>
    </div>
    
    <!-- Notifications list -->
    <div v-else class="notifications-list">
      <div 
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification-item', { unread: !notification.isRead }]"
        @click="handleNotificationClick(notification)"
      >
        <!-- Notification icon dựa vào type -->
        <div class="notification-icon">
          <img 
            v-if="notification.type === 'like'" 
            src="@/assets/icons/liked.png" 
            alt="Like" 
            width="20" 
            height="20"
          >
          <img 
            v-else-if="notification.type === 'comment'" 
            src="@/assets/icons/comment.png" 
            alt="Comment" 
            width="20" 
            height="20"
          >
          <img 
            v-else-if="notification.type === 'friend_accept'" 
            src="@/assets/icons/friends.png" 
            alt="Friend" 
            width="20" 
            height="20"
          >
          <img 
            v-else 
            src="@/assets/icons/notification.png" 
            alt="Notification" 
            width="20" 
            height="20"
          >
        </div>
        
        <!-- Notification content -->
        <div class="notification-content">
          <p class="notification-message">{{ notification.messages }}</p>
          <span class="notification-time">{{ notification.formattedTime }}</span>
        </div>
        
        <!-- Unread indicator -->
        <div v-if="!notification.isRead" class="unread-dot"></div>
      </div>
    </div>
    
    <!-- Footer với số lượng thông báo -->
    <div v-if="notifications.length > 0" class="panel-footer">
      <span class="notifications-count">
        {{ notifications.length }} thông báo
        <span v-if="unreadCount > 0">({{ unreadCount }} chưa đọc)</span>
      </span>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotifications } from '../composables/useNotifications'
import { useAuthUser } from '../composables/useAuthUser'

export default {
  name: 'NotificationPanel',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'notification-clicked'],
  setup(props, { emit }) {
    const panelRef = ref(null)
    
    // Composables
    const { user } = useAuthUser()
    const {
      notifications,
      unreadCount,
      isLoading,
      markAsRead,
      markAllAsRead
    } = useNotifications()
    
    // Xử lý click vào thông báo
    const handleNotificationClick = async (notification) => {
      // Đánh dấu đã đọc nếu chưa đọc
      if (!notification.isRead) {
        await markAsRead(notification.id)
      }
      
      // Emit event để parent component xử lý navigation
      emit('notification-clicked', notification)
      
      // Đóng panel
      emit('close')
    }
    
    // Đánh dấu tất cả đã đọc
    const handleMarkAllAsRead = async () => {
      if (user.value?.uid) {
        await markAllAsRead(user.value.uid)
      }
    }
    
    // Xử lý click bên ngoài để đóng panel
    const handleClickOutside = (event) => {
      if (panelRef.value && !panelRef.value.contains(event.target)) {
        emit('close')
      }
    }
    
    // Setup click outside listener
    onMounted(() => {
      document.addEventListener('mousedown', handleClickOutside)
    })
    
    onUnmounted(() => {
      document.removeEventListener('mousedown', handleClickOutside)
    })
    
    return {
      panelRef,
      notifications,
      unreadCount,
      isLoading,
      handleNotificationClick,
      handleMarkAllAsRead
    }
  }
}
</script>

<style scoped>
.notification-panel {
  position: absolute;
  top: 100%;
  right: 0;
  width: 380px;
  max-height: 500px;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  z-index: 1000;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
}

.panel-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.mark-all-read-btn {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: background 0.2s ease;
}

.mark-all-read-btn:hover {
  background: #e0f2fe;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.loading-state .spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p,
.empty-state p {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
}

.empty-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.2s ease;
  position: relative;
}

.notification-item:hover {
  background: #f8fafc;
}

.notification-item.unread {
  background: #f0f9ff;
}

.notification-item.unread:hover {
  background: #e0f2fe;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-message {
  font-size: 0.875rem;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  line-height: 1.4;
  word-wrap: break-word;
}

.notification-time {
  font-size: 0.75rem;
  color: #64748b;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #2563eb;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.panel-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
  text-align: center;
}

.notifications-count {
  font-size: 0.75rem;
  color: #64748b;
}

/* Scrollbar styling */
.notifications-list::-webkit-scrollbar {
  width: 4px;
}

.notifications-list::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.notifications-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.notifications-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>