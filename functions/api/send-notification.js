export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const messageText = body.messageText || "🚗 السائق في طريقه إليكم الآن";

    const apiKey = "os_v2_app_yboihim2jzb6zfcksv6qkhtrsk3liabpivneigvfcpk4d7dphoxqwxgh7eeeq5naorw25mzacrm3zanurzad5bl45hzfnykfjfvhsba";
    const appId = "c05c83a1-9a4e-43ec-944a-957d051e7192";

    const payload = JSON.stringify({
      app_id: appId,
      included_segments: ["Subscribed Users"],
      contents: { ar: messageText, en: messageText },
      headings: { ar: "تحديث من السائق 🚗", en: "Driver Update" }
    });

    const attempts = [
      { url: "https://onesignal.com/api/v1/notifications", auth: "Basic " + apiKey },
      { url: "https://onesignal.com/api/v1/notifications", auth: "Key " + apiKey },
      { url: "https://api.onesignal.com/notifications", auth: "Key " + apiKey },
      { url: "https://api.onesignal.com/notifications", auth: "Bearer " + apiKey }
    ];

    let lastData = null;
    let lastStatus = 401;

    for (const item of attempts) {
      const res = await fetch(item.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": item.auth
        },
        body: payload
      });

      const data = await res.json();

      if (res.ok && data.id && (!data.errors || data.errors.length === 0)) {
        return new Response(JSON.stringify({ success: true, data }), {
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
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
