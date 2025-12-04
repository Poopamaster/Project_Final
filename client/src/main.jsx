import React from 'react'
import ReactDOM from 'react-dom/client' // สำคัญ: ต้อง import ตัวนี้สำหรับ React 18+
import App from './App.jsx'
import './style.css'

// React จะใช้ createRoot และ render ไปที่ element id 'root'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)