/*
src/composables/useUsers.js - User Firestore Sync
Đồng bộ dữ liệu người dùng từ Firebase Auth -> Firestore collection "users"
Database: social-media-web-database
*/
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/firebase/config'

export function useUsers() {
  
  // Lấy thông tin provider từ Firebase Auth User
  const getProviderFromFirebaseUser = (firebaseUser) => {
    if (firebaseUser.providerData?.length > 0) {
      const providerId = firebaseUser.providerData[0].providerId
      if (providerId === 'google.com') return 'google'
      if (providerId === 'facebook.com') return 'facebook'
    }
    return 'email'
  }

  // Tạo username từ email hoặc displayName
  const generateUsername = (firebaseUser) => {
    if (firebaseUser.displayName) {
      return firebaseUser.displayName
    }
    if (firebaseUser.email) {
      return firebaseUser.email.split('@')[0]
    }
    return 'User'
  }

  // Đồng bộ user từ Firebase Auth -> Firestore
  const syncUserToFirestore = async (firebaseUser) => {
    if (!firebaseUser) {
      return null
    }

    try {
      const userRef = doc(db, 'users', firebaseUser.uid)
      const userDoc = await getDoc(userRef)
      
      const now = serverTimestamp()
      const provider = getProviderFromFirebaseUser(firebaseUser)
      
      if (!userDoc.exists()) {
        // Tạo user mới khi đăng ký lần đầu
        const newUser = {
          UserID: firebaseUser.uid,
          UserName: generateUsername(firebaseUser),
          Email: firebaseUser.email || '',
          Avatar: firebaseUser.photoURL || '',
          Bio: '',
          Gender: '',
          Provider: provider,
          Role: 'user',
          Created: now,
          SignedIn: now,
          UpdateAt: now
        }
        
        await setDoc(userRef, newUser)
        
        // Return data với timestamp converted
        return {
          ...newUser,
          Created: new Date(),
          SignedIn: new Date(),
          UpdateAt: new Date()
        }
      } else {
        // Cập nhật SignedIn cho user đã tồn tại
        const existingData = userDoc.data()
        
        // Chỉ cập nhật SignedIn và UpdateAt
        await updateDoc(userRef, {
          SignedIn: now,
          UpdateAt: now
        })
        
        return {
          ...existingData,
          SignedIn: new Date(),
          UpdateAt: new Date()
        }
      }
    } catch (error) {
      console.error('Error syncing user to Firestore:', error)
      throw new Error('Không thể đồng bộ dữ liệu người dùng!')
    }
  }

  // Lấy thông tin user từ Firestore theo UserID
  const getUserById = async (userId) => {
    if (!userId) {
      return null
    }

    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        return userDoc.data()
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return null
    }
  }

  // Cập nhật thông tin user trong Firestore
  const updateUserProfile = async (userId, updates) => {
    if (!userId) {
      throw new Error('UserID is required')
    }

    try {
      const userRef = doc(db, 'users', userId)
      
      // Thêm UpdateAt timestamp
      const updateData = {
        ...updates,
        UpdateAt: serverTimestamp()
      }
      
      await updateDoc(userRef, updateData)
      return true
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw new Error('Không thể cập nhật thông tin người dùng!')
    }
  }

  // Kiểm tra user đã tồn tại chưa
  const checkUserExists = async (userId) => {
    if (!userId) {
      return false
    }

    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      return userDoc.exists()
    } catch (error) {
      console.error('Error checking user exists:', error)
      return false
    }
  }

  return {
    syncUserToFirestore,
    getUserById,
    updateUserProfile,
    checkUserExists
  }
}