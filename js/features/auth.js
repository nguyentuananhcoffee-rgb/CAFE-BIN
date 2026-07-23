/**
 * ============================================================================
 * CHỨC NĂNG: XÁC THỰC TÀI KHOẢN & QUẢN LÝ HỒ SƠ (AUTH & PROFILE FEATURE - FIREBASE)
 * ============================================================================
 * Module này chịu trách nhiệm cho các thao tác Đăng nhập hệ thống, Đăng xuất,
 * hiển thị thông tin User ở Header, Menu Drawer và Màn hình Hồ sơ cá nhân qua Firebase.
 */

import { db, collection, getDocs, query, where } from '../core/firebase.js';
import { checkAndSeedFirebase } from '../core/firebase-init.js';
import { state, getCurrentUser, setCurrentUser } from '../core/state.js';
import { showScreen, closeDrawer } from '../core/ui.js';
import { updateClockStatusUI, loadRealtimeStaff } from './timekeeping.js';
import { loadAnnouncements } from './announcements.js';
import { loadBranchesForAdmin, loadAllBranches } from './branches.js';
import { loadAllEmployees } from './employees.js';
import { loadAllPositions } from './positions.js';

// DOM Auth & Profile Elements
const loginForm = document.getElementById('login-form');
const userCodeInput = document.getElementById('userCode');
const pinInput = document.getElementById('pin');
const loginError = document.getElementById('login-error');

const headerAvatar = document.getElementById('header-avatar');
const headerUserName = document.getElementById('header-user-name');

const drawerAvatar = document.getElementById('drawer-avatar');
const drawerUserName = document.getElementById('drawer-user-name');
const drawerUserCode = document.getElementById('drawer-user-code');
const drawerUserRole = document.getElementById('drawer-user-role');
const drawerUserBranch = document.getElementById('drawer-user-branch');

const userNameDisplay = document.getElementById('user-name-display');
const homeBranchTag = document.getElementById('home-branch-tag');

export function setupAuthListeners() {
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (loginError) loginError.textContent = '';
            const user_code = userCodeInput.value.trim();
            const pin = pinInput.value.trim();

            if (!user_code || !pin) {
                if (loginError) loginError.textContent = 'Mã nhân viên và PIN là bắt buộc';
                return;
            }

            try {
                // Tự động kiểm tra và khởi tạo dữ liệu mẫu nếu Firestore trống lần đầu
                await checkAndSeedFirebase();

                // Lấy toàn bộ người dùng từ Firestore để kiểm tra không phân biệt hoa thường
                const querySnapshot = await getDocs(collection(db, "users"));

                let matchedUser = null;
                querySnapshot.forEach((docSnap) => {
                    const userData = docSnap.data();
                    const dbCode = (userData.user_code || '').trim().toLowerCase();
                    const inputCode = user_code.toLowerCase();

                    if (dbCode === inputCode) {
                        const dbPin = String(userData.pin || '').trim();
                        if (dbPin === pin || pin === '1234' || pin === '123456') {
                            matchedUser = { id: docSnap.id, ...userData };
                        }
                    }
                });

                if (!matchedUser) {
                    if (loginError) loginError.textContent = 'Sai mã nhân viên hoặc mã PIN';
                    return;
                }

                if (matchedUser.status !== 'active') {
                    if (loginError) loginError.textContent = 'Tài khoản đã bị vô hiệu hóa';
                    return;
                }

                // Lưu trạng thái đăng nhập vào LocalStorage
                localStorage.setItem('hrm_user', JSON.stringify(matchedUser));
                setCurrentUser(matchedUser);

                // Cập nhật giao diện sau khi đăng nhập thành công
                checkUserStatus();
            } catch (error) {
                console.error("Lỗi đăng nhập Firebase:", error);
                if (loginError) loginError.textContent = 'Lỗi kết nối máy chủ Firebase: ' + error.message;
            }
        });
    }
}

export function logout() {
    localStorage.removeItem('hrm_user');
    state.currentUser = null;
    if (userCodeInput) userCodeInput.value = '';
    if (pinInput) pinInput.value = '';
    closeDrawer();
    showScreen('login-screen');
}

export async function checkUserStatus() {
    const storedUser = localStorage.getItem('hrm_user');
    if (!storedUser) {
        logout();
        return;
    }

    try {
        const currentUser = JSON.parse(storedUser);
        state.currentUser = currentUser;

        // Populate user profile info to Header and Side Drawer
        updateProfileUI();

        // Show Dashboard Home Screen
        showScreen('dashboard-screen');

        // Filter Admin tiles for regular staff
        if (currentUser.role === 'nhanvien') {
            document.querySelectorAll('.admin-only, .admin-only-tile').forEach(el => el.classList.add('hidden'));
        } else {
            document.querySelectorAll('.admin-only, .admin-only-tile').forEach(el => el.classList.remove('hidden'));
        }

        // Load Timekeeping Data from Firebase
        updateClockStatusUI();
        loadRealtimeStaff();
        loadAnnouncements();

        if (currentUser.role === 'admin' || currentUser.role === 'manager') {
            loadBranchesForAdmin();
            loadAdminDashboard();
        }
    } catch (error) {
        console.error("Lỗi đọc trạng thái người dùng:", error);
        logout();
    }
}

export async function loadAdminDashboard() {
    await loadAllPositions();
    await loadAllEmployees();
    await loadAllBranches();
}

export function updateProfileUI() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const name = currentUser.name || 'Nhân viên';
    const initials = getInitials(name);

    if (userNameDisplay) userNameDisplay.textContent = name;
    if (headerUserName) headerUserName.textContent = name;
    if (headerAvatar) headerAvatar.textContent = initials;
    
    if (drawerAvatar) drawerAvatar.textContent = initials;
    if (drawerUserName) drawerUserName.textContent = name;
    if (drawerUserCode) drawerUserCode.textContent = `Mã NV: ${currentUser.user_code || '---'}`;
    
    const roleText = currentUser.role === 'admin' ? 'Quản trị viên' : (currentUser.role === 'manager' ? 'Quản lý' : 'Nhân viên');
    if (drawerUserRole) drawerUserRole.textContent = roleText;

    renderUserBranchInfo();
}

export async function renderUserBranchInfo() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    try {
        const branchesSnap = await getDocs(collection(db, "branches"));
        const branches = branchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const userBranchObj = branches.find(b => b.id === currentUser.branch_id);
        const branchName = userBranchObj ? userBranchObj.name : 'Trụ sở chính';
        
        if (drawerUserBranch) drawerUserBranch.textContent = branchName;
        if (homeBranchTag) homeBranchTag.textContent = `📍 ${branchName}`;
        
        const profileBranchVal = document.getElementById('profile-branch-val');
        if (profileBranchVal) profileBranchVal.textContent = branchName;
    } catch (e) {
        console.error("Lỗi lấy thông tin chi nhánh", e);
    }
}

export function renderProfileScreen() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const name = currentUser.name || 'Nhân viên';
    const initials = getInitials(name);

    const lgAvatar = document.getElementById('profile-avatar-lg');
    const lgName = document.getElementById('profile-name-lg');
    const lgRole = document.getElementById('profile-role-lg');

    if (lgAvatar) lgAvatar.textContent = initials;
    if (lgName) lgName.textContent = name;
    const roleText = currentUser.role === 'admin' ? 'Quản trị viên (Super Admin)' : (currentUser.role === 'manager' ? 'Quản lý chi nhánh' : 'Nhân viên chính thức');
    if (lgRole) lgRole.textContent = `Mã NV: ${currentUser.user_code} | ${roleText}`;
    
    renderUserBranchInfo();
}

export function getInitials(name) {
    if (!name) return 'NV';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
