export async function onRequestPost(context) {
  const { request, env } = context;

  // 1️⃣ قراءة البيانات القادمة من الواجهة
  let frontendData = {};
  try {
    frontendData = await request.json();
  } catch (e) {
    frontendData = { parse_error: "لم يتم استلام JSON صحيح" };
  }

  const ONESIGNAL_APP_ID = "c05c83a1-9a4e-43ec-944a-957d051e7192";
  const apiKey = (env.ONESIGNAL_API_KEY || "").trim();

  // 2️⃣ استخراج العنوان
  const customTitle = frontendData.title || "مسار X - إشعار جديد 💬";

  // 3️⃣ استخراج النص المرسل
  let customMessage = 
    frontendData.messageText || 
    frontendData.message || 
    frontendData.text || 
    frontendData.contents?.ar || 
    "رسالة جديدة 💬";

  // إذا كان النص قادماً من السائق ومجرد رقم، نضع نصاً واضحاً
  if (!isNaN(String(customMessage).trim()) && customTitle.includes("السائق")) {
    customMessage = "السائق في الطريق إليكم الآن 🚗";
  }

  // 4️⃣ استخراج المعرف الخاص بالطالب المستهدف (إن وجد)
  const targetUserId = frontendData.targetUserId || frontendData.studentId || frontendData.external_id;

  // 🎯 إعداد هيكل الإشعار لـ OneSignal
  const onesignalPayload = {
    app_id: ONESIGNAL_APP_ID,
    target_channel: "push",
    contents: {
      ar: customMessage,
      en: customMessage
    },
    headings: {
      ar: customTitle,
      en: customTitle
    }
  };

  // 📍 التمييز بين الإشعار الخصوصي (لطالب) والإشعار العام (للجميع):
  if (targetUserId) {
    // إرسال للطالب المحدد فقط عبر external_user_ids
    onesignalPayload.include_external_user_ids = Array.isArray(targetUserId)
      ? targetUserId.map(String)
      : [String(targetUserId)];
  } else {
    // إرسال عام لجميع المشتركين (في حال عدم تحديد طالب)
    onesignalPayload.included_segments = ["Subscribed Users", "Total Subscriptions"];
  }

  let onesignalStatus = 0;
  let onesignalResponse = {};

  if (apiKey) {
    try {
      const res = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": `Basic ${apiKey}`
        },
        body: JSON.stringify(onesignalPayload)
      });

      onesignalStatus = res.status;
      onesignalResponse = await res.json();
    } catch (err) {
      onesignalResponse = { fetch_error: err.message };
    }
  } else {
    onesignalResponse = { error: "مفتاح ONESIGNAL_API_KEY غير موجود" };
  }

  return new Response(
    JSON.stringify({
      DIAGNOSTIC_REPORT: {
        "1_has_api_key": Boolean(apiKey),
        "2_sent_message": customMessage,
        "3_target_user": targetUserId || "عام (جميع الطلاب)",
        "4_onesignal_raw_response": onesignalResponse
      }
    }, null, 2),
    {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    }
  );
}
