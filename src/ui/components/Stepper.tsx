import { whatsNextLine } from "../../engine/facts";
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
      <p className="stepper-status">
        Step {Math.max(idx, 0) + 1} of {ORDER.length}
        <strong>{STEP_LABELS[state.step]}</strong>
        <span className="stepper-next">{whatsNextLine(state)}</span>
      </p>
      <div className="stepper-track">
        {ORDER.map((step, i) => {
          const reached = i <= idx || (state.disclaimerAccepted && i > 0);
          return (
            <button
              key={step}
              type="button"
              data-current={state.step === step}
              disabled={!reached}
              aria-current={state.step === step ? "step" : undefined}
              aria-label={`${i + 1}. ${STEP_LABELS[step]}`}
              onClick={() => reached && setStep(step)}
            >
              <span className="step-index" aria-hidden>
                {i + 1}
              </span>
              <span className="step-label">{STEP_LABELS[step]}</span>
            </button>
          );
        })}
      </div>
      <p className="whats-next stepper-whats">{whatsNextLine(state)}</p>
    </nav>
  );
}
