<!--
src/views/ProfileView.vue - Trang profile người dùng
Hiển thị và chỉnh sửa thông tin cá nhân, upload avatar với icon camera
-->
<template>
  <div class="profile-view">
    <Header />
    
    <div v-if="isAuthLoading" class="loading-overlay" style="top: 3.75rem; height: calc(100vh - 3.75rem);">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Đang tải...</p>
      </div>
    </div>
    
    <div v-else class="profile-container">
      <div class="profile-card">
        <!-- Profile Header -->
        <div class="profile-header">
          <h1 class="page-title">Thông tin cá nhân</h1>
          <p class="page-subtitle">Quản lý thông tin và tùy chỉnh profile của bạn</p>
        </div>
        
        <!-- Avatar Section -->
        <div class="avatar-section">
          <div class="avatar-container">
            <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar" class="avatar-image">
            <img v-else-if="profileData.Avatar" :src="profileData.Avatar" alt="Avatar" class="avatar-image">
            <div v-else class="default-avatar">{{ userInitials }}</div>
            
            <!-- Camera icon overlay -->
            <label for="avatar-upload" class="camera-overlay">
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                @change="handleAvatarSelect"
                style="display: none;"
              >
              <img src="/src/assets/icons/camera.png" alt="Camera" class="camera-icon">
            </label>
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
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="gender">Giới tính</label>
            <select id="gender" v-model="profileData.Gender">
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
            <button type="submit" :disabled="isSaving || isUploading" class="save-btn">
              <span v-if="isSaving || isUploading">Đang lưu...</span>
              <span v-else>Lưu thay đổi</span>
            </button>
            
            <button type="button" @click="resetForm" class="reset-btn">
              Khôi phục
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
import { useAuth } from '../composables/useAuth'
import { useProfile } from '../composables/useProfile'

export default {
  name: 'ProfileView',
  components: {
    Header,
    LeftSide
  },
  setup() {
    const { user } = useAuth()
    const {
      profileData,
      isLoading,
      isSaving,
      isUploading,
      errorMessage,
      successMessage,
      avatarPreview,
      selectedAvatarFile,
      loadUserProfile,
      saveUserProfile,
      uploadAvatar,
      selectAvatarFile,
      resetProfileForm
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
    
    // Xử lý lưu profile - bao gồm cả avatar nếu có
    const handleSaveProfile = async () => {
      try {
        // Upload avatar trước nếu có file được chọn
        if (selectedAvatarFile.value) {
          const avatarUploaded = await uploadAvatar()
          if (!avatarUploaded) {
            return // Dừng nếu upload avatar thất bại
          }
        }
        
        // Sau đó lưu thông tin profile
        await saveUserProfile()
      } catch (error) {
        console.error('Error saving profile:', error)
      }
    }
    
    // Reset form về trạng thái ban đầu
    const resetForm = () => {
      resetProfileForm()
    }
    
    // Load data khi component mount
    onMounted(async () => {
      if (user.value?.uid) {
        await loadUserProfile(user.value.uid)
      } else {
        // Nếu chưa có user, đợi auth state
        const { onAuthStateChanged } = await import('firebase/auth')
        const { auth } = await import('@/firebase/config')
        
        onAuthStateChanged(auth, async (authUser) => {
          if (authUser) {
            await loadUserProfile(authUser.uid)
          }
        })
      }
    })
    
    return {
      profileData,
      isLoading,
      isSaving,
      isUploading,
      errorMessage,
      successMessage,
      avatarPreview,
      selectedAvatarFile,
      userInitials,
      handleAvatarSelect,
      handleSaveProfile,
      resetForm
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

.camera-overlay:hover {
  background: #1d4ed8;
  transform: scale(1.1);
}

.camera-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
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

.reset-btn {
  padding: 0.75rem 1.5rem;
  background: #f1f5f9;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.reset-btn:hover {
  background: #e2e8f0;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
}
</style>