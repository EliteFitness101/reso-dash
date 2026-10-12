import { test, expect } from "@playwright/test";

const dashboard = process.env.RESOFIT_DASHBOARD_URL ?? "https://dashboard.resofit.fit";
const publicSite = process.env.RESOFIT_PUBLIC_URL ?? "https://www.resofit.fit";

test("canonical CEO dashboard route renders without a server failure", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack ?? error.message));
  const response = await page.goto(new URL("/ceo-growth", dashboard).toString(), { waitUntil: "domcontentloaded", timeout: 45000 });
  expect(response, "dashboard route should return an HTTP response").not.toBeNull();
  expect(response!.status(), "dashboard route must not return a 5xx server error").toBeLessThan(500);
  await expect(page.locator("body")).not.toBeEmpty();
  expect((await page.locator("body").innerText()).trim().length, "dashboard must render visible page content").toBeGreaterThan(0);
  expect(pageErrors, "dashboard route must not throw uncaught browser exceptions").toEqual([]);
});

test("canonical public site renders without a server failure", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack ?? error.message));
  const response = await page.goto(publicSite, { waitUntil: "domcontentloaded", timeout: 45000 });
  expect(response, "public site should return an HTTP response").not.toBeNull();
  expect(response!.status(), "public site must not return a 5xx server error").toBeLessThan(500);
  await expect(page.locator("body")).not.toBeEmpty();
  expect((await page.locator("body").innerText()).trim().length, "public site must render visible page content").toBeGreaterThan(0);
  expect(pageErrors, "public site must not throw uncaught browser exceptions").toEqual([]);
});