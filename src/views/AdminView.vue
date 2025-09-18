<!--
src/views/AdminView.vue - Trang quản trị admin với dữ liệu thực tế từ Firestore
Cập nhật để sử dụng dữ liệu thực tế thay vì mock data
Kiểm tra role admin từ collection users thay vì collection admin
-->
<template>
    <div class="admin-view">
        <Header />

        <!-- Loading auth check -->
        <div v-if="isAuthLoading || isCheckingAdmin" class="loading-overlay"
            style="top: 3.75rem; height: calc(100vh - 3.75rem);">
            <div class="loading-content">
                <div class="spinner"></div>
                <p>Đang kiểm tra quyền truy cập...</p>
            </div>
        </div>

        <!-- Access denied -->
        <div v-else-if="!isAdmin" class="access-denied">
            <div class="access-denied-content">
                <div class="denied-icon">
                    <img src="@/assets/icons/admin.png" alt="Access Denied" width="64" height="64">
                </div>
                <h2>Truy cập bị từ chối</h2>
                <p>Bạn không có quyền truy cập trang quản trị</p>
                <button @click="$router.push('/home')" class="back-home-btn">
                    Quay về trang chủ
                </button>
            </div>
        </div>

        <!-- Admin panel với dữ liệu thực tế từ Firestore -->
        <div v-else class="admin-container">
            <!-- Admin Header -->
            <div class="admin-header">
                <h1 class="admin-title">Trang Quản Trị</h1>
                <p class="admin-subtitle">Dashboard và quản lý hệ thống với dữ liệu thực tế</p>
            </div>

            <!-- Tab Navigation -->
            <div class="admin-tabs">
                <button :class="['tab-btn', { active: activeTab === 'dashboard' }]" @click="switchTab('dashboard')">
                    <img src="@/assets/icons/home.png" alt="Dashboard" width="18" height="18">
                    Dashboard
                </button>
                <button :class="['tab-btn', { active: activeTab === 'users' }]" @click="switchTab('users')">
                    <img src="@/assets/icons/profile.png" alt="Users" width="18" height="18">
                    Người dùng
                </button>
                <button :class="['tab-btn', { active: activeTab === 'posts' }]" @click="switchTab('posts')">
                    <img src="@/assets/icons/news.png" alt="Posts" width="18" height="18">
                    Bài viết
                </button>
                <button :class="['tab-btn', { active: activeTab === 'comments' }]" @click="switchTab('comments')">
                    <img src="@/assets/icons/comment.png" alt="Comments" width="18" height="18">
                    Bình luận
                </button>
            </div>

            <!-- Dashboard Tab với thống kê thực tế -->
            <div v-if="activeTab === 'dashboard'" class="dashboard-tab">
                <!-- Stats Overview từ dữ liệu thực tế -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <img src="@/assets/icons/friends.png" alt="Users" width="24" height="24">
                        </div>
                        <div class="stat-content">
                            <h3 class="stat-number">{{ formatNumber(dashboardStats.totalUsers) }}</h3>
                            <p class="stat-label">Người dùng</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">
                            <img src="@/assets/icons/create_post.png" alt="Posts" width="24" height="24">
                        </div>
                        <div class="stat-content">
                            <h3 class="stat-number">{{ formatNumber(dashboardStats.totalPosts) }}</h3>
                            <p class="stat-label">Bài viết</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">
                            <img src="@/assets/icons/like.png" alt="Likes" width="24" height="24">
                        </div>
                        <div class="stat-content">
                            <h3 class="stat-number">{{ formatNumber(dashboardStats.totalLikes) }}</h3>
                            <p class="stat-label">Lượt thích</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">
                            <img src="@/assets/icons/comment.png" alt="Comments" width="24" height="24">
                        </div>
                        <div class="stat-content">
                            <h3 class="stat-number">{{ formatNumber(dashboardStats.totalComments) }}</h3>
                            <p class="stat-label">Bình luận</p>
                        </div>
                    </div>
                </div>

                <!-- Charts Grid với dữ liệu thực tế -->
                <div class="charts-grid">
                    <!-- Hoạt động 7 ngày qua từ dữ liệu thực tế -->
                    <div class="chart-container">
                        <h3 class="chart-title">Hoạt Động 7 Ngày Qua</h3>
                        <canvas ref="userGrowthChart" class="chart-canvas"></canvas>
                    </div>

                    <!-- Phân Bố Nội Dung từ posts thực tế -->
                    <div class="chart-container">
                        <h3 class="chart-title">Phân Bố Nội Dung</h3>
                        <canvas ref="postDistributionChart" class="chart-canvas"></canvas>
                    </div>

                    <!-- Tổng Quan Tương Tác từ thống kê thực tế -->
                    <div class="chart-container">
                        <h3 class="chart-title">Tổng Quan Tương Tác</h3>
                        <canvas ref="interactionChart" class="chart-canvas"></canvas>
                    </div>

                    <!-- Người Dùng Hoạt Động Nhất từ dữ liệu thực tế -->
                    <div class="chart-container">
                        <h3 class="chart-title">Người Dùng Hoạt Động Nhất</h3>
                        <canvas ref="activeUsersChart" class="chart-canvas"></canvas>
                    </div>
                </div>
            </div>

            <!-- Users Management Tab với dữ liệu thực tế -->
            <div v-if="activeTab === 'users'" class="users-tab">
                <div class="tab-header">
                    <h2>Quản lý người dùng</h2>
                    <button @click="loadAllUsers" :disabled="isLoadingUsers" class="refresh-btn">
                        <img src="@/assets/icons/setting.png" alt="Refresh" width="16" height="16">
                        Làm mới
                    </button>
                </div>

                <div v-if="isLoadingUsers" class="loading-section">
                    <div class="spinner"></div>
                    <p>Đang tải danh sách người dùng từ Firestore...</p>
                </div>

                <div v-else class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Tên</th>
                                <th>Email</th>
                                <th>Vai trò</th>
                                <th>Đăng ký</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in usersList" :key="user.docId">
                                <td class="user-name">{{ user.userName }}</td>
                                <td class="user-email">{{ user.email }}</td>
                                <td>
                                    <span class="role-badge" :class="user.role">{{ user.role }}</span>
                                </td>
                                <td class="date-cell">{{ formatTimestamp(user.created) }}</td>
                                <td>
                                    <div class="table-actions">
                                        <button v-if="user.role !== 'admin'" @click="handlePromoteUser(user)"
                                            :disabled="isDeleting" class="promote-btn" title="Promote to Admin">
                                            <img src="@/assets/icons/admin.png" alt="Promote" width="14" height="14">
                                        </button>
                                        <button @click="handleDeleteUser(user)" :disabled="isDeleting"
                                            class="delete-btn" title="Xóa người dùng">
                                            <img src="@/assets/icons/delete.png" alt="Delete" width="14" height="14">
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Posts Management Tab với dữ liệu thực tế -->
            <div v-if="activeTab === 'posts'" class="posts-tab">
                <div class="tab-header">
                    <h2>Quản lý bài viết</h2>
                    <button @click="loadAllPosts" :disabled="isLoadingPosts" class="refresh-btn">
                        <img src="@/assets/icons/setting.png" alt="Refresh" width="16" height="16">
                        Làm mới
                    </button>
                </div>

                <div v-if="isLoadingPosts" class="loading-section">
                    <div class="spinner"></div>
                    <p>Đang tải danh sách bài viết từ Firestore...</p>
                </div>

                <div v-else class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Tiêu đề</th>
                                <th>Tác giả</th>
                                <th>Likes</th>
                                <th>Comments</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="post in postsList" :key="post.docId">
                                <td class="post-title">{{ post.title }}</td>
                                <td>{{ post.author }}</td>
                                <td class="stats-cell">{{ post.likes }}</td>
                                <td class="stats-cell">{{ post.comments }}</td>
                                <td>
                                    <div class="table-actions">
                                        <button @click="handleDeletePost(post)" :disabled="isDeleting"
                                            class="delete-btn" title="Xóa bài viết">
                                            <img src="@/assets/icons/delete.png" alt="Delete" width="14" height="14">
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Comments Management Tab với dữ liệu thực tế -->
            <div v-if="activeTab === 'comments'" class="comments-tab">
                <div class="tab-header">
                    <h2>Quản lý bình luận</h2>
                    <button @click="loadAllComments" :disabled="isLoadingComments" class="refresh-btn">
                        <img src="@/assets/icons/setting.png" alt="Refresh" width="16" height="16">
                        Làm mới
                    </button>
                </div>

                <div v-if="isLoadingComments" class="loading-section">
                    <div class="spinner"></div>
                    <p>Đang tải danh sách bình luận từ Firestore...</p>
                </div>

                <div v-else class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Nội dung</th>
                                <th>Tác giả</th>
                                <th>Ngày đăng</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="comment in commentsList" :key="comment.docId">
                                <td class="comment-content">{{ comment.content }}</td>
                                <td>{{ comment.author }}</td>
                                <td class="date-cell">{{ formatTimestamp(comment.created) }}</td>
                                <td>
                                    <div class="table-actions">
                                        <button @click="handleDeleteComment(comment)" :disabled="isDeleting"
                                            class="delete-btn" title="Xóa bình luận">
                                            <img src="@/assets/icons/delete.png" alt="Delete" width="14" height="14">
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Error message -->
            <div v-if="errorMessage" class="error-message">
                {{ errorMessage }}
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, getCurrentInstance } from 'vue'
import Header from '../components/Header.vue'
import { useAuthUser } from '../composables/useAuthUser'
import { useAdmin } from '../composables/useAdmin'

export default {
  name: 'AdminView',
  components: { Header },
  setup() {
    const activeTab = ref('dashboard')

    // Chart refs cho biểu đồ với dữ liệu thực tế
    const userGrowthChart = ref(null)
    const postDistributionChart = ref(null)
    const interactionChart = ref(null)
    const activeUsersChart = ref(null)
    const chartInstances = ref([])

    // Auth user với kiểm tra role từ collection users
    const { user, isAuthLoading, waitForUserWithTimeout } = useAuthUser()

    // Admin composable với dữ liệu thực tế từ Firestore
    const {
      isAdmin,
      isCheckingAdmin,
      dashboardStats,
      chartData,
      usersList,
      postsList,
      commentsList,
      isLoadingUsers,
      isLoadingPosts,
      isLoadingComments,
      isDeleting,
      errorMessage,
      checkAdminRole,
      loadDashboardData,
      loadAllUsers,
      loadAllPosts,
      loadAllComments,
      deleteUser,
      deletePost,
      deleteComment,
      changeUserRole,
      formatNumber,
      formatTimestamp
    } = useAdmin()

    // Lấy proxy để dùng globalProperties.$Chart
    const { proxy } = getCurrentInstance()

    // Setup Charts với dữ liệu thực tế từ Firestore
    const setupCharts = async () => {
      await nextTick()

      // Hủy chart cũ
      chartInstances.value.forEach(chart => chart?.destroy())
      chartInstances.value = []

      try {
        // 1. Line Chart - Hoạt động 7 ngày qua với dữ liệu thực tế
        if (userGrowthChart.value && chartData.value.labels) {
          const ctx1 = userGrowthChart.value.getContext('2d')
          const chart1 = new proxy.$Chart(ctx1, {
            type: 'line',
            data: {
              labels: chartData.value.labels,
              datasets: [
                {
                  label: 'Bài viết',
                  data: chartData.value.postsOverTime,
                  borderColor: '#2563eb',
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  tension: 0.4,
                  fill: false
                },
                {
                  label: 'Likes',
                  data: chartData.value.likesOverTime,
                  borderColor: '#dc2626',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  tension: 0.4,
                  fill: false
                },
                {
                  label: 'Comments',
                  data: chartData.value.commentsOverTime,
                  borderColor: '#16a34a',
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  tension: 0.4,
                  fill: false
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'top' } },
              scales: { y: { beginAtZero: true } }
            }
          })
          chartInstances.value.push(chart1)
        }

        // 2. Pie Chart - Phân bố nội dung từ posts thực tế
        if (postDistributionChart.value && chartData.value.contentTypesData) {
          const ctx2 = postDistributionChart.value.getContext('2d')
          const chart2 = new proxy.$Chart(ctx2, {
            type: 'pie',
            data: {
              labels: chartData.value.contentTypesData.map(item => item.type),
              datasets: [{
                data: chartData.value.contentTypesData.map(item => item.count),
                backgroundColor: ['#2563eb', '#dc2626', '#16a34a'],
                borderWidth: 2,
                borderColor: '#ffffff'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } }
            }
          })
          chartInstances.value.push(chart2)
        }

        // 3. Bar Chart - Tổng quan tương tác từ thống kê thực tế
        if (interactionChart.value) {
          const ctx3 = interactionChart.value.getContext('2d')
          const chart3 = new proxy.$Chart(ctx3, {
            type: 'bar',
            data: {
              labels: ['Người dùng', 'Bài viết', 'Likes', 'Comments'],
              datasets: [{
                label: 'Tổng số',
                data: [
                  dashboardStats.value.totalUsers,
                  dashboardStats.value.totalPosts,
                  dashboardStats.value.totalLikes,
                  dashboardStats.value.totalComments
                ],
                backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
                borderRadius: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } }
            }
          })
          chartInstances.value.push(chart3)
        }

        // 4. Horizontal Bar Chart - Top users với dữ liệu thực tế
        if (activeUsersChart.value && chartData.value.topUsersData) {
          const ctx4 = activeUsersChart.value.getContext('2d')
          const chart4 = new proxy.$Chart(ctx4, {
            type: 'bar',
            data: {
              labels: chartData.value.topUsersData.map(user => user.userName),
              datasets: [{
                label: 'Số bài viết',
                data: chartData.value.topUsersData.map(user => user.postsCount),
                backgroundColor: '#8b5cf6',
                borderRadius: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y',
              plugins: { legend: { display: false } },
              scales: { x: { beginAtZero: true } }
            }
          })
          chartInstances.value.push(chart4)
        }
      } catch (error) {
        console.warn('Chart.js setup error:', error)
      }
    }

    // Xử lý promote user - cập nhật role trong collection users
    const handlePromoteUser = async (user) => {
      const confirmPromote = confirm(`Bạn có chắc muốn promote ${user.userName} lên Admin?`)
      if (!confirmPromote) return

      try {
        await changeUserRole(user.docId, 'admin')
        alert(`Đã promote ${user.userName} lên Admin!`)
        
        // Reload users list để cập nhật role
        await loadAllUsers()
      } catch (error) {
        console.error('Error promoting user:', error)
        alert(error.message || 'Không thể promote user')
      }
    }

    // Xử lý xóa user từ collection users
    const handleDeleteUser = async (user) => {
      const confirmDelete = confirm(`Bạn có chắc muốn xóa user ${user.userName}? Hành động này không thể hoàn tác!`)
      if (!confirmDelete) return

      try {
        await deleteUser(user.docId)
        alert(`Đã xóa user ${user.userName}!`)
      } catch (error) {
        console.error('Error deleting user:', error)
        alert(error.message || 'Không thể xóa user')
      }
    }

    // Xử lý xóa post và related data
    const handleDeletePost = async (post) => {
      const confirmDelete = confirm(`Bạn có chắc muốn xóa bài viết "${post.title}"? Hành động này không thể hoàn tác!`)
      if (!confirmDelete) return

      try {
        await deletePost(post.docId)
        alert(`Đã xóa bài viết "${post.title}"!`)
      } catch (error) {
        console.error('Error deleting post:', error)
        alert(error.message || 'Không thể xóa bài viết')
      }
    }

    // Xử lý xóa comment
    const handleDeleteComment = async (comment) => {
      const confirmDelete = confirm(`Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác!`)
      if (!confirmDelete) return

      try {
        await deleteComment(comment.docId)
        alert('Đã xóa bình luận!')
      } catch (error) {
        console.error('Error deleting comment:', error)
        alert(error.message || 'Không thể xóa bình luận')
      }
    }

    // Chuyển tab và load dữ liệu thực tế tương ứng
    const switchTab = async (tab) => {
      activeTab.value = tab
      switch (tab) {
        case 'dashboard':
          await loadDashboardData()
          await nextTick()
          setupCharts()
          break
        case 'users':
          if (usersList.value.length === 0) await loadAllUsers()
          break
        case 'posts':
          if (postsList.value.length === 0) await loadAllPosts()
          break
        case 'comments':
          if (commentsList.value.length === 0) await loadAllComments()
          break
      }
    }

    // Lifecycle - load dữ liệu thực tế khi mount
    onMounted(async () => {
      try {
        const currentUser = await waitForUserWithTimeout(5000)
        if (currentUser?.uid) {
          // Kiểm tra role admin từ collection users
          const isUserAdmin = await checkAdminRole(currentUser.uid)
          if (isUserAdmin) {
            // Load dữ liệu thực tế cho dashboard
            await loadDashboardData()
            await nextTick()
            setupCharts()
          }
        }
      } catch (error) {
        console.error('Error in AdminView mount:', error)
      }
    })

    onUnmounted(() => {
      chartInstances.value.forEach(chart => chart?.destroy())
      chartInstances.value = []
    })

    return {
      activeTab,
      userGrowthChart,
      postDistributionChart,
      interactionChart,
      activeUsersChart,
      user,
      isAuthLoading,
      isAdmin,
      isCheckingAdmin,
      dashboardStats,
      chartData,
      usersList,
      postsList,
      commentsList,
      isLoadingUsers,
      isLoadingPosts,
      isLoadingComments,
      isDeleting,
      errorMessage,
      switchTab,
      loadAllUsers,
      loadAllPosts,
      loadAllComments,
      handlePromoteUser,
      handleDeleteUser,
      handleDeletePost,
      handleDeleteComment,
      formatNumber,
      formatTimestamp
    }
  }
}
</script>

<style scoped>
/* Giữ nguyên tất cả CSS styles hiện tại - không thay đổi giao diện */
.admin-view {
    min-height: 100vh;
    background: #f5f5f5;
    padding-top: 3.75rem;
}

.access-denied {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 3.75rem);
}

.access-denied-content {
    text-align: center;
    padding: 3rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
}

.denied-icon {
    margin-bottom: 1rem;
    opacity: 0.5;
}

.access-denied-content h2 {
    color: #dc2626;
    margin-bottom: 1rem;
}

.access-denied-content p {
    color: #6b7280;
    margin-bottom: 2rem;
}

.back-home-btn {
    padding: 0.75rem 1.5rem;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background 0.2s ease;
}

.back-home-btn:hover {
    background: #1d4ed8;
}

.admin-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
}

.admin-header {
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
}

.admin-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
}

.admin-subtitle {
    color: #6b7280;
    margin: 0;
}

.admin-tabs {
    display: flex;
    background: white;
    border-radius: 0.75rem;
    padding: 0.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
    gap: 0.5rem;
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    background: transparent;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
    justify-content: center;
}

.tab-btn.active {
    background: linear-gradient(90deg, #2563eb, #7c3aed);
    color: white;
}

.tab-btn:hover:not(.active) {
    background: #f1f5f9;
    color: #374151;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
}

.stat-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-content h3 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.stat-content p {
    color: #6b7280;
    margin: 0;
    font-size: 0.875rem;
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    margin-bottom: 2rem;
}

.chart-container {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
}

.chart-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1rem 0;
    text-align: center;
}

.chart-canvas {
    width: 100% !important;
    height: 300px !important;
}

.tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.tab-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.refresh-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #f1f5f9;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
    background: #e2e8f0;
}

.refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.loading-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
}

.loading-section .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-section p {
    color: #6b7280;
    margin: 0;
}

.table-container {
    background: white;
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
}

.admin-table {
    width: 100%;
    border-collapse: collapse;
}

.admin-table th,
.admin-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
}

.admin-table th {
    background: #f8fafc;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
}

.admin-table tbody tr:hover {
    background: #f8fafc;
}

.user-name,
.post-title {
    font-weight: 500;
    color: #1e293b;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.user-email {
    color: #6b7280;
    font-size: 0.875rem;
}

.comment-content {
    max-width: 300px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4;
}

.date-cell {
    color: #6b7280;
    font-size: 0.8125rem;
    white-space: nowrap;
}

.stats-cell {
    font-weight: 600;
    color: #2563eb;
    text-align: center;
}

.role-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
}

.role-badge.admin {
    background: #fecaca;
    color: #dc2626;
}

.role-badge.user {
    background: #dbeafe;
    color: #2563eb;
}

.table-actions {
    display: flex;
    gap: 0.5rem;
}

.promote-btn,
.delete-btn {
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.promote-btn {
    background: #dcfce7;
    color: #16a34a;
}

.promote-btn:hover:not(:disabled) {
    background: #bbf7d0;
}

.delete-btn {
    background: #fecaca;
    color: #dc2626;
}

.delete-btn:hover:not(:disabled) {
    background: #fca5a5;
}

.promote-btn:disabled,
.delete-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.error-message {
    background: #fef2f2;
    color: #dc2626;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
    border: 1px solid #fecaca;
}

@media (max-width: 1200px) {
    .charts-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .admin-container {
        padding: 1rem;
    }

    .admin-tabs {
        flex-direction: column;
        gap: 0.25rem;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }

    .admin-table {
        font-size: 0.75rem;
    }

    .admin-table th,
    .admin-table td {
        padding: 0.5rem;
    }
}
</style>