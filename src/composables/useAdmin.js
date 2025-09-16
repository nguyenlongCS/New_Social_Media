/*
src/composables/useAdmin.js - Composable quản lý chức năng admin với permissions fix
Fixed: Sử dụng user document ID thay vì UserID cho delete operations
Cập nhật logic delete để sử dụng đúng document structure
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
  
  // States cho analytics với dữ liệu thực tế từ Firestore
  const chartData = ref({
    postsOverTime: [],
    likesOverTime: [],
    commentsOverTime: [],
    topUsersData: [],
    contentTypesData: []
  })
  const isLoadingAnalytics = ref(false)
  
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
  
  // Load thống kê tổng quan thực tế từ các collections
  const loadDashboardStats = async () => {
    isLoadingStats.value = true
    
    try {
      // Đếm số lượng documents thực tế từ từng collection
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
  
  // Load top 10 bài viết có lượt thích cao nhất (dữ liệu thực tế)
  const loadTopPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('Created', 'desc'),
        limit(50)
      )
      
      const snapshot = await getDocs(postsQuery)
      const posts = []
      
      // Đếm likes thực tế cho từng post
      for (const postDoc of snapshot.docs) {
        const postData = postDoc.data()
        
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
      
      // Sắp xếp theo likes thực tế và lấy top 10
      posts.sort((a, b) => b.likes - a.likes)
      topPosts.value = posts.slice(0, 10)
      
    } catch (error) {
      console.error('Error loading top posts:', error)
    }
  }
  
  // Load 10 người dùng mới đăng ký gần đây nhất (dữ liệu thực tế)
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
  
  // Load dữ liệu thực tế cho biểu đồ analytics
  const loadAnalyticsData = async () => {
    isLoadingAnalytics.value = true
    
    try {
      const last7Days = []
      const postsOverTime = []
      const likesOverTime = []
      const commentsOverTime = []
      
      // Tạo dữ liệu cho 7 ngày gần đây
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayStart = new Date(date.setHours(0, 0, 0, 0))
        const dayEnd = new Date(date.setHours(23, 59, 59, 999))
        
        last7Days.push(dayStart.toLocaleDateString('vi-VN'))
        
        // Đếm posts được tạo trong ngày
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
      
      const topUsersData = await loadTopUsersForChart()
      const contentTypesData = await loadContentTypesData()
      
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
  
  // Load top users thực tế cho chart
  const loadTopUsersForChart = async () => {
    try {
      const usersWithPosts = []
      
      // Lấy top 5 users từ recentUsers hoặc tất cả users
      const usersToCheck = recentUsers.value.length > 0 ? recentUsers.value.slice(0, 5) : []
      
      for (const user of usersToCheck) {
        // Đếm posts thực tế của user
        const userPostsQuery = query(
          collection(db, 'posts'),
          where('UserID', '==', user.userId)
        )
        const userPostsSnapshot = await getDocs(userPostsQuery)
        const postsCount = userPostsSnapshot.size
        
        // Đếm tổng likes cho tất cả posts của user
        let totalLikes = 0
        for (const postDoc of userPostsSnapshot.docs) {
          const likesQuery = query(
            collection(db, 'likes'),
            where('PostID', '==', postDoc.id)
          )
          const likesSnapshot = await getDocs(likesQuery)
          totalLikes += likesSnapshot.size
        }
        
        usersWithPosts.push({
          userName: user.userName,
          postsCount: postsCount,
          likesCount: totalLikes
        })
      }
      
      // Sắp xếp theo số posts thực tế
      usersWithPosts.sort((a, b) => b.postsCount - a.postsCount)
      
      return usersWithPosts
      
    } catch (error) {
      console.error('Error loading top users for chart:', error)
      return []
    }
  }
  
  // Load phân loại content types thực tế
  const loadContentTypesData = async () => {
    try {
      const postsQuery = query(collection(db, 'posts'))
      const snapshot = await getDocs(postsQuery)
      
      let imagePostsCount = 0
      let videoPostsCount = 0
      let textPostsCount = 0
      
      snapshot.forEach((doc) => {
        const postData = doc.data()
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
  
  // Load tất cả dữ liệu thực tế cho dashboard
  const loadDashboardData = async () => {
    await Promise.all([
      loadDashboardStats(),
      loadTopPosts(),
      loadRecentUsers()
    ])
    
    await loadAnalyticsData()
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