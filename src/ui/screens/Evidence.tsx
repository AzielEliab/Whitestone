import { useState } from "react";
import {
  CAMERA_ACCEPT,
  extractEvidence,
  FILE_ACCEPT,
  formatFileSize,
  LARGE_BYTES,
} from "../../extract/files";
import { canSkipToAdvisor } from "../../engine/facts";
import { useSession } from "../../session/store";
import { Button } from "../components/Button";
import { WhatsNext } from "../components/WhatsNext";

export function Evidence() {
  const { state, addUpload, removeUpload, setStep, seedAdvisor, patch } = useSession();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  async function ingest(list: File[]) {
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
        addUpload(await extractEvidence(file));
      }
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not read file");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <section className="card grid">
      <h2>Evidence in, never out</h2>
      <WhatsNext />
      <p className="muted">
        Add photos from your camera or gallery, or files from this phone. Text is
        extracted in this browser. Nothing is packaged for download or print. Files
        die with End & erase.
      </p>
      <p className="muted">12 MB max per file. PDF, DOCX, text, or images (including HEIC).</p>
      <div className="upload-actions">
        <label className="btn file-btn">
          Choose files
          <input
            className="sr-only"
            id="files"
            type="file"
            multiple
            accept={FILE_ACCEPT}
            disabled={busy}
            onChange={async (e) => {
              const list = [...(e.target.files ?? [])];
              e.target.value = "";
              await ingest(list);
            }}
          />
        </label>
        <label className="btn file-btn">
          Take photo
          <input
            className="sr-only"
            id="camera"
            type="file"
            accept={CAMERA_ACCEPT}
            capture="environment"
            disabled={busy}
            onChange={async (e) => {
              const list = [...(e.target.files ?? [])];
              e.target.value = "";
              await ingest(list);
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
          <strong>{f.name}</strong>
          <span className="muted">
            {formatFileSize(f.size)} · {f.mime || "file"}
          </span>
          {f.previewUrl && <img src={f.previewUrl} alt="" />}
          {f.text && (
            <p className="muted">
              {f.text.slice(0, 280)}
              {f.text.length > 280 ? "…" : ""}
            </p>
          )}
          <div className="field">
            <label htmlFor={`note-${f.id}`}>What fact does this support?</label>
            <input
              id={`note-${f.id}`}
              value={f.note}
              autoComplete="off"
              enterKeyHint="done"
              onChange={(e) =>
                patch({
                  uploads: state.uploads.map((u) =>
                    u.id === f.id ? { ...u, note: e.target.value } : u,
                  ),
                })
              }
            />
          </div>
          <Button onClick={() => removeUpload(f.id)}>Remove from session</Button>
        </article>
      ))}
      {state.mappings.length > 0 && (
        <div>
          <h3>Evidence → issue map</h3>
          <ul>
            {state.mappings.map((m, i) => (
              <li key={i}>
                <strong>{m.issueLabel}</strong> ({m.fileName}): {m.allegation}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="chips sticky-actions">
        <Button
          kind="primary"
          onClick={() => {
            seedAdvisor();
          }}
        >
          Continue to guided advisor
        </Button>
        {canSkipToAdvisor(state) && (
          <Button
            onClick={() => {
              seedAdvisor();
            }}
          >
            Skip remaining uploads
          </Button>
        )}
        <Button onClick={() => setStep("facts")}>Back</Button>
      </div>
    </section>
  );
}
