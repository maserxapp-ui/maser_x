'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// 1. تهيئة عميل Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function TransportDashboard() {
  // حالة التبويب النشط
  const [activeTab, setActiveTab] = useState('main');

  // البيانات الرئيسية
  const [students, setStudents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  
  // حالات التحميل
  const [loading, setLoading] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(true);

  // حالات البحث
  const [searchTerm, setSearchTerm] = useState('');
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [tripSearchTerm, setTripSearchTerm] = useState('');

  // ---------- حالات نموذج المشترك ----------
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('جامعة ميسان');
  const [driverId, setDriverId] = useState('');
  const [price, setPrice] = useState('90,000');
  const [status, setStatus] = useState('مدفوع');
  const [submitting, setSubmitting] = useState(false);

  // ---------- حالات نموذج السائق ----------
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [isEditingDriver, setIsEditingDriver] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [carType, setCarType] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [route, setRoute] = useState('');
  const [capacity, setCapacity] = useState('22');
  const [driverStatus, setDriverStatus] = useState('نشط');
  const [submittingDriver, setSubmittingDriver] = useState(false);

  // ---------- حالات نموذج الرحلة ----------
  const [showTripModal, setShowTripModal] = useState(false);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [editingTripId, setEditingTripId] = useState(null);
  const [tripName, setTripName] = useState('');
  const [tripDriverId, setTripDriverId] = useState('');
  const [tripRoute, setTripRoute] = useState('');
  const [startTime, setStartTime] = useState('07:00 ص');
  const [tripDate, setTripDate] = useState(new Date().toISOString().slice(0, 10));
  const [tripStatus, setTripStatus] = useState('قيد الانتظار');
  const [submittingTrip, setSubmittingTrip] = useState(false);

  // ----------------------------------------------------
  // جلب البيانات من Supabase
  // ----------------------------------------------------
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('students').select('*').order('id', { ascending: false });
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('خطأ في جلب بيانات المشتركين:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const { data, error } = await supabase.from('drivers').select('*').order('id', { ascending: false });
      if (error) throw error;
      setDrivers(data || []);
    } catch (err) {
      console.error('خطأ في جلب بيانات السائقين:', err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const fetchTrips = async () => {
    setLoadingTrips(true);
    try {
      const { data, error } = await supabase.from('trips').select('*').order('id', { ascending: false });
      if (error) throw error;
      setTrips(data || []);
    } catch (err) {
      console.error('خطأ في جلب بيانات الرحلات:', err);
    } finally {
      setLoadingTrips(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchDrivers();
    fetchTrips();
  }, []);

  // ----------------------------------------------------
  // الفلترة والحسابات
  // ----------------------------------------------------
  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.includes(searchTerm)
    );
  }, [students, searchTerm]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => 
      d.name?.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
      d.phone?.includes(driverSearchTerm) ||
      d.route?.toLowerCase().includes(driverSearchTerm.toLowerCase())
    );
  }, [drivers, driverSearchTerm]);

  const filteredTrips = useMemo(() => {
    return trips.filter(t => 
      t.trip_name?.toLowerCase().includes(tripSearchTerm.toLowerCase()) ||
      t.route?.toLowerCase().includes(tripSearchTerm.toLowerCase())
    );
  }, [trips, tripSearchTerm]);

  // إحصائيات
  const totalSubscribers = students.length;
  const paidCount = students.filter(s => s.status === 'مدفوع').length;
  const lateCount = students.filter(s => s.status === 'متأخر').length;
  const unpaidCount = students.filter(s => s.status === 'غير مدفوع').length;

  const totalCollectedRevenue = useMemo(() => {
    return students
      .filter(s => s.status === 'مدفوع')
      .reduce((sum, s) => {
        const numericPrice = parseInt(String(s.price || '90000').replace(/[^0-9]/g, ''), 10) || 0;
        return sum + numericPrice;
      }, 0);
  }, [students]);

  const getStudentCountForDriver = (dId) => {
    return students.filter(s => String(s.driver_id) === String(dId)).length;
  };

  const getDriverName = (dId) => {
    if (!dId) return <span className="text-slate-400 font-normal">غير مخصص</span>;
    const found = drivers.find(d => String(d.id) === String(dId));
    return found ? <span className="font-bold text-slate-700">🚗 {found.name}</span> : <span className="text-slate-400">غير معروف</span>;
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'مدفوع':
        return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-bold">مدفوع</span>;
      case 'متأخر':
        return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-bold">متأخر</span>;
      default:
        return <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-[11px] font-bold">غير مدفوع</span>;
    }
  };

  const getDriverStatusBadge = (st) => {
    switch (st) {
      case 'نشط':
        return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-bold">نشط</span>;
      case 'إجازة':
        return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-bold">إجازة</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[11px] font-bold">متوقف</span>;
    }
  };

  const getTripStatusBadge = (st) => {
    switch (st) {
      case 'بالطريق':
        return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[11px] font-bold animate-pulse">🚍 بالطريق</span>;
      case 'اكتملت':
        return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-bold">✅ اكتملت</span>;
      case 'ملغاة':
        return <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-[11px] font-bold">❌ ملغاة</span>;
      default:
        return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-bold">⏳ قيد الانتظار</span>;
    }
  };

  // ----------------------------------------------------
  // إدارة المشتركين (إضافة / تعديل / حذف)
  // ----------------------------------------------------
  const openAddModal = () => {
    setIsEditing(false);
    setEditingStudentId(null);
    setName('');
    setPhone('');
    setUniversity('جامعة ميسان');
    setDriverId('');
    setPrice('90,000');
    setStatus('مدفوع');
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setIsEditing(true);
    setEditingStudentId(student.id);
    setName(student.name || '');
    setPhone(student.phone || '');
    setUniversity(student.university || 'جامعة ميسان');
    setDriverId(student.driver_id ? String(student.driver_id) : '');
    setPrice(String(student.price || '90,000'));
    setStatus(student.status || 'مدفوع');
    setShowModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { name, phone, university, driver_id: driverId ? driverId : null, price, status };
    try {
      if (isEditing && editingStudentId) {
        const { error } = await supabase.from('students').update(payload).eq('id', editingStudentId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('students').insert([payload]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      alert('حدث خطأ أثناء حفظ بيانات المشترك');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id, studentName) => {
    if (!confirm(`هل أنت تأكد من حذف المشترك "${studentName}"؟`)) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      fetchStudents();
    } catch (err) {
      alert('تعذر حذف المشترك');
    }
  };

  // ----------------------------------------------------
  // إدارة السائقين (إضافة / تعديل / حذف)
  // ----------------------------------------------------
  const openAddDriverModal = () => {
    setIsEditingDriver(false);
    setEditingDriverId(null);
    setDriverName('');
    setDriverPhone('');
    setCarType('');
    setCarNumber('');
    setRoute('');
    setCapacity('22');
    setDriverStatus('نشط');
    setShowDriverModal(true);
  };

  const openEditDriverModal = (driver) => {
    setIsEditingDriver(true);
    setEditingDriverId(driver.id);
    setDriverName(driver.name || '');
    setDriverPhone(driver.phone || '');
    setCarType(driver.car_type || '');
    setCarNumber(driver.car_number || '');
    setRoute(driver.route || '');
    setCapacity(String(driver.capacity || '22'));
    setDriverStatus(driver.status || 'نشط');
    setShowDriverModal(true);
  };

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    setSubmittingDriver(true);
    const payload = { name: driverName, phone: driverPhone, car_type: carType, car_number: carNumber, route, capacity, status: driverStatus };
    try {
      if (isEditingDriver && editingDriverId) {
        const { error } = await supabase.from('drivers').update(payload).eq('id', editingDriverId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('drivers').insert([payload]);
        if (error) throw error;
      }
      setShowDriverModal(false);
      fetchDrivers();
    } catch (err) {
      alert('حدث خطأ أثناء حفظ بيانات السائق');
    } finally {
      setSubmittingDriver(false);
    }
  };

  const handleDeleteDriver = async (id, dName) => {
    if (!confirm(`هل أنت تأكد من حذف السائق "${dName}"؟`)) return;
    try {
      const { error } = await supabase.from('drivers').delete().eq('id', id);
      if (error) throw error;
      fetchDrivers();
    } catch (err) {
      alert('تعذر حذف السائق');
    }
  };

  // ----------------------------------------------------
  // إدارة الرحلات (إضافة / تعديل / حذف)
  // ----------------------------------------------------
  const openAddTripModal = () => {
    setIsEditingTrip(false);
    setEditingTripId(null);
    setTripName('رحلة الصباح - جامعة ميسان');
    setTripDriverId('');
    setTripRoute('');
    setStartTime('07:00 ص');
    setTripDate(new Date().toISOString().slice(0, 10));
    setTripStatus('قيد الانتظار');
    setShowTripModal(true);
  };

  const openEditTripModal = (trip) => {
    setIsEditingTrip(true);
    setEditingTripId(trip.id);
    setTripName(trip.trip_name || '');
    setTripDriverId(trip.driver_id ? String(trip.driver_id) : '');
    setTripRoute(trip.route || '');
    setStartTime(trip.start_time || '07:00 ص');
    setTripDate(trip.date || new Date().toISOString().slice(0, 10));
    setTripStatus(trip.status || 'قيد الانتظار');
    setShowTripModal(true);
  };

  const handleSaveTrip = async (e) => {
    e.preventDefault();
    setSubmittingTrip(true);
    const payload = {
      trip_name: tripName,
      driver_id: tripDriverId ? tripDriverId : null,
      route: tripRoute,
      start_time: startTime,
      date: tripDate,
      status: tripStatus
    };

    try {
      if (isEditingTrip && editingTripId) {
        const { error } = await supabase.from('trips').update(payload).eq('id', editingTripId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('trips').insert([payload]);
        if (error) throw error;
      }
      setShowTripModal(false);
      fetchTrips();
    } catch (err) {
      alert('حدث خطأ أثناء حفظ بيانات الرحلة');
    } finally {
      setSubmittingTrip(false);
    }
  };

  const handleDeleteTrip = async (id, nameStr) => {
    if (!confirm(`هل أنت تأكد من حذف "${nameStr}"؟`)) return;
    try {
      const { error } = await supabase.from('trips').delete().eq('id', id);
      if (error) throw error;
      fetchTrips();
    } catch (err) {
      alert('تعذر حذف الرحلة');
    }
  };

  // ----------------------------------------------------
  // تصدير Excel والطباعة
  // ----------------------------------------------------
  const exportStudentsToExcel = () => {
    const dataToExport = filteredStudents.map((s, idx) => ({
      '#': idx + 1,
      'اسم المشترك': s.name,
      'رقم الهاتف': s.phone,
      'الجامعة / الجهة': s.university || 'جامعة ميسان',
      'السائق المخصص': drivers.find(d => String(d.id) === String(s.driver_id))?.name || 'غير مخصص',
      'قيمة الاشتراك': s.price,
      'حالة الدفع': s.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المشتركين');
    XLSX.writeFile(workbook, `قائمة_المشتركين_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportDriversToExcel = () => {
    const dataToExport = filteredDrivers.map((d, idx) => ({
      '#': idx + 1,
      'اسم السائق': d.name,
      'رقم الهاتف': d.phone,
      'نوع المركبة': d.car_type,
      'رقم اللوحة': d.car_number,
      'الخط / المنطقة': d.route,
      'عدد الركاب المسجلين': getStudentCountForDriver(d.id),
      'السعة الكلية': d.capacity,
      'الحالة': d.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'السائقين');
    XLSX.writeFile(workbook, `قائمة_السائقين_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportTripsToExcel = () => {
    const dataToExport = filteredTrips.map((t, idx) => ({
      '#': idx + 1,
      'عنوان الرحلة': t.trip_name,
      'السائق': drivers.find(d => String(d.id) === String(t.driver_id))?.name || 'غير مخصص',
      'خط السير': t.route,
      'التاريخ': t.date,
      'وقت الانطلاق': t.start_time,
      'حالة الرحلة': t.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الرحلات');
    XLSX.writeFile(workbook, `جدول_الرحلات_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handlePrintDriverManifest = (driver) => {
    const assignedStudents = students.filter(s => String(s.driver_id) === String(driver.id));
    const printWin = window.open('', '_blank');
    if (!printWin) return alert('يرجى السماح بالنوَافذ المنبثقة للطباعة');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف خط السائق - ${driver.name}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #ea580c; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: #ea580c; }
          .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
          .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right; font-size: 13px; }
          th { background-color: #f1f5f9; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">كشف ركاب الحافلة اليومي</div>
          <div class="subtitle">نظام إدارة النقل والخطوط - محافظة ميسان</div>
        </div>

        <div class="info-grid">
          <div><strong>اسم السائق:</strong> ${driver.name}</div>
          <div><strong>رقم الهاتف:</strong> ${driver.phone}</div>
          <div><strong>الخط / المنطقة:</strong> ${driver.route || 'عام'}</div>
          <div><strong>نوع السيارة:</strong> ${driver.car_type || 'حافلة'}</div>
          <div><strong>رقم السيارة:</strong> ${driver.car_number || 'بدون رقم'}</div>
          <div><strong>عدد الركاب:</strong> ${assignedStudents.length} / ${driver.capacity}</div>
        </div>

        <h3>قائمة الطلاب المسجلين:</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>اسم المشترك / الطالب</th>
              <th>رقم الهاتف</th>
              <th>الجامعة / الجهة</th>
              <th>حالة الاشتراك</th>
            </tr>
          </thead>
          <tbody>
            ${assignedStudents.length === 0 ? `
              <tr><td colspan="5" style="text-align:center; padding: 20px; color: #94a3b8;">لا يوجد طلاب مسجلين على هذا السائق حالياً</td></tr>
            ` : assignedStudents.map((st, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${st.name}</strong></td>
                <td>${st.phone}</td>
                <td>${st.university || 'جامعة ميسان'}</td>
                <td>${st.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dir-rtl font-sans pb-12">
      
      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚌</span>
            <div>
              <h1 className="font-bold text-base text-slate-100">لوحة إدارة النقل والرحلات والمشتركين</h1>
              <p className="text-[11px] text-slate-400">محافظة ميسان - جامعة ميسان وخطوط المحافظات</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1.5 rounded-full border border-emerald-500/20 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              متصل بـ Supabase
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Sidebar */}
        <aside className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-3 shadow-sm h-fit space-y-1">
          <button
            onClick={() => setActiveTab('main')}
            className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between ${
              activeTab === 'main' || activeTab === 'subscribers' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>👥 المشتركين والخطوط</span>
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{totalSubscribers}</span>
          </button>

          <button
            onClick={() => setActiveTab('drivers')}
            className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between ${
              activeTab === 'drivers' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🧔🏻‍♂️ السائقين والحافلات</span>
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{drivers.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between ${
              activeTab === 'trips' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🗺️ الرحلات والتحركات</span>
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{trips.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between ${
              activeTab === 'reports' || activeTab === 'expenses' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📊 التقارير المالية</span>
          </button>
        </aside>

        {/* Main Area */}
        <main className="lg:col-span-4 space-y-6">

          {/* تبويب المشتركين */}
          {(activeTab === 'main' || activeTab === 'subscribers') && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">قائمة المشتركين والخطوط</h2>
                    <p className="text-xs text-slate-400">إدارة المشتركين، ربط السائق بالحافلة، وتعديل حالات الدفع</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="بحث باسم المشترك أو الهاتف..."
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-48 focus:outline-none focus:border-orange-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button onClick={exportStudentsToExcel} className="bg-emerald-600 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-emerald-700">
                      📥 Excel
                    </button>
                    <button onClick={openAddModal} className="bg-orange-500 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-orange-600">
                      + إضافة مشترك
                    </button>
                    <button onClick={fetchStudents} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-2 rounded-lg hover:bg-slate-200">
                      🔄
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="p-12 text-center text-slate-400 font-medium text-sm">جاري جلب البيانات... ⏳</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-sm">لا يوجد مشتركين حالياً.</div>
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
                          <tr key={student.id} className="hover:bg-slate-50">
                            <td className="p-3 font-medium text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-800">{student.name}</td>
                            <td className="p-3 text-slate-600 dir-ltr text-right">{student.phone}</td>
                            <td className="p-3 text-slate-600">{student.university || 'جامعة ميسان'}</td>
                            <td className="p-3">{getDriverName(student.driver_id)}</td>
                            <td className="p-3 font-bold text-slate-800">{student.price || '90,000'} د.ع</td>
                            <td className="p-3 text-center">{getStatusBadge(student.status)}</td>
                            <td className="p-3 text-center space-x-1 space-x-reverse">
                              <button onClick={() => openEditModal(student)} className="text-amber-600 bg-amber-50 p-1.5 rounded-md font-bold">✏️ تعديل</button>
                              <button onClick={() => handleDeleteStudent(student.id, student.name)} className="text-rose-500 bg-rose-50 p-1.5 rounded-md font-bold">🗑️ حذف</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sidebar stats */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">ملخص الحسابات</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-600">إجمالي المشتركين</span><span className="font-bold">{totalSubscribers}</span></div>
                    <div className="flex justify-between"><span className="text-emerald-600">الاشتراك المدفوع</span><span className="font-bold text-emerald-600">{paidCount}</span></div>
                    <div className="flex justify-between"><span className="text-amber-600">المتأخرين</span><span className="font-bold text-amber-600">{lateCount}</span></div>
                    <div className="flex justify-between"><span className="text-rose-600">غير المدفوع</span><span className="font-bold text-rose-600">{unpaidCount}</span></div>
                    <div className="border-t pt-2 flex justify-between"><span className="font-bold">المستحصل:</span><span className="font-bold text-emerald-600 text-sm">{totalCollectedRevenue.toLocaleString()} د.ع</span></div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* تبويب السائقين */}
          {activeTab === 'drivers' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">إدارة كادر السائقين والحافلات</h2>
                  <p className="text-xs text-slate-400">سجل بيانات السائقين والتحكم بالسعة وطباعة الكشوفات</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="بحث..."
                    className="px-3 py-1.5 border rounded-lg text-xs w-48 focus:outline-none"
                    value={driverSearchTerm}
                    onChange={(e) => setDriverSearchTerm(e.target.value)}
                  />
                  <button onClick={exportDriversToExcel} className="bg-emerald-600 text-white text-xs px-3 py-2 rounded-lg font-bold">📥 Excel</button>
                  <button onClick={openAddDriverModal} className="bg-orange-500 text-white text-xs px-3 py-2 rounded-lg font-bold">+ إضافة سائق</button>
                  <button onClick={fetchDrivers} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-2 rounded-lg">🔄</button>
                </div>
              </div>

              {loadingDrivers ? (
                <div className="p-12 text-center text-slate-400 text-sm">جاري التحميل...</div>
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
                        <th className="p-3 text-center">الركاب / السعة</th>
                        <th className="p-3 text-center">الحالة</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDrivers.map((driver, idx) => {
                        const count = getStudentCountForDriver(driver.id);
                        const maxCap = parseInt(String(driver.capacity), 10) || 0;
                        return (
                          <tr key={driver.id} className="hover:bg-slate-50">
                            <td className="p-3 text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-800">🧔🏻‍♂️ {driver.name}</td>
                            <td className="p-3 dir-ltr text-right">{driver.phone}</td>
                            <td className="p-3">{driver.car_type || 'حافلة'} ({driver.car_number || 'بدون رقم'})</td>
                            <td className="p-3 text-orange-600 font-bold">{driver.route || 'عام'}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 rounded font-bold ${count >= maxCap ? 'bg-rose-100 text-rose-700' : 'bg-blue-50 text-blue-700'}`}>
                                {count} / {maxCap}
                              </span>
                            </td>
                            <td className="p-3 text-center">{getDriverStatusBadge(driver.status)}</td>
                            <td className="p-3 text-center space-x-1 space-x-reverse">
                              <button onClick={() => handlePrintDriverManifest(driver)} className="text-blue-700 bg-blue-50 p-1.5 rounded font-bold">🖨️ طباعة</button>
                              <button onClick={() => openEditDriverModal(driver)} className="text-amber-600 bg-amber-50 p-1.5 rounded font-bold">✏️ تعديل</button>
                              <button onClick={() => handleDeleteDriver(driver.id, driver.name)} className="text-rose-500 bg-rose-50 p-1.5 rounded font-bold">🗑️ حذف</button>
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

          {/* تبويب الرحلات والتحركات */}
          {activeTab === 'trips' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">جدول إدارة الرحلات اليومية والتحركات</h2>
                  <p className="text-xs text-slate-400">متابعة انطلاق الحافلات، تحديد الأوقات، وتحديث حالة الخطوط مباشر</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="بحث باسم الرحلة أو الخط..."
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-48 focus:outline-none focus:border-orange-500"
                    value={tripSearchTerm}
                    onChange={(e) => setTripSearchTerm(e.target.value)}
                  />
                  <button onClick={exportTripsToExcel} className="bg-emerald-600 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-emerald-700">
                    📥 Excel
                  </button>
                  <button onClick={openAddTripModal} className="bg-orange-500 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-orange-600">
                    + جدولة رحلة جديدة
                  </button>
                  <button onClick={fetchTrips} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-2 rounded-lg hover:bg-slate-200">
                    🔄
                  </button>
                </div>
              </div>

              {loadingTrips ? (
                <div className="p-12 text-center text-slate-400 text-sm">جاري جلب جدول الرحلات... ⏳</div>
              ) : filteredTrips.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <p className="text-slate-400 text-sm">لا يوجد رحلات مسجلة اليوم.</p>
                  <button onClick={openAddTripModal} className="bg-orange-500 text-white text-xs px-4 py-2 rounded-lg font-bold">
                    إضافة أول رحلة الآن
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">عنوان الرحلة</th>
                        <th className="p-3">السائق والحافلة</th>
                        <th className="p-3">خط السير / الوجهة</th>
                        <th className="p-3">تاريخ ووقت الانطلاق</th>
                        <th className="p-3 text-center">حالة الرحلة</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTrips.map((trip, idx) => (
                        <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-800">🚌 {trip.trip_name}</td>
                          <td className="p-3">{getDriverName(trip.driver_id)}</td>
                          <td className="p-3 font-medium text-orange-600">{trip.route || 'غير محدد'}</td>
                          <td className="p-3 text-slate-600">
                            <span className="font-bold text-slate-700">{trip.date}</span> ({trip.start_time})
                          </td>
                          <td className="p-3 text-center">{getTripStatusBadge(trip.status)}</td>
                          <td className="p-3 text-center space-x-1 space-x-reverse">
                            <button onClick={() => openEditTripModal(trip)} className="text-amber-600 bg-amber-50 p-1.5 rounded-md font-bold">✏️ تعديل</button>
                            <button onClick={() => handleDeleteTrip(trip.id, trip.trip_name)} className="text-rose-500 bg-rose-50 p-1.5 rounded-md font-bold">🗑️ حذف</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* التقارير */}
          {(activeTab === 'expenses' || activeTab === 'reports') && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center space-y-3">
              <div className="text-4xl">📊</div>
              <h3 className="font-bold text-slate-800">التقارير الحسابية والمالية</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">إجمالي الواردات الحالية المستحصلة: <span className="font-bold text-emerald-600">{totalCollectedRevenue.toLocaleString()} د.ع</span></p>
            </div>
          )}

        </main>
      </div>

      {/* Modal - المشتركين */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">{isEditing ? '✏️ تعديل مشترك' : '➕ إضافة مشترك'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 text-lg">✕</button>
            </div>
            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم المشترك *</label>
                <input type="text" required className="w-full px-3 py-2 border rounded-lg" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">رقم الهاتف *</label>
                <input type="text" required className="w-full px-3 py-2 border rounded-lg dir-ltr text-right" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">الجامعة / الجهة</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg" value={university} onChange={(e) => setUniversity(e.target.value)} />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">السائق المخصص</label>
                <select className="w-full px-3 py-2 border rounded-lg bg-white" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                  <option value="">-- بدون تحديد --</option>
                  {drivers.map(drv => <option key={drv.id} value={drv.id}>🚗 {drv.name} ({drv.route})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">قيمة الاشتراك</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الحالة</label>
                  <select className="w-full px-3 py-2 border rounded-lg bg-white" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="مدفوع">مدفوع</option>
                    <option value="متأخر">متأخر</option>
                    <option value="غير مدفوع">غير مدفوع</option>
                  </select>
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-bold">إلغاء</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-orange-500 text-white rounded-lg font-bold">{submitting ? 'حفظ...' : 'حفظ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - السائقين */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">{isEditingDriver ? '✏️ تعديل سائق' : '🚗 إضافة سائق'}</h3>
              <button onClick={() => setShowDriverModal(false)} className="text-slate-400 text-lg">✕</button>
            </div>
            <form onSubmit={handleSaveDriver} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم السائق *</label>
                <input type="text" required className="w-full px-3 py-2 border rounded-lg" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">رقم الهاتف *</label>
                <input type="text" required className="w-full px-3 py-2 border rounded-lg dir-ltr text-right" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">نوع المركبة</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg" value={carType} onChange={(e) => setCarType(e.target.value)} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">رقم اللوحة</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg" value={carNumber} onChange={(e) => setCarNumber(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">الخط / المنطقة</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg" value={route} onChange={(e) => setRoute(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">سعة المقاعد</label>
                  <input type="number" className="w-full px-3 py-2 border rounded-lg" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الحالة</label>
                  <select className="w-full px-3 py-2 border rounded-lg bg-white" value={driverStatus} onChange={(e) => setDriverStatus(e.target.value)}>
                    <option value="نشط">نشط</option>
                    <option value="إجازة">إجازة</option>
                    <option value="متوقف">متوقف</option>
                  </select>
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t">
                <button type="button" onClick={() => setShowDriverModal(false)} className="px-4 py-2 text-slate-600 font-bold">إلغاء</button>
                <button type="submit" disabled={submittingDriver} className="px-5 py-2 bg-orange-500 text-white rounded-lg font-bold">{submittingDriver ? 'حفظ...' : 'حفظ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - الرحلات */}
      {showTripModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">{isEditingTrip ? '✏️ تعديل رحلة' : '🗺️ جدولة رحلة جديدة'}</h3>
              <button onClick={() => setShowTripModal(false)} className="text-slate-400 text-lg">✕</button>
            </div>
            <form onSubmit={handleSaveTrip} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">عنوان الرحلة *</label>
                <input type="text" required placeholder="مثال: رحلة الصباح - جامعة ميسان" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500" value={tripName} onChange={(e) => setTripName(e.target.value)} />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">السائق المكلف بالرحلة</label>
                <select className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:border-orange-500" value={tripDriverId} onChange={(e) => setTripDriverId(e.target.value)}>
                  <option value="">-- اختار السائق --</option>
                  {drivers.map(drv => <option key={drv.id} value={drv.id}>🚗 {drv.name} ({drv.car_type || 'حافلة'})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">خط السير / المسار</label>
                <input type="text" placeholder="حي الخليج ⬅️ جامعة ميسان" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500" value={tripRoute} onChange={(e) => setTripRoute(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">تاريخ الرحلة</label>
                  <input type="date" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500" value={tripDate} onChange={(e) => setTripDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">وقت الانطلاق</label>
                  <input type="text" placeholder="07:00 ص" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">حالة الرحلة</label>
                <select className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:border-orange-500" value={tripStatus} onChange={(e) => setTripStatus(e.target.value)}>
                  <option value="قيد الانتظار">⏳ قيد الانتظار</option>
                  <option value="بالطريق">🚍 بالطريق</option>
                  <option value="اكتملت">✅ اكتملت</option>
                  <option value="ملغاة">❌ ملغاة</option>
                </select>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t">
                <button type="button" onClick={() => setShowTripModal(false)} className="px-4 py-2 text-slate-600 font-bold">إلغاء</button>
                <button type="submit" disabled={submittingTrip} className="px-5 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600">
                  {submittingTrip ? 'جاري الحفظ...' : 'حفظ الرحلة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
