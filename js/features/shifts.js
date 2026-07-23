/**
 * ============================================================================
 * CHỨC NĂNG: XẾP LỊCH LÀM VIỆC & MA TRẬN CA (SHIFTS FEATURE - FIREBASE)
 * ============================================================================
 * Module này quản lý Đăng ký ca, Xếp lịch ca làm việc cho nhân viên và hiển thị
 * Ma trận lịch làm việc qua Firebase Cloud Firestore.
 */

import { db, collection, getDocs, addDoc, deleteDoc, doc, query, where } from '../core/firebase.js';
import { getCurrentUser } from '../core/state.js';

let isShowAllSchedule = false;

export function setupShiftListeners() {
    document.getElementById('btn-toggle-view-all-schedule')?.addEventListener('click', () => {
        isShowAllSchedule = !isShowAllSchedule;
        const btn = document.getElementById('btn-toggle-view-all-schedule');
        if (btn) {
            btn.textContent = isShowAllSchedule ? '👤 Chỉ xem lịch của tôi' : '👥 Xem tất cả đồng nghiệp';
        }
        loadShiftScheduleMatrix();
    });
}

export async function loadShiftScheduleMatrix() {
    const scheduleContainer = document.getElementById('work-schedule-container');
    if (!scheduleContainer) return;

    try {
        const currentUser = getCurrentUser();
        const usersSnap = await getDocs(collection(db, "users"));
        const shiftsSnap = await getDocs(collection(db, "shifts"));
        const schedSnap = await getDocs(collection(db, "work_schedules"));

        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const shifts = shiftsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const schedules = schedSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        let displayUsers = users;
        if (!isShowAllSchedule && currentUser) {
            displayUsers = users.filter(u => u.id === currentUser.id);
        }

        renderScheduleMatrixTable(scheduleContainer, displayUsers, shifts, schedules);
    } catch (e) {
        console.error("Lỗi nạp ma trận lịch làm việc:", e);
    }
}

function renderScheduleMatrixTable(container, users, shifts, schedules) {
    const dates = getNextSevenDays();

    let html = `
        <div style="overflow-x: auto; max-width: 100%;">
        <table class="matrix-table" style="width: 100%; border-collapse: collapse; text-align: center;">
            <thead>
                <tr style="background: rgba(255,255,255,0.08);">
                    <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.1); min-width: 120px; position: sticky; left:0; background:#1e293b; z-index: 10;">Ca / Nhân viên</th>
    `;

    dates.forEach(d => {
        html += `<th style="padding: 10px; border: 1px solid rgba(255,255,255,0.1); min-width: 100px;">${d.display}</th>`;
    });

    html += `</tr></thead><tbody>`;

    users.forEach(emp => {
        html += `<tr>
            <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1); font-weight: bold; position: sticky; left:0; background:#111827; z-index: 10;">
                ${emp.name}<br><span style="font-size: 11px; color: var(--text-muted);">${emp.user_code}</span>
            </td>
        `;

        dates.forEach(d => {
            const userDayScheds = schedules.filter(s => s.user_id === emp.id && s.date === d.iso);
            let cellContent = '';
            if (userDayScheds.length > 0) {
                userDayScheds.forEach(sc => {
                    const matchShift = shifts.find(s => s.id === sc.shift_id);
                    const shiftName = matchShift ? matchShift.name : 'Ca đã xếp';
                    cellContent += `<div style="background: rgba(52, 211, 153, 0.2); color: #34d399; padding: 4px; border-radius: 4px; font-size: 12px; margin-bottom: 2px;">${shiftName}</div>`;
                });
            } else {
                cellContent = '<span style="color: rgba(255,255,255,0.2); font-size: 12px;">-</span>';
            }
            html += `<td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">${cellContent}</td>`;
        });

        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

function getNextSevenDays() {
    const result = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dayOfWeekStr = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
        result.push({
            iso: `${year}-${month}-${day}`,
            display: `${dayOfWeekStr}<br>${day}/${month}`
        });
    }
    return result;
}
