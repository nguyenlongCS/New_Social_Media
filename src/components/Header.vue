<!--
src/components/Header.vue - Updated Version
Header với notification icon và badge số lượng thông báo chưa đọc
Badge hiển thị dạng chấm tròn màu đỏ ở góc phải trên icon notifications
Tích hợp NotificationPanel và tự động khởi tạo listener khi user đăng nhập
-->
<template>
  <header class="top-bar">
    <div class="logo">Social Media</div>
    
    <nav>
      <a href="#" class="nav-icon" title="Profile" @click.prevent="navigateTo('/profile')">
        <img src="@/assets/icons/profile.png" alt="Profile" width="20" height="20">
      </a>
      <a href="#" class="nav-icon" title="Friends" @click.prevent="navigateTo('/friends')">
        <img src="@/assets/icons/friends.png" alt="Friends" width="20" height="20">
      </a>
      <a href="#" class="nav-icon" title="Home" @click.prevent="navigateTo('/home')">
        <img src="@/assets/icons/home.png" alt="Home" width="20" height="20">
      </a>
      <a href="#" class="nav-icon" title="News" @click.prevent="navigateTo('/news')">
        <img src="@/assets/icons/news.png" alt="News" width="20" height="20">
      </a>
      <a href="#" class="nav-icon" title="Messages" @click.prevent="navigateTo('/messages')">
        <img src="@/assets/icons/mess.png" alt="Messages" width="20" height="20">
      </a>
      
      <!-- Notification Icon với Badge chấm tròn màu đỏ -->
      <div class="notification-container" ref="notificationContainerRef">
        <a href="#" 
           class="nav-icon notification-btn" 
           title="Thông báo" 
           @click.prevent="toggleNotificationPanel"
           :class="{ active: showNotificationPanel }"
        >
          <img src="@/assets/icons/notification.png" alt="Notification" width="20" height="20">
          <!-- Badge chấm tròn màu đỏ với số lượng thông báo chưa đọc -->
          <span v-if="unreadCount > 0" class="notification-badge">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </a>
        
        <!-- Notification Panel -->
        <NotificationPanel 
          v-if="showNotificationPanel"
          :is-visible="showNotificationPanel"
          @close="hideNotificationPanel"
          @notification-clicked="handleNotificationClicked"
        />
      </div>
    </nav>
    
    <div class="search-bar">
      <input 
        type="text" 
        placeholder="Search..."
        v-model="searchQuery"
      >
      
      <button class="logout-btn" @click="handleLogout" :disabled="isLoading">
        <img src="@/assets/icons/logout.png" alt="Logout" width="16" height="16">
        <span v-if="isLoading">Đang đăng xuất...</span>
        <span v-else>Logout</span>
      </button>
      
      <!-- Profile Picture với Real-time Avatar Update -->
      <div class="profile-pic" :title="profileTooltip" @click="navigateTo('/profile')">
        <!-- Show current avatar from Firestore hoặc auth provider -->
        <img 
          v-if="currentAvatar" 
          :src="currentAvatar" 
          alt="Avatar" 
          class="user-avatar"
          @error="handleAvatarError"
        >
        <!-- Default avatar với user initials -->
        <div v-else class="default-avatar">{{ userInitials }}</div>
        
        <!-- Loading indicator khi avatar đang cập nhật -->
        <div v-if="isAvatarUpdating" class="avatar-updating-overlay">
          <div class="spinner-tiny"></div>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthUser } from '../composables/useAuthUser'
import { useAuth } from '../composables/useAuth'
import { useNotifications } from '../composables/useNotifications'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import NotificationPanel from './NotificationPanel.vue'

export default {
  name: 'Header',
  components: {
    NotificationPanel
  },
  setup() {
    const router = useRouter()
    const searchQuery = ref('')
    const isAvatarUpdating = ref(false)
    const firestoreAvatar = ref('')
    const showNotificationPanel = ref(false)
    const notificationContainerRef = ref(null)
    let unsubscribeProfile = null
    
    // Sử dụng useAuthUser cho user state
    const { user, isLoggedIn, userId } = useAuthUser()
    
    // Sử dụng useAuth chỉ cho logout function
    const { logout, isLoading, cleanup } = useAuth()
    
    // Sử dụng useNotifications cho thông báo
    const {
      unreadCount,
      startListening: startNotificationListening,
      stopListening: stopNotificationListening
    } = useNotifications()
    
    // Watch for avatar updates in real-time từ Firestore
    watch(userId, (newUserId, oldUserId) => {
      // Cleanup previous listener
      if (unsubscribeProfile) {
        unsubscribeProfile()
        unsubscribeProfile = null
      }
      
      if (newUserId) {
        console.log('Header: Setting up avatar listener for user:', newUserId)
        
        // Listen to user profile changes in Firestore
        const userRef = doc(db, 'users', newUserId)
        unsubscribeProfile = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data()
            console.log('Header: User profile updated:', userData.Avatar)
            firestoreAvatar.value = userData.Avatar || ''
          }
        }, (error) => {
          console.error('Header: Error listening to profile updates:', error)
        })
        
        // Khởi tạo notifications listener
        startNotificationListening(newUserId)
      } else {
        firestoreAvatar.value = ''
        // Dừng notifications listener khi user logout
        stopNotificationListening()
      }
    }, { immediate: true })
    
    // Computed current avatar - priority: Firestore > Auth Provider
    const currentAvatar = computed(() => {
      // Ưu tiên avatar từ Firestore (có thể được cập nhật)
      if (firestoreAvatar.value) {
        return firestoreAvatar.value
      }
      
      // Fallback: avatar từ auth provider (Google, Facebook)
      if (user.value?.photoURL) {
        return user.value.photoURL
      }
      
      return ''
    })
    
    // Tạo initials cho default avatar
    const userInitials = computed(() => {
      if (user.value?.displayName) {
        return user.value.displayName
          .split(' ')
          .map(name => name[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      }
      if (user.value?.email) {
        return user.value.email[0].toUpperCase()
      }
      return 'U'
    })
    
    // Profile tooltip text
    const profileTooltip = computed(() => {
      if (user.value?.displayName) {
        return user.value.displayName
      }
      if (user.value?.email) {
        return user.value.email
      }
      return 'Profile'
    })
    
    // Watch avatar changes để show updating indicator
    watch(currentAvatar, (newAvatar, oldAvatar) => {
      if (oldAvatar && newAvatar && oldAvatar !== newAvatar) {
        console.log('Header: Avatar changed from', oldAvatar, 'to', newAvatar)
        
        // Show updating indicator briefly
        isAvatarUpdating.value = true
        setTimeout(() => {
          isAvatarUpdating.value = false
        }, 1000)
      }
    })
    
    // Handle avatar load error
    const handleAvatarError = (event) => {
      console.warn('Header: Avatar load error:', event.target.src)
      // Hide broken image by setting src to empty
      event.target.style.display = 'none'
    }
    
    // Xử lý toggle notification panel
    const toggleNotificationPanel = () => {
      showNotificationPanel.value = !showNotificationPanel.value
    }
    
    // Ẩn notification panel
    const hideNotificationPanel = () => {
      showNotificationPanel.value = false
    }
    
    // Xử lý khi click vào thông báo
    const handleNotificationClicked = (notification) => {
      // Điều hướng tùy theo loại thông báo
      if (notification.type === 'like' || notification.type === 'comment') {
        // Điều hướng về home nếu có postID
        if (notification.postID) {
          router.push('/home')
        }
      } else if (notification.type === 'friend_accept') {
        // Điều hướng về friends page
        router.push('/friends')
      }
      
      // Ẩn panel
      hideNotificationPanel()
    }
    
    // Xử lý logout
    const handleLogout = async () => {
      try {
        // Cleanup profile listener trước khi logout
        if (unsubscribeProfile) {
          unsubscribeProfile()
          unsubscribeProfile = null
        }
        
        // Dừng notifications listener
        stopNotificationListening()
        
        await logout()
        cleanup()
        await router.push('/login')
      } catch (error) {
        alert('Đăng xuất thất bại!')
      }
    }
    
    // Điều hướng
    const navigateTo = (path) => {
      if (router.currentRoute.value.path !== path) {
        router.push(path)
      }
      
      // Ẩn notification panel khi điều hướng
      hideNotificationPanel()
    }
    
    // Cleanup khi component unmounts
    onMounted(() => {
      return () => {
        if (unsubscribeProfile) {
          unsubscribeProfile()
        }
        stopNotificationListening()
      }
    })
    
    return {
      user,
      isLoggedIn,
      isLoading,
      searchQuery,
      currentAvatar,
      userInitials,
      profileTooltip,
      isAvatarUpdating,
      showNotificationPanel,
      notificationContainerRef,
      unreadCount,
      handleAvatarError,
      toggleNotificationPanel,
      hideNotificationPanel,
      handleNotificationClicked,
      handleLogout,
      navigateTo
    }
  }
}
</script>

<style scoped>
/* Existing styles remain the same */
.top-bar {
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between; /* Giữ logo bên trái, search/avatar bên phải */
  padding: 0 1.25rem;
  color: white;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

nav {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
}


.logo {
  font-size: 1.375rem;
  font-weight: 700;
  color: white;
}

.nav-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s ease, transform 0.2s ease;
  cursor: pointer;
  text-decoration: none;
}

.nav-icon:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.nav-icon img {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-bar input {
  padding: 0.375rem 0.875rem;
  border-radius: 1.25rem;
  background: white;
  color: #1e293b;
  border: none;
  outline: none;
  font-size: 0.8125rem;
  width: 12.5rem;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border: none;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.logout-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.logout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.logout-btn img {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1);
}

/* Enhanced Profile Picture Styles */
.profile-pic {
  position: relative;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.profile-pic:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  transition: opacity 0.2s ease;
}

.default-avatar {
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
}

/* Avatar updating overlay */
.avatar-updating-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.spinner-tiny {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Notification container styles - giữ thuộc tính nav-icon */
.notification-container {
  position: relative;
  display: inline-block;
}

.notification-btn {
  position: relative;
  /* Kế thừa tất cả styles từ .nav-icon */
}

.notification-btn.active {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* Notification badge - chấm tròn màu đỏ với số ở góc phải trên */
.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 18px;
  height: 18px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: badgePulse 2s ease-in-out infinite;
}

/* Animation cho badge khi có thông báo mới */
@keyframes badgePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Avatar load animation */
.user-avatar {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>