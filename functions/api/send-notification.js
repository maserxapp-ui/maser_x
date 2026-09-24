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

  // 2️⃣ تجهيز الحمول الموجهة لـ OneSignal (استهداف كافة المشتركين)
  const onesignalPayload = {
    app_id: ONESIGNAL_APP_ID,
    included_segments: ["Subscribed Users"],
    contents: {
      ar: frontendData.message || frontendData.contents?.ar || "تحديث جديد من السائق",
      en: frontendData.message || frontendData.contents?.en || "New update"
    },
    headings: {
      ar: frontendData.title || frontendData.headings?.ar || "مسار X",
      en: frontendData.title || frontendData.headings?.en || "Masar X"
    }
  };

  let onesignalStatus = 0;
  let onesignalResponse = {};

  // 3️⃣ تنفيذ الطلب إلى OneSignal
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
    onesignalResponse = { error: "مفتاح ONESIGNAL_API_KEY غير موجود في إعدادات Cloudflare" };
  }

  // 4️⃣ إرجاع تقرير تشخيصي كامل إلى الكونسول في المتصفح
  return new Response(
    JSON.stringify({
      DIAGNOSTIC_REPORT: {
        "1_has_api_key": Boolean(apiKey),
        "2_api_key_length": apiKey.length,
        "3_received_from_frontend": frontendData,
        "4_sent_to_onesignal": onesignalPayload,
        "5_onesignal_http_status": onesignalStatus,
        "6_onesignal_raw_response": onesignalResponse
      }
    }, null, 2),
    {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    }
  );
}
