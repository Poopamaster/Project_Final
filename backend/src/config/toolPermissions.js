// backend/config/toolPermissions.js

const ALL_TOOLS_CONFIG = {
    // Tools เดิม
    search_movie: { name: "search_movie", description: "ค้นหาหนัง" },
    get_movie_detail: { name: "get_movie_detail", description: "ดูรายละเอียดหนัง" },
    
    // --- เพิ่ม Tools สำหรับการจองตั๋ว (New!) ---
    get_branches: { name: "get_branches", description: "ดึงรายชื่อสาขา" },
    // ✨ 1. เพิ่ม Tool เลือกวันที่เข้าไปตรงนี้
    get_available_dates: { name: "get_available_dates", description: "ดึงวันที่ที่มีรอบฉาย" }, 
    get_showtimes: { name: "get_showtimes", description: "ดึงรอบฉาย" },
    select_seat: { name: "select_seat", description: "เลือกที่นั่ง" },
    confirm_booking: { name: "confirm_booking", description: "ยืนยันการจองและชำระเงิน" },
    issue_ticket: { name: "issue_ticket", description: "ออกตั๋วภาพยนตร์" },

    // Tools สำหรับ Admin
    add_movie: { name: "add_movie", description: "เพิ่มหนังใหม่" },
    bulk_add_movies: { name: "bulk_add_movies", description: "นำเข้าหนังหลายเรื่องพร้อมกัน" }, 
    delete_movie: { name: "delete_movie", description: "ลบหนัง" },
    count_total_movies: { name: "count_total_movies", description: "นับจำนวนหนัง" }
};

const ROLE_PERMISSIONS = {
    // ✨ 2. เพิ่มสิทธิ์ให้ User ทั่วไปสามารถเรียกใช้การเลือกวันที่ได้
    user: [
        'search_movie', 
        'get_movie_detail', 
        'get_branches', 
        'get_available_dates', // ✅ เพิ่มตัวนี้!
        'get_showtimes', 
        'select_seat', 
        'confirm_booking',
        'issue_ticket'
    ], 
    // ✨ 3. เพิ่มสิทธิ์ให้ Admin ด้วยเช่นกัน
    admin: [
        'search_movie', 
        'get_movie_detail', 
        'get_branches', 
        'get_available_dates', // ✅ เพิ่มตัวนี้!
        'get_showtimes', 
        'select_seat', 
        'confirm_booking', 
        'issue_ticket',
        'add_movie', 
        'bulk_add_movies',
        'delete_movie', 
        'count_total_movies'
    ] 
};

exports.getToolsForUser = (userRole) => {
    const role = ROLE_PERMISSIONS[userRole] ? userRole : 'user';
    const allowedToolNames = ROLE_PERMISSIONS[role];
    return allowedToolNames;
};