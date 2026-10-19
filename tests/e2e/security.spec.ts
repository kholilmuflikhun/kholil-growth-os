import { test, expect } from "@playwright/test";

test("anonymous requests cannot read CRM lead records", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:3001/api/leads");
  expect(response.status()).toBe(401);
});

test("anonymous visitors are redirected away from the private dashboard", async ({ page }) => {
  await page.goto("http://127.0.0.1:3001/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /Masuk|Login|Growth Operating System/i })).toBeVisible();
});
