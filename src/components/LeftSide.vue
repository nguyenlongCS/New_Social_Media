<!--
src/components/LeftSide.vue - Refactored
Sidebar bên trái với menu navigation, loại bỏ friends list
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
    </nav>
  </aside>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'LeftSide',
  setup() {
    const router = useRouter()
    
    // Xử lý tạo bài viết - chuyển đến trang create post
    const handleCreatePost = () => {
      router.push('/create-post')
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
    
    return {
      handleCreatePost,
      handleDiscover,
      handleAdmin,
      handleSetting
    }
  }
}
</script>