<!--
src/components/DiscoverItem.vue - Component hiển thị một item trong discover grid
Hiển thị media, số lượt like, trending badge, auto-play video
-->
<template>
    <div class="discover-item" :class="{
        'trending-item': isTrending,
        'video-item': isVideoPost,
        'large-item': isLargeItem
    }" @click="handleClick">
        <!-- Trending Badge -->
        <div v-if="isTrending" class="trending-badge">
            <span class="trending-icon">🔥</span>
            <span>Trending</span>
        </div>

        <!-- Media Container -->
        <div class="media-container">
            <!-- Image -->
            <img v-if="mainMedia && !mainMedia.type?.startsWith('video/')" :src="mainMedia.url" :alt="post.title"
                class="media-image" @error="handleMediaError">

            <!-- Video with auto-play -->
            <video v-else-if="mainMedia && mainMedia.type?.startsWith('video/')" :src="mainMedia.url"
                class="media-video" autoplay muted loop playsinline @error="handleMediaError">
                Your browser does not support video.
            </video>

            <!-- Fallback for no media -->
            <div v-else class="no-media">
                <span>No Media</span>
            </div>

            <!-- Video indicator -->
            <div v-if="isVideoPost" class="video-indicator">
                <span class="play-icon">▶</span>
            </div>
        </div>

        <!-- Post Info Overlay -->
        <div class="post-info-overlay">
            <div class="post-stats">
                <div class="likes-count">
                    <span class="heart-icon">❤️</span>
                    <span>{{ formatLikesCount(post.likes) }}</span>
                </div>
            </div>

            <div class="post-meta">
                <h3 class="post-title">{{ post.title }}</h3>
                <div class="author-info">
                    <img v-if="post.avatar" :src="post.avatar" alt="Avatar" class="author-avatar">
                    <div v-else class="default-avatar">{{ post.author?.[0]?.toUpperCase() || 'A' }}</div>
                    <span class="author-name">{{ post.author }}</span>
                </div>
            </div>
        </div>

        <!-- Hover Overlay with more details -->
        <div class="hover-overlay">
            <div class="hover-content">
                <h4 class="hover-title">{{ post.title }}</h4>
                <p class="hover-content-text">{{ truncateContent(post.content) }}</p>
                <div class="hover-stats">
                    <span class="stat-item">
                        <span class="heart-icon">❤️</span>
                        {{ post.likes }} lượt thích
                    </span>
                    <span class="stat-item">
                        <span class="time-icon">🕒</span>
                        {{ post.timestamp }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { computed } from 'vue'

export default {
    name: 'DiscoverItem',
    props: {
        post: {
            type: Object,
            required: true
        },
        isTrending: {
            type: Boolean,
            default: false
        }
    },
    emits: ['click'],
    setup(props, { emit }) {

        // Lấy media chính của post
        const mainMedia = computed(() => {
            if (props.post.mediaItems && props.post.mediaItems.length > 0) {
                return props.post.mediaItems[0]
            }

            if (props.post.mediaUrl) {
                return {
                    url: props.post.mediaUrl,
                    type: 'image/jpeg' // Default type
                }
            }

            return null
        })

        // Kiểm tra có phải video không
        const isVideoPost = computed(() => {
            return mainMedia.value?.type?.startsWith('video/')
        })

        // Random để tạo layout bất đối xứng
        const isLargeItem = computed(() => {
            // Sử dụng post ID để tạo pattern nhất quán
            return parseInt(props.post.id.slice(-1), 16) % 3 === 0
        })

        // Format số lượt like
        const formatLikesCount = (count) => {
            if (!count) return '0'
            if (count >= 1000000) {
                return Math.floor(count / 1000000) + 'M'
            }
            if (count >= 1000) {
                return Math.floor(count / 1000) + 'K'
            }
            return count.toString()
        }

        // Cắt ngắn nội dung
        const truncateContent = (content) => {
            if (!content) return ''
            return content.length > 100 ? content.substring(0, 100) + '...' : content
        }

        // Xử lý lỗi media
        const handleMediaError = (event) => {
            console.warn('Media load error:', event.target.src)
            event.target.style.display = 'none'

            // Hiển thị fallback
            const fallback = document.createElement('div')
            fallback.className = 'media-error'
            fallback.innerHTML = '<span>Không thể tải media</span>'
            event.target.parentElement.appendChild(fallback)
        }

        // Xử lý click
        const handleClick = () => {
            emit('click', props.post)
        }

        return {
            mainMedia,
            isVideoPost,
            isLargeItem,
            formatLikesCount,
            truncateContent,
            handleMediaError,
            handleClick
        }
    }
}
</script>

<style scoped>
.discover-item {
    position: relative;
    border-radius: 1rem;
    overflow: hidden;
    cursor: pointer;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    min-height: 250px;
}

.discover-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Trending items có border đặc biệt */
.trending-item {
    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);
}

/* Large items cho asymmetrical layout */
.large-item {
    min-height: 350px;
}

.trending-badge {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    background: linear-gradient(45deg, #f59e0b, #ef4444);
    color: white;
    padding: 0.375rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    z-index: 3;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.trending-icon {
    font-size: 0.875rem;
}

.media-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 200px;
    overflow: hidden;
}

.media-image,
.media-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.discover-item:hover .media-image,
.discover-item:hover .media-video {
    transform: scale(1.05);
}

.no-media {
    width: 100%;
    height: 100%;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    font-size: 0.875rem;
}

.media-error {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    font-size: 0.875rem;
}

.video-indicator {
    position: absolute;
    bottom: 0.75rem;
    right: 0.75rem;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
}

.play-icon {
    font-size: 0.75rem;
    margin-left: 2px;
    /* Căn giữa icon play */
}

.post-info-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
    color: white;
    padding: 1.5rem 1rem 1rem;
    z-index: 2;
}

.post-stats {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.75rem;
}

.likes-count {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    font-weight: 500;
}

.heart-icon {
    font-size: 0.875rem;
}

.post-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.post-title {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0;
    line-height: 1.3;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.author-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.author-avatar {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.default-avatar {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.author-name {
    font-size: 0.75rem;
    font-weight: 500;
    opacity: 0.9;
}

/* Hover Overlay - hiển thị khi hover */
.hover-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 4;
    padding: 1rem;
}

.discover-item:hover .hover-overlay {
    opacity: 1;
}

.hover-content {
    text-align: center;
    max-width: 100%;
}

.hover-title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    line-height: 1.3;
}

.hover-content-text {
    font-size: 0.875rem;
    opacity: 0.9;
    margin: 0 0 1rem 0;
    line-height: 1.4;
}

.hover-stats {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
}

.time-icon {
    font-size: 0.75rem;
}
</style>