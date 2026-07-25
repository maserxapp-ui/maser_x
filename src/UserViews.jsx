import React, { useState } from 'react';
import logoImg from '../logo.png.jpg'; // أو مسار مشابه

export default function UserViews({ supabase, onBackToAdmin, logoImg }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // تسجيل الدخول بالبحث في قاعدة البيانات
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phone || !password) {
      setErrorMsg('يرجى إدخال رقم الهاتف وكلمة السر');
      return;
    }

    try {
      // البحث في جدول الطلاب أولاً
      let { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('phone', phone)
        .eq('password', password)
        .maybeSingle();

      if (student) {
        setUser({ ...student, role: 'student' });
        return;
      }

      // البحث في جدول السائقين إذا لم يكن طالباً
      let { data: driver } = await supabase
        .from('drivers')
        .select('*')
        .eq('phone', phone)
        .eq('password', password)
        .maybeSingle();

      if (driver) {
        setUser({ ...driver, role: 'driver' });
        return;
      }

      setErrorMsg('رقم الهاتف أو كلمة السر غير صحيحة');
    } catch (err) {
      setErrorMsg('حدث خطأ أثناء الاتصال بالشبكة');
    }
  };

  // تسجيل الخروج
  const handleLogout = () => {
    setUser(null);
    setPhone('');
    setPassword('');
    setErrorMsg('');
  };

  // 1️⃣ شاشة تسجيل الدخول (مع الشعار)
  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px 20px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontFamily: 'sans-serif', backgroundColor: '#ffffff' }}>
        
        {/* 🖼️ عرض الشعار هنا */}
        <div style={{ marginBottom: '15px' }}>
          <img 
            src={logoImg} 
            alt="شعار مسار إكس" 
            style={{ width: '130px', height: 'auto', maxHeight: '90px', objectFit: 'contain', margin: '0 auto' }} 
          />
        </div>

        <h2 style={{ margin: '10px 0 5px 0', color: '#1e293b' }}>تسجيل دخول المشتركين 🔑</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>أدخل رقم الهاتف وكلمة السر المعتمدة من الإدارة</p>

        {errorMsg && <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px', backgroundColor: '#fef2f2', padding: '8px', borderRadius: '6px' }}>{errorMsg}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="رقم الهاتف"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', textAlign: 'right' }}
          />
          <input
            type="password"
            placeholder="كلمة السر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', textAlign: 'right' }}
          />
          <button type="submit" style={{ padding: '12px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '5px' }}>
            دخول
          </button>
        </form>

        <button onClick={onBackToAdmin} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>
          الرجوع للوحة المدير
        </button>
      </div>
    );
  }

  // 2️⃣ شاشة القفل (إذا كان الحساب غير مدفوع 🔴)
  if (user.status !== 'مدفوع' && user.status !== 'paid') {
    return (
      <div style={{ maxWidth: '450px', margin: '50px auto', padding: '30px', textAlign: 'center', border: '2px solid #ef4444', borderRadius: '16px', backgroundColor: '#fef2f2', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '50px', margin: '0' }}>🛑</h1>
        <h2 style={{ color: '#991b1b' }}>الحساب غير مفعل!</h2>
        <p style={{ fontSize: '16px', color: '#374151' }}>
          أهلاً بك <b>{user.name}</b>، اشتراكك حالياً بانتظار الدفع أو التفعيل من الإدارة.
        </p>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>يرجى تسديد قيمة الاشتراك والتواصل مع المدير لتفعيل حسابك.</p>
        
        <button onClick={handleLogout} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          تسجيل الخروج
        </button>
      </div>
    );
  }

  // 3️⃣ واجهة الطالب المفعل 🟢
  if (user.role === 'student') {
    return (
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '25px', border: '1px solid #22c55e', borderRadius: '16px', fontFamily: 'sans-serif', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#15803d' }}>🎓 واجهة الطالب: {user.name}</h3>
          <button onClick={handleLogout} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#475569' }}>خروج</button>
        </div>
        <hr style={{ margin: '15px 0', border: '0.5px solid #e2e8f0' }} />
        <p><b>حالة الاشتراك:</b> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>مفعل (مدفوع) 🟢</span></p>
        <p><b>خط السير / الجامعة:</b> {user.university || 'غير محدد'}</p>
        <p><b>اسم السائق:</b> {user.driver_name || 'قيد التعيين'}</p>
      </div>
    );
  }

  // 4️⃣ واجهة السائق المفعل 🟢
  if (user.role === 'driver') {
    return (
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '25px', border: '1px solid #06b6d4', borderRadius: '16px', fontFamily: 'sans-serif', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#0e7490' }}>🚐 واجهة السائق: {user.name}</h3>
          <button onClick={handleLogout} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#475569' }}>خروج</button>
        </div>
        <hr style={{ margin: '15px 0', border: '0.5px solid #e2e8f0' }} />
        <p><b>حالة الحساب:</b> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>نشط 🟢</span></p>
        <p><b>خط السير:</b> {user.route || 'غير محدد'}</p>
        <p><b>رقم السيارة:</b> {user.car_number || 'غير محدد'}</p>
      </div>
    );
  }

  return null;
}
