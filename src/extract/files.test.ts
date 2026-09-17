import { describe, expect, it } from "vitest";
import { allowedFile, formatFileSize, MAX_BYTES } from "./files";

function file(name: string, type: string, size = 1024): File {
  const blob = new File([new Uint8Array(8)], name, { type });
  Object.defineProperty(blob, "size", { value: size });
  return blob;
}

describe("evidence file gates", () => {
  it("accepts phone camera and gallery types", () => {
    expect(allowedFile(file("IMG_1234.HEIC", "image/heic"))).toBeNull();
    expect(allowedFile(file("photo.heif", ""))).toBeNull();
    expect(allowedFile(file("image.jpg", "image/jpeg"))).toBeNull();
    expect(allowedFile(file("scan.webp", "image/webp"))).toBeNull();
    expect(allowedFile(file("notes.pdf", "application/pdf"))).toBeNull();
  });

  it("rejects oversized files with a size in the message", () => {
    const msg = allowedFile(file("huge.pdf", "application/pdf", MAX_BYTES + 1));
    expect(msg).toMatch(/12 MB/);
    expect(msg).toMatch(/huge\.pdf/);
  });

  it("rejects unknown binaries", () => {
    expect(allowedFile(file("payload.exe", "application/octet-stream"))).toMatch(/PDF/);
  });

  it("formats sizes for progress copy", () => {
    expect(formatFileSize(800)).toBe("800 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
