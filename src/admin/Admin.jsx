import React, { useState, useEffect } from 'react';

const WEEK_DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

export default function Admin({ supabase, onGoToUserView }) {
  const [activeTab, setActiveTab] = useState('students');
  
  const [students, setStudents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // حالة الطالبة
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentUniversity, setStudentUniversity] = useState('');
  const [studentPrice, setStudentPrice] = useState('');
  const [studentStatus, setStudentStatus] = useState('مدفوع');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedWorkDays, setSelectedWorkDays] = useState(['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']);

  // حالة السائق
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [driverCar, setDriverCar] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!supabase) return;
      const { data: stData } = await supabase.from('students').select('*');
      const { data: drData } = await supabase.from('drivers').select('*');
      
      let excData = [];
      try {
        const { data: resExc } = await supabase.from('exceptions').select('*').order('created_at', { ascending: false });
        if (resExc) excData = resExc;
      } catch (e) {
        const { data: resNotif } = await supabase.from('notifications').select('*').eq('type', 'exam_exception').order('created_at', { ascending: false });
        if (resNotif) excData = resNotif.map(n => ({
          id: n.id,
          student_name: n.student_name,
          driver_name: n.driver_name,
          exam_duration: n.message,
          created_at: n.created_at
        }));
      }

      if (stData) setStudents(stData);
      if (drData) setDrivers(drData);
      if (excData) setExceptions(excData);
    } catch (e) {
      console.log('خطأ في جلب البيانات', e);
    }
    setLoading(false);
  };

  const handleToggleDay = (day) => {
    if (selectedWorkDays.includes(day)) {
      setSelectedWorkDays(selectedWorkDays.filter(d => d !== day));
    } else {
      setSelectedWorkDays([...selectedWorkDays, day]);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!studentName || !studentPhone || !studentPassword) {
      alert('يرجى ملء الاسم ورقم الهاتف وكلمة السر');
      return;
    }

    const assignedDr = drivers.find(d => String(d.id) === String(selectedDriverId));

    try {
      const { error } = await supabase.from('students').insert([
        {
          name: studentName,
          phone: studentPhone,
          password: studentPassword,
          university: studentUniversity,
          price: studentPrice,
          status: studentStatus,
          driver_id: selectedDriverId || null,
          driver_name: assignedDr ? assignedDr.name : null,
          work_days: selectedWorkDays
        }
      ]);

      if (error) throw error;

      alert('تمت إضافة الطالبة بنجاح! ✅');
      setStudentName('');
      setStudentPhone('');
      setStudentPassword('');
      setStudentUniversity('');
      setStudentPrice('');
      setSelectedDriverId('');
      setSelectedWorkDays(['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']);
      fetchData();
    } catch (err) {
      alert('حدث خطأ أثناء إضافة الطالبة');
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (!driverName || !driverPhone || !driverPassword) {
      alert('يرجى ملء كافة معلومات السائق');
      return;
    }

    try {
      const { error } = await supabase.from('drivers').insert([
        {
          name: driverName,
          phone: driverPhone,
          password: driverPassword,
          car_model: driverCar
        }
      ]);

      if (error) throw error;

      alert('تمت إضافة السائق بنجاح! 🚌');
      setDriverName('');
      setDriverPhone('');
      setDriverPassword('');
      setDriverCar('');
      fetchData();
    } catch (err) {
      alert('حدث خطأ في إضافة السائق');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', direction: 'rtl', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* الهيدر */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '15px 20px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>🛠️ لوحة إشراف تطبيق مسار إكس</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>إدارة الاشتراك والطلاب والسائقين والاستثناءات</p>
        </div>
        {onGoToUserView && (
          <button onClick={onGoToUserView} style={{ padding: '8px 16px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
            📱 واجهة المشتركين
          </button>
        )}
      </div>

      {/* أزرار التنقل */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('students')}
          style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'students' ? '#0f172a' : '#ffffff', color: activeTab === 'students' ? '#ffffff' : '#475569' }}>
          🎓 الطلاب والطالبات ({students.length})
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'drivers' ? '#0f172a' : '#ffffff', color: activeTab === 'drivers' ? '#ffffff' : '#475569' }}>
          🚌 السائقين ({drivers.length})
        </button>

        <button
          onClick={() => setActiveTab('exceptions')}
          style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'exceptions' ? '#dc2626' : '#ffffff', color: activeTab === 'exceptions' ? '#ffffff' : '#dc2626', border: '1px solid #fecaca' }}>
          🚨 قسم الاستثناءات (الامتحانات) ({exceptions.length})
        </button>
      </div>

      {/* 1️⃣ الطلاب */}
      {activeTab === 'students' && (
        <div>
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#0f172a' }}>➕ إضافة مشتركة / طالب جديدة</h3>
            
            <form onSubmit={handleAddStudent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>الاسم الثلاثي</label>
                <input type="text" placeholder="مثال: زينب علي" value={studentName} onChange={e=>setStudentName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>رقم الهاتف</label>
                <input type="text" placeholder="0770XXXXXXX" value={studentPhone} onChange={e=>setStudentPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>كلمة السر</label>
                <input type="text" placeholder="password123" value={studentPassword} onChange={e=>setStudentPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>الجامعة / الكلية</label>
                <input type="text" placeholder="جامعة بغداد" value={studentUniversity} onChange={e=>setStudentUniversity(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>مبلغ الاشتراك (د.ع)</label>
                <input type="number" placeholder="150000" value={studentPrice} onChange={e=>setStudentPrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>السائق المخصص</label>
                <select value={selectedDriverId} onChange={e=>setSelectedDriverId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}>
                  <option value="">-- اختر السائق --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.car_model || 'سيارة'})</option>
                  ))}
                </select>
              </div>

              {/* 🗓️ أيام الدوام */}
              <div style={{ gridColumn: 'span 2', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '10px', marginTop: '5px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  🗓️ أيام الدوام الأسبوعية للطلاب (حدد الأيام التي تداوم بها الطالبة):
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {WEEK_DAYS.map(day => (
                    <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: selectedWorkDays.includes(day) ? '#e0f2fe' : '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      <input
                        type="checkbox"
                        checked={selectedWorkDays.includes(day)}
                        onChange={() => handleToggleDay(day)}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" style={{ gridColumn: 'span 2', padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginTop: '10px' }}>
                حفظ الطالبة في النظام
              </button>
            </form>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '15px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>📋 قائمة الطلاب المسجلين</h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px' }}>الاسم</th>
                    <th style={{ padding: '10px' }}>الهاتف</th>
                    <th style={{ padding: '10px' }}>الجامعة</th>
                    <th style={{ padding: '10px' }}>السائق</th>
                    <th style={{ padding: '10px' }}>أيام الدوام</th>
                    <th style={{ padding: '10px' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{s.name}</td>
                      <td style={{ padding: '10px' }}>{s.phone}</td>
                      <td style={{ padding: '10px' }}>{s.university || '-'}</td>
                      <td style={{ padding: '10px', color: '#0284c7', fontWeight: 'bold' }}>{s.driver_name || 'غير مخصص'}</td>
                      <td style={{ padding: '10px' }}>
                        {Array.isArray(s.work_days) ? s.work_days.join(' ، ') : (s.work_days || 'كل الأيام')}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                          {s.status || 'مدفوع'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2️⃣ السائقين */}
      {activeTab === 'drivers' && (
        <div>
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>➕ إضافة سائق جديد</h3>
            <form onSubmit={handleAddDriver} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>اسم السائق</label>
                <input type="text" placeholder="أحمد جاسم" value={driverName} onChange={e=>setDriverName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>رقم الهاتف</label>
                <input type="text" placeholder="0780XXXXXXX" value={driverPhone} onChange={e=>setDriverPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>كلمة السر</label>
                <input type="text" placeholder="123456" value={driverPassword} onChange={e=>setDriverPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>نوع / موديل السيارة</label>
                <input type="text" placeholder="ستاركس / كيا" value={driverCar} onChange={e=>setDriverCar(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>

              <button type="submit" style={{ gridColumn: 'span 2', padding: '12px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                حفظ السائق
              </button>
            </form>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '15px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>🚌 قائمة السائقين</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {drivers.map(d => (
                <div key={d.id} style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>{d.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>📞 {d.phone}</div>
                  <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '3px' }}>🚘 {d.car_model || 'سيارة غير محددة'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3️⃣ الاستثناءات */}
      {activeTab === 'exceptions' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #fecaca' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #fee2e2', paddingBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#991b1b', fontSize: '16px' }}>🚨 جدول طلبات امتحانات الطالبات والاستثناءات</h3>
            <button onClick={fetchData} style={{ padding: '6px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
              🔄 تحديث القائمة
            </button>
          </div>

          {exceptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '14px' }}>
              لا توجد أي طلبات امتحانات حالياً 🎉
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {exceptions.map((ex, idx) => (
                <div key={ex.id || idx} style={{ backgroundColor: '#fff5f5', border: '1px solid #fecaca', borderRadius: '12px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#991b1b' }}>
                      🎓 الطالبة: {ex.student_name || 'طالبة'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#374151', marginTop: '4px' }}>
                      📝 <b>تفاصيل/وقت الامتحان:</b> {ex.exam_duration || ex.message || 'غير محدد'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '4px' }}>
                      🚌 <b>السائق المكلف:</b> {ex.driver_name || 'غير محدد'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <span style={{ backgroundColor: '#dc2626', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                      امتحان / استثناء 📝
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
