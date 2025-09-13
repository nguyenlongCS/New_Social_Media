/*
src/composables/useProfile.js - Composable quản lý profile với data sync integration
Logic xử lý thông tin cá nhân, upload avatar, đồng bộ với tất cả collections
*/
import { ref } from 'vue'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/firebase/config'
import { useDataSync } from './useDataSync'

export function useProfile() {
  const profileData = ref({
    UserID: '',
    UserName: '',
    Email: '',
    Avatar: '',
    Bio: '',
    Gender: '',
    Provider: '',
    Role: '',
    Created: null,
    SignedIn: null,
    UpdateAt: null
  })
  
  const originalProfileData = ref({})
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isUploading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const avatarPreview = ref('')
  const selectedAvatarFile = ref(null)
  
  // Sử dụng useDataSync để đồng bộ dữ liệu
  const { 
    syncUserProfile, 
    syncUserAvatar,
    isSyncing, 
    syncProgress, 
    syncStatus, 
    syncError 
  } = useDataSync()
  
  // Load thông tin user từ Firestore
  const loadUserProfile = async (userId) => {
    if (!userId) {
      errorMessage.value = 'User ID không hợp lệ'
      return
    }
    
    isLoading.value = true
    errorMessage.value = ''
    
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        profileData.value = { ...userData }
        originalProfileData.value = { ...userData }
        console.log('useProfile: Loaded user profile:', userData)
      } else {
        errorMessage.value = 'Không tìm thấy thông tin người dùng'
      }
    } catch (error) {
      console.error('useProfile: Error loading user profile:', error)
      errorMessage.value = 'Lỗi khi tải thông tin người dùng'
    } finally {
      isLoading.value = false
    }
  }
  
  // Lưu thông tin profile vào Firestore và đồng bộ với các collections khác
  const saveUserProfile = async () => {
    if (!profileData.value.UserID) {
      errorMessage.value = 'Không tìm thấy thông tin đăng nhập'
      return false
    }
    
    // Validation cơ bản
    if (!profileData.value.UserName?.trim()) {
      errorMessage.value = 'Tên hiển thị không được để trống'
      return false
    }
    
    isSaving.value = true
    errorMessage.value = ''
    successMessage.value = ''
    
    try {
      const userRef = doc(db, 'users', profileData.value.UserID)
      
      // Chuẩn bị dữ liệu cập nhật
      const updateData = {
        UserName: profileData.value.UserName.trim(),
        Bio: profileData.value.Bio?.trim() || '',
        Gender: profileData.value.Gender || '',
        UpdateAt: serverTimestamp()
      }
      
      console.log('useProfile: Saving profile data:', updateData)
      
      // Cập nhật trong collection users
      await updateDoc(userRef, updateData)
      
      // Kiểm tra xem có thay đổi UserName không để đồng bộ
      const hasUserNameChanged = originalProfileData.value.UserName !== profileData.value.UserName.trim()
      
      if (hasUserNameChanged) {
        console.log('useProfile: UserName changed, syncing across collections...')
        
        try {
          // Đồng bộ UserName mới trên tất cả collections
          const syncResult = await syncUserProfile(profileData.value.UserID, {
            UserName: profileData.value.UserName.trim()
          })
          
          console.log('useProfile: Profile sync completed:', syncResult)
          
          if (syncResult.totalUpdated > 0) {
            successMessage.value = `Thông tin đã được lưu và đồng bộ trên ${syncResult.totalUpdated} bản ghi!`
          } else {
            successMessage.value = 'Thông tin đã được lưu thành công!'
          }
          
        } catch (syncError) {
          console.error('useProfile: Sync error:', syncError)
          // Profile đã lưu thành công, chỉ cảnh báo về sync
          successMessage.value = 'Thông tin đã được lưu, nhưng có lỗi khi đồng bộ dữ liệu. Một số bản ghi có thể chưa được cập nhật.'
        }
      } else {
        successMessage.value = 'Thông tin đã được lưu thành công!'
      }
      
      // Cập nhật original data để so sánh thay đổi
      originalProfileData.value = { ...profileData.value }
      
      // Tự động ẩn success message sau 3 giây
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
      
      return true
      
    } catch (error) {
      console.error('useProfile: Error saving user profile:', error)
      errorMessage.value = 'Lỗi khi lưu thông tin. Vui lòng thử lại!'
      return false
    } finally {
      isSaving.value = false
    }
  }
  
  // Chọn file avatar
  const selectAvatarFile = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      errorMessage.value = 'Vui lòng chọn file ảnh'
      return
    }
    
    // Kiểm tra kích thước file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      errorMessage.value = 'File ảnh quá lớn. Vui lòng chọn file nhỏ hơn 5MB'
      return
    }
    
    selectedAvatarFile.value = file
    
    // Tạo preview
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
    
    errorMessage.value = ''
  }
  
  // Upload avatar lên Firebase Storage và đồng bộ với tất cả collections
  const uploadAvatar = async () => {
    if (!selectedAvatarFile.value || !profileData.value.UserID) {
      errorMessage.value = 'Không có file ảnh để upload'
      return false
    }
    
    isUploading.value = true
    errorMessage.value = ''
    
    try {
      // Tạo reference đến storage
      const fileName = `${profileData.value.UserID}_${Date.now()}.${selectedAvatarFile.value.name.split('.').pop()}`
      const avatarRef = storageRef(storage, `avatar/${fileName}`)
      
      console.log('useProfile: Uploading avatar:', fileName)
      
      // Upload file
      const snapshot = await uploadBytes(avatarRef, selectedAvatarFile.value)
      
      // Lấy download URL
      const downloadURL = await getDownloadURL(snapshot.ref)
      console.log('useProfile: Avatar uploaded, URL:', downloadURL)
      
      // Xóa avatar cũ nếu có (không phải default hoặc provider avatar)
      if (profileData.value.Avatar && 
          profileData.value.Avatar.includes('firebasestorage.googleapis.com') &&
          profileData.value.Avatar.includes('avatar/')) {
        try {
          const oldAvatarRef = storageRef(storage, profileData.value.Avatar)
          await deleteObject(oldAvatarRef)
          console.log('useProfile: Old avatar deleted')
        } catch (deleteError) {
          console.warn('useProfile: Could not delete old avatar:', deleteError)
        }
      }
      
      // Cập nhật avatar trong collection users
      const userRef = doc(db, 'users', profileData.value.UserID)
      await updateDoc(userRef, {
        Avatar: downloadURL,
        UpdateAt: serverTimestamp()
      })
      
      console.log('useProfile: Avatar updated in users collection')
      
      // Đồng bộ avatar mới trên tất cả collections
      console.log('useProfile: Syncing avatar across all collections...')
      
      try {
        const syncResult = await syncUserAvatar(profileData.value.UserID, downloadURL)
        
        console.log('useProfile: Avatar sync completed:', syncResult)
        
        if (syncResult.totalUpdated > 0) {
          successMessage.value = `Avatar đã được cập nhật và đồng bộ trên ${syncResult.totalUpdated} bản ghi!`
        } else {
          successMessage.value = 'Avatar đã được cập nhật thành công!'
        }
        
      } catch (syncError) {
        console.error('useProfile: Avatar sync error:', syncError)
        // Avatar đã upload thành công, chỉ cảnh báo về sync
        successMessage.value = 'Avatar đã được cập nhật, nhưng có lỗi khi đồng bộ dữ liệu. Một số bản ghi có thể chưa được cập nhật.'
      }
      
      // Cập nhật local data
      profileData.value.Avatar = downloadURL
      originalProfileData.value.Avatar = downloadURL
      
      // Reset upload state
      selectedAvatarFile.value = null
      avatarPreview.value = ''
      
      // Tự động ẩn success message sau 3 giây
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
      
      return true
      
    } catch (error) {
      console.error('useProfile: Error uploading avatar:', error)
      errorMessage.value = 'Lỗi khi upload avatar. Vui lòng thử lại!'
      return false
    } finally {
      isUploading.value = false
    }
  }
  
  // Hủy upload avatar
  const cancelAvatarUpload = () => {
    selectedAvatarFile.value = null
    avatarPreview.value = ''
    errorMessage.value = ''
    
    // Reset file input
    const fileInput = document.getElementById('avatar-upload')
    if (fileInput) {
      fileInput.value = ''
    }
  }
  
  // Reset form về trạng thái ban đầu
  const resetProfileForm = () => {
    profileData.value = { ...originalProfileData.value }
    errorMessage.value = ''
    successMessage.value = ''
    cancelAvatarUpload()
  }
  
  // Kiểm tra có thay đổi nào chưa lưu không
  const hasUnsavedChanges = () => {
    return JSON.stringify(profileData.value) !== JSON.stringify(originalProfileData.value)
  }
  
  return {
    // Profile data
    profileData,
    originalProfileData,
    
    // States
    isLoading,
    isSaving,
    isUploading,
    errorMessage,
    successMessage,
    avatarPreview,
    selectedAvatarFile,
    
    // Sync states
    isSyncing,
    syncProgress,
    syncStatus,
    syncError,
    
    // Main functions
    loadUserProfile,
    saveUserProfile,
    uploadAvatar,
    selectAvatarFile,
    resetProfileForm,
    hasUnsavedChanges,
    cancelAvatarUpload
  }
}