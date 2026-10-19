import { NextResponse } from "next/server";
import { leadSchema } from "@kholil/validation/lead";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 16_384) return NextResponse.json({ error: "Ukuran formulir terlalu besar." }, { status: 413 });
  let body: unknown = null;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 }); }
  // Lightweight honeypot for bots. It is intentionally not part of the CRM payload.
  if (body && typeof body === "object" && "website" in body && String((body as { website?: unknown }).website || "").trim()) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Periksa kembali data yang Anda isi." }, { status: 400 });

  const baseUrl = process.env.GOS_API_URL;
  if (!baseUrl) {
    console.error("GOS_API_URL is not configured.");
    return NextResponse.json({ error: "Formulir sedang belum tersedia. Silakan hubungi melalui WhatsApp." }, { status: 503 });
  }

  const payload = { ...parsed.data };
  const referer = request.headers.get("referer");
  try {
    if (referer) {
      const pageUrl = new URL(referer);
      const requestUrl = new URL(request.url);
      if (pageUrl.origin === requestUrl.origin) {
        payload.sourceUrl = `${pageUrl.origin}${pageUrl.pathname}`.slice(0, 1000);
        payload.utmSource = pageUrl.searchParams.get("utm_source")?.slice(0, 120) || undefined;
        payload.utmMedium = pageUrl.searchParams.get("utm_medium")?.slice(0, 120) || undefined;
        payload.utmCampaign = pageUrl.searchParams.get("utm_campaign")?.slice(0, 160) || undefined;
      }
    }
  } catch { /* Invalid or external referer is ignored. */ }
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.GOS_LEAD_API_SECRET ? { "x-public-lead-secret": process.env.GOS_LEAD_API_SECRET } : {}),
        // GOS trusts this forwarded address only after the shared-secret check succeeds.
        "x-public-client-ip": request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: result.error || "Permintaan belum dapat disimpan." }, { status: response.status });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("GOS lead intake is unavailable", error);
    return NextResponse.json({ error: "Sistem sedang tidak dapat dihubungi. Silakan coba melalui WhatsApp." }, { status: 503 });
  }
}
