/*
src/composables/useUserInfo.js - Helper composable lấy thông tin user từ Firestore
Giải quyết triệt để vấn đề hiển thị thông tin user từ collection "users" thay vì Firebase Auth
Logic: Luôn ưu tiên dữ liệu từ Firestore collection "users", fallback sang Firebase Auth nếu cần
*/
import { ref } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

// Cache để tránh query Firestore nhiều lần cho cùng một user
const userInfoCache = new Map()

export function useUserInfo() {
  const isLoading = ref(false)
  
  // Lấy thông tin user từ Firestore collection "users"
  const getUserInfoFromFirestore = async (userId) => {
    if (!userId) return null
    
    // Kiểm tra cache trước
    if (userInfoCache.has(userId)) {
      const cachedData = userInfoCache.get(userId)
      // Cache trong 5 phút
      if (Date.now() - cachedData.timestamp < 5 * 60 * 1000) {
        return cachedData.data
      }
    }
    
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const userInfo = {
          userId: userData.UserID,
          userName: userData.UserName || 'Anonymous',
          email: userData.Email || '',
          avatar: userData.Avatar || '',
          bio: userData.Bio || ''
        }
        
        // Cache kết quả
        userInfoCache.set(userId, {
          data: userInfo,
          timestamp: Date.now()
        })
        
        return userInfo
      }
      
      return null
    } catch (error) {
      console.error('Error getting user info from Firestore:', error)
      return null
    }
  }
  
  // Lấy thông tin user hoàn chỉnh (ưu tiên Firestore, fallback Auth)
  const getCompleteUserInfo = async (firebaseUser) => {
    if (!firebaseUser) return null
    
    isLoading.value = true
    
    try {
      // 1. Thử lấy từ Firestore trước (nguồn chính thức)
      const firestoreInfo = await getUserInfoFromFirestore(firebaseUser.uid)
      
      if (firestoreInfo) {
        // Sử dụng dữ liệu từ Firestore (đã được user cập nhật)
        return {
          uid: firebaseUser.uid,
          displayName: firestoreInfo.userName,
          email: firestoreInfo.email || firebaseUser.email,
          photoURL: firestoreInfo.avatar,
          // Thêm thông tin bổ sung từ Firestore
          userName: firestoreInfo.userName,
          avatar: firestoreInfo.avatar,
          bio: firestoreInfo.bio,
          // Giữ lại một số thông tin từ Firebase Auth
          emailVerified: firebaseUser.emailVerified,
          providerData: firebaseUser.providerData
        }
      }
      
      // 2. Fallback: sử dụng Firebase Auth nếu không có trong Firestore
      const fallbackUserName = firebaseUser.displayName || 
                               firebaseUser.email?.split('@')[0] || 
                               'User'
      
      return {
        uid: firebaseUser.uid,
        displayName: fallbackUserName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        userName: fallbackUserName,
        avatar: firebaseUser.photoURL || '',
        bio: '',
        emailVerified: firebaseUser.emailVerified,
        providerData: firebaseUser.providerData
      }
      
    } catch (error) {
      console.error('Error getting complete user info:', error)
      return firebaseUser // Fallback to original Firebase user
    } finally {
      isLoading.value = false
    }
  }
  
  // Lấy thông tin user dạng object để dùng cho tạo posts, comments, messages
  const getUserInfoForContent = async (firebaseUser) => {
    const completeInfo = await getCompleteUserInfo(firebaseUser)
    if (!completeInfo) return null
    
    return {
      UserID: completeInfo.uid,
      UserName: completeInfo.userName,
      Avatar: completeInfo.avatar,
      Email: completeInfo.email
    }
  }
  
  // Clear cache cho một user cụ thể (dùng khi user cập nhật profile)
  const clearUserCache = (userId) => {
    userInfoCache.delete(userId)
  }
  
  // Clear toàn bộ cache
  const clearAllCache = () => {
    userInfoCache.clear()
  }
  
  // Batch lấy thông tin nhiều users (tối ưu cho danh sách)
  const getBatchUserInfo = async (userIds) => {
    if (!userIds || userIds.length === 0) return []
    
    const results = []
    
    for (const userId of userIds) {
      try {
        const userInfo = await getUserInfoFromFirestore(userId)
        if (userInfo) {
          results.push(userInfo)
        }
      } catch (error) {
        console.error(`Error getting info for user ${userId}:`, error)
      }
    }
    
    return results
  }
  
  return {
    isLoading,
    getUserInfoFromFirestore,
    getCompleteUserInfo,
    getUserInfoForContent,
    getBatchUserInfo,
    clearUserCache,
    clearAllCache
  }
}

// Export instance để sử dụng globally
export const userInfoHelper = useUserInfo()