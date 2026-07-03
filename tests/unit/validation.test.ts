import { describe, expect, it } from "vitest";

import { normalizePhone, validateEmail, validateFullName, validatePhone, validateVehicleInput } from "@/lib/validation";

describe("profile validation", () => {
  it("normalizes Indian mobile numbers", () => {
    expect(normalizePhone("98765 43210")).toBe("+919876543210");
  });

  it("rejects invalid identity values", () => {
    expect(validateEmail("not-an-email")).toBeTruthy();
    expect(validateFullName("1234")).toBeTruthy();
    expect(validatePhone("12345")).toBeTruthy();
  });

  it("accepts a normal Indian vehicle registration", () => {
    expect(validateVehicleInput({ make: "Honda", model: "Activa", registrationNumber: "TS09AB1234" })).toBeNull();
  });
});
