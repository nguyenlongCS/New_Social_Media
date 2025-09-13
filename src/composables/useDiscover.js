/*
src/composables/useDiscover.js - Composable quản lý trang discover
Fetch danh sách bài đăng có media từ Firestore, sắp xếp theo lượt like, trending posts
*/
import { ref } from 'vue'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useLikes } from './useLikes'

export function useDiscover() {
  const discoverPosts = ref([])
  const trendingPosts = ref([])
  const isLoading = ref(false)
  const errorMessage = ref('')

  const { getPostLikesCount } = useLikes()

  // Tính thời gian tuần trước để filter trending posts
  const getOneWeekAgo = () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return Timestamp.fromDate(oneWeekAgo)
  }

  // Format timestamp cho hiển thị
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Vừa xong'

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
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
    } catch (error) {
      return 'Vừa xong'
    }
  }

  // Load trending posts - 5 bài viết có nhiều like nhất
  const loadTrendingPosts = async () => {
    try {
      // Query bài viết có media
      const trendingQuery = query(
        collection(db, 'posts'),
        where('mediaCount', '>', 0), // Chỉ lấy bài có media
        orderBy('Created', 'desc'),
        limit(50) // Lấy nhiều để sort theo likes sau
      )

      const snapshot = await getDocs(trendingQuery)
      const posts = []

      // Process từng post và lấy likes count
      for (const doc of snapshot.docs) {
        const postData = doc.data()
        const likesCount = await getPostLikesCount(doc.id)

        posts.push({
          id: doc.id,
          title: postData.Caption || 'Untitled Post',
          content: postData.Content || '',
          author: postData.UserName || 'Anonymous',
          authorId: postData.UserID || '',
          avatar: postData.Avatar || '',
          timestamp: formatTimestamp(postData.Created),
          created: postData.Created,
          mediaUrl: postData.MediaUrl || postData.mediaItems?.[0]?.url || '',
          mediaItems: postData.mediaItems || [],
          mediaCount: postData.mediaCount || 0,
          likes: likesCount,
          isTrending: true
        })
      }

      // Sort theo likes giảm dần và lấy top 5
      posts.sort((a, b) => b.likes - a.likes)
      trendingPosts.value = posts.slice(0, 5)

      console.log('useDiscover: Loaded trending posts:', trendingPosts.value.length)

    } catch (error) {
      console.error('useDiscover: Error loading trending posts:', error)
      trendingPosts.value = []
    }
  }


  // Load tất cả discover posts - sắp xếp theo likes
  const loadDiscoverPosts = async (limitCount = 30) => {
    isLoading.value = true
    errorMessage.value = ''

    try {
      // Query tất cả bài viết có media
      const discoverQuery = query(
        collection(db, 'posts'),
        where('mediaCount', '>', 0), // Chỉ lấy bài có media
        orderBy('Created', 'desc'),
        limit(limitCount)
      )

      const snapshot = await getDocs(discoverQuery)
      const posts = []

      // Process từng post và lấy likes count
      for (const doc of snapshot.docs) {
        const postData = doc.data()
        const likesCount = await getPostLikesCount(doc.id)

        posts.push({
          id: doc.id,
          title: postData.Caption || 'Untitled Post',
          content: postData.Content || '',
          author: postData.UserName || 'Anonymous',
          authorId: postData.UserID || '',
          avatar: postData.Avatar || '',
          timestamp: formatTimestamp(postData.Created),
          created: postData.Created,
          mediaUrl: postData.MediaUrl || postData.mediaItems?.[0]?.url || '',
          mediaItems: postData.mediaItems || [],
          mediaCount: postData.mediaCount || 0,
          likes: likesCount,
          isTrending: false
        })
      }

      // Sort theo likes giảm dần
      posts.sort((a, b) => b.likes - a.likes)

      // Loại bỏ các trending posts khỏi discover posts để tránh duplicate
      const trendingIds = new Set(trendingPosts.value.map(p => p.id))
      const filteredPosts = posts.filter(post => !trendingIds.has(post.id))

      discoverPosts.value = filteredPosts

      console.log('useDiscover: Loaded discover posts:', discoverPosts.value.length)

    } catch (error) {
      console.error('useDiscover: Error loading discover posts:', error)
      errorMessage.value = 'Không thể tải bài viết khám phá'
      discoverPosts.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Load tất cả data cho trang discover
  const loadDiscoverData = async (limitCount = 30) => {
    isLoading.value = true

    try {
      // Load trending posts trước
      await loadTrendingPosts()

      // Sau đó load discover posts
      await loadDiscoverPosts(limitCount)

    } catch (error) {
      console.error('useDiscover: Error loading discover data:', error)
      errorMessage.value = 'Có lỗi khi tải dữ liệu khám phá'
    } finally {
      isLoading.value = false
    }
  }

  // Lấy media URL đầu tiên của post
  const getPostMainMedia = (post) => {
    if (post.mediaItems && post.mediaItems.length > 0) {
      return post.mediaItems[0]
    }

    if (post.mediaUrl) {
      return {
        url: post.mediaUrl,
        type: 'image/jpeg' // Default type
      }
    }

    return null
  }

  // Kiểm tra post có phải video không
  const isVideoPost = (post) => {
    const mainMedia = getPostMainMedia(post)
    return mainMedia?.type?.startsWith('video/')
  }

  // Reset discover data
  const resetDiscoverData = () => {
    discoverPosts.value = []
    trendingPosts.value = []
    errorMessage.value = ''
    isLoading.value = false
  }

  return {
    // State
    discoverPosts,
    trendingPosts,
    isLoading,
    errorMessage,

    // Methods
    loadDiscoverData,
    loadTrendingPosts,
    loadDiscoverPosts,
    getPostMainMedia,
    isVideoPost,
    resetDiscoverData
  }
}