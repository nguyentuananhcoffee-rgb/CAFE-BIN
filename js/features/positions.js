/**
 * ============================================================================
 * CHỨC NĂNG: QUẢN LÝ CHỨC VỤ (POSITIONS FEATURE - FIREBASE)
 * ============================================================================
 * Module này quản lý danh sách Chức vụ công việc trên Firebase Cloud Firestore.
 */

import { db, collection, getDocs, addDoc, deleteDoc, doc } from '../core/firebase.js';
import { state } from '../core/state.js';

const positionList = document.getElementById('position-list');
const empPositionSelect = document.getElementById('emp-position');

export function setupPositionListeners() {
    document.getElementById('add-position-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('pos-name').value.trim();
        const system_role = document.getElementById('pos-system-role').value;

        if (!name) return;

        try {
            await addDoc(collection(db, "positions"), { name, system_role });
            alert("✅ Thêm chức vụ mới thành công!");
            document.getElementById('pos-name').value = '';
            loadAllPositions();
        } catch (err) {
            alert("❌ " + err.message);
        }
    });
}

export async function loadAllPositions() {
    try {
        const snap = await getDocs(collection(db, "positions"));
        state.positions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderPositionList(state.positions);
        populatePositionSelects(state.positions);
    } catch (e) {
        console.error("Lỗi nạp chức vụ", e);
    }
}

function renderPositionList(list) {
    if (!positionList) return;
    positionList.innerHTML = '';

    if (!list || list.length === 0) {
        positionList.innerHTML = '<div style="color: var(--text-muted); text-align: center;">Chưa có chức vụ nào.</div>';
        return;
    }

    list.forEach(p => {
        const item = document.createElement('div');
        item.className = 'glass-card';
        item.style.marginBottom = '10px';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.innerHTML = `
            <div>
                <div style="font-weight: bold;">💼 ${p.name}</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Quyền hạn: ${p.system_role === 'manager' ? 'Quản lý' : 'Nhân viên'}</div>
            </div>
            <button class="btn-secondary btn-sm" onclick="deletePosition('${p.id}')">🗑️ Xóa</button>
        `;
        positionList.appendChild(item);
    });
}

function populatePositionSelects(list) {
    if (empPositionSelect) {
        empPositionSelect.innerHTML = '';
        list.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            empPositionSelect.appendChild(opt);
        });
    }
}

window.deletePosition = async function(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa chức vụ này?")) return;
    try {
        await deleteDoc(doc(db, "positions", id));
        alert("✅ Đã xóa chức vụ!");
        loadAllPositions();
    } catch (e) {
        alert("❌ " + e.message);
    }
};
