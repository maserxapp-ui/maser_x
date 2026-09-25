import React, { useState, useEffect } from 'react';

export function InternalAmarahLines({ supabase }) {
  const [activeSubTab, setActiveSubTab] = useState('distribution'); // 'distribution' | 'drivers' | 'add_student'
  const [drivers, setDrivers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. نموذج إضافة سائق جديد
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    password: '',
    car_type: '',
    capacity: 4,
    manager_deduction: 15,
    destinations: ['']
  });

  // 2. نموذج إضافة طالب جديد (خاص بخطوط العمارة)
  const [newStudent, setNewStudent] = useState({
    name: '',
    phone: '',
    password: '',
    location: '',
    subscription_price: ''
  });

  // جلب بيانات خطوط داخل العمارة فقط من Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: drv } = await supabase
        .from('drivers')
        .select('*')
        .eq('line_type', 'internal_amarah');
        
      const { data: std } = await supabase
        .from('students')
        .select('*')
        .eq('line_type', 'internal_amarah');

      if (drv) setDrivers(drv);
      if (std) setStudents(std);
    } catch (err) {
      console.error('Error fetching internal amarah data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // إضافة حقل وجهة جديد للسائق
  const addDestinationField = () => {
    if (newDriver.destinations.length < 15) {
      setNewDriver({
        ...newDriver,
        destinations: [...newDriver.destinations, '']
      });
    }
  };

  const handleDestinationChange = (index, value) => {
    const updated = [...newDriver.destinations];
    updated[index] = value;
    setNewDriver({ ...newDriver, destinations: updated });
  };

  // 🤖 خوارزمية التوزيع التلقائي لطلاب العمارة المداومين غداً
  const handleAutoDistribute = async () => {
    setLoading(true);
    try {
      // فلترة طلاب العمارة المداومين غداً حصراً
      const commutingStudents = students.filter(
        (s) => s.tomorrow_status === 'أداوم غداً'
      );

      if (commutingStudents.length === 0) {
        alert('⚠️ لا يوجد طلاب محددين كـ "أداوم غداً" في خطوط العمارة حالياً.');
        setLoading(false);
        return;
      }

      let assignedCount = 0;
      const updates = [];

      const driverCapacities = {};
      drivers.forEach((d) => {
        const currentAssigned = students.filter((s) => s.driver_id === d.id).length;
        driverCapacities[d.id] = currentAssigned;
      });

      commutingStudents.forEach((student) => {
        if (!student.location || student.location.trim() === '') return;

        const studentLoc = student.location.trim().toLowerCase();

        const matchedDriver = drivers.find((driver) => {
          const driverDests = driver.destinations || [];
          const maxCapacity = driver.capacity || 4;
          const currentCount = driverCapacities[driver.id] || 0;

          const isMatched = driverDests.some((dest) => {
            if (!dest) return false;
            const cleanDest = dest.trim().toLowerCase();
            return studentLoc.includes(cleanDest) || cleanDest.includes(studentLoc);
          });

          return isMatched && currentCount < maxCapacity;
        });

        if (matchedDriver) {
          updates.push(
            supabase
              .from('students')
              .update({ driver_id: matchedDriver.id })
              .eq('id', student.id)
          );

          driverCapacities[matchedDriver.id] += 1;
          assignedCount++;
        }
      });

      if (updates.length > 0) {
        await Promise.all(updates);
        alert(`✅ تم توزيع ${assignedCount} طالب من خطوط العمارة بنجاح!`);
        fetchData();
      } else {
        alert('⚠️ لم يتم العثور على مطابقة بين مناطق الطلاب المداومين ووجهات السائقين أو أن السيارات ممتلئة.');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء التوزيع.');
    } finally {
      setLoading(false);
    }
  };

  // حفظ السائق
  const handleSaveDriver = async (e) => {
    e.preventDefault();
    const cleanDestinations = newDriver.destinations.filter((d) => d.trim() !== '');
    
    const { error } = await supabase.from('drivers').insert([
      {
        ...newDriver,
        destinations: cleanDestinations,
        line_type: 'internal_amarah',
        is_accepting_trips: true
      }
    ]);

    if (!error) {
      alert('✅ تم إضافة السائق ووجهاته بنجاح!');
      fetchData();
      setNewDriver({
        name: '', phone: '', password: '', car_type: '', capacity: 4, manager_deduction: 15, destinations: ['']
      });
    }
  };

  // 🎓 حفظ الطالب الجديد في خطوط العمارة
  const handleSaveStudent = async (e) => {
    e.preventDefault();
   const { error } = await supabase.from('students').insert([
      {
        name: newStudent.name,
        phone: newStudent.phone,
        password: newStudent.password,
        location: newStudent.location,
        subscription_price: Number(newStudent.subscription_price) || 0,
        price: Number(newStudent.subscription_price) || 0, // 👈 يربط السعر بصفحة المشتركين مباشرة
        monthly_price: Number(newStudent.subscription_price) || 0, // 👈 لضمان ظهور السعر في كافة التقارير
        line_type: 'internal_amarah',
        tomorrow_status: 'لم يحدد'
      }
    ]);

    if (!error) {
      alert('✅ تم إضافة الطالب في خطوط العمارة بنجاح!');
      fetchData();
      setNewStudent({ name: '', phone: '', password: '', location: '', subscription_price: '' });
      setActiveSubTab('distribution');
    } else {
      alert('حدث خطأ في إضافة الطالب: ' + error.message);
    }
  };

  // تعديل استقطاع المدير
  const handleUpdateDeduction = async (driverId, newRate) => {
    await supabase.from('drivers').update({ manager_deduction: Number(newRate) }).eq('id', driverId);
    fetchData();
  };

  // الطلاب المداومون غداً خاص بـ خطوط العمارة
  const attendingStudents = students.filter((s) => s.tomorrow_status === 'أداوم غداً');

  return (
    <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-xl space-y-6 dir-rtl">
      {/* الهيدر والأزرار الرئيسية */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            🏙️ إدارة خطوط داخل العمارة
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            نظام الاشتراكات، التوزيع التلقائي والمداومون غداً الخاصة بالعمارة
          </p>
        </div>

        <div className="flex gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveSubTab('distribution')}
            className={`px-4 py-1.5 text-xs rounded-lg font-bold transition ${
              activeSubTab === 'distribution' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
            }`}
          >
            🔄 التوزيع والمطابقة
          </button>
          <button
            onClick={() => setActiveSubTab('add_student')}
            className={`px-4 py-1.5 text-xs rounded-lg font-bold transition ${
              activeSubTab === 'add_student' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
            }`}
          >
            👨‍🎓 إضافة طالب عمارة
          </button>
          <button
            onClick={() => setActiveSubTab('drivers')}
            className={`px-4 py-1.5 text-xs rounded-lg font-bold transition ${
              activeSubTab === 'drivers' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
            }`}
          >
            🚘 السائقين والوجهات
          </button>
        </div>
      </div>

      {/* 1. تبويب التوزيع التلقائي وجدول المداومين الاحتياطي */}
      {activeSubTab === 'distribution' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div>
              <h3 className="font-bold text-amber-300 text-sm">التوزيع التلقائي لخطوط العمارة</h3>
              <p className="text-xs text-slate-400">يطابق موقع الطالب المداوم غداً مع وجهات السائقين المستقلة</p>
            </div>
            <button
              onClick={handleAutoDistribute}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-lg flex items-center gap-1"
            >
              ⚡ بدء التوزيع التلقائي بمطابقة المناطق
            </button>
          </div>

          {/* 📋 جدول المداومين غداً الاحتياطي (خاص بطلاب العمارة) */}
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                📌 المداومون غداً (خاص بخطوط العمارة): 
                <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full">
                  {attendingStudents.length} طالب
                </span>
              </h4>
            </div>

            {attendingStudents.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-3">لا يوجد طلاب عمارة محددين كـ "أداوم غداً" حالياً.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {attendingStudents.map((std) => {
                  const assignedDriver = drivers.find((d) => d.id === std.driver_id);
                  return (
                    <div key={std.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs space-y-1">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-white">{std.name}</span>
                        <span className="text-emerald-400">{std.location || 'غير محدد'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex justify-between">
                        <span>السائق: <strong className="text-amber-300">{assignedDriver ? assignedDriver.name : 'غير موزع'}</strong></span>
                        <span>الاشتراك: {std.subscription_price || 0} د.ع</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* قائمة كروت السائقين والتحويل اليدوي */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drivers.map((driver) => {
              const assignedStudents = students.filter((s) => s.driver_id === driver.id);
              const deductionRate = driver.manager_deduction || 15;
              const totalSubs = assignedStudents.reduce((sum, s) => sum + (Number(s.subscription_price) || 0), 0);
              const managerCut = totalSubs * (deductionRate / 100);
              const driverNet = totalSubs - managerCut;

              return (
                <div key={driver.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-700 pb-2">
                    <div>
                      <h4 className="font-bold text-white text-base">{driver.name}</h4>
                      <p className="text-xs text-slate-400">{driver.phone} | {driver.car_type}</p>
                    </div>
                    <span className="bg-slate-900 text-amber-400 text-xs px-2.5 py-1 rounded-lg border border-slate-700">
                      السعة: {assignedStudents.length} / {driver.capacity || 4}
                    </span>
                  </div>

                  {/* الحسابات المباشرة */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-900 p-2 rounded-xl text-center text-[11px]">
                    <div>
                      <span className="text-slate-400 block">الإجمالي</span>
                      <span className="font-bold text-emerald-400">{totalSubs.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">خصم الشركة</span>
                      <span className="font-bold text-rose-400">{managerCut.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">صافي السائق</span>
                      <span className="font-bold text-amber-400">{driverNet.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* مناطق السائق */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">📍 المناطق الوجهات:</span>
                    <div className="flex flex-wrap gap-1">
                      {(driver.destinations || []).map((dest, i) => (
                        <span key={i} className="bg-slate-900 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30">
                          {dest}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* نسبة خصم الشركة */}
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-700">
                    <span className="text-xs text-purple-300 font-bold">👑 نسبة استقطاع المدير:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        defaultValue={deductionRate}
                        onBlur={(e) => handleUpdateDeduction(driver.id, e.target.value)}
                        className="w-14 bg-slate-800 text-center text-xs font-bold text-amber-400 rounded p-1 border border-slate-600"
                      />
                      <span className="text-xs font-bold">%</span>
                    </div>
                  </div>

                  {/* قائمة الطلاب المحولين والسماح بالنقل اليدوي */}
                  <div className="space-y-1 pt-1">
                    <span className="text-xs font-bold text-slate-300 block">👥 الطلاب الموزعين عليه:</span>
                    {assignedStudents.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">لا يوجد طلاب محولين لهذا السائق حالياً.</p>
                    ) : (
                      assignedStudents.map((std) => (
                        <div key={std.id} className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg text-xs">
                          <span>{std.name} ({std.location || 'بدون موقع'})</span>
                          <select
                            value={std.driver_id}
                            onChange={async (e) => {
                              await supabase.from('students').update({ driver_id: e.target.value }).eq('id', std.id);
                              fetchData();
                            }}
                            className="bg-slate-800 text-[11px] text-amber-300 p-1 rounded border border-slate-700"
                          >
                            <option value="">نقل إلى سائق آخر...</option>
                            {drivers.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. تبويب إضافة طالب جديد لعمارة */}
      {activeSubTab === 'add_student' && (
        <form onSubmit={handleSaveStudent} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4 max-w-xl mx-auto">
          <h3 className="font-bold text-amber-300 text-sm border-b border-slate-700 pb-2">👨‍🎓 إضافة طالب جديد بخطوط العمارة</h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">اسم الطالب الكامل:</label>
              <input
                type="text"
                placeholder="أدخل الاسم"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="w-full bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-slate-700"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-300 block mb-1">رقم الموبايل (اسم المستخدم):</label>
                <input
                  type="text"
                  placeholder="07XXXXXXXXX"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  className="w-full bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-slate-700"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">كلمة السر:</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  className="w-full bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-slate-700"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-300 block mb-1">المنطقة / الموقع:</label>
                <input
                  type="text"
                  placeholder="مثال: الميمونة"
                  value={newStudent.location}
                  onChange={(e) => setNewStudent({ ...newStudent, location: e.target.value })}
                  className="w-full bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-slate-700"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">سعر الاشتراك الشهري (د.ع):</label>
                <input
                  type="number"
                  placeholder="100000"
                  value={newStudent.subscription_price}
                  onChange={(e) => setNewStudent({ ...newStudent, subscription_price: e.target.value })}
                  className="w-full bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-slate-700"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg mt-2"
          >
            حفظ الطالب
          </button>
        </form>
      )}

      {/* 3. تبويب إضافة سائق وو جهات */}
      {activeSubTab === 'drivers' && (
        <form onSubmit={handleSaveDriver} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
          <h3 className="font-bold text-amber-300 text-sm border-b border-slate-700 pb-2">➕ إضافة سائق خط داخلي جديد</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="اسم السائق"
              value={newDriver.name}
              onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
              className="bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-slate-700"
              required
            />
            <input
              type="text"
              placeholder="رقم الموبايل"
              value={newDriver.phone}
              onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
              className="bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-slate-700"
              required
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={newDriver.password}
              onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
              className="bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-slate-700"
              required
            />
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-emerald-400">📍 الوجهات والمناطق التي يغطيها السائق:</label>
              <button
                type="button"
                onClick={addDestinationField}
                className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1 rounded-lg"
              >
                ➕ إضافة منطقة جديدة
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {newDriver.destinations.map((dest, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`منطقة ${idx + 1}`}
                  value={dest}
                  onChange={(e) => handleDestinationChange(idx, e.target.value)}
                  className="bg-slate-900 text-xs text-white p-2 rounded-lg border border-slate-700"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition"
          >
            حفظ السائق والوجهات
          </button>
        </form>
      )}
    </div>
  );
}
