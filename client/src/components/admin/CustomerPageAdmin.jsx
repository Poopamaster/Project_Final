import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Loader2 } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance'; 

export default function CustomerPageAdmin() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/users');
            
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
            </header>

            {loading ? (
                <div className="flex justify-center p-10 text-center">
                    <Loader2 className="animate-spin" size={40} color="#8b5cf6" style={{ margin: '0 auto' }} />
                    <p style={{ marginTop: '15px', color: '#94a3b8' }}>กำลังโหลดข้อมูลลูกค้า...</p>
                </div>
            ) : (
                <div className="customer-figma-grid">
                    {customers.length > 0 ? (
                        customers.map((customer) => (
                            <div key={customer._id} className="customer-card-figma">
                                <div className="card-top">
                                    <div className="customer-avatar-bg">
                                        {customer.profile_img ? (
                                            <img src={customer.profile_img} alt="profile" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <User size={30} color="#8b5cf6" />
                                        )}
                                    </div>
                                    <span className={`cust-status-tag ${customer.points >= 1000 ? 'is-vip' : ''}`}>
                                        {customer.points >= 1000 ? 'VIP Member' : 'ทั่วไป'}
                                    </span>
                                </div>
                                
                                <div className="card-body-cust">
                                    {/* ✅ ถ้าไม่มีชื่อ ให้แสดงส่วนหน้าของ email แทน */}
                                    <h3 className="cust-name">
                                        {customer.name || customer.email.split('@')[0]}
                                    </h3>
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
                        ))
                    ) : (
                        <div className="no-data-text" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', color: '#64748b' }}>
                            ไม่พบข้อมูลลูกค้าในระบบ
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}