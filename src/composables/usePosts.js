/*
src/composables/usePosts.js - Updated Version
Composable quản lý posts từ Firestore với tích hợp notifications
Tự động tạo thông báo khi like/unlike posts và comment posts
Fixed: Thêm chức năng tạo thông báo comment hoạt động đúng
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
import { useLikes } from './useLikes'
import { useComments } from './useComments'
import { useNotifications } from './useNotifications'

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
  
  // Lưu trạng thái liked của từng post cho user hiện tại
  const userLikedPosts = ref(new Set())
  
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
  
  // Load liked status cho user
  const loadUserLikedPosts = async (user) => {
    if (!user?.uid) return
    
    const likes = useLikes()
    const currentUserLiked = new Set()
    
    // Load liked posts cho user hiện tại
    for (const post of posts.value) {
      const isLiked = await likes.checkUserLikedPost(user.uid, post.id)
      if (isLiked) {
        currentUserLiked.add(post.id)
      }
      // Cập nhật isLiked cho post
      post.isLiked = isLiked
    }
    
    userLikedPosts.value = currentUserLiked
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
      unsubscribe.value = onSnapshot(postsQuery, async (snapshot) => {
        const newPosts = []
        
        // Import useLikes và useComments để load data
        const likes = useLikes()
        const comments = useComments()
        
        for (const doc of snapshot.docs) {
          const postData = doc.data()
          
          // Load likes và comments count cho mỗi post
          const likesCount = await likes.getPostLikesCount(doc.id)
          const commentsCount = await comments.getPostCommentsCount(doc.id)
          
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
            likes: likesCount,
            commentsCount: commentsCount,
            comments: [], // Comments sẽ được load khi cần
            isLiked: false // Sẽ được cập nhật khi load user liked posts
          })
        }
        
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
      
      // Import useLikes và useComments
      const likes = useLikes()
      const comments = useComments()
      
      const morePosts = []
      
      for (const doc of snapshot.docs) {
        const postData = doc.data()
        
        // Load likes và comments count
        const likesCount = await likes.getPostLikesCount(doc.id)
        const commentsCount = await comments.getPostCommentsCount(doc.id)
        
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
          likes: likesCount,
          commentsCount: commentsCount,
          comments: [],
          isLiked: false
        })
      }
      
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
  
  // Like/Unlike post - tích hợp với notifications
  const toggleLike = async (postId, user) => {
    if (!postId || !user) return
    
    const post = posts.value.find(p => p.id === postId)
    if (!post) return
    
    const likes = useLikes()
    const { createLikeNotification } = useNotifications()
    
    try {
      const result = await likes.toggleLike(user, postId)
      
      // Cập nhật likes count và liked status
      const newLikesCount = await likes.getPostLikesCount(postId)
      post.likes = newLikesCount
      post.isLiked = result.liked
      
      // Cập nhật userLikedPosts set
      if (result.liked) {
        userLikedPosts.value.add(postId)
        
        // Tạo thông báo like cho chủ bài viết (nếu không phải chính mình)
        if (post.authorId && post.authorId !== user.uid) {
          await createLikeNotification(postId, post.authorId, user)
        }
      } else {
        userLikedPosts.value.delete(postId)
      }
      
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }
  
  // Load comments cho post được chọn
  const loadPostComments = async (postId) => {
    if (!postId) return
    
    const comments = useComments()
    
    try {
      // Luôn load fresh comments từ Firestore
      const postComments = await comments.getPostComments(postId)
      
      // Cập nhật comments cho post được chọn
      const post = posts.value.find(p => p.id === postId)
      if (post) {
        // Force update comments array
        post.comments = [...postComments]
        post.commentsCount = postComments.length
      }
      
      console.log(`Loaded ${postComments.length} comments for post ${postId}`)
      return postComments
      
    } catch (error) {
      console.error('Error loading comments:', error)
      return []
    }
  }
  
  // Thêm comment cho post - tích hợp với notifications đầy đủ
  const addCommentToPost = async (postId, user, commentText) => {
    if (!postId || !user || !commentText?.trim()) return
    
    const comments = useComments()
    const { createCommentNotification } = useNotifications()
    
    try {
      // Tìm post để lấy thông tin authorId
      const post = posts.value.find(p => p.id === postId)
      if (!post) {
        throw new Error('Không tìm thấy bài viết')
      }
      
      // Thêm comment vào Firestore
      const newComment = await comments.addComment(user, postId, commentText)
      
      // Cập nhật comments locally
      if (!post.comments) post.comments = []
      post.comments.unshift(newComment) // Thêm vào đầu danh sách
      post.commentsCount = post.comments.length
      
      // Tạo thông báo comment cho chủ bài viết (nếu không phải chính mình)
      if (post.authorId && post.authorId !== user.uid) {
        console.log('Creating comment notification for post owner:', post.authorId)
        await createCommentNotification(postId, post.authorId, user, commentText)
        console.log('Comment notification created successfully')
      } else {
        console.log('Skipping comment notification - same user or no authorId')
      }
      
      return newComment
      
    } catch (error) {
      console.error('Error adding comment:', error)
      throw error
    }
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
    userLikedPosts.value.clear()
  }
  
  return {
    posts,
    isLoading,
    hasMore,
    selectedPostId,
    selectedPost,
    userLikedPosts,
    loadPosts,
    loadMorePosts,
    loadUserLikedPosts,
    setSelectedPost,
    getPostById,
    toggleLike,
    loadPostComments,
    addCommentToPost,
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