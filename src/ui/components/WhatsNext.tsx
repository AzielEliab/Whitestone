import { whatsNextLine } from "../../engine/facts";
import { useSession } from "../../session/store";

export function WhatsNext() {
  const { state } = useSession();
  return (
    <p className="whats-next" role="status">
      <span className="muted">What’s next</span>
      {whatsNextLine(state)}
    </p>
  );
}
