/**
 * ============================================================================
 * CHỨC NĂNG: CẤU HÌNH & KHỞI TẠO GOOGLE FIREBASE (FIREBASE CONFIG MODULE)
 * ============================================================================
 * File này khởi tạo kết nối Google Firebase (Cloud Firestore & Storage)
 * cho toàn bộ hệ thống HRM Online trên GitHub Pages.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadString, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Thông tin cấu hình Firebase từ Google Console của bạn
const firebaseConfig = {
  apiKey: "AIzaSyCg1RIcoAN59JNuIQk2jQPzxKJ1oUMxB88",
  authDomain: "hrm-bin-coffee.firebaseapp.com",
  projectId: "hrm-bin-coffee",
  storageBucket: "hrm-bin-coffee.firebasestorage.app",
  messagingSenderId: "266940639899",
  appId: "1:266940639899:web:3fcfafde7986bcaf3d343e",
  measurementId: "G-D3M1NH0X81"
};

// Khởi tạo ứng dụng Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore Database & Firebase Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export các hàm tiện ích Firestore để các module tính năng khác sử dụng
export {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    ref,
    uploadString,
    getDownloadURL
};
