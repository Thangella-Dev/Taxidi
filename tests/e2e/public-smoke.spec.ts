import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/", "/auth", "/about", "/help", "/privacy", "/rules"]) {
  test(`${path} renders without serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("html")).not.toHaveAttribute("data-nextjs-error");
    const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
    expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
  });
}

test("health endpoint reports a configured production surface", async ({ request }) => {
  const response = await request.get("/api/health");
  expect([200, 503]).toContain(response.status());
  const body = await response.json();
  expect(body.service).toBe("taxiro-web");
});
