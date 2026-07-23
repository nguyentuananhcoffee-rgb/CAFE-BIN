/**
 * ============================================================================
 * CHỨC NĂNG: QUẢN LÝ KẾT NỐI API & TOKEN XÁC THỰC (CORE API MODULE)
 * ============================================================================
 * Module này cung cấp hàm fetchAPI dùng chung cho toàn bộ ứng dụng,
 * đồng thời xử lý lưu trữ và truyền Bearer JWT Token trong Header.
 */

export const API_URL = '/api';

export function getToken() {
    return localStorage.getItem('hrm_token');
}

export function setToken(token) {
    localStorage.setItem('hrm_token', token);
}

export function clearToken() {
    localStorage.removeItem('hrm_token');
    localStorage.removeItem('hrm_user');
}

export async function fetchAPI(endpoint, method = 'GET', body = null, onUnauthorized = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });
    
    const data = await res.json();
    if (!res.ok) {
        if ((res.status === 401 || res.status === 403) && endpoint !== '/auth/login') {
            if (onUnauthorized) onUnauthorized();
        }
        throw new Error(data.error || 'Lỗi kết nối API');
    }
    return data;
}
