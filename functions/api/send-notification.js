export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const messageText = body.messageText || "🚗 السائق في طريقه إليكم الآن";

    const apiKey = "os_v2_app_yboihim2jzb6zfcksv6qkhtrsiyt4t5e2oqubt5mpcgoagxtpgnh6dm2cq464243nk65oxmd77x1mlknm4zaexntijfvwykn3mlft5a";

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Key ${apiKey}`
      },
      body: JSON.stringify({
        app_id: "c05c83a1-9a4e-43ec-944a-957d051e7192",
        included_segments: ["Subscribed Users"],
        contents: { ar: messageText, en: messageText },
        headings: { ar: "تحديث من السائق 🚗", en: "Driver Update" }
      })
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
