import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from '@react-oauth/google';
import { loginUser, googleLoginUser } from "../api/userApi";
import "../css/LoginPage.css";
import { AuthContext } from "../App";

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

const LoginPage = () => {
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [alertConfig, setAlertConfig] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
    if (alertConfig.message) setAlertConfig({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertConfig({ type: '', message: '' });

    try {
      const data = await loginUser(formData.email, formData.password);

      setAlertConfig({ type: 'success', message: 'เข้าสู่ระบบสำเร็จ! กำลังพาไปหน้าแรก...' });

      // ✅ ส่งทั้ง token และ user เพื่อให้ Navbar อัปเดตทันที
      login(data.token, data.user);
      localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (err) {
      const errorMsg = err.response?.data?.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      setAlertConfig({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // ✅ แก้ไข google login: เปลี่ยนเป็น redirect mode และส่งค่า user เข้า login()
  const loginWithGoogle = useGoogleLogin({
    ux_mode: 'redirect',
    redirect_uri: window.location.origin + '/login',
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const data = await googleLoginUser(tokenResponse.access_token);

        setAlertConfig({ type: 'success', message: 'Google Login สำเร็จ!' });

        // ✅ จุดสำคัญ: ต้องส่งทั้ง data.token และ data.user 
        // เพื่อให้ State ใน AuthContext เปลี่ยน และ Navbar แสดงชื่อทันทีโดยไม่ต้อง Refresh
        login(data.token, data.user); 
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
    onError: (error) => {
      console.error('Google Login Error:', error);
      setAlertConfig({ type: 'error', message: 'การเชื่อมต่อ Google ล้มเหลว' });
    }
  });

  return (
    <div className="login-page-bg">

      {alertConfig.message && (
        <Stack
          spacing={2}
          id="fixed-alert-container"
          style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '90%', maxWidth: '400px' }}
        >
          <Alert variant="filled" severity={alertConfig.type}>
            {alertConfig.message}
          </Alert>
        </Stack>
      )}

      <div className="login-card-container">

        <div className="login-header">
          <h2 className="login-title">ยินดีต้อนรับการกลับมา!</h2>
          <p className="login-subtitle">เข้าสู่ระบบเพื่อเริ่มจองตั๋วหนัง</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">อีเมลหรือเบอร์โทรศัพท์</label>
            <input
              type="text"
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

          <div className="remember-me">
            <Link to="/forgot-password" className="register-link">ลืมรหัสผ่าน?</Link>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="divider">
          <span>หรือ</span>
        </div>

        <button
          type="button"
          className="btn-google"
          onClick={() => loginWithGoogle()}
          disabled={loading}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="google-icon" />
          {loading ? "กำลังดำเนินการ..." : "Sign in with Google"}
        </button>

        <div className="login-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link to="/register" className="register-link">ยังไม่มีบัญชีใช่หรือไม่?</Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;