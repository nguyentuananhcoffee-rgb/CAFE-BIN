/**
 * ============================================================================
 * CHỨC NĂNG: QUẢN LÝ GIAO DIỆN & ĐIỀU HƯỚNG MÀN HÌNH CHÍNH (CORE UI MODULE)
 * ============================================================================
 * Module này khởi tạo các tham chiếu phần tử DOM chung, quản lý đóng/mở
 * Side Drawer, điều chuyển giữa các Screen (Login, Dashboard, Admin...)
 * và cập nhật đồng hồ thời gian thực ở Header.
 */

// DOM Elements
export const topHeader = document.getElementById('top-header');
export const hamburgerBtn = document.getElementById('hamburger-toggle-btn');
export const sideDrawer = document.getElementById('side-drawer');
export const drawerOverlay = document.getElementById('drawer-overlay');
export const closeDrawerBtn = document.getElementById('close-drawer-btn');
export const drawerLogoutBtn = document.getElementById('drawer-logout-btn');

// Screens
export const loginScreen = document.getElementById('login-screen');
export const dashboardScreen = document.getElementById('dashboard-screen');
export const adminScreen = document.getElementById('admin-screen');
export const profileScreen = document.getElementById('profile-screen');
export const placeholderScreen = document.getElementById('feature-placeholder-screen');
export const shiftRegisterScreen = document.getElementById('shift-register-screen');
export const scheduleScreen = document.getElementById('schedule-screen');
export const allScreens = [loginScreen, dashboardScreen, adminScreen, profileScreen, placeholderScreen, shiftRegisterScreen, scheduleScreen];

// Placeholder elements
export const placeholderIcon = document.getElementById('placeholder-icon');
export const placeholderTitle = document.getElementById('placeholder-title');
export const placeholderDesc = document.getElementById('placeholder-desc');

// Tabs
export const tabBtns = document.querySelectorAll('.tab-btn');
export const tabContents = document.querySelectorAll('.tab-content');

// Header Profile & Clock
export const headerClockDisplay = document.getElementById('header-clock-display');

export function showScreen(screenId) {
    allScreens.forEach(s => s && s.classList.add('hidden'));
    const target = document.getElementById(screenId);
    if (target) target.classList.remove('hidden');

    if (screenId === 'login-screen') {
        if (topHeader) topHeader.classList.add('hidden');
    } else {
        if (topHeader) topHeader.classList.remove('hidden');
    }

    closeDrawer();
}

export function openDrawer() {
    if (sideDrawer) sideDrawer.classList.add('open');
    if (drawerOverlay) drawerOverlay.classList.remove('hidden');
}

export function closeDrawer() {
    if (sideDrawer) sideDrawer.classList.remove('open');
    if (drawerOverlay) drawerOverlay.classList.add('hidden');
}

export function updateTime() {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('vi-VN');
    const formattedDate = now.toLocaleDateString('vi-VN');
    if (headerClockDisplay) {
        headerClockDisplay.textContent = `${formattedTime} - ${formattedDate}`;
    }
}

export function openFeaturePlaceholder(title, desc) {
    if (placeholderTitle) placeholderTitle.textContent = title;
    if (placeholderDesc) placeholderDesc.textContent = desc || 'Tính năng đang được kích hoạt và sẵn sàng tích hoạt dữ liệu offline.';
    showScreen('feature-placeholder-screen');
}
