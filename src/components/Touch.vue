<template>
    <div v-if="show" class="assistive-touch" :class="{ 'is-dragging': drag }" ref="box">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

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

const route = useRoute(), box = ref(), btn = ref(), drag = ref(false)
const show = computed(() => route.path != '/login')
const click = a => alert(a.toUpperCase() + ": Coming Soon!")

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
    x = e.clientX || e.touches[0].clientX
    y = e.clientY || e.touches[0].clientY
    drag.value = true
    document.addEventListener('mousemove', move)
    document.addEventListener('touchmove', move, { passive: false })
    document.addEventListener('mouseup', end)
    document.addEventListener('touchend', end)
}
const move = e => {
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
onMounted(() => { btn.value.addEventListener('mousedown', start); btn.value.addEventListener('touchstart', start) })
onUnmounted(() => end())
</script>

<style scoped>
.assistive-touch {
    position: fixed;
    bottom: 20px;
    left: 20px;
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
