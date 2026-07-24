import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function SubscribersManager() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubForExam, setSelectedSubForExam] = useState(null);

  // 1. نموذج بيانات المشترك الجديد
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    guardian_name: '',
    guardian_phone: '',
    institution: '',
    college: '',
    stage: '',
    address: '',
    nearest_landmark: '',
    monthly_fee: 0,
    payment_status: 'UNPAID',
    first_day_date: '',
    work_days: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء'],
  });

  // 2. نموذج بيانات الامتحان
  const [examData, setExamData] = useState({
    exam_date: '',
    exam_time: '',
    notes: '',
  });

  const allWeekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // جلب البيانات من سوبابيس
  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscribers')
        .select('*, subscriber_exams(*)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (err) {
      alert('حدث خطأ أثناء جلب البيانات: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // إضافة مشترك
  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('subscribers').insert([formData]);
      if (error) throw error;

      alert('✅ تم تسجيل المشترك بنجاح!');
      setFormData({
        full_name: '',
        phone: '',
        guardian_name: '',
        guardian_phone: '',
        institution: '',
        college: '',
        stage: '',
        address: '',
        nearest_landmark: '',
        monthly_fee: 0,
        payment_status: 'UNPAID',
        first_day_date: '',
        work_days: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء'],
      });
      fetchSubscribers();
    } catch (err) {
      alert('❌ خطأ في الإضافة: ' + err.message);
    }
  };

  // طلب انتهى دوامي
  const handleFinishShift = async (subscriber) => {
    try {
      const { error } = await supabase.from('return_requests').insert([
        {
          subscriber_id: subscriber.id,
          status: 'WAITING_ASSIGNMENT',
        },
      ]);

      if (error) throw error;
      alert(`🛑 تم إرسال طلب "انتهى دوامي" للمشترك: (${subscriber.full_name}) إلى الإدارة والموظفين بنجاح!`);
    } catch (err) {
      alert('❌ خطأ في إرسال الطلب: ' + err.message);
    }
  };

  // إضافة امتحان
  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!selectedSubForExam) return;

    try {
      const { error } = await supabase.from('subscriber_exams').insert([
        {
          subscriber_id: selectedSubForExam.id,
          exam_date: examData.exam_date,
          exam_time: examData.exam_time || null,
          notes: examData.notes,
        },
      ]);

      if (error) throw error;
      alert('✅ تم تسجيل الامتحان بنجاح!');
      setSelectedSubForExam(null);
      setExamData({ exam_date: '', exam_time: '', notes: '' });
      fetchSubscribers();
    } catch (err) {
      alert('❌ خطأ في إضافة الامتحان: ' + err.message);
    }
  };

  // أرشفة المشترك
  const handleArchiveSubscriber = async (id, name) => {
    if (!window.confirm(`هل أنت ألكيد من أرشفة المشترك (${name})؟ لن يتم حذف سجله المالي.`)) return;

    try {
      const { error } = await supabase
        .from('subscribers')
        .update({
          subscription_status: 'ARCHIVED',
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      alert('تمت الأرشفة بنجاح.');
      fetchSubscribers();
    } catch (err) {
      alert('❌ خطأ في الأرشفة: ' + err.message);
    }
  };

  const toggleDay = (day) => {
    setFormData((prev) => {
      const exists = prev.work_days.includes(day);
      return {
        ...prev,
        work_days: exists
          ? prev.work_days.filter((d) => d !== day)
          : [...prev.work_days, day],
      };
    });
  };

  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.full_name?.includes(search) ||
      s.phone?.includes(search) ||
      s.institution?.includes(search)
  );

  return (
    <div style={{ padding: '25px', direction: 'rtl', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* الترويسة */}
      <div style={{ background: '#1e293b', color: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🚍 مسار X — قسم المشتركين والامتحانات</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '14px' }}>إدارة بيانات المشتركين، أوقات الامتحانات، وطلبات الرجوع</p>
      </div>

      {/* نموذج الإضافة */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0, color: '#0f172a', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>➕ إضافة مشترك جديد</h3>
        
        <form onSubmit={handleAddSubscriber}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginTop: '15px' }}>
            
            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>الاسم الكامل *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>رقم الهاتف *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px' }}>اسم ولي الأمر (اختياري)</label>
              <input
                type="text"
                value={formData.guardian_name}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px' }}>هاتف ولي الأمر (اختياري)</label>
              <input
                type="text"
                value={formData.guardian_phone}
                onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>الجامعة / المدرسة / المعهد *</label>
              <input
                type="text"
                required
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px' }}>الكلية / القسم (اختياري)</label>
              <input
                type="text"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px' }}>المرحلة الدراسية (اختياري)</label>
              <input
                type="text"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>العنوان الكامل *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px' }}>أقرب نقطة دالة</label>
              <input
                type="text"
                value={formData.nearest_landmark}
                onChange={(e) => setFormData({ ...formData, nearest_landmark: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>قيمة الاشتراك الشهري *</label>
              <input
                type="number"
                required
                value={formData.monthly_fee}
                onChange={(e) => setFormData({ ...formData, monthly_fee: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>حالة الدفع</label>
              <select
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              >
                <option value="UNPAID">غير مدفوع ❌</option>
                <option value="PAID">مدفوع ✅</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px' }}>تاريخ أول يوم دوام</label>
              <input
                type="date"
                value={formData.first_day_date}
                onChange={(e) => setFormData({ ...formData, first_day_date: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              />
            </div>

          </div>

          <div style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>أيام الدوام:</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {allWeekDays.map((day) => {
                const checked = formData.work_days.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: checked ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: checked ? '#eff6ff' : '#fff',
                      color: checked ? '#1d4ed8' : '#64748b',
                      cursor: 'pointer',
                      fontWeight: checked ? 'bold' : 'normal',
                    }}
                  >
                    {day} {checked ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            style={{ marginTop: '20px', background: '#10b981', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
          >
            حفظ المشترك في النظام 💾
          </button>
        </form>
      </div>

      {/* الجدول */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, color: '#0f172a' }}>📋 قائمة المشتركين ({filteredSubscribers.length})</h3>
          <input
            type="text"
            placeholder="🔍 بحث بالاسم، الهاتف، أو الجامعة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '300px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b' }}>جاري التحميل...</p>
        ) : filteredSubscribers.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>لا يوجد مشتركين مطابقين للبحث.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                  <th style={{ padding: '12px' }}>الاسم</th>
                  <th style={{ padding: '12px' }}>الهاتف</th>
                  <th style={{ padding: '12px' }}>الجهة والعنوان</th>
                  <th style={{ padding: '12px' }}>حالة الدفع</th>
                  <th style={{ padding: '12px' }}>الامتحانات</th>
                  <th style={{ padding: '12px' }}>العمليات</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{sub.full_name}</td>
                    <td style={{ padding: '12px' }}>{sub.phone}</td>
                    <td style={{ padding: '12px' }}>
                      <div>{sub.institution} {sub.college ? `(${sub.college})` : ''}</div>
                      <small style={{ color: '#64748b' }}>{sub.address}</small>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: sub.payment_status === 'PAID' ? '#dcfce7' : '#fee2e2',
                        color: sub.payment_status === 'PAID' ? '#166534' : '#991b1b',
                      }}>
                        {sub.payment_status === 'PAID' ? 'مدفوع ✅' : 'غير مدفوع ❌'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {sub.subscriber_exams && sub.subscriber_exams.length > 0 ? (
                        <div>
                          {sub.subscriber_exams.map((exam) => (
                            <div key={exam.id} style={{ fontSize: '12px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', marginBottom: '2px' }}>
                              🗓️ {exam.exam_date} {exam.exam_time ? `| 🕒 ${exam.exam_time}` : ''}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>لا يوجد</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleFinishShift(sub)}
                          style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          انتهى دوامي 🛑
                        </button>
                        <button
                          onClick={() => setSelectedSubForExam(sub)}
                          style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          + امتحان 📝
                        </button>
                        <button
                          onClick={() => handleArchiveSubscriber(sub.id, sub.full_name)}
                          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          أرشفة 📦
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal إضافة امتحان */}
      {selectedSubForExam && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>📝 إضافة امتحان للمشترك:</h3>
            <p style={{ fontWeight: 'bold', color: '#2563eb' }}>{selectedSubForExam.full_name}</p>

            <form onSubmit={handleAddExam}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>تاريخ الامتحان *</label>
                <input
                  type="date"
                  required
                  value={examData.exam_date}
                  onChange={(e) => setExamData({ ...examData, exam_date: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px' }}>ساعة الامتحان (اختياري)</label>
                <input
                  type="time"
                  value={examData.exam_time}
                  onChange={(e) => setExamData({ ...examData, exam_time: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '13px' }}>ملاحظات</label>
                <textarea
                  value={examData.notes}
                  onChange={(e) => setExamData({ ...examData, notes: e.target.value })}
                  placeholder="مثال: امتحان بقاعة 4"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', height: '60px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedSubForExam(null)}
                  style={{ background: '#94a3b8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  حفظ الامتحان 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
