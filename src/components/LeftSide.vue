<!--
src/components/LeftSide.vue - Component hoàn toàn mới
Sidebar bên trái với menu navigation và danh sách bạn bè - Tự động load và quản lý state
-->
<template>
  <aside class="left-menu">
    <!-- Navigation Menu -->
    <nav class="navigation">
      <button @click="handleCreatePost" class="nav-button">
        <img src="/src/assets/icons/create_post.png" alt="Create Post" width="18" height="18">
        <span>Create Post</span>
      </button>
      <button @click="handleDiscover" class="nav-button">
        <img src="/src/assets/icons/discover.png" alt="Discover" width="18" height="18">
        <span>Discover</span>
      </button>
      <button @click="handleAdmin" class="nav-button">
        <img src="/src/assets/icons/admin.png" alt="Admin" width="18" height="18">
        <span>Admin</span>
      </button>
      <button @click="handleSetting" class="nav-button">
        <img src="/src/assets/icons/setting.png" alt="Setting" width="18" height="18">
        <span>Setting</span>
      </button>
    </nav>
    
    <!-- Divider -->
    <hr class="divider">
    
    <!-- Friends Section -->
    <div class="friends-section">
      <div class="friends-header">
        <h3 class="friends-title">
          Bạn bè 
          <span class="friends-count" v-if="!isLoadingFriends">({{ friendsList.length }})</span>
        </h3>
      </div>
      
      <!-- Loading State -->
      <div v-if="isLoadingFriends" class="friends-loading">
        <div class="loading-spinner"></div>
        <p class="loading-text">Đang tải bạn bè...</p>
      </div>
      
      <!-- Error State -->
      <div v-else-if="errorMessage" class="friends-error">
        <p class="error-text">{{ errorMessage }}</p>
        <button @click="loadFriends" class="retry-button">Thử lại</button>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="friendsList.length === 0" class="friends-empty">
        <div class="empty-icon">👥</div>
        <p class="empty-text">Chưa có bạn bè nào</p>
        <button @click="navigateToFriends" class="find-friends-button">
          Tìm bạn bè
        </button>
      </div>
      
      <!-- Friends List -->
      <div v-else class="friends-list">
        <div 
          v-for="friend in displayedFriends"
          :key="friend.userId"
          class="friend-item"
          @click="handleFriendClick(friend)"
        >
          <div class="friend-avatar">
            <img 
              v-if="friend.avatar" 
              :src="friend.avatar" 
              :alt="friend.userName"
              class="avatar-image"
              @error="handleAvatarError"
            >
            <div v-else class="default-avatar">
              {{ getInitials(friend.userName) }}
            </div>
            <div class="online-indicator" v-if="isOnline(friend)"></div>
          </div>
          
          <div class="friend-info">
            <span class="friend-name">{{ friend.userName }}</span>
          </div>
        </div>
        
        <!-- Show More/Less Buttons -->
        <div v-if="friendsList.length > FRIENDS_DISPLAY_LIMIT" class="friends-actions">
          <button 
            v-if="!showAllFriends"
            @click="showAllFriends = true"
            class="toggle-friends-button"
          >
            Xem thêm {{ friendsList.length - FRIENDS_DISPLAY_LIMIT }} bạn bè
          </button>
          
          <button 
            v-else
            @click="showAllFriends = false"
            class="toggle-friends-button"
          >
            Ẩn bớt
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthUser } from '../composables/useAuthUser'
import { useFriends } from '../composables/useFriends'

export default {
  name: 'LeftSide',
  props: {
    // Optional prop để sync với parent component
    externalFriendsList: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const router = useRouter()
    
    // Constants
    const FRIENDS_DISPLAY_LIMIT = 5
    
    // Reactive state
    const friendsList = ref([])
    const isLoadingFriends = ref(false)
    const showAllFriends = ref(false)
    const errorMessage = ref('')
    
    // Composables
    const { user, isLoggedIn, waitForUserWithTimeout } = useAuthUser()
    const friendsComposable = useFriends()
    
    // Computed
    const displayedFriends = computed(() => {
      const limit = showAllFriends.value ? friendsList.value.length : FRIENDS_DISPLAY_LIMIT
      return friendsList.value.slice(0, limit)
    })
    
    // Methods
    const getInitials = (name) => {
      if (!name) return 'U'
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    
    const isOnline = (friend) => {
      // Placeholder for online status - có thể implement sau
      return Math.random() > 0.7 // Random để demo
    }
    
    const handleAvatarError = (event) => {
      event.target.style.display = 'none'
    }
    
    // Load friends từ Firestore
    const loadFriends = async (showLoading = true) => {
      try {
        if (showLoading) {
          isLoadingFriends.value = true
        }
        errorMessage.value = ''
        
        const currentUser = await waitForUserWithTimeout(5000)
        if (!currentUser?.uid) {
          throw new Error('Người dùng chưa đăng nhập')
        }
        
        await friendsComposable.loadFriendsList(currentUser.uid)
        friendsList.value = [...friendsComposable.friendsList.value]
        
      } catch (error) {
        console.error('LeftSide: Error loading friends:', error)
        errorMessage.value = 'Không thể tải danh sách bạn bè'
        friendsList.value = []
      } finally {
        if (showLoading) {
          isLoadingFriends.value = false
        }
      }
    }
    
    // Navigation handlers
    const handleCreatePost = () => {
      router.push('/create-post')
    }
    
    const handleDiscover = () => {
      router.push('/discover')
    }
    
    const handleAdmin = () => {
      // TODO: Implement admin navigation
      console.log('Admin clicked')
    }
    
    const handleSetting = () => {
      // TODO: Implement settings navigation  
      console.log('Settings clicked')
    }
    
    const navigateToFriends = () => {
      router.push('/friends')
    }
    
    const handleFriendClick = (friend) => {
      // TODO: Navigate to friend profile or open chat
      console.log('Friend clicked:', friend.userName)
    }
    
    // Watchers
    watch(user, async (newUser) => {
      if (newUser?.uid && friendsList.value.length === 0) {
        await loadFriends()
      }
    }, { immediate: true })
    
    // Sync với external props nếu có
    watch(() => props.externalFriendsList, (newList) => {
      if (newList && newList.length > 0 && !isLoadingFriends.value) {
        friendsList.value = [...newList]
      }
    }, { immediate: true, deep: true })
    
    // Watch login status
    watch(isLoggedIn, async (loggedIn) => {
      if (loggedIn && friendsList.value.length === 0) {
        await loadFriends()
      } else if (!loggedIn) {
        friendsList.value = []
        errorMessage.value = ''
      }
    })
    
    // Lifecycle
    onMounted(async () => {
      if (isLoggedIn.value && friendsList.value.length === 0) {
        await loadFriends()
      }
    })
    
    onUnmounted(() => {
      // Cleanup nếu cần
      friendsComposable.resetFriendsData?.()
    })
    
    return {
      // Data
      friendsList,
      displayedFriends,
      isLoadingFriends,
      showAllFriends,
      errorMessage,
      FRIENDS_DISPLAY_LIMIT,
      
      // Methods
      getInitials,
      isOnline,
      handleAvatarError,
      loadFriends,
      handleCreatePost,
      handleDiscover,
      handleAdmin,
      handleSetting,
      navigateToFriends,
      handleFriendClick
    }
  }
}
</script>

<style scoped>
.left-menu {
  width: 15vw;
  position: fixed;
  left: 0;
  top: 3.75rem;
  height: calc(100vh - 3.75rem);
  background: white;
  box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Navigation Styles */
.navigation {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: none;
  background: transparent;
  border-radius: 0.5rem;
  text-align: left;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.nav-button:hover {
  background: #f1f5f9;
  transform: translateY(-1px);
}

.nav-button:active {
  transform: translateY(0);
}

/* Divider */
.divider {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1rem 0;
}

/* Friends Section */
.friends-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.friends-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.friends-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.friends-count {
  color: #6b7280;
  font-weight: 400;
}

/* Loading State */
.friends-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  text-align: center;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.75rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

/* Error State */
.friends-error {
  padding: 1rem;
  text-align: center;
}

.error-text {
  font-size: 0.75rem;
  color: #dc2626;
  margin: 0 0 0.5rem 0;
}

.retry-button {
  padding: 0.25rem 0.5rem;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.retry-button:hover {
  background: #fecaca;
}

/* Empty State */
.friends-empty {
  padding: 2rem 1rem;
  text-align: center;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
}

.find-friends-button {
  padding: 0.5rem 0.75rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.find-friends-button:hover {
  background: #1d4ed8;
}

/* Friends List */
.friends-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 0;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.friend-item:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

.friend-avatar {
  position: relative;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
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
  font-size: 0.75rem;
  font-weight: 600;
  border: 2px solid #e5e7eb;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0.5rem;
  height: 0.5rem;
  background: #16a34a;
  border: 2px solid white;
  border-radius: 50%;
}

.friend-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.friend-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Friends Actions */
.friends-actions {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.toggle-friends-button {
  width: 100%;
  padding: 0.5rem;
  background: #f8fafc;
  color: #2563eb;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-friends-button:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

/* Scrollbar Styling */
.left-menu::-webkit-scrollbar {
  width: 4px;
}

.left-menu::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.left-menu::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.left-menu::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>