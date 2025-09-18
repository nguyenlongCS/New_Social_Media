/*
src/main.js - Entry point của ứng dụng Vue với Language Manager integration
Khởi tạo Language Manager để thực hiện global text replacement
Expose languageManager ra window để debug
*/
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// Import Chart.js một lần
import Chart from 'chart.js/auto'

// Import Language Manager để khởi tạo global text replacement
import languageManager from './utils/languageManager'

const app = createApp(App)

// Gắn Chart vào globalProperties để component nào cũng dùng được
app.config.globalProperties.$Chart = Chart

// Gắn Language Manager vào globalProperties để truy cập từ components nếu cần
app.config.globalProperties.$languageManager = languageManager

// Expose languageManager ra window để debug
window.languageManager = languageManager

app.use(router)

// Mount app và khởi tạo language translation
app.mount('#app')

// Khởi tạo translation sau khi app đã mount với nhiều passes
setTimeout(() => {
  languageManager.translatePage()
}, 100)

// Thêm translation sau router ready
setTimeout(() => {
  languageManager.translatePage()
}, 500)

setTimeout(() => {
  languageManager.translatePage()
}, 1500)