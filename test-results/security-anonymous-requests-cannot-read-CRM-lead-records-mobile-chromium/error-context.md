# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> anonymous requests cannot read CRM lead records
- Location: tests\e2e\security.spec.ts:3:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 500
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("anonymous requests cannot read CRM lead records", async ({ request }) => {
  4  |   const response = await request.get("http://127.0.0.1:3001/api/leads");
> 5  |   expect(response.status()).toBe(401);
     |                             ^ Error: expect(received).toBe(expected) // Object.is equality
  6  | });
  7  | 
  8  | test("anonymous visitors are redirected away from the private dashboard", async ({ page }) => {
  9  |   await page.goto("http://127.0.0.1:3001/");
  10 |   await expect(page).toHaveURL(/\/login$/);
  11 |   await expect(page.getByRole("heading", { name: /Masuk|Login|Growth Operating System/i })).toBeVisible();
  12 | });
  13 | 
```