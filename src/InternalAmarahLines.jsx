import React, { useState, useEffect } from 'react';

export function InternalAmarahLines({ supabase }) {
  const [activeSubTab, setActiveSubTab] = useState('distribution'); // 'distribution' | 'drivers' | 'students'
  const [drivers, setDrivers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // نموذج إضافة سائق جديد مع 10 وجهات
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    password: '',
    car_type: '',
    capacity: 4,
    manager_deduction: 15, // نسبة استقطاع الشركة
    destinations: [''] // مصفوفة المناطق (تبدأ بحقل واحد ويمكن زيادة 10+)
  });

  // نموذج إضافة طالب جديد
  const [newStudent, setNewStudent] = useState({
    name: '',
    phone: '',
    password: '',
    district: '', // منطقة السكن
    subscription_price: '' // سعر الاشتراك الشهرية
  });

  // جلب بيانات خطوط داخل العمارة فقط
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // إضافة حقل منطقة جديد للسائق (حتى 10 مناطق أو أكثر)
  const addDestinationField = () => {
    if (newDriver.destinations.length < 15) {
      setNewDriver({
        ...newDriver,
        destinations: [...newDriver.destinations, '']
      });
    }
  };

  // تحديث اسم المنطقة في حقل معين
  const handleDestinationChange = (index, value) => {
    const updated = [...newDriver.destinations];
    updated[index] = value;
    setNewDriver({ ...newDriver, destinations: updated });
  };

  // 🤖 خوارزمية التوزيع التلقائي حسب مطابقة المناطق
  const handleAutoDistribute = async () => {
    const commutingStudents = students.filter((s) => s.status === 'commuting' || s.attending_tomorrow);
    
    let assignedCount = 0;
    const updates = [];

    commutingStudents.forEach((student) => {
      if (!student.district) return;

      // البحث عن سائق يغطي منطقة الطالب ولديه مقعد شاغر
      const matchedDriver = drivers.find((driver) => {
        const driverDests = driver.destinations || [];
        const coversDistrict = driverDests.some((d) =>
          d.trim().toLowerCase().includes(student.district.trim().toLowerCase())
        );

        // حساب عدد الطلاب الحاليين للسائق
        const currentAssigned = students.filter((s) => s.driver_id === driver.id).length;
        return coversDistrict && currentAssigned < (driver.capacity || 4);
      });

      if (matchedDriver) {
        updates.push(
          supabase
            .from('students')
            .update({ driver_id: matchedDriver.id })
            .eq('id', student.id)
        );
        assignedCount++;
      }
    });

    if (updates.length > 0) {
      await Promise.all(updates);
      alert(`✅ تم توزيع ${assignedCount} طالب تلقائياً وفقاً لمطابقة المناطق!`);
      fetchData();
    } else {
      alert('⚠️ لم يتم العثور على مطابقة جديدة للمناطق أو أن سيارات السائقين ممتلئة.');
    }
  };

  // حفظ السائق الجديد
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
        name: '',
        phone: '',
        password: '',
        car_type: '',
        capacity: 4,
        manager_deduction: 15,
        destinations: ['']
      });
    }
  };

  // تعديل نسبة استقطاع المدير لسائق معين
  const handleUpdateDeduction = async (driverId, newRate) => {
    const { error } = await supabase
      .from('drivers')
      .update({ manager_deduction: Number(newRate) })
      .eq('id', driverId);

    if (!error) {
      fetchData();
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-xl space-y-6 dir-rtl">
      {/* هيدر القسم */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            🏙️ إدارة خطوط داخل العمارة
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            نظام الاشتراكات، مطابقة المناطق، والتوزيع الذكي للطلاب داخل العمارة
          </p>
        </div>

        {/* أزرار التنقل الفرعية */}
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
            onClick={() => setActiveSubTab('drivers')}
            className={`px-4 py-1.5 text-xs rounded-lg font-bold transition ${
              activeSubTab === 'drivers' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
            }`}
          >
            🚘 السائقين والوجهات
          </button>
        </div>
      </div>

      {/* 1. تبويب التوزيع التلقائي واليدوي */}
      {activeSubTab === 'distribution' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div>
              <h3 className="font-bold text-amber-300 text-sm">التوزيع التلقائي المباشر لرحلات الغد</h3>
              <p className="text-xs text-slate-400">يقارن منطقة الطالب بوجهات السائقين ويوزع المداومين تلقائياً</p>
            </div>
            <button
              onClick={handleAutoDistribute}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-lg flex items-center gap-1"
            >
              ⚡ بدء التوزيع التلقائي بمطابقة المناطق
            </button>
          </div>

          {/* قائمة السائقين والطلاب الموزعين عليهم */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drivers.map((driver) => {
              const assignedStudents = students.filter((s) => s.driver_id === driver.id);
              const deductionRate = driver.manager_deduction || 15;

              return (
                <div key={driver.id} className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-700 pb-2">
                    <div>
                      <h4 className="font-bold text-white text-base">{driver.name}</h4>
                      <p className="text-xs text-slate-400">{driver.phone} | {driver.car_type}</p>
                    </div>
                    <span className="bg-slate-900 text-amber-400 text-xs px-2.5 py-1 rounded-lg border border-slate-700">
                      السعة: {assignedStudents.length} / {driver.capacity || 4}
                    </span>
                  </div>

                  {/* مناطق السائق */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">📍 المناطق التي يغطيها:</span>
                    <div className="flex flex-wrap gap-1">
                      {(driver.destinations || []).map((dest, i) => (
                        <span key={i} className="bg-slate-900 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30">
                          {dest}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* نسبة استقطاع المدير */}
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-700">
                    <span className="text-xs text-purple-300 font-bold">👑 نسبة خصم الشركة (المدير):</span>
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

                  {/* نقل الطلاب بين السائقين */}
                  <div className="space-y-1 pt-2">
                    <span className="text-xs font-bold text-slate-300 block">👥 الطلاب المسجلين بالخط:</span>
                    {assignedStudents.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">لا يوجد طلاب محولين لهذا السائق حالياً.</p>
                    ) : (
                      assignedStudents.map((std) => (
                        <div key={std.id} className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg text-xs">
                          <span>{std.name} ({std.district || 'بدون منطقة'})</span>
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

      {/* 2. إضافة سائق جديد مع 10+ مناطق */}
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
              placeholder="رقم الموبايل (اسم المستخدم)"
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

          {/* إضافة المناطق والوجهات (حقول متعددة) */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-emerald-400">📍 المناطق والوجهات التي يغطيها السائق (حتى 10+ مناطق):</label>
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
                  placeholder={`اسم المنطقة ${idx + 1}`}
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
