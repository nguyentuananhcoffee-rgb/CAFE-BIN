/**
 * ============================================================================
 * CHỨC NĂNG: QUẢN LÝ DANH SÁCH NHÂN VIÊN (EMPLOYEES FEATURE - FIREBASE)
 * ============================================================================
 * Module này quản lý thêm mới, chỉnh sửa, khóa/mở khóa tài khoản nhân viên
 * trực tiếp trên Firebase Cloud Firestore.
 */

import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from '../core/firebase.js';
import { state } from '../core/state.js';

const employeeList = document.getElementById('employee-list');
const employeeSearchInput = document.getElementById('employee-search');

export function setupEmployeeListeners() {
    if (employeeSearchInput) {
        employeeSearchInput.addEventListener('input', () => {
            renderEmployeeList(filterEmployees(employeeSearchInput.value));
        });
    }

    // Modal Form Submit Event
    document.getElementById('add-employee-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user_code = document.getElementById('emp-user-code').value.trim();
        const name = document.getElementById('emp-name').value.trim();
        const pin = document.getElementById('emp-pin').value.trim() || '1234';
        const role = document.getElementById('emp-role').value;
        const branch_id = document.getElementById('emp-branch').value;
        const position_id = document.getElementById('emp-position').value;

        try {
            await addDoc(collection(db, "users"), {
                user_code,
                name,
                pin,
                role,
                branch_id,
                position_id,
                status: 'active'
            });
            alert("✅ Thêm nhân viên mới thành công!");
            closeAddEmployeeModal();
            loadAllEmployees();
        } catch (err) {
            alert("❌ Lỗi thêm nhân viên: " + err.message);
        }
    });
}

export async function loadAllEmployees() {
    try {
        const snap = await getDocs(collection(db, "users"));
        state.employees = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderEmployeeList(state.employees);
    } catch (e) {
        console.error("Lỗi nạp danh sách nhân viên", e);
    }
}

function filterEmployees(keyword) {
    if (!keyword) return state.employees;
    const kw = keyword.toLowerCase();
    return state.employees.filter(e => 
        (e.name && e.name.toLowerCase().includes(kw)) ||
        (e.user_code && e.user_code.toLowerCase().includes(kw))
    );
}

export function renderEmployeeList(list) {
    if (!employeeList) return;
    employeeList.innerHTML = '';

    if (!list || list.length === 0) {
        employeeList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">Không tìm thấy nhân viên nào.</div>';
        return;
    }

    list.forEach(emp => {
        const item = document.createElement('div');
        item.className = 'glass-card employee-card';
        item.style.marginBottom = '12px';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';

        const roleBadge = emp.role === 'admin' ? '👑 Admin' : (emp.role === 'manager' ? '⭐ Quản lý' : '👤 Nhân viên');
        const statusBadge = emp.status === 'active' 
            ? '<span style="color:#34d399; font-size:12px;">🟢 Đang hoạt động</span>' 
            : '<span style="color:#f87171; font-size:12px;">🔴 Đã khóa</span>';

        item.innerHTML = `
            <div>
                <div style="font-weight: bold; font-size: 16px;">${emp.name} <span style="font-size:12px; color:var(--text-muted);">(${emp.user_code})</span></div>
                <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Vai trò: ${roleBadge} | ${statusBadge}</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn-secondary btn-sm" onclick="toggleEmployeeStatus('${emp.id}', '${emp.status}')">
                    ${emp.status === 'active' ? '🔒 Khóa' : '🔓 Mở khóa'}
                </button>
            </div>
        `;
        employeeList.appendChild(item);
    });
}

window.toggleEmployeeStatus = async function(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    if (!confirm(`Bạn có chắc chắn muốn ${newStatus === 'active' ? 'mở khóa' : 'khóa'} tài khoản này?`)) return;
    try {
        await updateDoc(doc(db, "users", id), { status: newStatus });
        alert("✅ Cập nhật trạng thái thành công!");
        loadAllEmployees();
    } catch (e) {
        alert("❌ Lỗi: " + e.message);
    }
};

window.openAddEmployeeModal = function() {
    document.getElementById('add-employee-modal')?.classList.remove('hidden');
};

window.closeAddEmployeeModal = function() {
    document.getElementById('add-employee-modal')?.classList.add('hidden');
};
