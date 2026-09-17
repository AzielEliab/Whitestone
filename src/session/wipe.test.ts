import { describe, expect, it, vi } from "vitest";
import { sessionStorageKey, wipeSessionArtifacts } from "./wipe";

describe("wipe", () => {
  it("clears the session key", async () => {
    sessionStorage.setItem(sessionStorageKey(), "{\"v\":1}");
    sessionStorage.setItem("other", "keep-or-clear");
    await wipeSessionArtifacts();
    expect(sessionStorage.getItem(sessionStorageKey())).toBeNull();
  });

  it("drops whitestone shell caches so End & erase does not keep case-adjacent SW cache", async () => {
    const store = new Map<string, unknown>();
    store.set("whitestone-shell-v1", {});
    store.set("other-app", {});
    vi.stubGlobal("caches", {
      keys: async () => [...store.keys()],
      delete: async (key: string) => store.delete(key),
    });
    await wipeSessionArtifacts();
    expect(store.has("whitestone-shell-v1")).toBe(false);
    expect(store.has("other-app")).toBe(true);
    vi.unstubAllGlobals();
  });
});
