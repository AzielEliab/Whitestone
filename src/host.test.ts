import { describe, expect, it } from "vitest";
import { isHostedWorkerApp, shouldOfferSoftwareDownload, softwareDownloadHref } from "./host";

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
  it("offers the zip on the Worker host on a wide desktop", () => {
    expect(
      shouldOfferSoftwareDownload({
        hostname: "whitestone.vibelock.workers.dev",
        narrowViewport: false,
      }),
    ).toBe(true);
  });

  it("offers the zip on a phone, hosted or local", () => {
    expect(
      shouldOfferSoftwareDownload({
        hostname: "whitestone.vibelock.workers.dev",
        narrowViewport: true,
      }),
    ).toBe(true);
    expect(
      shouldOfferSoftwareDownload({
        hostname: "localhost",
        narrowViewport: true,
      }),
    ).toBe(true);
  });

  it("keeps the zip on a wide local / standalone desktop window", () => {
    expect(
      shouldOfferSoftwareDownload({
        hostname: "localhost",
        narrowViewport: false,
      }),
    ).toBe(true);
  });

  it("uses the counted /download path on the hosted Worker", () => {
    expect(softwareDownloadHref("whitestone.vibelock.workers.dev")).toBe("/download");
    expect(softwareDownloadHref("localhost")).toContain("github.com/AzielEliab/Whitestone/releases");
  });
});
