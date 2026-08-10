import React, { useState, useEffect } from 'react';

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
    </div>
  );
}

// ==========================================
// 3️⃣ لوحة إدارة الموظفات في الإدارة (Admin View)
// ==========================================
export function AdminEmployeeManagement({ supabase }) {
  const [employees, setEmployees] = useState([]);
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
    work_days: '',
    work_hours: '',
    subscription_price: 0,
    payment_status: 'unpaid',
    subscription_start_date: '',
    subscription_end_date: '',
    driver_id: '',
    has_exception: false,
  });

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

    const payload = {
      ...formData,
      subscription_price: Number(formData.subscription_price) || 0,
      driver_id: formData.driver_id || null,
    };

    try {
      if (editingId) {
        await supabase.from('employees').update(payload).eq('id', editingId);
      } else {
        await supabase.from('employees').insert(payload);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Submit employee error:', err);
    }
  };

  const handleEdit = (emp) => {
    setEditingId(emp.id);
    setFormData({
      name: emp.name || '',
      phone: emp.phone || '',
      password: emp.password || '',
      address: emp.address || '',
      school_name: emp.school_name || '',
      work_days: emp.work_days || '',
      work_hours: emp.work_hours || '',
      subscription_price: emp.subscription_price || 0,
      payment_status: emp.payment_status || 'unpaid',
      subscription_start_date: emp.subscription_start_date || '',
      subscription_end_date: emp.subscription_end_date || '',
      driver_id: emp.driver_id || '',
      has_exception: emp.has_exception || false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!supabase || !confirm('هل أنت موافق على حذف هذه الموظفة؟')) return;
    try {
      await supabase.from('employees').delete().eq('id', id);
      loadData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      phone: '',
      password: '',
      address: '',
      school_name: '',
      work_days: '',
      work_hours: '',
      subscription_price: 0,
      payment_status: 'unpaid',
      subscription_start_date: '',
      subscription_end_date: '',
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
              <th className="p-3">سعر الاشتراك</th>
              <th className="p-3">حالة الدفع</th>
              <th className="p-3">السائق المكلف</th>
              <th className="p-3">التحكم والتوزيع</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-400">جاري التحميل...</td>
              </tr>
            ) : Array.isArray(employees) && employees.length > 0 ? (
              employees.map((emp) => {
                const driverObj = Array.isArray(emp.drivers) ? emp.drivers[0] : emp.drivers;
                return (
                  <tr key={emp.id} className="border-b border-[#233554] hover:bg-[#0b1329]/50 transition-colors">
                    <td className="p-3 font-bold text-white">{emp.name}</td>
                    <td className="p-3 text-gray-300">{emp.phone}</td>
                    <td className="p-3 text-gray-300">{emp.school_name} - {emp.address}</td>
                    <td className="p-3 font-bold text-[#f97316]">{Number(emp.subscription_price || 0).toLocaleString()} د.ع</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${emp.payment_status === 'paid' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'}`}>
                        {emp.payment_status === 'paid' ? 'مدفوع ✅' : 'غير مدفوع ❌'}
                      </span>
                    </td>
                    <td className="p-3 text-amber-400 font-semibold">{driverObj?.name || 'غير محدد'}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleEdit(emp)} className="bg-blue-500/20 border border-blue-500/40 text-blue-300 px-3 py-1 rounded-lg font-bold hover:bg-blue-500/30 cursor-pointer">تعديل / توزيع</button>
                      <button onClick={() => handleDelete(emp.id)} className="bg-red-500/20 border border-red-500/40 text-red-300 px-3 py-1 rounded-lg font-bold hover:bg-red-500/30 cursor-pointer">حذف</button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-400">لا توجد موظفات مسجلات حالياً.</td>
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
              <div>
                <label className="block mb-1 font-bold text-gray-300">أوقات الدوام (مثلاً 8 ص - 2 ظ)</label>
                <input type="text" value={formData.work_hours} onChange={(e) => setFormData({...formData, work_hours: e.target.value})} className="w-full p-2.5 bg-[#0b1329] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#f97316]" />
              </div>
              <div>
                <label className="block mb-1 font-bold text-gray-300">كم يوم بالأسبوع</label>
                <input type="text" value={formData.work_days} onChange={(e) => setFormData({...formData, work_days: e.target.value})} className="w-full p-2.5 bg-[#0b1329] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#f97316]" />
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
              <div>
                <label className="block mb-1 font-bold text-gray-300">تاريخ البداية</label>
                <input type="date" value={formData.subscription_start_date} onChange={(e) => setFormData({...formData, subscription_start_date: e.target.value})} className="w-full p-2.5 bg-[#0b1329] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#f97316]" />
              </div>
              <div>
                <label className="block mb-1 font-bold text-gray-300">تاريخ الانتهاء</label>
                <input type="date" value={formData.subscription_end_date} onChange={(e) => setFormData({...formData, subscription_end_date: e.target.value})} className="w-full p-2.5 bg-[#0b1329] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#f97316]" />
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
    </div>
  );
}

// ==========================================
// 4️⃣ تبويب اشتراك الموظفات في واجهة السائق
// ==========================================
export function DriverEmployeeTab({ driver, supabase }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driver?.id || !supabase) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    const fetchEmp = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('driver_id', driver.id)
          .eq('payment_status', 'paid');

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
  }, [driver?.id, supabase]);

  if (loading) return <div className="p-6 text-center text-xs text-gray-400">جاري التحميل...</div>;

  if (!Array.isArray(employees) || employees.length === 0) {
    return (
      <div className="p-8 text-center dir-rtl font-sans">
        <div className="bg-[#162238] border border-[#233554] text-white rounded-2xl p-6 space-y-2 shadow-xl">
          <span className="text-3xl">🚫</span>
          <h3 className="font-bold text-sm text-[#f97316]">أنت غير مسجل بهذا النظام</h3>
          <p className="text-xs text-gray-300">لم يتم تخصيص أي موظفات أو معلمات لحافلتك حتى الآن من قبل الإدارة.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 dir-rtl text-right pb-20 font-sans">
      <h2 className="font-extrabold text-[#f97316] text-sm mb-2">
        🚍 قائمة الموظفات المعينات لحافلتك ({employees.length})
      </h2>

      {employees.map((emp) => {
        const isAttending = emp.attending_status !== false;
        return (
          <div key={emp.id} className="bg-[#162238] p-4 rounded-2xl border border-[#233554] text-white space-y-3 shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm">{emp.name}</h3>
                <p className="text-xs text-gray-400">{emp.school_name} - {emp.address}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${isAttending ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'}`}>
                {isAttending ? '✅ تداوم اليوم' : '❌ لا تداوم اليوم'}
              </span>
            </div>

            <div className="text-xs text-gray-300 bg-[#0b1329] p-2.5 rounded-xl border border-[#233554] grid grid-cols-2 gap-1">
              <div>ساعات الدوام: <b className="text-white">{emp.work_hours || '-'}</b></div>
              <div>الأيام: <b className="text-white">{emp.work_days || '-'}</b></div>
            </div>

            <button
              onClick={() => openWhatsApp(emp.phone)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              💬 التواصل عبر الواتساب ({emp.phone})
            </button>
          </div>
        );
      })}
    </div>
  );
}
