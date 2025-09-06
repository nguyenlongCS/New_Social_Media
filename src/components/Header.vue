<!-- src/components/Header.vue -->
<!-- Component header chứa logo, navigation và thanh tìm kiếm -->

<template>
  <header class="top-bar">
    <div class="logo">Social Media</div>
    
    <nav>
      <a href="#" class="nav-icon" title="Profile">
        <img src="/src/assets/icons/profile.png" alt="Profile" width="20" height="20">
      </a>
      <a href="#" class="nav-icon" title="Friends">
        <img src="/src/assets/icons/friends.png" alt="Friends" width="20" height="20">
      </a>
      <a href="#" class="nav-icon" title="Home">
        <img src="/src/assets/icons/home.png" alt="Home" width="20" height="20">
      </a>
      <a href="#" class="nav-icon" title="News">
        <img src="/src/assets/icons/news.png" alt="News" width="20" height="20">
      </a>
      <a href="#" class="nav-icon" title="Messages">
        <img src="/src/assets/icons/mess.png" alt="Messages" width="20" height="20">
      </a>
      <a href="#" class="nav-icon" title="Notification">
        <img src="/src/assets/icons/notification.png" alt="Notification" width="20" height="20">
      </a>
    </nav>
    
    <div class="search-bar">
      <input 
        type="text" 
        placeholder="Search..."
        v-model="searchQuery"
      >
      
      <!-- Nút Logout -->
      <button class="logout-btn" @click="handleLogout" :disabled="isLoading">
        <img src="/src/assets/icons/logout.png" alt="Logout" width="18" height="18">
        <span v-if="isLoading">Đang đăng xuất...</span>
        <span v-else>Logout</span>
      </button>
      
      <div class="profile-pic" :title="user?.email"></div>
    </div>
  </header>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

export default {
  name: 'Header',
  setup() {
    const router = useRouter()
    const { user, logout, isLoading } = useAuth()
    const searchQuery = ref('') // Giá trị tìm kiếm
    
    return {
      searchQuery,
      user,
      logout,
      isLoading,
      router
    }
  },
  methods: {
    // Xử lý logout
    async handleLogout() {
      const result = await this.logout()
      
      if (result.success) {
        // Chuyển về trang login sau khi logout
        this.router.push('/login')
      }
    }
  }
}
</script>