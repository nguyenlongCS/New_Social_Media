<!--
src/components/PostItem.vue - Fixed Media Display
Component hiển thị một bài viết với media carousel đẹp mắt, fix vấn đề single media và sizing
-->
<template>
  <div class="post" :data-post-id="post.id" ref="postElement">
    <div class="user-info">
      <div class="avatar">
        <img v-if="post.avatar" :src="post.avatar" alt="Avatar" class="avatar-image">
        <div v-else class="avatar-placeholder">{{ post.author?.[0]?.toUpperCase() || 'A' }}</div>
      </div>
      <div>
        <h3 class="user-name">{{ post.author || 'Admin' }}</h3>
        <p class="timestamp">{{ post.timestamp || '2 hours ago' }}</p>
      </div>
    </div>

    <h4 class="post-title">{{ post.title }}</h4>
    <p class="post-content">{{ post.shortContent }}</p>

    <!-- Media Display -->
    <div class="media-section" v-if="hasMedia">
      <!-- Single Media Display -->
      <div v-if="mediaItems.length === 1" class="single-media-container">
        <img v-if="mediaItems[0].type?.startsWith('image/') || !mediaItems[0].type" :src="mediaItems[0].url"
          :alt="post.title" class="single-media-image" @error="handleMediaError">
        <video v-else-if="mediaItems[0].type?.startsWith('video/')" :src="mediaItems[0].url" class="single-media-video"
          controls preload="metadata" @error="handleMediaError">
          Your browser does not support video.
        </video>
      </div>

      <!-- Multiple Media Carousel -->
      <div v-else class="media-carousel">
        <div class="multi-media-container">
          <div class="media-wrapper" :style="{ transform: `translateX(-${currentMediaIndex * 100}%)` }">
            <div v-for="(media, index) in mediaItems" :key="index" class="media-slide">
              <img v-if="media.type?.startsWith('image/') || !media.type" :src="media.url" :alt="`Media ${index + 1}`"
                class="carousel-media-image" @error="handleMediaError">
              <video v-else-if="media.type?.startsWith('video/')" :src="media.url" class="carousel-media-video" controls
                preload="metadata" @error="handleMediaError">
                Your browser does not support video.
              </video>
            </div>
          </div>

          <!-- Navigation arrows -->
          <button v-if="currentMediaIndex > 0" class="nav-btn nav-prev" @click="prevMedia" aria-label="Previous media">
            <span class="nav-icon">‹</span>
          </button>
          <button v-if="currentMediaIndex < mediaItems.length - 1" class="nav-btn nav-next" @click="nextMedia"
            aria-label="Next media">
            <span class="nav-icon">›</span>
          </button>

          <!-- Media counter -->
          <div class="media-counter">
            {{ currentMediaIndex + 1 }} / {{ mediaItems.length }}
          </div>
        </div>

        <!-- Dots indicator -->
        <div class="media-dots">
          <button v-for="(media, index) in mediaItems" :key="index"
            :class="['dot', { active: index === currentMediaIndex }]" @click="goToMedia(index)"
            :aria-label="`Go to media ${index + 1}`"></button>
        </div>
      </div>
    </div>

    <div class="actions">
      <button @click="handleLike">
        <img src="/src/assets/icons/like.png" alt="Like" width="16" height="16">
        <span>Like ({{ post.likes }})</span>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'

export default {
  name: 'PostItem',
  props: {
    post: {
      type: Object,
      required: true
    }
  },
  emits: ['post-visible', 'like-post'],
  setup(props, { emit }) {
    const postElement = ref(null)
    const currentMediaIndex = ref(0)
    let observer = null

    // Computed để xử lý media items với fallback tốt hơn
    const mediaItems = computed(() => {
      // Ưu tiên mediaItems array từ Firestore (posts mới)
      if (props.post.mediaItems && Array.isArray(props.post.mediaItems) && props.post.mediaItems.length > 0) {
        return props.post.mediaItems
      }

      // Fallback: tạo array từ image field cũ
      if (props.post.image && props.post.image.trim()) {
        return [{
          url: props.post.image,
          type: 'image/jpeg', // Default type cho legacy posts
          name: 'legacy-image'
        }]
      }

      // Fallback: tạo array từ MediaUrl
      if (props.post.MediaUrl && props.post.MediaUrl.trim()) {
        return [{
          url: props.post.MediaUrl,
          type: 'image/jpeg', // Default type
          name: 'media-url'
        }]
      }

      return []
    })

    const hasMedia = computed(() => {
      return mediaItems.value && mediaItems.value.length > 0
    })

    onMounted(() => {
      // Thiết lập Intersection Observer để theo dõi post hiển thị
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            emit('post-visible', props.post.id)
          }
        })
      }, {
        root: null,
        rootMargin: '-20% 0px -20% 0px', // Post cần hiển thị ít nhất 60% để được detect
        threshold: 0.6
      })

      if (postElement.value) {
        observer.observe(postElement.value)
      }
    })

    onUnmounted(() => {
      if (observer && postElement.value) {
        observer.unobserve(postElement.value)
      }
    })

    // Media navigation functions
    const nextMedia = () => {
      if (currentMediaIndex.value < mediaItems.value.length - 1) {
        currentMediaIndex.value++
      }
    }

    const prevMedia = () => {
      if (currentMediaIndex.value > 0) {
        currentMediaIndex.value--
      }
    }

    const goToMedia = (index) => {
      if (index >= 0 && index < mediaItems.value.length) {
        currentMediaIndex.value = index
      }
    }

    // Xử lý lỗi load media
    const handleMediaError = (event) => {
      console.warn('Media load error:', event.target.src)
      const fallback = document.createElement('div')
      fallback.className = 'media-error'
      fallback.innerHTML = '<span>Không thể tải media</span>'
      event.target.parentElement.replaceChild(fallback, event.target)
    }

    // Xử lý like bài viết
    const handleLike = () => {
      emit('like-post', props.post.id)
    }

    return {
      postElement,
      currentMediaIndex,
      mediaItems,
      hasMedia,
      nextMedia,
      prevMedia,
      goToMedia,
      handleMediaError,
      handleLike
    }
  }
}
</script>

<style scoped>
.post {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.post:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.post.selected {
  border: 2px solid #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  padding-bottom: 0.5rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.timestamp {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.post-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  padding: 0 1rem;
  line-height: 1.4;
}

.post-content {
  font-size: 0.875rem;
  color: #4b5563;
  margin: 0.5rem 0;
  padding: 0 1rem;
  line-height: 1.5;
}

/*Media Display*/
.media-section {
  margin: 0.75rem 0;
}

/* Single Media Styles */
.single-media-container {
  width: 100%;
  max-height: 500px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.single-media-image,
.single-media-video {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: cover;
  display: block;
}

/* Carousel Styles */
.media-carousel {
  position: relative;
}

/* Multi Media Styles */
.multi-media-container {
  width: 100%;
  max-height: 500px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-wrapper {
  display: flex;
  height: 100%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.media-slide {
  min-width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-media-image,
.carousel-media-video {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: cover;
  display: block;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  color: #1f2937;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.nav-btn:hover {
  background: white;
  transform: translateY(-50%) scale(1.1);
}

.nav-prev {
  left: 12px;
}

.nav-next {
  right: 12px;
}

.nav-icon {
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
}

.media-counter {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 500;
  z-index: 3;
}

.media-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: white;
}

.dot {
  width: 8px;
  height: 8px;
  border: none;
  background: #d1d5db;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dot:hover {
  background: #9ca3af;
  transform: scale(1.25);
}

.dot.active {
  background: #2563eb;
  transform: scale(1.25);
}

.actions {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid #f1f5f9;
}

.actions button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.actions button:hover {
  color: #2563eb;
  background: #f1f5f9;
}

.actions img {
  width: 16px;
  height: 16px;
}

.media-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 200px;
  background: #f9fafb;
  color: #9ca3af;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .media-container {
    height: 300px;
  }

  .single-media-container {
    max-height: 400px;
  }

  .nav-btn {
    width: 32px;
    height: 32px;
  }

  .nav-icon {
    font-size: 18px;
  }

  .nav-prev {
    left: 8px;
  }

  .nav-next {
    right: 8px;
  }
}
</style>