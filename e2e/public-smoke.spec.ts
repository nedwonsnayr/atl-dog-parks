import { expect, test } from "@playwright/test";

test.describe("public park discovery", () => {
  test("lists parks without requiring sign-in", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("park-list")).toBeVisible();
    await expect(page.getByTestId("park-card").first()).toBeVisible();
    await expect(page.getByTestId("park-card").first().getByRole("link")).toBeVisible();
    await expect(page.getByTestId("auth-button")).toBeVisible();
  });

  test("filters parks and exposes the result count", async ({ page }) => {
    test.fixme(
      true,
      "P2: enable after S2 replaces the Phase 0 list with URL-backed filter controls.",
    );

    await page.goto("/");
    await page.getByTestId("filter-type-business").check();

    await expect(page).toHaveURL(/(?:\?|&)type=business(?:&|$)/);
    await expect(page.getByTestId("result-count")).toContainText("1 park");
    await expect(page.getByTestId("park-card")).toHaveCount(1);
    await expect(page.getByTestId("filters-clear")).toBeVisible();
  });

  test("sorts by distance using browser-only geolocation", async ({ context, page }) => {
    test.fixme(
      true,
      "P2: enable after S2 near-me sorting and S3's user-location marker are integrated.",
    );

    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 33.768, longitude: -84.353 });
    await page.goto("/");
    await page.getByTestId("near-me-button").click();

    await expect(page.getByTestId("park-distance").first()).toBeVisible();
    await page.getByTestId("view-toggle-map").click();
    await expect(page.getByTestId("park-map")).toBeVisible();
    await expect(page.getByTestId("user-location-marker")).toBeVisible();
  });
});

test.describe("park details", () => {
  test("offers Google and Apple map links", async ({ page }) => {
    test.fixme(
      true,
      "P2: enable after S1 map-link helpers and S2 park detail pages are integrated.",
    );

    await page.goto("/parks/freedom-barkway");

    await expect(page.getByTestId("park-detail")).toHaveAttribute(
      "data-park-slug",
      "freedom-barkway",
    );
    await expect(page.getByTestId("map-link-google")).toHaveAttribute(
      "href",
      /^https:\/\/www\.google\.com\/maps\//,
    );
    await expect(page.getByTestId("map-link-apple")).toHaveAttribute(
      "href",
      /^https:\/\/maps\.apple\.com\//,
    );
  });

  test("links business parks to their official website", async ({ page }) => {
    test.fixme(true, "P2: enable after S2 business park detail pages are integrated.");

    await page.goto("/parks/fetch-park-atlanta");

    await expect(page.getByTestId("park-name")).toHaveAccessibleName("Fetch Park Atlanta");
    await expect(page.getByTestId("park-website-link")).toHaveAttribute(
      "href",
      "https://fetchpark.com/",
    );
  });

  test("keeps approved reviews public and gates review writing", async ({ page }) => {
    test.fixme(true, "P2: enable after S2 mounts S5's review section on the park detail page.");

    await page.goto("/parks/freedom-barkway");

    await expect(page.getByTestId("review-section")).toBeVisible();
    await expect(page.getByTestId("review-item").first()).toBeVisible();
    await expect(page.getByTestId("review-sign-in-prompt")).toBeVisible();
    await expect(page.getByTestId("review-form")).toBeHidden();
  });

  test("gates new-park submissions for signed-out visitors", async ({ page }) => {
    test.fixme(true, "P2: enable after S5 implements the authenticated submission flow.");

    await page.goto("/submit");

    await expect(page.getByTestId("auth-button")).toBeVisible();
    await expect(page.getByTestId("submission-form")).toBeHidden();
  });
});
