<!--
src/components/NewsItem.vue - Component hiển thị một bài tin tức
Hiển thị tiêu đề, hình ảnh đại diện, tóm tắt
Click để mở bài báo ngoài
-->
<template>
  <article class="news-item" @click="handleClick">
    <div class="news-image-container">
      <img 
        v-if="article.urlToImage && isValidImageUrl(article.urlToImage)"
        :src="article.urlToImage"
        :alt="article.title"
        class="news-image"
        @error="handleImageError"
      >
      <div v-else class="news-image-placeholder">
        <img src="@/assets/icons/news.png" alt="News" class="placeholder-icon">
      </div>
    </div>

    <div class="news-content">
      <h3 class="news-title">{{ article.title }}</h3>

      <p v-if="article.description" class="news-description">
        {{ article.description }}
      </p>

      <div class="news-footer">
        <button class="read-more-btn">
          <img src="@/assets/icons/discover.png" alt="Read" class="btn-icon">
          <span>Đọc bài viết</span>
        </button>
      </div>
    </div>
  </article>
</template>

<script>
export default {
  name: 'NewsItem',
  props: {
    article: {
      type: Object,
      required: true
    }
  },
  emits: ['click'],
  setup(props, { emit }) {
    const isValidImageUrl = (url) => {
      return url && url.startsWith('http') && !url.includes('placeholder')
    }

    const handleImageError = (event) => {
      console.warn('Image load error:', event.target.src)
      event.target.style.display = 'none'
      const container = event.target.parentElement
      const placeholder = container.querySelector('.news-image-placeholder')
      if (placeholder) {
        placeholder.style.display = 'flex'
      } else {
        const newPlaceholder = document.createElement('div')
        newPlaceholder.className = 'news-image-placeholder'
        newPlaceholder.innerHTML = '<img src="@/assets/icons/news.png" alt="News" class="placeholder-icon">'
        newPlaceholder.style.display = 'flex'
        container.appendChild(newPlaceholder)
      }
    }

    const handleClick = () => {
      emit('click', props.article)
    }

    return { isValidImageUrl, handleImageError, handleClick }
  }
}
</script>

<style scoped>
.news-item {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.news-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.news-image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f1f5f9;
}

.news-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.news-item:hover .news-image {
  transform: scale(1.05);
}

.news-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
}

.placeholder-icon {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.news-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.news-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
  margin: 0 0 0.75rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-description {
  color: #4b5563;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  flex: 1;
  font-size: 0.9375rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.read-more-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  color: #374151;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: center;
}

.read-more-btn:hover {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.read-more-btn:hover .btn-icon {
  filter: brightness(0) invert(1);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.news-image[src=""] {
  display: none;
}
</style>
