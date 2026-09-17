import type { EvidenceFile } from "../types";

export const MAX_BYTES = 12 * 1024 * 1024;
export const LARGE_BYTES = 2 * 1024 * 1024;
const MAX_TEXT = 40_000;

/** Camera, gallery, and files — including iPhone HEIC. */
export const FILE_ACCEPT =
  "image/*,.pdf,.txt,.md,.csv,.docx,.doc,.heic,.heif,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const CAMERA_ACCEPT = "image/*";

function id() {
  return crypto.randomUUID();
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function allowedFile(file: File): string | null {
  const type = file.type || "";
  const name = file.name || "";
  const ok =
    /^(application\/pdf|text\/|image\/|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/msword)/i.test(
      type,
    ) ||
    /\.(pdf|txt|md|csv|docx|doc|png|jpe?g|gif|webp|heic|heif|bmp)$/i.test(name) ||
    (!type && /^image\./i.test(name));
  if (!ok) return "Use PDF, DOCX, text, or image files (camera, photos, or files).";
  if (file.size > MAX_BYTES) {
    return `${file.name || "This file"} is ${formatFileSize(file.size)}. Each file must be 12 MB or smaller.`;
  }
  return null;
}

export async function extractEvidence(file: File): Promise<EvidenceFile> {
  const err = allowedFile(file);
  if (err) throw new Error(err);

  let text = "";
  let previewUrl: string | undefined;
  const mime = file.type || guessMime(file.name);

  if (mime.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name)) {
    text = await file.text();
  } else if (mime === "application/pdf" || /\.pdf$/i.test(file.name)) {
    text = await extractPdf(file);
  } else if (
    mime.includes("wordprocessingml") ||
    /\.docx$/i.test(file.name)
  ) {
    text = await extractDocx(file);
  } else if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|heic|heif|bmp)$/i.test(file.name)) {
    previewUrl = URL.createObjectURL(file);
    text = "";
  } else {
    text = await file.text().catch(() => "");
  }

  text = text.replace(/\u0000/g, "").slice(0, MAX_TEXT);

  return {
    id: id(),
    name: file.name,
    mime,
    size: file.size,
    addedAt: new Date().toISOString(),
    text,
    note: mime.startsWith("image/")
      ? "Image stored only in this session. Add a note describing the fact it proves — Whitestone does not send images to an OCR service."
      : "",
    previewUrl,
  };
}

function guessMime(name: string): string {
  if (/\.pdf$/i.test(name)) return "application/pdf";
  if (/\.docx$/i.test(name)) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (/\.txt$/i.test(name)) return "text/plain";
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.jpe?g$/i.test(name)) return "image/jpeg";
  if (/\.gif$/i.test(name)) return "image/gif";
  if (/\.webp$/i.test(name)) return "image/webp";
  if (/\.heic$/i.test(name)) return "image/heic";
  if (/\.heif$/i.test(name)) return "image/heif";
  return "application/octet-stream";
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  const max = Math.min(doc.numPages, 25);
  for (let i = 1; i <= max; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it) => ("str" in it ? it.str : "")).join(" "));
  }
  await doc.destroy();
  return pages.join("\n");
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
