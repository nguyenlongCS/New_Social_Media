<!--
src/views/FriendsView.vue - Trang quản lý bạn bè sử dụng LeftSide có sẵn và FriendsMain
Sử dụng LeftSide component có sẵn, thêm FriendsMain component trung tâm để tránh tràn nội dung
-->
<template>
  <div class="friends-view">
    <Header />
    
    <div v-if="isAuthLoading" class="loading-overlay" style="top: 3.75rem; height: calc(100vh - 3.75rem);">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Đang tải...</p>
      </div>
    </div>
    
    <div v-else class="friends-container">
      <!-- Left Side - Sử dụng component có sẵn với friends list -->
      <LeftSide :friends-list="friendsList" />
      
      <!-- Main Content - Component trung tâm -->
      <FriendsMain
        :active-tab="activeTab"
        :friends-list="friendsList"
        :users-list="usersList"
        :friend-requests="friendRequests"
        :is-loading-friends="isLoadingFriends"
        :is-loading-users="isLoadingUsers"
        :is-loading-requests="isLoadingRequests"
        :is-processing="isProcessing"
        :error-message="errorMessage"
        @unfriend="handleUnfriend"
        @send-request="handleSendRequest"
        @accept-request="handleAcceptRequest"
        @reject-request="handleRejectRequest"
      />
      
      <!-- Right Panel - Section buttons -->
      <FriendsRight
        :active-tab="activeTab"
        :requests-count="friendRequests.length"
        @switch-tab="switchTab"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import Header from '../components/Header.vue'
import LeftSide from '../components/LeftSide.vue'
import FriendsMain from '../components/FriendsMain.vue'
import FriendsRight from '../components/FriendsRight.vue'
import { useAuthUser } from '../composables/useAuthUser'
import { useFriends } from '../composables/useFriends'

export default {
  name: 'FriendsView',
  components: {
    Header,
    LeftSide,
    FriendsMain,
    FriendsRight
  },
  setup() {
    const activeTab = ref('friends')
    const isProcessing = ref(false)
    
    // Auth user state
    const { user, isAuthLoading, waitForUserWithTimeout } = useAuthUser()
    
    // Friends composable
    const {
      friendsList,
      usersList,
      friendRequests,
      isLoading,
      errorMessage,
      loadFriendsList,
      loadUsersList,
      getFriendRequests,
      sendFriendRequest,
      handleAcceptRequest: acceptRequest,
      handleRejectRequest: rejectRequest,
      unfriend
    } = useFriends()
    
    // Loading states cho từng tab
    const isLoadingFriends = computed(() => isLoading.value && activeTab.value === 'friends')
    const isLoadingUsers = computed(() => isLoading.value && activeTab.value === 'suggestions')
    const isLoadingRequests = computed(() => isLoading.value && activeTab.value === 'requests')
    
    // Chuyển đổi tab và load dữ liệu tương ứng
    const switchTab = async (tab) => {
      activeTab.value = tab
      
      try {
        const currentUser = await waitForUserWithTimeout(3000)
        if (!currentUser?.uid) return
        
        // Load dữ liệu dựa trên tab được chọn
        switch (tab) {
          case 'friends':
            await loadFriendsList(currentUser.uid)
            break
          case 'suggestions':
            await loadUsersList(currentUser.uid)
            break
          case 'requests':
            await getFriendRequests(currentUser.uid)
            break
          case 'nearby':
            // Tính năng tương lai
            break
        }
      } catch (error) {
        console.error('Error switching tab:', error)
      }
    }
    
    // Gửi lời mời kết bạn
    const handleSendRequest = async (targetUser) => {
      if (isProcessing.value) return
      
      isProcessing.value = true
      
      try {
        const currentUser = await waitForUserWithTimeout(3000)
        if (!currentUser?.uid) {
          throw new Error('Vui lòng đăng nhập')
        }
        
        await sendFriendRequest(currentUser.uid, targetUser.userId)
        
        // Xóa user khỏi danh sách gợi ý
        usersList.value = usersList.value.filter(u => u.userId !== targetUser.userId)
        
        alert('Đã gửi lời mời kết bạn!')
        
      } catch (error) {
        console.error('Error sending friend request:', error)
        alert(error.message || 'Không thể gửi lời mời')
      } finally {
        isProcessing.value = false
      }
    }
    
    // Chấp nhận lời mời kết bạn
    const handleAcceptRequest = async (request) => {
      if (isProcessing.value) return
      
      isProcessing.value = true
      
      try {
        await acceptRequest(request.requestId)
        
        // Reload danh sách bạn bè sau khi chấp nhận
        const currentUser = await waitForUserWithTimeout(3000)
        if (currentUser?.uid) {
          await loadFriendsList(currentUser.uid)
        }
        
        alert('Đã chấp nhận lời mời kết bạn!')
        
      } catch (error) {
        console.error('Error accepting request:', error)
        alert(error.message || 'Không thể chấp nhận lời mời')
      } finally {
        isProcessing.value = false
      }
    }
    
    // Từ chối lời mời kết bạn
    const handleRejectRequest = async (request) => {
      if (isProcessing.value) return
      
      isProcessing.value = true
      
      try {
        await rejectRequest(request.requestId)
        alert('Đã từ chối lời mời kết bạn!')
        
      } catch (error) {
        console.error('Error rejecting request:', error)
        alert(error.message || 'Không thể từ chối lời mời')
      } finally {
        isProcessing.value = false
      }
    }
    
    // Hủy kết bạn
    const handleUnfriend = async (friend) => {
      if (isProcessing.value) return
      
      const confirm = window.confirm(`Bạn có chắc muốn hủy kết bạn với ${friend.userName}?`)
      if (!confirm) return
      
      isProcessing.value = true
      
      try {
        await unfriend(friend.friendshipId)
        alert('Đã hủy kết bạn!')
        
      } catch (error) {
        console.error('Error unfriending:', error)
        alert(error.message || 'Không thể hủy kết bạn')
      } finally {
        isProcessing.value = false
      }
    }
    
    // Load dữ liệu ban đầu khi component mount
    onMounted(async () => {
      try {
        const currentUser = await waitForUserWithTimeout(5000)
        if (currentUser?.uid) {
          // Load danh sách bạn bè trước (tab mặc định)
          await loadFriendsList(currentUser.uid)
        }
      } catch (error) {
        console.error('Error on mount:', error)
      }
    })
    
    return {
      activeTab,
      isProcessing,
      isAuthLoading,
      friendsList,
      usersList,
      friendRequests,
      isLoadingFriends,
      isLoadingUsers,
      isLoadingRequests,
      errorMessage,
      switchTab,
      handleSendRequest,
      handleAcceptRequest,
      handleRejectRequest,
      handleUnfriend
    }
  }
}
</script>

<style scoped>
.friends-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 3.75rem;
}

.friends-container {
  display: flex;
  width: 100%;
  min-height: calc(100vh - 3.75rem);
}
</style>