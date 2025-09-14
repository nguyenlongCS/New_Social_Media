/*
src/composables/useComments.js - Fixed Version
Composable quản lý comments với import userInfoHelper đúng cách
Quản lý comments cho posts - collection "comments" với fields: Avatar, UserID, UserName, PostID, Created, Content
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
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/firebase/config'
// Import userInfoHelper để lấy thông tin user từ Firestore
import { userInfoHelper } from './useUserInfo'

export function useComments() {
  const isCommenting = ref(false)
  const isDeletingComment = ref(false)

  // Lấy danh sách comments của post từ Firestore
  const getPostComments = async (postId) => {
    if (!postId) {
      console.log('useComments: No postId provided')
      return []
    }

    try {
      console.log('useComments: Fetching comments for postId:', postId)

      // Tạo query lấy comments theo PostID, sắp xếp theo Created desc
      const commentsQuery = query(
        collection(db, 'comments'),
        where('PostID', '==', postId),
        orderBy('Created', 'desc')
      )

      console.log('useComments: Executing Firestore query...')
      const snapshot = await getDocs(commentsQuery)

      console.log('useComments: Query completed. Snapshot size:', snapshot.size)

      const comments = []

      snapshot.forEach((doc) => {
        const commentData = doc.data()
        console.log('useComments: Processing comment doc:', doc.id, commentData)

        const comment = {
          id: doc.id,
          user: commentData.UserName || 'Anonymous',
          text: commentData.Content || '',
          avatar: commentData.Avatar || '',
          userId: commentData.UserID || '',
          created: commentData.Created,
          postId: commentData.PostID
        }

        comments.push(comment)
      })

      console.log('useComments: Final comments array:', comments)
      return comments

    } catch (error) {
      console.error('useComments: Error getting post comments:', error)

      // Log chi tiết về lỗi
      if (error.code) {
        console.error('useComments: Firestore error code:', error.code)
        console.error('useComments: Firestore error message:', error.message)
      }

      return []
    }
  }

  // Đếm số comments của post
  const getPostCommentsCount = async (postId) => {
    if (!postId) return 0

    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('PostID', '==', postId)
      )

      const snapshot = await getDocs(commentsQuery)
      return snapshot.size
    } catch (error) {
      console.error('useComments: Error getting comments count:', error)
      return 0
    }
  }

  // Thêm comment mới với thông tin user từ Firestore
  const addComment = async (user, postId, content) => {
    if (!user || !postId || !content?.trim()) {
      throw new Error('Thông tin comment không hợp lệ')
    }

    isCommenting.value = true

    try {
      console.log('useComments: Adding comment:', { user: user.uid, postId, content })

      // Lấy thông tin user từ Firestore collection "users"
      const userInfo = await userInfoHelper.getUserInfoForContent(user)
      if (!userInfo) {
        throw new Error('Không thể lấy thông tin người dùng')
      }

      // Tạo comment mới với thông tin từ Firestore
      const commentData = {
        Avatar: userInfo.Avatar, // Từ Firestore, không phải photoURL
        UserID: userInfo.UserID,
        UserName: userInfo.UserName, // Từ Firestore, không phải displayName
        PostID: postId,
        Content: content.trim(),
        Created: serverTimestamp()
      }

      console.log('useComments: Comment data with Firestore info:', commentData)

      const docRef = await addDoc(collection(db, 'comments'), commentData)
      console.log('useComments: Comment added with ID:', docRef.id)

      // Clear cache để refresh thông tin user
      userInfoHelper.clearUserCache(user.uid)

      // Trả về comment vừa tạo với format phù hợp
      const newComment = {
        id: docRef.id,
        user: commentData.UserName,
        text: commentData.Content,
        avatar: commentData.Avatar,
        userId: commentData.UserID,
        created: new Date(),
        postId: commentData.PostID
      }

      console.log('useComments: Returning new comment:', newComment)
      return newComment

    } catch (error) {
      console.error('useComments: Error adding comment:', error)
      throw new Error('Không thể thêm bình luận')
    } finally {
      isCommenting.value = false
    }
  }

  // Xóa comment
  const deleteComment = async (commentId, userId) => {
    if (!commentId || !userId) {
      throw new Error('Thông tin không hợp lệ')
    }

    isDeletingComment.value = true

    try {
      await deleteDoc(doc(db, 'comments', commentId))
      return true

    } catch (error) {
      console.error('useComments: Error deleting comment:', error)
      throw new Error('Không thể xóa bình luận')
    } finally {
      isDeletingComment.value = false
    }
  }

  // Lấy comments của user
  const getUserComments = async (userId) => {
    if (!userId) return []

    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('UserID', '==', userId),
        orderBy('Created', 'desc')
      )

      const snapshot = await getDocs(commentsQuery)
      const comments = []

      snapshot.forEach((doc) => {
        const commentData = doc.data()
        comments.push({
          id: doc.id,
          user: commentData.UserName,
          text: commentData.Content,
          avatar: commentData.Avatar,
          userId: commentData.UserID,
          created: commentData.Created,
          postId: commentData.PostID
        })
      })

      return comments
    } catch (error) {
      console.error('useComments: Error getting user comments:', error)
      return []
    }
  }

  return {
    isCommenting,
    isDeletingComment,
    getPostComments,
    getPostCommentsCount,
    addComment,
    deleteComment,
    getUserComments
  }
}