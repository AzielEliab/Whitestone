/** Hard confidence cap for Case Mode. Never display above 75%. Author: Aziel Eliab. */

export const CASE_CONFIDENCE_CAP = 0.75;

export function capConfidence(raw: number): number {
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.min(raw, CASE_CONFIDENCE_CAP);
}

export function labeledOrUnknown(
  value: number | null,
  noteLabeled: string,
  noteUnknown: string,
): { value: number | null; status: "LABELED" | "UNKNOWN"; note: string } {
  if (value == null || !Number.isFinite(value)) {
    return { value: null, status: "UNKNOWN", note: noteUnknown };
  }
  return { value: capConfidence(value), status: "LABELED", note: noteLabeled };
}
