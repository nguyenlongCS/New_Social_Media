<!--
src/components/FriendsMain.vue - Component trung tâm quản lý nội dung friends
Hiển thị 4 tab: Danh sách bạn, Gợi ý bạn bè, Lời mời kết bạn, Tìm bạn xung quanh
-->
<template>
  <div class="friends-main">
    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Danh sách bạn bè -->
      <div v-if="activeTab === 'friends'" class="friends-tab">
        <div class="tab-header">
          <h2>Danh sách bạn bè</h2>
          <p>{{ friendsList.length }} bạn bè</p>
        </div>
        
        <div v-if="isLoadingFriends && friendsList.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Đang tải danh sách bạn bè...</p>
        </div>
        
        <div v-else-if="friendsList.length === 0" class="empty-state">
          <h3>Chưa có bạn bè</h3>
          <p>Hãy bắt đầu kết nối với những người bạn quen biết!</p>
        </div>
        
        <div v-else class="friends-grid">
          <div 
            v-for="friend in friendsList"
            :key="friend.userId"
            class="friend-card"
          >
            <div class="friend-card-avatar">
              <img v-if="friend.avatar" :src="friend.avatar" alt="Avatar" class="card-avatar-img">
              <div v-else class="default-card-avatar">{{ friend.userName?.[0]?.toUpperCase() || 'U' }}</div>
            </div>
            <div class="friend-card-info">
              <h3 class="friend-card-name">{{ friend.userName }}</h3>
              <p class="friend-card-email">{{ friend.email }}</p>
              <p v-if="friend.bio" class="friend-card-bio">{{ friend.bio }}</p>
            </div>
            <div class="friend-card-actions">
              <button 
                @click="$emit('unfriend', friend)"
                class="unfriend-btn"
                :disabled="isProcessing"
              >
                Hủy kết bạn
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Gợi ý bạn bè -->
      <div v-else-if="activeTab === 'suggestions'" class="suggestions-tab">
        <div class="tab-header">
          <h2>Gợi ý bạn bè</h2>
          <p>Những người bạn có thể quen biết</p>
        </div>
        
        <div v-if="isLoadingUsers && usersList.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Đang tải gợi ý...</p>
        </div>
        
        <div v-else-if="usersList.length === 0" class="empty-state">
          <h3>Không có gợi ý</h3>
          <p>Hiện tại không có gợi ý bạn bè mới.</p>
        </div>
        
        <div v-else class="suggestions-grid">
          <div 
            v-for="user in usersList"
            :key="user.userId"
            class="suggestion-card"
          >
            <div class="suggestion-card-avatar">
              <img v-if="user.avatar" :src="user.avatar" alt="Avatar" class="card-avatar-img">
              <div v-else class="default-card-avatar">{{ user.userName?.[0]?.toUpperCase() || 'U' }}</div>
            </div>
            <div class="suggestion-card-info">
              <h3 class="suggestion-card-name">{{ user.userName }}</h3>
              <p class="suggestion-card-email">{{ user.email }}</p>
              <p v-if="user.bio" class="suggestion-card-bio">{{ user.bio }}</p>
            </div>
            <div class="suggestion-card-actions">
              <button 
                @click="$emit('send-request', user)"
                class="add-friend-btn"
                :disabled="isProcessing"
              >
                Gửi lời mời
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Lời mời kết bạn -->
      <div v-else-if="activeTab === 'requests'" class="requests-tab">
        <div class="tab-header">
          <h2>Lời mời kết bạn</h2>
          <p>{{ friendRequests.length }} lời mời đang chờ</p>
        </div>
        
        <div v-if="isLoadingRequests && friendRequests.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Đang tải lời mời...</p>
        </div>
        
        <div v-else-if="friendRequests.length === 0" class="empty-state">
          <h3>Không có lời mời</h3>
          <p>Bạn không có lời mời kết bạn nào.</p>
        </div>
        
        <div v-else class="requests-grid">
          <div 
            v-for="request in friendRequests"
            :key="request.requestId"
            class="request-card"
          >
            <div class="request-card-avatar">
              <img v-if="request.avatar" :src="request.avatar" alt="Avatar" class="card-avatar-img">
              <div v-else class="default-card-avatar">{{ request.userName?.[0]?.toUpperCase() || 'U' }}</div>
            </div>
            <div class="request-card-info">
              <h3 class="request-card-name">{{ request.userName }}</h3>
              <p class="request-card-email">{{ request.email }}</p>
              <p class="request-card-time">{{ request.createdAt }}</p>
            </div>
            <div class="request-card-actions">
              <button 
                @click="$emit('accept-request', request)"
                class="accept-btn"
                :disabled="isProcessing"
              >
                Chấp nhận
              </button>
              <button 
                @click="$emit('reject-request', request)"
                class="reject-btn"
                :disabled="isProcessing"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tìm bạn xung quanh -->
      <div v-else-if="activeTab === 'nearby'" class="nearby-tab">
        <div class="tab-header">
          <h2>Tìm bạn xung quanh</h2>
          <p>Tính năng đang phát triển</p>
        </div>
        
        <div class="coming-soon">
          <h3>Sắp ra mắt</h3>
          <p>Tính năng tìm bạn xung quanh sẽ được phát triển trong phiên bản tiếp theo.</p>
        </div>
      </div>
    </div>
    
    <!-- Error message -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'FriendsMain',
  props: {
    activeTab: {
      type: String,
      required: true
    },
    friendsList: {
      type: Array,
      default: () => []
    },
    usersList: {
      type: Array,
      default: () => []
    },
    friendRequests: {
      type: Array,
      default: () => []
    },
    isLoadingFriends: {
      type: Boolean,
      default: false
    },
    isLoadingUsers: {
      type: Boolean,
      default: false
    },
    isLoadingRequests: {
      type: Boolean,
      default: false
    },
    isProcessing: {
      type: Boolean,
      default: false
    },
    errorMessage: {
      type: String,
      default: ''
    }
  },
  emits: ['unfriend', 'send-request', 'accept-request', 'reject-request']
}
</script>

<style scoped>
.friends-main {
  width: calc(50vw - 2rem);
  margin: 0 auto;
  padding: 2rem 1rem;
}

.tab-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.tab-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.tab-header p {
  color: #6b7280;
  margin: 0;
}

/* Loading and Empty States */
.loading-state,
.empty-state,
.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.loading-state .spinner {
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

.loading-state p,
.empty-state p,
.coming-soon p {
  color: #6b7280;
  margin: 0;
}

.empty-state h3,
.coming-soon h3 {
  color: #374151;
  margin: 0 0 0.5rem 0;
}

/* Card Grids */
.friends-grid,
.suggestions-grid,
.requests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.friend-card,
.suggestion-card,
.request-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.friend-card:hover,
.suggestion-card:hover,
.request-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.12);
}

.friend-card-avatar,
.suggestion-card-avatar,
.request-card-avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.card-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.default-card-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
}

.friend-card-name,
.suggestion-card-name,
.request-card-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.friend-card-email,
.suggestion-card-email,
.request-card-email {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.friend-card-bio,
.suggestion-card-bio {
  font-size: 0.8125rem;
  color: #4b5563;
  margin-bottom: 1rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.request-card-time {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

/* Action Buttons */
.friend-card-actions,
.suggestion-card-actions {
  margin-top: 1rem;
}

.request-card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.unfriend-btn {
  width: 100%;
  padding: 0.5rem 1rem;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.unfriend-btn:hover:not(:disabled) {
  background: #fecaca;
}

.add-friend-btn {
  width: 100%;
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.add-friend-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.accept-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.accept-btn:hover:not(:disabled) {
  background: #15803d;
}

.reject-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.reject-btn:hover:not(:disabled) {
  background: #e2e8f0;
}

.unfriend-btn:disabled,
.add-friend-btn:disabled,
.accept-btn:disabled,
.reject-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #fecaca;
  margin-top: 1rem;
}
</style>