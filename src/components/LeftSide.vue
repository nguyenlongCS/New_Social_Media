<!--
src/components/LeftSide.vue - Refactored
Sidebar bên trái với menu và danh sách bạn bè
-->
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
  name: 'LeftSide',
  setup() {
    const { friends } = useSocialData()
    
    // Xử lý các button click (chưa implement logic chi tiết)
    const handleCreatePost = () => {
      // Logic tạo bài viết sẽ được thêm sau
    }
    
    const handleDiscover = () => {
      // Logic khám phá sẽ được thêm sau
    }
    
    const handleAdmin = () => {
      // Logic admin sẽ được thêm sau
    }
    
    const handleSetting = () => {
      // Logic cài đặt sẽ được thêm sau
    }
    
    const handleFriendClick = (friend) => {
      // Logic xem profile bạn bè sẽ được thêm sau
    }
    
    return {
      friends,
      handleCreatePost,
      handleDiscover,
      handleAdmin,
      handleSetting,
      handleFriendClick
    }
  }
}
</script>