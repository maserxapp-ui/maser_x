import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import logoImg from '../logo.png.jpg';

export default function App() {
  const [activeTab, setActiveTab] = useState('main');
  const [searchTerm, setSearchTerm] = useState('');
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  
  // بيانات المشتركين والسائقين
  const [students, setStudents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  
  // نافذة المشتركين (إضافة وتعديل)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // حقول المشترك
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('جامعة ميسان');
  const [price, setPrice] = useState('90,000');
  const [status, setStatus] = useState('مدفوع');
  const [driverId, setDriverId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // نافذة السائقين (إضافة وتعديل)
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [isEditingDriver, setIsEditingDriver] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);

  // حقول السائق والسيارة
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [carType, setCarType] = useState('حافلة كيا كوستار');
  const [carNumber, setCarNumber] = useState('');
  const [route, setRoute] = useState('منطقة حي الخليج - الجامعة');
  const [capacity, setCapacity] = useState('22');
  const [driverStatus, setDriverStatus] = useState('نشط');
  const [submittingDriver, setSubmittingDriver] = useState(false);

  // 1. جلب البيانات من Supabase
  useEffect(() => {
    fetchStudents();
    fetchDrivers();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('خطأ في جلب بيانات الطلاب:', error);
      } else {
        setStudents(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDrivers() {
    setLoadingDrivers(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('خطأ في جلب بيانات السائقين:', error);
      } else {
        setDrivers(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDrivers(false);
    }
  }

  // --- إدارة المشتركين ---
  const openAddModal = () => {
    setIsEditing(false);
    setSelectedStudentId(null);
    setName('');
    setPhone('');
    setUniversity('جامعة ميسان');
    setPrice('90,000');
    setStatus('مدفوع');
    setDriverId('');
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setIsEditing(true);
    setSelectedStudentId(student.id);
    setName(student.name || '');
    setPhone(student.phone || '');
    setUniversity(student.university || 'جامعة ميسان');
    setPrice(student.price || '90,000');
    setStatus(student.status || 'مدفوع');
    setDriverId(student.driver_id ? student.driver_id.toString() : '');
    setShowModal(true);
  };

  async function handleSaveStudent(e) {
    e.preventDefault();
    if (!name || !phone) {
      alert('يرجى إدخال اسم المشترك ورقم الهاتف!');
      return;
    }

    setSubmitting(true);

    const studentPayload = {
      name,
      phone,
      university,
      price,
      status,
      driver_id: driverId ? parseInt(driverId, 10) : null
    };

    if (isEditing) {
      const { error } = await supabase
        .from('students')
        .update(studentPayload)
        .eq('id', selectedStudentId);

      setSubmitting(false);

      if (error) {
        alert('حدث خطأ أثناء التحديث: ' + error.message);
      } else {
        setShowModal(false);
        fetchStudents();
      }
    } else {
      const { error } = await supabase
        .from('students')
        .insert([{ 
          ...studentPayload,
          days: 'سبت - اثنين - أربعاء',
          created_at: new Date().toISOString().split('T')[0]
        }]);

      setSubmitting(false);

      if (error) {
        alert('حدث خطأ أثناء الإضافة: ' + error.message);
      } else {
        setShowModal(false);
        fetchStudents();
      }
    }
  }

  async function handleDeleteStudent(id, name) {
    if (window.confirm(`هل أنت تأكد من حذف المشترك: (${name})؟`)) {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) {
        alert('حدث خطأ في الحذف: ' + error.message);
      } else {
        fetchStudents();
      }
    }
  }

  // --- إدارة السائقين ---
  const openAddDriverModal = () => {
    setIsEditingDriver(false);
    setSelectedDriverId(null);
    setDriverName('');
    setDriverPhone('');
    setCarType('حافلة كيا كوستار');
    setCarNumber('');
    setRoute('منطقة حي الخليج - الجامعة');
    setCapacity('22');
    setDriverStatus('نشط');
    setShowDriverModal(true);
  };

  const openEditDriverModal = (driver) => {
    setIsEditingDriver(true);
    setSelectedDriverId(driver.id);
    setDriverName(driver.name || '');
    setDriverPhone(driver.phone || '');
    setCarType(driver.car_type || 'حافلة كيا كوستار');
    setCarNumber(driver.car_number || '');
    setRoute(driver.route || 'منطقة حي الخليج - الجامعة');
    setCapacity(driver.capacity?.toString() || '22');
    setDriverStatus(driver.status || 'نشط');
    setShowDriverModal(true);
  };

  async function handleSaveDriver(e) {
    e.preventDefault();
    if (!driverName || !driverPhone) {
      alert('يرجى إدخال اسم السائق ورقم الهاتف!');
      return;
    }

    setSubmittingDriver(true);

    const driverPayload = {
      name: driverName,
      phone: driverPhone,
      car_type: carType,
      car_number: carNumber,
      route: route,
      capacity: parseInt(capacity, 10) || 0,
      status: driverStatus
    };

    if (isEditingDriver) {
      const { error } = await supabase
        .from('drivers')
        .update(driverPayload)
        .eq('id', selectedDriverId);

      setSubmittingDriver(false);

      if (error) {
        alert('حدث خطأ أثناء التحديث: ' + error.message);
      } else {
        setShowDriverModal(false);
        fetchDrivers();
      }
    } else {
      const { error } = await supabase
        .from('drivers')
        .insert([{ 
          ...driverPayload,
          created_at: new Date().toISOString().split('T')[0]
        }]);

      setSubmittingDriver(false);

      if (error) {
        alert('حدث خطأ أثناء إضافة السائق: ' + error.message);
      } else {
        setShowDriverModal(false);
        fetchDrivers();
      }
    }
  }

  async function handleDeleteDriver(id, name) {
    if (window.confirm(`هل أنت متأكد من حذف السائق: (${name})؟`)) {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);

      if (error) {
        alert('حدث خطأ في الحذف: ' + error.message);
      } else {
        fetchDrivers();
        fetchStudents();
      }
    }
  }

  // التصفية والبحث
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone?.includes(searchTerm)
  );

  const filteredDrivers = drivers.filter(driver =>
    driver.name?.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
    driver.phone?.includes(driverSearchTerm) ||
    driver.route?.toLowerCase().includes(driverSearchTerm.toLowerCase())
  );

  // إحصائيات المشتركين
  const totalSubscribers = students.length;
  const paidStudents = students.filter(s => s.status === 'مدفوع' || !s.status);
  const paidCount = paidStudents.length;
  const lateCount = students.filter(s => s.status === 'متأخر').length;
  const unpaidCount = students.filter(s => s.status === 'غير مدفوع').length;

  const parseAmount = (val) => {
    if (!val) return 0;
    const clean = val.toString().replace(/[^0-9]/g, '');
    return parseInt(clean, 10) || 0;
  };

  const totalExpectedRevenue = students.reduce((sum, s) => sum + parseAmount(s.price), 0);
  const totalCollectedRevenue = paidStudents.reduce((sum, s) => sum + parseAmount(s.price), 0);

  // إحصائيات السائقين
  const totalDrivers = drivers.length;
  const activeDriversCount = drivers.filter(d => d.status === 'نشط' || !d.status).length;
  const totalSeats = drivers.reduce((sum, d) => sum + (parseInt(d.capacity, 10) || 0), 0);

  // دوال مساعدة لربط الأسماء
  const getDriverName = (dId) => {
    if (!dId) return <span className="text-slate-400 font-normal">غير محدد</span>;
    const found = drivers.find(d => d.id === dId);
    return found ? <span className="font-bold text-orange-600">🚗 {found.name}</span> : <span className="text-slate-400">غير محدد</span>;
  };

  const getStudentCountForDriver = (dId) => {
    return students.filter(s => s.driver_id === dId).length;
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'مدفوع':
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">مدفوع</span>;
      case 'متأخر':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">متأخر</span>;
      case 'غير مدفوع':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700">غير مدفوع</span>;
    }
  };

  const getDriverStatusBadge = (st) => {
    switch (st) {
      case 'نشط':
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">نشط</span>;
      case 'إجازة':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">إجازة</span>;
      case 'متوقف':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700">متوقف</span>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-['Tajawal',sans-serif] text-slate-800 dir-rtl" dir="rtl">
      
      {/* القائمة الجانبية (Sidebar) */}
      <aside className="w-64 bg-[#0e1e38] text-slate-300 flex flex-col justify-between shadow-xl z-20">
        <div>
          {/* قسم الشعار */}
          <div className="p-4 flex flex-col items-center border-b border-slate-700/50">
            <div className="p-2 flex items-center justify-center w-28 h-20 mb-2">
              <img 
                src={logoImg} 
                alt="شعار مسار إكس" 
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <span className="text-xs text-orange-400 font-bold tracking-wider">نظام إدارة النقل والمحاسبة</span>
          </div>

          <nav className="p-3 space-y-1">
            {[
              { id: 'main', label: 'الرئيسية', icon: '🏠' },
              { id: 'subscribers', label: 'المشتركون', icon: '👥' },
              { id: 'drivers', label: 'السائقون والسيارات', icon: '🚗' },
              { id: 'trips', label: 'الرحلات', icon: '🗺️' },
              { id: 'expenses', label: 'المصروفات', icon: '💵' },
              { id: 'reports', label: 'التقارير المالية', icon: '📊' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-700/50">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* الشريط العلوي */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {activeTab === 'main' && 'لوحة التحكم السحابية'}
              {activeTab === 'subscribers' && 'إدارة المشتركين'}
              {activeTab === 'drivers' && 'إدارة السائقين والسيارات'}
              {activeTab === 'trips' && 'سجل الرحلات'}
              {activeTab === 'expenses' && 'إدارة المصروفات'}
              {activeTab === 'reports' && 'التقارير الحسابية'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">منصة مسار إكس - إدارة الخطوط والاشتراكات</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              🔔 <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 border-r pr-4 border-slate-200">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                👤
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">مدير النظام</p>
                <p className="text-xs text-emerald-600 font-semibold">● متصل الآن</p>
              </div>
            </div>
          </div>
        </header>

        {/* محتوى اللوحة */}
        <main className="p-6 space-y-6">
          
          {/* كروت الإحصائيات السريعة */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-b-4 border-emerald-500">
              <p className="text-xs text-slate-500 font-medium">إجمالي المشتركين</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{totalSubscribers}</p>
              <span className="text-[10px] text-slate-400">مشترك مضاف</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-b-4 border-blue-500">
              <p className="text-xs text-slate-500 font-medium">الاشتراكات المدفوعة</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{paidCount}</p>
              <span className="text-[10px] text-slate-400">حساب مكتمل</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-b-4 border-orange-500">
              <p className="text-xs text-slate-500 font-medium">عدد السائقين</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{totalDrivers}</p>
              <span className="text-[10px] text-slate-400">{activeDriversCount} سائق نشط</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-b-4 border-indigo-500">
              <p className="text-xs text-slate-500 font-medium">سعة المقاعد الكلية</p>
              <p className="text-xl font-bold text-indigo-600 mt-1">{totalSeats}</p>
              <span className="text-[10px] text-slate-400">مقعد متاح بالأسطول</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-b-4 border-purple-500">
              <p className="text-xs text-slate-500 font-medium">المبالغ المحصلة</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">{totalCollectedRevenue.toLocaleString()} د.ع</p>
              <span className="text-[10px] text-slate-400">من أصل {totalExpectedRevenue.toLocaleString()}</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-b-4 border-cyan-500">
              <p className="text-xs text-slate-500 font-medium">حالة السيرفر</p>
              <p className="text-sm font-bold text-emerald-600 mt-2">متصل بـ Supabase</p>
            </div>
          </div>

          {/* التبويب الرئيسي والمشتركين */}
          {(activeTab === 'main' || activeTab === 'subscribers') && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">قائمة المشتركين والخطوط</h2>
                    <p className="text-xs text-slate-400">إدارة المشتركين، ربط السائق بالحافلة، وتعديل حالات الدفع</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="بحث باسم المشترك أو الهاتف..."
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-60 focus:outline-none focus:border-orange-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    
                    <button 
                      onClick={openAddModal}
                      className="bg-orange-500 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-orange-600 shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <span>+</span> إضافة مشترك جديد
                    </button>
                    
                    <button 
                      onClick={fetchStudents}
                      className="bg-slate-100 text-slate-700 text-xs px-3 py-2 rounded-lg font-medium hover:bg-slate-200"
                      title="تحديث البيانات"
                    >
                      🔄 تحديث
                    </button>
                  </div>
                </div>

                {/* جدول المشتركين */}
                {loading ? (
                  <div className="p-12 text-center text-slate-400 font-medium text-sm">
                    جاري جلب البيانات من السيرفر... ⏳
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <p className="text-slate-400 text-sm">لا يوجد مشتركين حالياً في قاعدة البيانات.</p>
                    <button 
                      onClick={openAddModal}
                      className="bg-orange-500 text-white text-xs px-4 py-2 rounded-lg font-bold"
                    >
                      إضافة أول مشترك الآن
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">اسم المشترك</th>
                          <th className="p-3">رقم الهاتف</th>
                          <th className="p-3">الجامعة / الجهة</th>
                          <th className="p-3">السائق المخصص</th>
                          <th className="p-3">قيمة الاشتراك</th>
                          <th className="p-3 text-center">الحالة</th>
                          <th className="p-3 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((student, idx) => (
                          <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-medium text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-800">{student.name}</td>
                            <td className="p-3 text-slate-600 dir-ltr text-right">{student.phone}</td>
                            <td className="p-3 text-slate-600">{student.university || 'جامعة ميسان'}</td>
                            <td className="p-3">{getDriverName(student.driver_id)}</td>
                            <td className="p-3 font-bold text-slate-800">{student.price || '90,000'} د.ع</td>
                            <td className="p-3 text-center">{getStatusBadge(student.status)}</td>
                            <td className="p-3 text-center space-x-1 space-x-reverse">
                              <button 
                                onClick={() => openEditModal(student)}
                                className="text-amber-600 hover:text-amber-800 bg-amber-50 p-1.5 rounded-md font-bold text-xs"
                                title="تعديل البيانات"
                              >
                                ✏️ تعديل
                              </button>
                              <button 
                                onClick={() => handleDeleteStudent(student.id, student.name)}
                                className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-md font-bold text-xs"
                                title="حذف المشترك"
                              >
                                🗑️ حذف
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>

              {/* العمود الجانبي للملخص */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">ملخص الحسابات الفعلي</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">إجمالي المشتركين</span>
                      <span className="font-bold text-slate-900">{totalSubscribers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> الاشتراك المدفوع</span>
                      <span className="font-bold text-emerald-600">{paidCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> المتأخرين</span>
                      <span className="font-bold text-amber-600">{lateCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> غير المدفوع</span>
                      <span className="font-bold text-rose-600">{unpaidCount}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between items-center">
                      <span className="font-bold text-slate-700">المبلغ المستحصل:</span>
                      <span className="font-bold text-emerald-600 text-sm">{totalCollectedRevenue.toLocaleString()} د.ع</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* تبويب إدارة السائقين والسيارات */}
          {activeTab === 'drivers' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">إدارة كادر السائقين والحافلات</h2>
                  <p className="text-xs text-slate-400">سجل بيانات السائقين، سعة المقاعد، وعدد الطلاب المسجلين لكل حافلة</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="بحث باسم السائق، الهاتف، أو الخط..."
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-64 focus:outline-none focus:border-orange-500"
                    value={driverSearchTerm}
                    onChange={(e) => setDriverSearchTerm(e.target.value)}
                  />
                  
                  <button 
                    onClick={openAddDriverModal}
                    className="bg-orange-500 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-orange-600 shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <span>+</span> إضافة سائق جديد
                  </button>
                  
                  <button 
                    onClick={fetchDrivers}
                    className="bg-slate-100 text-slate-700 text-xs px-3 py-2 rounded-lg font-medium hover:bg-slate-200"
                    title="تحديث قائمة السائقين"
                  >
                    🔄 تحديث
                  </button>
                </div>
              </div>

              {/* جدول السائقين */}
              {loadingDrivers ? (
                <div className="p-12 text-center text-slate-400 font-medium text-sm">
                  جاري جلب بيانات السائقين... ⏳
                </div>
              ) : filteredDrivers.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <p className="text-slate-400 text-sm">لا يوجد سائقين مضافين حالياً.</p>
                  <button 
                    onClick={openAddDriverModal}
                    className="bg-orange-500 text-white text-xs px-4 py-2 rounded-lg font-bold"
                  >
                    إضافة أول سائق الآن
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">اسم السائق</th>
                        <th className="p-3">رقم الهاتف</th>
                        <th className="p-3">نوع المركبة واللوحة</th>
                        <th className="p-3">الخط / المنطقة</th>
                        <th className="p-3 text-center">الركاب / السعة الكلية</th>
                        <th className="p-3 text-center">الحالة</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDrivers.map((driver, idx) => {
                        const count = getStudentCountForDriver(driver.id);
                        const maxCap = parseInt(driver.capacity, 10) || 0;
                        const isFull = count >= maxCap && maxCap > 0;

                        return (
                          <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-medium text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                              <span className="p-1.5 bg-slate-100 rounded-full">🧔🏻‍♂️</span>
                              {driver.name}
                            </td>
                            <td className="p-3 text-slate-600 dir-ltr text-right">{driver.phone}</td>
                            <td className="p-3 text-slate-700 font-medium">
                              {driver.car_type || 'حافلة'} ({driver.car_number || 'بدون رقم'})
                            </td>
                            <td className="p-3 text-orange-600 font-bold">{driver.route || 'منطقة عامة'}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                                isFull ? 'bg-rose-100 text-rose-700' : 'bg-blue-50 text-blue-700'
                              }`}>
                                {count} / {maxCap} طالب
                              </span>
                            </td>
                            <td className="p-3 text-center">{getDriverStatusBadge(driver.status)}</td>
                            <td className="p-3 text-center space-x-1 space-x-reverse">
                              <button 
                                onClick={() => openEditDriverModal(driver)}
                                className="text-amber-600 hover:text-amber-800 bg-amber-50 p-1.5 rounded-md font-bold text-xs"
                                title="تعديل السائق"
                              >
                                ✏️ تعديل
                              </button>
                              <button 
                                onClick={() => handleDeleteDriver(driver.id, driver.name)}
                                className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-md font-bold text-xs"
                                title="حذف السائق"
                              >
                                🗑️ حذف
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {/* تبويب الرحلات والمصروفات */}
          {activeTab === 'trips' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center space-y-3">
              <div className="text-4xl">🗺️</div>
              <h3 className="font-bold text-slate-800">جدول الرحلات والتحركات</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">يمكنك جدولة الرحلات اليومية لمحافظة ميسان وباقي الخطوط بسهولة.</p>
            </div>
          )}

          {(activeTab === 'expenses' || activeTab === 'reports') && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center space-y-3">
              <div className="text-4xl">📊</div>
              <h3 className="font-bold text-slate-800">التقارير الحسابية والمصروفات</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">إجمالي الواردات الحالية: <span className="font-bold text-emerald-600">{totalCollectedRevenue.toLocaleString()} د.ع</span></p>
            </div>
          )}

        </main>

      </div>

      {/* النافذة المنبثقة (إضافة / تعديل مشترك) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">
                {isEditing ? '✏️ تعديل بيانات المشترك' : '➕ إضافة مشترك جديد'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم الطالب / المشترك *</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: عبد الرحمن علي"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">رقم الهاتف *</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: 07701234567"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500 dir-ltr text-right"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">الجامعة / الجهة</label>
                <input 
                  type="text"
                  placeholder="جامعة ميسان"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </div>

              {/* اختيار السائق المخصص */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">تحديد السائق / الحافلة المخصصة</label>
                <select 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                >
                  <option value="">-- بدون تحديد سائق --</option>
                  {drivers.map(drv => (
                    <option key={drv.id} value={drv.id}>
                      🚗 {drv.name} ({drv.route || 'عام'}) - {drv.car_type || 'حافلة'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">قيمة الاشتراك (دينار)</label>
                  <input 
                    type="text"
                    placeholder="90,000"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">حالة الدفع</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="مدفوع">مدفوع</option>
                    <option value="متأخر">متأخر</option>
                    <option value="غير مدفوع">غير مدفوع</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 shadow-md"
                >
                  {submitting ? 'جاري الحفظ...' : (isEditing ? 'حفظ التعديلات' : 'إضافة المشترك')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* النافذة المنبثقة (إضافة / تعديل سائق) */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">
                {isEditingDriver ? '✏️ تعديل بيانات السائق' : '🚗 إضافة سائق جديد'}
              </h3>
              <button onClick={() => setShowDriverModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم السائق الثلاثي *</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: أحمد جاسم محمد"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">رقم الهاتف *</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: 07712345678"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500 dir-ltr text-right"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">نوع السيارة / الحافلة</label>
                  <input 
                    type="text"
                    placeholder="كيا كوستار / تويوتا"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                    value={carType}
                    onChange={(e) => setCarType(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">رقم اللوحة / السيارة</label>
                  <input 
                    type="text"
                    placeholder="مثال: 12345 ميسان"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                    value={carNumber}
                    onChange={(e) => setCarNumber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">الخط / المنطقة السكنية</label>
                <input 
                  type="text"
                  placeholder="مثال: حي الخليج - جامعة ميسان"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">سعة المقاعد الكلية</label>
                  <input 
                    type="number"
                    placeholder="22"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">حالة السائق</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                    value={driverStatus}
                    onChange={(e) => setDriverStatus(e.target.value)}
                  >
                    <option value="نشط">نشط</option>
                    <option value="إجازة">إجازة</option>
                    <option value="متوقف">متوقف</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button 
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  disabled={submittingDriver}
                  className="px-5 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 shadow-md"
                >
                  {submittingDriver ? 'جاري الحفظ...' : (isEditingDriver ? 'حفظ التعديلات' : 'إضافة السائق')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
