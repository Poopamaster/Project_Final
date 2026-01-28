import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function CustomerPageAdmin() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. ฟังก์ชันดึงข้อมูลลูกค้าจาก Database
    const fetchCustomers = async () => {
        try {
            setLoading(true);
            // เรียกไปยัง Backend Port 8000
            const response = await axios.get('http://localhost:8000/api/admin/users');
            
            if (response.data.success) {
                setCustomers(response.data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error("Fetch customers error:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    return (
        <div className="admin-page-content-inside">
            <header className="content-header-figma">
                <div className="header-left">
                    <h1>ลูกค้า</h1>
                    <p>จัดการและดูข้อมูลสมาชิกทั้งหมดในระบบ MCP CINEMA...</p>
                </div>
                {/* ตัดส่วนเวลาออกเรียบร้อยแล้ว */}
            </header>

            {loading ? (
                <div className="flex justify-center p-10">
                    <Loader2 className="animate-spin" size={40} color="#8b5cf6" />
                </div>
            ) : (
                <div className="customer-figma-grid">
                    {customers.map((customer) => (
                        <div key={customer._id} className="customer-card-figma">
                            <div className="card-top">
                                <div className="customer-avatar-bg">
                                    {customer.profile_img ? (
                                        <img src={customer.profile_img} alt="profile" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <User size={30} color="#8b5cf6" />
                                    )}
                                </div>
                                {/* ตัวอย่าง Logic: ถ้าแต้มเกิน 1000 ให้เป็น VIP */}
                                <span className={`cust-status-tag ${customer.points >= 1000 ? 'is-vip' : ''}`}>
                                    {customer.points >= 1000 ? 'VIP' : 'ทั่วไป'}
                                </span>
                            </div>
                            
                            <div className="card-body-cust">
                                <h3 className="cust-name">{customer.name}</h3>
                                <div className="cust-contact">
                                    <p><Mail size={14} /> {customer.email}</p>
                                    <p><Phone size={14} /> {customer.phone || 'ไม่ระบุเบอร์โทร'}</p>
                                </div>
                            </div>

                            <div className="card-footer-cust">
                                <div className="stat-item">
                                    <span>แต้มสะสม</span>
                                    <strong>{customer.points || 0}</strong>
                                </div>
                                <div className="stat-item">
                                    <span>ยอดใช้จ่าย</span>
                                    <strong>{(customer.total_spend || 0).toLocaleString()} บ.</strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}