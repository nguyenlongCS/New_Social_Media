/*
src/composables/useMessages.js - Fixed Version
Composable quản lý tin nhắn với Firebase Realtime Database và import userInfoHelper
Xử lý gửi/nhận tin nhắn realtime, quản lý cuộc hội thoại, upload media, tìm kiếm người dùng
*/
import { ref } from 'vue'
import { 
  ref as dbRef, 
  push, 
  set,
  remove,
  onValue, 
  off,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  update
} from 'firebase/database'
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage'
import { 
  collection, 
  query as firestoreQuery, 
  where, 
  getDocs,
  limit
} from 'firebase/firestore'
import { rtdb, storage, db } from '@/firebase/config'
// Import userInfoHelper để lấy thông tin user từ Firestore
import { userInfoHelper } from './useUserInfo'

export function useMessages() {
  // State quản lý cuộc hội thoại và tin nhắn
  const conversations = ref([])
  const conversationMessages = ref([])
  const usersList = ref([])
  const selectedConversation = ref(null)
  
  // Loading states
  const isLoading = ref(false)
  const isLoadingMessages = ref(false)
  const isSending = ref(false)
  
  // Realtime listeners
  const activeListeners = ref(new Map())
  
  // Tạo ID tin nhắn duy nhất
  const generateMessageId = () => {
    return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9)
  }
  
  // Tạo ID cuộc hội thoại từ 2 user ID (luôn theo thứ tự alphabet)
  const createConversationId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_')
  }
  
  // Load danh sách cuộc hội thoại của user
  const loadConversations = async (currentUserId) => {
    if (!currentUserId) return
    
    isLoading.value = true
    
    try {
      const messagesRef = dbRef(rtdb, 'messages')
      
      // Tạo map để nhóm tin nhắn theo partner
      const conversationMap = new Map()
      
      // Listen realtime cho tất cả tin nhắn liên quan đến user này
      const unsubscribe = onValue(messagesRef, (snapshot) => {
        if (!snapshot.exists()) {
          conversations.value = []
          isLoading.value = false
          return
        }
        
        conversationMap.clear()
        
        // Duyệt qua tất cả tin nhắn - sử dụng .val() cho Realtime Database
        snapshot.forEach((messageSnapshot) => {
          const messageData = messageSnapshot.val()
          
          // Chỉ xét tin nhắn có liên quan đến user hiện tại
          if (messageData.senderID === currentUserId || messageData.receiverID === currentUserId) {
            const partnerId = messageData.senderID === currentUserId 
              ? messageData.receiverID 
              : messageData.senderID
            
            const partnerName = messageData.senderID === currentUserId 
              ? messageData.receiverName 
              : messageData.senderName
            
            const partnerAvatar = messageData.senderID === currentUserId 
              ? messageData.receiverAvatar 
              : messageData.senderAvatar
            
            const conversationId = createConversationId(currentUserId, partnerId)
            
            // Cập nhật hoặc tạo mới conversation
            if (!conversationMap.has(conversationId) || 
                messageData.timestamp > conversationMap.get(conversationId).lastMessageTime) {
              
              conversationMap.set(conversationId, {
                id: conversationId,
                partnerId: partnerId,
                partnerName: partnerName,
                partnerAvatar: partnerAvatar,
                lastMessage: messageData.content || '',
                lastMessageType: messageData.type || 'text',
                lastMessageTime: messageData.timestamp,
                hasUnread: messageData.senderID !== currentUserId && !messageData.isRead
              })
            }
          }
        })
        
        // Chuyển Map thành Array và sắp xếp theo thời gian
        const conversationsList = Array.from(conversationMap.values())
          .sort((a, b) => b.lastMessageTime - a.lastMessageTime)
        
        conversations.value = conversationsList
        isLoading.value = false
      })
      
      // Lưu listener để cleanup sau
      activeListeners.value.set('conversations', unsubscribe)
      
    } catch (error) {
      console.error('Error loading conversations:', error)
      isLoading.value = false
    }
  }
  
  // Load tin nhắn của một cuộc hội thoại cụ thể
  const loadConversationMessages = async (currentUserId, partnerId) => {
    if (!currentUserId || !partnerId) return
    
    isLoadingMessages.value = true
    
    try {
      const messagesRef = dbRef(rtdb, 'messages')
      
      // Clear listener cũ nếu có
      const oldListener = activeListeners.value.get('conversationMessages')
      if (oldListener) {
        off(messagesRef, 'value', oldListener)
      }
      
      // Listen realtime cho tin nhắn của cuộc hội thoại này
      const unsubscribe = onValue(messagesRef, (snapshot) => {
        const messages = []
        
        if (snapshot.exists()) {
          // Sử dụng .val() cho Realtime Database
          snapshot.forEach((messageSnapshot) => {
            const messageData = messageSnapshot.val()
            
            // Chỉ lấy tin nhắn giữa 2 user này
            if ((messageData.senderID === currentUserId && messageData.receiverID === partnerId) ||
                (messageData.senderID === partnerId && messageData.receiverID === currentUserId)) {
              
              messages.push({
                id: messageSnapshot.key,
                ...messageData,
                isSentByMe: messageData.senderID === currentUserId
              })
            }
          })
        }
        
        // Sắp xếp tin nhắn theo thời gian
        messages.sort((a, b) => a.timestamp - b.timestamp)
        
        conversationMessages.value = messages
        isLoadingMessages.value = false
        
        // Đánh dấu tin nhắn đã đọc
        markMessagesAsRead(currentUserId, partnerId)
      })
      
      // Lưu listener
      activeListeners.value.set('conversationMessages', unsubscribe)
      
    } catch (error) {
      console.error('Error loading conversation messages:', error)
      isLoadingMessages.value = false
    }
  }
  
  // Đánh dấu tin nhắn đã đọc
  const markMessagesAsRead = async (currentUserId, partnerId) => {
    try {
      const messagesRef = dbRef(rtdb, 'messages')
      
      onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          // Sử dụng .val() cho Realtime Database
          snapshot.forEach((messageSnapshot) => {
            const messageData = messageSnapshot.val()
            
            // Đánh dấu đã đọc cho tin nhắn nhận được từ partner
            if (messageData.senderID === partnerId && 
                messageData.receiverID === currentUserId && 
                !messageData.isRead) {
              
              const messageRef = dbRef(rtdb, `messages/${messageSnapshot.key}/isRead`)
              set(messageRef, true)
            }
          })
        }
      }, { onlyOnce: true })
      
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }
  
  // Tìm kiếm người dùng trong Firestore collection "users"
  const searchUsers = async (query) => {
    if (!query.trim()) {
      usersList.value = []
      return
    }
    
    isLoading.value = true
    
    try {
      // Tìm kiếm theo UserName có chứa query (case insensitive)
      const usersQuery = firestoreQuery(
        collection(db, 'users'),
        limit(10)
      )
      
      const snapshot = await getDocs(usersQuery)
      const users = []
      
      snapshot.forEach((doc) => {
        const userData = doc.data()
        
        // Filter theo UserName hoặc Email chứa query
        const userName = userData.UserName?.toLowerCase() || ''
        const email = userData.Email?.toLowerCase() || ''
        const searchTerm = query.toLowerCase()
        
        if (userName.includes(searchTerm) || email.includes(searchTerm)) {
          users.push({
            userId: userData.UserID,
            userName: userData.UserName || 'Anonymous',
            email: userData.Email || '',
            avatar: userData.Avatar || '',
            bio: userData.Bio || ''
          })
        }
      })
      
      usersList.value = users
      
    } catch (error) {
      console.error('Error searching users:', error)
      usersList.value = []
    } finally {
      isLoading.value = false
    }
  }
  
  // Upload file media lên Firebase Storage
  const uploadMessageMedia = async (file, messageId) => {
    try {
      const fileExtension = file.name.split('.').pop()
      const fileName = `${messageId}_${Date.now()}.${fileExtension}`
      
      // Sử dụng đúng storage bucket
      const mediaRef = storageRef(storage, `messages/${fileName}`)
      
      console.log('Uploading file to:', `messages/${fileName}`)
      
      const snapshot = await uploadBytes(mediaRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      console.log('File uploaded successfully:', downloadURL)
      return downloadURL
      
    } catch (error) {
      console.error('Error uploading media:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      
      if (error.code === 'storage/unauthorized') {
        throw new Error('Không có quyền upload file. Vui lòng kiểm tra Storage Rules.')
      }
      
      throw new Error('Không thể upload file')
    }
  }
  
  // Gửi tin nhắn mới với thông tin user từ Firestore
  const sendMessage = async (currentUser, receiverId, messageData) => {
    if (!currentUser || !receiverId) {
      throw new Error('Thông tin không hợp lệ')
    }
    
    isSending.value = true
    
    try {
      // Lấy thông tin sender từ Firestore collection "users" thay vì Firebase Auth
      const senderInfo = await userInfoHelper.getUserInfoForContent(currentUser)
      if (!senderInfo) {
        throw new Error('Không thể lấy thông tin người gửi')
      }
      
      // Lấy thông tin người nhận từ Firestore
      let receiverInfo = await userInfoHelper.getUserInfoFromFirestore(receiverId)
      
      // Fallback: tìm trong danh sách conversations hoặc users hiện có
      if (!receiverInfo) {
        receiverInfo = conversations.value.find(conv => conv.partnerId === receiverId)
        if (!receiverInfo) {
          receiverInfo = usersList.value.find(user => user.userId === receiverId)
        }
        
        // Convert format nếu tìm thấy trong lists
        if (receiverInfo) {
          receiverInfo = {
            userName: receiverInfo.partnerName || receiverInfo.userName,
            avatar: receiverInfo.partnerAvatar || receiverInfo.avatar
          }
        }
      }
      
      const messageId = generateMessageId()
      const timestamp = Date.now()
      
      // Chuẩn bị dữ liệu tin nhắn với thông tin từ Firestore
      const baseMessageData = {
        senderID: senderInfo.UserID,
        senderName: senderInfo.UserName, // Từ Firestore, không phải email
        senderAvatar: senderInfo.Avatar, // Từ Firestore, không phải default
        receiverID: receiverId,
        receiverName: receiverInfo?.userName || 'User',
        receiverAvatar: receiverInfo?.avatar || '',
        timestamp: timestamp,
        isRead: false
      }
      
      let finalMessageData = { ...baseMessageData }
      
      // Xử lý theo loại tin nhắn
      if (messageData.type === 'text') {
        finalMessageData = {
          ...finalMessageData,
          type: 'text',
          content: messageData.content
        }
      } else if (messageData.type === 'image' || messageData.type === 'video') {
        // Upload file trước
        const mediaUrl = await uploadMessageMedia(messageData.file, messageId)
        
        finalMessageData = {
          ...finalMessageData,
          type: messageData.type,
          content: messageData.content || '', // Text kèm theo nếu có
          mediaUrl: mediaUrl
        }
      }
      
      // Lưu tin nhắn vào Realtime Database
      const messageRef = dbRef(rtdb, `messages/${messageId}`)
      await set(messageRef, finalMessageData)
      
      console.log('Message sent successfully:', messageId)
      
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    } finally {
      isSending.value = false
    }
  }
  
  // Xóa tin nhắn
  const deleteMessage = async (messageId) => {
    if (!messageId) return
    
    try {
      const messageRef = dbRef(rtdb, `messages/${messageId}`)
      await remove(messageRef)
      
      console.log('Message deleted:', messageId)
      
    } catch (error) {
      console.error('Error deleting message:', error)
      throw new Error('Không thể xóa tin nhắn')
    }
  }
  
  // Chọn cuộc hội thoại hiện tại
  const selectConversation = (conversation) => {
    selectedConversation.value = conversation
  }
  
  // Bắt đầu cuộc hội thoại mới với user
  const startNewConversation = (currentUser, targetUser) => {
    const conversationId = createConversationId(currentUser.uid, targetUser.userId)
    
    const newConversation = {
      id: conversationId,
      partnerId: targetUser.userId,
      partnerName: targetUser.userName,
      partnerAvatar: targetUser.avatar,
      lastMessage: '',
      lastMessageType: 'text',
      lastMessageTime: Date.now(),
      hasUnread: false
    }
    
    // Kiểm tra xem conversation đã tồn tại chưa
    const existingConv = conversations.value.find(conv => conv.id === conversationId)
    if (!existingConv) {
      conversations.value.unshift(newConversation)
    }
    
    selectedConversation.value = newConversation
    
    return newConversation
  }
  
  // Setup realtime listeners cho tin nhắn mới
  const setupRealtimeListeners = (currentUserId) => {
    // Listener cho conversations đã được setup trong loadConversations
    // Có thể thêm listeners khác nếu cần
    console.log('Realtime listeners setup for user:', currentUserId)
  }
  
  // Cleanup tất cả listeners
  const cleanup = () => {
    activeListeners.value.forEach((unsubscribe, key) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
      console.log('Cleaned up listener:', key)
    })
    activeListeners.value.clear()
    
    // Reset state
    conversations.value = []
    conversationMessages.value = []
    usersList.value = []
    selectedConversation.value = null
  }
  
  return {
    // State
    conversations,
    conversationMessages,
    usersList,
    selectedConversation,
    isLoading,
    isLoadingMessages,
    isSending,
    
    // Main functions
    loadConversations,
    loadConversationMessages,
    searchUsers,
    sendMessage,
    deleteMessage,
    selectConversation,
    startNewConversation,
    setupRealtimeListeners,
    cleanup
  }
}