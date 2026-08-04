import { describe, expect, it } from "vitest";
import { getMatchLabel } from "@/lib/match-labels";
import { getPaternidadStatus, isRivalidadPareja } from "@/lib/paternidad";

describe("getMatchLabel", () => {
  it("returns Picanchiii for big wins", () => {
    expect(getMatchLabel(42, true)).toContain("Picanchiii");
  });

  it("returns vaselina for big losses", () => {
    expect(getMatchLabel(-35, false)).toContain("vaselina");
  });

  it("returns trabajada for small wins", () => {
    expect(getMatchLabel(10, true)).toBe("Victoria trabajada 🎾");
  });
});

describe("getPaternidadStatus", () => {
  it("detects dominancia", () => {
    const status = getPaternidadStatus(5, 1, "Andy");
    expect(status.type).toBe("dominancia");
  });

  it("detects desfavorable", () => {
    const status = getPaternidadStatus(1, 5, "Andy");
    expect(status.type).toBe("desfavorable");
  });

  it("detects rivalidad", () => {
    const status = getPaternidadStatus(3, 2, "Andy");
    expect(status.type).toBe("rivalidad");
  });
});

describe("isRivalidadPareja", () => {
  it("returns true for close records", () => {
    expect(isRivalidadPareja(4, 3)).toBe(true);
  });

  it("returns false with no matches", () => {
    expect(isRivalidadPareja(0, 0)).toBe(false);
  });
});
