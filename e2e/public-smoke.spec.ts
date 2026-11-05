import { expect, test } from "@playwright/test";

test.describe("public park discovery", () => {
  test("lists parks without requiring sign-in", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("park-list")).toBeVisible();
    await expect(page.getByTestId("park-card").first()).toBeVisible();
    await expect(page.getByTestId("park-card").first().getByRole("link").first()).toBeVisible();
    await expect(page.getByTestId("auth-button")).toBeVisible();
  });

  test("filters parks and exposes the result count", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("filter-type-business").check();

    await expect(page).toHaveURL(/(?:\?|&)type=business(?:&|$)/);
    await expect(page.getByTestId("result-count")).toContainText("4 parks");
    await expect(page.getByTestId("park-card")).toHaveCount(4);
    await expect(page.getByTestId("filters-clear")).toBeVisible();
  });

  test("sorts by distance using browser-only geolocation", async ({ context, page }) => {
    const thirdPartyMapRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (
        url.includes("openfreemap.org") ||
        url.includes("demotiles.maplibre.org") ||
        url.includes("maptiler.com")
      ) {
        thirdPartyMapRequests.push(url);
      }
    });

    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 33.768, longitude: -84.353 });
    await page.goto("/");
    await page.getByTestId("near-me-button").click();

    await expect(page.getByTestId("park-distance").first()).toBeVisible();
    await page.getByTestId("view-toggle-map").click();
    await expect(page.getByTestId("park-map")).toBeVisible();
    await expect(page.getByTestId("user-location-marker")).toBeVisible();
    expect(thirdPartyMapRequests).toEqual([]);
  });

  test("does not load ads without publisher configuration", async ({ page }) => {
    const adRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (
        url.includes("googlesyndication.com") ||
        url.includes("doubleclick.net") ||
        url.includes("fundingchoicesmessages.google.com")
      ) {
        adRequests.push(url);
      }
    });

    await page.goto("/");
    await expect(page.getByTestId("ad-slot-list-inline")).toHaveCount(0);
    await expect(page.getByTestId("consent-banner")).toBeVisible();
    await page.getByTestId("consent-accept").click();
    await expect(page.getByTestId("ad-slot-list-inline")).toHaveCount(0);
    await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
    expect(adRequests).toEqual([]);
  });
});

test.describe("park details", () => {
  test("offers Google and Apple map links", async ({ page }) => {
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
    await page.goto("/parks/fetch-park-atlanta");

    await expect(page.getByTestId("park-name")).toHaveAccessibleName("Fetch Park Atlanta");
    await expect(page.getByTestId("park-website-link")).toHaveAttribute(
      "href",
      "https://fetchpark.com/",
    );
  });

  test("keeps approved reviews public and gates review writing", async ({ page }) => {
    await page.goto("/parks/freedom-barkway");

    await expect(page.getByTestId("review-section")).toBeVisible();
    await expect(page.getByTestId("review-sign-in-prompt")).toBeVisible();
    await expect(page.getByTestId("review-form")).toBeHidden();
  });

  test("gates new-park submissions for signed-out visitors", async ({ page }) => {
    await page.goto("/submit");

    await expect(page.getByTestId("auth-button")).toBeVisible();
    await expect(page.getByTestId("submission-form")).toBeHidden();
    await expect(page.getByTestId("submission-sign-in-prompt")).toBeVisible();
  });
});

test.describe("public integration gates", () => {
  test("rejects signed-out review writes at the API", async ({ request }) => {
    const response = await request.post("/api/reviews", {
      data: {
        parkSlug: "freedom-barkway",
        rating: 5,
        body: "A signed-out browser must not be allowed to publish this review.",
      },
    });

    expect(response.status()).toBe(401);
  });

  test("rejects signed-out submissions at the API", async ({ request }) => {
    const response = await request.post("/api/submissions", {
      data: {
        payload: {
          kind: "new-park",
          details: "A signed-out browser must not be allowed to submit a park.",
        },
      },
    });

    expect(response.status()).toBe(401);
  });

  test("keeps legal pages publicly navigable", async ({ page }) => {
    for (const path of ["/about", "/privacy", "/terms", "/contact"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("shows seeded approved reviews when Supabase fixtures are configured", async ({ page }) => {
    test.skip(
      !process.env.PLAYWRIGHT_SEEDED_REVIEWS,
      "Requires a Supabase test project with an approved freedom-barkway review; public and write-gate behavior is covered locally.",
    );

    await page.goto("/parks/freedom-barkway");
    await expect(page.getByTestId("review-item").first()).toBeVisible();
  });
});
