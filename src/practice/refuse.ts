const CRIME_HELP =
  /\b(how (do i|to) (commit|rob|steal|assault|murder|kill|deal|sell drugs|make (a )?(bomb|weapon)|hack into)|help me (commit|get away with|cover up))\b/i;
const DESTROY_EVIDENCE =
  /\b(destroy|hide|wipe|burn|shred|flush|delete|tamper with|plant) (the )?(evidence|body|weapon|phone|texts|cctv|footage|witness)\b/i;
const INTIMIDATE =
  /\b(intimidate|threaten|silence|pay off|scare) (the )?(witness|victim|juror|complainant)\b/i;
const EVADE =
  /\b(evade|dodge|skip|avoid) (arrest|the warrant|service of process|the summons|court|the cop|police)\b|\b(how (do i|to) (get away|flee|run from|disappear from) (the )?(police|cops|court|warrant))\b/i;
const LIE_COURT =
  /\b(how (do i|to) lie (to|in) (the )?(court|judge|probation)|false testimony|what should i say that is not true)\b/i;

export function criminalRefuse(text: string): string | null {
  const q = text.trim();
  if (!q) return null;
  if (CRIME_HELP.test(q) || DESTROY_EVIDENCE.test(q) || INTIMIDATE.test(q) || EVADE.test(q) || LIE_COURT.test(q)) {
    return [
      "I will not help commit a crime, destroy or hide evidence, intimidate a witness, evade arrest or court process, or lie to a court.",
      "Those are crimes. If you already have a case, talk to a licensed lawyer or the public defender. If you are in danger, call 911.",
      "I can still explain public court process in general terms — arraignment, discovery, pleas, sentencing, expungement — as education, not as a way to beat a case.",
    ].join(" ");
  }
  return null;
}
