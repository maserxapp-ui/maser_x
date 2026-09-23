export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const messageText = body.messageText || "🚗 السائق في طريقه إليكم الآن";

    const apiKey = "os_v2_app_yboihim2jzb6zfcksv6qkhtrsk3liabpivneigvfcpk4d7dphoxqwxgh7eeeq5naorw25mzacrm3zanurzad5bl45hzfnykfjfvhsba";
    const appId = "c05c83a1-9a4e-43ec-944a-957d051e7192";

    const payload = {
      app_id: appId,
      included_segments: ["Subscribed Users"],
      contents: { ar: messageText, en: messageText },
      headings: { ar: "تحديث من السائق 🚗", en: "Driver Update" }
    };

    const testCases = [
      { name: "v1_Key", url: "https://onesignal.com/api/v1/notifications", auth: "Key " + apiKey },
      { name: "v1_Basic", url: "https://onesignal.com/api/v1/notifications", auth: "Basic " + apiKey },
      { name: "v2_Key", url: "https://api.onesignal.com/notifications", auth: "Key " + apiKey },
      { name: "v2_Bearer", url: "https://api.onesignal.com/notifications", auth: "Bearer " + apiKey }
    ];

    const results = [];

    for (const test of testCases) {
      try {
        const res = await fetch(test.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": test.auth
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        results.push({ test: test.name, status: res.status, response: data });

        if (res.ok && data.id && (!data.errors || data.errors.length === 0)) {
          return new Response(JSON.stringify({ success: true, workingMethod: test.name, data }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }
      } catch (e) {
        results.push({ test: test.name, error: e.message });
      }
    }

    // إذا رفضت جميع الصيغ، يتم إرجاع التقرير الشامل للكونسول
    return new Response(JSON.stringify({
      error: "All OneSignal Auth Methods Failed",
      appIdUsed: appId,
      diagnosticReport: results
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
