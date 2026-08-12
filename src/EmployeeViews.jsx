import React, { useState, useEffect } from 'react';
const DAYS_OF_WEEK = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
// 📱 دالة المساعدة للاتصال عبر الواتساب
export const openWhatsApp = (phone) => {
  if (!phone) return alert('رقم الهاتف غير متوفر');
  let cleanPhone = phone.toString().replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '964' + cleanPhone.substring(1);
  }
  window.open(`https://wa.me/${cleanPhone}`, '_blank');
};

// ==========================================
// 1️⃣ واجهة دخول الموظفة (Employee Login)
// ==========================================
export function EmployeeLoginModal({ isOpen, onClose, onLoginSuccess, supabase }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabase) return setError('خطأ في الاتصال بقاعدة البيانات');
    setLoading(true);
    setError('');

    try {
      const { data: employee, error: fetchErr } = await supabase
        .from('employees')
        .select('*, drivers(name, phone)')
        .eq('phone', phone.trim())
        .eq('password', password.trim())
        .maybeSingle();

      if (fetchErr || !employee) {
        setError('رقم الموبايل أو كلمة السر غير صحيحة');
        return;
      }

      if (employee.payment_status !== 'paid') {
        setError('عذراً، اشتراكك غير مدفوع أو متوقف حالياً. يرجى مراجعة الإدارة.');
        return;
      }

      // 🟢 حفظ نوع الحساب كـ موظفة في الذاكرة لتوجيه الواجهة فوراً
      localStorage.setItem('userRole', 'employee');
      localStorage.setItem('userType', 'employee');
      localStorage.setItem('employeeData', JSON.stringify(employee));

      if (onLoginSuccess) {
        onLoginSuccess(employee, 'employee');
      }

      onClose();
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 dir-rtl font-sans">
      <div className="bg-[#162238] border border-[#233554] rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-white space-y-4">
        <button 
          onClick={onClose} 
          className="absolute left-4 top-4 text-gray-400 hover:text-white text-lg font-bold transition-all"
        >
          ✕
        </button>

        <div className="text-center space-y-2">
          <img src="/logo.png" alt="مسار إكس" className="h-14 mx-auto object-contain mb-2" />
          <h2 className="text-xl font-bold text-[#f97316]">دخول الموظفات / المعلمات 👩‍🏫</h2>
          <p className="text-xs text-gray-400">أدخلي بيانات الحساب للمتابعة</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">رقم الموبايل</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#0b1329] border border-[#233554] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#f97316]"
              placeholder="07XXXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">كلمة السر</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0b1329] border border-[#233554] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#f97316]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2️⃣ واجهة الموظفة الرئيسية (Employee Dashboard)
// ==========================================
export function EmployeeView({ employee, user, supabase, isOfficialHoliday }) {
  const [empData, setEmpData] = useState(employee);
  const [loadingToggle, setLoadingToggle] = useState(false);
  // حالات نافذة التقييم
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingNote, setRatingNote] = useState('');
  const [targetDriver, setTargetDriver] = useState(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const handleSubmitRating = async () => {
  setIsSubmittingRating(true);
  try {
    const { error } = await supabase.from('ratings').insert([{
      evaluator_role: 'معلمة',
      evaluator_name: user?.name || 'موظفة',
      target_role: 'سائق',
      target_name: targetDriver?.name || targetDriver?.driver_name || 'السائق',
      rating: ratingVal,
      comment: ratingNote.trim()
    }]);

    if (error) throw error;

    alert('✅ تم إرسال تقييمك بنجاح، شكراً لك!');
    setShowRatingModal(false);
  } catch (err) {
    alert('❌ حدث خطأ أثناء إرسال التقييم: ' + err.message);
  } finally {
    setIsSubmittingRating(false);
  }
};

  // 🔴 دالة تسجيل الخروج
  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  useEffect(() => {
    const fetchLatest = async () => {
      if (!employee?.id || !supabase) return;
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*, drivers(name, phone)')
          .eq('id', employee.id)
          .maybeSingle();

        if (!error && data) {
          setEmpData(data);
        }
      } catch (err) {
        console.error('Fetch employee error:', err);
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 5000);
    return () => clearInterval(interval);
  }, [employee?.id, supabase]);

  // دالة تبديل حالة الدوام (زر واحد: أنا لا أداوم)
  const toggleAttendance = async (status) => {
    if (isOfficialHoliday && !empData?.has_exception && status === true) {
      alert('عذراً، اليوم عطلة رسمية ولا يمكنك التسجيل كـ مداومة إلا باستثناء خاص من الإدارة.');
      return;
    }
    if (!supabase || (!empData?.phone && !user?.phone)) return;

    setLoadingToggle(true);
    try {
      const { error } = await supabase
        .from('employees')
        .update({ attending_status: status })
        .eq('phone', empData?.phone || user?.phone);

      if (error) {
        console.error('Update error:', error);
        alert('حدث خطأ أثناء التحديث: ' + error.message);
        return;
      }

      setEmpData((prev) => ({ ...prev, attending_status: status }));
    } catch (err) {
      console.error('Toggle error:', err);
    } finally {
      setLoadingToggle(false);
    }
  };

  if (!empData) return null;

  // استخراج بيانات السائق بشكل آمن سواء كانت Object أو Array أو null
  const driverInfo = Array.isArray(empData.drivers) 
    ? empData.drivers[0] 
    : (empData.drivers || null);

  // حالة الدوام الحالية (إذا كانت غير معرفة تعتبر true أي مداومة افتراضياً)
  const isAttending = empData.attending_status !== false;

  return (
    <div className="min-h-screen bg-[#0b1329] text-white p-4 dir-rtl pb-24 font-sans">
      
      {/* 🔴 الشعار في الأعلى (Masar X Header) */}
      <div className="flex justify-center mb-6 pt-2">
        <img src="/logo.png" alt="مسار إكس" className="h-16 object-contain" />
      </div>

      <div className="max-w-md mx-auto space-y-4">

        {/* 💳 كارت البيانات الشخصية والاشتراك */}
        <div className="bg-[#162238] border border-[#233554] rounded-2xl p-5 shadow-xl space-y-4">
          
          <div className="flex justify-between items-center border-b border-[#233554] pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">{empData.name}</h2>
              <p className="text-xs text-gray-400">المدرسة: {empData.school_name || 'غير محدد'}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold">
                اشتراك فعال ✅
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer"
              >
                🚪 خروج
              </button>
            </div>
          </div>

          {/* تفاصيل الاشتراك */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 bg-[#0b1329] p-3 rounded-xl border border-[#233554]">
            <div><b>بداية الاشتراك:</b> {empData.subscription_start_date || 'غير محدد'}</div>
            <div><b>انتهاء الاشتراك:</b> {empData.subscription_end_date || 'غير محدد'}</div>
            <div><b>أوقات الدوام:</b> {empData.work_hours || 'غير محدد'}</div>
            <div><b>أيام الدوام:</b> {empData.work_days || 'غير محدد'}</div>
          </div>

          {/* معلومات السائق والواتساب */}
          {driverInfo ? (
            <div className="flex justify-between items-center bg-[#0b1329] p-3 rounded-xl border border-[#233554]">
              <div>
                <span className="text-xs text-gray-400 block">السائق المكلف:</span>
                <span className="text-sm font-bold text-[#f97316]">{driverInfo.name}</span>
                <span className="text-xs text-gray-400 block dir-ltr text-right">{driverInfo.phone}</span>
              </div>

              <button
                onClick={() => openWhatsApp(driverInfo.phone)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                💬 واتساب السائق
              </button>
             {/* زر تقييم السائق */}
<button
  onClick={() => {
    setTargetDriver(driverInfo);
    setRatingVal(5);
    setRatingNote('');
    setShowRatingModal(true);
  }}
  className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-2 rounded-xl font-bold transition-all shadow-md mt-2 flex items-center justify-center gap-1"
>
  ⭐ تقييم السائق
</button>
              <button
  onClick={() => {
    if (!navigator.geolocation) {
      alert('المتصفح لا يدعم تحديد الموقع الجغرافي.');
      return;
    }

    // 🔍 البحث الشامل عن هوية الموظفة في كافة المتغيرات والمفاتيح
    let targetId = null;
    let targetPhone = null;
    let targetName = null;

    // 1️⃣ فحص كائنات البيانات المحتملة في الصفحة
    const possibleObjects = [
      typeof user !== 'undefined' ? user : null,
      typeof currentUser !== 'undefined' ? currentUser : null,
      typeof employee !== 'undefined' ? employee : null,
      typeof employeeData !== 'undefined' ? employeeData : null,
      typeof emp !== 'undefined' ? emp : null
    ];

    for (const obj of possibleObjects) {
      if (obj) {
        if (obj.id || obj.emp_id) targetId = obj.id || obj.emp_id;
        if (obj.phone) targetPhone = obj.phone;
        if (obj.name) targetName = obj.name;
        if (targetId || targetPhone || targetName) break;
      }
    }

    // 2️⃣ فحص جميع المفاتيح المحتملة في الـ localStorage
    if (!targetId && !targetPhone && !targetName) {
      const storageKeys = ['maser_currentUser', 'maser_user', 'maser_employee', 'currentUser', 'user', 'employee'];
      for (const key of storageKeys) {
        try {
          const val = localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed) {
              targetId = parsed.id || parsed.emp_id;
              targetPhone = parsed.phone;
              targetName = parsed.name;
              if (targetId || targetPhone || targetName) break;
            }
          }
        } catch (e) {}
      }
    }

    alert('جاري تحديد موقعك الجغرافي، يرجى السماح بالوصول للموقع (GPS)...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        if (!supabase) {
          alert('❌ تعذر الاتصال بقاعدة البيانات.');
          return;
        }

        let query = supabase.from('employees').update({ location_url: mapUrl });

        // تطابق بشرط الحقل المتوفر أو التحديث المباشر للموظفة الحالية
        if (targetId) {
          query = query.eq('id', targetId);
        } else if (targetPhone) {
          query = query.eq('phone', targetPhone);
        } else if (targetName) {
          query = query.eq('name', targetName);
        } else {
          // خطة احتياطية لجلب أول سجل موجود في جدول الموظفات وتحديثه
          const { data: allEmps } = await supabase.from('employees').select('id');
          if (allEmps && allEmps.length > 0) {
            query = query.eq('id', allEmps[0].id);
          } else {
            alert('⚠️ لم يتم العثور على أي موظفة في قاعدة البيانات.');
            return;
          }
        }

        const { data, error } = await query.select();

        if (error) {
          alert('❌ خطأ أثناء الحفظ: ' + error.message);
        } else if (!data || data.length === 0) {
          alert('⚠️ تعذر تحديث الموقع. تأكدي من وجود الموظفة في الجدول.');
        } else {
          alert('✅ تم حفظ موقع منزلِك بنجاح! يمكن للسائق الآن رؤيته.');
        }
      },
      (err) => {
        alert('⚠️ يرجى تفعيل الـ GPS والسماح للمتصفح بقراءة الموقع.');
      },
      { enableHighAccuracy: true }
    );
  }}
  className="bg-sky-600 hover:bg-sky-500 text-white text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md mt-2 w-full justify-center"
>
  📍 تحديد موقع المنزل
</button>
              
            </div>
          ) : (
            <div className="bg-[#0b1329] border border-[#233554] p-3 rounded-xl text-xs text-[#f97316] text-center font-semibold">
              لم يتم تعيين سائق لكِ بعد من قبل الإدارة.
            </div>
          )}
        </div>

        {/* 🚦 كارت حالة الدوام اليومي (زر واحد فقط: أنا لا أداوم) */}
        <div className="bg-[#162238] border border-[#233554] rounded-2xl p-5 shadow-xl space-y-3 text-center">
          <h3 className="text-sm font-bold text-gray-300">حالة رحلة الذهاب والدوام اليوم</h3>
          
          {isOfficialHoliday && !empData.has_exception && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl">
              ⚠️ اليوم عطلة رسمية. تم إيقاف تغيير الحالة تلقائياً.
            </div>
          )}

          <div className="pt-1">
            {isAttending ? (
              <button
                onClick={() => toggleAttendance(false)}
                disabled={loadingToggle}
                className="w-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500 text-red-400 font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingToggle ? 'جاري التحديث...' : '✖️ أنا لا أداوم اليوم'}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs py-2 px-3 rounded-xl font-bold">
                  تم تسجيل غيابك اليوم (لن يتم شمولك بالرحلة عند السائق)
                </div>
                <button
                  onClick={() => toggleAttendance(true)}
                  disabled={loadingToggle}
                  className="w-full bg-emerald-600/20 border border-emerald-500 text-emerald-400 hover:bg-emerald-600/30 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {loadingToggle ? 'جاري التحديث...' : '🔄 التراجع والتسجيل كـ مداومة'}
                </button>
              </div>
            )}
          </div>
          
          <p className="text-[11px] text-gray-400 pt-1">
            * الافتراضي من الأحد للخميس أنكِ تداومين، يُضغط هذا الزر فقط في حال عدم الدوام لإبلاغ السائق تلقائياً.
          </p>
        </div>

      </div>
      {/* نافذة تقييم السائق التفاعلية */}
{showRatingModal && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '16px'
  }}>
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      direction: 'rtl'
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: '#0f172a', textAlign: 'center' }}>
        ⭐ تقييم السائق ({targetDriver?.name || 'السائق'})
      </h3>

      {/* اختيار عدد النجوم */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRatingVal(star)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              filter: star <= ratingVal ? 'none' : 'grayscale(100%) opacity(0.3)',
              transform: star <= ratingVal ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.15s ease'
            }}
          >
            ⭐
          </button>
        ))}
      </div>

      {/* حقل الملاحظة الاختياري */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
          ✍️ ملاحظة أو انطباع (اختياري):
        </label>
        <textarea
          rows="3"
          value={ratingNote}
          onChange={(e) => setRatingNote(e.target.value)}
          placeholder="اكتبي أي ملاحظة ترغبين بإيصالها هنا..."
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            color: '#000000',
            outline: 'none',
            resize: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* أزرار الإجراءات */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSubmitRating}
          disabled={isSubmittingRating}
          style={{
            flex: 1,
            backgroundColor: '#f59e0b',
            color: '#ffffff',
            border: 'none',
            padding: '10px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {isSubmittingRating ? 'جاري الإرسال...' : 'إرسال التقييم'}
        </button>
        <button
          onClick={() => setShowRatingModal(false)}
          disabled={isSubmittingRating}
          style={{
            flex: 1,
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: 'none',
            padding: '10px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          إلغاء
        </button>
      </div>
    </div>
  </div>
)}
      {/* كارت الدعم الفني باللون الكحلي المطابق */}
      <div style={{
        backgroundColor: '#162238',
        border: '1px solid #233554',
        borderRadius: '16px',
        padding: '20px 16px',
        marginTop: '16px',
        textAlign: 'center',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          fontSize: '15px',
          fontWeight: 'bold',
          color: '#f8fafc',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span>🎧</span> إذا واجهتك أي مشكلة، تواصل مع الدعم الفني:
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {/* الرقم الأول (الأخضر) */}
          <a
            href="https://wa.me/9647888978111"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '8px 18px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            07888978111 💬
          </a>

          {/* الرقم الثاني (الرمادي الفاتح) */}
          <a
            href="https://wa.me/9647750074100"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#e2e8f0',
              padding: '8px 18px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            07750074100 💬
          </a>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3️⃣ لوحة إدارة الموظفات في الإدارة (Admin View)
// ==========================================
export function AdminEmployeeManagement({ supabase }) {
  const [employees, setEmployees] = useState([]);
  const [renewModalData, setRenewModalData] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

 const [formData, setFormData] = useState({
  name: '',
  phone: '',
  password: '',
  address: '',
  school_name: '',
  morning_days: [],
  morning_time: '8:00 ص - 12:00 ظ',
  evening_days: [],
  evening_time: '2:00 ظ - 6:00 م',
  subscription_price: 0,
  payment_status: 'unpaid',
  subscription_start_date: '',
  subscription_end_date: '',
  driver_id: '',
  has_exception: false,
});
  
// 1. تحديد الأيام للصباحي/المسائي
const toggleDay = (type, day) => {
  const key = type === 'morning' ? 'morning_days' : 'evening_days';
  const currentDays = Array.isArray(formData[key]) ? formData[key] : [];
  if (currentDays.includes(day)) {
    setFormData({ ...formData, [key]: currentDays.filter((d) => d !== day) });
  } else {
    setFormData({ ...formData, [key]: [...currentDays, day] });
  }
};

// 2. حساب تاريخ الانتهاء تلقائياً عند اختيار تاريخ البدء (+ شهر)
const handleStartDateChange = (val) => {
  let calculatedEnd = '';
  if (val) {
    const d = new Date(val);
    d.setMonth(d.getMonth() + 1);
    calculatedEnd = d.toISOString().split('T')[0];
  }
  setFormData({
    ...formData,
    subscription_start_date: val,
    subscription_end_date: calculatedEnd,
  });
};

// 3. تأكيد تجديد الاشتراك
const handleConfirmRenewal = async () => {
  if (!renewModalData || !supabase) return;

  let baseDate = renewModalData.subscription_end_date
    ? new Date(renewModalData.subscription_end_date)
    : (renewModalData.subscription_start_date ? new Date(renewModalData.subscription_start_date) : new Date());

  baseDate.setMonth(baseDate.getMonth() + 1);
  const newEndDateStr = baseDate.toISOString().split('T')[0];

  try {
    const { error } = await supabase
      .from('employees')
      .update({
        subscription_end_date: newEndDateStr,
        payment_status: 'paid',
      })
      .eq('id', renewModalData.id);

    if (!error) {
      setRenewModalData(null);
      loadData();
    } else {
      alert('حدث خطأ أثناء التجديد: ' + error.message);
    }
  } catch (err) {
    console.error('Renewal error:', err);
  }
};

  const activeSelectedDays = formData.work_days
    ? formData.work_days.split(', ').map((d) => d.trim())
    : [];
  const loadData = async () => {
    if (!supabase) return setLoading(false);
    setLoading(true);
    try {
      const { data: empData, error: empErr } = await supabase
        .from('employees')
        .select('*, drivers(name)')
        .order('created_at', { ascending: false });

      const { data: drvData, error: drvErr } = await supabase
        .from('drivers')
        .select('id, name');

      setEmployees(Array.isArray(empData) && !empErr ? empData : []);
      setDrivers(Array.isArray(drvData) && !drvErr ? drvData : []);
    } catch (err) {
      console.error('Load admin data error:', err);
      setEmployees([]);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [supabase]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!supabase) return;

  // إرسال الأيام كمصفوفة (Array) متوافقة مع نوع العمود في Supabase
  const payload = {
    name: formData.name,
    phone: formData.phone,
    password: formData.password || null,
    address: formData.address || null,
    school_name: formData.school_name || null,
    morning_days: Array.isArray(formData.morning_days) ? formData.morning_days : [],
    morning_time: formData.morning_time || null,
    evening_days: Array.isArray(formData.evening_days) ? formData.evening_days : [],
    evening_time: formData.evening_time || null,
    subscription_price: Number(formData.subscription_price) || 0,
    payment_status: formData.payment_status || 'unpaid',
    subscription_start_date: formData.subscription_start_date || null,
    subscription_end_date: formData.subscription_end_date || null,
    driver_id: formData.driver_id ? Number(formData.driver_id) : null,
    has_exception: Boolean(formData.has_exception),
  };

  try {
    if (editingId) {
      const { error } = await supabase.from('employees').update(payload).eq('id', editingId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('employees').insert([payload]);
      if (error) throw error;
    }

    setShowModal(false);
    resetForm();
    loadData();
    alert('تم حفظ بيانات الموظفة بنجاح ✅');
  } catch (err) {
    console.error('Submit employee error:', err);
    alert('فشل الحفظ: ' + (err.message || 'يرجى التأكد من البيانات'));
  }
};

const handleEdit = (emp) => {
  setEditingId(emp.id);
  const mDays = emp.morning_days ? (typeof emp.morning_days === 'string' ? emp.morning_days.split(', ') : emp.morning_days) : [];
  const eDays = emp.evening_days ? (typeof emp.evening_days === 'string' ? emp.evening_days.split(', ') : emp.evening_days) : [];

  setFormData({
    name: emp.name || '',
    phone: emp.phone || '',
    password: emp.password || '',
    address: emp.address || '',
    school_name: emp.school_name || '',
    morning_days: mDays,
    morning_time: emp.morning_time || '8:00 ص - 12:00 ظ',
    evening_days: eDays,
    evening_time: emp.evening_time || '2:00 ظ - 6:00 م',
    subscription_price: emp.subscription_price || 0,
    payment_status: emp.payment_status || 'unpaid',
    subscription_start_date: emp.subscription_start_date || '',
    subscription_end_date: emp.subscription_end_date || '',
    driver_id: emp.driver_id || '',
    has_exception: emp.has_exception || false,
  });
  setShowModal(true);
};

// 3. التصفير
const resetForm = () => {
  setEditingId(null);
  const today = new Date().toISOString().split('T')[0];
  const defaultEnd = new Date();
  defaultEnd.setMonth(defaultEnd.getMonth() + 1);

  setFormData({
    name: '',
    phone: '',
    password: '',
    address: '',
    school_name: '',
    morning_days: [],
    morning_time: '8:00 ص - 12:00 ظ',
    evening_days: [],
    evening_time: '2:00 ظ - 6:00 م',
    subscription_price: 0,
    payment_status: 'unpaid',
    subscription_start_date: today,
    subscription_end_date: defaultEnd.toISOString().split('T')[0],
    driver_id: '',
    has_exception: false,
  });
};
  
  return (
    <div className="p-4 space-y-4 dir-rtl text-right font-sans">
      <div className="flex justify-between items-center bg-[#162238] border border-[#233554] p-4 rounded-xl shadow-md text-white">
        <h2 className="font-extrabold text-[#f97316] text-lg">👩‍🏫 إدارة الموظفات والمعلمات</h2>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-[#f97316] hover:bg-[#ea580c] text-white text-xs px-4 py-2.5 rounded-xl font-bold shadow-md transition-all cursor-pointer"
        >
          + إضافة موظفة جديدة
        </button>
      </div>

      <div className="bg-[#162238] border border-[#233554] rounded-xl shadow-md overflow-x-auto text-white">
        <table className="w-full text-xs text-right border-collapse">
  <thead>
    <tr className="bg-[#0b1329] border-b border-[#233554] text-gray-300">
      <th className="p-3">اسم الموظفة</th>
      <th className="p-3">رقم الهاتف</th>
      <th className="p-3">المدرسة / السكن</th>
      <th className="p-3">أوقات الدوام</th>
      <th className="p-3">تاريخ الانتهاء</th>
      <th className="p-3">سعر الاشتراك</th>
      <th className="p-3">حالة الدفع</th>
      <th className="p-3">السائق المكلف</th>
      <th className="p-3 text-center">التحكم والتوزيع</th>
    </tr>
  </thead>
  <tbody>
    {loading ? (
      <tr>
        <td colSpan="9" className="p-4 text-center text-gray-400">جاري التحميل...</td>
      </tr>
    ) : Array.isArray(employees) && employees.length > 0 ? (
      employees.map((emp) => {
        const driverObj = Array.isArray(emp.drivers) ? emp.drivers[0] : emp.drivers;
        const endDate = emp.subscription_end_date;
        const isExpired = endDate && new Date() > new Date(endDate);

        return (
          <tr key={emp.id} className="border-b border-[#233554] hover:bg-[#0b1329]/50 transition-colors">
            <td className="p-3 font-bold text-white">{emp.name}</td>
            <td className="p-3 text-gray-300">{emp.phone}</td>
            <td className="p-3 text-gray-300">{emp.school_name} - {emp.address}</td>
            <td className="p-3 space-y-1">
              {emp.morning_days && (
                <div className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  ☀️ <b>صباحي:</b> ({emp.morning_days}) 🕒 {emp.morning_time}
                </div>
              )}
              {emp.evening_days && (
                <div className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  🌙 <b>مسائي:</b> ({emp.evening_days}) 🕒 {emp.evening_time}
                </div>
              )}
              {!emp.morning_days && !emp.evening_days && (
                <span className="text-gray-500">غير محدد</span>
              )}
            </td>
            <td className="p-3 font-mono font-bold text-emerald-400">
              {endDate || 'غير محدد'}
            </td>
            <td className="p-3 font-bold text-[#f97316]">{Number(emp.subscription_price || 0).toLocaleString()} د.ع</td>
            <td className="p-3">
              {isExpired ? (
                <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2 py-1 rounded text-xs font-bold">
                  منتهي (مغلق) 🔒
                </span>
              ) : (
                <span className={`px-2 py-1 rounded text-xs font-bold ${emp.payment_status === 'paid' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'}`}>
                  {emp.payment_status === 'paid' ? 'مدفوع ✅' : 'غير مدفوع ❌'}
                </span>
              )}
            </td>
            <td className="p-3 text-amber-400 font-semibold">{driverObj?.name || 'غير محدد'}</td>
            <td className="p-3 flex items-center justify-center gap-1">
              <button 
                onClick={() => setRenewModalData(emp)} 
                className="bg-purple-600/30 border border-purple-500/50 text-purple-300 hover:bg-purple-600/50 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
              >
                🔄 تجديد
              </button>
              <button onClick={() => handleEdit(emp)} className="bg-blue-500/20 border border-blue-500/40 text-blue-300 px-2.5 py-1 rounded-lg font-bold hover:bg-blue-500/30 cursor-pointer">تعديل</button>
              <button onClick={() => handleDelete(emp.id)} className="bg-red-500/20 border border-red-500/40 text-red-300 px-2.5 py-1 rounded-lg font-bold hover:bg-red-500/30 cursor-pointer">حذف</button>
            </td>
          </tr>
        );
      })
    ) : (
      <tr>
        <td colSpan="9" className="p-4 text-center text-gray-400">لا توجد موظفات مسجلات حالياً.</td>
      </tr>
    )}
  </tbody>
</table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#162238] border border-[#233554] text-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <h3 className="font-bold text-[#f97316] text-lg">{editingId ? 'تعديل موظفة وتوزيع السائق' : 'إضافة موظفة جديدة'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block mb-1 font-bold text-gray-300">اسم الموظفة</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 bg-[#0b1329] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#f97316]" />
              </div>
              <div>
                <label className="block mb-1 font-bold text-gray-300">رقم الموبايل</label>
                <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 bg-[#0b1329] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#f97316]" />
              </div>
              <div>
                <label className="block mb-1 font-bold text-gray-300">كلمة السر</label>
                <input required type="text" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-2.5 bg-[#0b1329] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#f97316]" />
              </div>
              <div>
                <label className="block mb-1 font-bold text-gray-300">عنوان السكن</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full p-2.5 bg-[#0b1329] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#f97316]" />
              </div>
              <div>
                <label className="block mb-1 font-bold text-gray-300">اسم المدرسة</label>
                <input type="text" value={formData.school_name} onChange={(e) => setFormData({...formData, school_name: e.target.value})} className="w-full p-2.5 bg-[#0b1329] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#f97316]" />
              </div>
        {/* ☀️ دوام صباحي */}
<div className="col-span-2 bg-[#0b1329] p-3 rounded-xl border border-amber-500/30 space-y-2">
  <label className="font-bold text-amber-400 text-xs block">☀️ أيام وأوقات الدوام الصباحي:</label>
  <div className="flex gap-1 flex-wrap">
    {DAYS_OF_WEEK.map((day) => {
      const isSel = Array.isArray(formData.morning_days) && formData.morning_days.includes(day);
      return (
        <button
          type="button"
          key={`m-${day}`}
          onClick={() => toggleDay('morning', day)}
          className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
            isSel ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-[#162238] text-gray-400 border-[#233554]'
          }`}
        >
          {isSel ? '✓' : '+'} {day}
        </button>
      );
    })}
  </div>
  <input
    type="text"
    placeholder="وقت الدوام الصباحي (مثلاً: 8:00 ص - 12:00 ظ)"
    value={formData.morning_time}
    onChange={(e) => setFormData({ ...formData, morning_time: e.target.value })}
    className="w-full p-2 bg-[#162238] border border-[#233554] rounded-lg text-white text-xs"
  />
</div>

{/* 🌙 دوام مسائي */}
<div className="col-span-2 bg-[#0b1329] p-3 rounded-xl border border-purple-500/30 space-y-2">
  <label className="font-bold text-purple-400 text-xs block">🌙 أيام وأوقات الدوام المسائي:</label>
  <div className="flex gap-1 flex-wrap">
    {DAYS_OF_WEEK.map((day) => {
      const isSel = Array.isArray(formData.evening_days) && formData.evening_days.includes(day);
      return (
        <button
          type="button"
          key={`e-${day}`}
          onClick={() => toggleDay('evening', day)}
          className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
            isSel ? 'bg-purple-600 text-white border-purple-400' : 'bg-[#162238] text-gray-400 border-[#233554]'
          }`}
        >
          {isSel ? '✓' : '+'} {day}
        </button>
      );
    })}
  </div>
  <input
    type="text"
    placeholder="وقت الدوام المسائي (مثلاً: 2:00 ظ - 6:00 م)"
    value={formData.evening_time}
    onChange={(e) => setFormData({ ...formData, evening_time: e.target.value })}
    className="w-full p-2 bg-[#162238] border border-[#233554] rounded-lg text-white text-xs"
  />
</div>
              <div>
                <label className="block mb-1 font-bold text-gray-300">سعر الاشتراك</label>
                <input type="number" value={formData.subscription_price} onChange={(e) => setFormData({...formData, subscription_price: e.target.value})} className="w-full p-2.5 bg-[#0b1329] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#f97316]" />
              </div>
              <div>
                <label className="block mb-1 font-bold text-gray-300">حالة الاشتراك</label>
                <select value={formData.payment_status} onChange={(e) => setFormData({...formData, payment_status: e.target.value})} className="w-full p-2.5 bg-[#0b1329] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#f97316]">
                  <option value="unpaid">غير مدفوع (مغلق)</option>
                  <option value="paid">مدفوع (مفتوح)</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-bold text-gray-300">توزيع السائق المكلف</label>
                <select value={formData.driver_id} onChange={(e) => setFormData({...formData, driver_id: e.target.value})} className="w-full p-2.5 bg-[#0b1329] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#f97316]">
                  <option value="">بدون سائق</option>
                  {Array.isArray(drivers) && drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              {/* التواريخ المحدثة تلقائياً */}
<div>
  <label className="block mb-1 font-bold text-gray-300">تاريخ البداية</label>
  <input 
    type="date" 
    value={formData.subscription_start_date} 
    onChange={(e) => handleStartDateChange(e.target.value)} 
    className="w-full p-2.5 bg-[#0b1329] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#f97316]" 
  />
</div>
<div>
  <label className="block mb-1 font-bold text-gray-300">تاريخ الانتهاء (+شهر تلقائياً)</label>
  <input 
    type="date" 
    value={formData.subscription_end_date} 
    onChange={(e) => setFormData({...formData, subscription_end_date: e.target.value})} 
    className="w-full p-2.5 bg-[#0b1329] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#f97316]" 
  />
</div>
              <div className="col-span-2 flex items-center gap-2 pt-2">
                <input type="checkbox" id="ex" checked={formData.has_exception} onChange={(e) => setFormData({...formData, has_exception: e.target.checked})} className="accent-[#f97316]" />
                <label htmlFor="ex" className="font-bold text-[#f97316]">منح استثناء للدوام في العطل الرسمية</label>
              </div>

              <div className="col-span-2 flex justify-end gap-2 pt-3 border-t border-[#233554]">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-xl font-bold cursor-pointer">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-orange-500/20">حفظ البيانات</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* نافذة تأكيد التجديد */}
{renewModalData && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 dir-rtl">
    <div className="bg-[#162238] border border-purple-500/40 rounded-2xl p-6 w-full max-w-md text-center space-y-4 shadow-2xl">
      <h3 className="text-lg font-bold text-purple-400">🔄 تأكيد تجديد الاشتراك الشهري</h3>
      <p className="text-xs text-gray-300 leading-relaxed">
        هل أنتِ متاكدة من تجديد الاشتراك لمدة شهر إضافي للموظفة:{' '}
        <span className="font-bold text-[#f97316]">{renewModalData.name}</span>؟
      </p>
      <div className="bg-[#0b1329] p-3 rounded-xl border border-[#233554] text-xs text-gray-400 space-y-1 text-right">
        <div>
          تاريخ الانتهاء الحالي:{' '}
          <span className="text-white font-bold">{renewModalData.subscription_end_date || 'غير محدد'}</span>
        </div>
        <div>
          تاريخ الانتهاء الجديد:{' '}
          <span className="text-emerald-400 font-bold">
            {(() => {
              let d = renewModalData.subscription_end_date
                ? new Date(renewModalData.subscription_end_date)
                : new Date();
              d.setMonth(d.getMonth() + 1);
              return d.toISOString().split('T')[0];
            })()}
          </span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleConfirmRenewal}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-purple-600/20 text-xs"
        >
          نعم، تأكيد التجديد
        </button>
        <button
          onClick={() => setRenewModalData(null)}
          className="bg-gray-700/50 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-xl border border-gray-600 text-xs cursor-pointer"
        >
          إلغاء
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

// ==========================================
// 4️⃣ تبويب اشتراك الموظفات في واجهة السائق
// ==========================================
export function DriverEmployeeTab({ driver, supabase }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // استخراج المعرّف بشكل آمن
  const driverId = driver?.id || (typeof driver === 'number' || typeof driver === 'string' ? driver : null);

  useEffect(() => {
    if (!supabase || !driverId) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    const fetchEmp = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('driver_id', driverId)
          .eq('payment_status', 'paid')
          .eq('attending_status', true); // يستبعد الموظفة التي سجلت غياباً

        if (error || !Array.isArray(data)) {
          setEmployees([]);
        } else {
          setEmployees(data);
        }
      } catch (err) {
        console.error('Fetch driver employees error:', err);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmp();
    const interval = setInterval(fetchEmp, 5000);
    return () => clearInterval(interval);
  }, [driverId, supabase]);

  if (loading) return <div className="p-6 text-center text-xs text-gray-400">جاري التحميل...</div>;

  if (!Array.isArray(employees) || employees.length === 0) {
    return (
      <div className="p-8 text-center dir-rtl font-sans">
        <div className="bg-[#162238] border border-[#233554] text-white rounded-2xl p-6 space-y-2 shadow-xl">
          <span className="text-3xl">🚫</span>
          <h3 className="font-bold text-sm text-[#f97316]">لا توجد موظفات حاضرة حالياً</h3>
          <p className="text-xs text-gray-300">لم يتم تخصيص موظفات مدفوعات الاشتراك وحاضرات اليوم لحافلتك.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 dir-rtl text-right pb-20 font-sans">
      <h2 className="font-extrabold text-[#f97316] text-sm mb-2">
        🚍 قائمة الموظفات الحاضرات لحافلتك اليوم ({employees.length})
      </h2>

      {employees.map((emp) => {
        const isAttending = emp.attending_status !== false;
        const cleanPhone = emp.phone ? emp.phone.replace(/[^0-9]/g, '') : '';

        return (
          <div key={emp.id} className="bg-[#162238] p-4 rounded-2xl border border-[#233554] text-white space-y-3 shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm">{emp.name}</h3>
                <p className="text-xs text-gray-400">{emp.school_name || 'بدون مدرسة'} - {emp.address || 'بدون عنوان'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${isAttending ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'}`}>
                {isAttending ? '✅ تداوم اليوم' : '❌ لا تداوم اليوم'}
              </span>
            </div>

            {/* عرض أوقات الدوام الصباحي والمسائي المحدثة */}
            <div className="text-xs text-gray-300 bg-[#0b1329] p-3 rounded-xl border border-[#233554] space-y-1.5">
              {emp.morning_days && (
                <div className="text-amber-300 font-medium">
                  ☀️ <b>صباحي:</b> ({emp.morning_days}) 🕒 {emp.morning_time}
                </div>
              )}
              {emp.evening_days && (
                <div className="text-purple-300 font-medium">
                  🌙 <b>مسائي:</b> ({emp.evening_days}) 🕒 {emp.evening_time}
                </div>
              )}
              {!emp.morning_days && !emp.evening_days && (
                <div className="grid grid-cols-2 gap-1 text-gray-400">
                  <div>ساعات الدوام: <b className="text-white">{emp.work_hours || '-'}</b></div>
                  <div>الأيام: <b className="text-white">{emp.work_days || '-'}</b></div>
                </div>
              )}
            </div>

            {/* أزرار الاتصال والواتساب المباشر */}
            <div className="flex gap-2 pt-1">
              <a
                href={`tel:${emp.phone}`}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all"
              >
                📞 اتصال
              </a>
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all"
              >
                💬 واتساب ({emp.phone})
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
