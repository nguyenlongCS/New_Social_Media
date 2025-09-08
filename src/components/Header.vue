<!--
src/components/Header.vue - Tích hợp useAuth
Header component với logout functionality từ Project 1
Logic: Navigation, user info display, logout with proper auth integration
-->
<template>
  <header class="top-bar">
    <div class="logo">Social Media</div>
    
    <nav>
      <a href="#" class="nav-icon" title="Profile" @click.prevent="navigateTo('/profile')">
        <img src="/src/assets/icons/profile.png" alt="Profile" width="20" height="20">
      </a>
      <a href="#" class="nav-icon" title="Friends" @click.prevent="navigateTo('/friends')">
        <img src="/src/assets/icons/friends.png" alt="Friends" width="20" height="20">
      </a>
      <a href="#" class="nav-icon" title="Home" @click.prevent="navigateTo('/home')">
        <img src="/src/assets/icons/home.png" alt="Home" width="20" height="20">
      </a>
      <a href="#" class="nav-icon" title="News" @click.prevent="navigateTo('/news')">
        <img src="/src/assets/icons/news.png" alt="News" width="20" height="20">
      </a>
      <a href="#" class="nav-icon" title="Messages" @click.prevent="navigateTo('/messages')">
        <img src="/src/assets/icons/mess.png" alt="Messages" width="20" height="20">
      </a>
      <a href="#" class="nav-icon" title="Notification" @click.prevent="navigateTo('/notifications')">
        <img src="/src/assets/icons/notification.png" alt="Notification" width="20" height="20">
      </a>
    </nav>
    
    <div class="search-bar">
      <input 
        type="text" 
        placeholder="Search..."
        v-model="searchQuery"
      >
      
      <!-- Nút Logout với auth integration -->
      <button class="logout-btn" @click="handleLogout" :disabled="isLoading">
        <img src="/src/assets/icons/logout.png" alt="Logout" width="18" height="18">
        <span v-if="isLoading">Đang đăng xuất...</span>
        <span v-else>Logout</span>
      </button>
      
      <!-- User avatar/info -->
      <div class="profile-pic" :title="user?.email || 'User'">
        <img v-if="user?.photoURL" :src="user.photoURL" alt="Avatar" class="user-avatar">
        <div v-else class="default-avatar">{{ userInitials }}</div>
      </div>
    </div>
  </header>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

export default {
  name: 'Header',
  setup() {
    const router = useRouter()
    const { user, logout, isLoading, cleanup } = useAuth()
    const searchQuery = ref('')
    
    // Computed user initials for default avatar
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
    
    // Handle logout với proper error handling
    const handleLogout = async () => {
      try {
        console.log('Header: Starting logout process...')
        
        // Call logout from useAuth
        await logout()
        
        console.log('Header: Logout successful')
        
        // Cleanup auth listeners
        cleanup()
        
        // Redirect to login
        await router.push('/login')
        
        console.log('Header: Redirected to login')
        
      } catch (error) {
        console.error('Header: Logout error:', error)
        
        // Show user-friendly error message
        const errorMessage = error.message || 'Đăng xuất thất bại!'
        alert(errorMessage)
      }
    }
    
    // Navigate to different routes
    const navigateTo = (path) => {
      if (router.currentRoute.value.path !== path) {
        router.push(path)
      }
    }
    
    return {
      // State
      user,
      isLoading,
      searchQuery,
      userInitials,
      
      // Methods
      handleLogout,
      navigateTo
    }
  }
}
</script>

<style scoped>
/* Header styles từ main.css với một số updates */
.top-bar {
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  color: white;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.logo {
  font-size: 1.375rem;
  font-weight: 700;
  color: white;
}

nav {
  display: flex;
  gap: 1rem;
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
  filter: brightness(0) invert(1); /* Make icons white */
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

.profile-pic {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.profile-pic:hover {
  background: rgba(255, 255, 255, 0.3);
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.default-avatar {
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}
</style>