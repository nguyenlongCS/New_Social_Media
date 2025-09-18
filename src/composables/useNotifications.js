/*
src/composables/useNotifications.js - Fixed Global Singleton Version
Composable quản lý hệ thống thông báo realtime với global singleton state
Fixed: Đảm bảo state được duy trì khi chuyển trang, không bị reset khi component unmount
Singleton pattern đúng cách để notifications không bị mất khi navigate
*/
import { ref, computed } from 'vue'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/firebase/config'
// Import userInfoHelper để lấy thông tin user
import { userInfoHelper } from './useUserInfo'

// Global singleton state - tạo một lần duy nhất và duy trì xuyên suốt app
const globalNotificationsState = {
  notifications: ref([]),
  unreadCount: ref(0),
  isLoading: ref(false),
  isListening: ref(false),
  hasPermissionError: ref(false),
  errorMessage: ref(''),
  currentUserId: ref(''),
  unsubscribe: null
}

// Computed để lấy số thông báo chưa đọc
const unreadNotifications = computed(() => {
  return globalNotificationsState.notifications.value.filter(notif => !notif.isRead)
})

// Cập nhật unread count
const updateUnreadCount = () => {
  globalNotificationsState.unreadCount.value = unreadNotifications.value.length
}

// Định dạng thời gian hiển thị thông báo
const formatNotificationTime = (timestamp) => {
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
    console.error('Error formatting notification time:', error)
    return 'Vừa xong'
  }
}

// Lắng nghe realtime notifications cho user hiện tại với error handling
const startListening = (userId) => {
  // Nếu đang listen cho cùng user, không cần setup lại
  if (globalNotificationsState.isListening.value && globalNotificationsState.currentUserId.value === userId) {
    console.log('Notifications: Already listening for user', userId)
    return
  }
  
  // Cleanup listener cũ nếu có
  stopListening()
  
  if (!userId) return
  
  globalNotificationsState.isLoading.value = true
  globalNotificationsState.hasPermissionError.value = false
  globalNotificationsState.errorMessage.value = ''
  globalNotificationsState.currentUserId.value = userId
  
  try {
    console.log('Notifications: Starting listener for user', userId)
    
    // Tạo query để lấy notifications của user hiện tại
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientID', '==', userId),
      orderBy('createAt', 'desc')
    )
    
    // Thiết lập realtime listener với error handling
    globalNotificationsState.unsubscribe = onSnapshot(
      notificationsQuery, 
      (snapshot) => {
        const newNotifications = []
        
        snapshot.forEach((doc) => {
          const data = doc.data()
          newNotifications.push({
            id: doc.id,
            ...data,
            formattedTime: formatNotificationTime(data.createAt)
          })
        })
        
        globalNotificationsState.notifications.value = newNotifications
        updateUnreadCount()
        globalNotificationsState.isLoading.value = false
        globalNotificationsState.isListening.value = true
        globalNotificationsState.hasPermissionError.value = false
        globalNotificationsState.errorMessage.value = ''
        
        console.log(`Notifications: Loaded ${newNotifications.length} notifications for user ${userId}`)
      }, 
      (error) => {
        console.error('Notifications: Error listening to notifications:', error)
        globalNotificationsState.isLoading.value = false
        
        // Xử lý lỗi permissions
        if (error.code === 'permission-denied') {
          globalNotificationsState.hasPermissionError.value = true
          globalNotificationsState.errorMessage.value = 'Không có quyền truy cập thông báo. Vui lòng cập nhật Firestore Rules.'
          console.warn('Notifications: Permission denied. Please update Firestore Rules to include notifications collection.')
        } else {
          globalNotificationsState.errorMessage.value = 'Có lỗi khi tải thông báo'
        }
        
        // Dừng listening nếu có lỗi
        globalNotificationsState.isListening.value = false
      }
    )
    
  } catch (error) {
    console.error('Notifications: Error setting up notifications listener:', error)
    globalNotificationsState.isLoading.value = false
    globalNotificationsState.errorMessage.value = 'Không thể thiết lập listener thông báo'
  }
}

// Dừng lắng nghe notifications
const stopListening = () => {
  if (globalNotificationsState.unsubscribe) {
    console.log('Notifications: Stopping listener for user', globalNotificationsState.currentUserId.value)
    globalNotificationsState.unsubscribe()
    globalNotificationsState.unsubscribe = null
  }
  globalNotificationsState.isListening.value = false
  globalNotificationsState.currentUserId.value = ''
}

// Reset toàn bộ state (chỉ khi user logout)
const resetNotifications = () => {
  console.log('Notifications: Resetting all state')
  stopListening()
  globalNotificationsState.notifications.value = []
  globalNotificationsState.unreadCount.value = 0
  globalNotificationsState.hasPermissionError.value = false
  globalNotificationsState.errorMessage.value = ''
}

// Tạo thông báo khi có người like bài viết với error handling
const createLikeNotification = async (postId, postOwnerId, liker) => {
  // Không tạo thông báo nếu người like chính là chủ bài viết
  if (liker.uid === postOwnerId) return
  
  try {
    // Lấy thông tin người like từ Firestore
    const likerInfo = await userInfoHelper.getUserInfoForContent(liker)
    if (!likerInfo) {
      console.warn('Notifications: Cannot get liker info for notification')
      return
    }
    
    // Tạo thông báo mới
    const notificationData = {
      recipientID: postOwnerId,
      senderID: likerInfo.UserID,
      senderName: likerInfo.UserName,
      type: 'like',
      postID: postId,
      messages: `${likerInfo.UserName} đã thích bài viết của bạn`,
      isRead: false,
      createAt: serverTimestamp()
    }
    
    await addDoc(collection(db, 'notifications'), notificationData)
    console.log('Notifications: Created like notification')
    
  } catch (error) {
    console.error('Notifications: Error creating like notification:', error)
    
    // Log chi tiết lỗi nhưng không throw để không làm gián đoạn flow chính
    if (error.code === 'permission-denied') {
      console.warn('Notifications: Cannot create notification due to permissions. Please update Firestore Rules.')
    }
  }
}

// Tạo thông báo khi có người comment bài viết - FIXED VERSION
const createCommentNotification = async (postId, postOwnerId, commenter, commentContent) => {
  // Không tạo thông báo nếu người comment chính là chủ bài viết
  if (commenter.uid === postOwnerId) {
    console.log('Notifications: Skipping comment notification - same user')
    return
  }
  
  try {
    console.log('Notifications: Creating comment notification')
    console.log('Notifications: PostId:', postId)
    console.log('Notifications: PostOwnerId:', postOwnerId)
    console.log('Notifications: Commenter:', commenter.uid)
    console.log('Notifications: Comment:', commentContent)
    
    // Lấy thông tin người comment từ Firestore
    const commenterInfo = await userInfoHelper.getUserInfoForContent(commenter)
    if (!commenterInfo) {
      console.warn('Notifications: Cannot get commenter info for notification')
      return
    }
    
    console.log('Notifications: Commenter info:', commenterInfo)
    
    // Cắt ngắn nội dung comment nếu quá dài
    const shortComment = commentContent.length > 50 
      ? commentContent.substring(0, 50) + '...' 
      : commentContent
    
    // Tạo thông báo mới
    const notificationData = {
      recipientID: postOwnerId,
      senderID: commenterInfo.UserID,
      senderName: commenterInfo.UserName,
      type: 'comment',
      postID: postId,
      messages: `${commenterInfo.UserName} đã bình luận: "${shortComment}"`,
      isRead: false,
      createAt: serverTimestamp()
    }
    
    console.log('Notifications: Creating notification with data:', notificationData)
    
    const docRef = await addDoc(collection(db, 'notifications'), notificationData)
    console.log('Notifications: Comment notification created successfully with ID:', docRef.id)
    
  } catch (error) {
    console.error('Notifications: Error creating comment notification:', error)
    
    if (error.code === 'permission-denied') {
      console.warn('Notifications: Cannot create notification due to permissions. Please update Firestore Rules.')
    } else if (error.code) {
      console.error('Notifications: Firestore error code:', error.code)
      console.error('Notifications: Firestore error message:', error.message)
    }
  }
}

// Tạo thông báo khi chấp nhận lời mời kết bạn với error handling
const createFriendAcceptNotification = async (requestSenderId, accepter) => {
  try {
    // Lấy thông tin người chấp nhận từ Firestore
    const accepterInfo = await userInfoHelper.getUserInfoForContent(accepter)
    if (!accepterInfo) {
      console.warn('Notifications: Cannot get accepter info for notification')
      return
    }
    
    // Tạo thông báo mới
    const notificationData = {
      recipientID: requestSenderId,
      senderID: accepterInfo.UserID,
      senderName: accepterInfo.UserName,
      type: 'friend_accept',
      postID: '', // Không có postID cho friend notification
      messages: `${accepterInfo.UserName} đã chấp nhận lời mời kết bạn của bạn`,
      isRead: false,
      createAt: serverTimestamp()
    }
    
    await addDoc(collection(db, 'notifications'), notificationData)
    console.log('Notifications: Created friend accept notification')
    
  } catch (error) {
    console.error('Notifications: Error creating friend accept notification:', error)
    
    if (error.code === 'permission-denied') {
      console.warn('Notifications: Cannot create notification due to permissions. Please update Firestore Rules.')
    }
  }
}

// Đánh dấu một thông báo đã đọc với error handling
const markAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId)
    await updateDoc(notificationRef, {
      isRead: true
    })
    
    // Cập nhật local state
    const notificationIndex = globalNotificationsState.notifications.value.findIndex(n => n.id === notificationId)
    if (notificationIndex !== -1) {
      globalNotificationsState.notifications.value[notificationIndex].isRead = true
      updateUnreadCount()
    }
    
  } catch (error) {
    console.error('Notifications: Error marking notification as read:', error)
    
    if (error.code === 'permission-denied') {
      console.warn('Notifications: Cannot mark notification as read due to permissions.')
    }
  }
}

// Đánh dấu tất cả thông báo đã đọc với error handling
const markAllAsRead = async (userId) => {
  if (!userId) return
  
  try {
    const batch = writeBatch(db)
    
    // Cập nhật tất cả thông báo chưa đọc
    const unreadNotifications = globalNotificationsState.notifications.value.filter(n => !n.isRead)
    
    unreadNotifications.forEach((notification) => {
      const notificationRef = doc(db, 'notifications', notification.id)
      batch.update(notificationRef, { isRead: true })
    })
    
    if (unreadNotifications.length > 0) {
      await batch.commit()
      
      // Cập nhật local state
      globalNotificationsState.notifications.value.forEach((notification) => {
        notification.isRead = true
      })
      updateUnreadCount()
      
      console.log('Notifications: Marked all notifications as read')
    }
    
  } catch (error) {
    console.error('Notifications: Error marking all notifications as read:', error)
    
    if (error.code === 'permission-denied') {
      console.warn('Notifications: Cannot mark all notifications as read due to permissions.')
    }
  }
}

// Export function tạo composable với global state
export function useNotifications() {
  return {
    // State - reference đến global singleton
    notifications: globalNotificationsState.notifications,
    unreadCount: globalNotificationsState.unreadCount,
    unreadNotifications,
    isLoading: globalNotificationsState.isLoading,
    isListening: globalNotificationsState.isListening,
    hasPermissionError: globalNotificationsState.hasPermissionError,
    errorMessage: globalNotificationsState.errorMessage,
    
    // Methods
    startListening,
    stopListening,
    createLikeNotification,
    createCommentNotification,
    createFriendAcceptNotification,
    markAsRead,
    markAllAsRead,
    resetNotifications,
    formatNotificationTime
  }
}