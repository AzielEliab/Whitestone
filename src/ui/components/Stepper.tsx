import { STEP_LABELS, type AppStep } from "../../types";
import { useSession } from "../../session/store";

const ORDER: AppStep[] = [
  "welcome",
  "jurisdiction",
  "matter",
  "facts",
  "evidence",
  "advise",
  "filing",
];

export function Stepper() {
  const { state, setStep } = useSession();
  const idx = ORDER.indexOf(state.step);
  return (
    <nav className="stepper" aria-label="Session steps">
      {ORDER.map((step, i) => {
        const reached = i <= idx || (state.disclaimerAccepted && i > 0);
        return (
          <button
            key={step}
            type="button"
            data-current={state.step === step}
            disabled={!reached}
            onClick={() => reached && setStep(step)}
          >
            {i + 1}. {STEP_LABELS[step]}
          </button>
        );
      })}
    </nav>
  );
}
