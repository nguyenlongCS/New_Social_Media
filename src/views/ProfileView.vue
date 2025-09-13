<!--
src/views/ProfileView.vue - Complete Version
Trang profile người dùng với data sync status và progress indicator - Full code
-->
<template>
  <div class="profile-view">
    <Header />
    
    <div v-if="isAuthLoading" class="loading-overlay" style="top: 3.75rem; height: calc(100vh - 3.75rem);">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Đang khởi tạo...</p>
      </div>
    </div>
    
    <div v-else class="profile-container">
      <div class="profile-card">
        <!-- Profile Header -->
        <div class="profile-header">
          <h1 class="page-title">Thông tin cá nhân</h1>
          <p class="page-subtitle">Quản lý thông tin và tùy chỉnh profile của bạn</p>
        </div>
        
        <!-- Data Sync Status -->
        <div v-if="isSyncing || syncStatus || syncError" class="sync-status-section">
          <div class="sync-status-card">
            <!-- Syncing progress -->
            <div v-if="isSyncing" class="sync-progress">
              <div class="sync-progress-bar">
                <div class="sync-progress-fill" :style="{ width: syncProgress + '%' }"></div>
              </div>
              <p class="sync-status-text">{{ syncStatus }} ({{ syncProgress }}%)</p>
            </div>
            
            <!-- Success status -->
            <div v-else-if="syncStatus && !syncError" class="sync-success">
              <div class="sync-icon sync-icon-success">✓</div>
              <p class="sync-status-text">{{ syncStatus }}</p>
            </div>
            
            <!-- Error status -->
            <div v-else-if="syncError" class="sync-error">
              <div class="sync-icon sync-icon-error">⚠</div>
              <p class="sync-error-text">{{ syncError }}</p>
            </div>
          </div>
        </div>
        
        <!-- Avatar Section -->
        <div class="avatar-section">
          <div class="avatar-container">
            <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar" class="avatar-image">
            <img v-else-if="profileData.Avatar" :src="profileData.Avatar" alt="Avatar" class="avatar-image">
            <div v-else class="default-avatar">{{ userInitials }}</div>
            
            <!-- Camera icon overlay -->
            <label for="avatar-upload" class="camera-overlay" :class="{ disabled: isUploading || isSyncing }">
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                @change="handleAvatarSelect"
                :disabled="isUploading || isSyncing"
                style="display: none;"
              >
              <img src="/src/assets/icons/camera.png" alt="Camera" class="camera-icon">
            </label>
            
            <!-- Upload progress -->
            <div v-if="isUploading" class="avatar-upload-progress">
              <div class="spinner-small"></div>
              <span>Đang upload...</span>
            </div>
          </div>
        </div>
        
        <!-- Profile Form -->
        <form @submit.prevent="handleSaveProfile" class="profile-form">
          <div class="form-group">
            <label for="username">Tên hiển thị</label>
            <input 
              id="username"
              type="text" 
              v-model="profileData.UserName"
              placeholder="Nhập tên hiển thị"
              :disabled="isSaving || isSyncing"
              required
            >
          </div>
          
          <div class="form-group">
            <label for="bio">Giới thiệu bản thân</label>
            <textarea 
              id="bio"
              v-model="profileData.Bio"
              placeholder="Viết vài dòng về bản thân bạn..."
              rows="3"
              :disabled="isSaving || isSyncing"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="gender">Giới tính</label>
            <select 
              id="gender" 
              v-model="profileData.Gender"
              :disabled="isSaving || isSyncing"
            >
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
          
          <!-- Error message -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          
          <!-- Success message -->
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>
          
          <!-- Form actions -->
          <div class="form-actions">
            <button 
              type="submit" 
              :disabled="isSaving || isUploading || isSyncing" 
              class="save-btn"
            >
              <span v-if="isSaving">Đang lưu...</span>
              <span v-else-if="isSyncing">Đang đồng bộ...</span>
              <span v-else>Lưu thay đổi</span>
            </button>
            
          </div>
        </form>
      </div>
    </div>

    <div>
      <LeftSide />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import Header from '../components/Header.vue'
import LeftSide from '../components/LeftSide.vue'
import { useAuthUser } from '../composables/useAuthUser'
import { useProfile } from '../composables/useProfile'

export default {
  name: 'ProfileView',
  components: {
    Header,
    LeftSide
  },
  setup() {
    // Sử dụng useAuthUser để giải quyết vấn đề auth state
    const { user, isAuthLoading, waitForUserWithTimeout } = useAuthUser()
    
    const {
      profileData,
      isLoading,
      isSaving,
      isUploading,
      errorMessage,
      successMessage,
      avatarPreview,
      selectedAvatarFile,
      isSyncing,
      syncProgress,
      syncStatus,
      syncError,
      loadUserProfile,
      saveUserProfile,
      uploadAvatar,
      selectAvatarFile
    } = useProfile()
    
    // Tạo initials cho default avatar
    const userInitials = computed(() => {
      if (profileData.value.UserName) {
        return profileData.value.UserName
          .split(' ')
          .map(name => name[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      }
      if (profileData.value.Email) {
        return profileData.value.Email[0].toUpperCase()
      }
      return 'U'
    })
    
    // Xử lý chọn avatar - chỉ preview, không upload ngay
    const handleAvatarSelect = async (event) => {
      try {
        await selectAvatarFile(event)
      } catch (error) {
        console.error('Error in avatar selection:', error)
      }
    }
    
    // Xử lý lưu profile - bao gồm cả avatar nếu có + data sync
    const handleSaveProfile = async () => {
      try {
        // Đợi user được khởi tạo nếu cần
        if (!user.value) {
          await waitForUserWithTimeout(3000)
        }
        
        // Upload avatar trước nếu có file được chọn
        if (selectedAvatarFile.value) {
          const avatarUploaded = await uploadAvatar()
          if (!avatarUploaded) {
            return // Dừng nếu upload avatar thất bại
          }
        }
        
        // Sau đó lưu thông tin profile (sẽ tự động sync nếu có thay đổi UserName)
        await saveUserProfile()
      } catch (error) {
        console.error('Error saving profile:', error)
      }
    }
    
    // Load data khi component mount
    onMounted(async () => {
      try {
        const currentUser = await waitForUserWithTimeout(3000)
        if (currentUser?.uid) {
          await loadUserProfile(currentUser.uid)
        }
      } catch (error) {
        // Fallback: thử với user hiện tại nếu có
        if (user.value?.uid) {
          await loadUserProfile(user.value.uid)
        }
      }
    })
    
    return {
      user,
      isAuthLoading,
      profileData,
      isLoading,
      isSaving,
      isUploading,
      errorMessage,
      successMessage,
      avatarPreview,
      selectedAvatarFile,
      isSyncing,
      syncProgress,
      syncStatus,
      syncError,
      userInitials,
      handleAvatarSelect,
      handleSaveProfile
    }
  }
}
</script>

<style scoped>
.profile-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 3.75rem;
}

.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
}

.profile-header {
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

/* Data Sync Status Styles */
.sync-status-section {
  margin-bottom: 2rem;
}

.sync-status-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
}

.sync-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.sync-progress-bar {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.sync-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  transition: width 0.3s ease;
}

.sync-status-text {
  font-size: 0.875rem;
  color: #475569;
  margin: 0;
  text-align: center;
}

.sync-success,
.sync-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.sync-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.sync-icon-success {
  background: #16a34a;
}

.sync-icon-error {
  background: #dc2626;
}

.sync-error-text {
  color: #dc2626;
  font-size: 0.875rem;
  margin: 0;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.avatar-container {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 0;
}

.avatar-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #e5e7eb;
}

.default-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  border: 4px solid #e5e7eb;
}

.camera-overlay {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  background: #2563eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.camera-overlay:hover:not(.disabled) {
  background: #1d4ed8;
  transform: scale(1.1);
}

.camera-overlay.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.camera-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

.avatar-upload-progress {
  position: absolute;
  bottom: -30px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #2563eb;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-group input:disabled,
.form-group textarea:disabled,
.form-group select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f9fafb;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #fecaca;
}

.success-message {
  background: #f0fdf4;
  color: #16a34a;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #bbf7d0;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.save-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
  
  .sync-status-card {
    padding: 0.75rem;
  }
}
</style>