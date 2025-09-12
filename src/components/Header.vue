<!--
src/components/Header.vue - Fixed Version
Header với navigation và logout functionality sử dụng useAuthUser - Icons PNG
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
      
      <button class="logout-btn" @click="handleLogout" :disabled="isLoading">
        <img src="/src/assets/icons/logout.png" alt="Logout" width="16" height="16">
        <span v-if="isLoading">Đang đăng xuất...</span>
        <span v-else>Logout</span>
      </button>
      
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
import { useAuthUser } from '../composables/useAuthUser'
import { useAuth } from '../composables/useAuth'

export default {
  name: 'Header',
  setup() {
    const router = useRouter()
    const searchQuery = ref('')
    
    // Sử dụng useAuthUser cho user state
    const { user, isLoggedIn } = useAuthUser()
    
    // Sử dụng useAuth chỉ cho logout function
    const { logout, isLoading, cleanup } = useAuth()
    
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
    
    // Xử lý logout
    const handleLogout = async () => {
      try {
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
    }
    
    return {
      user,
      isLoggedIn,
      isLoading,
      searchQuery,
      userInitials,
      handleLogout,
      navigateTo
    }
  }
}
</script>