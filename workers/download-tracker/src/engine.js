/**
 * Whitestone hosted runtime (advisory only).
 *
 * One ephemeral pro se advisor for Criminal, Civil, and Divorce.
 * This Worker never stores case files, chat, or uploads.
 * Do not add unlock/encrypt/decrypt or any case-export path.
 *
 * Author: Aziel Eliab only.
 */

export const LIMITATION =
  "Whitestone is one ephemeral pro se advisor for Criminal, Civil, and Divorce. Educational procedural software. Session-only memory; End & erase wipes the session. Uploads only; hosted /v1 never stores case files. The live app is https://whitestone.vibelock.workers.dev/ — this Worker is the isolated download counter. Catalog placement. Author: Aziel Eliab only.";

export function health() {
  return {
    ok: true,
    author: "Aziel Eliab",
    identity: "Aziel Eliab",
    product: "whitestone",
    version: "1.5.0",
    runtime: true,
    kv_increment: false,
    stores_cases: false,
    stores_uploads: false,
    lawyer: false,
    legal_advice: false,
    fraggate_engine: false,
    limitation: LIMITATION,
  };
}
