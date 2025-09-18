/*
utils/languageManager.js - Language Manager Utility
Quản lý ngôn ngữ toàn cục cho ứng dụng
Thực hiện chuyển đổi text bằng global script thay thế DOM text
*/

import vi from '../locales/vi.js'

class LanguageManager {
  constructor() {
    // Lưu ngôn ngữ hiện tại vào localStorage
    this.currentLanguage = localStorage.getItem('app_language') || 'en'
    this.translations = { vi }
    
    // Khởi tạo observer để theo dõi DOM changes
    this.setupDOMObserver()
  }
  
  // Lấy ngôn ngữ hiện tại
  getCurrentLanguage() {
    return this.currentLanguage
  }
  
  // Chuyển đổi ngôn ngữ
  setLanguage(lang) {
    if (lang !== 'en' && !this.translations[lang]) {
      console.warn('Language not supported:', lang)
      return
    }
    
    this.currentLanguage = lang
    localStorage.setItem('app_language', lang)
    this.translatePage()
  }
  
  // Dịch toàn bộ trang
  translatePage() {
    if (this.currentLanguage === 'en') {
      // Tiếng Anh là ngôn ngữ gốc, không cần dịch
      return
    }
    
    const translations = this.translations[this.currentLanguage]
    this.walkAndTranslate(document.body, translations)
  }
  
  // Duyệt qua tất cả DOM nodes và dịch text
  walkAndTranslate(node, translations) {
    if (!node) return
    
    // Bỏ qua các script, style tags
    if (['SCRIPT', 'STYLE', 'TEXTAREA'].includes(node.nodeName)) {
      return
    }
    
    // Xử lý text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      const originalText = node.textContent?.trim()
      if (originalText && translations[originalText]) {
        node.textContent = translations[originalText]
      }
    }
    
    // Xử lý placeholder attributes
    if (node.nodeType === Node.ELEMENT_NODE) {
      const placeholder = node.getAttribute?.('placeholder')
      if (placeholder && translations[placeholder]) {
        node.setAttribute('placeholder', translations[placeholder])
      }
      
      // Xử lý title attributes
      const title = node.getAttribute?.('title')
      if (title && translations[title]) {
        node.setAttribute('title', translations[title])
      }
      
      // Xử lý alt attributes
      const alt = node.getAttribute?.('alt')
      if (alt && translations[alt]) {
        node.setAttribute('alt', translations[alt])
      }
    }
    
    // Đệ quy cho child nodes
    if (node.hasChildNodes?.()) {
      for (let child of Array.from(node.childNodes)) {
        this.walkAndTranslate(child, translations)
      }
    }
  }
  
  // Setup MutationObserver để tự động dịch nội dung mới được thêm vào DOM
  setupDOMObserver() {
    const observer = new MutationObserver((mutations) => {
      if (this.currentLanguage === 'en') return
      
      mutations.forEach((mutation) => {
        // Xử lý nodes được thêm mới
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
            const translations = this.translations[this.currentLanguage]
            this.walkAndTranslate(node, translations)
          }
        })
        
        // Xử lý attribute changes
        if (mutation.type === 'attributes') {
          const target = mutation.target
          const attrName = mutation.attributeName
          
          if (['placeholder', 'title', 'alt'].includes(attrName)) {
            const value = target.getAttribute(attrName)
            const translations = this.translations[this.currentLanguage]
            if (value && translations[value]) {
              target.setAttribute(attrName, translations[value])
            }
          }
        }
      })
    })
    
    // Bắt đầu observe
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'alt']
    })
  }
  
  // Lấy available languages
  getAvailableLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'vi', name: 'Tiếng Việt' }
    ]
  }
}

// Tạo singleton instance
const languageManager = new LanguageManager()

export default languageManager
