/*
src/composables/useAdmin.js - Composable quản lý chức năng admin
Xử lý phân quyền admin, thống kê dữ liệu, quản lý users/posts/comments
Tích hợp Chart.js cho dashboard analytics
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
  Timestamp
} from 'firebase/firestore'
import { db } from '@/firebase/config'

export function useAdmin() {
  // States cho phân quyền
  const isAdmin = ref(false)
  const isCheckingAdmin = ref(false)
  
  // States cho dashboard
  const dashboardStats = ref({
    totalUsers: 0,
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0
  })
  const topPosts = ref([])
  const recentUsers = ref([])
  const isLoadingStats = ref(false)
  
  // States cho quản lý dữ liệu
  const usersList = ref([])
  const postsList = ref([])
  const commentsList = ref([])
  const isLoadingUsers = ref(false)
  const isLoadingPosts = ref(false)
  const isLoadingComments = ref(false)
  const isDeleting = ref(false)
  
  // States cho analytics
  const chartData = ref({
    postsOverTime: [],
    likesOverTime: [],
    commentsOverTime: [],
    topUsersData: [],
    contentTypesData: []
  })
  const isLoadingAnalytics = ref(false)
  
  const errorMessage = ref('')
  
  // Kiểm tra quyền admin của user
  const checkAdminRole = async (userId) => {
    if (!userId) return false
    
    isCheckingAdmin.value = true
    
    try {
      // Lấy thông tin user từ collection users
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
  
  // Load thống kê tổng quan cho dashboard
  const loadDashboardStats = async () => {
    isLoadingStats.value = true
    
    try {
      // Load song song tất cả thống kê
      const [usersSnapshot, postsSnapshot, likesSnapshot, commentsSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'posts')),
        getDocs(collection(db, 'likes')),
        getDocs(collection(db, 'comments'))
      ])
      
      dashboardStats.value = {
        totalUsers: usersSnapshot.size,
        totalPosts: postsSnapshot.size,
        totalLikes: likesSnapshot.size,
        totalComments: commentsSnapshot.size
      }
      
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      errorMessage.value = 'Không thể tải thống kê dashboard'
    } finally {
      isLoadingStats.value = false
    }
  }
  
  // Load top 10 bài viết có lượt thích cao nhất
  const loadTopPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('Created', 'desc'),
        limit(50)
      )
      
      const snapshot = await getDocs(postsQuery)
      const posts = []
      
      // Đếm likes cho từng post
      for (const postDoc of snapshot.docs) {
        const postData = postDoc.data()
        
        // Đếm likes từ collection likes
        const likesQuery = query(
          collection(db, 'likes'),
          where('PostID', '==', postDoc.id)
        )
        const likesSnapshot = await getDocs(likesQuery)
        
        posts.push({
          id: postDoc.id,
          title: postData.Caption || 'Untitled',
          author: postData.UserName || 'Anonymous',
          likes: likesSnapshot.size,
          created: postData.Created,
          content: postData.Content || ''
        })
      }
      
      // Sắp xếp theo likes và lấy top 10
      posts.sort((a, b) => b.likes - a.likes)
      topPosts.value = posts.slice(0, 10)
      
    } catch (error) {
      console.error('Error loading top posts:', error)
    }
  }
  
  // Load 10 người dùng mới nhất
  const loadRecentUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('Created', 'desc'),
        limit(10)
      )
      
      const snapshot = await getDocs(usersQuery)
      const users = []
      
      snapshot.forEach((doc) => {
        const userData = doc.data()
        users.push({
          id: doc.id,
          userId: userData.UserID,
          userName: userData.UserName || 'Anonymous',
          email: userData.Email || '',
          avatar: userData.Avatar || '',
          role: userData.Role || 'user',
          created: userData.Created,
          provider: userData.Provider || 'email'
        })
      })
      
      recentUsers.value = users
      
    } catch (error) {
      console.error('Error loading recent users:', error)
    }
  }
  
  // Load tất cả users cho quản lý
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
          id: doc.id,
          userId: userData.UserID,
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
  
  // Load tất cả posts cho quản lý
  const loadAllPosts = async () => {
    isLoadingPosts.value = true
    
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('Created', 'desc')
      )
      
      const snapshot = await getDocs(postsQuery)
      const posts = []
      
      // Load posts với likes count
      for (const postDoc of snapshot.docs) {
        const postData = postDoc.data()
        
        // Đếm likes
        const likesQuery = query(
          collection(db, 'likes'),
          where('PostID', '==', postDoc.id)
        )
        const likesSnapshot = await getDocs(likesQuery)
        
        // Đếm comments
        const commentsQuery = query(
          collection(db, 'comments'),
          where('PostID', '==', postDoc.id)
        )
        const commentsSnapshot = await getDocs(commentsQuery)
        
        posts.push({
          id: postDoc.id,
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
  
  // Load tất cả comments cho quản lý
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
          id: doc.id,
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
  
  // Load dữ liệu cho biểu đồ analytics
  const loadAnalyticsData = async () => {
    isLoadingAnalytics.value = true
    
    try {
      // Load dữ liệu theo thời gian (7 ngày gần nhất)
      const last7Days = []
      const postsOverTime = []
      const likesOverTime = []
      const commentsOverTime = []
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayStart = new Date(date.setHours(0, 0, 0, 0))
        const dayEnd = new Date(date.setHours(23, 59, 59, 999))
        
        last7Days.push(dayStart.toLocaleDateString('vi-VN'))
        
        // Đếm posts trong ngày
        const postsQuery = query(
          collection(db, 'posts'),
          where('Created', '>=', Timestamp.fromDate(dayStart)),
          where('Created', '<=', Timestamp.fromDate(dayEnd))
        )
        const postsSnapshot = await getDocs(postsQuery)
        postsOverTime.push(postsSnapshot.size)
        
        // Đếm likes trong ngày
        const likesQuery = query(
          collection(db, 'likes'),
          where('Created', '>=', Timestamp.fromDate(dayStart)),
          where('Created', '<=', Timestamp.fromDate(dayEnd))
        )
        const likesSnapshot = await getDocs(likesQuery)
        likesOverTime.push(likesSnapshot.size)
        
        // Đếm comments trong ngày
        const commentsQuery = query(
          collection(db, 'comments'),
          where('Created', '>=', Timestamp.fromDate(dayStart)),
          where('Created', '<=', Timestamp.fromDate(dayEnd))
        )
        const commentsSnapshot = await getDocs(commentsQuery)
        commentsOverTime.push(commentsSnapshot.size)
      }
      
      // Tạo dữ liệu cho top users chart
      const topUsersData = recentUsers.value.slice(0, 5).map(user => ({
        userName: user.userName,
        postsCount: Math.floor(Math.random() * 20) + 1, // Mock data
        likesCount: Math.floor(Math.random() * 50) + 1  // Mock data
      }))
      
      // Tạo dữ liệu cho content types (Mock data)
      const contentTypesData = [
        { type: 'Bài viết có ảnh', count: Math.floor(dashboardStats.value.totalPosts * 0.6) },
        { type: 'Bài viết có video', count: Math.floor(dashboardStats.value.totalPosts * 0.3) },
        { type: 'Bài viết text', count: Math.floor(dashboardStats.value.totalPosts * 0.1) }
      ]
      
      chartData.value = {
        labels: last7Days,
        postsOverTime,
        likesOverTime,
        commentsOverTime,
        topUsersData,
        contentTypesData
      }
      
    } catch (error) {
      console.error('Error loading analytics data:', error)
      errorMessage.value = 'Không thể tải dữ liệu analytics'
    } finally {
      isLoadingAnalytics.value = false
    }
  }
  
  // Xóa user (chỉ admin)
  const deleteUser = async (userId) => {
    if (!isAdmin.value) {
      throw new Error('Không có quyền thực hiện thao tác này')
    }
    
    isDeleting.value = true
    
    try {
      // Xóa user từ collection users
      const userRef = doc(db, 'users', userId)
      await deleteDoc(userRef)
      
      // Xóa user khỏi danh sách local
      usersList.value = usersList.value.filter(user => user.id !== userId)
      
      return true
      
    } catch (error) {
      console.error('Error deleting user:', error)
      throw new Error('Không thể xóa user')
    } finally {
      isDeleting.value = false
    }
  }
  
  // Xóa post (chỉ admin)
  const deletePost = async (postId) => {
    if (!isAdmin.value) {
      throw new Error('Không có quyền thực hiện thao tác này')
    }
    
    isDeleting.value = true
    
    try {
      // Xóa post
      const postRef = doc(db, 'posts', postId)
      await deleteDoc(postRef)
      
      // Xóa tất cả likes của post này
      const likesQuery = query(
        collection(db, 'likes'),
        where('PostID', '==', postId)
      )
      const likesSnapshot = await getDocs(likesQuery)
      
      const deletePromises = []
      likesSnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref))
      })
      
      // Xóa tất cả comments của post này
      const commentsQuery = query(
        collection(db, 'comments'),
        where('PostID', '==', postId)
      )
      const commentsSnapshot = await getDocs(commentsQuery)
      
      commentsSnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref))
      })
      
      await Promise.all(deletePromises)
      
      // Xóa post khỏi danh sách local
      postsList.value = postsList.value.filter(post => post.id !== postId)
      
      return true
      
    } catch (error) {
      console.error('Error deleting post:', error)
      throw new Error('Không thể xóa post')
    } finally {
      isDeleting.value = false
    }
  }
  
  // Xóa comment (chỉ admin)
  const deleteComment = async (commentId) => {
    if (!isAdmin.value) {
      throw new Error('Không có quyền thực hiện thao tác này')
    }
    
    isDeleting.value = true
    
    try {
      const commentRef = doc(db, 'comments', commentId)
      await deleteDoc(commentRef)
      
      // Xóa comment khỏi danh sách local
      commentsList.value = commentsList.value.filter(comment => comment.id !== commentId)
      
      return true
      
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw new Error('Không thể xóa comment')
    } finally {
      isDeleting.value = false
    }
  }
  
  // Thay đổi role user (promote/demote admin)
  const changeUserRole = async (userId, newRole) => {
    if (!isAdmin.value) {
      throw new Error('Không có quyền thực hiện thao tác này')
    }
    
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        Role: newRole,
        UpdateAt: new Date()
      })
      
      // Cập nhật trong danh sách local
      const userIndex = usersList.value.findIndex(user => user.id === userId)
      if (userIndex !== -1) {
        usersList.value[userIndex].role = newRole
      }
      
      return true
      
    } catch (error) {
      console.error('Error changing user role:', error)
      throw new Error('Không thể thay đổi role user')
    }
  }
  
  // Load tất cả dữ liệu cho dashboard
  const loadDashboardData = async () => {
    await Promise.all([
      loadDashboardStats(),
      loadTopPosts(),
      loadRecentUsers()
    ])
    
    // Load analytics data sau khi có basic stats
    await loadAnalyticsData()
  }
  
  // Format số lượng để hiển thị
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A'
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN')
    } catch (error) {
      return 'N/A'
    }
  }
  
  // Reset tất cả state
  const resetAdminState = () => {
    isAdmin.value = false
    dashboardStats.value = { totalUsers: 0, totalPosts: 0, totalLikes: 0, totalComments: 0 }
    topPosts.value = []
    recentUsers.value = []
    usersList.value = []
    postsList.value = []
    commentsList.value = []
    chartData.value = { postsOverTime: [], likesOverTime: [], commentsOverTime: [], topUsersData: [], contentTypesData: [] }
    errorMessage.value = ''
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
    resetAdminState
  }
}