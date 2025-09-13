// src/composables/useNews.js
import { ref } from 'vue'

export function useNews() {
  const newsList = ref([])
  const isLoading = ref(false)
  const errorMessage = ref('')
  const hasMore = ref(true)

  // Format thời gian hiển thị
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Vừa xong'
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date

      const minutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))

      if (minutes < 1) return 'Vừa xong'
      if (minutes < 60) return `${minutes} phút trước`
      if (hours < 24) return `${hours} giờ trước`
      if (days < 7) return `${days} ngày trước`

      return date.toLocaleDateString('vi-VN')
    } catch {
      return 'Vừa xong'
    }
  }

  // Cắt ngắn mô tả
  const truncateDescription = (text, maxLength = 150) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  // Kiểm tra URL hình ảnh có hợp lệ không
  const isValidImageUrl = (url) => {
    if (!url) return false
    if (url.includes('placeholder')) return false

    const blockedDomains = [
      'politico.eu',
      'medium.com',
      'miro.medium.com',
      'cdn-cgi',
      'localhost'
    ]
    for (const domain of blockedDomains) {
      if (url.includes(domain)) return false
    }

    return url.startsWith('http')
  }

  // Load tin tức trực tiếp từ API
  const loadNews = async (category = 'general', country = 'us') => {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await fetch('https://social-media-news-y25tbojqca-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, country, pageSize: 20 })
      })

      if (!response.ok) {
        throw new Error('Không thể kết nối đến dịch vụ tin tức')
      }

      const data = await response.json()
      if (data.status === 'ok' && data.articles) {
        const articles = data.articles
          .map((article, index) => ({
            id: `api-${index}-${Date.now()}`,
            title: article.title || 'Không có tiêu đề',
            description: truncateDescription(article.description),
            urlToImage: article.urlToImage || '',
            url: article.url || '#',
            source: article.source?.name || 'Unknown Source',
            publishedAt: article.publishedAt,
            timeAgo: formatTimeAgo(article.publishedAt),
            content: article.content || ''
          }))
          .filter(a => isValidImageUrl(a.urlToImage)) // chỉ giữ bài có ảnh hợp lệ

        newsList.value = articles
        console.log('Loaded news from API (filtered):', articles.length)
      } else {
        throw new Error('Dữ liệu tin tức không hợp lệ')
      }
    } catch (error) {
      console.error('Error loading news from API:', error)
      errorMessage.value = 'Không thể tải tin tức. Vui lòng thử lại sau.'
      newsList.value = []
    } finally {
      isLoading.value = false
    }
  }

  const refreshNews = async () => {
    await loadNews()
  }

  const openArticle = (article) => {
    if (article.url && article.url !== '#') {
      window.open(article.url, '_blank', 'noopener,noreferrer')
    }
  }

  const resetNews = () => {
    newsList.value = []
    errorMessage.value = ''
    isLoading.value = false
  }

  return {
    newsList,
    isLoading,
    errorMessage,
    hasMore,
    loadNews,
    refreshNews,
    openArticle,
    isValidImageUrl,
    resetNews,
    formatTimeAgo,
    truncateDescription
  }
}
