import { describe, expect, it } from "vitest";
import { emptySession } from "../types";
import {
  areasForMatter,
  clearAreaSpecificState,
  hasAreaSpecificState,
  isPracticeArea,
  matterBelongsToArea,
  mattersForArea,
  PRACTICE_AREAS,
} from "./areas";

describe("practice areas", () => {
  it("exposes exactly three areas", () => {
    expect(PRACTICE_AREAS).toEqual(["criminal", "civil", "divorce"]);
    expect(isPracticeArea("civil")).toBe(true);
    expect(isPracticeArea("tax")).toBe(false);
  });

  it("keeps family matters on Divorce and does not mix criminal into it", () => {
    const divorce = mattersForArea("divorce");
    expect(divorce).toContain("divorce");
    expect(divorce).toContain("custody");
    expect(divorce).not.toContain("bail-arraignment");
    expect(divorce).not.toContain("small-claims");
  });

  it("scopes civil and criminal matter lists", () => {
    expect(mattersForArea("civil")).toEqual([
      "small-claims",
      "contract-dispute",
      "landlord-tenant",
      "civil-protection-order",
      "name-change",
      "debt-collection",
    ]);
    expect(mattersForArea("criminal")).toContain("expungement");
    expect(mattersForArea("criminal")).not.toContain("divorce");
    expect(areasForMatter("name-change")).toEqual(["civil", "divorce"]);
    expect(matterBelongsToArea("plea", "criminal")).toBe(true);
    expect(matterBelongsToArea("plea", "divorce")).toBe(false);
  });

  it("detects and clears area-specific session state without dropping jurisdiction", () => {
    const s = emptySession();
    s.disclaimerAccepted = true;
    s.practiceArea = "divorce";
    s.jurisdiction = "OR";
    s.matter = "custody";
    s.facts = { goals: "parenting plan" };
    s.parties[0].name = "Alex";
    expect(hasAreaSpecificState(s)).toBe(true);
    const cleared = clearAreaSpecificState(s);
    expect(cleared.jurisdiction).toBe("OR");
    expect(cleared.disclaimerAccepted).toBe(true);
    expect(cleared.matter).toBeNull();
    expect(cleared.facts).toEqual({});
    expect(cleared.parties[0].name).toBe("");
    expect(hasAreaSpecificState(cleared)).toBe(false);
  });
});
