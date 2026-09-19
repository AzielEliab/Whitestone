import { afterEach, describe, expect, it, vi } from "vitest";
import { citeSpectralLock, probeSpectralLockLive, SPECTRALLOCK_PATHS, SPECTRALLOCK_WORKER } from "./spectrallock";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SpectralLock cite", () => {
  it("SLOTs without media and never claims a lab", () => {
    const cite = citeSpectralLock(false);
    expect(cite.status).toBe("SLOT");
    expect(cite.lab_claim).toBe(false);
    expect(cite.posted_user_bytes).toBe(false);
    expect(cite.invented_marks).toBe(false);
  });

  it("labels LIVE from GET banners without inventing leftover bytes from user files", () => {
    const cite = citeSpectralLock(true, {
      worker: SPECTRALLOCK_WORKER,
      retrievedAt: "2026-09-19T00:00:00.000Z",
      live: true,
      paths: SPECTRALLOCK_PATHS.map((path) => ({
        path,
        url: `${SPECTRALLOCK_WORKER}${path}`,
        ok: true,
        httpStatus: 200,
        retrievedAt: "2026-09-19T00:00:00.000Z",
        product: "spectrallock",
        version: "0.3.0",
        headline: "LIVE banner",
      })),
      unredact: { leftover_bytes: true, revision_graph: true, refuse_code: "SL-UNREDACT-OPAQUE" },
      recover: { ops: ["locate"], slot_kinds: ["7z", "heic"] },
      handwriting: { ops: ["analyze"], heuristic: true, lab: false },
      posted_user_bytes: false,
      lab_claim: false,
    });
    expect(cite.status).toBe("LIVE");
    expect(cite.live).toBe(true);
    expect(cite.posted_user_bytes).toBe(false);
    expect(cite.note).toMatch(/did not POST/i);
    expect(cite.note).toMatch(/Not a lab/i);
  });
});

describe("SpectralLock live GET", () => {
  it("parses Worker banners and stays honest when a path fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/v1/unredact")) {
          return new Response(
            JSON.stringify({
              product: "spectrallock",
              version: "0.3.0",
              unredact: { leftover_bytes_recovery: true, revision_graph: true, refuse_code: "SL-UNREDACT-OPAQUE" },
            }),
            { status: 200 },
          );
        }
        if (url.endsWith("/v1/recover")) {
          return new Response(
            JSON.stringify({
              product: "spectrallock",
              recover: { ops: ["locate", "refuse"], slot_kinds: ["7z", "heic"] },
            }),
            { status: 200 },
          );
        }
        return new Response("no", { status: 503 });
      }),
    );
    const live = await probeSpectralLockLive();
    expect(live.live).toBe(true);
    expect(live.posted_user_bytes).toBe(false);
    expect(live.lab_claim).toBe(false);
    expect(live.unredact.revision_graph).toBe(true);
    expect(live.recover.slot_kinds).toContain("heic");
    expect(live.paths.find((p) => p.path === "/v1/handwriting")?.ok).toBe(false);
  });
});
