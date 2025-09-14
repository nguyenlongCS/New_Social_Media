<!--
src/components/NearbyUsers.vue - Component tìm bạn xung quanh với Mapbox
Hiển thị bản đồ và danh sách người dùng gần đây, yêu cầu quyền truy cập vị trí
Tích hợp Mapbox GL JS để hiển thị interactive map với markers
-->
<template>
  <div class="nearby-users">
    <!-- Header với controls -->
    <div class="nearby-header">
      <div class="header-left">
        <h3 class="nearby-title">Tìm bạn xung quanh</h3>
        <p class="nearby-subtitle">Khám phá những người dùng gần bạn</p>
      </div>
      
      <div class="header-controls">
        <!-- View mode toggle -->
        <div v-if="currentLocation" class="view-toggle">
          <button 
            :class="['toggle-btn', { active: viewMode === 'map' }]"
            @click="handleViewModeChange('map')"
          >
            <img src="@/assets/icons/discover.png" alt="Map" width="16" height="16">
            Bản đồ
          </button>
          <button 
            :class="['toggle-btn', { active: viewMode === 'list' }]"
            @click="handleViewModeChange('list')"
          >
            <img src="@/assets/icons/friends.png" alt="List" width="16" height="16">
            Danh sách
          </button>
        </div>
        
        <!-- Refresh location button -->
        <button 
          v-if="currentLocation"
          @click="handleRefreshLocation"
          :disabled="isRefreshing"
          class="refresh-btn"
        >
          <img src="@/assets/icons/setting.png" alt="Refresh" width="16" height="16">
          <span v-if="isRefreshing">Đang làm mới...</span>
          <span v-else>Làm mới</span>
        </button>
      </div>
    </div>
    
    <!-- Permission request -->
    <div v-if="!currentLocation && !permissionDenied" class="location-request">
      <div class="request-content">
        <div class="location-icon">📍</div>
        <h4>Chia sẻ vị trí của bạn</h4>
        <p>Để tìm bạn bè xung quanh, chúng tôi cần quyền truy cập vị trí của bạn.</p>
        
        <button 
          @click="handleGetLocation"
          :disabled="isGettingLocation"
          class="get-location-btn"
        >
          <span v-if="isGettingLocation">Đang lấy vị trí...</span>
          <span v-else>Cho phép truy cập vị trí</span>
        </button>
      </div>
    </div>
    
    <!-- Permission denied -->
    <div v-else-if="permissionDenied" class="permission-denied">
      <div class="denied-content">
        <div class="warning-icon">⚠️</div>
        <h4>Quyền truy cập vị trí bị từ chối</h4>
        <p>Để sử dụng tính năng này, vui lòng:</p>
        <ul>
          <li>Cho phép truy cập vị trí trong cài đặt trình duyệt</li>
          <li>Reload trang và thử lại</li>
        </ul>
        <button @click="handleGetLocation" class="retry-btn">
          Thử lại
        </button>
      </div>
    </div>
    
    <!-- Error message -->
    <div v-else-if="errorMessage" class="error-state">
      <div class="error-content">
        <div class="error-icon">❌</div>
        <h4>Có lỗi xảy ra</h4>
        <p>{{ errorMessage }}</p>
        <button @click="handleGetLocation" class="retry-btn">
          Thử lại
        </button>
      </div>
    </div>
    
    <!-- Main content khi đã có vị trí -->
    <div v-else-if="currentLocation" class="nearby-content">
      
      <!-- Map view -->
      <div v-if="viewMode === 'map'" class="map-container">
        <!-- Mapbox container -->
        <div ref="mapContainer" class="mapbox-container"></div>
        
        <!-- Map loading overlay -->
        <div v-if="isLoadingNearby" class="map-loading">
          <div class="spinner"></div>
          <p>Đang tìm kiếm...</p>
        </div>
        
        <!-- Map info panel -->
        <div class="map-info">
          <div class="location-info">
            <img src="@/assets/icons/profile.png" alt="Current" width="16" height="16">
            <span>Vị trí hiện tại của bạn</span>
          </div>
          <div v-if="nearbyUsers.length > 0" class="users-count">
            Tìm thấy {{ nearbyUsers.length }} người xung quanh
          </div>
        </div>
      </div>
      
      <!-- List view -->
      <div v-else class="list-container">
        <!-- Loading -->
        <div v-if="isLoadingNearby" class="loading-users">
          <div class="spinner"></div>
          <p>Đang tìm kiếm người dùng xung quanh...</p>
        </div>
        
        <!-- Users list -->
        <div v-else-if="nearbyUsers.length > 0" class="users-list">
          <div 
            v-for="user in nearbyUsers"
            :key="user.userId"
            class="user-item"
          >
            <div class="user-avatar">
              <img 
                v-if="user.avatar" 
                :src="user.avatar" 
                :alt="user.userName"
                class="avatar-image"
              >
              <div v-else class="default-avatar">
                {{ user.userName[0]?.toUpperCase() || 'U' }}
              </div>
            </div>
            
            <div class="user-info">
              <h4 class="user-name">{{ user.userName }}</h4>
              <p v-if="user.bio" class="user-bio">{{ user.bio }}</p>
              <div class="user-distance">
                <img src="@/assets/icons/discover.png" alt="Distance" width="12" height="12">
                <span>{{ user.distanceText }}</span>
              </div>
            </div>
            
            <div class="user-actions">
              <button 
                @click="handleSendFriendRequest(user)"
                class="add-friend-btn"
                :disabled="isProcessing"
              >
                Kết bạn
              </button>
            </div>
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-else class="no-users">
          <div class="no-users-icon">👥</div>
          <h4>Không có ai xung quanh</h4>
          <p>Không tìm thấy người dùng nào trong bán kính 10km.</p>
          <button @click="handleRefreshLocation" class="refresh-search-btn">
            Tìm kiếm lại
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useLocation } from '../composables/useLocation'
import { useAuthUser } from '../composables/useAuthUser'
import { useFriends } from '../composables/useFriends'

export default {
  name: 'NearbyUsers',
  emits: ['send-friend-request'],
  setup(_, { emit }) {
    const mapContainer = ref(null)
    const isRefreshing = ref(false)
    const isProcessing = ref(false)
    
    // Composables
    const { 
      currentLocation,
      nearbyUsers,
      isGettingLocation,
      isLoadingNearby,
      errorMessage,
      permissionDenied,
      viewMode,
      mapInstance,
      getCurrentLocation,
      saveUserLocation,
      getNearbyUsers,
      removeUserLocation,
      initializeMap,
      addCurrentUserMarker,
      addNearbyUserMarkers,
      fitMapBounds,
      resetLocationState
    } = useLocation()
    
    const { user, waitForUserWithTimeout } = useAuthUser()
    const { sendFriendRequest } = useFriends()
    
    // Lấy vị trí và setup map/danh sách
    const handleGetLocation = async () => {
      try {
        // Đảm bảo user đã đăng nhập
        const currentUser = await waitForUserWithTimeout(3000)
        if (!currentUser?.uid) {
          throw new Error('Vui lòng đăng nhập để sử dụng tính năng này')
        }
        
        console.log('Getting location for user:', currentUser.uid)
        
        // Lấy vị trí hiện tại
        const location = await getCurrentLocation()
        console.log('Location obtained:', location)
        
        // Lưu vị trí lên Firestore
        await saveUserLocation(currentUser.uid, location)
        console.log('Location saved successfully')
        
        // Tìm nearby users
        await getNearbyUsers(currentUser.uid, location, 100)
        
        // Setup map nếu view mode là map
        if (viewMode.value === 'map') {
          await setupMap()
        }
        
      } catch (error) {
        console.error('Error getting location:', error)
        if (error.message.includes('permissions')) {
          errorMessage.value = 'Lỗi quyền truy cập database. Vui lòng liên hệ admin.'
        }
      }
    }
    
    // Setup Mapbox map
    const setupMap = async () => {
      await nextTick()
      
      if (!mapContainer.value || !currentLocation.value) return
      
      // Chờ Mapbox GL JS được load (nếu chưa có)
      if (!window.mapboxgl) {
        await loadMapboxGL()
      }
      
      // Khởi tạo map
      const map = initializeMap(mapContainer.value, {
        center: [currentLocation.value.lng, currentLocation.value.lat],
        zoom: 13
      })
      
      if (map) {
        // Thêm marker cho user hiện tại
        addCurrentUserMarker(map, currentLocation.value, 'Bạn')
        
        // Thêm markers cho nearby users
        if (nearbyUsers.value.length > 0) {
          addNearbyUserMarkers(map, nearbyUsers.value)
          
          // Fit bounds để hiển thị tất cả
          const allLocations = [
            currentLocation.value,
            ...nearbyUsers.value
          ]
          fitMapBounds(map, allLocations)
        }
      }
    }
    
    // Load Mapbox GL JS dynamically
    const loadMapboxGL = () => {
      return new Promise((resolve, reject) => {
        if (window.mapboxgl) {
          resolve()
          return
        }
        
        // Load CSS
        const link = document.createElement('link')
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
        link.rel = 'stylesheet'
        document.head.appendChild(link)
        
        // Load JS
        const script = document.createElement('script')
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Mapbox GL JS'))
        document.head.appendChild(script)
      })
    }
    
    // Chuyển view mode
    const handleViewModeChange = async (mode) => {
      if (viewMode.value === mode) return
      
      viewMode.value = mode
      
      if (mode === 'map' && currentLocation.value) {
        await nextTick()
        await setupMap()
      }
    }
    
    // Làm mới vị trí và tìm kiếm lại
    const handleRefreshLocation = async () => {
      isRefreshing.value = true
      
      try {
        await handleGetLocation()
      } finally {
        isRefreshing.value = false
      }
    }
    
    // Gửi lời mời kết bạn
    const handleSendFriendRequest = async (targetUser) => {
      emit('send-friend-request', targetUser)
    }
    
    // Cleanup khi component unmount
    onUnmounted(() => {
      resetLocationState()
    })
    
    return {
      mapContainer,
      isRefreshing,
      isProcessing,
      currentLocation,
      nearbyUsers,
      isGettingLocation,
      isLoadingNearby,
      errorMessage,
      permissionDenied,
      viewMode,
      handleGetLocation,
      handleViewModeChange,
      handleRefreshLocation,
      handleSendFriendRequest
    }
  }
}
</script>

<style scoped>
.nearby-users {
  padding: 1rem;
}

.nearby-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.header-left {
  flex: 1;
}

.nearby-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.nearby-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.view-toggle {
  display: flex;
  background: #f1f5f9;
  border-radius: 0.375rem;
  padding: 0.125rem;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Location request styles */
.location-request,
.permission-denied,
.error-state {
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
}

.request-content,
.denied-content,
.error-content {
  text-align: center;
  max-width: 400px;
}

.location-icon,
.warning-icon,
.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.request-content h4,
.denied-content h4,
.error-content h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.request-content p,
.denied-content p,
.error-content p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.denied-content ul {
  text-align: left;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  padding-left: 1.25rem;
}

.get-location-btn,
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

.get-location-btn:hover:not(:disabled),
.retry-btn:hover {
  background: #1d4ed8;
}

.get-location-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Map container styles - Enhanced for better visibility */
.map-container {
  position: relative;
  height: 450px;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #f1f5f9;
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
}

.mapbox-container {
  width: 100%;
  height: 100%;
}

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.map-loading .spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.map-loading p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.map-info {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.users-count {
  font-size: 0.75rem;
  color: #6b7280;
}

/* List container styles */
.list-container {
  min-height: 300px;
}

.loading-users {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

.loading-users .spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-users p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.user-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.user-avatar {
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.default-avatar {
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

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.user-bio {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.user-distance {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.user-actions {
  flex-shrink: 0;
}

.add-friend-btn {
  padding: 0.5rem 1rem;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.add-friend-btn:hover:not(:disabled) {
  background: #15803d;
}

.add-friend-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* No users state */
.no-users {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.no-users-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-users h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.no-users p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

.refresh-search-btn {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.refresh-search-btn:hover {
  background: #e2e8f0;
}
</style>