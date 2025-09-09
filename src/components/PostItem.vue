<!--
src/components/PostItem.vue - Refactored
Component hiển thị một bài viết đơn lẻ
-->
<template>
  <div 
    class="post" 
    :data-post-id="post.id"
    ref="postElement"
  >
    <div class="user-info">
      <div class="avatar"></div>
      <div>
        <h3 class="user-name">{{ post.author || 'Admin' }}</h3>
        <p class="timestamp">{{ post.timestamp || '2 hours ago' }}</p>
      </div>
    </div>
    
    <h4 class="post-title">{{ post.title }}</h4>
    <p class="post-content">{{ post.shortContent }}</p>
    
    <div class="image-container" v-if="post.image">
      <img 
        :src="post.image" 
        :alt="post.title"
        @error="handleImageError"
      >
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
import { ref, onMounted, onUnmounted } from 'vue'

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
    let observer = null
    
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
    
    // Xử lý lỗi load ảnh
    const handleImageError = (event) => {
      event.target.style.display = 'none'
      event.target.parentElement.innerText = 'Image failed to load'
    }
    
    // Xử lý like bài viết
    const handleLike = () => {
      emit('like-post', props.post.id)
    }
    
    return {
      postElement,
      handleImageError,
      handleLike
    }
  }
}
</script>