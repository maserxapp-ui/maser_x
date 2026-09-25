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

  // 2️⃣ استخراج العنوان (إذا لم يرسل العنوان يضع عنوان عام)
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

  // 🎯 إرسال الإشعار
  const onesignalPayload = {
    app_id: ONESIGNAL_APP_ID,
    target_channel: "push",
    included_segments: ["Subscribed Users", "Total Subscriptions"],
    contents: {
      ar: customMessage,
      en: customMessage
    },
    headings: {
      ar: customTitle,
      en: customTitle
    }
  };

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
        "3_onesignal_raw_response": onesignalResponse
      }
    }, null, 2),
    {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    }
  );
}
