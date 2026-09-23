export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const messageText = body.messageText || "🚗 السائق في طريقه إليكم الآن";

    const apiKey = "os_v2_app_yboihim2jzb6zfcksv6qkhtrsiyt4t5e2oqubt5mpcgoagxtpgnh6dm2cq464243nk65oxmd77x1mlknm4zaexntijfvwykn3mlft5a";
    const appId = "c05c83a1-9a4e-43ec-944a-957d051e7192";

    const payload = JSON.stringify({
      app_id: appId,
      included_segments: ["Subscribed Users"],
      contents: { ar: messageText, en: messageText },
      headings: { ar: "تحديث من السائق 🚗", en: "Driver Update" }
    });

    // تجربة صيغ التوثيق الثلاث المعتمدة تلقائياً
    const authPrefixes = ["Key", "Bearer", "Basic"];
    let lastData = null;
    let lastStatus = 401;

    for (const prefix of authPrefixes) {
      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": `${prefix} ${apiKey}`
        },
        body: payload
      });

      const data = await response.json();
      lastData = data;
      lastStatus = response.status;

      // عند نجاح أي صيغة بدون أخطاء يتم اعتمادها فوراً
      if (response.ok && (!data.errors || data.errors.length === 0)) {
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify(lastData), {
      status: lastStatus,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
