/*
src/composables/useAdmin.js - Composable quản lý chức năng admin với optimization
Fixed: Tối ưu hóa loading biểu đồ - giảm thời gian từ 10s xuống 2-3s
Sử dụng Promise.all, giảm số queries, cache dữ liệu và load song song
*/
import { ref, computed } from 'vue'
import { 
  collection, 
  query, 
  orderBy, 
  limit,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  where,
  Timestamp,
  startAfter
} from 'firebase/firestore'
import { db } from '@/firebase/config'

export function useAdmin() {
  // States cho phân quyền - kiểm tra từ collection users
  const isAdmin = ref(false)
  const isCheckingAdmin = ref(false)
  
  // States cho dashboard với dữ liệu thực tế
  const dashboardStats = ref({
    totalUsers: 0,
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0
  })
  const topPosts = ref([]) // Top posts theo likes thực tế
  const recentUsers = ref([]) // Users mới đăng ký thực tế
  const isLoadingStats = ref(false)
  
  // States cho quản lý dữ liệu thực tế
  const usersList = ref([])
  const postsList = ref([])
  const commentsList = ref([])
  const isLoadingUsers = ref(false)
  const isLoadingPosts = ref(false)
  const isLoadingComments = ref(false)
  const isDeleting = ref(false)
  
  // States cho analytics với dữ liệu thực tế từ Firestore - OPTIMIZED
  const chartData = ref({
    postsOverTime: [],
    likesOverTime: [],
    commentsOverTime: [],
    topUsersData: [],
    contentTypesData: [],
    labels: []
  })
  const isLoadingAnalytics = ref(false)
  
  // Cache để tránh load lại dữ liệu không cần thiết
  const dataCache = ref({
    posts: null,
    users: null,
    likes: null,
    comments: null,
    lastUpdated: null
  })
  
  const errorMessage = ref('')
  
  // Kiểm tra quyền admin từ collection users (field Role)
  const checkAdminRole = async (userId) => {
    if (!userId) return false
    
    isCheckingAdmin.value = true
    
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('UserID', '==', userId)
      )
      
      const snapshot = await getDocs(usersQuery)
      
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data()
        isAdmin.value = userData.Role === 'admin'
        return userData.Role === 'admin'
      }
      
      isAdmin.value = false
      return false
      
    } catch (error) {
      console.error('Error checking admin role:', error)
      isAdmin.value = false
      return false
    } finally {
      isCheckingAdmin.value = false
    }
  }
  
  // OPTIMIZED: Load tất cả dữ liệu cơ bản một lần với Promise.all
  const loadBasicData = async () => {
    // Kiểm tra cache (5 phút)
    const now = Date.now()
    if (dataCache.value.lastUpdated && now - dataCache.value.lastUpdated < 5 * 60 * 1000) {
      console.log('Using cached data for charts')
      return dataCache.value
    }
    
    console.log('Loading fresh data from Firestore...')
    
    try {
      // Load tất cả collections song song
      const [usersSnapshot, postsSnapshot, likesSnapshot, commentsSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'posts')),
        getDocs(collection(db, 'likes')),
        getDocs(collection(db, 'comments'))
      ])
      
      // Cache dữ liệu
      dataCache.value = {
        users: usersSnapshot.docs,
        posts: postsSnapshot.docs,
        likes: likesSnapshot.docs,
        comments: commentsSnapshot.docs,
        lastUpdated: now
      }
      
      return dataCache.value
      
    } catch (error) {
      console.error('Error loading basic data:', error)
      throw error
    }
  }
  
  // OPTIMIZED: Load dashboard stats nhanh từ cache
  const loadDashboardStats = async () => {
    isLoadingStats.value = true
    
    try {
      const basicData = await loadBasicData()
      
      dashboardStats.value = {
        totalUsers: basicData.users.length,
        totalPosts: basicData.posts.length,
        totalLikes: basicData.likes.length,
        totalComments: basicData.comments.length
      }
      
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      errorMessage.value = 'Không thể tải thống kê dashboard'
    } finally {
      isLoadingStats.value = false
    }
  }
  
  // OPTIMIZED: Load top posts nhanh hơn - chỉ tính likes từ cache
  const loadTopPosts = async () => {
    try {
      const basicData = await loadBasicData()
      
      // Đếm likes cho từng post từ cache
      const postsWithLikes = []
      
      for (const postDoc of basicData.posts) {
        const postData = postDoc.data()
        
        // Đếm likes từ cache thay vì query mới
        const likesCount = basicData.likes.filter(like => 
          like.data().PostID === postDoc.id
        ).length
        
        postsWithLikes.push({
          id: postDoc.id,
          title: postData.Caption || 'Untitled',
          author: postData.UserName || 'Anonymous',
          likes: likesCount,
          created: postData.Created,
          content: postData.Content || ''
        })
      }
      
      // Sort và lấy top 10
      postsWithLikes.sort((a, b) => b.likes - a.likes)
      topPosts.value = postsWithLikes.slice(0, 10)
      
    } catch (error) {
      console.error('Error loading top posts:', error)
    }
  }
  
  // OPTIMIZED: Load recent users từ cache
  const loadRecentUsers = async () => {
    try {
      const basicData = await loadBasicData()
      
      const users = basicData.users
        .map(doc => ({
          id: doc.id,
          userId: doc.data().UserID,
          userName: doc.data().UserName || 'Anonymous',
          email: doc.data().Email || '',
          avatar: doc.data().Avatar || '',
          role: doc.data().Role || 'user',
          created: doc.data().Created,
          provider: doc.data().Provider || 'email'
        }))
        .sort((a, b) => {
          const aTime = a.created?.toDate?.() || new Date(a.created || 0)
          const bTime = b.created?.toDate?.() || new Date(b.created || 0)
          return bTime - aTime
        })
        .slice(0, 10)
      
      recentUsers.value = users
      
    } catch (error) {
      console.error('Error loading recent users:', error)
    }
  }
  
  // OPTIMIZED: Load analytics data nhanh hơn nhiều
  const loadAnalyticsData = async () => {
    isLoadingAnalytics.value = true
    
    try {
      const basicData = await loadBasicData()
      
      // Tạo dữ liệu cho 30 ngày qua
      const last30Days = []
      const postsOverTime = []
      const likesOverTime = []
      const commentsOverTime = []
      
      // Tạo mảng 30 ngày
      for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        last30Days.push(date.toLocaleDateString('vi-VN'))
        
        const dayStart = new Date(date.setHours(0, 0, 0, 0))
        const dayEnd = new Date(date.setHours(23, 59, 59, 999))
        
        // Đếm từ cache thay vì query mới
        const postsCount = basicData.posts.filter(doc => {
          const created = doc.data().Created
          if (!created) return false
          const createdDate = created.toDate()
          return createdDate >= dayStart && createdDate <= dayEnd
        }).length
        
        const likesCount = basicData.likes.filter(doc => {
          const created = doc.data().Created
          if (!created) return false
          const createdDate = created.toDate()
          return createdDate >= dayStart && createdDate <= dayEnd
        }).length
        
        const commentsCount = basicData.comments.filter(doc => {
          const created = doc.data().Created
          if (!created) return false
          const createdDate = created.toDate()
          return createdDate >= dayStart && createdDate <= dayEnd
        }).length
        
        postsOverTime.push(postsCount)
        likesOverTime.push(likesCount)
        commentsOverTime.push(commentsCount)
      }
      
      // Load các dữ liệu khác song song
      const [topUsersData, contentTypesData] = await Promise.all([
        loadTopUsersForChart(basicData),
        loadContentTypesData(basicData)
      ])
      
      chartData.value = {
        labels: last30Days,
        postsOverTime,
        likesOverTime,
        commentsOverTime,
        topUsersData,
        contentTypesData
      }
      
      console.log('Analytics data loaded successfully')
      
    } catch (error) {
      console.error('Error loading analytics data:', error)
      errorMessage.value = 'Không thể tải dữ liệu analytics'
    } finally {
      isLoadingAnalytics.value = false
    }
  }
  
  // OPTIMIZED: Load top users từ cache
  const loadTopUsersForChart = async (basicData) => {
    try {
      // Tạo map posts theo UserID
      const userPostsMap = new Map()
      const userLikesMap = new Map()
      
      // Đếm posts cho từng user
      basicData.posts.forEach(postDoc => {
        const userId = postDoc.data().UserID
        if (userId) {
          userPostsMap.set(userId, (userPostsMap.get(userId) || 0) + 1)
          
          // Đếm likes cho posts của user này
          const postLikes = basicData.likes.filter(like => 
            like.data().PostID === postDoc.id
          ).length
          userLikesMap.set(userId, (userLikesMap.get(userId) || 0) + postLikes)
        }
      })
      
      // Tạo array users với stats
      const usersWithStats = []
      basicData.users.forEach(userDoc => {
        const userData = userDoc.data()
        const userId = userData.UserID
        
        if (userId && userPostsMap.has(userId)) {
          usersWithStats.push({
            userName: userData.UserName || 'Anonymous',
            postsCount: userPostsMap.get(userId) || 0,
            likesCount: userLikesMap.get(userId) || 0
          })
        }
      })
      
      // Sort và lấy top 5
      usersWithStats.sort((a, b) => b.postsCount - a.postsCount)
      return usersWithStats.slice(0, 5)
      
    } catch (error) {
      console.error('Error loading top users for chart:', error)
      return []
    }
  }
  
  // OPTIMIZED: Load content types từ cache
  const loadContentTypesData = async (basicData) => {
    try {
      let imagePostsCount = 0
      let videoPostsCount = 0
      let textPostsCount = 0
      
      basicData.posts.forEach(postDoc => {
        const postData = postDoc.data()
        const mediaCount = postData.mediaCount || 0
        const mediaItems = postData.mediaItems || []
        
        if (mediaCount > 0 && mediaItems.length > 0) {
          const firstMedia = mediaItems[0]
          if (firstMedia?.type?.startsWith('image/')) {
            imagePostsCount++
          } else if (firstMedia?.type?.startsWith('video/')) {
            videoPostsCount++
          } else {
            textPostsCount++
          }
        } else if (postData.MediaUrl) {
          imagePostsCount++
        } else {
          textPostsCount++
        }
      })
      
      return [
        { type: 'Bài viết có ảnh', count: imagePostsCount },
        { type: 'Bài viết có video', count: videoPostsCount },
        { type: 'Bài viết text', count: textPostsCount }
      ]
      
    } catch (error) {
      console.error('Error loading content types data:', error)
      return []
    }
  }
  
  // Load tất cả users thực tế cho quản lý với document ID chính xác
  const loadAllUsers = async () => {
    isLoadingUsers.value = true
    
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('Created', 'desc')
      )
      
      const snapshot = await getDocs(usersQuery)
      const users = []
      
      snapshot.forEach((doc) => {
        const userData = doc.data()
        users.push({
          docId: doc.id, // Document ID để xóa - này là UserID trong Firestore
          firestoreDocId: doc.id, // Backup document ID
          userId: userData.UserID, // Auth UID - có thể khác với document ID
          userName: userData.UserName || 'Anonymous',
          email: userData.Email || '',
          avatar: userData.Avatar || '',
          role: userData.Role || 'user',
          created: userData.Created,
          provider: userData.Provider || 'email',
          signedIn: userData.SignedIn
        })
      })
      
      usersList.value = users
      
    } catch (error) {
      console.error('Error loading all users:', error)
      errorMessage.value = 'Không thể tải danh sách users'
    } finally {
      isLoadingUsers.value = false
    }
  }
  
  // Load tất cả posts thực tế cho quản lý
  const loadAllPosts = async () => {
    isLoadingPosts.value = true
    
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('Created', 'desc')
      )
      
      const snapshot = await getDocs(postsQuery)
      const posts = []
      
      // Load posts với likes và comments thực tế
      for (const postDoc of snapshot.docs) {
        const postData = postDoc.data()
        
        // Đếm likes thực tế
        const likesQuery = query(
          collection(db, 'likes'),
          where('PostID', '==', postDoc.id)
        )
        const likesSnapshot = await getDocs(likesQuery)
        
        // Đếm comments thực tế
        const commentsQuery = query(
          collection(db, 'comments'),
          where('PostID', '==', postDoc.id)
        )
        const commentsSnapshot = await getDocs(commentsQuery)
        
        posts.push({
          docId: postDoc.id, // Document ID để xóa
          title: postData.Caption || 'Untitled',
          content: postData.Content || '',
          author: postData.UserName || 'Anonymous',
          authorId: postData.UserID || '',
          created: postData.Created,
          mediaUrl: postData.MediaUrl || '',
          mediaCount: postData.mediaCount || 0,
          likes: likesSnapshot.size,
          comments: commentsSnapshot.size
        })
      }
      
      postsList.value = posts
      
    } catch (error) {
      console.error('Error loading all posts:', error)
      errorMessage.value = 'Không thể tải danh sách posts'
    } finally {
      isLoadingPosts.value = false
    }
  }
  
  // Load tất cả comments thực tế cho quản lý
  const loadAllComments = async () => {
    isLoadingComments.value = true
    
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        orderBy('Created', 'desc')
      )
      
      const snapshot = await getDocs(commentsQuery)
      const comments = []
      
      snapshot.forEach((doc) => {
        const commentData = doc.data()
        comments.push({
          docId: doc.id, // Document ID để xóa
          content: commentData.Content || '',
          author: commentData.UserName || 'Anonymous',
          authorId: commentData.UserID || '',
          postId: commentData.PostID || '',
          created: commentData.Created,
          avatar: commentData.Avatar || ''
        })
      })
      
      commentsList.value = comments
      
    } catch (error) {
      console.error('Error loading all comments:', error)
      errorMessage.value = 'Không thể tải danh sách comments'
    } finally {
      isLoadingComments.value = false
    }
  }
  
  // Fixed: Xóa user - sử dụng document ID là UserID trong Firestore
  const deleteUser = async (userDocId) => {
    if (!isAdmin.value) {
      throw new Error('Không có quyền thực hiện thao tác này')
    }
    
    if (!userDocId) {
      throw new Error('Không tìm thấy thông tin user')
    }
    
    isDeleting.value = true
    
    try {
      console.log('Admin deleting user with docId:', userDocId)
      
      // Trong collection users, document ID chính là UserID
      // Xóa user document bằng document ID
      const userRef = doc(db, 'users', userDocId)
      await deleteDoc(userRef)
      
      // Xóa user khỏi danh sách local
      usersList.value = usersList.value.filter(user => user.docId !== userDocId)
      
      // Clear cache để reload data mới
      dataCache.value.lastUpdated = null
      
      console.log('User deleted successfully')
      return true
      
    } catch (error) {
      console.error('Error deleting user:', error)
      throw new Error('Không thể xóa user: ' + error.message)
    } finally {
      isDeleting.value = false
    }
  }
  
  // Fixed: Xóa post và tất cả related data
  const deletePost = async (postDocId) => {
    if (!isAdmin.value) {
      throw new Error('Không có quyền thực hiện thao tác này')
    }
    
    if (!postDocId) {
      throw new Error('Không tìm thấy thông tin post')
    }
    
    isDeleting.value = true
    
    try {
      console.log('Admin deleting post with docId:', postDocId)
      
      // Xóa post document
      const postRef = doc(db, 'posts', postDocId)
      await deleteDoc(postRef)
      
      // Xóa tất cả likes của post này
      const likesQuery = query(
        collection(db, 'likes'),
        where('PostID', '==', postDocId)
      )
      const likesSnapshot = await getDocs(likesQuery)
      
      const deletePromises = []
      likesSnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref))
      })
      
      // Xóa tất cả comments của post này
      const commentsQuery = query(
        collection(db, 'comments'),
        where('PostID', '==', postDocId)
      )
      const commentsSnapshot = await getDocs(commentsQuery)
      
      commentsSnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref))
      })
      
      await Promise.all(deletePromises)
      
      // Xóa post khỏi danh sách local
      postsList.value = postsList.value.filter(post => post.docId !== postDocId)
      
      // Clear cache để reload data mới
      dataCache.value.lastUpdated = null
      
      console.log('Post and related data deleted successfully')
      return true
      
    } catch (error) {
      console.error('Error deleting post:', error)
      throw new Error('Không thể xóa post: ' + error.message)
    } finally {
      isDeleting.value = false
    }
  }
  
  // Fixed: Xóa comment
  const deleteComment = async (commentDocId) => {
    if (!isAdmin.value) {
      throw new Error('Không có quyền thực hiện thao tác này')
    }
    
    if (!commentDocId) {
      throw new Error('Không tìm thấy thông tin comment')
    }
    
    isDeleting.value = true
    
    try {
      console.log('Admin deleting comment with docId:', commentDocId)
      
      // Xóa comment document từ Firestore
      const commentRef = doc(db, 'comments', commentDocId)
      await deleteDoc(commentRef)
      
      // Xóa comment khỏi danh sách local
      commentsList.value = commentsList.value.filter(comment => comment.docId !== commentDocId)
      
      // Clear cache để reload data mới
      dataCache.value.lastUpdated = null
      
      console.log('Comment deleted successfully')
      return true
      
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw new Error('Không thể xóa comment: ' + error.message)
    } finally {
      isDeleting.value = false
    }
  }
  
  // Fixed: Thay đổi role user - admin có thể update role của bất kỳ user nào
  const changeUserRole = async (userDocId, newRole) => {
    if (!isAdmin.value) {
      throw new Error('Không có quyền thực hiện thao tác này')
    }
    
    if (!userDocId) {
      throw new Error('Không tìm thấy thông tin user')
    }
    
    if (!newRole) {
      throw new Error('Role mới không hợp lệ')
    }
    
    try {
      console.log('Admin changing user role, docId:', userDocId, 'newRole:', newRole)
      
      // Cập nhật role trong collection users - admin có quyền update bất kỳ user document nào
      const userRef = doc(db, 'users', userDocId)
      await updateDoc(userRef, {
        Role: newRole,
        UpdatedAt: new Date(), // Sửa typo UpdateAt thành UpdatedAt
        UpdatedBy: 'admin' // Đánh dấu được cập nhật bởi admin
      })
      
      // Cập nhật trong danh sách local
      const userIndex = usersList.value.findIndex(user => user.docId === userDocId)
      if (userIndex !== -1) {
        usersList.value[userIndex].role = newRole
      }
      
      // Clear cache để reload data mới
      dataCache.value.lastUpdated = null
      
      console.log('User role changed successfully from admin')
      return true
      
    } catch (error) {
      console.error('Error changing user role:', error)
      
      // Log chi tiết lỗi để debug
      if (error.code === 'permission-denied') {
        console.error('Permission denied - Admin function may not be working properly')
        console.error('Current admin status:', isAdmin.value)
        console.error('UserDocId:', userDocId)
        console.error('New role:', newRole)
      }
      
      throw new Error('Không thể thay đổi role user: ' + error.message)
    }
  }
  
  // OPTIMIZED: Load tất cả dữ liệu thực tế cho dashboard - nhanh hơn
  const loadDashboardData = async () => {
    console.log('Loading dashboard data with optimization...')
    
    // Load song song tất cả
    await Promise.all([
      loadDashboardStats(),
      loadTopPosts(),
      loadRecentUsers(),
      loadAnalyticsData()
    ])
    
    console.log('Dashboard data loaded successfully')
  }
  
  // Clear cache khi cần refresh data
  const clearCache = () => {
    dataCache.value.lastUpdated = null
  }
  
  // Format số lượng để hiển thị (giữ nguyên logic cũ)
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }
  
  // Format timestamp (giữ nguyên logic cũ)
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A'
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN')
    } catch (error) {
      return 'N/A'
    }
  }
  
  // Reset tất cả state (giữ nguyên logic cũ)
  const resetAdminState = () => {
    isAdmin.value = false
    dashboardStats.value = { totalUsers: 0, totalPosts: 0, totalLikes: 0, totalComments: 0 }
    topPosts.value = []
    recentUsers.value = []
    usersList.value = []
    postsList.value = []
    commentsList.value = []
    chartData.value = { postsOverTime: [], likesOverTime: [], commentsOverTime: [], topUsersData: [], contentTypesData: [], labels: [] }
    errorMessage.value = ''
    dataCache.value = { posts: null, users: null, likes: null, comments: null, lastUpdated: null }
  }
  
  return {
    // Admin permission
    isAdmin,
    isCheckingAdmin,
    checkAdminRole,
    
    // Dashboard states
    dashboardStats,
    topPosts,
    recentUsers,
    isLoadingStats,
    
    // Data management
    usersList,
    postsList,
    commentsList,
    isLoadingUsers,
    isLoadingPosts,
    isLoadingComments,
    isDeleting,
    
    // Analytics
    chartData,
    isLoadingAnalytics,
    
    // Error handling
    errorMessage,
    
    // Dashboard methods
    loadDashboardData,
    loadDashboardStats,
    loadTopPosts,
    loadRecentUsers,
    loadAnalyticsData,
    
    // Data management methods
    loadAllUsers,
    loadAllPosts,
    loadAllComments,
    deleteUser,
    deletePost,
    deleteComment,
    changeUserRole,
    
    // Utility methods
    formatNumber,
    formatTimestamp,
    resetAdminState,
    clearCache
  }
}