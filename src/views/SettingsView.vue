<!--
src/views/SettingsView.vue - Settings Page với Accessibility Support
Trang cài đặt ứng dụng với chức năng chuyển đổi ngôn ngữ và bật/tắt Touch component
Sử dụng LanguageManager để thực hiện global text replacement
Quản lý hiển thị Touch component thông qua localStorage
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
            <div v-for="language in availableLanguages" :key="language.code" class="language-option"
              :class="{ active: currentLanguage === language.code }" @click="handleLanguageChange(language.code)">
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

        <!-- Theme Settings Section -->
        <div class="settings-section">
          <div class="section-header">
            <div class="section-icon">
              <img src="@/assets/icons/theme.png" alt="Theme" width="24" height="24">
            </div>
            <div class="section-info">
              <h3 class="section-title">Giao diện</h3>
              <p class="section-description">Chọn chế độ hiển thị phù hợp với bạn</p>
            </div>
          </div>

          <div class="theme-options">
            <div v-for="theme in availableThemes" :key="theme.code" class="theme-option"
              :class="{ active: currentTheme === theme.code }" @click="handleThemeChange(theme.code)">
              <div class="theme-info">
                <div class="theme-header">
                  <span class="theme-icon">{{ theme.icon }}</span>
                  <div class="theme-name">{{ theme.name }}</div>
                </div>
                <div class="theme-description">{{ theme.description }}</div>
              </div>
              <div v-if="currentTheme === theme.code" class="theme-selected">
                <div class="check-icon">✓</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Accessibility Settings Section -->
        <div class="settings-section">
          <div class="section-header">
            <div class="section-icon">
              <img src="@/assets/icons/theme.png" alt="Accessibility" width="24" height="24">
            </div>
            <div class="section-info">
              <h3 class="section-title">Hỗ trợ tiếp cận</h3>
              <p class="section-description">Tùy chọn hỗ trợ cho người khuyết tật</p>
            </div>
          </div>

          <div class="accessibility-options">
            <div class="accessibility-option">
              <div class="option-info">
                <div class="option-name">Assistive Touch</div>
                <div class="option-description">Hiển thị nút hỗ trợ nhanh trên màn hình</div>
              </div>
              <div class="option-toggle">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="showAssistiveTouch" @change="handleAssistiveTouchChange">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
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
import themeManager from '../utils/themeManager'

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
    const currentTheme = ref(themeManager.getCurrentTheme())
    const availableThemes = ref(themeManager.getAvailableThemes())
    const showAssistiveTouch = ref(localStorage.getItem('show_assistive_touch') === 'true')

    // Xử lý thay đổi ngôn ngữ
    const handleLanguageChange = (languageCode) => {
      if (languageCode === currentLanguage.value) return

      // Cập nhật ngôn ngữ qua LanguageManager
      languageManager.setLanguage(languageCode)
      currentLanguage.value = languageCode
    }

    // Xử lý thay đổi theme
    const handleThemeChange = (themeCode) => {
      if (themeCode === currentTheme.value) return

      // Cập nhật theme qua ThemeManager
      themeManager.setTheme(themeCode)
      currentTheme.value = themeCode
    }

    // Xử lý bật/tắt Assistive Touch
    const handleAssistiveTouchChange = () => {
      // Lưu trạng thái vào localStorage
      localStorage.setItem('show_assistive_touch', showAssistiveTouch.value.toString())

      // Trigger event để Touch component cập nhật
      window.dispatchEvent(new CustomEvent('assistive-touch-toggle', {
        detail: { enabled: showAssistiveTouch.value }
      }))
    }

    // Khởi tạo khi component mount
    onMounted(() => {
      // Áp dụng ngôn ngữ và theme đã lưu
      languageManager.translatePage()
      themeManager.applyTheme(themeManager.getCurrentTheme())
    })

    return {
      isAuthLoading,
      currentLanguage,
      availableLanguages,
      currentTheme,
      availableThemes,
      showAssistiveTouch,
      handleLanguageChange,
      handleThemeChange,
      handleAssistiveTouchChange
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
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }

  10% {
    opacity: 1;
    transform: translateY(0);
  }

  90% {
    opacity: 1;
    transform: translateY(0);
  }

  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
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

.theme-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.theme-option {
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

.theme-option:hover {
  border-color: #2563eb;
  background: #f8fafc;
}

.theme-option.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.theme-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.theme-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.theme-icon {
  font-size: 1.25rem;
}

.theme-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1e293b;
}

.theme-description {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.3;
}

.theme-selected {
  display: flex;
  align-items: center;
  justify-content: center;
}

.accessibility-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.accessibility-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background: white;
  transition: border-color 0.2s ease;
}

.accessibility-option:hover {
  border-color: #d1d5db;
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.option-name {
  font-size: 0.9375rem;
  font-weight: 500;
}

.option-description {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.3;
}

.option-toggle {
  display: flex;
  align-items: center;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  border-radius: 24px;
  transition: all 0.3s ease;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

input:checked+.toggle-slider {
  background-color: #2563eb;
}

input:checked+.toggle-slider:before {
  transform: translateX(24px);
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