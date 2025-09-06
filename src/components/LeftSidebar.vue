<!-- src/components/LeftSidebar.vue -->
<!-- Component sidebar bên trái chứa menu và danh sách bạn bè -->

<template>
  <aside class="left-menu">
    <nav>
      <button @click="handleCreatePost">
        <img src="/src/assets/icons/create_post.png" alt="Create Post" width="18" height="18">
        <span>Create Post</span>
      </button>
      <button @click="handleDiscover">
        <img src="/src/assets/icons/discover.png" alt="Discover" width="18" height="18">
        <span>Discover</span>
      </button>
      <button @click="handleAdmin">
        <img src="/src/assets/icons/admin.png" alt="Admin" width="18" height="18">
        <span>Admin</span>
      </button>
      <button @click="handleSetting">
        <img src="/src/assets/icons/setting.png" alt="Setting" width="18" height="18">
        <span>Setting</span>
      </button>
      
      <hr>
      
      <div class="friends-list">
        <h3>Friends</h3>
        <div id="friends-container">
          <div 
            v-for="friend in friends" 
            :key="friend.id"
            class="friend"
            @click="handleFriendClick(friend)"
          >
            <div class="friend-avatar"></div>
            <span class="friend-name">{{ friend.name }}</span>
          </div>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script>
import { useSocialData } from '../composables/useSocialData'

export default {
  name: 'LeftSidebar',
  setup() {
    // Sử dụng composable để quản lý danh sách bạn bè
    const { friends } = useSocialData()
    
    return {
      friends
    }
  },
  methods: {
    // Xử lý click tạo bài viết
    handleCreatePost() {
      console.log('Create post clicked')
      // Logic tạo bài viết sẽ được thêm sau
    },
    
    // Xử lý click khám phá
    handleDiscover() {
      console.log('Discover clicked')
      // Logic khám phá sẽ được thêm sau
    },
    
    // Xử lý click admin
    handleAdmin() {
      console.log('Admin clicked')
      // Logic admin sẽ được thêm sau
    },
    
    // Xử lý click cài đặt
    handleSetting() {
      console.log('Setting clicked')
      // Logic cài đặt sẽ được thêm sau
    },
    
    // Xử lý click vào bạn bè
    handleFriendClick(friend) {
      console.log('Friend clicked:', friend.name)
      // Logic xem profile bạn bè sẽ được thêm sau
    }
  }
}
</script>