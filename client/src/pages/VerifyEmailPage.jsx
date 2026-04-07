// src/pages/VerifyEmailPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../api/userApi';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // ✅ ใช้ useRef กัน Loop ในหน้านี้
    const hasFetched = useRef(false);

    const [status, setStatus] = useState({ type: 'info', message: 'กำลังตรวจสอบข้อมูล...' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ✅ ถ้าเคยทำไปแล้ว ให้หยุด (กัน React 18 render เบิ้ล)
        if (hasFetched.current) return;
        hasFetched.current = true;

        // 1. เคลียร์ Storage แบบเงียบๆ เพื่อไม่ให้ App.js ตกใจ
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("jwtToken"); // เผื่อ key นี้ด้วย

        const verifyToken = async () => {
            const rawToken = searchParams.get('token');
            const token = rawToken ? decodeURIComponent(rawToken) : null;

            if (!token) {
                setStatus({ type: 'error', message: 'ไม่พบรหัสยืนยัน (Token Invalid)' });
                setLoading(false);
                return;
            }

            try {
                await verifyEmail(token);
                
                setStatus({ type: 'success', message: 'ยืนยันตัวตนสำเร็จ! กำลังนำทางไปหน้าเข้าสู่ระบบ...' });

                setTimeout(() => {
                    // ล้างอีกรอบก่อนไป
                    localStorage.removeItem("user");
                    localStorage.removeItem("jwtToken");
                    
                    navigate('/login', { 
                        replace: true,
                        state: { 
                            successMessage: "ยืนยันตัวตนสำเร็จ! บัญชีของคุณพร้อมใช้งานแล้ว",
                            severity: "success"
                        }
                    });
                }, 3000);

            } catch (error) {
                // จัดการ Error Duplicate Key (กรณี User กดซ้ำ)
                if (error.response && error.response.status === 400 && JSON.stringify(error.response.data).includes("Duplicate")) {
                     setStatus({ type: 'success', message: 'บัญชีนี้ยืนยันไปแล้ว เข้าสู่ระบบได้เลย' });
                     setTimeout(() => {
                        navigate('/login', { replace: true });
                    }, 3000);
                    return;
                }

                const msg = error.response?.data?.message || 'การยืนยันตัวตนล้มเหลว หรือลิงก์หมดอายุ';
                setStatus({ type: 'error', message: msg });
                
                localStorage.removeItem("user");
                localStorage.removeItem("jwtToken");
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, []); // Empty dependency

    return (
        <div className="login-page-bg" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="login-card-container" style={{ textAlign: 'center', padding: '2rem' ,color: '#333', maxWidth: '500px' }}>
                <h2 style={{ marginBottom: '1rem' }}>การยืนยันอีเมล</h2>
                <Stack sx={{ width: '100%', marginTop: '1rem' }} spacing={2}>
                    <Alert variant="filled" severity={status.type}>
                        {status.message}
                    </Alert>
                </Stack>
                
                {loading && <p style={{ marginTop: '1rem' }}>กรุณารอสักครู่...</p>}
                
                {!loading && (
                    <button 
                        onClick={() => {
                            localStorage.removeItem("user");
                            localStorage.removeItem("jwtToken");
                            navigate('/login');
                        }} 
                        className="btn-submit" 
                        style={{ marginTop: '1rem' }}
                    >
                        ไปหน้าเข้าสู่ระบบ
                    </button>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;