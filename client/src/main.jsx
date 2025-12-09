import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter } from 'react-router-dom'; // <--- เพิ่มบรรทัดนี้
import App from './App.jsx'
import './style.css'

const GOOGLE_CLIENT_ID = "138152624506-ikkdfevmmiqib8gsnvtgklab50eqvmfa.apps.googleusercontent.com";

// React จะใช้ createRoot และ render ไปที่ element id 'root'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}> 
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)