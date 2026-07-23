import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('main');
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // حالات النافذة المنبثقة لإضافة مشترك جديد
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('جامعة ميسان');
  const [price, setPrice] = useState('90,000');
  const [status, setStatus] = useState('مدفوع');
  const [submitting, setSubmitting] = useState(false);

  // 1. جلب المشتركين الحقيقيين من Supabase
  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('خطأ في جلب البيانات:', error);
      } else {
        setStudents(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // 2. إضافة مشترك جديد بقاعدة البيانات
  async function handleAddStudent(e) {
    e.preventDefault();
    if (!name || !phone) {
      alert('يرجى إدخال اسم المشترك ورقم الهاتف!');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('students')
      .insert([
        { 
          name, 
          phone, 
          university, 
          price, 
          status,
          days: 'سبت - اثنين - أربعاء',
          created_at: new Date().toISOString().split('T')[0]
        }
      ]);

    setSubmitting(false);

    if (error) {
      alert('حدث خطأ أثناء الإضافة: ' + error.message);
    } else {
      setName('');
      setPhone('');
      setShowAddModal(false);
      fetchStudents(); // إعادة جلب القائمة المحدثة
    }
  }

  // 3. حذف مشترك من السيرفر
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

  // تصفية البيانات حسب البحث
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone?.includes(searchTerm)
  );

  // حساب الإحصائيات الحقيقية المباشرة من السيرفر
  const totalSubscribers = students.length;
  const paidCount = students.filter(s => s.status === 'مدفوع' || !s.status).length;
  const lateCount = students.filter(s => s.status === 'متأخر').length;
  const unpaidCount = students.filter(s => s.status === 'غير مدفوع').length;

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

  return (
    <div className="flex h-screen bg-slate-100 font-['Tajawal',sans-serif] text-slate-800 dir-rtl" dir="rtl">
      
      {/* القائمة الجانبية (Sidebar) */}
      <aside className="w-64 bg-[#0e1e38] text-slate-300 flex flex-col justify-between shadow-xl z-20">
        <div>
          <div className="p-5 flex flex-col items-center border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-wider text-white">MASAR <span className="text-orange-500">X</span></span>
            </div>
            <span className="text-xs text-orange-400 font-medium mt-1">مسار إكس</span>
          </div>

          <nav className="p-3 space-y-1">
            {[
              { id: 'main', label: 'الرئيسية', icon: '🏠' },
              { id: 'subscribers', label: 'المشتركون', icon: '👥' },
              { id: 'drivers', label: 'السائقون', icon: '🚗' },
              { id: 'trips', label: 'الرحلات', icon: '🗺️' },
              { id: 'attendance', label: 'الحضور', icon: '📅' },
              { id: 'subscriptions', label: 'الاشتراكات', icon: '💳' },
              { id: 'expenses', label: 'المصروفات', icon: '💵' },
              { id: 'reports', label: 'التقارير', icon: '📊' },
              { id: 'notifications', label: 'الإشعارات', icon: '🔔' },
              { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
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
            <h1 className="text-xl font-bold text-slate-900">لوحة التحكم السحابية</h1>
            <p className="text-xs text-slate-500 mt-0.5">مربوط بمباشر مع قاعدة بيانات Supabase</p>
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
                <p className="text-xs text-emerald-600 font-semibold">● سيرفر متصل</p>
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
              <p className="text-xs text-slate-500 font-medium">الاشتراكات المتأخرة</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{lateCount}</p>
              <span className="text-[10px] text-slate-400">يحتاج مراجعة</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-b-4 border-rose-500">
              <p className="text-xs text-slate-500 font-medium">غير المدفوع</p>
              <p className="text-xl font-bold text-rose-600 mt-1">{unpaidCount}</p>
              <span className="text-[10px] text-slate-400">لم يتم السداد</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-b-4 border-purple-500">
              <p className="text-xs text-slate-500 font-medium">عدد الرحلات اليوم</p>
              <p className="text-xl font-bold text-slate-900 mt-1">0</p>
              <span className="text-[10px] text-slate-400">رحلة</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-b-4 border-cyan-500">
              <p className="text-xs text-slate-500 font-medium">حالة السيرفر</p>
              <p className="text-sm font-bold text-emerald-600 mt-2">متصل بـ Supabase</p>
            </div>
          </div>

          {/* الجدول الرئيسي */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">قائمة المشتركين الحقيقية</h2>
                  <p className="text-xs text-slate-400">يتم جلب البيانات وتحديثها مباشره من قاعدة البيانات</p>
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
                    onClick={() => setShowAddModal(true)}
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

              {/* حالة التحميل أو عرض البيانات */}
              {loading ? (
                <div className="p-12 text-center text-slate-400 font-medium text-sm">
                  جاري جلب البيانات من السيرفر... ⏳
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <p className="text-slate-400 text-sm">لا يوجد مشتركين حالياً في قاعدة البيانات.</p>
                  <button 
                    onClick={() => setShowAddModal(true)}
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
                        <th className="p-3">تاريخ الإضافة</th>
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
                          <td className="p-3 text-slate-500">
                            {student.created_at ? new Date(student.created_at).toLocaleDateString('ar-EG') : 'اليوم'}
                          </td>
                          <td className="p-3 font-bold text-slate-800">{student.price || '90,000'} د.ع</td>
                          <td className="p-3 text-center">{getStatusBadge(student.status)}</td>
                          <td className="p-3 text-center">
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
                    <span className="text-slate-600">إجمالي المشتركين السحابي</span>
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
                </div>
              </div>
            </div>

          </div>

        </main>

      </div>

      {/* النافذة المنبثقة لإضافة مشترك جديد لسيرفر Supabase */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">إضافة مشترك جديد لقاعدة البيانات</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
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
                <label className="block text-slate-600 font-bold mb-1">الجامعة / المدرسة</label>
                <input 
                  type="text"
                  placeholder="جامعة ميسان"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
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
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 shadow-md"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ في السيرفر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
