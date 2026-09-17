import { describe, expect, it } from "vitest";
import { parseResearchInput, shouldFetch } from "./should-fetch";

describe("should-fetch rules", () => {
  it("fetches procedural / currency questions", () => {
    expect(
      shouldFetch({
        query: "What is the usual first filing packet here?",
        jurisdiction: "TX",
        matter: "divorce",
      }),
    ).toBe(true);
    expect(
      shouldFetch({
        query: "current child support worksheet",
        jurisdiction: "CA",
        matter: "child-support",
      }),
    ).toBe(true);
    expect(
      shouldFetch({
        query: "Where do I find the official self-help forms?",
        jurisdiction: "OR",
        matter: "custody",
      }),
    ).toBe(true);
  });

  it("fetches when building filing guidance or on a manual refresh", () => {
    expect(shouldFetch({ query: "", jurisdiction: "NY", matter: "divorce", reason: "filing" })).toBe(true);
    expect(shouldFetch({ query: "clerk packet", jurisdiction: "FL", reason: "manual" })).toBe(true);
  });

  it("does not fetch empty or non-procedural chatter", () => {
    expect(shouldFetch({ query: "", jurisdiction: "CA", matter: "divorce" })).toBe(false);
    expect(shouldFetch({ query: "ok", jurisdiction: null, matter: null })).toBe(false);
    expect(shouldFetch({ query: "hi", jurisdiction: null, matter: null })).toBe(false);
  });

  it("parses and rejects unsafe research input", () => {
    expect(parseResearchInput({ jurisdiction: "ca", matter: "divorce", query: "forms" }).ok).toBe(true);
    expect(parseResearchInput({ jurisdiction: "California" }).ok).toBe(false);
    expect(parseResearchInput({ matter: "tax-audit" }).ok).toBe(false);
    expect(parseResearchInput("nope").ok).toBe(false);
    const long = parseResearchInput({ query: "x".repeat(800) });
    expect(long.ok).toBe(true);
    if (long.ok) expect(long.value.query.length).toBe(400);
  });
});
