/**
 * ============================================================================
 * CHỨC NĂNG: QUẢN LÝ TRẠNG THÁI TOÀN CỤC (GLOBAL STATE MODULE)
 * ============================================================================
 * Module này quản lý thông tin người dùng đang đăng nhập, danh sách chi nhánh,
 * dữ liệu nhân sự, chức vụ và thông tin ca làm việc tạm thời.
 */

export const state = {
    currentUser: null,
    clockData: null,
    branchesMap: {},
    allEmployeesData: [],
    allPositionsData: []
};

export function getCurrentUser() {
    if (!state.currentUser) {
        const userStr = localStorage.getItem('hrm_user');
        if (userStr) {
            try { state.currentUser = JSON.parse(userStr); } catch (e) {}
        }
    }
    return state.currentUser;
}

export function setCurrentUser(user) {
    state.currentUser = user;
    if (user) {
        localStorage.setItem('hrm_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('hrm_user');
    }
}
