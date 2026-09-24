export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const messageText = body.messageText || "🚗 السائق في طريقه إليكم الآن";

    const apiKey = (context.env.ONESIGNAL_API_KEY || "").trim();
    const appId = "c05c83a1-9a4e-43ec-944a-957d051e7192";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "لم يتم العثور على ONESIGNAL_API_KEY" }), { status: 500 });
    }

    // إرسال مباشر لجميع المشتركين النشطين وتجاهل معرّفات الداتا بيز القديمة
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Key ${apiKey}`
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ["Subscribed Users"],
        contents: { ar: messageText, en: messageText },
        headings: { ar: "تحديث من السائق 🚗", en: "Driver Update" }
      })
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
