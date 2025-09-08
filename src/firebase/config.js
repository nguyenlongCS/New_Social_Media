/*
src/firebase/config.js - Cấu hình Firebase Tích hợp
Kết hợp cấu hình Firebase từ Project 1 với structure từ Project 2
Logic: Khởi tạo Firebase Auth, Firestore, Storage, Realtime Database
*/

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getDatabase } from 'firebase/database'

// Cấu hình Firebase từ Project 1 (đã hoạt động)
const firebaseConfig = {
  apiKey: "AIzaSyAr4nGRhlqXyoHG7dZtqcbj-IN2Xcr0LqM",
  authDomain: "fir-auth-cozy.firebaseapp.com",
  projectId: "fir-auth-cozy",
  storageBucket: "fir-auth-cozy.firebasestorage.app",
  messagingSenderId: "306302302026",
  appId: "1:306302302026:web:63ffe859d4cbbeda6073b3",
  measurementId: "G-SSWWQ42BLN",
  databaseURL: "https://fir-auth-cozy-default-rtdb.asia-southeast1.firebasedatabase.app"
}

// Khởi tạo Firebase App
const app = initializeApp(firebaseConfig)

// Khởi tạo Firebase Authentication - Sử dụng trong useAuth
export const auth = getAuth(app)

// Khởi tạo Firestore Database - Sử dụng cho collections
export const db = getFirestore(app)

// Khởi tạo Firebase Storage - Sử dụng cho upload files
export const storage = getStorage(app)

// Khởi tạo Realtime Database - Sử dụng cho messages real-time
export const rtdb = getDatabase(app)

// Export default app để sử dụng trong composables
export default app