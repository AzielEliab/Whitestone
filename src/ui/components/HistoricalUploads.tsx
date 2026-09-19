import { useState } from "react";
import {
  CAMERA_ACCEPT,
  extractEvidence,
  FILE_ACCEPT,
  formatFileSize,
  LARGE_BYTES,
} from "../../extract/files";
import { useSession } from "../../session/store";
import { UPLOAD_KIND_LABELS, type UploadKind } from "../../types";
import { Button } from "./Button";

const KINDS: UploadKind[] = ["filing", "evidence", "historical_report", "news_clipping"];

export function HistoricalUploads({ compact = false }: { compact?: boolean }) {
  const { state, addUpload, removeUpload, patch } = useSession();
  const [kind, setKind] = useState<UploadKind>("filing");
  const [sourceDate, setSourceDate] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  async function ingest(list: File[], nextKind: UploadKind) {
    if (!list.length) return;
    setBusy(true);
    setErr(null);
    setProgress(null);
    try {
      let i = 0;
      for (const file of list) {
        i += 1;
        const large = file.size >= LARGE_BYTES;
        setProgress(
          `Reading ${i} of ${list.length}: ${file.name || "photo"} (${formatFileSize(file.size)})${
            large ? " — large file, keep this screen on" : ""
          }`,
        );
        addUpload(await extractEvidence(file, { kind: nextKind, sourceDate }));
      }
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not read file");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="historical-uploads">
      {!compact && <h3>Historical path uploads (in only)</h3>}
      <p className="muted">
        Case filings, evidence, historical reports, and news clippings stay in this session. Text is extracted in
        the browser. Nothing is packaged for download. End & erase wipes them.
      </p>
      <div className="field">
        <label htmlFor={`hist-date-${compact ? "c" : "f"}`}>Source date on the document (YYYY-MM-DD, optional)</label>
        <input
          id={`hist-date-${compact ? "c" : "f"}`}
          type="text"
          inputMode="numeric"
          placeholder="1936-08-07"
          value={sourceDate}
          autoComplete="off"
          onChange={(e) => setSourceDate(e.target.value)}
        />
      </div>
      <div className="upload-actions">
        {KINDS.map((k) => (
          <label className="btn file-btn" key={k}>
            {UPLOAD_KIND_LABELS[k]}
            <input
              className="sr-only"
              type="file"
              multiple
              accept={FILE_ACCEPT}
              disabled={busy}
              onChange={async (e) => {
                const list = [...(e.target.files ?? [])];
                e.target.value = "";
                setKind(k);
                await ingest(list, k);
              }}
            />
          </label>
        ))}
        <label className="btn file-btn">
          Photo as {UPLOAD_KIND_LABELS[kind]}
          <input
            className="sr-only"
            type="file"
            accept={CAMERA_ACCEPT}
            capture="environment"
            disabled={busy}
            onChange={async (e) => {
              const list = [...(e.target.files ?? [])];
              e.target.value = "";
              await ingest(list, kind);
            }}
          />
        </label>
      </div>
      {busy && (
        <p className="banner" role="status">
          {progress ?? "Reading in the browser…"}
        </p>
      )}
      {err && (
        <p className="warn" role="alert">
          {err}
        </p>
      )}
      {state.uploads.map((f) => (
        <article className="file" key={f.id}>
          <strong>
            {UPLOAD_KIND_LABELS[f.kind ?? "evidence"]} · {f.name}
          </strong>
          <span className="muted">
            {formatFileSize(f.size)} · {f.mime || "file"}
            {f.sourceDate ? ` · dated ${f.sourceDate}` : ""}
          </span>
          {f.previewUrl && <img src={f.previewUrl} alt="" />}
          {f.text && (
            <p className="muted">
              {f.text.slice(0, 220)}
              {f.text.length > 220 ? "…" : ""}
            </p>
          )}
          <div className="grid two">
            <div className="field">
              <label htmlFor={`kind-${f.id}`}>Kind</label>
              <select
                id={`kind-${f.id}`}
                value={f.kind ?? "evidence"}
                onChange={(e) =>
                  patch({
                    uploads: state.uploads.map((u) =>
                      u.id === f.id ? { ...u, kind: e.target.value as UploadKind } : u,
                    ),
                  })
                }
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {UPLOAD_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor={`date-${f.id}`}>Document date</label>
              <input
                id={`date-${f.id}`}
                value={f.sourceDate ?? ""}
                placeholder="YYYY-MM-DD"
                autoComplete="off"
                onChange={(e) =>
                  patch({
                    uploads: state.uploads.map((u) =>
                      u.id === f.id ? { ...u, sourceDate: e.target.value.trim() || null } : u,
                    ),
                  })
                }
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor={`note-${f.id}`}>What fact does this support?</label>
            <input
              id={`note-${f.id}`}
              value={f.note}
              autoComplete="off"
              enterKeyHint="done"
              onChange={(e) =>
                patch({
                  uploads: state.uploads.map((u) => (u.id === f.id ? { ...u, note: e.target.value } : u)),
                })
              }
            />
          </div>
          <Button onClick={() => removeUpload(f.id)}>Remove from session</Button>
        </article>
      ))}
    </div>
  );
}
