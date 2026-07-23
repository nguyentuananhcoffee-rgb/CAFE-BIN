/**
 * ============================================================================
 * CHỨC NĂNG: TỰ ĐỘNG NẠP DỮ LIỆU BAN ĐẦU CHO FIREBASE (FIREBASE AUTO SEEDER)
 * ============================================================================
 * Kiểm tra xem Cloud Firestore đã có dữ liệu mẫu hay chưa.
 * Nếu chưa, tự động tạo Chi nhánh, Chức vụ, Tài khoản Admin & Nhân viên, Ca làm việc.
 */

import { 
    db, 
    collection, 
    getDocs, 
    addDoc 
} from './firebase.js';

export async function checkAndSeedFirebase() {
    try {
        const usersSnap = await getDocs(collection(db, "users"));
        if (!usersSnap.empty) {
            console.log("🔥 Firebase Firestore đã có dữ liệu.");
            return;
        }

        console.log("🌱 Firestore Database đang trống. Bắt đầu tự động tạo dữ liệu khởi tạo...");

        // 1. Tạo Chi nhánh
        const b1 = await addDoc(collection(db, "branches"), { name: "Trụ sở chính", address: "123 Nguyễn Huệ, Q.1, TP.HCM" });
        const b2 = await addDoc(collection(db, "branches"), { name: "Chi nhánh 1", address: "456 Lê Lợi, Q.1, TP.HCM" });

        // 2. Tạo Chức vụ
        const p1 = await addDoc(collection(db, "positions"), { name: "Quản lý", system_role: "manager" });
        const p2 = await addDoc(collection(db, "positions"), { name: "Thu ngân", system_role: "staff" });
        const p3 = await addDoc(collection(db, "positions"), { name: "Pha chế", system_role: "staff" });
        const p4 = await addDoc(collection(db, "positions"), { name: "Phục vụ", system_role: "staff" });

        // 3. Tạo Tài khoản Nhân viên & Admin
        await addDoc(collection(db, "users"), {
            user_code: "admin",
            name: "Quản trị viên",
            pin: "1234",
            role: "admin",
            branch_id: b1.id,
            position_id: p1.id,
            status: "active"
        });

        await addDoc(collection(db, "users"), {
            user_code: "NV01",
            name: "Nguyễn Văn A",
            pin: "1234",
            role: "nhanvien",
            branch_id: b1.id,
            position_id: p2.id,
            status: "active"
        });

        await addDoc(collection(db, "users"), {
            user_code: "Anhndt",
            name: "Đặng Thị Ngọc Anh",
            pin: "1234",
            role: "nhanvien",
            branch_id: b1.id,
            position_id: p3.id,
            status: "active"
        });

        await addDoc(collection(db, "users"), {
            user_code: "Nv02",
            name: "Trần Thị B",
            pin: "1234",
            role: "nhanvien",
            branch_id: b2.id,
            position_id: p4.id,
            status: "active"
        });

        // 4. Tạo Các Ca Làm Việc
        await addDoc(collection(db, "shifts"), { branch_id: b1.id, name: "Ca 1", start_time: "06:00", end_time: "11:30" });
        await addDoc(collection(db, "shifts"), { branch_id: b1.id, name: "Ca 2", start_time: "11:00", end_time: "17:00" });
        await addDoc(collection(db, "shifts"), { branch_id: b1.id, name: "Ca 3", start_time: "17:00", end_time: "22:00" });
        await addDoc(collection(db, "shifts"), { branch_id: b1.id, name: "Ca 4", start_time: "18:00", end_time: "23:00" });

        // 5. Thông báo mẫu
        await addDoc(collection(db, "announcements"), {
            title: "Chào mừng đến với hệ thống HRM Cafe Bin Online",
            content: "Ứng dụng chấm công online thời gian thực đã sẵn sàng sử dụng trên thiết bị di động.",
            level: "Quan trọng",
            branch_id: "all",
            created_at: new Date().toISOString()
        });

        console.log("✅ Đã khởi tạo thành công dữ liệu ban đầu cho Firebase!");
    } catch (error) {
        console.error("❌ Lỗi khởi tạo dữ liệu Firebase:", error);
    }
}
