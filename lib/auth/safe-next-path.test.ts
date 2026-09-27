import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/lib/auth/safe-next-path";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/account")).toBe("/account");
    expect(safeNextPath("/parks/piedmont-park-dog-park?view=map#reviews")).toBe(
      "/parks/piedmont-park-dog-park?view=map#reviews",
    );
  });

  it("rejects absolute and protocol-relative redirects", () => {
    expect(safeNextPath("https://evil.example")).toBe("/account");
    expect(safeNextPath("//evil.example")).toBe("/account");
    expect(safeNextPath("/\\evil.example")).toBe("/account");
    expect(safeNextPath("/\\\\evil.example")).toBe("/account");
    expect(safeNextPath("///evil.example")).toBe("/account");
    expect(safeNextPath(null)).toBe("/account");
  });
});
