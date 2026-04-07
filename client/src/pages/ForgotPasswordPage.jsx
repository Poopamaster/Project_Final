// ไฟล์: src/pages/ForgotPasswordPage.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/userApi";
import "../css/LoginPage.css"; // ใช้ CSS เดียวกัน

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [alertConfig, setAlertConfig] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAlertConfig({ type: '', message: '' });

        try {
            // ยิง API เพื่อขอ Reset Token
            const data = await forgotPassword(email);
            
            // สำเร็จ: แสดงข้อความให้ไปเช็คอีเมล
            setAlertConfig({ 
                type: 'success', 
                message: data.message || `ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมล ${email} เรียบร้อยแล้ว กรุณาตรวจสอบ!` 
            });
        } catch (err) {
            const errorMsg = err.response?.data?.message || "ไม่สามารถส่งอีเมลรีเซ็ตได้ โปรดลองอีกครั้ง";
            setAlertConfig({ type: 'error', message: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-bg">
            <div className="login-card-container">

                <div className="login-header">
                    <h2 className="login-title">ลืมรหัสผ่าน</h2>
                    <p className="login-subtitle">กรอกอีเมลที่ใช้ลงทะเบียนเพื่อรับลิงก์รีเซ็ต</p>
                </div>

                {alertConfig.message && (
                    <Stack sx={{ width: '100%', marginBottom: '1rem' }} spacing={2}>
                        <Alert variant="filled" severity={alertConfig.type}>
                            {alertConfig.message}
                        </Alert>
                    </Stack>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">อีเมล</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Example_123@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? "กำลังส่งลิงก์..." : "ส่งลิงก์รีเซ็ต"}
                    </button>
                </form>

                <div className="login-footer">
                    <Link to="/login" className="register-link">กลับสู่หน้าเข้าสู่ระบบ</Link>
                </div>

            </div>
        </div>
    );
};

export default ForgotPasswordPage;