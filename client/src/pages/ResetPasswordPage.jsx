// ไฟล์: src/pages/ResetPasswordPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../api/userApi"; // จะสร้างในขั้นตอนถัดไป
import "../css/LoginPage.css"; 

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

// Regex สำหรับตรวจสอบความแข็งแกร่งของรหัสผ่าน (เหมือนใน RegisterPage)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/; 

const checkPasswordStrength = (pwd) => {
    if (pwd.length < 8) return { text: "ต้องมีอย่างน้อย 8 ตัวอักษร", color: "red" };
    let score = 0;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (score === 3) return { text: "แข็งแกร่งมาก", color: "green" };
    if (score === 2) return { text: "ปานกลาง", color: "orange" };
    return { text: "อ่อนแอ", color: "red" };
};

const ResetPasswordPage = () => {
    // 1. ดึง Token จาก URL
    const { token } = useParams(); 
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [alertConfig, setAlertConfig] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const strengthStatus = password ? checkPasswordStrength(password) : null;
    
    // ฟังก์ชันตรวจสอบความแข็งแกร่ง (คัดลอกจาก RegisterPage มาใช้)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAlertConfig({ type: '', message: '' });

        // 1. ตรวจสอบ Confirm Password Match
        if (password !== confirmPassword) {
            setAlertConfig({ type: 'error', message: 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน' });
            setLoading(false);
            return;
        }

        // 2. ตรวจสอบความแข็งแกร่ง
        if (!passwordRegex.test(password)) {
            setAlertConfig({ 
                type: 'error', 
                message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยพิมพ์เล็ก, พิมพ์ใหญ่, และตัวเลข' 
            });
            setLoading(false);
            return;
        }

        try {
            // 3. ยิง API ไป Backend พร้อม Token และรหัสผ่านใหม่
            const data = await resetPassword(token, password);
            
            setAlertConfig({ type: 'success', message: data.message || 'รีเซ็ตรหัสผ่านสำเร็จ! กำลังพาไปหน้า Login...' });
            
            setTimeout(() => {
                navigate("/login");
            }, 2000);

        } catch (err) {
            const errorMsg = err.response?.data?.message || "ลิงก์หมดอายุหรือไม่ถูกต้อง โปรดลองขอลิงก์ใหม่";
            setAlertConfig({ type: 'error', message: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-bg">
            <div className="login-card-container">

                <div className="login-header">
                    <h2 className="login-title">ตั้งรหัสผ่านใหม่</h2>
                    <p className="login-subtitle">กรอกรหัสผ่านใหม่สำหรับบัญชีของคุณ</p>
                </div>

                {/* ... Alert Stack ... */}
                {alertConfig.message && (
                    <Stack sx={{ width: '100%', marginBottom: '1rem' }} spacing={2}>
                        <Alert variant="filled" severity={alertConfig.type}>
                            {alertConfig.message}
                        </Alert>
                    </Stack>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    {/* Field: รหัสผ่านใหม่ */}
                    <div className="form-group">
                        <label htmlFor="password">รหัสผ่านใหม่</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="ตั้งรหัสผ่านใหม่"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-input"
                        />
                        {strengthStatus && (
                            <p style={{ color: strengthStatus.color, fontSize: '0.8rem', marginTop: '0.2rem', fontWeight: 'bold'}}>
                                ความแข็งแกร่ง: {strengthStatus.text}
                            </p>
                        )}
                    </div>
                    
                    {/* Field: ยืนยันรหัสผ่าน */}
                    <div className="form-group">
                        <label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="form-input"
                        />
                        {confirmPassword && password !== confirmPassword && (
                            <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                รหัสผ่านไม่ตรงกัน
                            </p>
                        )}
                    </div>

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? "กำลังรีเซ็ต..." : "รีเซ็ตรหัสผ่าน"}
                    </button>
                </form>

                <div className="login-footer">
                    <Link to="/login" className="register-link">กลับสู่หน้าเข้าสู่ระบบ</Link>
                </div>

            </div>
        </div>
    );
};

export default ResetPasswordPage;