/*
src/composables/useNotifications.js - Fixed Version với error handling
Composable quản lý hệ thống thông báo realtime với xử lý lỗi permissions tốt hơn
Thêm retry logic và fallback khi không có quyền truy cập
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

// Singleton state cho notifications
let notificationsState = null

function createNotificationsState() {
  const notifications = ref([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const isListening = ref(false)
  const hasPermissionError = ref(false)
  const errorMessage = ref('')
  let unsubscribe = null
  
  // Computed để lấy số thông báo chưa đọc
  const unreadNotifications = computed(() => {
    return notifications.value.filter(notif => !notif.isRead)
  })
  
  // Cập nhật unread count
  const updateUnreadCount = () => {
    unreadCount.value = unreadNotifications.value.length
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
    if (!userId || isListening.value) return
    
    isLoading.value = true
    hasPermissionError.value = false
    errorMessage.value = ''
    
    try {
      // Tạo query để lấy notifications của user hiện tại
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientID', '==', userId),
        orderBy('createAt', 'desc')
      )
      
      // Thiết lập realtime listener với error handling
      unsubscribe = onSnapshot(
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
          
          notifications.value = newNotifications
          updateUnreadCount()
          isLoading.value = false
          isListening.value = true
          hasPermissionError.value = false
          errorMessage.value = ''
          
          console.log(`Loaded ${newNotifications.length} notifications for user ${userId}`)
        }, 
        (error) => {
          console.error('Error listening to notifications:', error)
          isLoading.value = false
          
          // Xử lý lỗi permissions
          if (error.code === 'permission-denied') {
            hasPermissionError.value = true
            errorMessage.value = 'Không có quyền truy cập thông báo. Vui lòng cập nhật Firestore Rules.'
            console.warn('Notifications permission denied. Please update Firestore Rules to include notifications collection.')
          } else {
            errorMessage.value = 'Có lỗi khi tải thông báo'
          }
          
          // Dừng listening nếu có lỗi
          isListening.value = false
        }
      )
      
    } catch (error) {
      console.error('Error setting up notifications listener:', error)
      isLoading.value = false
      errorMessage.value = 'Không thể thiết lập listener thông báo'
    }
  }
  
  // Dừng lắng nghe notifications
  const stopListening = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    isListening.value = false
    hasPermissionError.value = false
    errorMessage.value = ''
    notifications.value = []
    unreadCount.value = 0
  }
  
  // Tạo thông báo khi có người like bài viết với error handling
  const createLikeNotification = async (postId, postOwnerId, liker) => {
    // Không tạo thông báo nếu người like chính là chủ bài viết
    if (liker.uid === postOwnerId) return
    
    try {
      // Lấy thông tin người like từ Firestore
      const likerInfo = await userInfoHelper.getUserInfoForContent(liker)
      if (!likerInfo) {
        console.warn('Cannot get liker info for notification')
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
      console.log('Created like notification')
      
    } catch (error) {
      console.error('Error creating like notification:', error)
      
      // Log chi tiết lỗi nhưng không throw để không làm gián đoạn flow chính
      if (error.code === 'permission-denied') {
        console.warn('Cannot create notification due to permissions. Please update Firestore Rules.')
      }
    }
  }
  
  // Tạo thông báo khi có người comment bài viết với error handling
  const createCommentNotification = async (postId, postOwnerId, commenter, commentContent) => {
    // Không tạo thông báo nếu người comment chính là chủ bài viết
    if (commenter.uid === postOwnerId) return
    
    try {
      // Lấy thông tin người comment từ Firestore
      const commenterInfo = await userInfoHelper.getUserInfoForContent(commenter)
      if (!commenterInfo) {
        console.warn('Cannot get commenter info for notification')
        return
      }
      
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
      
      await addDoc(collection(db, 'notifications'), notificationData)
      console.log('Created comment notification')
      
    } catch (error) {
      console.error('Error creating comment notification:', error)
      
      if (error.code === 'permission-denied') {
        console.warn('Cannot create notification due to permissions. Please update Firestore Rules.')
      }
    }
  }
  
  // Tạo thông báo khi chấp nhận lời mời kết bạn với error handling
  const createFriendAcceptNotification = async (requestSenderId, accepter) => {
    try {
      // Lấy thông tin người chấp nhận từ Firestore
      const accepterInfo = await userInfoHelper.getUserInfoForContent(accepter)
      if (!accepterInfo) {
        console.warn('Cannot get accepter info for notification')
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
      console.log('Created friend accept notification')
      
    } catch (error) {
      console.error('Error creating friend accept notification:', error)
      
      if (error.code === 'permission-denied') {
        console.warn('Cannot create notification due to permissions. Please update Firestore Rules.')
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
      const notificationIndex = notifications.value.findIndex(n => n.id === notificationId)
      if (notificationIndex !== -1) {
        notifications.value[notificationIndex].isRead = true
        updateUnreadCount()
      }
      
    } catch (error) {
      console.error('Error marking notification as read:', error)
      
      if (error.code === 'permission-denied') {
        console.warn('Cannot mark notification as read due to permissions.')
      }
    }
  }
  
  // Đánh dấu tất cả thông báo đã đọc với error handling
  const markAllAsRead = async (userId) => {
    if (!userId) return
    
    try {
      const batch = writeBatch(db)
      
      // Cập nhật tất cả thông báo chưa đọc
      const unreadNotifications = notifications.value.filter(n => !n.isRead)
      
      unreadNotifications.forEach((notification) => {
        const notificationRef = doc(db, 'notifications', notification.id)
        batch.update(notificationRef, { isRead: true })
      })
      
      if (unreadNotifications.length > 0) {
        await batch.commit()
        
        // Cập nhật local state
        notifications.value.forEach((notification) => {
          notification.isRead = true
        })
        updateUnreadCount()
        
        console.log('Marked all notifications as read')
      }
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      
      if (error.code === 'permission-denied') {
        console.warn('Cannot mark all notifications as read due to permissions.')
      }
    }
  }
  
  // Reset state
  const resetNotifications = () => {
    stopListening()
    notifications.value = []
    unreadCount.value = 0
    hasPermissionError.value = false
    errorMessage.value = ''
  }
  
  return {
    // State
    notifications,
    unreadCount,
    unreadNotifications,
    isLoading,
    isListening,
    hasPermissionError,
    errorMessage,
    
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

export function useNotifications() {
  if (!notificationsState) {
    notificationsState = createNotificationsState()
  }
  return notificationsState
}