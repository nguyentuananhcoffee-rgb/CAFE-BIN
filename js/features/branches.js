/**
 * ============================================================================
 * CHỨC NĂNG: QUẢN LÝ CHI NHÁNH & CA LÀM VIỆC (BRANCHES FEATURE - FIREBASE)
 * ============================================================================
 * Module này quản lý danh sách Chi nhánh cửa hàng trên Firebase Cloud Firestore.
 */

import { db, collection, getDocs, addDoc, deleteDoc, doc } from '../core/firebase.js';
import { state } from '../core/state.js';

const branchList = document.getElementById('branch-list');
const empBranchSelect = document.getElementById('emp-branch');

export function setupBranchListeners() {
    document.getElementById('add-branch-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('branch-name').value.trim();
        const address = document.getElementById('branch-address').value.trim();

        if (!name) return;

        try {
            await addDoc(collection(db, "branches"), { name, address });
            alert("✅ Thêm chi nhánh thành công!");
            document.getElementById('branch-name').value = '';
            document.getElementById('branch-address').value = '';
            loadAllBranches();
        } catch (err) {
            alert("❌ " + err.message);
        }
    });
}

export async function loadAllBranches() {
    try {
        const snap = await getDocs(collection(db, "branches"));
        state.branches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderBranchList(state.branches);
        populateBranchSelects(state.branches);
    } catch (e) {
        console.error("Lỗi nạp chi nhánh", e);
    }
}

export async function loadBranchesForAdmin() {
    await loadAllBranches();
}

function renderBranchList(list) {
    if (!branchList) return;
    branchList.innerHTML = '';

    if (!list || list.length === 0) {
        branchList.innerHTML = '<div style="color: var(--text-muted); text-align: center;">Chưa có chi nhánh nào.</div>';
        return;
    }

    list.forEach(b => {
        const item = document.createElement('div');
        item.className = 'glass-card';
        item.style.marginBottom = '10px';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.innerHTML = `
            <div>
                <div style="font-weight: bold;">🏢 ${b.name}</div>
                <div style="font-size: 13px; color: var(--text-secondary);">📍 ${b.address || 'Chưa cập nhật địa chỉ'}</div>
            </div>
            <button class="btn-secondary btn-sm" onclick="deleteBranch('${b.id}')">🗑️ Xóa</button>
        `;
        branchList.appendChild(item);
    });
}

function populateBranchSelects(list) {
    if (empBranchSelect) {
        empBranchSelect.innerHTML = '';
        list.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = b.name;
            empBranchSelect.appendChild(opt);
        });
    }
}

window.deleteBranch = async function(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa chi nhánh này?")) return;
    try {
        await deleteDoc(doc(db, "branches", id));
        alert("✅ Đã xóa chi nhánh!");
        loadAllBranches();
    } catch (e) {
        alert("❌ " + e.message);
    }
};
