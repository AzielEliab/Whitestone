import { useState } from "react";
import { useSession } from "../../session/store";
import { Button } from "./Button";

export function EraseBar() {
  const { erase } = useSession();
  const [busy, setBusy] = useState(false);
  return (
    <div className="erase-bar">
      <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
        Uploads only. No export of case papers. End & erase wipes this session,
        including any Home Screen shell cache.
      </p>
      <Button
        kind="danger"
        disabled={busy}
        onClick={async () => {
          if (!confirm("End & erase this session? Chat, uploads, and derived state will be wiped.")) return;
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
