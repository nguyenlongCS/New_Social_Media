/*
src/main.js - Refactored
Entry point của ứng dụng Vue với proper initialization
*/
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// Import Chart.js một lần
import Chart from 'chart.js/auto'

const app = createApp(App)

// Gắn Chart vào globalProperties để component nào cũng dùng được
app.config.globalProperties.$Chart = Chart

app.use(router)
app.mount('#app')
