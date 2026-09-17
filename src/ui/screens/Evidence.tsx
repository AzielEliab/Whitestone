import { useState } from "react";
import { extractEvidence } from "../../extract/files";
import { useSession } from "../../session/store";
import { Button } from "../components/Button";

export function Evidence() {
  const { state, addUpload, removeUpload, setStep, seedAdvisor, patch } = useSession();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <section className="card grid">
      <h2>Evidence in, never out</h2>
      <p className="muted">
        Upload PDF, DOCX, text, or images. Text is extracted in this browser. Nothing
        is packaged for download or print. Files die with End & erase or when this
        window unloads.
      </p>
      <div className="field">
        <label htmlFor="files">Add files</label>
        <input
          id="files"
          type="file"
          multiple
          accept=".pdf,.txt,.md,.csv,.docx,image/*"
          onChange={async (e) => {
            const list = [...(e.target.files ?? [])];
            e.target.value = "";
            setBusy(true);
            setErr(null);
            try {
              for (const file of list) {
                addUpload(await extractEvidence(file));
              }
            } catch (ex) {
              setErr(ex instanceof Error ? ex.message : "Could not read file");
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
      {busy && <p>Reading in the browser…</p>}
      {err && (
        <p className="warn" role="alert">
          {err}
        </p>
      )}
      {state.uploads.map((f) => (
        <article className="file" key={f.id}>
          <strong>{f.name}</strong>
          <span className="muted">
            {(f.size / 1024).toFixed(1)} KB · {f.mime || "file"}
          </span>
          {f.previewUrl && <img src={f.previewUrl} alt="" />}
          {f.text && <p className="muted">{f.text.slice(0, 280)}{f.text.length > 280 ? "…" : ""}</p>}
          <div className="field">
            <label htmlFor={`note-${f.id}`}>What fact does this support?</label>
            <input
              id={`note-${f.id}`}
              value={f.note}
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
      <div className="chips">
        <Button
          kind="primary"
          onClick={() => {
            seedAdvisor();
          }}
        >
          Continue to guided advisor
        </Button>
        <Button onClick={() => setStep("facts")}>Back</Button>
      </div>
    </section>
  );
}
