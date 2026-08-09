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

      onLoginSuccess(employee);
      onClose();
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 dir-rtl">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute left-4 top-4 text-gray-400 hover:text-gray-600">✕</button>
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">دخول الموظفات / المعلمات 👩‍🏫</h2>
        
        {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-3 text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">رقم الموبايل</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
              placeholder="07XXXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">كلمة السر</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-all"
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
export function EmployeeView({ employee, supabase, isOfficialHoliday }) {
  const [empData, setEmpData] = useState(employee);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // جلب أحدث بيانات للموظفة
    const fetchLatest = async () => {
      if (!employee?.id) return;
      const { data } = await supabase
        .from('employees')
        .select('*, drivers(name, phone)')
        .eq('id', employee.id)
        .maybeSingle();
      if (data) setEmpData(data);
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 4000);
    return () => clearInterval(interval);
  }, [employee?.id, supabase]);

  // جلب المحادثة مع السائق
  useEffect(() => {
    if (!empData?.driver_id || !empData?.id) return;
    const fetchChat = async () => {
      const { data } = await supabase
        .from('employee_messages')
        .select('*')
        .eq('employee_id', empData.id)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    };

    fetchChat();
    const chatInterval = setInterval(fetchChat, 3000);
    return () => clearInterval(chatInterval);
  }, [empData?.id, empData?.driver_id, supabase]);

  // تغيير حالة الدوام
  const toggleAttendance = async (status) => {
    if (isOfficialHoliday && !empData?.has_exception && status === true) {
      alert('عذراً، اليوم عطلة رسمية ولا يمكنك اختيار (أنا أداوم) إلا باستثناء خاص من الإدارة.');
      return;
    }

    const { error } = await supabase
      .from('employees')
      .update({ attending_status: status })
      .eq('id', empData.id);

    if (!error) {
      setEmpData((prev) => ({ ...prev, attending_status: status }));
    }
  };

  // إرسال رسالة للسائق
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !empData?.driver_id) return;

    await supabase.from('employee_messages').insert({
      employee_id: empData.id,
      driver_id: empData.driver_id,
      sender_type: 'employee',
      message: newMessage.trim(),
    });

    setNewMessage('');
  };

  const canAttend = !isOfficialHoliday || empData?.has_exception;

  if (!empData) return null;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4 dir-rtl pb-24 text-right">
      {/* 💳 بطاقة بيانات الاشتراك والمدرسة */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h2 className="text-lg font-extrabold text-gray-800">{empData.name}</h2>
            <p className="text-xs text-gray-500">المدرسة: {empData.school_name || 'غير محدد'}</p>
          </div>
          <span className="bg-emerald-50 text-emerald-600 text-xs px-3 py-1 rounded-full font-bold">
            اشتراك فعال ✅
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl">
          <div>تاريخ بداية الاشتراك: <b>{empData.subscription_start_date || 'غير محدد'}</b></div>
          <div>تاريخ انتهاء الاشتراك: <b>{empData.subscription_end_date || 'غير محدد'}</b></div>
          <div>أوقات الدوام: <b>{empData.work_hours || 'غير محدد'}</b></div>
          <div>أيام الدوام: <b>{empData.work_days || 'غير محدد'}</b></div>
        </div>

        {/* 📞 الاتصال بالسائق عبر الواتساب */}
        {empData.drivers ? (
          <div className="flex justify-between items-center bg-amber-50 p-3 rounded-xl border border-amber-100">
            <div>
              <p className="text-xs font-bold text-amber-900">السائق المكلف: {empData.drivers.name}</p>
              <p className="text-xs text-amber-700">{empData.drivers.phone}</p>
            </div>
            <button
              onClick={() => openWhatsApp(empData.drivers.phone)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-1 font-bold shadow-sm"
            >
              💬 واتساب السائق
            </button>
          </div>
        ) : (
          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">لم يتم تعيين سائق لكِ بعد من قبل الإدارة.</p>
        )}
      </div>

      {/* 🚌 رحلة الذهاب حالة الدوام */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 text-sm mb-3">حالة رحلة الذهاب والدوام اليوم</h3>
        
        {isOfficialHoliday && !empData.has_exception && (
          <div className="bg-rose-50 text-rose-600 text-xs p-3 rounded-xl mb-3">
            ⚠️ اليوم عطلة رسمية. تم إيقاف زر "أنا أداوم" تلقائياً.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => toggleAttendance(true)}
            disabled={!canAttend}
            className={`p-4 rounded-xl text-xs font-bold transition-all ${
              empData.attending_status
                ? 'bg-emerald-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            ✅ أنا أداوم
          </button>

          <button
            onClick={() => toggleAttendance(false)}
            className={`p-4 rounded-xl text-xs font-bold transition-all ${
              !empData.attending_status
                ? 'bg-rose-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ❌ أنا لا أداوم
          </button>
        </div>
      </div>

      {/* 💬 المحادثة المباشرة مع السائق */}
      {empData.drivers && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-bold text-gray-800 text-sm border-b pb-2">المحادثة مع السائق (تتمسح عند التصفير اليومي)</h3>
          
          <div className="h-40 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-xl text-xs">
            {!messages || messages.length === 0 ? (
              <p className="text-center text-gray-400 py-6">لا توجد رسائل بينكِ وبين السائق اليوم.</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl max-w-[80%] text-xs ${
                    m.sender_type === 'employee'
                      ? 'bg-amber-500 text-white mr-auto text-left'
                      : 'bg-white border text-gray-800 ml-auto text-right'
                  }`}
                >
                  {m.message}
                </div>
              ))
            )}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="اكتبي رسالتكِ للسائق..."
              className="flex-1 p-2.5 border rounded-xl text-xs focus:outline-none focus:border-amber-500"
            />
            <button type="submit" className="bg-amber-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold">
              إرسال
            </button>
          </form>
        </div>
      )}
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

  // نموذج البيانات
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
    setLoading(true);
    const { data: empData } = await supabase.from('employees').select('*, drivers(name)').order('created_at', { ascending: false });
    const { data: drvData } = await supabase.from('drivers').select('id, name');
    setEmployees(empData || []);
    setDrivers(drvData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      driver_id: formData.driver_id || null,
    };

    if (editingId) {
      await supabase.from('employees').update(payload).eq('id', editingId);
    } else {
      await supabase.from('employees').insert(payload);
    }

    setShowModal(false);
    resetForm();
    loadData();
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
    if (!confirm('هل أنت موافق على حذف هذه الموظفة؟')) return;
    await supabase.from('employees').delete().eq('id', id);
    loadData();
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
    <div className="p-4 space-y-4 dir-rtl text-right">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <h2 className="font-extrabold text-gray-800 text-lg">👩‍🏫 إدارة الموظفات والمعلمات</h2>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-4 py-2.5 rounded-xl font-bold shadow-sm"
        >
          + إضافة موظفة جديدة
        </button>
      </div>

      {/* جدول عرض الموظفات */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto border">
        <table className="w-full text-xs text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-600">
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
            {Array.isArray(employees) && employees.map((emp) => (
              <tr key={emp.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-bold">{emp.name}</td>
                <td className="p-3">{emp.phone}</td>
                <td className="p-3">{emp.school_name} - {emp.address}</td>
                <td className="p-3 font-bold">{Number(emp.subscription_price || 0).toLocaleString()} د.ع</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${emp.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {emp.payment_status === 'paid' ? 'مدفوع ✅' : 'غير مدفوع ❌'}
                  </span>
                </td>
                <td className="p-3 text-amber-700 font-semibold">{emp.drivers?.name || 'غير محدد'}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => handleEdit(emp)} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold">تعديل / توزيع</button>
                  <button onClick={() => handleDelete(emp.id)} className="bg-red-50 text-red-600 px-3 py-1 rounded-lg font-bold">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* نافذة الإضافة والتعديل */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="font-bold text-gray-800 text-lg">{editingId ? 'تعديل موظفة وتوزيع السائق' : 'إضافة موظفة جديدة'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block mb-1 font-bold">اسم الموظفة</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border rounded-xl" />
              </div>
              <div>
                <label className="block mb-1 font-bold">رقم الموبايل</label>
                <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 border rounded-xl" />
              </div>
              <div>
                <label className="block mb-1 font-bold">كلمة السر</label>
                <input required type="text" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-2.5 border rounded-xl" />
              </div>
              <div>
                <label className="block mb-1 font-bold">عنوان السكن</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full p-2.5 border rounded-xl" />
              </div>
              <div>
                <label className="block mb-1 font-bold">اسم المدرسة</label>
                <input type="text" value={formData.school_name} onChange={(e) => setFormData({...formData, school_name: e.target.value})} className="w-full p-2.5 border rounded-xl" />
              </div>
              <div>
                <label className="block mb-1 font-bold">أوقات الدوام (مثلاً 8 ص - 2 ظ)</label>
                <input type="text" value={formData.work_hours} onChange={(e) => setFormData({...formData, work_hours: e.target.value})} className="w-full p-2.5 border rounded-xl" />
              </div>
              <div>
                <label className="block mb-1 font-bold">كم يوم بالأسبوع</label>
                <input type="text" value={formData.work_days} onChange={(e) => setFormData({...formData, work_days: e.target.value})} className="w-full p-2.5 border rounded-xl" />
              </div>
              <div>
                <label className="block mb-1 font-bold">سعر الاشتراك</label>
                <input type="number" value={formData.subscription_price} onChange={(e) => setFormData({...formData, subscription_price: e.target.value})} className="w-full p-2.5 border rounded-xl" />
              </div>
              <div>
                <label className="block mb-1 font-bold">حالة الاشتراك</label>
                <select value={formData.payment_status} onChange={(e) => setFormData({...formData, payment_status: e.target.value})} className="w-full p-2.5 border rounded-xl">
                  <option value="unpaid">غير مدفوع (مغلق)</option>
                  <option value="paid">مدفوع (مفتوح)</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-bold">توزيع السائق المكلف</label>
                <select value={formData.driver_id} onChange={(e) => setFormData({...formData, driver_id: e.target.value})} className="w-full p-2.5 border rounded-xl">
                  <option value="">بدون سائق</option>
                  {Array.isArray(drivers) && drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-bold">تاريخ البداية</label>
                <input type="date" value={formData.subscription_start_date} onChange={(e) => setFormData({...formData, subscription_start_date: e.target.value})} className="w-full p-2.5 border rounded-xl" />
              </div>
              <div>
                <label className="block mb-1 font-bold">تاريخ الانتهاء</label>
                <input type="date" value={formData.subscription_end_date} onChange={(e) => setFormData({...formData, subscription_end_date: e.target.value})} className="w-full p-2.5 border rounded-xl" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="ex" checked={formData.has_exception} onChange={(e) => setFormData({...formData, has_exception: e.target.checked})} />
                <label htmlFor="ex" className="font-bold text-amber-700">منح استثناء للدوام في العطل الرسمية</label>
              </div>

              <div className="col-span-2 flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-white rounded-xl font-bold">حفظ البيانات</button>
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
    if (!driver?.id) return;

    const fetchEmp = async () => {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('driver_id', driver.id)
        .eq('payment_status', 'paid');

      setEmployees(data || []);
      setLoading(false);
    };

    fetchEmp();
    const interval = setInterval(fetchEmp, 4000);
    return () => clearInterval(interval);
  }, [driver?.id, supabase]);

  if (loading) return <div className="p-6 text-center text-xs text-gray-500">جاري التحميل...</div>;

  if (!Array.isArray(employees) || employees.length === 0) {
    return (
      <div className="p-8 text-center dir-rtl">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-6 space-y-2">
          <span className="text-3xl">🚫</span>
          <h3 className="font-bold text-sm">أنت غير مسجل بهذا النظام</h3>
          <p className="text-xs text-amber-700">لم يتم تخصيص أي موظفات أو معلمات لحافلتك حتى الآن من قبل الإدارة.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 dir-rtl text-right pb-20">
      <h2 className="font-extrabold text-gray-800 text-sm mb-2">
        🚍 قائمة الموظفات المعينات لحافلتك ({employees.length})
      </h2>

      {employees.map((emp) => (
        <div key={emp.id} className="bg-white p-4 rounded-2xl shadow-sm border space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">{emp.name}</h3>
              <p className="text-xs text-gray-500">{emp.school_name} - {emp.address}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${emp.attending_status ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {emp.attending_status ? '✅ تداوم اليوم' : '❌ لا تداوم اليوم'}
            </span>
          </div>

          <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl grid grid-cols-2 gap-1">
            <div>ساعات الدوام: <b>{emp.work_hours || '-'}</b></div>
            <div>الأيام: <b>{emp.work_days || '-'}</b></div>
          </div>

          <button
            onClick={() => openWhatsApp(emp.phone)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm"
          >
            💬 التواصل عبر الواتساب ({emp.phone})
          </button>
        </div>
      ))}
    </div>
  );
}
