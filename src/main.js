
// src/main.js
// File khởi tạo ứng dụng Vue

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth'
import './assets/main.css'

const app = createApp(App)

// Khởi tạo auth state trước khi mount app
const { initAuth } = useAuth()
initAuth()

app.use(router)
app.mount('#app')