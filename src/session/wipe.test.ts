import { describe, expect, it } from "vitest";
import { sessionStorageKey, wipeSessionArtifacts } from "./wipe";

describe("wipe", () => {
  it("clears the session key", async () => {
    sessionStorage.setItem(sessionStorageKey(), "{\"v\":1}");
    sessionStorage.setItem("other", "keep-or-clear");
    await wipeSessionArtifacts();
    expect(sessionStorage.getItem(sessionStorageKey())).toBeNull();
  });
});
