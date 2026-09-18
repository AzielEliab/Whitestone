/**
 * Whitestone hosted runtime (advisory only).
 *
 * Not a lawyer. Not legal advice. Not a FragGate engine.
 * This Worker never stores case files, chat, or uploads.
 * Do NOT add unlock/encrypt/decrypt or any case-export path.
 *
 * Author: Aziel Eliab only.
 */

export const LIMITATION =
  "Not a lawyer. Not a law firm. Not legal advice. Whitestone is educational procedural software for Criminal, Civil, and Divorce. Session-only memory; End & erase wipes the session. No case exports. Hosted /v1 never stores case files. The live app Worker is https://whitestone.vibelock.workers.dev/ — this Worker is the isolated download counter. Not a FragGate engine: do not invent door ops. Author: Aziel Eliab only.";

export function health() {
  return {
    ok: true,
    author: "Aziel Eliab",
    identity: "Aziel Eliab",
    product: "whitestone",
    version: "1.4.0",
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
