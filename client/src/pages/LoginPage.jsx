import React from "react";
import "../css/LoginPage.css"; // อย่าลืมสร้างไฟล์นี้

const LoginPage = () => {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="card-header">
          <h2 className="title">Welcome Back</h2>
          <p className="subtitle">Login to manage your bookings</p>
        </div>
        <form>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" placeholder="name@example.com" />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Enter your password" />
          </div>
          <button type="submit" className="btn-login">
            Sign In
          </button>
        </form>
        <p className="footer-text">Don't have an account? <a href="#">Sign up</a></p>
      </div>
    </div>
  );
};

export default LoginPage;