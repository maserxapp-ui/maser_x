export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const messageText = body.messageText || "🚗 السائق في طريقه إليكم الآن";

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Basic os_v2_app_yboihim2jzb6zfcksv6qkhtrs1pklyguuvjuykmy4i4jbggu3ijoyepqxcqcohkquobnv23u2aqj3ycfcxbph2qz75ilea3h6eyaha"
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
