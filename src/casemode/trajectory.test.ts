import { afterEach, describe, expect, it, vi } from "vitest";
import { probeTrajectoryLockLive, TRAJECTORY_WORKER } from "./trajectory";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TrajectoryLock live GET", () => {
  it("reads /v1/health and never treats the Worker as a certified instrument", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe(`${TRAJECTORY_WORKER}/v1/health`);
      return new Response(
        JSON.stringify({
          ok: true,
          product: "trajectorylock",
          version: "0.1.0",
          certified_instrument: false,
          media_stored: false,
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const live = await probeTrajectoryLockLive();
    expect(live.live).toBe(true);
    expect(live.certified_instrument).toBe(false);
    expect(live.posted_user_media).toBe(false);
    expect(live.stub_ops).toContain("shooter");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
