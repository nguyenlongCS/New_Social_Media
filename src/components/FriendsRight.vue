<!--
src/components/FriendsRightPanel.vue - Right panel với section buttons cho friends
Hiển thị các section buttons: Danh sách bạn, Gợi ý bạn bè, Lời mời kết bạn, Tìm bạn xung quanh
-->
<template>
  <aside class="friends-right-panel">
    <div class="section-buttons">
      <button 
        :class="['section-btn', { active: activeTab === 'friends' }]"
        @click="$emit('switch-tab', 'friends')"
      >
        <img src="@/assets/icons/friends.png" alt="Friends" class="section-icon">
        <span>Danh sách bạn</span>
      </button>
      
      <button 
        :class="['section-btn', { active: activeTab === 'suggestions' }]"
        @click="$emit('switch-tab', 'suggestions')"
      >
        <img src="@/assets/icons/suggest.png" alt="Suggestions" class="section-icon">
        <span>Gợi ý bạn bè</span>
      </button>
      
      <button 
        :class="['section-btn', { active: activeTab === 'requests' }]"
        @click="$emit('switch-tab', 'requests')"
      >
        <img src="@/assets/icons/notification.png" alt="Requests" class="section-icon">
        <span>Lời mời kết bạn</span>
        <span v-if="requestsCount > 0" class="notification-badge">{{ requestsCount }}</span>
      </button>
      
      <button 
        :class="['section-btn', { active: activeTab === 'nearby' }]"
        @click="$emit('switch-tab', 'nearby')"
      >
        <img src="@/assets/icons/discover.png" alt="Nearby" class="section-icon">
        <span>Tìm bạn xung quanh</span>
      </button>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'FriendsRightPanel',
  props: {
    activeTab: {
      type: String,
      required: true
    },
    requestsCount: {
      type: Number,
      default: 0
    }
  },
  emits: ['switch-tab']
}
</script>

<style scoped>
.friends-right-panel {
  width: 15vw;
  background: white;
  box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
  padding: 1rem;
  position: fixed;
  right: 0;
  top: 3.75rem;
  height: calc(100vh - 3.75rem);
}

.section-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: none;
  background: transparent;
  border-radius: 0.5rem;
  text-align: left;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
}

.section-btn:hover {
  background: #f1f5f9;
}

.section-btn.active {
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  color: white;
}

.section-icon {
  width: 18px;
  height: 18px;
  filter: brightness(0) saturate(100%) invert(27%) sepia(8%) saturate(1014%) hue-rotate(202deg) brightness(95%) contrast(87%);
}

.section-btn.active .section-icon {
  filter: brightness(0) invert(1);
}

.notification-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #dc2626;
  color: white;
  border-radius: 50%;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}
</style>