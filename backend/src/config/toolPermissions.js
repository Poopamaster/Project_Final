// backend/config/toolPermissions.js

const ALL_TOOLS_CONFIG = {
    // Tools เดิม
    search_movie: { name: "search_movie", description: "ค้นหาหนัง" },
    get_movie_detail: { name: "get_movie_detail", description: "ดูรายละเอียดหนัง" },
    
    // --- เพิ่ม Tools สำหรับการจองตั๋ว (New!) ---
    get_branches: { name: "get_branches", description: "ดึงรายชื่อสาขา" },
    get_showtimes: { name: "get_showtimes", description: "ดึงรอบฉาย" },
    select_seat: { name: "select_seat", description: "เลือกที่นั่ง" },
    confirm_booking: { name: "confirm_booking", description: "ยืนยันการจองและชำระเงิน" },
    issue_ticket: { name: "issue_ticket", description: "ออกตั๋วภาพยนตร์" }, // ✅ เพิ่มตัวนี้!

    // Tools สำหรับ Admin
    add_movie: { name: "add_movie", description: "เพิ่มหนังใหม่" },
    bulk_add_movies: { name: "bulk_add_movies", description: "นำเข้าหนังหลายเรื่องพร้อมกัน" }, 
    delete_movie: { name: "delete_movie", description: "ลบหนัง" },
    count_total_movies: { name: "count_total_movies", description: "นับจำนวนหนัง" }
};

const ROLE_PERMISSIONS = {
    // เพิ่มสิทธิ์ให้ User ทั่วไปสามารถจองหนังได้
    user: [
        'search_movie', 
        'get_movie_detail', 
        'get_branches', 
        'get_showtimes', 
        'select_seat', 
        'confirm_booking',
        'issue_ticket' // ✅ เพิ่มตัวนี้!
    ], 
    // Admin ก็ควรจะจองได้เช่นกัน
    admin: [
        'search_movie', 
        'get_movie_detail', 
        'get_branches', 
        'get_showtimes', 
        'select_seat', 
        'confirm_booking', 
        'issue_ticket', // ✅ เพิ่มตัวนี้!
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