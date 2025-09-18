/*
utils/themeManager.js - Theme Manager Utility
Quản lý theme toàn cục cho ứng dụng
Thực hiện chuyển đổi giữa light-theme và dark-theme bằng CSS classes
*/

class ThemeManager {
  constructor() {
    // Lưu theme hiện tại vào localStorage
    this.currentTheme = localStorage.getItem('app_theme') || 'light'
    
    // Khởi tạo theme khi tạo instance
    this.initializeTheme()
  }
  
  // Lấy theme hiện tại
  getCurrentTheme() {
    return this.currentTheme
  }
  
  // Chuyển đổi theme
  setTheme(theme) {
    if (!['light', 'dark'].includes(theme)) {
      console.warn('Theme not supported:', theme)
      return
    }
    
    this.currentTheme = theme
    localStorage.setItem('app_theme', theme)
    this.applyTheme(theme)
  }
  
  // Áp dụng theme lên document
  applyTheme(theme) {
    const body = document.body
    
    // Xóa tất cả theme classes cũ
    body.classList.remove('light-theme', 'dark-theme')
    
    // Thêm theme class mới
    body.classList.add(`${theme}-theme`)
    
    // Update meta theme-color cho mobile browsers
    const metaThemeColor = document.querySelector('meta[name=theme-color]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#ffffff')
    }
  }
  
  // Khởi tạo theme từ localStorage
  initializeTheme() {
    this.applyTheme(this.currentTheme)
  }
  
  // Toggle giữa light và dark
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light'
    this.setTheme(newTheme)
    return newTheme
  }
  
  // Lấy available themes
  getAvailableThemes() {
    return [
      { 
        code: 'light', 
        name: 'Light Mode',
        icon: '☀️',
        description: 'Giao diện sáng, dễ nhìn ban ngày'
      },
      { 
        code: 'dark', 
        name: 'Dark Mode',
        icon: '🌙',
        description: 'Giao diện tối, bảo vệ mắt ban đêm'
      }
    ]
  }
  
  // Tự động detect system preference (optional)
  detectSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }
  
  // Listen for system theme changes (optional)
  watchSystemPreference(callback) {
    if (!window.matchMedia) return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addListener((e) => {
      const systemTheme = e.matches ? 'dark' : 'light'
      if (callback) callback(systemTheme)
    })
  }
}

// Tạo singleton instance
const themeManager = new ThemeManager()

export default themeManager