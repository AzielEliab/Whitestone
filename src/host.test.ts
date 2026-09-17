import { describe, expect, it } from "vitest";
import { isHostedWorkerApp, shouldOfferSoftwareDownload } from "./host";

describe("hosted worker detection", () => {
  it("treats the live Cloudflare URL as the product host", () => {
    expect(isHostedWorkerApp("whitestone.vibelock.workers.dev")).toBe(true);
    expect(isHostedWorkerApp("whitestone.azieleliab.workers.dev")).toBe(true);
    expect(isHostedWorkerApp("preview.azieleliab.com")).toBe(true);
  });

  it("does not treat localhost as hosted", () => {
    expect(isHostedWorkerApp("localhost")).toBe(false);
    expect(isHostedWorkerApp("127.0.0.1")).toBe(false);
  });
});

describe("software download CTAs", () => {
  it("hides the zip on the Worker host even on a wide desktop", () => {
    expect(
      shouldOfferSoftwareDownload({
        hostname: "whitestone.vibelock.workers.dev",
        narrowViewport: false,
      }),
    ).toBe(false);
  });

  it("hides the zip on a phone even when served locally", () => {
    expect(
      shouldOfferSoftwareDownload({
        hostname: "localhost",
        narrowViewport: true,
      }),
    ).toBe(false);
  });

  it("keeps the zip for a wide local / standalone desktop window", () => {
    expect(
      shouldOfferSoftwareDownload({
        hostname: "localhost",
        narrowViewport: false,
      }),
    ).toBe(true);
  });
});
