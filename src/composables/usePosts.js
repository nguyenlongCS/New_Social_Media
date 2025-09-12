/*
src/composables/usePosts.js - Composable quản lý posts từ Firestore
Load posts từ collection "posts", real-time updates, pagination - Singleton pattern
*/
import { ref, computed } from 'vue'
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  startAfter,
  getDocs
} from 'firebase/firestore'
import { db } from '@/firebase/config'

// Singleton state - shared across all components
let postsState = null

function createPostsState() {
  const posts = ref([])
  const isLoading = ref(false)
  const hasMore = ref(true)
  const lastDoc = ref(null)
  const unsubscribe = ref(null)
  
  // Post được chọn hiện tại
  const selectedPostId = ref(null)
  
  // Lấy post được chọn
  const selectedPost = computed(() => {
    return posts.value.find(post => post.id === selectedPostId.value) || null
  })
  
  // Format timestamp cho hiển thị
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Vừa xong'
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      const now = new Date()
      const diff = now - date
      
      // Tính toán thời gian
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
  
  // Load posts từ Firestore với real-time updates
  const loadPosts = (limitCount = 10) => {
    if (isLoading.value) return
    
    isLoading.value = true
    
    try {
      // Tạo query để lấy posts mới nhất
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('Created', 'desc'),
        limit(limitCount)
      )
      
      // Thiết lập real-time listener
      unsubscribe.value = onSnapshot(postsQuery, (snapshot) => {
        const newPosts = []
        
        snapshot.forEach((doc) => {
          const postData = doc.data()
          newPosts.push({
            id: doc.id,
            title: postData.Caption || 'Untitled Post',
            shortContent: postData.Content?.substring(0, 100) + '...' || '',
            content: postData.Content || '',
            author: postData.UserName || 'Anonymous',
            authorId: postData.UserID || '',
            avatar: postData.Avatar || '',
            timestamp: formatTimestamp(postData.Created),
            created: postData.Created,
            image: postData.MediaUrl || '', // URL của media đầu tiên
            mediaItems: postData.mediaItems || [], // Danh sách tất cả media
            mediaCount: postData.mediaCount || 0,
            likes: postData.likes || 0,
            commentsCount: postData.comments || 0,
            comments: [] // Comments sẽ được load riêng khi cần
          })
        })
        
        posts.value = newPosts
        isLoading.value = false
        
        // Cập nhật lastDoc cho pagination
        if (snapshot.docs.length > 0) {
          lastDoc.value = snapshot.docs[snapshot.docs.length - 1]
        }
        
        hasMore.value = snapshot.docs.length >= limitCount
      }, (error) => {
        console.error('Error loading posts:', error)
        isLoading.value = false
      })
      
    } catch (error) {
      console.error('Error setting up posts listener:', error)
      isLoading.value = false
    }
  }
  
  // Load thêm posts (pagination)
  const loadMorePosts = async (limitCount = 10) => {
    if (isLoading.value || !hasMore.value || !lastDoc.value) return
    
    isLoading.value = true
    
    try {
      const nextQuery = query(
        collection(db, 'posts'),
        orderBy('Created', 'desc'),
        startAfter(lastDoc.value),
        limit(limitCount)
      )
      
      const snapshot = await getDocs(nextQuery)
      const morePosts = []
      
      snapshot.forEach((doc) => {
        const postData = doc.data()
        morePosts.push({
          id: doc.id,
          title: postData.Caption || 'Untitled Post',
          shortContent: postData.Content?.substring(0, 100) + '...' || '',
          content: postData.Content || '',
          author: postData.UserName || 'Anonymous',
          authorId: postData.UserID || '',
          avatar: postData.Avatar || '',
          timestamp: formatTimestamp(postData.Created),
          created: postData.Created,
          image: postData.MediaUrl || '',
          mediaItems: postData.mediaItems || [],
          mediaCount: postData.mediaCount || 0,
          likes: postData.likes || 0,
          commentsCount: postData.comments || 0,
          comments: []
        })
      })
      
      // Thêm posts mới vào danh sách hiện tại
      posts.value = [...posts.value, ...morePosts]
      
      // Cập nhật lastDoc và hasMore
      if (snapshot.docs.length > 0) {
        lastDoc.value = snapshot.docs[snapshot.docs.length - 1]
      }
      hasMore.value = snapshot.docs.length >= limitCount
      
    } catch (error) {
      console.error('Error loading more posts:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  // Thiết lập post được chọn
  const setSelectedPost = (postId) => {
    selectedPostId.value = postId
  }
  
  // Lấy post theo ID
  const getPostById = (postId) => {
    return posts.value.find(post => post.id === postId) || null
  }
  
  // Like/Unlike post (sẽ được implement sau)
  const toggleLike = async (postId) => {
    // TODO: Implement like functionality
    console.log('Toggle like for post:', postId)
  }
  
  // Cleanup listener
  const cleanup = () => {
    if (unsubscribe.value) {
      unsubscribe.value()
      unsubscribe.value = null
    }
  }
  
  // Reset posts data
  const resetPosts = () => {
    cleanup()
    posts.value = []
    selectedPostId.value = null
    lastDoc.value = null
    hasMore.value = true
    isLoading.value = false
  }
  
  return {
    posts,
    isLoading,
    hasMore,
    selectedPostId,
    selectedPost,
    loadPosts,
    loadMorePosts,
    setSelectedPost,
    getPostById,
    toggleLike,
    cleanup,
    resetPosts
  }
}

export function usePosts() {
  if (!postsState) {
    postsState = createPostsState()
  }
  return postsState
}