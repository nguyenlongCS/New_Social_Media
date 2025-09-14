/*
src/composables/useDataSync.js - Composable đồng bộ dữ liệu user - Fixed Permissions
Đồng bộ dữ liệu user (Avatar, UserName) trên tất cả collections (posts, comments, likes) khi cập nhật profile
Fixed: Xử lý lỗi permissions và bỏ qua collections không có quyền truy cập
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
      },
      skipOnError: true // Bỏ qua nếu không có quyền
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
          
          // Nếu collection có skipOnError = true và lỗi permissions, bỏ qua
          if (collectionConfig.skipOnError && 
              (error.code === 'permission-denied' || error.message?.includes('permissions'))) {
            console.warn(`useDataSync: Skipping ${collectionConfig.name} due to permissions`)
            results.collections[collectionConfig.name] = {
              updated: 0,
              success: true,
              skipped: true,
              reason: 'Không có quyền truy cập'
            }
          } else {
            results.collections[collectionConfig.name] = {
              updated: 0,
              success: false,
              error: error.message
            }
            results.errors.push(`Lỗi đồng bộ ${collectionConfig.name}: ${error.message}`)
          }
          
          completedCollections++
          syncProgress.value = Math.round((completedCollections / totalCollections) * 100)
        }
      }
      
      // Đồng bộ tin nhắn trong Realtime Database
      try {
        syncStatus.value = 'Đang đồng bộ tin nhắn...'
        await syncMessagesData(userId, newUserData)
        results.collections['messages'] = {
          updated: 'N/A',
          success: true,
          type: 'realtime-db'
        }
      } catch (error) {
        console.error('useDataSync: Error syncing messages:', error)
        results.collections['messages'] = {
          updated: 0,
          success: false,
          error: error.message
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
  
  // Đồng bộ một collection cụ thể với error handling tốt hơn
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
      
      // Commit batch write với retry logic
      try {
        await batch.commit()
      } catch (batchError) {
        // Nếu batch fail, thử update từng document riêng lẻ
        if (batchError.code === 'permission-denied') {
          throw batchError // Re-throw permission errors
        }
        
        console.warn(`useDataSync: Batch failed for ${collectionConfig.name}, trying individual updates`)
        updateCount = 0
        
        for (const document of snapshot.docs) {
          try {
            const docRef = doc(db, collectionConfig.name, document.id)
            await docRef.update(updateData)
            updateCount++
          } catch (individualError) {
            console.error(`useDataSync: Failed to update document ${document.id}:`, individualError)
          }
        }
      }
      
      console.log(`useDataSync: Successfully updated ${updateCount} documents in ${collectionConfig.name}`)
      return updateCount
      
    } catch (error) {
      console.error(`useDataSync: Error in syncCollection ${collectionConfig.name}:`, error)
      throw error
    }
  }
  
  // Đồng bộ tin nhắn trong Realtime Database
  const syncMessagesData = async (userId, newUserData) => {
    try {
      // Import trực tiếp function thay vì sử dụng composable
      const { rtdb } = await import('@/firebase/config')
      const { ref: dbRef, onValue, update } = await import('firebase/database')
      
      const messagesSyncData = {}
      if (newUserData.UserName) messagesSyncData.userName = newUserData.UserName
      if (newUserData.Avatar) messagesSyncData.avatar = newUserData.Avatar
      
      if (Object.keys(messagesSyncData).length === 0) {
        console.log('useDataSync: No messages data to sync')
        return
      }
      
      console.log('useDataSync: Syncing messages with data:', messagesSyncData)
      
      const messagesRef = dbRef(rtdb, 'messages')
      
      // Listen một lần để lấy tất cả tin nhắn của user
      onValue(messagesRef, async (snapshot) => {
        if (!snapshot.exists()) {
          console.log('useDataSync: No messages found')
          return
        }
        
        const updates = {}
        let updateCount = 0
        
        snapshot.forEach((messageSnapshot) => {
          const messageData = messageSnapshot.val()
          const messageId = messageSnapshot.key
          
          // Cập nhật tin nhắn do user này gửi (sender)
          if (messageData.senderID === userId) {
            if (messagesSyncData.userName && messageData.senderName !== messagesSyncData.userName) {
              updates[`${messageId}/senderName`] = messagesSyncData.userName
              updateCount++
            }
            if (messagesSyncData.avatar && messageData.senderAvatar !== messagesSyncData.avatar) {
              updates[`${messageId}/senderAvatar`] = messagesSyncData.avatar
              updateCount++
            }
          }
          
          // Cập nhật tin nhắn mà user này nhận (receiver)
          if (messageData.receiverID === userId) {
            if (messagesSyncData.userName && messageData.receiverName !== messagesSyncData.userName) {
              updates[`${messageId}/receiverName`] = messagesSyncData.userName
              updateCount++
            }
            if (messagesSyncData.avatar && messageData.receiverAvatar !== messagesSyncData.avatar) {
              updates[`${messageId}/receiverAvatar`] = messagesSyncData.avatar
              updateCount++
            }
          }
        })
        
        // Thực hiện bulk update nếu có thay đổi
        if (Object.keys(updates).length > 0) {
          await update(messagesRef, updates)
          console.log(`useDataSync: Updated ${updateCount} message fields for user ${userId}`)
        } else {
          console.log('useDataSync: No messages updates needed')
        }
        
      }, { onlyOnce: true })
      
    } catch (error) {
      console.error('useDataSync: Error syncing messages:', error)
      // Không throw error để không làm fail toàn bộ sync process
      console.warn('useDataSync: Continuing without messages sync')
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
    resetSyncState,
    
    // Constants
    SYNC_COLLECTIONS
  }
}