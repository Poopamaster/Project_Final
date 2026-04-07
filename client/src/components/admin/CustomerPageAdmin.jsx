import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Loader2, Award } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance'; 
import Swal from "sweetalert2";

export default function CustomerPageAdmin() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            // ✅ แก้ไข Path: axiosInstance มี /api แล้ว + adminRoutes อยู่ที่ /admin
            // ผลลัพธ์จะเป็น /api/admin/users ตามที่ตั้งไว้ใน app.js
            const response = await axiosInstance.get('/admin/users');
            
            if (response.data.success) {
                setCustomers(response.data.data);
            }
        } catch (error) {
            console.error("Fetch customers error:", error);
            // ถ้า Error 404 แสดงว่า Path ยังไม่ตรง หรือถ้า 401 แสดงว่า Token หลุด
            if (error.response?.status === 404) {
                console.error("Path /api/admin/users ไม่พบใน Server");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    return (
        <div className="admin-page-content-inside">
            <header className="content-header-figma" style={{ marginBottom: '30px' }}>
                <div className="header-left">
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff' }}>ลูกค้า</h1>
                    <p style={{ color: '#94a3b8' }}>จัดการและดูข้อมูลสมาชิกทั้งหมด (พบ {customers.length} ราย)</p>
                </div>
            </header>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px' }}>
                    <Loader2 className="animate-spin" size={48} color="#8b5cf6" />
                    <p style={{ marginTop: '15px', color: '#94a3b8' }}>กำลังโหลดข้อมูลลูกค้า...</p>
                </div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                    gap: '20px' 
                }}>
                    {customers.length > 0 ? (
                        customers.map((customer) => (
                            <div key={customer._id} style={{ 
                                background: '#1e212f', 
                                borderRadius: '24px', 
                                padding: '25px', 
                                border: '1px solid rgba(255,255,255,0.05)',
                                transition: 'transform 0.2s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div style={{ 
                                        width: '60px', 
                                        height: '60px', 
                                        background: '#11131f', 
                                        borderRadius: '18px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center' 
                                    }}>
                                        {customer.profile_img ? (
                                            <img src={customer.profile_img} alt="profile" style={{ width: '100%', height: '100%', borderRadius: '18px', objectCover: 'cover' }} />
                                        ) : (
                                            <User size={30} color="#8b5cf6" />
                                        )}
                                    </div>
                                    <span style={{ 
                                        padding: '5px 12px', 
                                        borderRadius: '10px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 'bold',
                                        background: customer.points >= 1000 ? 'rgba(139, 92, 246, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                                        color: customer.points >= 1000 ? '#a78bfa' : '#94a3b8'
                                    }}>
                                        {customer.points >= 1000 ? 'VIP Member' : 'ทั่วไป'}
                                    </span>
                                </div>
                                
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
                                        {customer.name || customer.email.split('@')[0]}
                                    </h3>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <Mail size={14} /> {customer.email}
                                        </p>
                                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Phone size={14} /> {customer.phone || 'ไม่ระบุเบอร์โทร'}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '1fr 1fr', 
                                    gap: '15px', 
                                    paddingTop: '20px', 
                                    borderTop: '1px solid rgba(255,255,255,0.05)' 
                                }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>แต้มสะสม</span>
                                        <strong style={{ color: '#8b5cf6', fontSize: '1.1rem' }}>{customer.points || 0}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>ระดับ</span>
                                        <strong style={{ color: '#f59e0b', fontSize: '1.1rem' }}>{customer.role || 'User'}</strong>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: '#64748b' }}>
                            <User size={48} style={{ margin: '0 auto 20px', opacity: 0.2 }} />
                            <p>ไม่พบข้อมูลลูกค้าในระบบ</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}