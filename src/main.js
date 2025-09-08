/*
src/main.js - Main File với CSS import
Entry point của ứng dụng Vue với proper initialization và CSS
Logic: Khởi tạo Vue app, import CSS, mount router
*/
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// Tạo Vue app với router
const app = createApp(App)
app.use(router)
app.mount('#app')

// Không gọi useAuth ở global level để tránh lifecycle hook warnings