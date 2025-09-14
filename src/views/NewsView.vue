<!--
src/views/NewsView.vue - Trang hiển thị danh sách tin tức từ NewsAPI
Full width layout, không có LeftSide, hiển thị tin tức dạng grid
Click vào bài viết sẽ mở link ngoài tới nguồn gốc
-->
<template>
  <div class="news-view">
    <Header />

    <!-- Loading khi đang kiểm tra auth -->
    <div v-if="isAuthLoading" class="loading-overlay" style="top: 3.75rem; height: calc(100vh - 3.75rem);">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Đang tải...</p>
      </div>
    </div>

    <div v-else class="news-container">
      <!-- Loading state -->
      <div v-if="isLoading && newsList.length === 0" class="loading-news">
        <div class="spinner"></div>
        <p>Đang tải tin tức...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="errorMessage && newsList.length === 0" class="error-state">
        <div class="error-icon">
          <img src="@/assets/icons/notification.png" alt="Error" class="error-image">
        </div>
        <h3>Không thể tải tin tức</h3>
        <p>{{ errorMessage }}</p>
        <button @click="handleRetry" class="retry-btn">
          Thử lại
        </button>
      </div>

      <!-- News Grid -->
      <div v-else-if="newsList.length > 0" class="news-grid">
        <NewsItem v-for="article in newsList" :key="article.id" :article="article" @click="handleArticleClick" />
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <img src="@/assets/icons/news.png" alt="Empty" class="empty-image">
        </div>
        <h3>Chưa có tin tức</h3>
        <p>Hiện tại chưa có bài báo nào. Vui lòng thử lại sau.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import Header from '../components/Header.vue'
import NewsItem from '../components/NewsItem.vue'
import { useAuthUser } from '../composables/useAuthUser'
import { useNews } from '../composables/useNews'

export default {
  name: 'NewsView',
  components: {
    Header,
    NewsItem
  },
  setup() {
    // Auth state
    const { isAuthLoading } = useAuthUser()

    // News composable
    const {
      newsList,
      isLoading,
      errorMessage,
      hasMore,
      loadNews,
      openArticle,
      resetNews
    } = useNews()

    // Xử lý thử lại khi có lỗi
    const handleRetry = async () => {
      resetNews()
      await loadNews()
    }

    // Xử lý click vào bài viết - mở link ngoài
    const handleArticleClick = (article) => {
      openArticle(article)
    }

    // Xử lý load thêm tin tức - Không cần nữa
    const handleLoadMore = async () => {
      console.log('Load more not needed - getting fresh news each time')
    }

    // Load tin tức khi component mount
    onMounted(async () => {
      await loadNews()
    })

    return {
      isAuthLoading,
      newsList,
      isLoading,
      errorMessage,
      hasMore,
      handleRetry,
      handleArticleClick,
      handleLoadMore
    }
  }
}
</script>

<style scoped>
.news-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 3.75rem;
}

.news-container {
  width: 100%;
  padding: 1rem 2rem;   /* giữ khoảng padding nhỏ thôi */
  margin: 0;            /* bỏ max-width, bỏ auto margin */
}

/* Loading, Error, Empty States */
.loading-news,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-news .spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.loading-news p {
  color: #6b7280;
  margin: 0;
  font-size: 1rem;
}

.error-icon,
.empty-icon {
  margin-bottom: 1.5rem;
}

.error-image,
.empty-image {
  width: 64px;
  height: 64px;
  opacity: 0.5;
}

.error-state h3,
.empty-state h3 {
  color: #374151;
  margin: 0 0 0.75rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.error-state p,
.empty-state p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  max-width: 400px;
  line-height: 1.5;
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
}

.retry-btn:hover {
  background: #1d4ed8;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
  gap: 1rem; /* khoảng cách giữa items */
}
</style>