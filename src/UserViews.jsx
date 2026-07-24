import React, { useState } from 'react';

export default function UserViews({ supabase, onBackToAdmin }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null); // بيانات المستخدم بعد تسجيل الدخول
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
      let { data: student, error: studentErr } = await supabase
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
      let { data: driver, error: driverErr } = await supabase
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

  // 1️⃣ شاشة تسجيل الدخول
  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '12px', fontFamily: 'sans-serif' }}>
        <h2>تسجيل دخول المشتركين 🔑</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>أدخل رقم الهاتف وكلمة السر المعتمدة من الإدارة</p>

        {errorMsg && <div style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>{errorMsg}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="رقم الهاتف"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <input
            type="password"
            placeholder="كلمة السر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            دخول
          </button>
        </form>

        <button onClick={onBackToAdmin} style={{ marginTop: '15px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>
          الرجوع للوحة المدير
        </button>
      </div>
    );
  }

  // 2️⃣ شاشة القفل (إذا كان الحساب غير مدفوع 🔴)
  if (user.status !== 'مدفوع' && user.status !== 'paid') {
    return (
      <div style={{ maxWidth: '450px', margin: '50px auto', padding: '30px', textAlign: 'center', border: '2px solid #ff4d4f', borderRadius: '12px', backgroundColor: '#fff2f0', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '50px', margin: '0' }}>🛑</h1>
        <h2 style={{ color: '#cf1322' }}>الحساب غير مفعل!</h2>
        <p style={{ fontSize: '16px', color: '#434343' }}>
          أهلاً بك <b>{user.name}</b>، اشتراكك حالياً بانتظار الدفع أو التفعيل من الإدارة.
        </p>
        <p style={{ fontSize: '14px', color: '#8c8c8c' }}>يرجى تسديد قيمة الاشتراك وتواصل مع المدير لتفعيل حسابك.</p>
        
        <button onClick={handleLogout} style={{ marginTop: '20px', padding: '8px 16px', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          تسجيل الخروج
        </button>
      </div>
    );
  }

  // 3️⃣ واجهة الطالب المفعل 🟢
  if (user.role === 'student') {
    return (
      <div style={{ maxWidth: '500px', margin: '30px auto', padding: '20px', border: '1px solid #28a745', borderRadius: '12px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>🎓 واجهة الطالب: {user.name}</h3>
          <button onClick={handleLogout} style={{ background: '#eee', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>خروج</button>
        </div>
        <hr />
        <p><b>حالة الاشتراك:</b> <span style={{ color: 'green', fontWeight: 'bold' }}>مفعل (مدفوع) 🟢</span></p>
        <p><b>خط السير / الجامعة:</b> {user.university || 'غير محدد'}</p>
        <p><b>اسم السائق:</b> {user.driver_name || 'قيد التعيين'}</p>
      </div>
    );
  }

  // 4️⃣ واجهة السائق المفعل 🟢
  if (user.role === 'driver') {
    return (
      <div style={{ maxWidth: '500px', margin: '30px auto', padding: '20px', border: '1px solid #17a2b8', borderRadius: '12px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>🚐 واجهة السائق: {user.name}</h3>
          <button onClick={handleLogout} style={{ background: '#eee', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>خروج</button>
        </div>
        <hr />
        <p><b>حالة الحساب:</b> <span style={{ color: 'green', fontWeight: 'bold' }}>نشط 🟢</span></p>
        <p><b>خط السير:</b> {user.route || 'غير محدد'}</p>
        <p><b>رقم السيارة:</b> {user.car_number || 'غير محدد'}</p>
      </div>
    );
  }

  return null;
}
