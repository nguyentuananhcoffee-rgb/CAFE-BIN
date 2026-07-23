/**
 * ============================================================================
 * CHỨC NĂNG: QUẢN LÝ CHẤM CÔNG & NHÂN VIÊN REALTIME (TIMEKEEPING FEATURE - FIREBASE)
 * ============================================================================
 * Module này chứa logic xử lý Vào ca (Clock In), Tan ca (Clock Out)
 * và hiển thị danh sách nhân viên đang trong ca làm việc trực tiếp qua Firebase.
 */

import { 
    db, 
    storage, 
    collection, 
    doc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    query, 
    where, 
    ref, 
    uploadString, 
    getDownloadURL 
} from '../core/firebase.js';
import { state, getCurrentUser } from '../core/state.js';
import { checkUserStatus } from './auth.js';

// DOM Timekeeping Elements
const currentStatus = document.getElementById('current-status');
const currentStatusPill = document.getElementById('current-status-pill');
const clockinTime = document.getElementById('clockin-time');
const btnClockIn = document.getElementById('btn-clock-in');
const btnClockOut = document.getElementById('btn-clock-out');
const homeWorkingList = document.getElementById('home-working-list');
const workingEmployeesList = document.getElementById('working-employees-list');

// Camera / Location Variables
let videoStream = null;
let currentLatitude = null;
let currentLongitude = null;
let capturedPhotoData = null;
let liveOverlayTimer = null;

function updateLiveOverlay() {
    const timeElem = document.getElementById('live-overlay-time');
    const gpsElem = document.getElementById('live-overlay-gps');
    if (timeElem) {
        timeElem.textContent = new Date().toLocaleString('vi-VN');
    }
    if (gpsElem) {
        if (currentLatitude && currentLongitude) {
            gpsElem.textContent = `📍 GPS: ${currentLatitude.toFixed(5)}, ${currentLongitude.toFixed(5)}`;
            gpsElem.style.color = '#34d399';
        } else {
            gpsElem.textContent = '📍 GPS: Đang xác định vị trí...';
            gpsElem.style.color = 'var(--accent-gold)';
        }
    }
}

export function setupTimekeepingListeners() {
    if (btnClockIn) {
        btnClockIn.addEventListener('click', async () => {
            openClockInModal();
        });
    }

    if (btnClockOut) {
        btnClockOut.addEventListener('click', async () => {
            if (!confirm("Bạn có chắc chắn muốn bấm TAN CA?")) return;
            const currentUser = getCurrentUser();
            if (!currentUser) return;

            btnClockOut.disabled = true;
            try {
                const todayStr = getLocalDateString();
                const q = query(
                    collection(db, "timekeeping"),
                    where("user_id", "==", currentUser.id),
                    where("date", "==", todayStr)
                );
                const querySnap = await getDocs(q);
                let recordToUpdate = null;
                querySnap.forEach(docSnap => {
                    const data = docSnap.data();
                    if (!data.clock_out) {
                        recordToUpdate = docSnap.id;
                    }
                });

                if (recordToUpdate) {
                    await updateDoc(doc(db, "timekeeping", recordToUpdate), {
                        clock_out: new Date().toISOString()
                    });
                    alert("✅ Ghi nhận TAN CA thành công!");
                } else {
                    alert("Không tìm thấy ca làm việc đang mở.");
                }
                checkUserStatus();
            } catch (error) {
                console.error("Lỗi Tan Ca Firebase:", error);
                alert("❌ " + error.message);
                btnClockOut.disabled = false;
            }
        });
    }

    // Modal buttons
    document.getElementById('btn-clockin-capture')?.addEventListener('click', capturePhoto);
    document.getElementById('btn-clockin-recapture')?.addEventListener('click', startCamera);
    document.getElementById('btn-clockin-confirm')?.addEventListener('click', confirmClockIn);
    document.getElementById('clockin-file-input')?.addEventListener('change', handleFileInputCapture);
}

// Modal open/close functions
export async function openClockInModal() {
    const modal = document.getElementById('clock-in-modal');
    if (!modal) return;

    // 1. Populate shift selection from fetched shifts
    const select = document.getElementById('clockin-shift-select');
    if (select) {
        select.innerHTML = '';
        if (state.todayShifts && state.todayShifts.length > 0) {
            state.todayShifts.forEach(shift => {
                const opt = document.createElement('option');
                opt.value = shift.shift_id;
                opt.textContent = `${shift.name} (${shift.start_time} - ${shift.end_time})`;
                select.appendChild(opt);
            });
        } else {
            select.innerHTML = '<option value="">Không có ca làm việc hôm nay</option>';
        }
    }

    // Reset GPS & Photo State
    currentLatitude = null;
    currentLongitude = null;
    capturedPhotoData = null;
    document.getElementById('btn-clockin-confirm').disabled = true;
    
    const gpsStatus = document.getElementById('clockin-gps-status');
    if (gpsStatus) {
        gpsStatus.textContent = 'Đang lấy vị trí GPS...';
        gpsStatus.style.color = 'var(--accent-gold)';
    }

    // Start Live Overlay Timer
    if (liveOverlayTimer) clearInterval(liveOverlayTimer);
    liveOverlayTimer = setInterval(updateLiveOverlay, 1000);
    updateLiveOverlay();

    // 2. Fetch Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLatitude = position.coords.latitude;
                currentLongitude = position.coords.longitude;
                updateLiveOverlay();
                if (gpsStatus) {
                    gpsStatus.textContent = `📍 Tọa độ: ${currentLatitude.toFixed(5)}, ${currentLongitude.toFixed(5)}`;
                    gpsStatus.style.color = '#34d399';
                }
            },
            (error) => {
                console.warn("GPS error:", error);
                if (gpsStatus) {
                    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                        gpsStatus.textContent = '🔒 Đổi sang HTTPS trên điện thoại để mở GPS & Live Camera';
                        gpsStatus.style.color = '#fbbf24';
                    } else {
                        gpsStatus.textContent = '⚠️ Hãy bật định vị GPS & cho phép quyền vị trí trên điện thoại.';
                        gpsStatus.style.color = '#f87171';
                    }
                }
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    } else {
        if (gpsStatus) {
            gpsStatus.textContent = '⚠️ Trình duyệt không hỗ trợ định vị GPS.';
            gpsStatus.style.color = '#f87171';
        }
    }

    // 3. Open Camera Feed
    startCamera();

    // 4. Show Modal
    modal.classList.remove('hidden');
}

export function closeClockInModal() {
    stopCamera();
    if (liveOverlayTimer) {
        clearInterval(liveOverlayTimer);
        liveOverlayTimer = null;
    }
    document.getElementById('clock-in-modal')?.classList.add('hidden');
}

function startCamera() {
    capturedPhotoData = null;
    document.getElementById('btn-clockin-confirm').disabled = true;

    const video = document.getElementById('clockin-video');
    const preview = document.getElementById('clockin-preview');
    const overlay = document.getElementById('clockin-video-overlay');

    if (video) video.style.display = 'block';
    if (preview) preview.style.display = 'none';
    if (overlay) overlay.style.display = 'block';

    document.getElementById('btn-clockin-capture')?.classList.remove('hidden');
    document.getElementById('btn-clockin-recapture')?.classList.add('hidden');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 480 } } })
            .then(stream => {
                videoStream = stream;
                if (video) {
                    video.srcObject = stream;
                    video.play().catch(e => console.log("video play err", e));
                }
            })
            .catch(err => {
                console.warn("Camera live stream blocked (HTTP Mobile context):", err);
                if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                    const gpsStatus = document.getElementById('clockin-gps-status');
                    if (gpsStatus) {
                        gpsStatus.textContent = '🔒 Đổi sang địa chỉ HTTPS để xem live stream camera trực tiếp!';
                        gpsStatus.style.color = '#fbbf24';
                    }
                }
            });
    } else {
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            const gpsStatus = document.getElementById('clockin-gps-status');
            if (gpsStatus) {
                gpsStatus.textContent = '🔒 Trình duyệt khóa live camera trên HTTP. Vui lòng mở trang web dạng HTTPS';
                gpsStatus.style.color = '#fbbf24';
            }
        }
    }
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
}

function capturePhoto() {
    const video = document.getElementById('clockin-video');
    const fileInput = document.getElementById('clockin-file-input');

    if (videoStream && video && video.srcObject) {
        const canvas = document.getElementById('clockin-canvas');
        const preview = document.getElementById('clockin-preview');
        if (!canvas || !preview) return;

        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || video.clientWidth || 640;
        canvas.height = video.videoHeight || video.clientHeight || 480;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const barHeight = Math.max(70, Math.floor(canvas.height * 0.12));
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

        ctx.fillStyle = '#ffffff';
        const fontSize = Math.max(15, Math.floor(barHeight * 0.28));
        ctx.font = `bold ${fontSize}px Arial`;
        const timestampStr = new Date().toLocaleString('vi-VN');
        const gpsStr = (currentLatitude && currentLongitude) 
            ? `GPS: ${currentLatitude.toFixed(5)}, ${currentLongitude.toFixed(5)}` 
            : 'GPS: Tự động ghi nhận mạng';

        ctx.fillText(`Thời gian: ${timestampStr}`, 15, canvas.height - (barHeight * 0.55));
        ctx.fillText(gpsStr, 15, canvas.height - (barHeight * 0.2));

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        capturedPhotoData = dataUrl;

        preview.src = dataUrl;
        preview.style.display = 'block';
        video.style.display = 'none';
        const overlay = document.getElementById('clockin-video-overlay');
        if (overlay) overlay.style.display = 'none';

        stopCamera();

        document.getElementById('btn-clockin-capture')?.classList.add('hidden');
        document.getElementById('btn-clockin-recapture')?.classList.remove('hidden');
        document.getElementById('btn-clockin-confirm').disabled = false;
    } else {
        if (fileInput) fileInput.click();
    }
}

function handleFileInputCapture(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById('clockin-canvas');
            const preview = document.getElementById('clockin-preview');
            const video = document.getElementById('clockin-video');
            const overlay = document.getElementById('clockin-video-overlay');

            if (!canvas || !preview) return;

            const ctx = canvas.getContext('2d');
            canvas.width = img.width || 640;
            canvas.height = img.height || 480;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const barHeight = Math.max(70, Math.floor(canvas.height * 0.12));
            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
            ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

            ctx.fillStyle = '#ffffff';
            const fontSize = Math.max(16, Math.floor(barHeight * 0.28));
            ctx.font = `bold ${fontSize}px Arial`;
            const timestampStr = new Date().toLocaleString('vi-VN');
            const gpsStr = (currentLatitude && currentLongitude) 
                ? `GPS: ${currentLatitude.toFixed(5)}, ${currentLongitude.toFixed(5)}` 
                : 'GPS: Tự động ghi nhận mạng';

            ctx.fillText(`Thời gian: ${timestampStr}`, 15, canvas.height - (barHeight * 0.55));
            ctx.fillText(gpsStr, 15, canvas.height - (barHeight * 0.2));

            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            capturedPhotoData = dataUrl;

            preview.src = dataUrl;
            preview.style.display = 'block';
            if (video) video.style.display = 'none';
            if (overlay) overlay.style.display = 'none';

            document.getElementById('btn-clockin-capture')?.classList.add('hidden');
            document.getElementById('btn-clockin-recapture')?.classList.remove('hidden');
            document.getElementById('btn-clockin-confirm').disabled = false;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

async function confirmClockIn() {
    const shiftSelect = document.getElementById('clockin-shift-select');
    const shift_id = shiftSelect ? shiftSelect.value : null;

    if (!shift_id) {
        alert("Vui lòng chọn ca làm việc hôm nay.");
        return;
    }
    if (!capturedPhotoData) {
        alert("Vui lòng chụp ảnh chân dung trước.");
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const btnConfirm = document.getElementById('btn-clockin-confirm');
    btnConfirm.disabled = true;

    try {
        let photoUrl = '';
        try {
            // Tải ảnh chân dung đính kèm Watermark lên Firebase Storage
            const imageRef = ref(storage, `timekeeping/${currentUser.id}_${Date.now()}.jpg`);
            await uploadString(imageRef, capturedPhotoData, 'data_url');
            photoUrl = await getDownloadURL(imageRef);
        } catch (stErr) {
            console.warn("Firebase Storage upload skipped/fallback:", stErr);
            photoUrl = capturedPhotoData;
        }

        const todayStr = getLocalDateString();
        
        await addDoc(collection(db, "timekeeping"), {
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_code: currentUser.user_code,
            branch_id: currentUser.branch_id,
            shift_id: shift_id,
            clock_in: new Date().toISOString(),
            clock_out: null,
            date: todayStr,
            latitude: currentLatitude,
            longitude: currentLongitude,
            photo_url: photoUrl,
            device_info: navigator.userAgent
        });

        alert("✅ Ghi nhận VÀO CA thành công!");
        closeClockInModal();
        checkUserStatus();
    } catch (error) {
        console.error("Lỗi Clock In Firebase:", error);
        alert("❌ " + error.message);
        btnConfirm.disabled = false;
    }
}

export async function updateClockStatusUI() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const todayStr = getLocalDateString();

    try {
        const shiftsSnap = await getDocs(collection(db, "shifts"));
        const allShifts = shiftsSnap.docs.map(d => ({ shift_id: d.id, ...d.data() }));

        const schedSnap = await getDocs(query(
            collection(db, "work_schedules"),
            where("date", "==", todayStr)
        ));
        
        let userScheds = [];
        schedSnap.forEach(d => {
            const val = d.data();
            if (val.user_id === currentUser.id) {
                const matchShift = allShifts.find(s => s.shift_id === val.shift_id);
                if (matchShift) userScheds.push(matchShift);
            }
        });

        if (userScheds.length === 0 && (currentUser.role === 'admin' || currentUser.role === 'manager')) {
            userScheds = allShifts.filter(s => s.branch_id === currentUser.branch_id || !s.branch_id);
        }

        state.todayShifts = userScheds;
    } catch (e) {
        console.error("Lỗi lấy ca hôm nay:", e);
        state.todayShifts = [];
    }

    try {
        const tkSnap = await getDocs(query(
            collection(db, "timekeeping"),
            where("user_id", "==", currentUser.id),
            where("date", "==", todayStr)
        ));

        let latestClock = null;
        tkSnap.forEach(d => {
            latestClock = { id: d.id, ...d.data() };
        });

        state.clockData = latestClock;

        const hasTodaySchedule = state.todayShifts.length > 0;

        if (!latestClock) {
            if (currentStatus) currentStatus.textContent = "Chưa vào ca";
            if (currentStatusPill) currentStatusPill.className = "live-status-pill";
            
            if (hasTodaySchedule) {
                if (clockinTime) clockinTime.textContent = "Bạn có ca làm việc hôm nay. Hãy ghi nhận vào ca.";
                if (btnClockIn) {
                    btnClockIn.classList.remove('hidden');
                    btnClockIn.disabled = false;
                }
            } else {
                if (clockinTime) clockinTime.textContent = "⚠️ Bạn không có lịch làm việc được xếp trong hôm nay.";
                if (btnClockIn) {
                    btnClockIn.classList.remove('hidden');
                    btnClockIn.disabled = true;
                }
            }
            if (btnClockOut) btnClockOut.classList.add('hidden');
        } else if (latestClock && !latestClock.clock_out) {
            if (currentStatus) currentStatus.textContent = "Đang làm việc";
            if (currentStatusPill) currentStatusPill.className = "live-status-pill active";
            const clockInTimeObj = new Date(latestClock.clock_in);
            if (clockinTime) clockinTime.textContent = `⏱️ Vào ca lúc: ${clockInTimeObj.toLocaleTimeString('vi-VN')}`;
            if (btnClockIn) btnClockIn.classList.add('hidden');
            if (btnClockOut) {
                btnClockOut.classList.remove('hidden');
                btnClockOut.disabled = false;
            }
        } else {
            if (currentStatus) currentStatus.textContent = "Đã tan ca";
            if (currentStatusPill) currentStatusPill.className = "live-status-pill";
            const clockOutTimeObj = new Date(latestClock.clock_out);
            if (clockinTime) clockinTime.textContent = `🚪 Tan ca lúc: ${clockOutTimeObj.toLocaleTimeString('vi-VN')}`;
            if (btnClockIn) {
                btnClockIn.classList.remove('hidden');
                btnClockIn.disabled = true;
            }
            if (btnClockOut) btnClockOut.classList.add('hidden');
        }
    } catch (e) {
        console.error("Lỗi đọc trạng thái chấm công:", e);
    }
}

export async function loadRealtimeStaff() {
    try {
        const todayStr = getLocalDateString();
        const tkSnap = await getDocs(query(
            collection(db, "timekeeping"),
            where("date", "==", todayStr)
        ));

        const activeStaff = [];
        tkSnap.forEach(d => {
            const val = d.data();
            if (!val.clock_out) {
                activeStaff.push(val);
            }
        });

        const listContainer = homeWorkingList || workingEmployeesList;
        if (!listContainer) return;
        listContainer.innerHTML = '';

        if (activeStaff.length === 0) {
            listContainer.innerHTML = '<li class="employee-card" style="justify-content: center; color: var(--text-muted);">Hiện chưa có ai trong ca làm việc.</li>';
        } else {
            activeStaff.forEach(emp => {
                const time = new Date(emp.clock_in).toLocaleTimeString('vi-VN');
                const li = document.createElement('li');
                li.className = 'employee-card';
                li.innerHTML = `
                    <div>
                        <div class="emp-name">🟢 ${emp.user_name || emp.name}</div>
                        <div class="emp-code">Mã NV: ${emp.user_code}</div>
                    </div>
                    <div class="time-badge">⏱️ Vào ca: ${time}</div>
                `;
                listContainer.appendChild(li);
            });
        }
    } catch (error) {
        console.error(error);
    }
}

function getLocalDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Window Bindings for HTML Inline Callbacks
window.openClockInModal = openClockInModal;
window.closeClockInModal = closeClockInModal;
