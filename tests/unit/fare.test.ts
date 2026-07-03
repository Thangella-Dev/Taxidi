import { describe, expect, it } from "vitest";

import { calculateFareBreakdown, getUserCancellationFine, getVehicleFareQuote } from "@/lib/fare";

describe("fare calculation", () => {
  it("uses standard vehicle rates", () => {
    const departure = "2026-07-03T06:30:00.000Z"; // 12:00 IST
    expect(getVehicleFareQuote(10, departure, "bike").fare).toBe(70);
    expect(getVehicleFareQuote(10, departure, "auto").fare).toBe(80);
    expect(getVehicleFareQuote(10, departure, "car").fare).toBe(90);
  });

  it("uses peak vehicle rates in the configured morning window", () => {
    const departure = "2026-07-03T04:00:00.000Z"; // 09:30 IST
    expect(getVehicleFareQuote(10, departure, "bike").fare).toBe(80);
    expect(getVehicleFareQuote(10, departure, "auto").fare).toBe(90);
    expect(getVehicleFareQuote(10, departure, "car").fare).toBe(100);
  });

  it("preserves the seven percent commission split", () => {
    expect(calculateFareBreakdown(200)).toEqual({ companyCommission: 14, fare: 200, riderEarning: 186 });
  });

  it("charges the accepted-ride fine only from the third cancellation", () => {
    expect(getUserCancellationFine(1, true)).toBe(0);
    expect(getUserCancellationFine(2, false)).toBe(0);
    expect(getUserCancellationFine(2, true)).toBe(50);
  });
});
