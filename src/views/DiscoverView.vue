<!--
src/views/DiscoverView.vue - Trang khám phá bài viết
Grid bất đối xứng hiển thị trending posts và discover posts, sắp xếp theo lượt like
-->
<template>
  <div class="discover-view">
    <Header />
    
    <div v-if="isAuthLoading" class="loading-overlay" style="top: 3.75rem; height: calc(100vh - 3.75rem);">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Đang tải...</p>
      </div>
    </div>
    
    <div v-else class="discover-container">
      <!-- Page Header -->
      <div class="discover-header">
        <h1 class="page-title">Khám phá</h1>
        <p class="page-subtitle">Các bài viết nổi bật và được yêu thích nhất</p>
      </div>
      
      <!-- Loading state -->
      <div v-if="isLoading && trendingPosts.length === 0 && discoverPosts.length === 0" class="loading-posts">
        <div class="spinner"></div>
        <p>Đang tải bài viết...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="errorMessage && trendingPosts.length === 0 && discoverPosts.length === 0" class="error-state">
        <h3>Có lỗi xảy ra</h3>
        <p>{{ errorMessage }}</p>
        <button @click="handleRetry" class="retry-btn">Thử lại</button>
      </div>
      
      <!-- Posts Grid -->
      <div v-else class="posts-grid">
        <!-- Trending Posts Section -->
        <div v-if="trendingPosts.length > 0" class="trending-section">
          <h2 class="section-title">
            <span class="trending-icon">🔥</span>
            Top Trending
          </h2>
          <div class="trending-grid">
            <DiscoverItem 
              v-for="post in trendingPosts"
              :key="'trending-' + post.id"
              :post="post"
              :is-trending="true"
              @click="handlePostClick(post)"
            />
          </div>
        </div>
        
        <!-- All Posts Section -->
        <div v-if="discoverPosts.length > 0" class="all-posts-section">
          <h2 class="section-title">All Post</h2>
          <div class="discover-grid">
            <DiscoverItem 
              v-for="post in discoverPosts"
              :key="'discover-' + post.id"
              :post="post"
              :is-trending="false"
              @click="handlePostClick(post)"
            />
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-if="!isLoading && trendingPosts.length === 0 && discoverPosts.length === 0" class="empty-state">
          <h3>Chưa có bài viết nào</h3>
          <p>Hãy theo dõi thêm bạn bè để khám phá nhiều nội dung thú vị!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Header from '../components/Header.vue'
import DiscoverItem from '../components/DiscoverItem.vue'
import { useAuthUser } from '../composables/useAuthUser'
import { useDiscover } from '../composables/useDiscover'

export default {
  name: 'DiscoverView',
  components: {
    Header,
    DiscoverItem
  },
  setup() {
    const router = useRouter()
    const { isAuthLoading } = useAuthUser()
    
    const {
      discoverPosts,
      trendingPosts,
      isLoading,
      errorMessage,
      loadDiscoverData,
      resetDiscoverData
    } = useDiscover()
    
    // Xử lý click vào post - điều hướng về home và highlight post đó
    const handlePostClick = (post) => {
      // Có thể implement điều hướng đến chi tiết post hoặc về home
      router.push('/home')
    }
    
    // Thử lại khi có lỗi
    const handleRetry = async () => {
      await loadDiscoverData(30)
    }
    
    // Load data khi component mount
    onMounted(async () => {
      await loadDiscoverData(30)
    })
    
    return {
      isAuthLoading,
      discoverPosts,
      trendingPosts,
      isLoading,
      errorMessage,
      handlePostClick,
      handleRetry
    }
  }
}
</script>

<style scoped>
.discover-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 3.75rem;
}

.discover-container {
  width: 100%;
  max-width: none; /* bỏ giới hạn */
  margin: 0;       /* bỏ canh giữa */
  padding: 2rem;   /* giữ padding hoặc tùy chỉnh */
}


.discover-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
}

.loading-posts,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.loading-posts .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-posts p,
.empty-state p {
  color: #6b7280;
  margin: 0;
}

.error-state h3,
.empty-state h3 {
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-top: 1rem;
}

.retry-btn:hover {
  background: #1d4ed8;
}

.posts-grid {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.trending-icon {
  font-size: 1.25rem;
}

/* Trending Grid - Đặc biệt với layout nổi bật */
.trending-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Discover Grid - Bất đối xứng với nhiều cột */
.discover-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 0.5rem;
  grid-auto-rows: max-content;
}

/* Make some grid items larger for asymmetrical layout */
.discover-grid :nth-child(3n + 1) {
  grid-row: span 2;
}

.discover-grid :nth-child(5n + 3) {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .discover-container {
    padding: 1rem;
  }
  
  .trending-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .discover-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
  }
  
  /* Disable span effects on mobile */
  .discover-grid :nth-child(3n + 1) {
    grid-row: span 1;
  }
  
  .discover-grid :nth-child(5n + 3) {
    grid-column: span 1;
  }
}
</style>