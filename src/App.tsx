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
  const { state, setStep } = useSession();
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
            <small>Ephemeral pro se family-law advisor</small>
          </span>
        </button>
        <div className="top-actions">
          <a className="btn desktop-only" href="./catalog.json">
            Catalog
          </a>
          <ThemeToggle />
        </div>
      </header>
      {state.disclaimerAccepted && <Stepper />}
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
      <SoftwareDownload />
    </div>
  );
}
