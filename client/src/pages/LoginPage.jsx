import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from '@react-oauth/google';
import { loginUser } from "../api/userApi";
import { googleLoginUser } from "../api/userApi";
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

      login(data.token);
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

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const data = await googleLoginUser(tokenResponse.access_token);

        setAlertConfig({ type: 'success', message: 'Google Login สำเร็จ!' });
        
        login(data.token);
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

        <div className="login-header">
          <h2 className="login-title">ยินดีต้อนรับการกลับมา!</h2>
          <p className="login-subtitle">เข้าสู่ระบบเพื่อเริ่มจองตั๋วหนัง</p>
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
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="google-icon" />
          Sign in with Google
        </button>

        <div className="login-footer">
          <Link to="/register" className="register-link">ยังไม่มีบัญชีใช่หรือไม่?</Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;