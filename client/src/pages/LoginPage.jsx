import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from '@react-oauth/google';
import { loginUser } from "../api/userApi";
import { googleLoginUser } from "../api/userApi";
import "../css/LoginPage.css";

// Material UI Imports
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

const LoginPage = () => {
  // State เก็บข้อมูล Form
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // State สำหรับจัดการ Alert (เก็บทั้งประเภทและข้อความ)
  // type: 'success' | 'error' | ''
  const [alertConfig, setAlertConfig] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
    // เมื่อเริ่มพิมพ์ใหม่ ให้ซ่อน Alert เดิม
    if (alertConfig.message) setAlertConfig({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertConfig({ type: '', message: '' }); // Clear alert ก่อนยิง API

    try {
      const data = await loginUser(formData.email, formData.password);

      // 1. Login สำเร็จ -> แสดง Alert สีเขียว
      setAlertConfig({ type: 'success', message: 'เข้าสู่ระบบสำเร็จ! กำลังพาไปหน้าแรก...' });

      // บันทึกข้อมูล
      localStorage.setItem("user", JSON.stringify(data.user));

      // หน่วงเวลาเล็กน้อยให้ User เห็น Alert ก่อนเปลี่ยนหน้า
      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (err) {
      // 2. Login พลาด -> แสดง Alert สีแดง
      const errorMsg = err.response?.data?.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      setAlertConfig({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        // ได้ Access Token มาแล้ว ส่งไปให้ Backend เราจัดการต่อ
        const data = await googleLoginUser(tokenResponse.access_token);

        // ถ้า Backend ตอบกลับมาว่า OK (Login/Register สำเร็จ)
        setAlertConfig({ type: 'success', message: 'Google Login สำเร็จ!' });
        localStorage.setItem("user", JSON.stringify(data.user));

        setTimeout(() => {
          navigate("/");
        }, 1500);
      } catch (err) {
        setAlertConfig({ type: 'error', message: 'Google Login ผิดพลาด' });
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setAlertConfig({ type: 'error', message: 'การเชื่อมต่อ Google ล้มเหลว' });
    }
  });

  return (
    <div className="login-page-bg">
      <div className="login-card-container">

        {/* Header */}
        <div className="login-header">
          <h2 className="login-title">ยินดีต้อนรับการกลับมา!</h2>
          <p className="login-subtitle">เข้าสู่ระบบเพื่อเริ่มจองตั๋วหนัง</p>
        </div>

        {/* Material UI Alert Area */}
        {alertConfig.message && (
          <Stack sx={{ width: '100%', marginBottom: '1rem' }} spacing={2}>
            <Alert variant="filled" severity={alertConfig.type}>
              {alertConfig.message}
            </Alert>
          </Stack>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">อีเมลหรือเบอร์โทรศัพท์</label>
            <input
              type="text" // ใช้ text เพื่อรองรับทั้ง email/เบอร์ ตามดีไซน์
              id="email"
              placeholder="Example_123@gmail.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">รหัสผ่าน</label>
            <input
              type="password"
              id="password"
              placeholder="***************"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          {/* Remember Me Checkbox */}
          <div className="remember-me">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">จดจำการเข้าสู่ระบบ</label>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        {/* Divider */}
        <div className="divider">
          <span>หรือ</span>
        </div>

        {/* Google Login Button (Visual Only) */}
        <button
          type="button"
          className="btn-google"
          onClick={() => loginWithGoogle()} // <-- ใส่ onClick ตรงนี้
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="google-icon" />
          Sign in with Google
        </button>

        {/* Footer */}
        <div className="login-footer">
          <Link to="/register" className="register-link">ยังไม่มีบัญชีใช่หรือไม่?</Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;