import { test, expect } from "@playwright/test";

test("homepage exposes the personal brand and service catalog", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000/");
  await expect(page.getByRole("heading", { name: /Dari Ide Menjadi Identitas/i })).toBeVisible();
  await expect(page.getByText("Katalog Layanan")).toBeVisible();
  await expect(page.getByRole("link", { name: /Kebijakan Privasi/i })).toHaveAttribute("href", "/privasi");
});

test("public content routes render", async ({ page }) => {
  for (const [path, heading] of [["/tentang", "Kholil Muflikhun"], ["/portofolio", "Portofolio & Contoh Penerapan"], ["/produk", "Produk & Resource Digital"], ["/artikel", "Artikel & Panduan"], ["/kontak", "Kontak & Permintaan Penawaran"], ["/syarat-ketentuan", "Syarat dan Ketentuan"]] as const) {
    await page.goto(`http://127.0.0.1:3000${path}`);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});

test("mobile navigation opens and offers public routes", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile navigation scenario runs in the mobile project.");
  await page.goto("http://127.0.0.1:3000/");
  await page.getByRole("button", { name: "Buka menu navigasi" }).click();
  await expect(page.getByRole("navigation", { name: "Navigasi mobile" }).getByRole("link", { name: "Artikel" })).toBeVisible();
});
