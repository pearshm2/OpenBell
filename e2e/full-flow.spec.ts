import { expect, test } from "@playwright/test";

test("9. Sign up → skip onboarding → search NVDA → save → card appears on dashboard", async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

  await page.goto("/search");
  await expect(page).toHaveURL(/\/login\?next=%2Fsearch/); // signed out → login

  await page.getByRole("link", { name: "Sign up" }).first().click();
  await page.getByLabel("Name").fill("Edie Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("demo-password");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("button", { name: "Skip for now" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("No saved stocks yet")).toBeVisible();

  await page.getByRole("link", { name: "Search", exact: true }).click();
  await page.getByLabel("Search by symbol or company").fill("NVDA");
  await page.getByLabel("Search by symbol or company").press("Enter");

  await expect(page).toHaveURL(/q=NVDA/);
  await expect(page.getByTestId("opening-price")).toHaveText("$129.95");
  await expect(page.getByTestId("open-line")).toBeAttached(); // dashed open line on the chart

  await page.getByRole("button", { name: "Save to dashboard" }).click();
  await expect(page.getByRole("button", { name: "✓ Saved" })).toBeVisible();

  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "NVIDIA" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
