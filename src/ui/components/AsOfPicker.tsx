import { monthsForPicker, yearsForPicker } from "../../history";
import { useSession } from "../../session/store";

export function AsOfPicker({ idPrefix = "asof" }: { idPrefix?: string }) {
  const { state, setAsOf } = useSession();
  const years = yearsForPicker();
  const months = monthsForPicker();

  return (
    <div className="grid two asof-picker">
      <div className="field">
        <label htmlFor={`${idPrefix}-year`}>As-of year</label>
        <select
          id={`${idPrefix}-year`}
          value={state.asOfYear ?? ""}
          onChange={(e) => {
            const year = e.target.value ? Number(e.target.value) : null;
            setAsOf(year, state.asOfMonth);
          }}
        >
          <option value="">Select year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-month`}>As-of month</label>
        <select
          id={`${idPrefix}-month`}
          value={state.asOfMonth ?? ""}
          onChange={(e) => {
            const month = e.target.value ? Number(e.target.value) : null;
            setAsOf(state.asOfYear, month);
          }}
        >
          <option value="">Select month</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
