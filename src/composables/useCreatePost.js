/*
src/composables/useCreatePost.js - Composable quản lý tạo bài viết mới
Logic upload media lên Firebase Storage, tạo post trong Firestore collection "posts"
*/
import { ref, reactive } from 'vue'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/firebase/config'

export function useCreatePost() {
  // Danh sách file được chọn với preview
  const selectedFiles = ref([])

  // Dữ liệu bài viết
  const postData = reactive({
    caption: '',
    content: ''
  })

  // Trạng thái upload
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const errorMessage = ref('')
  const successMessage = ref('')

  // Thêm files vào danh sách với validation và preview
  const addFiles = async (files) => {
    errorMessage.value = ''

    // Lọc và validate files
    const validFiles = []
    for (const file of files) {
      // Kiểm tra loại file
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        errorMessage.value = 'Chỉ hỗ trợ file ảnh và video'
        continue
      }

      // Kiểm tra kích thước file (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        errorMessage.value = 'File quá lớn. Kích thước tối đa 100MB'
        continue
      }

      // Kiểm tra số lượng tối đa
      if (selectedFiles.value.length + validFiles.length >= 10) {
        errorMessage.value = 'Chỉ được chọn tối đa 10 file'
        break
      }

      validFiles.push(file)
    }

    // Tạo preview cho các file hợp lệ
    for (const file of validFiles) {
      const fileWithPreview = {
        file: file,
        type: file.type,
        size: file.size,
        name: file.name,
        preview: URL.createObjectURL(file)
      }

      selectedFiles.value.push(fileWithPreview)
    }
  }

  // Xóa file khỏi danh sách
  const removeFile = (index) => {
    if (index >= 0 && index < selectedFiles.value.length) {
      // Giải phóng object URL để tránh memory leak
      URL.revokeObjectURL(selectedFiles.value[index].preview)
      selectedFiles.value.splice(index, 1)
    }
  }

  // Upload một file lên Firebase Storage
  const uploadFile = async (fileData, userId) => {
    const file = fileData.file
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${userId}_${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`

    // Tạo storage reference
    const fileRef = storageRef(storage, `posts/${fileName}`)

    // Upload file
    const snapshot = await uploadBytes(fileRef, file)

    // Lấy download URL
    const downloadURL = await getDownloadURL(snapshot.ref)

    return {
      url: downloadURL,
      type: file.type,
      size: file.size,
      name: fileName
    }
  }

  // Upload tất cả media files
  const uploadAllMedia = async (userId) => {
    const uploadedMedia = []
    const totalFiles = selectedFiles.value.length

    for (let i = 0; i < totalFiles; i++) {
      try {
        const fileData = selectedFiles.value[i]
        const uploadedFile = await uploadFile(fileData, userId)
        uploadedMedia.push(uploadedFile)

        // Cập nhật progress
        uploadProgress.value = Math.round(((i + 1) / totalFiles) * 100)
      } catch (error) {
        console.error('Error uploading file:', error)
        throw new Error(`Lỗi upload file ${selectedFiles.value[i].name}`)
      }
    }

    return uploadedMedia
  }

  // Tạo bài viết trong Firestore
  // Tạo bài viết trong Firestore
  const createPost = async (user) => {
    if (!user || !user.uid) {
      errorMessage.value = 'Thông tin người dùng không hợp lệ'
      return false
    }

    // Validation
    if (!postData.caption.trim()) {
      errorMessage.value = 'Vui lòng nhập tiêu đề bài viết'
      return false
    }

    if (!postData.content.trim()) {
      errorMessage.value = 'Vui lòng nhập nội dung bài viết'
      return false
    }

    if (selectedFiles.value.length === 0) {
      errorMessage.value = 'Vui lòng chọn ít nhất một ảnh hoặc video'
      return false
    }

    isUploading.value = true
    uploadProgress.value = 0
    errorMessage.value = ''
    successMessage.value = ''

    try {
      // Lấy thông tin user từ Firestore collection "users"
      const userInfo = await userInfoHelper.getUserInfoForContent(user)
      if (!userInfo) {
        throw new Error('Không thể lấy thông tin người dùng từ hệ thống')
      }

      // Upload tất cả media files
      const uploadedMedia = await uploadAllMedia(user.uid)

      // Chuẩn bị dữ liệu post với thông tin từ Firestore
      const newPost = {
        UserID: userInfo.UserID,
        UserName: userInfo.UserName, // Từ Firestore, không phải email split
        Avatar: userInfo.Avatar, // Từ Firestore, không phải photoURL
        Caption: postData.caption.trim(),
        Content: postData.content.trim(),
        Created: serverTimestamp(),
        MediaUrl: uploadedMedia[0].url, // URL của media đầu tiên (để tương thích với code cũ)
        mediaCount: uploadedMedia.length,
        mediaItems: uploadedMedia, // Danh sách tất cả media
        likes: 0,
        comments: 0
      }

      // Lưu post vào Firestore collection "posts"
      const postsCollection = collection(db, 'posts')
      await addDoc(postsCollection, newPost)

      successMessage.value = 'Đăng bài viết thành công! Đang chuyển về trang chủ...'

      // Clear cache user info để refresh thông tin mới
      userInfoHelper.clearUserCache(user.uid)

      // Tự động ẩn success message và reset form
      setTimeout(() => {
        resetForm()
      }, 2000)

      return true

    } catch (error) {
      console.error('Error creating post:', error)
      errorMessage.value = error.message || 'Có lỗi xảy ra khi đăng bài viết'
      return false
    } finally {
      isUploading.value = false
      uploadProgress.value = 0
    }
  }

  // Reset form về trạng thái ban đầu
  const resetForm = () => {
    // Giải phóng tất cả object URLs
    selectedFiles.value.forEach(fileData => {
      URL.revokeObjectURL(fileData.preview)
    })

    // Reset dữ liệu
    selectedFiles.value = []
    postData.caption = ''
    postData.content = ''

    // Reset trạng thái
    isUploading.value = false
    uploadProgress.value = 0
    errorMessage.value = ''
    successMessage.value = ''
  }

  return {
    selectedFiles,
    postData,
    isUploading,
    uploadProgress,
    errorMessage,
    successMessage,
    addFiles,
    removeFile,
    createPost,
    resetForm
  }
}