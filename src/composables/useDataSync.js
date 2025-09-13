/*
src/composables/useDataSync.js - Composable đồng bộ dữ liệu user
Đồng bộ dữ liệu user (Avatar, UserName) trên tất cả collections (posts, comments, likes) khi cập nhật profile
*/
import { ref } from 'vue'
import { 
  collection, 
  query, 
  where, 
  getDocs,
  writeBatch,
  doc
} from 'firebase/firestore'
import { db } from '@/firebase/config'

export function useDataSync() {
  const isSyncing = ref(false)
  const syncProgress = ref(0)
  const syncStatus = ref('')
  const syncError = ref('')
  
  // Danh sách các collections cần sync và fields tương ứng
  const SYNC_COLLECTIONS = [
    {
      name: 'posts',
      userIdField: 'UserID',
      fields: {
        'UserName': 'UserName',
        'Avatar': 'Avatar'
      }
    },
    {
      name: 'comments', 
      userIdField: 'UserID',
      fields: {
        'UserName': 'UserName',
        'Avatar': 'Avatar'
      }
    },
    {
      name: 'likes',
      userIdField: 'UserID', 
      fields: {
        'UserName': 'UserName',
        'Avatar': 'Avatar'
      }
    }
  ]
  
  // Đồng bộ dữ liệu user trên tất cả collections
  const syncUserDataAcrossCollections = async (userId, newUserData) => {
    if (!userId || !newUserData) {
      throw new Error('UserID và dữ liệu user không được để trống')
    }
    
    isSyncing.value = true
    syncProgress.value = 0
    syncError.value = ''
    syncStatus.value = 'Bắt đầu đồng bộ dữ liệu...'
    
    const results = {
      totalUpdated: 0,
      collections: {},
      errors: []
    }
    
    try {
      console.log('useDataSync: Starting sync for user', userId, 'with data:', newUserData)
      
      const totalCollections = SYNC_COLLECTIONS.length
      let completedCollections = 0
      
      // Đồng bộ từng collection
      for (const collectionConfig of SYNC_COLLECTIONS) {
        try {
          syncStatus.value = `Đang đồng bộ ${collectionConfig.name}...`
          console.log(`useDataSync: Syncing collection ${collectionConfig.name}`)
          
          const updated = await syncCollection(userId, newUserData, collectionConfig)
          
          results.collections[collectionConfig.name] = {
            updated,
            success: true
          }
          results.totalUpdated += updated
          
          completedCollections++
          syncProgress.value = Math.round((completedCollections / totalCollections) * 100)
          
          console.log(`useDataSync: Completed ${collectionConfig.name}, updated ${updated} documents`)
          
        } catch (error) {
          console.error(`useDataSync: Error syncing ${collectionConfig.name}:`, error)
          
          results.collections[collectionConfig.name] = {
            updated: 0,
            success: false,
            error: error.message
          }
          results.errors.push(`Lỗi đồng bộ ${collectionConfig.name}: ${error.message}`)
        }
      }
      
      syncStatus.value = `Hoàn thành! Đã cập nhật ${results.totalUpdated} bản ghi.`
      
      if (results.errors.length > 0) {
        syncError.value = results.errors.join('; ')
      }
      
      console.log('useDataSync: Sync completed:', results)
      return results
      
    } catch (error) {
      console.error('useDataSync: Global sync error:', error)
      syncError.value = `Lỗi đồng bộ: ${error.message}`
      syncStatus.value = 'Đồng bộ thất bại!'
      throw error
    } finally {
      isSyncing.value = false
      
      // Auto clear status sau 5 giây
      setTimeout(() => {
        syncStatus.value = ''
        syncError.value = ''
        syncProgress.value = 0
      }, 5000)
    }
  }
  
  // Đồng bộ một collection cụ thể
  const syncCollection = async (userId, newUserData, collectionConfig) => {
    try {
      // Query tất cả documents của user trong collection
      const q = query(
        collection(db, collectionConfig.name),
        where(collectionConfig.userIdField, '==', userId)
      )
      
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        console.log(`useDataSync: No documents found in ${collectionConfig.name} for user ${userId}`)
        return 0
      }
      
      console.log(`useDataSync: Found ${snapshot.size} documents in ${collectionConfig.name}`)
      
      // Sử dụng batch write để update nhiều documents cùng lúc (hiệu quả hơn)
      const batch = writeBatch(db)
      let updateCount = 0
      
      // Chuẩn bị dữ liệu cần update
      const updateData = {}
      for (const [firebaseField, userDataKey] of Object.entries(collectionConfig.fields)) {
        if (newUserData.hasOwnProperty(userDataKey)) {
          updateData[firebaseField] = newUserData[userDataKey]
        }
      }
      
      // Thêm UpdateAt timestamp
      updateData.UpdateAt = new Date()
      
      console.log(`useDataSync: Update data for ${collectionConfig.name}:`, updateData)
      
      // Batch update tất cả documents
      snapshot.forEach((document) => {
        const docRef = doc(db, collectionConfig.name, document.id)
        batch.update(docRef, updateData)
        updateCount++
      })
      
      // Commit batch write
      await batch.commit()
      
      console.log(`useDataSync: Successfully updated ${updateCount} documents in ${collectionConfig.name}`)
      return updateCount
      
    } catch (error) {
      console.error(`useDataSync: Error in syncCollection ${collectionConfig.name}:`, error)
      throw error
    }
  }
  
  // Đồng bộ chỉ Avatar
  const syncUserAvatar = async (userId, newAvatar) => {
    return await syncUserDataAcrossCollections(userId, { Avatar: newAvatar })
  }
  
  // Đồng bộ chỉ UserName
  const syncUserName = async (userId, newUserName) => {
    return await syncUserDataAcrossCollections(userId, { UserName: newUserName })
  }
  
  // Đồng bộ cả Avatar và UserName
  const syncUserProfile = async (userId, profile) => {
    const syncData = {}
    
    if (profile.Avatar !== undefined) {
      syncData.Avatar = profile.Avatar
    }
    
    if (profile.UserName !== undefined) {
      syncData.UserName = profile.UserName
    }
    
    if (Object.keys(syncData).length === 0) {
      throw new Error('Không có dữ liệu nào để đồng bộ')
    }
    
    return await syncUserDataAcrossCollections(userId, syncData)
  }
  
  // Kiểm tra dữ liệu không nhất quán
  const checkDataConsistency = async (userId) => {
    syncStatus.value = 'Đang kiểm tra tính nhất quán dữ liệu...'
    
    const inconsistencies = []
    
    try {
      // Lấy dữ liệu user từ collection users
      const userDoc = await getUserData(userId)
      if (!userDoc) {
        throw new Error('Không tìm thấy thông tin user')
      }
      
      const referenceData = {
        UserName: userDoc.UserName,
        Avatar: userDoc.Avatar
      }
      
      // Kiểm tra từng collection
      for (const collectionConfig of SYNC_COLLECTIONS) {
        const inconsistent = await findInconsistentDocuments(userId, referenceData, collectionConfig)
        if (inconsistent.length > 0) {
          inconsistencies.push({
            collection: collectionConfig.name,
            count: inconsistent.length,
            documents: inconsistent
          })
        }
      }
      
      syncStatus.value = inconsistencies.length > 0 
        ? `Tìm thấy ${inconsistencies.length} collection có dữ liệu không nhất quán`
        : 'Dữ liệu nhất quán trên tất cả collections'
      
      return inconsistencies
      
    } catch (error) {
      console.error('useDataSync: Error checking consistency:', error)
      syncError.value = `Lỗi kiểm tra: ${error.message}`
      throw error
    }
  }
  
  // Helper: Lấy dữ liệu user từ collection users
  const getUserData = async (userId) => {
    try {
      const { doc: getDoc } = await import('firebase/firestore')
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)
      return userSnap.exists() ? userSnap.data() : null
    } catch (error) {
      console.error('useDataSync: Error getting user data:', error)
      return null
    }
  }
  
  // Helper: Tìm documents có dữ liệu không nhất quán
  const findInconsistentDocuments = async (userId, referenceData, collectionConfig) => {
    try {
      const q = query(
        collection(db, collectionConfig.name),
        where(collectionConfig.userIdField, '==', userId)
      )
      
      const snapshot = await getDocs(q)
      const inconsistent = []
      
      snapshot.forEach((document) => {
        const data = document.data()
        let hasInconsistency = false
        const issues = []
        
        // Kiểm tra từng field
        for (const [firebaseField, userDataKey] of Object.entries(collectionConfig.fields)) {
          if (data[firebaseField] !== referenceData[userDataKey]) {
            hasInconsistency = true
            issues.push({
              field: firebaseField,
              current: data[firebaseField],
              expected: referenceData[userDataKey]
            })
          }
        }
        
        if (hasInconsistency) {
          inconsistent.push({
            id: document.id,
            issues
          })
        }
      })
      
      return inconsistent
    } catch (error) {
      console.error('useDataSync: Error finding inconsistent documents:', error)
      return []
    }
  }
  
  // Reset sync state
  const resetSyncState = () => {
    isSyncing.value = false
    syncProgress.value = 0
    syncStatus.value = ''
    syncError.value = ''
  }
  
  return {
    // State
    isSyncing,
    syncProgress,
    syncStatus,
    syncError,
    
    // Main functions
    syncUserDataAcrossCollections,
    syncUserProfile,
    syncUserAvatar,
    syncUserName,
    
    // Utility functions  
    checkDataConsistency,
    resetSyncState,
    
    // Constants
    SYNC_COLLECTIONS
  }
}