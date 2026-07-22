import { describe, expect, it } from "vitest";

import { isAuthOrPermissionError } from "@/lib/auth";

describe("isAuthOrPermissionError", () => {
  it("treats row-level security failures as permission errors", () => {
    const error = {
      message: "new row violates row-level security policy",
    };

    expect(isAuthOrPermissionError(error)).toBe(true);
  });

  it("treats missing authentication as a permission error", () => {
    const error = {
      message: "not authenticated",
    };

    expect(isAuthOrPermissionError(error)).toBe(true);
  });
});
