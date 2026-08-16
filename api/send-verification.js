export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ error: "Missing email or code" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "RESEND_API_KEY is not configured on the server" });
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Kiver <onboarding@resend.dev>",
        to: [email],
        subject: "Your Kiver verification code",
        html: `
          <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
            <h2 style="color: #0B6EFC;">Kiver</h2>
            <p>Your verification code is:</p>
            <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #132043;">${code}</p>
            <p style="color: #75839E; font-size: 13px;">This code expires once you request a new one. If you didn't request this, you can ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("Resend error:", errText);
      return res.status(502).json({ error: "Email provider rejected the request" });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("send-verification failed:", e);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
