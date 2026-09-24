export async function onRequestPost(context) {
  const { request, env } = context;

  let frontendData = {};
  try {
    frontendData = await request.json();
  } catch (e) {
    frontendData = { parse_error: "لم يتم استلام JSON صحيح" };
  }

  const ONESIGNAL_APP_ID = "c05c83a1-9a4e-43ec-944a-957d051e7192";
  const apiKey = (env.ONESIGNAL_API_KEY || "").trim();

  // 📝 معالجة النص: إذا كان المرسل مجرد رقم (مثل 19)، يتم صياغة جملة عربية واضحة للطالب
  const rawMsg = String(frontendData.messageText || frontendData.message || "").trim();
  let customMessage = "السائق في الطريق إليكم الآن 🚗";

  if (rawMsg && isNaN(rawMsg)) {
    // إذا كان هناك نص حقيقي غير أرقام يتم استخدامه
    customMessage = rawMsg;
  }

  const customTitle = frontendData.title || "مسار X - تنبيه الرحلة";

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
        "2_sent_to_onesignal": onesignalPayload,
        "3_onesignal_raw_response": onesignalResponse
      }
    }, null, 2),
    {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    }
  );
}
