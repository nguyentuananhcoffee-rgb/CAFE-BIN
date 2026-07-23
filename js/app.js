/**
 * ============================================================================
 * CHỨC NĂNG: MAIN APPLICATION ENTRY POINT (TẬP TRUNG KHỞI CHẠY ỨNG DỤNG)
 * ============================================================================
 * File này đóng vai trò điểm khởi chạy chính (Entry point) của ứng dụng HRM.
 * Thực hiện Import tất cả các Core & Feature Modules, gắn các sự kiện chính
 * và kích hoạt ứng dụng qua hàm init().
 */

import { getToken } from './core/api.js';
import { 
    topHeader, hamburgerBtn, sideDrawer, drawerOverlay, closeDrawerBtn, drawerLogoutBtn, 
    showScreen, openDrawer, closeDrawer, updateTime, openFeaturePlaceholder, 
    tabBtns 
} from './core/ui.js';
import { setupAuthListeners, checkUserStatus, logout, renderProfileScreen } from './features/auth.js';
import { setupTimekeepingListeners } from './features/timekeeping.js';
import { setupEmployeeListeners } from './features/employees.js';
import { setupBranchListeners } from './features/branches.js';
import { setupPositionListeners } from './features/positions.js';
import { setupAnnouncementListeners } from './features/announcements.js';
import { setupShiftListeners, switchAdminTab, renderShiftRegisterScreen, renderScheduleScreen } from './features/shifts.js';

// --- INITIALIZATION ---
function init() {
    setupEventListeners();
    const storedUser = localStorage.getItem('hrm_user');
    if (storedUser) {
        checkUserStatus();
    } else {
        showScreen('login-screen');
    }
    setInterval(updateTime, 1000);
}

function setupEventListeners() {
    // Core Navigation & Drawer
    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
    if (drawerLogoutBtn) drawerLogoutBtn.addEventListener('click', logout);

    const headerUserProfileBtn = document.getElementById('header-user-profile-btn');
    if (headerUserProfileBtn) {
        headerUserProfileBtn.addEventListener('click', () => {
            renderProfileScreen();
            showScreen('profile-screen');
        });
    }

    // Back to home buttons
    document.querySelectorAll('.back-to-home-btn').forEach(btn => {
        btn.addEventListener('click', () => showScreen('dashboard-screen'));
    });

    // Drawer Nav Links
    document.querySelectorAll('.drawer-nav .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.drawer-nav .nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const targetScreen = link.dataset.target;
            const featureName = link.dataset.feature;
            const tabName = link.dataset.tab;

            if (featureName) {
                openFeaturePlaceholder(featureName);
            } else if (targetScreen === 'admin-screen' && tabName) {
                showScreen('admin-screen');
                switchAdminTab(tabName);
            } else {
                showScreen(targetScreen);
            }
        });
    });

    // Quick Action Tile Clicks
    document.querySelectorAll('.action-tile').forEach(tile => {
        tile.addEventListener('click', () => {
            const action = tile.dataset.action;
            switch(action) {
                case 'clockin':
                    showScreen('dashboard-screen');
                    document.getElementById('clockin-section')?.scrollIntoView({ behavior: 'smooth' });
                    break;
                case 'shift-reg':
                    renderShiftRegisterScreen();
                    showScreen('shift-register-screen');
                    break;
                case 'schedule':
                    renderScheduleScreen();
                    showScreen('schedule-screen');
                    break;
                case 'timecard':
                    openFeaturePlaceholder('4. Bảng Công & Tạm Tính Lương', 'Thống kê tổng giờ làm tích lũy & dự tính thu nhập tháng.');
                    break;
                case 'profile':
                    renderProfileScreen();
                    showScreen('profile-screen');
                    break;
                case 'announcements':
                    showScreen('admin-screen');
                    switchAdminTab('tab-announcements');
                    break;
                case 'branches':
                    showScreen('admin-screen');
                    switchAdminTab('tab-branches');
                    break;
                case 'employees':
                    showScreen('admin-screen');
                    switchAdminTab('tab-employees');
                    break;
                case 'shift-arrange':
                    showScreen('admin-screen');
                    switchAdminTab('tab-shift-arrange');
                    break;
                default:
                    openFeaturePlaceholder('Phân Hệ HRM');
            }
        });
    });

    // Admin Tab Clicks
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            if (tabId) switchAdminTab(tabId);
        });
    });

    // Feature Event Listeners Setup
    setupAuthListeners();
    setupTimekeepingListeners();
    setupEmployeeListeners();
    setupBranchListeners();
    setupPositionListeners();
    setupAnnouncementListeners();
    setupShiftListeners();
}

// Window Global Helper
window.switchAdminTab = switchAdminTab;

// Start Application
init();
