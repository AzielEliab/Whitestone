import { useState } from "react";
import { useSession } from "../../session/store";
import { Button } from "./Button";

export function EraseBar() {
  const { erase } = useSession();
  const [busy, setBusy] = useState(false);
  return (
    <div className="erase-bar">
      <p className="muted erase-note">
        <span className="erase-note-full">
          Uploads only. No export of case papers. End & erase wipes this session,
          including chat, uploads, web notes, as-of dates, archival notes, honesty lattice, and any Home Screen shell cache.
        </span>
        <span className="erase-note-short">Uploads only · no case export</span>
      </p>
      <Button
        kind="danger"
        disabled={busy}
        onClick={async () => {
          if (!confirm("End & erase this session? Chat, uploads, web notes, and derived state will be wiped.")) return;
          setBusy(true);
          await erase();
          setBusy(false);
        }}
      >
        {busy ? "Erasing…" : "End & erase"}
      </Button>
    </div>
  );
}
