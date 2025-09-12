/*
src/composables/useLikes.js - Composable quản lý likes
Quản lý likes cho posts - collection "likes" với fields: Avatar, UserID, UserName, PostID, Created
*/
import { ref } from 'vue'
import { 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/firebase/config'

export function useLikes() {
  const isLiking = ref(false)
  
  // Kiểm tra user đã like post chưa
  const checkUserLikedPost = async (userId, postId) => {
    if (!userId || !postId) return false
    
    try {
      const likesQuery = query(
        collection(db, 'likes'),
        where('UserID', '==', userId),
        where('PostID', '==', postId)
      )
      
      const snapshot = await getDocs(likesQuery)
      return !snapshot.empty
    } catch (error) {
      console.error('Error checking user like:', error)
      return false
    }
  }
  
  // Đếm số likes của post
  const getPostLikesCount = async (postId) => {
    if (!postId) return 0
    
    try {
      const likesQuery = query(
        collection(db, 'likes'),
        where('PostID', '==', postId)
      )
      
      const snapshot = await getDocs(likesQuery)
      return snapshot.size
    } catch (error) {
      console.error('Error getting likes count:', error)
      return 0
    }
  }
  
  // Lấy danh sách người đã like post
  const getPostLikes = async (postId) => {
    if (!postId) return []
    
    try {
      const likesQuery = query(
        collection(db, 'likes'),
        where('PostID', '==', postId)
      )
      
      const snapshot = await getDocs(likesQuery)
      const likes = []
      
      snapshot.forEach((doc) => {
        likes.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return likes
    } catch (error) {
      console.error('Error getting post likes:', error)
      return []
    }
  }
  
  // Thêm like
  const addLike = async (user, postId) => {
    if (!user || !postId) {
      throw new Error('Thông tin không hợp lệ')
    }
    
    isLiking.value = true
    
    try {
      // Kiểm tra đã like chưa
      const alreadyLiked = await checkUserLikedPost(user.uid, postId)
      if (alreadyLiked) {
        throw new Error('Bạn đã like bài viết này rồi')
      }
      
      // Tạo like mới
      const likeData = {
        Avatar: user.photoURL || '',
        UserID: user.uid,
        UserName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        PostID: postId,
        Created: serverTimestamp()
      }
      
      await addDoc(collection(db, 'likes'), likeData)
      return true
      
    } catch (error) {
      console.error('Error adding like:', error)
      throw error
    } finally {
      isLiking.value = false
    }
  }
  
  // Xóa like
  const removeLike = async (userId, postId) => {
    if (!userId || !postId) {
      throw new Error('Thông tin không hợp lệ')
    }
    
    isLiking.value = true
    
    try {
      // Tìm like cần xóa
      const likesQuery = query(
        collection(db, 'likes'),
        where('UserID', '==', userId),
        where('PostID', '==', postId)
      )
      
      const snapshot = await getDocs(likesQuery)
      
      if (snapshot.empty) {
        throw new Error('Không tìm thấy like để xóa')
      }
      
      // Xóa like đầu tiên (chỉ có 1 like per user per post)
      const likeDoc = snapshot.docs[0]
      await deleteDoc(doc(db, 'likes', likeDoc.id))
      
      return true
      
    } catch (error) {
      console.error('Error removing like:', error)
      throw error
    } finally {
      isLiking.value = false
    }
  }
  
  // Toggle like (thêm/xóa like)
  const toggleLike = async (user, postId) => {
    if (!user || !postId) {
      throw new Error('Thông tin không hợp lệ')
    }
    
    try {
      const alreadyLiked = await checkUserLikedPost(user.uid, postId)
      
      if (alreadyLiked) {
        await removeLike(user.uid, postId)
        return { action: 'removed', liked: false }
      } else {
        await addLike(user, postId)
        return { action: 'added', liked: true }
      }
      
    } catch (error) {
      console.error('Error toggling like:', error)
      throw error
    }
  }
  
  return {
    isLiking,
    checkUserLikedPost,
    getPostLikesCount,
    getPostLikes,
    addLike,
    removeLike,
    toggleLike
  }
}