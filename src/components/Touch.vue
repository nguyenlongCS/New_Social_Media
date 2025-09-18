<!--
src/components/Touch.vue - Assistive Touch Component với Functional Actions
Component hiển thị nút hỗ trợ nhanh trên màn hình với khả năng bật/tắt từ Settings
Thực hiện các chức năng: Home navigation, Logout, Language toggle, Theme toggle, Music placeholder
Tích hợp với router, auth system, language manager và theme manager
-->
<template>
    <div v-if="isEnabled && show" class="assistive-touch" :class="{ 'is-dragging': drag }" ref="box">
        <div class="touch-button" ref="btn"></div>
        <div class="menu">
            <div v-for="(item, i) in acts" :key="item.name" class="menu-item" :title="item.name" :style="posStyle(i)"
                @click="click(item.name)">
                <img :src="item.icon" :alt="item.name" width="20" height="20">
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import languageManager from '@/utils/languageManager'
import themeManager from '@/utils/themeManager'

import musicIcon from '@/assets/icons/music.png'
import logoutIcon from '@/assets/icons/logout.png'
import languageIcon from '@/assets/icons/language.png'
import themeIcon from '@/assets/icons/theme.png'
import homeIcon from '@/assets/icons/home.png'

const acts = [
    { name: 'Home', icon: homeIcon },
    { name: 'Logout', icon: logoutIcon },
    { name: 'Language', icon: languageIcon },
    { name: 'Theme', icon: themeIcon },
    { name: 'Music', icon: musicIcon }
]

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()
const box = ref(), btn = ref(), drag = ref(false)
const show = computed(() => route.path != '/login')

// Kiểm tra trạng thái từ localStorage (mặc định là false/tắt)
const isEnabled = ref(localStorage.getItem('show_assistive_touch') === 'true')

// Xử lý click cho các action buttons
const click = async (actionName) => {
    try {
        switch (actionName) {
            case 'Home':
                // Nếu đang ở /home thì refresh, không thì navigate
                if (route.path === '/home') {
                    window.location.reload()
                } else {
                    await router.push('/home')
                }
                break
                
            case 'Logout':
                // Thực hiện logout giống như trong Header
                await logout()
                await router.push('/login')
                break
                
            case 'Language':
                // Toggle giữa vi và en
                const currentLang = languageManager.getCurrentLanguage()
                const newLang = currentLang === 'vi' ? 'en' : 'vi'
                languageManager.setLanguage(newLang)
                break
                
            case 'Theme':
                // Toggle giữa light và dark theme
                themeManager.toggleTheme()
                break
                
            case 'Music':
                // Giữ nguyên thông báo placeholder
                alert('MUSIC: Coming Soon!')
                break
                
            default:
                alert(actionName.toUpperCase() + ": Coming Soon!")
        }
    } catch (error) {
        console.error('Touch action error:', error)
        alert('Có lỗi xảy ra. Vui lòng thử lại!')
    }
}

// Lắng nghe sự kiện từ Settings để cập nhật trạng thái
const handleSettingsToggle = (event) => {
    isEnabled.value = event.detail.enabled
}

// tính style vị trí theo hình ngũ giác đều
const radius = 70
const posStyle = i => {
    const angle = (i * 2 * Math.PI) / acts.length - Math.PI / 2 // quay nút đầu lên trên
    const x = radius * Math.cos(angle) + 65 // 65 là tâm menu
    const y = radius * Math.sin(angle) + 65
    return { left: x + 'px', top: y + 'px' }
}

let x, y
const start = e => {
    // Kiểm tra box.value tồn tại trước khi sử dụng
    if (!box.value) return
    
    x = e.clientX || e.touches[0].clientX
    y = e.clientY || e.touches[0].clientY
    drag.value = true
    document.addEventListener('mousemove', move)
    document.addEventListener('touchmove', move, { passive: false })
    document.addEventListener('mouseup', end)
    document.addEventListener('touchend', end)
}

const move = e => {
    // Kiểm tra box.value tồn tại trước khi sử dụng
    if (!box.value) return
    
    e.preventDefault()
    let nx = (e.clientX || e.touches[0].clientX) - x + box.value.offsetLeft
    let ny = (e.clientY || e.touches[0].clientY) - y + box.value.offsetTop
    nx = Math.max(0, Math.min(nx, innerWidth - box.value.offsetWidth))
    ny = Math.max(0, Math.min(ny, innerHeight - box.value.offsetHeight))
    Object.assign(box.value.style, { left: nx + 'px', top: ny + 'px', right: 'auto', bottom: 'auto' })
    x = e.clientX || e.touches[0].clientX
    y = e.clientY || e.touches[0].clientY
}
const end = () => {
    drag.value = false
    document.removeEventListener('mousemove', move)
    document.removeEventListener('touchmove', move)
    document.removeEventListener('mouseup', end)
    document.removeEventListener('touchend', end)
}

onMounted(async () => { 
    // Đợi DOM render xong trước khi add event listeners
    await nextTick()
    
    // Kiểm tra btn.value tồn tại trước khi add event listeners
    if (btn.value) {
        btn.value.addEventListener('mousedown', start)
        btn.value.addEventListener('touchstart', start)
    }
    
    // Lắng nghe sự kiện từ Settings
    window.addEventListener('assistive-touch-toggle', handleSettingsToggle)
})

onUnmounted(() => {
    end()
    // Cleanup event listener từ button nếu tồn tại
    if (btn.value) {
        btn.value.removeEventListener('mousedown', start)
        btn.value.removeEventListener('touchstart', start)
    }
    // Cleanup event listener từ window
    window.removeEventListener('assistive-touch-toggle', handleSettingsToggle)
})
</script>

<style scoped>
.assistive-touch {
    position: fixed;
    bottom: 70px;
    left: 100px;
    width: 60px;
    height: 60px;
    z-index: 1000
}

.touch-button {
    width: 60px;
    height: 60px;
    background: rgba(0, 0, 0, .6);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, .3);
    position: relative;
    z-index: 1;
    transition: .3s
}

.assistive-touch:hover .touch-button {
    transform: scale(1.1)
}

.touch-button::before {
    content: '';
    width: 30px;
    height: 30px;
    background: #fff;
    border-radius: 50%
}

.menu {
    position: absolute;
    display: none;
    width: 180px;
    height: 180px;
    top: -60px;
    left: -60px
}

.assistive-touch:hover .menu {
    display: block
}

.assistive-touch.is-dragging:hover .menu {
    display: none
}

.menu-item {
    position: absolute;
    width: 50px;
    height: 50px;
    background: rgba(0, 0, 0, .3);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: .3s
}

.menu-item:hover {
    background: #fff;
    transform: scale(1.2)
}
</style>