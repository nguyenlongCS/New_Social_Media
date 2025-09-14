/*
src/firebase/config.js - Refactored
Cấu hình Firebase với database: social-media-web-database và Storage bucket
Sửa RTDB để sử dụng database social-media-web-rtdb
*/

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getDatabase } from 'firebase/database'

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAr4nGRhlqXyoHG7dZtqcbj-IN2Xcr0LqM",
  authDomain: "fir-auth-cozy.firebaseapp.com",
  projectId: "fir-auth-cozy",
  storageBucket: "fir-auth-cozy.firebasestorage.app",
  messagingSenderId: "306302302026",
  appId: "1:306302302026:web:63ffe859d4cbbeda6073b3",
  measurementId: "G-SSWWQ42BLN",
  databaseURL: "https://social-media-web-rtdb-default-rtdb.asia-southeast1.firebasedatabase.app"
}

// Khởi tạo Firebase App
const app = initializeApp(firebaseConfig)

// Khởi tạo các services
export const auth = getAuth(app)

// Khởi tạo Firestore với database cụ thể: social-media-web-database
export const db = getFirestore(app, 'social-media-web-database')

// Khởi tạo Storage với bucket tùy chỉnh cho social-media-web
export const storage = getStorage(app, 'gs://social-media-web-storage')

// Khởi tạo Realtime Database với database cụ thể: social-media-web-rtdb
export const rtdb = getDatabase(app, 'https://social-media-web-rtdb.firebaseio.com')

export default app