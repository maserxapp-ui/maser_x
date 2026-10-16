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

  // 4️⃣ استخراج المعرف الخاص بالطالب أو المستهدفين
  const targetUserId = frontendData.targetUserId || frontendData.studentId || frontendData.external_id;

  // 🎯 إعداد هيكل الإشعار لـ OneSignal (تم حذف target_channel لمنع الخطأ 400)
  const onesignalPayload = {
    app_id: ONESIGNAL_APP_ID,
    contents: {
      ar: customMessage,
      en: customMessage
    },
    headings: {
      ar: customTitle,
      en: customTitle
    }
  };

  // 📍 التوجيه الخصوصي وحماية النظام من الإرسال للجميع بالخطأ:
  const hasArrayTargets = Array.isArray(targetUserId) && targetUserId.length > 0;
  const hasSingleTarget = targetUserId && !Array.isArray(targetUserId);

  if (hasArrayTargets) {
    // إرسال لمجموعة مستهدفين محددين (مثلاً طالبات رحلة معينة)
    onesignalPayload.include_external_user_ids = targetUserId.map(String);
  } else if (hasSingleTarget) {
    // إرسال لمستهدف واحد (مثلاً الأدمن أو سائق محدد)
    onesignalPayload.include_external_user_ids = [String(targetUserId)];
  } else if (frontendData.isBroadcast === true) {
    // لن يُرسل لجميع المشتركين إلا إذا تم طلب ذلك صراحة عبر isBroadcast: true
    onesignalPayload.included_segments = ["Subscribed Users"];
  } else {
    // 🛑 حماية: إذا لم يتم تحديد مستهدفين، نوقف الطلب بدلاً من الإرسال للجميع
    return new Response(
      JSON.stringify({ 
        error: "لم يتم تحديد معرّف مستهدف صحيح (targetUserId)، تم إيقاف الإشعار لمنع إرساله بالخطأ." 
      }),
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
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
    onesignalResponse = { error: "مفتاح ONESIGNAL_API_KEY غير موجود في Cloudflare Secrets" };
  }

  return new Response(
    JSON.stringify({
      status: onesignalStatus,
      sent_payload: onesignalPayload,
      DIAGNOSTIC_REPORT: {
        "1_has_api_key": Boolean(apiKey),
        "2_sent_message": customMessage,
        "3_target_user": targetUserId,
        "4_onesignal_raw_response": onesignalResponse
      }
    }, null, 2),
    {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    }
  );
}
