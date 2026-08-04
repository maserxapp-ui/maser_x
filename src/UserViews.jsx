import React, { useState, useEffect } from 'react';

// 💬 مكون نافذة المحادثة المباشرة (الرسائل السريعة فقط + لون نص أسود واضح)
const DRIVER_QUICK_MESSAGES = [
  "⚠️ تأخرت، يرجى الإسراع.", "⚠️ الرجاء عدم التأخر حفاظًا على وقت الجميع.", "🚗 تم الوصول إلى موقعك.",
  "⏱️ سأنتظر 5 دقائق فقط.", "🚦 سأتحرك الآن.", "⏳ الرحلة متوقفة مؤقتًا.", "🚗 سأمر عليك بعد إنهاء المشترك السابق.",
  "⏳ يوجد تأخير بسيط بسبب انتظار أحد المشتركين.", "📲 إذا لم تتمكن من الحضور أخبرني الآن.", "🏢 أنا عند البوابة الرئيسية.",
  "👋 أين أنت؟", "📞 يرجى الرد.", "⚠️ سأغادر إذا لم تحضر.", "🚗 انطلقت من الموقع.", "🚦 يوجد زحام، سأصل متأخرًا قليلًا.",
  "🚗 انا يم مشترك اخر سأتي خلال دقائق.", "🏠 لقد وصلت.", "👍تمام", "🚗 سأمر عليك بعد قليل.", "👀 لا أستطيع رؤيتك."
];

const STUDENT_QUICK_MESSAGES = [
  "⚠️ تأخرت، يرجى الإسراع.", "👍 تم", "✅ أنا في الطريق", "⏳ أحتاج 5 دقائق.", "🙏 انتظرني قليلًا.",
  "❌ لن أداوم اليوم.", "🚪 أنا أمام الباب.", "📍 لا أرى السيارة.", "👀 أين موقعك؟", "🙏 آسف على التأخير.",
  "👀 لا أستطيع رؤيتك.", "🅿️ أنا في الكراج.", "🏫 أنا عند البوابة الرئيسية.", "📍 أين موقعك؟", "👋 أنا بانتظارك.",
  "✅ يمكنك الانطلاق.", "🚗 هل وصلت؟", "⌛ كم تبقى على وصولك؟"
];

function ChatModal({ isOpen, onClose, studentId, driverId, currentUserRole, supabase }) {
  const [messages, setMessages] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const quickMessages = currentUserRole === 'driver' ? DRIVER_QUICK_MESSAGES : STUDENT_QUICK_MESSAGES;

  const fetchMessages = React.useCallback(async () => {
    if (!studentId || !driverId) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('student_id', String(studentId))
      .eq('driver_id', String(driverId))
      .order('created_at', { ascending: true });

    if (!error && data) setMessages(data);
  }, [studentId, driverId, supabase]);

React.useEffect(() => {
    if (!isOpen || !studentId || !driverId) return;

    fetchMessages();

    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [isOpen, studentId, driverId, fetchMessages]);
 const sendMessage = async (textToSend) => {
    if (!textToSend) return;

    // فحص المعرفات قبل الإرسال
    if (!studentId || !driverId || studentId === 'undefined' || driverId === 'undefined') {
      alert(`خطأ: أحدهما غير معرف!\nstudentId: ${studentId}\ndriverId: ${driverId}`);
      return;
    }

    setLoading(true);
    const newMessage = {
      student_id: String(studentId),
      driver_id: String(driverId),
      sender: currentUserRole,
      text: textToSend
    };

    const { data, error } = await supabase.from('messages').insert([newMessage]).select();

    if (error) {
      console.error("Error sending message:", error);
      alert("سبب رفض الإرسال من Supabase:\n" + error.message);
    } else {
      if (data && data.length > 0) {
        setMessages((prev) => [...prev, data[0]]);
      } else {
        fetchMessages();
      }
    }
    setLoading(false);
  };
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '450px', height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', direction: 'rtl' }}>
        
        {/* Header */}
        <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#ffffff' }}>
            💬 {currentUserRole === 'driver' ? 'محادثة الطالب' : 'محادثة السائق'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Messages list */}
        <div style={{ flex: 1, padding: '12px', overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#000000', marginTop: '20px', fontSize: '13px', fontWeight: 'bold' }}>
              لا توجد رسائل بعد.. اضغط على أي رسالة سريعة من الأسفل للإرسال!
            </p>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender === currentUserRole;
              return (
                <div key={index} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    maxWidth: '85%', 
                    padding: '8px 12px', 
                    borderRadius: '12px', 
                    fontSize: '13px', 
                    fontWeight: 'bold',
                    backgroundColor: isMe ? '#fef3c7' : '#ffffff', 
                    color: '#000000', // لون النصوص أسود واضح 
                    border: isMe ? '1px solid #f59e0b' : '1px solid #cbd5e1' 
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Messages ONLY */}
        <div style={{ padding: '12px', backgroundColor: '#ffffff', borderTop: '2px solid #e2e8f0', maxHeight: '250px', overflowY: 'auto' }}>
          <div style={{ fontSize: '12px', color: '#000000', fontWeight: 'bold', marginBottom: '8px' }}>⚡ اختر رسالة سريعة للإرسال:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {quickMessages.map((msg, idx) => (
              <button 
                key={idx} 
                disabled={loading} 
                onClick={() => sendMessage(msg)} 
                style={{ 
                  fontSize: '12px', 
                  backgroundColor: '#f1f5f9', 
                  color: '#000000', 
                  fontWeight: 'bold',
                  border: '1px solid #64748b', 
                  borderRadius: '10px', 
                  padding: '8px 12px', 
                  cursor: loading ? 'wait' : 'pointer',
                  textAlign: 'right'
                }}
              >
                {msg}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function UserViews({ supabase, onBackToAdmin, logoImg, loginRole, setLoginRole }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(() => {
  try {
    const saved = localStorage.getItem('maser_currentUser');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
});
  const [assignedDriver, setAssignedDriver] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const studentData = user;
  
  // حالات تفاعل الطالب
  const [tomorrowStatus, setTomorrowStatus] = useState(null);
  const [shiftFinished, setShiftFinished] = useState(false);
  const [actionAlert, setActionAlert] = useState('');
  const [isStudentChatOpen, setIsStudentChatOpen] = useState(false);
  // 🚕 حالة ودالة جلب بيانات سائق العودة للطالبة
  const [assignedReturnDriver, setAssignedReturnDriver] = useState(null);

  useEffect(() => {
    const fetchReturnDriver = async () => {
      if (user?.return_driver_id) {
        const { data } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', user.return_driver_id)
          .single();
        if (data) setAssignedReturnDriver(data);
      }
    };
    fetchReturnDriver();
  }, [user]);
  // 📅 حساب اسم يوم الغد تلقائيfاً بحسب تاريخ اليوم الحالي
  const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const tomorrowIndex = (new Date().getDay() + 1) % 7;
  const tomorrowName = daysOfWeek[tomorrowIndex];

  // التبديل بين الشاشات السفلية: 'main' أو 'settings'
  const [activeTab, setActiveTab] = useState('main');

  // 🎓 دالة إنهاء الدوام والتجميع التلقائي لكل 4 طالبات
  const handleFinishShift = async () => {
    try {
      const { error: updateErr } = await supabase
        .from('students')
        .update({ finish_status: 'finished' })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      const { data: unassignedStudents, error: fetchErr } = await supabase
        .from('students')
        .select('id')
        .eq('finish_status', 'finished')
        .is('return_driver_id', null);

      if (fetchErr) throw fetchErr;

      if (unassignedStudents && unassignedStudents.length >= 4) {
        const { data: drivers } = await supabase.from('drivers').select('id');

        if (drivers && drivers.length > 0) {
          const chosenDriver = drivers[0];
          const groupOfFour = unassignedStudents.slice(0, 4).map(s => s.id);

          await supabase
            .from('students')
            .update({ 
              return_driver_id: chosenDriver.id, 
              return_approved: false 
            })
            .in('id', groupOfFour);
        }
      }

      alert('تم تسجيل إنهاء دوامك بنجاح! سيتم ترتيب سيارة العودة واعتمادها من الإدارة.');
      
      if (typeof fetchStudentData === 'function') {
        fetchStudentData();
      } else {
        window.location.reload();
      }

    } catch (err) {
      console.error('خطأ أثناء تسجيل إنهاء الدوام:', err);
      alert('حدث خطأ أثناء حفظ الحالة، يرجى المحاولة مرة أخرى.');
    }
  };

  // 🕒 حالات توقيت بغداد والعداد التنازلي
  const [baghdadTime, setBaghdadTime] = useState('');
  const [countdown, setCountdown] = useState('');
  const [isAfter9PM, setIsAfter9PM] = useState(false);

  // ⏱️ مكرر ثواني لتحديث توقيت بغداد والعداد التنازلي
  useEffect(() => {
    const updateBaghdadClockAndCountdown = () => {
      const now = new Date();
      
      // 1️⃣ تحويل الوقت الحالي لتوقيت بغداد (Asia/Baghdad)
      const baghdadStr = now.toLocaleString('en-US', { timeZone: 'Asia/Baghdad' });
      const baghdadDate = new Date(baghdadStr);

      // تنسيق الساعة بالعربية
      const timeFormatted = baghdadDate.toLocaleTimeString('ar-IQ', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setBaghdadTime(timeFormatted);

      // 2️⃣ حساب الوقت المتبقي حتى الساعة 9:00 مساءً (21:00) بتوقيت بغداد
      let target9PM = new Date(baghdadDate);
      target9PM.setHours(21, 0, 0, 0);

      const currentHour = baghdadDate.getHours();

      if (currentHour >= 21) {
        // إذا عبرت 9 مساءً، يستهدف العداد 9 مساءً للغد
        target9PM.setDate(target9PM.getDate() + 1);
        setIsAfter9PM(true);
      } else {
        setIsAfter9PM(false);
      }

      const diffMs = target9PM - baghdadDate;
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (num) => String(num).padStart(2, '0');
      setCountdown(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };

    updateBaghdadClockAndCountdown();
    const timer = setInterval(updateBaghdadClockAndCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

 // 🔑 تسجيل الدخول (السائق والطالب - مع الحفظ التلقائي في ذاكرة الجهاز)
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phone || !password) {
      setErrorMsg('يرجى إدخال رقم الهاتف وكلمة السر');
      return;
    }

    try {
      if (loginRole === 'driver') {
        // 🚗 البحث في السائقين فقط
        let { data: driver } = await supabase
          .from('drivers')
          .select('*')
          .eq('phone', phone.trim())
          .eq('password', password.trim())
          .maybeSingle();

        if (driver) {
          const driverData = { ...driver, role: 'driver' };
          setUser(driverData);
          
          // 💾 1. حفظ بيانات السائق في ذاكرة الجهاز لكي لا تضيع عند الـ F5
          localStorage.setItem('maser_currentUser', JSON.stringify(driverData));
          return;
        }
        setErrorMsg('بيانات دخول السائق غير صحيحة');
      } else {
        // 🎓 البحث في الطلاب فقط
        let { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('phone', phone.trim())
          .eq('password', password.trim())
          .maybeSingle();

        if (student) {
          const studentData = { ...student, role: 'student' };
          setUser(studentData);
          
          // 💾 2. حفظ بيانات الطالب في ذاكرة الجهاز لكي لا تضيع عند الـ F5
          localStorage.setItem('maser_currentUser', JSON.stringify(studentData));

          setTomorrowStatus(student.tomorrow_status || null);
          setShiftFinished(student.shift_status === 'أنهيت دوامي');
          await fetchDriverForStudent(student);
          return;
        }
        setErrorMsg('رقم الهاتف أو كلمة السر غير صحيحة');
      }
    } catch (err) {
      setErrorMsg('حدث خطأ أثناء الاتصال بقاعدة البيانات');
    }
  };
  
 // 1️⃣ جلب بيانات السائق الخاص بالطالب
  const fetchDriverForStudent = async (student) => {
    try {
      if (!student) return;
      let driverQuery = supabase.from('drivers').select('*');
      
      if (student.driver_id) {
        driverQuery = driverQuery.eq('id', student.driver_id);
      } else if (student.driver_name) {
        driverQuery = driverQuery.eq('name', student.driver_name);
      } else {
        return;
      }

      const { data: driverData } = await driverQuery.maybeSingle();
      if (driverData && typeof setAssignedDriver === 'function') {
        setAssignedDriver(driverData);
      }
    } catch (e) {
      console.log('خطأ في جلب بيانات السائق:', e);
    }
  };

// 👨‍🎓 جلب طلاب السائق (تصفية آمنة في المتصفح تمنع أخطاء 400 نهائياً)
  const fetchStudentsForDriver = async (driver) => {
    try {
      if (!driver) return;

      // 1️⃣ جلب جميع الطلاب باستعلام بسيط بدون شروط سيرفر مسببة للخطأ
      const { data: allStudents, error } = await supabase
        .from('students')
        .select('*');

      if (error) {
        console.error('❌ خطأ في جلب البيانات من السيرفر:', error.message);
        return;
      }

      // 2️⃣ استخراج معرّف دخول السائق الحالية (مثل "22")
      const loginVal = String(driver.phone || driver.username || driver.name || driver.id || '').trim();

      // 3️⃣ المطابقة والفلترة بأمان داخل المتصفح
      const myStudents = (allStudents || []).filter(student => {
        const sDriverId = String(student.driver_id || '').trim();
        const sDriverPhone = String(student.driver_phone || '').trim();
        const sDriverName = String(student.driver_name || student.driver || '').trim();

        return (
          (sDriverId !== '' && sDriverId === loginVal) ||
          (sDriverPhone !== '' && sDriverPhone === loginVal) ||
          (sDriverName !== '' && sDriverName === loginVal)
        );
      });

      console.log('✅ الطلاب المكتشفون في المتصفح:', myStudents);

      if (typeof setDriverStudents === 'function') {
        setDriverStudents(myStudents);
      }
    } catch (e) {
      console.error('خطأ غير متوقع أثناء معالجة البيانات:', e);
    }
  };

  // 📍 دالة جلب وتحديث الموقع على الخريطة
  const handleSaveLocation = () => {
    if (!navigator.geolocation) {
      alert('❌ نظام الـ GPS غير مدعوم في متصفحك');
      return;
    }

    alert('جاري تحديد موقعك الحالي... ⏳');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const { error } = await supabase
          .from('students')
          .update({ latitude: lat, longitude: lng })
          .eq('id', user.id);

        if (!error) {
          alert('✅ تم حفظ موقعك بنجاح!');
        } else {
          alert('❌ حدث خطأ أثناء حفظ الموقع');
        }
      },
      (err) => {
        alert('⚠️ يرجى السماح للتطبيق بالوصول للموقع (GPS)');
      }
    );
  };
  // 🔄 دالة تصفير رحلة السائق والبدء بيوم جديد
  const handleDriverResetTrip = async () => {
    const confirmReset = window.confirm(
      "⚠️ هل أنت متأكد من تصفير رحلتك وإعادة كافة الحالات للبدء بيوم جديد؟"
    );
    if (!confirmReset) return;

    try {
      // 1️⃣ تصفير حالة الرحلة للسائق نفسه في جدول drivers (حذف completed)
      const { error: driverErr } = await supabase
        .from('drivers')
        .update({ trip_status: null })
        .eq('id', user.id);

      if (driverErr) throw driverErr;

      // 2️⃣ تصفير حالات جميع الطالبات التابعات لهذا السائق في جدول students
      await supabase
        .from('students')
        .update({
          is_boarded: false,
          is_boarded_return: false,
          is_dropped_return: false,
          finish_status: null
        })
        .or(`driver_id.eq.${user.id},return_driver_id.eq.${user.id}`);

      alert("✅ تم تصفير الرحلة بنجاح! التطبيق جاهز للرحلة القادمة.");
      window.location.reload(); // تحديث الواجهة فوراً
    } catch (err) {
      console.error("خطأ التصفير:", err);
      alert("❌ حدث خطأ أثناء تصفير الرحلة: " + err.message);
    }
  };
  // 🔔 إرسال الإشعار للإدارة والسائق
const handleStudentAction = async (actionType, labelText) => {
  if (!user) return;

  setActionAlert(`جاري إرسال: "${labelText}"...`);

  try {
    // 1️⃣ تحديد القيم التي ستُحفظ في Supabase بناءً على نوع الزر
    let statusValue = null;
    let noteValue = null;

    if (actionType === 'exam_exception') {
      noteValue = labelText; // حفظ نص الاستثناء والوقت
    } else if (actionType === 'absent' || labelText.includes('لا أداوم')) {
      statusValue = 'لا أداوم غداً'; // حفظ الغياب
    } else if (actionType === 'attending' || labelText.includes('أداوم غداً')) {
      statusValue = 'أداوم غداً'; // 🟢 حفظ الدوام الصريح لعمود tomorrow_status
    }

    // 2️⃣ تحديث الجدول في Supabase بالشكل الصحيح
    const { error: updateError } = await supabase
      .from('students')
      .update({ 
        tomorrow_status: statusValue, // 👈 كتابة حالة الدوام بالعمود الجديد
        exam_note: noteValue          // 👈 كتابة ملاحظة الامتحان
      })
      .eq('id', user.id);

    if (updateError) {
      alert(`⚠️ خطأ من Supabase:\n${updateError.message}`);
      throw updateError;
    }

    setTomorrowStatus(labelText);

    // 3️⃣ إرسال الإشعار للسائق والإدارة
    try {
      await supabase.from('notifications').insert([
        {
          student_id: user.id,
          student_name: user.name,
          driver_id: assignedDriver?.id || null,
          driver_name: assignedDriver?.name || user.driver_name || null,
          title: `تحديث من الطالب: ${user.name}`,
          message: `قام الطالب بـ: ${labelText}`,
          type: actionType,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (e) {
      console.warn('Could not insert notification:', e);
    }

    setActionAlert(`تم إرسال إشعار "${labelText}" بنجاح! ✅`);
    setTimeout(() => setActionAlert(''), 4000);

  } catch (err) {
    console.error('Error:', err);
    setActionAlert(`❌ حدث خطأ أثناء إرسال الطلب`);
    setTimeout(() => setActionAlert(''), 4000);
  }
};
  const handleLogout = () => {
    setUser(null);
    setAssignedDriver(null);
    setPhone('');
    setPassword('');
    setErrorMsg('');
    setActiveTab('main');
  };
  // 1️⃣ شاشة تسجيل الدخول
  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '40px auto', padding: '30px 20px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontFamily: 'sans-serif', backgroundColor: '#ffffff', direction: 'rtl' }}>
        <div style={{ marginBottom: '15px' }}>
          <img 
            src="/logo.png" 
            alt="مسار إكس" 
            style={{ width: '150px', height: 'auto', maxHeight: '100px', objectFit: 'contain', margin: '0 auto' }} 
          />
        </div>
        <h2 style={{ margin: '10px 0 5px 0', color: '#0f172a', fontSize: '20px', fontWeight: 'bold' }}>
  {loginRole === 'student' ? 'تطبيق مسار إكس 🚌' : 'واجهة السائق 🚗'}
</h2>
<p style={{ color: '#64748b', fontSize: '13px', marginBottom: '25px' }}>
  {loginRole === 'student' ? 'أدخل رقم الهاتف وكلمة السر للدخول إلى حسابك' : 'تسجيل دخول السائقين المقيدين بالنظام'}
</p>

        {errorMsg && <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '13px', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca' }}>{errorMsg}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <label style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>رقم الهاتف</label>
            <input
              type="text"
              placeholder="0770XXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '14px',
                color: '#000000',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ textAlign: 'right' }}>
            <label style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>كلمة السر</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '14px',
                color: '#000000',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button type="submit" style={{ padding: '14px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '10px' }}>
            تسجيل الدخول
          </button>
          {/* زر التبديل بين دخول الطالب ودخول السائق */}
        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
            {loginRole === 'student' ? 'هل أنت سائق في الشفرة؟' : 'هل أنت طالب أو مشترك؟'}
          </p>

          <button
            type="button"
            onClick={() => setLoginRole(loginRole === 'student' ? 'driver' : 'student')}
            style={{
              width: '100%',
              padding: '10px 15px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: loginRole === 'student' ? '#1e293b' : '#fff7ed',
              color: loginRole === 'student' ? '#ffffff' : '#ea580c',
              border: loginRole === 'student' ? 'none' : '1px solid #ffedd5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>{loginRole === 'student' ? '🚗' : '🎓'}</span>
            <span>
              {loginRole === 'student'
                ? 'تسجيل الدخول كـ سائق'
                : 'العودة لتسجيل دخول الطالب'}
            </span>
          </button>
        </div>
        </form>

        <button onClick={onBackToAdmin} style={{ marginTop: '25px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px' }}>
          الرجوع للوحة الإدارة
        </button>
      </div>
    );
  }

// 🚗 استدعاء واجهة السائق الحقيقية
if (user && user.role === 'driver') {
  return <DriverView user={user} setUser={setUser} supabase={supabase} />;
}

  const isAllowedStatus = ['مدفوع', 'paid', 'متاخر', 'متأخر'].includes(user.status);

  // 2️⃣ شاشة الحساب غير المفعل
  if (!isAllowedStatus && user.role === 'student') {
    return (
      <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', textAlign: 'center', border: '2px solid #ef4444', borderRadius: '20px', backgroundColor: '#fef2f2', fontFamily: 'sans-serif', direction: 'rtl' }}>
        <div style={{ fontSize: '50px', marginBottom: '10px' }}>🛑</div>
        <h2 style={{ color: '#991b1b', margin: '0 0 10px 0' }}>الحساب غير مفعل!</h2>
        <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
          أهلاً بك <b>{user.name}</b>، اشتراكك حالياً غير مفعل بانتظار الدفع أو التفعيل من الإدارة.
        </p>
        <button onClick={handleLogout} style={{ marginTop: '20px', padding: '10px 24px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
          تسجيل الخروج
        </button>
      </div>
    );
  }

  // 3️⃣ الواجهة الرئيسية
  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', direction: 'rtl', paddingBottom: '90px' }}>
      
      {/* 🔝 الهيدر العلوي */}
      <div style={{ backgroundColor: '#ffffff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#e2e8f0', overflow: 'hidden', border: '2px solid #0284c7' }}>
            <img src="/logo.png" alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e)=>{e.target.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png';}} />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>{user.name}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>{user.phone}</div>
          </div>
        </div>

        {/* الشعار المكبر */}
        <div>
          <img src="/logo.png" alt="مسار إكس" style={{ height: '52px', objectFit: 'contain' }} />
        </div>
      </div>

      {activeTab === 'main' ? (
        <div style={{ padding: '15px' }}>
          
          {/* 🇮🇶 كارت توقيت بغداد + العداد التنازلي */}
          <div style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '16px', padding: '15px', marginBottom: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold' }}>🇮🇶 توقيت بغداد الحالي:</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8', direction: 'ltr' }}>{baghdadTime}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f1f5f9' }}>
                  {isAfter9PM ? '🌙 جدول الغد مفعل حالياً' : '⏳ المتبقي لتغيير جدول السائق (9:00 م):'}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>تحديث تلقائي في تمام التاسعة مساءً</div>
              </div>

              <div style={{ backgroundColor: '#1e293b', border: '1px solid #0284c7', padding: '6px 12px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', color: '#38bdf8', direction: 'ltr', letterSpacing: '1px' }}>
                {countdown}
              </div>
            </div>
          </div>

          {/* تنبيه الإشعارات */}
          {actionAlert && (
            <div style={{ backgroundColor: '#f0fdf4', color: '#15803d', padding: '12px', borderRadius: '12px', fontSize: '12px', marginBottom: '15px', border: '1px solid #bbf7d0', fontWeight: 'bold', textAlign: 'center' }}>
              {actionAlert}
            </div>
          )}

         {/* قسم خيارات الطالب ⚡ */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>⚡ تأكيد التواجد والإشعارات</h3>

        {/* كارت عرض أيام دوام الطالبة المسجلة */}
        <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>📌 أيام دوامك المسجلة: </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px', justifyContent: 'flex-start' }}>
            {(user?.work_days && user.work_days.length > 0 ? user.work_days : ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']).map((day, idx) => (
              <span key={idx} style={{ backgroundColor: '#e2e8f0', color: '#1e293b', fontSize: '11px', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                {day}
              </span>
            ))}
          </div>
        </div>

        {/* أزرار التواجد والامتحان */}
        {(() => {
          const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
          const tomorrowIndex = (new Date().getDay() + 1) % 7;
          const tomorrowName = days[tomorrowIndex];

          const isWorkDay = user?.work_days && Array.isArray(user.work_days) && user.work_days.length > 0
            ? user.work_days.includes(tomorrowName)
            : true;

          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              
              {/* زر أداوم غداً */}
              <button
                onClick={() => {
                  if (!isWorkDay) {
                    alert(`⚠️ ليس لديك دوام غداً (${tomorrowName}) في النظام!`);
                  } else {
                    handleStudentAction('attending', 'أداوم غداً');
                  }
                }}
                style={{
                  padding: '12px 8px',
                  borderRadius: '10px',
                  border: tomorrowStatus === 'أداوم غداً' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                  backgroundColor: tomorrowStatus === 'أداوم غداً' ? '#dcfce7' : (isWorkDay ? '#ffffff' : '#f1f5f9'),
                  color: isWorkDay ? '#15803d' : '#94a3b8',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}>
                🟢 أداوم غداً
              </button>

              {/* زر لا أداوم غداً */}
              <button
                onClick={() => handleStudentAction('not_attending', 'لا أداوم غداً')}
                style={{
                  padding: '12px 8px',
                  borderRadius: '10px',
                  border: tomorrowStatus === 'لا أداوم غداً' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                 backgroundColor: tomorrowStatus === 'لا أداوم غداً' ? '#fef2f2' : '#ffffff',
                  color: '#b91c1c',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}>
                🔴 لا أداوم غداً
              </button>


  {/* 🟢 تنبيه الطالب عندما يضغط السائق "أنا في طريقي إليكم" */}
  {assignedDriver?.trip_status === 'on_the_way' && (
    <div style={{
      backgroundColor: '#dcfce7',
      border: '2px solid #22c55e',
      borderRadius: '12px',
      padding: '14px',
      marginBottom: '15px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(34, 197, 94, 0.2)'
    }}>
      <span style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>🚕</span>
      <strong style={{ color: '#15803d', fontSize: '14px' }}>
        يرجى انتظار السائق، فهو في طريقه إليكم الآن! يُرجى متابعة الموقع لحظة بلحظة.
      </strong>
    </div>
  )}


              {/* 📍 زر تحديد الموقع */}
<button
  onClick={handleSaveLocation}
  style={{
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '10px',
    backgroundColor: '#0284c7',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '12px',
    border: 'none',
    cursor: 'pointer'
  }}
>
  📍 تحديد / تحديث موقعي على الخريطة
</button>

              {/* 📝 زر لدي امتحان (تم ربطه بعمود exam_note مع الحفاظ على كودك) */}
              {!isWorkDay && (
                <button
                  onClick={async () => {
                    const examTime = prompt(`📝 غداً (${tomorrowName}) ليس ضمن دوامك الرسمي.\nيرجى تحديد وقت الامتحان (مثال: من الساعة 8:00 صباحاً إلى 11:30 صباحاً):`);
                    if (examTime && examTime.trim() !== '') {
                      try {
                        // حفظ وقت الامتحان في عمود exam_note بـ Supabase
                        await supabase
                          .from('students')
                          .update({
                            exam_note: examTime.trim(),
                            tomorrow_status: `لدي امتحان غداً (${examTime.trim()})`,
                            is_absent: false
                          })
                          .eq('id', user.id);
                      } catch (err) {
                        console.error('خطأ بالحفظ:', err);
                      }
                      
                      // استدعاء الدالة الخاصة بك
                      handleStudentAction('exam_exception', `لدي امتحان غداً (${examTime})`);
                    }
                  }}
                  style={{
                    gridColumn: 'span 2',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '2px solid #e11d48',
                    backgroundColor: '#ffe4e6',
                    color: '#be123c',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}>
                  📝 لدي امتحان غداً (طلب استثناء)
                </button>
              )}

            </div>
          );
        })()}

        {/* 🎓 زر أنهيت دوامي والتجميع التلقائي */}
        <button
          onClick={handleFinishShift}
          disabled={
            studentData?.finish_status === 'finished' ||
            !(studentData?.work_days && studentData.work_days.includes(['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][new Date().getDay()])) ||
            studentData?.tomorrow_status === 'لا أداوم غداً' ||
            studentData?.tomorrow_status === 'غائب'
          }
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: (
              studentData?.finish_status === 'finished' ||
              !(studentData?.work_days && studentData.work_days.includes(['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][new Date().getDay()])) ||
              studentData?.tomorrow_status === 'لا أداوم غداً' ||
              studentData?.tomorrow_status === 'غائب'
            ) ? '#94a3b8' : '#8b5cf6',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: (
              studentData?.finish_status === 'finished' ||
              !(studentData?.work_days && studentData.work_days.includes(['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][new Date().getDay()])) ||
              studentData?.tomorrow_status === 'لا أداوم غداً' ||
              studentData?.tomorrow_status === 'غائب'
            ) ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 8px rgba(139, 92, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
          {studentData?.finish_status === 'finished'
            ? 'تم تسجيل إنهاء دوامكِ اليوم ✅'
            : !(studentData?.work_days && studentData.work_days.includes(['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][new Date().getDay()]))
            ? 'ليس لديكِ دوام رسمي اليوم 🚫'
            : (studentData?.tomorrow_status === 'لا أداوم غداً' || studentData?.tomorrow_status === 'غائب')
            ? 'أنتِ مسجلة غياب اليوم ⚠️'
            : 'أنهيت دوامي (تنسيق سيارة العودة) 🎓'}
        </button>

      </div>
     )}
          {/* 🟢 كارت رحلة الذهاب */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '15px', marginBottom: '15px', border: '1px solid #10b981', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px dashed #f1f5f9' }}>
              <span style={{ fontWeight: 'bold', color: '#059669', fontSize: '14px' }}>🟢 رحلة الذهاب</span>
              <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                {assignedDriver ? 'مؤكدة ✔️' : 'بانتظار التوزيع ⏳'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', fontSize: '12px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 5px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '10px' }}>الجهة / الجامعة</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', margin: '3px 0', fontSize: '11px' }}>{user.university || 'غير محدد'}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '10px 5px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '10px' }}>📍 المنطقة / السكن</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', margin: '3px 0', fontSize: '11px' }}>{user.location || 'غير محدد'}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '10px 5px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '10px' }}>السيارة</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', margin: '3px 0', fontSize: '11px' }}>
                  {assignedDriver?.car_model || assignedDriver?.car_type || assignedDriver?.car || 'لم تحدد بعد'}
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '10px 5px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '10px' }}>السائق المخصص</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', margin: '3px 0', fontSize: '11px' }}>
                  {assignedDriver?.name || user.driver_name || 'لم يحدد بعد'}
                </div>
                {assignedDriver && (
                  <button
                    onClick={() => setIsStudentChatOpen(true)}
                    style={{ display: 'inline-block', marginTop: '6px', backgroundColor: '#f59e0b', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    💬 مراسلة السائق
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 🎒 كارت رحلة العودة المحدث للطالبة */}
        {assignedReturnDriver && studentData?.return_approved ? (
          <div style={{
            backgroundColor: '#eff6ff',
            border: '2px solid #3b82f6',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            <h4 style={{ color: '#1d4ed8', margin: '0 0 6px 0', fontSize: '15px' }}>🚗 رحلة العودة الخاصة بكِ جاهزة</h4>
            <p style={{ fontSize: '13px', color: '#1e40af', margin: '0 0 10px 0' }}>
              السائق المسؤول عن عودتكِ: <b>{assignedReturnDriver.full_name || 'سائق العودة'}</b>
            </p>

           <button
  onClick={() => handleOpenDriverChat(assignedReturnDriver || returnDriver)}
  style={{
    width: '100%',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
  }}>
  💬 مراسلة السائق
</button>
          </div>
        ) : studentData?.finish_status === 'finished' ? (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '15px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#b45309',
            fontWeight: 'bold'
          }}>
            ⌛ تم تسجيل إنهاء الدوام! جاري جلب سيارات العودة وتجميع الطالبات بانتظار اعتماد الإدارة...
          </div>
        ) : null}
{/* 🎧 قسم الدعم الفني لصفحة الطالب */}
        <div className="mt-8 p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-slate-700 font-bold text-sm">
            <span className="text-emerald-500 text-lg">🎧</span>
            <span>إذا واجهتك أي مشكلة، تواصل مع الدعم الفني:</span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3">
            {/* الرقم الأول */}
            <a 
              href="https://wa.me/9647888978111" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-4 py-2.5 rounded-xl border border-emerald-200/60 text-xs transition-all shadow-xs"
            >
              <span>💬</span>
              <span className="tracking-wider">07888978111</span>
            </a>

            {/* الرقم الثاني */}
            <a 
              href="https://wa.me/9647750074100" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl border border-slate-200 text-xs transition-all shadow-xs"
            >
              <span>💬</span>
              <span className="tracking-wider">07750074100</span>
            </a>
          </div>
        </div>
          </div>
      ) : (
        /* ⚙️ تبويب الإعدادات */
        <div style={{ padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', fontSize: '16px' }}>👤 معلومات الحساب الشخصي</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>اسم المشترك:</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{user.name}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>رقم الهاتف:</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{user.phone}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>الجهة / الجامعة:</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{user.university || 'غير محدد'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>قيمة الاشتراك:</span>
                <span style={{ fontWeight: 'bold', color: '#059669' }}>{user.price ? `${user.price} د.ع` : 'غير محدد'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>حالة الاشتراك:</span>
                <span style={{ fontWeight: 'bold', color: user.status === 'متاخر' || user.status === 'متأخر' ? '#d97706' : '#16a34a' }}>
                  {user.status === 'متاخر' || user.status === 'متأخر' ? '🟡 متأخر بالدفع' : '🟢 مدفوع ومفعل'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>السائق المخصص:</span>
                <span style={{ fontWeight: 'bold', color: '#0284c7' }}>
                  {assignedDriver?.name || user.driver_name || 'لم يحدد بعد'}
                </span>
              </div>
            </div>

            <button 
  onClick={() => {
    // 🗑️ مسح بيانات الجلسة من ذاكرة الجهاز
    localStorage.removeItem('maser_currentUser');
    localStorage.removeItem('maser_viewMode');
    localStorage.removeItem('maser_loginRole');

    // 🔄 تنفيذ دالة تسجيل الخروج الأصلية
    if (typeof handleLogout === 'function') handleLogout();
  }}
  style={{ width: '100%', marginTop: '25px', padding: '12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
  🚪 تسجيل الخروج
</button>
          </div>
        </div>
      )}
      <ChatModal
  isOpen={isStudentChatOpen}
  onClose={() => setIsStudentChatOpen(false)}
  studentId={user.id}
  driverId={assignedDriver?.id || user.driver_id}
  currentUserRole="student"
  supabase={supabase}
/>
      {/* 🔻 الشريط السفلي */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0', zIndex: 100, maxWidth: '500px', margin: '0 auto' }}>
        
        <button 
          onClick={() => setActiveTab('main')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', color: activeTab === 'main' ? '#0284c7' : '#94a3b8' }}>
          <span style={{ fontSize: '22px' }}>🏠</span>
          <span style={{ fontSize: '12px', fontWeight: activeTab === 'main' ? 'bold' : 'normal' }}>الرئيسية</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', color: activeTab === 'settings' ? '#0284c7' : '#94a3b8' }}>
          <span style={{ fontSize: '22px' }}>⚙️</span>
          <span style={{ fontSize: '12px', fontWeight: activeTab === 'settings' ? 'bold' : 'normal' }}>الإعدادات</span>
        </button>

      </div>
{/* 💬 نافذة المحادثة المباشرة مع السائق */}
<ChatModal
  isOpen={isChatOpen}
  onClose={() => setIsChatOpen(false)}
  studentId={studentData?.id || student?.id} // يمرر id الطالبة الحالية
  driverId={activeChatDriverId}              // يمرر id سائق العودة
  currentUserRole="student"                 // يحدد دور المستخدم كطالبة
  supabase={supabase}                       // متصفح Supabase
/>
    </div>
  );
}
// 🚗 مكون واجهة السائق الشامل والمصحح
function DriverView({ user, setUser, supabase }) {
  const [students, setStudents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [isDriverChatOpen, setIsDriverChatOpen] = React.useState(false);
  const [selectedStudentForChat, setSelectedStudentForChat] = React.useState(null);
  // 🟢 كود التوقيت والتحقق من موافقة الإدارة (ساعة 9 بليل)
  const [isApprovedByAdmin, setIsApprovedByAdmin] = React.useState(true);
  const [isAfter9PM, setIsAfter9PM] = React.useState(false);

  // 🆕 حالات تتبع الرحلة ومواعيد المراسلة
  const [isChatWindowOpen, setIsChatWindowOpen] = React.useState(false);
  const [driverTripStatus, setDriverTripStatus] = React.useState('not_started');

      // 🚗 حالات ودالة جلب باقة طالبات العودة الخاصة بالسائق
  const [returnTripStudents, setReturnTripStudents] = React.useState([]);

  const fetchDriverReturnStudents = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('return_driver_id', user.id)
      .eq('finish_status', 'finished');

    if (!error && data) {
      setReturnTripStudents(data);
    }
  };

  React.useEffect(() => {
    fetchDriverReturnStudents();
  }, [user]);
  React.useEffect(() => {
    const checkTimeAndApproval = async () => {
      const now = new Date();
      const baghdadHour = (now.getUTCHours() + 3) % 24;
      const baghdadMinute = now.getUTCMinutes();

      // 🕒 تصفير وتحديث التوزيع يومياً الساعة 6:30 مساءً (18:30)
      if (baghdadHour === 18 && baghdadMinute >= 30) {
        await supabase.from('system_settings').upsert({ key: 'trips_approved_today', value: 'false' });
      // 2. 🚗 تصفير حالة الرحلة وصعود الطلاب لليوم الجديد (الإضافة الجديدة)
  if (user?.id) {
    await supabase.from('drivers').update({ trip_status: 'not_started' }).eq('id', user.id);
    await supabase.from('students').update({ is_boarded: false }).eq('driver_id', user.id);
    setDriverTripStatus('not_started');
  }
}

      // 🕒 نافذة المراسلة مفتوحة فقط من 6:00 صباحاً إلى 9:00 صباحاً
      const canChat = baghdadHour >= 6 && baghdadHour < 9;
      setIsChatWindowOpen(canChat);

      const after9 = baghdadHour >= 21 || baghdadHour < 4;
      setIsAfter9PM(after9);

      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'trips_approved_today')
        .maybeSingle();

      setIsApprovedByAdmin(data?.value === 'true');
    };

    checkTimeAndApproval();
  }, []);

  // 🔄 جلب الطلاب المرتبطين بالسائق ذكياً
  const fetchStudents = async () => {
    if (!user || !supabase) return;
    setLoading(true);
    try {
      const cleanPhone = user.phone ? String(user.phone).trim() : '';
      const cleanName = user.name ? String(user.name).trim() : '';

      // 1. البحث عن بيانات السائق في جدول drivers لجلب id الخاص به وحالة الرحلة
      let realDriverId = user.id;
      const { data: driverRow } = await supabase
        .from('drivers')
        .select('id, name, phone, trip_status')
        .or(`phone.eq.${cleanPhone},name.eq.${cleanName}`)
        .maybeSingle();

      if (driverRow) {
        realDriverId = driverRow.id;
        if (driverRow.trip_status) setDriverTripStatus(driverRow.trip_status);
      }

      // 2. صياغة الاستعلام لجدول الطلاب بجميع الاحتمالات
      const conditions = [];
      if (realDriverId) conditions.push(`driver_id.eq.${realDriverId}`);
      if (cleanPhone) conditions.push(`driver_phone.eq.${cleanPhone}`);
      if (cleanName) {
        conditions.push(`driver_name.eq.${cleanName}`);
        conditions.push(`assigned_driver.eq.${cleanName}`);
      }

      if (conditions.length > 0) {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .or(conditions.join(','));

        if (!error && data) {
          setStudents(data);
        } else if (error) {
          console.error('خطأ في استعلام الطلاب:', error);
        }
      }
    } catch (err) {
      console.error('خطأ في جلب الطلاب:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStudents();
  }, [user]);

  // 🚗 وظائف تتبع الرحلة وصعود الطلاب
  const handleStartJourney = async () => {
    try {
      if (user?.id) {
        await supabase.from('drivers').update({ trip_status: 'on_the_way' }).eq('id', user.id);
        setDriverTripStatus('on_the_way');
        alert('📢 تم إرسال إشعار للطلاب: أنك في الطريق إليهم الآن!');
      }
    } catch (err) {
      alert('خطأ في التحديث: ' + err.message);
    }
  };

  const handleStudentBoarded = async (studentId) => {
    try {
      await supabase.from('students').update({ is_boarded: true }).eq('id', studentId);
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, is_boarded: true } : s));
    } catch (err) {
      alert('خطأ في تحديث حالة الطالب: ' + err.message);
    }
  };

  const handleCompleteTrip = async () => {
    try {
      if (user?.id) {
        await supabase.from('drivers').update({ trip_status: 'completed' }).eq('id', user.id);
        setDriverTripStatus('completed');
        alert('🎉 ممتاز! أتممت الرحلة وأوصلت جميع الطلاب بنجاح.');
      }
    } catch (err) {
      alert('خطأ في إتمام الرحلة: ' + err.message);
    }
  };

  // 📊 تصنيف الطلاب (مداومين وغائبين)
  const absentStudentsList = students.filter(s => 
    s.is_absent === true || 
    s.tomorrow_status === 'لا أداوم غداً' || 
    (s.exam_note && String(s.exam_note).includes('لا أداوم غداً'))
  );

  const attendingStudentsList = students.filter(s => !absentStudentsList.includes(s));

  const totalStudents = students.length;
  const attendingStudents = attendingStudentsList.length;
  const absentStudents = absentStudentsList.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12 font-sans" dir="rtl">
      
      {/* ⚠️ شريط تنبيه التوزيع عند السائق */}
      {isAfter9PM && !isApprovedByAdmin && (
        <div style={{
          backgroundColor: '#fffbebe6',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '14px',
          margin: '10px 15px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)'
        }}>
          <span style={{ fontSize: '18px', display: 'block', marginBottom: '4px' }}>⏳</span>
          <strong style={{ color: '#b45309', fontSize: '14px' }}>
            بانتظار الإدارة الموافقة أو التعديل على الطلاب كي يتم تثبيت الطلبة معك
          </strong>
        </div>
      )}
      {/* 1. الشريط العلوي */}
      <div className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-40 border-b border-slate-800">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-xl shadow-inner">
              🚗
            </div>
            <div>
              <h1 className="font-bold text-sm text-white flex items-center gap-2">
                {user.name}
                <span className="px-2 py-0.5 text-[10px] bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">سائق</span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {user.car_type || user.car_model || 'نوع المركبة غير محدد'} • <span className="font-mono">{user.car_number || '---'}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchStudents}
              title="تحديث القائمة"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl transition font-bold"
            >
              🔄 تحديث
            </button>
            <button
          onClick={() => {
            // 🗑️ مسح الذاكرة نهائياً
            localStorage.removeItem('maser_currentUser');
            localStorage.removeItem('maser_viewMode');
            localStorage.removeItem('maser_loginRole');
            // 🔄 تصفير الشاشة للخروج
            setUser(null);
          }}
          className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-2 rounded-xl transition font-bold flex items-center gap-1"
        >
          <span>خروج</span>
          <span>🚪</span>
        </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">

        {/* 🚗 أزرار التحكم بالرحلة (أنا في طريقي لكم / إتمام الرحلة) */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-2">
          <button
            onClick={handleStartJourney}
            disabled={driverTripStatus === 'on_the_way' || driverTripStatus === 'completed'}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 ${
              driverTripStatus === 'on_the_way' 
                ? 'bg-emerald-600 cursor-not-allowed' 
                : driverTripStatus === 'completed' 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            {driverTripStatus === 'on_the_way' ? '🟢 أنت في الطريق للطلاب' : driverTripStatus === 'completed' ? '✅ اكتملت الرحلة' : '🚗 أنا في طريقي إليكم'}
          </button>

          <button
            onClick={handleCompleteTrip}
            disabled={driverTripStatus === 'completed'}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 ${
              driverTripStatus === 'completed'
                ? 'bg-emerald-700 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {driverTripStatus === 'completed' ? '🏁 تم إنهاء وإتمام الرحلة بالكامل' : '🏁 وصلت جميع الطلاب وأتممت الرحلة'}
          </button>
        </div>

        {/* 2. بطاقات الإحصائيات */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="block text-xl font-black text-slate-800">{totalStudents}</span>
            <span className="text-[11px] text-slate-500 font-medium">إجمالي الطلاب</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="block text-xl font-black text-emerald-600">{attendingStudents}</span>
            <span className="text-[11px] text-slate-500 font-medium">المداومين</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="block text-xl font-black text-red-500">{absentStudents}</span>
            <span className="text-[11px] text-slate-500 font-medium">غير المداومين</span>
          </div>
        </div>

        {/* 3. قائمة الطلاب */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2">
              <span className="text-base">🎓</span> طلاب خط السائق
            </h3>
            <div className="flex items-center gap-2">
              {!isChatWindowOpen && (
                <span className="text-[10px] text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md font-bold">
                  🔒 المراسلة (6-9 ص)
                </span>
              )}
              <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                {students.length} مسجلين
              </span>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-xs text-slate-400 py-6">جاري تحميل قائمة الطلاب من قاعدة البيانات...</p>
          ) : students.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center text-amber-900 space-y-2">
              <p className="text-2xl">📭</p>
              <p className="text-xs font-bold">لم يتم العثور على طلاب مسجلين لهذا السائق!</p>
              <div className="text-[11px] bg-white/80 p-2.5 rounded-xl border border-amber-200 text-right space-y-1 font-mono">
                <p className="font-sans font-bold text-slate-700">📌 البيانات المحثوث عنها حالياً:</p>
                <p>• اسم السائق: <span className="text-blue-600 font-bold">{user.name}</span></p>
                <p>• رقم الهاتف: <span className="text-blue-600 font-bold">{user.phone}</span></p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student, index) => {
                const isAbsent = absentStudentsList.includes(student);
                return (
                  <div 
                    key={student.id || index} 
                    className={`p-3 border rounded-xl flex items-center justify-between shadow-sm transition ${
                      student.is_boarded ? 'bg-emerald-50/60 border-emerald-300' : isAbsent ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        student.is_boarded ? 'bg-emerald-100 text-emerald-700' : isAbsent ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">
                          {student.name || student.full_name}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          📍 {student.university || student.location || 'غير محدد'}
                        </span>
                        {isAbsent && (
                          <span className="inline-block mt-1 bg-red-100 text-red-700 text-[9px] px-2 py-0.5 rounded font-bold">
                            🔴 غير مداوم
                          </span>
                        )}
                        {student.is_boarded && (
                          <span className="inline-block mt-1 bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded font-bold mr-1">
                            🙋‍♂️ صعد للمركبة
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {/* 📍 زر فتح موقع الطالب على الخريطة */}
                      <button
                        onClick={() => {
                          if (!student.latitude || !student.longitude) {
                            alert('⚠️ لم يقم هذا الطالب بتحديد موقعه على الخريطة بعد!');
                            return;
                          }
                          window.open(`https://www.google.com/maps/search/?api=1&query=${student.latitude},${student.longitude}`, '_blank');
                        }}
                        className="bg-sky-600 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold hover:bg-sky-700 transition inline-block cursor-pointer"
                      >
                        📍 الموقع
                      </button>

                      {/* 🙋‍♂️ زر صعد معي */}
                      <button
                        onClick={() => handleStudentBoarded(student.id)}
                        disabled={student.is_boarded}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition inline-block ${
                          student.is_boarded 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                        }`}
                      >
                        {student.is_boarded ? '✔️ صعد' : '🙋‍♂️ صعد معي'}
                      </button>

                      {/* 💬 زر مراسلة الطالب (مقيد بتوقيت 6:00 ص - 9:00 ص) */}
                      <button
                        onClick={() => {
                          if (!isChatWindowOpen) {
                            alert('🔒 تنبيه: نافذة التواصل مع الطلاب تنفتح فقط من الساعة 6:00 صباحاً حتى 9:00 صباحاً!');
                            return;
                          }
                          setSelectedStudentForChat(student);
                          setIsDriverChatOpen(true);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition inline-block ${
                          isChatWindowOpen 
                            ? 'bg-amber-500 text-white hover:bg-amber-600 cursor-pointer' 
                            : 'bg-slate-300 text-slate-600 cursor-pointer'
                        }`}
                      >
                        💬 مراسلة
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
{/* 🎒 طلاب الرحلة الثانية (موقعه بين طلاب الخط وبين بيانات السائق) */}
        {returnTripStudents && returnTripStudents.length > 0 && returnTripStudents[0]?.return_approved && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 mt-5 shadow-sm" dir="rtl">
            
            {/* عنوان الكارت بالثيم الموحد */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎒</span>
                <h3 className="text-base font-bold text-slate-800 m-0">طلاب الرحلة الثانية</h3>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
                {returnTripStudents.length} طالبات • معتمدة ✅
              </span>
            </div>

            {/* قائمة الطالبات */}
            <div className="flex flex-col gap-3">
              {returnTripStudents.map((std) => (
                <div key={std.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col gap-2.5">
                  
                  {/* بيانات الطالبة والعنوان */}
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-sm font-bold text-slate-900 block mb-0.5">{std.full_name}</strong>
                      <div className="text-xs text-slate-500">
                        📍 القضاء: <b className="text-slate-700">{std.district || 'غير محدد'}</b> | السكن: <b className="text-slate-700">{std.address || std.housing_address || 'غير محدد'}</b>
                      </div>
                    </div>
                  </div>

                  {/* الأزرار بنفس ثيم أزرار طلاب خط السائق */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    
                    {/* 1. زر صعود الطالبة */}
                    <button
                      onClick={async () => {
                        await supabase.from('students').update({ is_boarded_return: !std.is_boarded_return }).eq('id', std.id);
                        fetchDriverReturnStudents();
                      }}
                      className={`text-xs px-3.5 py-2 rounded-xl font-bold border-none cursor-pointer flex items-center gap-1 transition ${
                        std.is_boarded_return ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}>
                      {std.is_boarded_return ? '🙋‍♀️ صعدت معك' : '🙋‍♀️ صعود الطالبة'}
                    </button>

                    {/* 2. زر إيصال الطالبة */}
                    <button
                      onClick={async () => {
                        await supabase.from('students').update({ is_dropped_return: !std.is_dropped_return }).eq('id', std.id);
                        fetchDriverReturnStudents();
                      }}
                      className={`text-xs px-3.5 py-2 rounded-xl font-bold border-none cursor-pointer flex items-center gap-1 transition ${
                        std.is_dropped_return ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}>
                      {std.is_dropped_return ? '🏁 تم الإيصال' : '🏁 إيصال الطالبة'}
                    </button>

                    {/* 3. زر المراسلة السريعة (يرتبط بنفس نافذة رسائل السائق) */}
                    <button
                      onClick={() => {
                        setSelectedStudentForChat(std);
                        setIsDriverChatOpen(true);
                      }}
                      className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1">
                      💬 مراسلة
                    </button>

                    {/* 4. زر موقع الطالبة */}
                    {std.latitude && std.longitude && (
                      <a
                        href={`https://maps.google.com/?q=${std.latitude},${std.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs px-3.5 py-2 rounded-xl font-bold no-underline flex items-center gap-1">
                        🗺️ موقع الطالبة
                      </a>
                    )}

                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
        {/* 4. بيانات السائق */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800">
          <h4 className="font-bold text-xs text-orange-400 mb-2.5 flex items-center gap-1.5">
            <span>📋</span> بيانات الحساب والسيارة
          </h4>
          <div className="text-xs text-slate-300 space-y-1.5">
            <p className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">رقم الموبايل:</span>
              <span className="font-mono text-white font-bold">{user.phone}</span>
            </p>
            <p className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">نوع المركبة:</span>
              <span className="text-white">{user.car_type || user.car_model || 'غير محدد'}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">رقم اللوحة:</span>
              <span className="font-mono text-amber-400 font-bold">{user.car_number || 'غير محدد'}</span>
            </p>
          </div>
        </div>

        {selectedStudentForChat && (
          <ChatModal
            isOpen={isDriverChatOpen}
            onClose={() => setIsDriverChatOpen(false)}
            studentId={selectedStudentForChat.id}
            driverId={user.id}
            currentUserRole="driver"
            supabase={supabase}
          />
        )}
      </div>
      {/* 🎧 قسم الدعم الفني في أسفل الواجهة */}
      <div className="mt-8 p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-slate-700 font-bold text-sm">
          <span className="text-emerald-500 text-lg">🎧</span>
          <span>إذا واجهتك أي مشكلة، تواصل مع الدعم الفني:</span>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3">
          {/* الرقم الأول */}
          <a 
            href="https://wa.me/9647888978111" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-4 py-2.5 rounded-xl border border-emerald-200/60 text-xs transition-all shadow-xs"
          >
            <span>💬</span>
            <span className="tracking-wider">07888978111</span>
          </a>

          {/* الرقم الثاني */}
          <a 
            href="https://wa.me/9647750074100" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl border border-slate-200 text-xs transition-all shadow-xs"
          >
            <span>💬</span>
            <span className="tracking-wider">07750074100</span>
          </a>
        </div>
      </div>
    </div>
  );
}
