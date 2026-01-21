import React from 'react';
import { User, ShieldCheck, Mail, Phone } from 'lucide-react';

export default function CustomerPageAdmin() {
    // ข้อมูลจำลองลูกค้าตามสไตล์ Figma
    const customers = [
        { id: 1, name: 'อภิญญาวุฒิ เ*****', status: 'VIP', email: 'api***@gmail.com', phone: '081-234-XXXX', points: 1250, totalSpend: '4,500 บ.' },
        { id: 2, name: 'ธนชัย บ*****', status: 'ทั่วไป', email: 'thana***@hotmail.com', phone: '095-888-XXXX', points: 420, totalSpend: '1,200 บ.' },
        { id: 3, name: 'ยุวดี แ*****', status: 'VIP', email: 'yuwa***@gmail.com', phone: '062-111-XXXX', points: 2100, totalSpend: '8,900 บ.' },
        { id: 4, name: 'ปรียากร ว*****', status: 'ทั่วไป', email: 'pree***@gmail.com', phone: '083-444-XXXX', points: 150, totalSpend: '600 บ.' },
    ];

    return (
        <div className="admin-page-content-inside">
            <header className="content-header-figma">
                <div className="header-left">
                    <h1>ลูกค้า</h1>
                    <p>จัดการและดูข้อมูลสมาชิกทั้งหมด...</p>
                </div>
                <div className="header-right-time">
                    <span>11 Sep 2026</span>
                    <span className="time-clock">22:41:56</span>
                </div>
            </header>

            <div className="customer-figma-grid">
                {customers.map((customer) => (
                    <div key={customer.id} className="customer-card-figma">
                        <div className="card-top">
                            <div className="customer-avatar-bg">
                                <User size={30} color="#8b5cf6" />
                            </div>
                            <span className={`cust-status-tag ${customer.status === 'VIP' ? 'is-vip' : ''}`}>
                                {customer.status}
                            </span>
                        </div>
                        
                        <div className="card-body-cust">
                            <h3 className="cust-name">{customer.name}</h3>
                            <div className="cust-contact">
                                <p><Mail size={14} /> {customer.email}</p>
                                <p><Phone size={14} /> {customer.phone}</p>
                            </div>
                        </div>

                        <div className="card-footer-cust">
                            <div className="stat-item">
                                <span>แต้มสะสม</span>
                                <strong>{customer.points}</strong>
                            </div>
                            <div className="stat-item">
                                <span>ยอดใช้จ่าย</span>
                                <strong>{customer.totalSpend}</strong>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}