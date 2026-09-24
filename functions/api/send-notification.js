export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    const ONESIGNAL_APP_ID = "c05c83a1-9a4e-43ec-944a-957d051e7192";
    const ONESIGNAL_API_KEY = env.ONESIGNAL_API_KEY;

    if (!ONESIGNAL_API_KEY) {
      return new Response(
        JSON.stringify({ error: "مفتاح ONESIGNAL_API_KEY غير معرف في إعدادات Cloudflare" }),
        { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    // إرسال الإشعار لكافة المشتركين النشطين بدون الاعتماد على IDs قديمة
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ["Subscribed Users"],
      contents: {
        ar: body.message || body.contents?.ar || "تحديث جديد من السائق",
        en: body.message || body.contents?.en || "New driver update"
      },
      headings: {
        ar: body.title || body.headings?.ar || "مسار X",
        en: body.title || body.headings?.en || "Masar X"
      }
    };

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${ONESIGNAL_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
