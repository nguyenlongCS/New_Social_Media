/*
src/main.js - Entry point của ứng dụng Vue với Language Manager và Theme Manager integration
Khởi tạo Language Manager để thực hiện global text replacement
Khởi tạo Theme Manager để quản lý dark/light theme toàn cục
*/
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import './assets/dark-theme.css'

// Import Chart.js một lần
import Chart from 'chart.js/auto'

// Import Language Manager để khởi tạo global text replacement
import languageManager from './utils/languageManager'

// Import Theme Manager để khởi tạo theme management
import themeManager from './utils/themeManager'

const app = createApp(App)

// Gắn Chart vào globalProperties để component nào cũng dùng được
app.config.globalProperties.$Chart = Chart

// Gắn Language Manager vào globalProperties để truy cập từ components nếu cần
app.config.globalProperties.$languageManager = languageManager

// Gắn Theme Manager vào globalProperties để truy cập từ components nếu cần
app.config.globalProperties.$themeManager = themeManager

app.use(router)

// Mount app và khởi tạo language translation & theme
app.mount('#app')

// Khởi tạo translation và theme sau khi app đã mount
setTimeout(() => {
  languageManager.translatePage()
  themeManager.initializeTheme()
}, 100)