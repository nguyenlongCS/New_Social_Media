<!--
src/views/SettingsView.vue - Settings Page
Trang cài đặt ứng dụng với chức năng chuyển đổi ngôn ngữ
Sử dụng LanguageManager để thực hiện global text replacement
-->
<template>
  <div class="settings-view">
    <Header />
    
    <div v-if="isAuthLoading" class="loading-overlay" style="top: 3.75rem; height: calc(100vh - 3.75rem);">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Đang tải...</p>
      </div>
    </div>
    
    <div v-else class="settings-container">
      <div class="settings-card">
        <!-- Settings Header -->
        <div class="settings-header">
          <h1 class="page-title">Cài đặt</h1>
          <p class="page-subtitle">Tùy chỉnh trải nghiệm ứng dụng của bạn</p>
        </div>
        
        <!-- Language Settings Section -->
        <div class="settings-section">
          <div class="section-header">
            <div class="section-icon">
              <img src="@/assets/icons/language.png" alt="Language" width="24" height="24">
            </div>
            <div class="section-info">
              <h3 class="section-title">Ngôn ngữ</h3>
              <p class="section-description">Chọn ngôn ngữ hiển thị cho ứng dụng</p>
            </div>
          </div>
          
          <div class="language-options">
            <div 
              v-for="language in availableLanguages"
              :key="language.code"
              class="language-option"
              :class="{ active: currentLanguage === language.code }"
              @click="handleLanguageChange(language.code)"
            >
              <div class="language-info">
                <div class="language-name">{{ language.name }}</div>
                <div class="language-code">{{ language.code.toUpperCase() }}</div>
              </div>
              <div v-if="currentLanguage === language.code" class="language-selected">
                <div class="check-icon">✓</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Success message khi đổi ngôn ngữ -->
        <div v-if="showSuccessMessage" class="success-message">
          Đã thay đổi ngôn ngữ thành công!
        </div>
        
        <div class="settings-section">
          <div class="section-header">
            <div class="section-icon">
              <img src="@/assets/icons/theme.png" alt="Theme" width="24" height="24">
            </div>
            <div class="section-info">
              <h3 class="section-title">Giao diện</h3>
              <p class="section-description">Tùy chỉnh giao diện ứng dụng (Tính năng sắp ra mắt)</p>
            </div>
          </div>
          
          <div class="coming-soon">
            <span class="coming-soon-text">Sắp ra mắt</span>
          </div>
        </div>
      </div>
    </div>

    <div>
      <LeftSide />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import Header from '../components/Header.vue'
import LeftSide from '../components/LeftSide.vue'
import { useAuthUser } from '../composables/useAuthUser'
import languageManager from '../utils/languageManager'

export default {
  name: 'SettingsView',
  components: {
    Header,
    LeftSide
  },
  setup() {
    const { isAuthLoading } = useAuthUser()
    const currentLanguage = ref(languageManager.getCurrentLanguage())
    const availableLanguages = ref(languageManager.getAvailableLanguages())
    const showSuccessMessage = ref(false)
    
    // Xử lý thay đổi ngôn ngữ
    const handleLanguageChange = (languageCode) => {
      if (languageCode === currentLanguage.value) return
      
      // Cập nhật ngôn ngữ qua LanguageManager
      languageManager.setLanguage(languageCode)
      currentLanguage.value = languageCode
      
      // Hiển thị thông báo thành công
      showSuccessMessage.value = true
      
      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => {
        showSuccessMessage.value = false
      }, 3000)
    }
    
    // Khởi tạo ngôn ngữ khi component mount
    onMounted(() => {
      // Áp dụng ngôn ngữ đã lưu
      languageManager.translatePage()
    })
    
    return {
      isAuthLoading,
      currentLanguage,
      availableLanguages,
      showSuccessMessage,
      handleLanguageChange
    }
  }
}
</script>

<style scoped>
.settings-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 3.75rem;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.settings-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
}

.settings-header {
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

.settings-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #f1f5f9;
}

.settings-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-icon {
  width: 48px;
  height: 48px;
  background: #f8fafc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-info {
  flex: 1;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.section-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.language-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.language-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.language-option:hover {
  border-color: #2563eb;
  background: #f8fafc;
}

.language-option.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.language-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.language-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1e293b;
}

.language-code {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 400;
}

.language-selected {
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  width: 24px;
  height: 24px;
  background: #2563eb;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.success-message {
  background: #f0fdf4;
  color: #16a34a;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #bbf7d0;
  margin-bottom: 1.5rem;
  animation: fadeInOut 3s ease-in-out;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-10px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
}

.coming-soon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  background: #fafafa;
}

.coming-soon-text {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .settings-container {
    padding: 1rem;
  }
  
  .settings-card {
    padding: 1.5rem;
  }
  
  .section-header {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .section-icon {
    align-self: flex-start;
  }
}
</style>