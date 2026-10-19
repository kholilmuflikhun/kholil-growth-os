export type DeliveryResult = { channel: "email" | "whatsapp"; ok: boolean; skipped?: boolean; detail: string };

type Message = { title: string; message: string };

/** Optional provider delivery. In-app notifications remain the source of truth. */
export async function deliverNotification(message: Message): Promise<DeliveryResult[]> {
  const results: DeliveryResult[] = [];
  const emailKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.NOTIFICATION_EMAIL_TO;
  const emailFrom = process.env.RESEND_FROM_EMAIL;
  if (emailKey && emailTo && emailFrom) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${emailKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: emailFrom, to: [emailTo], subject: message.title, text: message.message }),
        signal: AbortSignal.timeout(10000),
      });
      results.push({ channel: "email", ok: response.ok, detail: response.ok ? "Email diterima provider." : `Provider email merespons HTTP ${response.status}.` });
    } catch { results.push({ channel: "email", ok: false, detail: "Pengiriman email gagal karena koneksi atau timeout." }); }
  } else results.push({ channel: "email", ok: false, skipped: true, detail: "Email belum dikonfigurasi lengkap." });

  const waToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const waTo = process.env.WHATSAPP_TO;
  if (waToken && waPhoneId && waTo) {
    try {
      const response = await fetch(`https://graph.facebook.com/v22.0/${encodeURIComponent(waPhoneId)}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${waToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: waTo, type: "text", text: { preview_url: false, body: `${message.title}\n\n${message.message}` } }),
        signal: AbortSignal.timeout(10000),
      });
      results.push({ channel: "whatsapp", ok: response.ok, detail: response.ok ? "Pesan diterima WhatsApp Cloud API." : `WhatsApp Cloud API merespons HTTP ${response.status}.` });
    } catch { results.push({ channel: "whatsapp", ok: false, detail: "Pengiriman WhatsApp gagal karena koneksi atau timeout." }); }
  } else results.push({ channel: "whatsapp", ok: false, skipped: true, detail: "WhatsApp belum dikonfigurasi lengkap." });
  return results;
}
