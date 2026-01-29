// backend/config/toolPermissions.js

// 1. รายชื่อ Tool ทั้งหมดที่มีในระบบ (ต้องตรงกับ name ใน adminTools.ts และ tools อื่นๆ)
const ALL_TOOLS_CONFIG = {
    // Tools สำหรับทุกคน (Public)
    search_movie: { name: "search_movie", description: "ค้นหาหนัง" },
    get_movie_detail: { name: "get_movie_detail", description: "ดูรายละเอียดหนัง" },
    
    // Tools สำหรับ Admin เท่านั้น (Private)
    add_movie: { name: "add_movie", description: "เพิ่มหนังใหม่" },
    delete_movie: { name: "delete_movie", description: "ลบหนัง" },
    count_total_movies: { name: "count_total_movies", description: "นับจำนวนหนัง" }
};

// 2. กำหนดสิทธิ์ตาม Role
const ROLE_PERMISSIONS = {
    user: ['search_movie', 'get_movie_detail'], // User เห็นแค่นี้
    admin: ['search_movie', 'get_movie_detail', 'add_movie', 'delete_movie', 'count_total_movies'] // Admin เห็นหมด
};

exports.getToolsForUser = (userRole) => {
    // ถ้า role ผิดพลาด หรือไม่มี ให้ปรับเป็น user ธรรมดาไว้ก่อน (Fail Safe)
    const role = ROLE_PERMISSIONS[userRole] ? userRole : 'user';
    
    // ดึงรายชื่อ Tools ที่อนุญาต
    const allowedToolNames = ROLE_PERMISSIONS[role];
    
    return allowedToolNames;
};