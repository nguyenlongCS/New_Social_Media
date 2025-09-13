/*
src/composables/useFriends.js - Composable quản lý hệ thống bạn bè
Quản lý friends collection, friend requests, load danh sách bạn bè và users
Collection "friends": receiverID, senderID, status, createdAt
*/
import { ref } from 'vue'
import { 
  collection, 
  query, 
  where, 
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  or,
  and
} from 'firebase/firestore'
import { db } from '@/firebase/config'

export function useFriends() {
  const friendsList = ref([])
  const usersList = ref([])
  const friendRequests = ref([])
  const isLoading = ref(false)
  const errorMessage = ref('')
  
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
  
  // Load danh sách bạn bè của user hiện tại
  const loadFriendsList = async (userId) => {
    if (!userId) {
      errorMessage.value = 'User ID không hợp lệ'
      return
    }
    
    isLoading.value = true
    errorMessage.value = ''
    
    try {
      // Query đơn giản hơn để tránh lỗi permissions với compound queries
      const senderQuery = query(
        collection(db, 'friends'),
        where('senderID', '==', userId),
        where('status', '==', 'accepted'),
        orderBy('createdAt', 'desc')
      )
      
      const receiverQuery = query(
        collection(db, 'friends'),
        where('receiverID', '==', userId),
        where('status', '==', 'accepted'),
        orderBy('createdAt', 'desc')
      )
      
      const [senderSnapshot, receiverSnapshot] = await Promise.all([
        getDocs(senderQuery),
        getDocs(receiverQuery)
      ])
      
      const friends = []
      
      // Xử lý friends từ sender query
      for (const friendDoc of senderSnapshot.docs) {
        const friendData = friendDoc.data()
        const friendUserId = friendData.receiverID
        
        // Lấy thông tin user từ collection users
        const userQuery = query(
          collection(db, 'users'),
          where('UserID', '==', friendUserId)
        )
        
        const userSnapshot = await getDocs(userQuery)
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data()
          
          friends.push({
            id: friendDoc.id,
            friendshipId: friendDoc.id,
            userId: friendUserId,
            userName: userData.UserName || 'Anonymous',
            avatar: userData.Avatar || '',
            email: userData.Email || '',
            bio: userData.Bio || '',
            createdAt: formatTimestamp(friendData.createdAt)
          })
        }
      }
      
      // Xử lý friends từ receiver query
      for (const friendDoc of receiverSnapshot.docs) {
        const friendData = friendDoc.data()
        const friendUserId = friendData.senderID
        
        // Lấy thông tin user từ collection users
        const userQuery = query(
          collection(db, 'users'),
          where('UserID', '==', friendUserId)
        )
        
        const userSnapshot = await getDocs(userQuery)
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data()
          
          friends.push({
            id: friendDoc.id,
            friendshipId: friendDoc.id,
            userId: friendUserId,
            userName: userData.UserName || 'Anonymous',
            avatar: userData.Avatar || '',
            email: userData.Email || '',
            bio: userData.Bio || '',
            createdAt: formatTimestamp(friendData.createdAt)
          })
        }
      }
      
      friendsList.value = friends
      
    } catch (error) {
      console.error('Error loading friends list:', error)
      
      if (error.code === 'permission-denied') {
        errorMessage.value = 'Không có quyền truy cập danh sách bạn bè'
      } else {
        errorMessage.value = 'Không thể tải danh sách bạn bè'
      }
      
      friendsList.value = []
    } finally {
      isLoading.value = false
    }
  }
  
  // Load danh sách tất cả users để gợi ý kết bạn
  const loadUsersList = async (currentUserId) => {
    if (!currentUserId) {
      errorMessage.value = 'User ID không hợp lệ'
      return
    }
    
    isLoading.value = true
    errorMessage.value = ''
    
    try {
      // Lấy tất cả users trừ user hiện tại
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('Created', 'desc')
      )
      
      const snapshot = await getDocs(usersQuery)
      const users = []
      
      // Lấy danh sách ID bạn bè hiện tại để loại trừ
      const currentFriendIds = new Set(friendsList.value.map(friend => friend.userId))
      
      // Lấy danh sách ID đã gửi/nhận friend request (cả 2 chiều)
      const requestIds = await getAllRequestIds(currentUserId)
      
      snapshot.forEach((doc) => {
        const userData = doc.data()
        const userId = userData.UserID
        
        // Loại trừ user hiện tại, bạn bè hiện tại, và những người đã có request (cả 2 chiều)
        if (userId !== currentUserId && 
            !currentFriendIds.has(userId) && 
            !requestIds.has(userId)) {
          
          users.push({
            userId: userId,
            userName: userData.UserName || 'Anonymous',
            avatar: userData.Avatar || '',
            email: userData.Email || '',
            bio: userData.Bio || '',
            createdAt: formatTimestamp(userData.Created)
          })
        }
      })
      
      usersList.value = users
      
    } catch (error) {
      console.error('Error loading users list:', error)
      errorMessage.value = 'Không thể tải danh sách người dùng'
      usersList.value = []
    } finally {
      isLoading.value = false
    }
  }
  
  // Lấy danh sách ID của những người đã có friend request (cả 2 chiều)
  const getAllRequestIds = async (userId) => {
    try {
      // Lấy requests mà user này đã gửi (pending)
      const sentRequestsQuery = query(
        collection(db, 'friends'),
        where('senderID', '==', userId),
        where('status', '==', 'pending')
      )
      
      // Lấy requests mà user này đã nhận (pending)
      const receivedRequestsQuery = query(
        collection(db, 'friends'),
        where('receiverID', '==', userId),
        where('status', '==', 'pending')
      )
      
      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentRequestsQuery),
        getDocs(receivedRequestsQuery)
      ])
      
      const requestIds = new Set()
      
      // Thêm IDs từ requests đã gửi
      sentSnapshot.forEach((doc) => {
        const data = doc.data()
        requestIds.add(data.receiverID) // Người nhận request
      })
      
      // Thêm IDs từ requests đã nhận
      receivedSnapshot.forEach((doc) => {
        const data = doc.data()
        requestIds.add(data.senderID) // Người gửi request
      })
      
      return requestIds
    } catch (error) {
      console.error('Error getting all request IDs:', error)
      return new Set()
    }
  }
  
  // Load danh sách lời mời kết bạn nhận được
  const getFriendRequests = async (userId) => {
    if (!userId) {
      errorMessage.value = 'User ID không hợp lệ'
      return
    }
    
    isLoading.value = true
    errorMessage.value = ''
    
    try {
      // Query để lấy các request pending mà user hiện tại là receiver
      const requestsQuery = query(
        collection(db, 'friends'),
        where('receiverID', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(requestsQuery)
      const requests = []
      
      // Lấy thông tin chi tiết của từng người gửi request
      for (const requestDoc of snapshot.docs) {
        const requestData = requestDoc.data()
        
        // Lấy thông tin sender từ collection users
        const userQuery = query(
          collection(db, 'users'),
          where('UserID', '==', requestData.senderID)
        )
        
        const userSnapshot = await getDocs(userQuery)
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data()
          
          requests.push({
            id: requestDoc.id,
            requestId: requestDoc.id,
            userId: requestData.senderID,
            userName: userData.UserName || 'Anonymous',
            avatar: userData.Avatar || '',
            email: userData.Email || '',
            bio: userData.Bio || '',
            createdAt: formatTimestamp(requestData.createdAt)
          })
        }
      }
      
      friendRequests.value = requests
      
    } catch (error) {
      console.error('Error loading friend requests:', error)
      errorMessage.value = 'Không thể tải lời mời kết bạn'
      friendRequests.value = []
    } finally {
      isLoading.value = false
    }
  }
  
  // Gửi lời mời kết bạn
  const sendFriendRequest = async (senderId, receiverId) => {
    if (!senderId || !receiverId) {
      throw new Error('Thông tin không hợp lệ')
    }
    
    if (senderId === receiverId) {
      throw new Error('Không thể gửi lời mời cho chính mình')
    }
    
    try {
      // Kiểm tra xem đã có request chưa
      const existingQuery = query(
        collection(db, 'friends'),
        or(
          and(where('senderID', '==', senderId), where('receiverID', '==', receiverId)),
          and(where('senderID', '==', receiverId), where('receiverID', '==', senderId))
        )
      )
      
      const existingSnapshot = await getDocs(existingQuery)
      
      if (!existingSnapshot.empty) {
        throw new Error('Đã có kết nối bạn bè hoặc lời mời đang chờ')
      }
      
      // Tạo friend request mới
      const requestData = {
        senderID: senderId,
        receiverID: receiverId,
        status: 'pending',
        createdAt: serverTimestamp()
      }
      
      await addDoc(collection(db, 'friends'), requestData)
      
      return true
      
    } catch (error) {
      console.error('Error sending friend request:', error)
      throw error
    }
  }
  
  // Chấp nhận lời mời kết bạn
  const handleAcceptRequest = async (requestId) => {
    if (!requestId) {
      throw new Error('Request ID không hợp lệ')
    }
    
    try {
      // Cập nhật status từ pending thành accepted
      const requestRef = doc(db, 'friends', requestId)
      await updateDoc(requestRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      })
      
      // Xóa request khỏi danh sách local
      friendRequests.value = friendRequests.value.filter(req => req.requestId !== requestId)
      
      return true
      
    } catch (error) {
      console.error('Error accepting friend request:', error)
      throw new Error('Không thể chấp nhận lời mời')
    }
  }
  
  // Từ chối lời mời kết bạn
  const handleRejectRequest = async (requestId) => {
    if (!requestId) {
      throw new Error('Request ID không hợp lệ')
    }
    
    try {
      // Xóa request khỏi Firestore
      const requestRef = doc(db, 'friends', requestId)
      await deleteDoc(requestRef)
      
      // Xóa request khỏi danh sách local
      friendRequests.value = friendRequests.value.filter(req => req.requestId !== requestId)
      
      return true
      
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      throw new Error('Không thể từ chối lời mời')
    }
  }
  
  // Hủy kết bạn
  const unfriend = async (friendshipId) => {
    if (!friendshipId) {
      throw new Error('Friendship ID không hợp lệ')
    }
    
    try {
      // Xóa friendship khỏi Firestore
      const friendshipRef = doc(db, 'friends', friendshipId)
      await deleteDoc(friendshipRef)
      
      // Xóa bạn bè khỏi danh sách local
      friendsList.value = friendsList.value.filter(friend => friend.friendshipId !== friendshipId)
      
      return true
      
    } catch (error) {
      console.error('Error unfriending:', error)
      throw new Error('Không thể hủy kết bạn')
    }
  }
  
  // Reset tất cả dữ liệu
  const resetFriendsData = () => {
    friendsList.value = []
    usersList.value = []
    friendRequests.value = []
    isLoading.value = false
    errorMessage.value = ''
  }
  
  return {
    // State
    friendsList,
    usersList,
    friendRequests,
    isLoading,
    errorMessage,
    
    // Methods
    loadFriendsList,
    loadUsersList,
    getFriendRequests,
    sendFriendRequest,
    handleAcceptRequest,
    handleRejectRequest,
    unfriend,
    resetFriendsData
  }
}