import React, { useState } from 'react';

export default function UserViews({ supabase, onBackToAdmin, logoImg }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // التبديل بين الشاشات السفلية: 'main' (الرئيسية) أو 'settings' (الإعدادات)
  const [activeTab, setActiveTab] = useState('main');

  // تبويب الرحلات: 'today' | 'tomorrow' | 'previous'
  const [tripTab, setTripTab] = useState('today');

  // تسجيل الدخول
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phone || !password) {
      setErrorMsg('يرجى إدخال رقم الهاتف وكلمة السر');
      return;
    }

    try {
      // البحث في جدول الطلاب
      let { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('phone', phone.trim())
        .eq('password', password.trim())
        .maybeSingle();

      if (student) {
        setUser({ ...student, role: 'student' });
        return;
      }

      // البحث في جدول السائقين
      let { data: driver } = await supabase
        .from('drivers')
        .select('*')
        .eq('phone', phone.trim())
        .eq('password', password.trim())
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

  const handleLogout = () => {
    setUser(null);
    setPhone('');
    setPassword('');
    setErrorMsg('');
    setActiveTab('main');
  };

  // 1️⃣ شاشة تسجيل الدخول
  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '40px auto', padding: '30px 20px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontFamily: 'sans-serif', backgroundColor: '#ffffff', direction: 'rtl' }}>
        <div style={{ marginBottom: '15px' }}>
          <img 
            src="/logo.png" 
            alt="شعار مسار إكس" 
            style={{ width: '130px', height: 'auto', maxHeight: '90px', objectFit: 'contain', margin: '0 auto' }} 
          />
        </div>
        <h2 style={{ margin: '10px 0 5px 0', color: '#0f172a', fontSize: '20px', fontWeight: 'bold' }}>تطبيق مسار إكس 🚌</h2>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '25px' }}>أدخل رقم الهاتف وكلمة السر للدخول إلى حسابك</p>

        {errorMsg && <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '13px', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca' }}>{errorMsg}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <label style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>رقم الهاتف</label>
            <input
              type="text"
              placeholder="0770XXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ textAlign: 'right' }}>
            <label style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>كلمة السر</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" style={{ padding: '14px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '10px' }}>
            تسجيل الدخول
          </button>
        </form>

        <button onClick={onBackToAdmin} style={{ marginTop: '25px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px' }}>
          الرجوع للوحة الإدارة
        </button>
      </div>
    );
  }

  const isAllowedStatus = ['مدفوع', 'paid', 'متاخر', 'متأخر'].includes(user.status);

  // 2️⃣ شاشة الحساب المتوقف / غير المدفوع
  if (!isAllowedStatus && user.role === 'student') {
    return (
      <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', textAlign: 'center', border: '2px solid #ef4444', borderRadius: '20px', backgroundColor: '#fef2f2', fontFamily: 'sans-serif', direction: 'rtl' }}>
        <div style={{ fontSize: '50px', marginBottom: '10px' }}>🛑</div>
        <h2 style={{ color: '#991b1b', margin: '0 0 10px 0' }}>الحساب غير مفعل!</h2>
        <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
          أهلاً بك <b>{user.name}</b>، اشتراكك حالياً غير مفعل بانتظار الدفع أو التفعيل من الإدارة.
        </p>
        <button onClick={handleLogout} style={{ marginTop: '20px', padding: '10px 24px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
          تسجيل الخروج
        </button>
      </div>
    );
  }

  // 3️⃣ واجهة الطالب / الزبون الرئيسية (مطابقة للتصميم)
  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', direction: 'rtl', paddingBottom: '90px' }}>
      
      {/* 🔝 الهيدر العلوي */}
      <div style={{ backgroundColor: '#ffffff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', sticky: 'top', top: 0, zIndex: 10 }}>
        {/* جهة اليمين: صورة وشخصية الزبون */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', overflow: 'hidden', border: '2px solid #0284c7' }}>
            <img src="/logo.png" alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e)=>{e.target.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png';}} />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>{user.name}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>MSR-{user.id || '1258'}</div>
          </div>
        </div>

        {/* الوسط: الشعار */}
        <div>
          <img src="/logo.png" alt="مسار إكس" style={{ height: '30px', objectFit: 'contain' }} />
        </div>

        {/* اليسار: جرس الإشعارات */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <span style={{ fontSize: '20px' }}>🔔</span>
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#f97316', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</span>
        </div>
      </div>

      {/* 📄 المحتوى الأساسي بناءً على التبويب السفلي (الرئيسية / الإعدادات) */}
      {activeTab === 'main' ? (
        <div style={{ padding: '15px' }}>
          
          {/* عنوان الصفحة */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>🚌 الرحلات</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>عرض تفاصيل رحلاتك اليوم</p>
            </div>
          </div>

          {/* أزرار التبويب (الرحلات اليوم / الغد / سابقة) */}
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '12px', marginBottom: '15px' }}>
            <button 
              onClick={() => setTripTab('today')}
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: tripTab === 'today' ? '#0f172a' : 'transparent', color: tripTab === 'today' ? '#ffffff' : '#475569', transition: '0.2s' }}>
              الرحلات اليوم 📅
            </button>
            <button 
              onClick={() => setTripTab('tomorrow')}
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: tripTab === 'tomorrow' ? '#0f172a' : 'transparent', color: tripTab === 'tomorrow' ? '#ffffff' : '#475569', transition: '0.2s' }}>
              رحلات الغد
            </button>
            <button 
              onClick={() => setTripTab('previous')}
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: tripTab === 'previous' ? '#0f172a' : 'transparent', color: tripTab === 'previous' ? '#ffffff' : '#475569', transition: '0.2s' }}>
              رحلات سابقة
            </button>
          </div>

          {/* شريط اختيار التاريخ */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '14px', cursor: 'pointer', color: '#64748b' }}>&lt;</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>📅 الخميس 2026/07/25</span>
            <span style={{ fontSize: '14px', cursor: 'pointer', color: '#64748b' }}>&gt;</span>
          </div>

          {/* 🟢 كارت رحلة الذهاب */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '15px', marginBottom: '15px', border: '1px solid #10b981', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px dashed #f1f5f9' }}>
              <span style={{ fontWeight: 'bold', color: '#059669', fontSize: '14px' }}>🟢 رحلة الذهاب</span>
              <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>مؤكدة ✔️</span>
            </div>

            <div style={{ fontSize: '11px', color: '#15803d', marginBottom: '12px', backgroundColor: '#f0fdf4', padding: '6px 10px', borderRadius: '6px' }}>
              تم اعتماد رحلتك من قبل الإدارة
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', fontSize: '12px' }}>
              {/* وقت الانطلاق */}
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 5px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '10px' }}>وقت الانطلاق</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', margin: '3px 0' }}>07:00 ص</div>
                <div style={{ color: '#64748b', fontSize: '10px', marginTop: '6px' }}>نقطة الانطلاق</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '10px' }}>{user.university || 'حي الزهراء'}</div>
              </div>

              {/* معلومات السيارة */}
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 5px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '10px' }}>السيارة</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', margin: '3px 0' }}>تويوتا هايس 🚐</div>
                <div style={{ color: '#64748b', fontSize: '10px', marginTop: '6px' }}>رقم السيارة</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '10px' }}>22 A 12345</div>
              </div>

              {/* معلومات السائق */}
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 5px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '10px' }}>السائق</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', margin: '3px 0' }}>{user.driver_name || 'أحمد كريم'}</div>
                <div style={{ color: '#eab308', fontSize: '10px', fontWeight: 'bold' }}>⭐ 4.8</div>
                <button style={{ marginTop: '5px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}>💬 محادثة</button>
              </div>
            </div>
          </div>

          {/* 🟠 كارت رحلة العودة */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '15px', marginBottom: '15px', border: '1px solid #f59e0b', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px dashed #f1f5f9' }}>
              <span style={{ fontWeight: 'bold', color: '#d97706', fontSize: '14px' }}>🟠 رحلة العودة</span>
              <span style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>قيد التوزيع ⏳</span>
            </div>

            <div style={{ fontSize: '11px', color: '#b45309', marginBottom: '12px', backgroundColor: '#fffbeb', padding: '6px 10px', borderRadius: '6px' }}>
              بانتظار اعتماد الإدارة للتوزيع
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', fontSize: '12px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 5px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '10px' }}>وقت العودة المتوقع</div>
                <div style={{ fontWeight: 'bold', color: '#94a3b8', margin: '3px 0' }}>--:--</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '10px 5px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '10px' }}>السيارة</div>
                <div style={{ fontWeight: 'bold', color: '#94a3b8', margin: '3px 0' }}>لم تحدد بعد</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '10px 5px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '10px' }}>السائق</div>
                <div style={{ fontWeight: 'bold', color: '#94a3b8', margin: '3px 0' }}>لم يحدد بعد</div>
              </div>
            </div>

            <div style={{ marginTop: '10px', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '8px', borderRadius: '8px', fontSize: '10px', textAlign: 'center' }}>
              ℹ️ رحلة العودة لا تشترط أن تكون مع نفس السائق أو السيارة التي جئت بها.
            </div>
          </div>

          {/* 📊 ملخص الرحلات */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '15px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px', marginBottom: '10px' }}>📊 ملخص الرحلات</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
              
              <div style={{ backgroundColor: '#f8fafc', padding: '8px 4px', borderRadius: '8px' }}>
                <div style={{ fontSize: '9px', color: '#64748b' }}>تأكيد الدوام</div>
                <div style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px', marginTop: '4px' }}>✔️ أداوم</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '8px 4px', borderRadius: '8px' }}>
                <div style={{ fontSize: '9px', color: '#64748b' }}>رحلات اليوم</div>
                <div style={{ color: '#0284c7', fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}>2</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '8px 4px', borderRadius: '8px' }}>
                <div style={{ fontSize: '9px', color: '#64748b' }}>حالة العودة</div>
                <div style={{ color: '#d97706', fontWeight: 'bold', fontSize: '10px', marginTop: '4px' }}>انتظار</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '8px 4px', borderRadius: '8px' }}>
                <div style={{ fontSize: '9px', color: '#64748b' }}>حالة الذهاب</div>
                <div style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '10px', marginTop: '4px' }}>مؤكدة</div>
              </div>

            </div>
          </div>

        </div>
      ) : (
        /* ⚙️ تبويب الإعدادات (معلومات الحساب) */
        <div style={{ padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', fontSize: '16px' }}>👤 معلومات الحساب الشخصي</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>اسم المشترك:</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{user.name}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>رقم الهاتف:</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{user.phone}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>الجهة / الجامعة:</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{user.university || 'غير محدد'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>قيمة الاشتراك:</span>
                <span style={{ fontWeight: 'bold', color: '#059669' }}>{user.price || '90,000'} د.ع</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>حالة الاشتراك:</span>
                <span style={{ fontWeight: 'bold', color: user.status === 'متاخر' || user.status === 'متأخر' ? '#d97706' : '#16a34a' }}>
                  {user.status === 'متاخر' || user.status === 'متأخر' ? '🟡 متأخر بالدفع' : '🟢 مدفوع ومفعل'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>السائق المخصص:</span>
                <span style={{ fontWeight: 'bold', color: '#0284c7' }}>{user.driver_name || 'أحمد كريم'}</span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              style={{ width: '100%', marginTop: '25px', padding: '12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
              🚪 تسجيل الخروج
            </button>
          </div>
        </div>
      )}

      {/* 🔻 الخانة المنبثقة السفلى (تحتوي فقط على: الرئيسية والآعدادات) */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0', zIndex: 100, maxWidth: '500px', margin: '0 auto' }}>
        
        {/* 1️⃣ الرئيسية */}
        <button 
          onClick={() => setActiveTab('main')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', color: activeTab === 'main' ? '#0284c7' : '#94a3b8' }}>
          <span style={{ fontSize: '22px' }}>🏠</span>
          <span style={{ fontSize: '12px', fontWeight: activeTab === 'main' ? 'bold' : 'normal' }}>الرئيسية</span>
        </button>

        {/* 2️⃣ الإعدادات (تظهر معلومات الحساب) */}
        <button 
          onClick={() => setActiveTab('settings')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', color: activeTab === 'settings' ? '#0284c7' : '#94a3b8' }}>
          <span style={{ fontSize: '22px' }}>⚙️</span>
          <span style={{ fontSize: '12px', fontWeight: activeTab === 'settings' ? 'bold' : 'normal' }}>الإعدادات</span>
        </button>

      </div>

    </div>
  );
}
