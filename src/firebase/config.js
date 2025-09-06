// src/firebase/config.js
// Cấu hình Firebase cho dự án

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Cấu hình Firebase từ environment variables hoặc sử dụng config mặc định
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig)

// Khởi tạo Firebase Authentication
const auth = getAuth(app)

export { auth }