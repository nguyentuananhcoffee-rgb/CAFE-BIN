/**
 * ============================================================================
 * CHỨC NĂNG: QUẢN LÝ THÔNG BÁO TỘI NỘI BỘ (ANNOUNCEMENTS FEATURE - FIREBASE)
 * ============================================================================
 * Module này quản lý gửi và hiển thị thông báo nội bộ công ty qua Firebase.
 */

import { db, collection, getDocs, addDoc, deleteDoc, doc } from '../core/firebase.js';

const announcementList = document.getElementById('announcement-list');
const adminAnnouncementsList = document.getElementById('admin-announcements-list');

export function setupAnnouncementListeners() {
    document.getElementById('add-announcement-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('ann-title').value.trim();
        const content = document.getElementById('ann-content').value.trim();
        const level = document.getElementById('ann-level').value;

        if (!title || !content) return;

        try {
            await addDoc(collection(db, "announcements"), {
                title,
                content,
                level,
                branch_id: "all",
                created_at: new Date().toISOString()
            });
            alert("✅ Đăng thông báo mới thành công!");
            document.getElementById('ann-title').value = '';
            document.getElementById('ann-content').value = '';
            loadAnnouncements();
        } catch (err) {
            alert("❌ " + err.message);
        }
    });
}

export async function loadAnnouncements() {
    try {
        const snap = await getDocs(collection(db, "announcements"));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderAnnouncements(list);
    } catch (e) {
        console.error("Lỗi nạp thông báo", e);
    }
}

function renderAnnouncements(list) {
    if (announcementList) {
        announcementList.innerHTML = '';
        if (!list || list.length === 0) {
            announcementList.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted);">Không có thông báo mới.</div>';
        } else {
            list.forEach(ann => {
                const card = document.createElement('div');
                card.className = 'glass-card announcement-card';
                card.style.marginBottom = '12px';
                card.innerHTML = `
                    <div style="font-weight: bold; font-size: 16px; color: var(--accent-gold);">📢 ${ann.title}</div>
                    <div style="font-size: 14px; margin-top: 6px; color: #fff;">${ann.content}</div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">⏱️ ${new Date(ann.created_at).toLocaleString('vi-VN')}</div>
                `;
                announcementList.appendChild(card);
            });
        }
    }

    if (adminAnnouncementsList) {
        adminAnnouncementsList.innerHTML = '';
        if (list && list.length > 0) {
            list.forEach(ann => {
                const item = document.createElement('div');
                item.className = 'glass-card';
                item.style.marginBottom = '10px';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';
                item.innerHTML = `
                    <div>
                        <div style="font-weight: bold;">${ann.title}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">${ann.content}</div>
                    </div>
                    <button class="btn-secondary btn-sm" onclick="deleteAnnouncement('${ann.id}')">🗑️ Xóa</button>
                `;
                adminAnnouncementsList.appendChild(item);
            });
        }
    }
}

window.deleteAnnouncement = async function(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa thông báo này?")) return;
    try {
        await deleteDoc(doc(db, "announcements", id));
        alert("✅ Đã xóa thông báo!");
        loadAnnouncements();
    } catch (e) {
        alert("❌ " + e.message);
    }
};
