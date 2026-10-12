import { test, expect } from "@playwright/test";

const dashboard = "https://dashboard.resofit.fit";
const publicSite = "https://www.resofit.fit";

test("CEO dashboard route renders and has no uncaught page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
  const response = await page.goto(new URL("/ceo-growth", dashboard).toString(), { waitUntil: "domcontentloaded", timeout: 45000 });
  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(500);
  expect((await page.locator("body").innerText()).trim().length).toBeGreaterThan(0);
  expect(errors, errors.join("\n\n")).toEqual([]);
});

test("public site renders and reports actionable browser exception stacks", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
  const response = await page.goto(publicSite, { waitUntil: "domcontentloaded", timeout: 45000 });
  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(500);
  expect((await page.locator("body").innerText()).trim().length).toBeGreaterThan(0);
  expect(errors, errors.join("\n\n")).toEqual([]);
});