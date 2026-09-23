export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const messageText = body.messageText || "🚗 السائق في طريقه إليكم الآن";

    const apiKey = "os_v2_app_yboihim2jzb6zfcksv6qkhtrsitzwaiepiluwwmd73avwu7jnahozpjstnws47aup43g6qrzcvxg2aqplbkyshdqseqkvcnxfrzynny";
    const appId = "c05c83a1-9a4e-43ec-944a-957d051e7192";

    const payload = {
      app_id: appId,
      included_segments: ["Subscribed Users"],
      contents: { ar: messageText, en: messageText },
      headings: { ar: "تحديث من السائق 🚗", en: "Driver Update" }
    };

    // تجربة المحاولات الخاصة بمفاتيح os_v2
    const attempts = [
      { url: "https://api.onesignal.com/notifications", auth: `Key ${apiKey}` },
      { url: "https://api.onesignal.com/notifications", auth: `Bearer ${apiKey}` },
      { url: "https://onesignal.com/api/v1/notifications", auth: `Key ${apiKey}` }
    ];

    let lastData = null;
    let lastStatus = 401;

    for (const item of attempts) {
      console.log(`Testing: ${item.auth.split(" ")[0]} on ${item.url}`);

      const res = await fetch(item.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": item.auth
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log(`Response Status: ${res.status}`, JSON.stringify(data));

      if (res.ok && data.id) {
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      lastData = data;
      lastStatus = res.status;
    }

    return new Response(JSON.stringify(lastData), {
      status: lastStatus,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.log("Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
