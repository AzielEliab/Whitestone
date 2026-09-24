import { PRACTICE_LABELS, PRACTICE_SUBTITLES } from "./practice/areas";
import { useSession } from "./session/store";
import { EraseBar } from "./ui/components/EraseBar";
import { SoftwareDownload } from "./ui/components/SoftwareDownload";
import { Stepper } from "./ui/components/Stepper";
import { ThemeToggle } from "./ui/components/ThemeToggle";
import { Advise } from "./ui/screens/Advise";
import { Evidence } from "./ui/screens/Evidence";
import { Facts } from "./ui/screens/Facts";
import { Filing } from "./ui/screens/Filing";
import { Jurisdiction } from "./ui/screens/Jurisdiction";
import { Matter } from "./ui/screens/Matter";
import { Welcome } from "./ui/screens/Welcome";

export function App() {
  const { state, setStep, resetPracticeArea } = useSession();
  const subtitle = state.practiceArea
    ? PRACTICE_SUBTITLES[state.practiceArea]
    : "Criminal, Civil, or Divorce";

  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <button className="brand" type="button" onClick={() => setStep("welcome")}>
          <span className="mark" aria-hidden>
            W
          </span>
          <span>
            Whitestone
            <small>{subtitle}</small>
          </span>
        </button>
        <div className="top-actions">
          {state.historicalMode && (
            <span className="chip asof-chip">
              As-of{" "}
              {state.asOfYear && state.asOfMonth
                ? `${state.asOfYear}-${String(state.asOfMonth).padStart(2, "0")}`
                : "year/month"}
            </span>
          )}
          {state.practiceArea && state.step !== "welcome" && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                const area = state.practiceArea;
                if (!area) return;
                const ok = window.confirm(
                  `Change practice area? This clears ${PRACTICE_LABELS[area]} matter notes, chat, uploads, and web sources so areas do not mix.`,
                );
                if (!ok) return;
                resetPracticeArea();
              }}
            >
              {PRACTICE_LABELS[state.practiceArea]}
            </button>
          )}
          <details className="more">
            <summary className="btn">More</summary>
            <div className="more-menu">
              <SoftwareDownload variant="menu" />
              <a className="more-link" href="./catalog.json">
                Catalog
              </a>
            </div>
          </details>
          <ThemeToggle />
        </div>
      </header>
      {state.disclaimerAccepted && state.practiceArea && state.step !== "welcome" && <Stepper />}
      <main id="main">
        {state.step === "welcome" && <Welcome />}
        {state.step === "jurisdiction" && <Jurisdiction />}
        {state.step === "matter" && <Matter />}
        {state.step === "facts" && <Facts />}
        {state.step === "evidence" && <Evidence />}
        {state.step === "advise" && <Advise />}
        {state.step === "filing" && <Filing />}
      </main>
      {state.disclaimerAccepted && <EraseBar />}
      <SoftwareDownload variant="footer" />
    </div>
  );
}
