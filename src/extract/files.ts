import type { EvidenceFile, UploadKind } from "../types";

export const MAX_BYTES = 12 * 1024 * 1024;
export const LARGE_BYTES = 2 * 1024 * 1024;
const MAX_TEXT = 40_000;

/** Camera, gallery, and files — including iPhone HEIC. */
export const FILE_ACCEPT =
  "image/*,video/*,audio/*,.pdf,.txt,.md,.csv,.docx,.doc,.heic,.heif,.mp4,.webm,.mov,.mp3,.wav,.ogg,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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
    /^(application\/pdf|text\/|image\/|video\/|audio\/|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/msword)/i.test(
      type,
    ) ||
    /\.(pdf|txt|md|csv|docx|doc|png|jpe?g|gif|webp|heic|heif|bmp|mp4|webm|mov|mp3|wav|ogg|m4a)$/i.test(name) ||
    (!type && /^image\./i.test(name));
  if (!ok) return "Use PDF, DOCX, text, or image files (camera, photos, or files).";
  if (file.size > MAX_BYTES) {
    return `${file.name || "This file"} is ${formatFileSize(file.size)}. Each file must be 12 MB or smaller.`;
  }
  return null;
}

export async function extractEvidence(
  file: File,
  opts?: { kind?: UploadKind; sourceDate?: string | null },
): Promise<EvidenceFile> {
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
  } else if (mime.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name)) {
    previewUrl = URL.createObjectURL(file);
    text = `Video in session only. filename=${file.name}; mime=${mime}; bytes=${file.size}. No invented visual claims. Add a note for what the frames show.`;
  } else if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/i.test(file.name)) {
    text = `Audio in session only. filename=${file.name}; mime=${mime}; bytes=${file.size}. VibeLock-lite may use this layer. No invented transcript.`;
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
      : mime.startsWith("video/")
        ? "Video metadata only unless you add a note. Whitestone will not invent what the frames show."
        : mime.startsWith("audio/")
          ? "Audio stored in this session. Add a note; no invented transcript."
          : "",
    kind: opts?.kind ?? "evidence",
    sourceDate: opts?.sourceDate?.trim() || null,
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
