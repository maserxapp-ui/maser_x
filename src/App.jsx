import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // جلب البيانات من Supabase
  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('students').select('*');
      if (error) console.error('Error fetching:', error);
      else setStudents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function addStudent(e) {
    e.preventDefault();
    if (!name) return;
    const { data, error } = await supabase.from('students').insert([{ name, phone }]);
    if (error) {
      alert('حدث خطأ أثناء الإضافة: ' + error.message);
    } else {
      setName('');
      setPhone('');
      fetchStudents();
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 dir-rtl p-4 md:p-8 font-['Tajawal']">
      <header className="max-w-4xl mx-auto mb-8 flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-amber-500">
          منصة مسار X <span className="text-sm font-normal text-slate-400">(Masar X)</span>
        </h1>
        <span className="bg-amber-500/10 text-amber-400 text-xs px-3 py-1 rounded-full border border-amber-500/20">
          نقل الطلاب والرحلات
        </span>
      </header>

      <main className="max-w-4xl mx-auto grid gap-8 md:grid-cols-3">
        {/* نموذج الإضافة */}
        <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/50 shadow-xl h-fit">
          <h2 className="text-lg font-bold mb-4 text-slate-200">إضافة طالب جديد</h2>
          <form onSubmit={addStudent} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">اسم الطالب</label>
              <input
                type="text"
                placeholder="مثال: أحمد علي"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">رقم الهاتف</label>
              <input
                type="text"
                placeholder="0770XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl transition duration-200 text-sm shadow-lg shadow-amber-500/20"
            >
              حفظ الطالب
            </button>
          </form>
        </div>

        {/* قائمة الطلاب */}
        <div className="md:col-span-2 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
          <h2 className="text-lg font-bold mb-4 text-slate-200 flex justify-between items-center">
            <span>قائمة الطلاب المشتركين</span>
            <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg">
              العدد: {students.length}
            </span>
          </h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">جاري تحميل البيانات...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">لا يوجد طلاب مسجلون حالياً</div>
          ) : (
            <div className="space-y-3">
              {students.map((student, idx) => (
                <div
                  key={student.id || idx}
                  className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition"
                >
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm">{student.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{student.phone || 'لا يوجد رقم'}</p>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    نشط
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
