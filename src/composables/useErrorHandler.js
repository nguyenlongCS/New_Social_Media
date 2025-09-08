/*
src/composables/useErrorHandler.js - Xử lý Lỗi Tích hợp
Logic từ Project 1 để xử lý error mapping và notification
Logic: Map error codes thành user-friendly messages
*/

export function useErrorHandler() {
  
  // Error code to message mapping - Logic từ Project 1
  const errorCodeMap = {
    // Auth errors
    'MISSING_FIELDS': 'Vui lòng nhập đầy đủ thông tin!',
    'PASSWORD_MISMATCH': 'Mật khẩu không khớp!',
    'WEAK_PASSWORD': 'Mật khẩu phải có ít nhất 6 ký tự!',
    'MISSING_EMAIL': 'Vui lòng nhập email!',
    'auth/user-not-found': 'Email không tồn tại!',
    'auth/wrong-password': 'Mật khẩu không đúng!',
    'auth/invalid-email': 'Email không hợp lệ!',
    'auth/email-already-in-use': 'Email đã được sử dụng!',
    'auth/weak-password': 'Mật khẩu phải có ít nhất 6 ký tự!',
    'auth/popup-closed-by-user': 'Đăng nhập bị hủy!',
    'auth/popup-blocked': 'Popup bị chặn! Vui lòng cho phép popup.',
    'auth/network-request-failed': 'Lỗi kết nối mạng. Vui lòng thử lại!',
    'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng thử lại sau!',
    'auth/account-exists-with-different-credential': 'Tài khoản đã tồn tại với phương thức đăng nhập khác!'
  }

  // Context-specific default errors - Logic từ Project 1
  const contextDefaults = {
    login: 'Đăng nhập thất bại!',
    signup: 'Đăng ký thất bại!',
    google: 'Đăng nhập Google thất bại!',
    facebook: 'Đăng nhập Facebook thất bại!',
    reset: 'Gửi email đặt lại mật khẩu thất bại!'
  }

  // Success message keys - Logic từ Project 1
  const successKeys = {
    login: 'Đăng nhập thành công!',
    signup: 'Đăng ký thành công!',
    reset: 'Email đặt lại mật khẩu đã được gửi!'
  }

  // Handle error - Logic từ Project 1
  const handleError = (error, context = 'login') => {
    const errorCode = error.code || error.message || 'defaultError'
    const message = errorCodeMap[errorCode] || contextDefaults[context] || 'Có lỗi xảy ra!'
    return message
  }

  // Show success message - Logic từ Project 1
  const showSuccess = (context = 'login') => {
    const message = successKeys[context] || 'Thành công!'
    alert(message)
  }

  // Show error alert - Logic từ Project 1
  const showError = (error, context = 'login') => {
    const message = handleError(error, context)
    alert(message)
  }

  return {
    handleError,
    showError,
    showSuccess
  }
}