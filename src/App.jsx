import React, { useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('main');
  const [searchTerm, setSearchTerm] = useState('');

  // بيانات المشتركين المطابقة للواجهة
  const [students, setStudents] = useState([
    { id: 1, name: 'زينب علي حسين', phone: '0787 123 4567', university: 'جامعة ميسان', date: '2024-09-15', days: 'سبت - اثنين - أربعاء', price: '90,000', status: 'مدفوع' },
    { id: 2, name: 'نور الهدى ماجد', phone: '0787 234 5678', university: 'كلية المنارة', date: '2024-09-16', days: 'أحد - ثلاثاء - خميس', price: '90,000', status: 'مدفوع' },
    { id: 3, name: 'فاطمة احمد كريم', phone: '0787 345 6789', university: 'معهد النفط', date: '2024-09-17', days: 'السبت إلى الخميس', price: '100,000', status: 'متأخر' },
    { id: 4, name: 'ضحى حسن علي', phone: '0787 456 7890', university: 'جامعة ميسان', date: '2024-09-15', days: 'سبت - اثنين - أربعاء', price: '90,000', status: 'غير مدفوع' },
    { id: 5, name: 'عذراء باسم محمد', phone: '0787 567 8901', university: 'كلية التربية', date: '2024-09-16', days: 'أحد - ثلاثاء - خميس', price: '90,000', status: 'مدفوع' },
  ]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'مدفوع':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">مدفوع</span>;
      case 'متأخر':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">متأخر</span>;
      case 'غير مدفوع':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700">غير مدفوع</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-['Tajawal',sans-serif] text-slate-800 dir-rtl" dir="rtl">
      
      {/* 1. القائمة الجانبية (Sidebar) */}
      <aside className="w-64 bg-[#0e1e38] text-slate-300 flex flex-col justify-between shadow-xl z-20">
        <div>
          {/* اللوجو */}
          <div className="p-5 flex flex-col items-center border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-wider text-white">MASAR <span className="text-orange-500">X</span></span>
            </div>
            <span className="text-xs text-orange-400 font-medium mt-1">مسار إكس</span>
          </div>

          {/* روابط التنقل */}
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

        {/* زر تسجيل الخروج */}
        <div className="p-4 border-t border-slate-700/50">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* 2. المحتوى الرئيسي (Main Content Area) */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* الشريط العلوي (Header) */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-slate-900">لوحة التحكم</h1>
            <p className="text-xs text-slate-500 mt-0.5">مرحباً بك في نظام إدارة النقل والمحاسبة - مسار إكس</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              🔔 <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">⚙️</button>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">⛶</button>
            
            <div className="flex items-center gap-3 border-r pr-4 border-slate-200">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                👤
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">مدير النظام</p>
                <p className="text-xs text-slate-500">مدير</p>
              </div>
            </div>
          </div>
        </header>

        {/* لوحة البيانات الإحصائية والوظائف */}
        <main className="p-6 space-y-6">
          
          {/* 3. كروت الإحصائيات العلوية (Top Stat Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { title: 'صافي الأرباح', value: '330,000', unit: 'دينار', icon: '📈', color: 'border-b-4 border-emerald-500' },
              { title: 'المصروفات اليوم', value: '210,000', unit: 'دينار', icon: '📉', color: 'border-b-4 border-orange-500' },
              { title: 'الإيرادات اليوم', value: '540,000', unit: 'دينار', icon: '💼', color: 'border-b-4 border-blue-500' },
              { title: 'عدد الرحلات اليوم', value: '32', unit: 'رحلة', icon: '📍', color: 'border-b-4 border-purple-500' },
              { title: 'عدد السائقين', value: '15', unit: 'سائق', icon: '🚗', color: 'border-b-4 border-indigo-500' },
              { title: 'عدد المشتركين', value: '128', unit: 'مشترك', icon: '👥', color: 'border-b-4 border-cyan-500' },
            ].map((card, idx) => (
              <div key={idx} className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between ${card.color}`}>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{card.title}</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">{card.value}</p>
                  <span className="text-[10px] text-slate-400">{card.unit}</span>
                </div>
                <div className="text-2xl bg-slate-50 p-2 rounded-lg">{card.icon}</div>
              </div>
            ))}
          </div>

          {/* 4. كروت التنبيهات السريعة (Alert Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">رحلات لم تنتهي</p>
                <p className="text-xl font-bold text-slate-800 mt-1">2 <span className="text-xs font-normal">رحلة</span></p>
              </div>
              <span className="text-3xl">🚌</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">اشتراكات متأخرة</p>
                <p className="text-xl font-bold text-orange-600 mt-1">8 <span className="text-xs font-normal">مشترك</span></p>
              </div>
              <span className="text-3xl">📅</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">مشترك لم يرجعوا اليوم</p>
                <p className="text-xl font-bold text-amber-600 mt-1">3 <span className="text-xs font-normal">مشترك</span></p>
              </div>
              <span className="text-3xl">⚠️</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">إشعارات اليوم</p>
                <p className="text-xl font-bold text-slate-800 mt-1">5</p>
              </div>
              <button className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200">عرض الكل</button>
            </div>
          </div>

          {/* 5. القسم الرئيسي (جدول البيانات + القائمة الجانبية الصغيرة) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* الجدول الرئيسي (3 أعمدة) */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              
              {/* شريط البحث والأزرار */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-800">قائمة المشتركين</h2>
                
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="بحث عن اسم أو رقم هاتف..."
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-60 focus:outline-none focus:border-orange-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600">
                    <option>كل الحالات</option>
                    <option>مدفوع</option>
                    <option>متأخر</option>
                    <option>غير مدفوع</option>
                  </select>
                  
                  <button className="bg-orange-500 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-orange-600 shadow-sm flex items-center gap-1">
                    <span>+</span> إضافة مشترك
                  </button>
                  <button className="bg-slate-900 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-slate-800 shadow-sm flex items-center gap-1">
                    <span>🗑️</span> حذف مشترك
                  </button>
                </div>
              </div>

              {/* الجدول */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">اسم المشترك</th>
                      <th className="p-3">رقم الهاتف</th>
                      <th className="p-3">الجامعة / المدرسة</th>
                      <th className="p-3">تاريخ الانضمام</th>
                      <th className="p-3">أيام الدوام</th>
                      <th className="p-3">قيمة الاشتراك</th>
                      <th className="p-3 text-center">حالة الاشتراك</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-medium text-slate-400">{student.id}</td>
                        <td className="p-3 font-bold text-slate-800">{student.name}</td>
                        <td className="p-3 text-slate-600 dir-ltr text-right">{student.phone}</td>
                        <td className="p-3 text-slate-600">{student.university}</td>
                        <td className="p-3 text-slate-500">{student.date}</td>
                        <td className="p-3 text-slate-500">{student.days}</td>
                        <td className="p-3 font-bold text-slate-800">{student.price}</td>
                        <td className="p-3 text-center">{getStatusBadge(student.status)}</td>
                        <td className="p-3 text-center">
                          <button className="text-slate-400 hover:text-slate-600 text-base font-bold">⋮</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* الترقيم (Pagination) */}
              <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                <span>عرض 1 - 5 من 128</span>
                <div className="flex items-center gap-1">
                  <button className="px-2 py-1 bg-slate-100 rounded hover:bg-slate-200">السابق</button>
                  <button className="px-2.5 py-1 bg-orange-500 text-white font-bold rounded">1</button>
                  <button className="px-2.5 py-1 bg-slate-100 rounded hover:bg-slate-200">2</button>
                  <button className="px-2.5 py-1 bg-slate-100 rounded hover:bg-slate-200">3</button>
                  <span>...</span>
                  <button className="px-2.5 py-1 bg-slate-100 rounded hover:bg-slate-200">26</button>
                  <button className="px-2 py-1 bg-slate-100 rounded hover:bg-slate-200">التالي</button>
                </div>
              </div>
            </div>

            {/* الودجات الجانبية (عمود واحد) */}
            <div className="space-y-6">
              
              {/* ملخص سريع */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">ملخص سريع</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">إجمالي المشتركين</span>
                    <span className="font-bold text-slate-900">128</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> المشتركين النشطين</span>
                    <span className="font-bold text-emerald-600">110</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> غير المدفوع</span>
                    <span className="font-bold text-rose-600">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> متأخر الدفع</span>
                    <span className="font-bold text-amber-600">10</span>
                  </div>
                </div>
              </div>

              {/* المشتركين لم يرجعوا بعد */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">المشتركين لم يرجعوا بعد</h3>
                <div className="space-y-3 text-xs">
                  {[
                    { name: 'زينب علي حسين', time: 'منذ 45 دقيقة' },
                    { name: 'نور الهدى ماجد', time: 'منذ 32 دقيقة' },
                    { name: 'فاطمة احمد كريم', time: 'منذ 20 دقيقة' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span className="font-bold text-slate-800">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-rose-500 bg-rose-50 px-2 py-0.5 rounded">{item.time}</span>
                    </div>
                  ))}
                  <button className="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-2">عرض الكل</button>
                </div>
              </div>

            </div>

          </div>

        </main>

        {/* الفوتر (Footer) */}
        <footer className="bg-white border-t border-slate-200 p-4 text-xs text-slate-500 flex justify-between items-center mt-auto">
          <span>جميع الحقوق محفوظة © 2026 مسار إكس</span>
          <span>نظام إدارة النقل والمحاسبة - مسار إكس</span>
        </footer>

      </div>

    </div>
  );
}
