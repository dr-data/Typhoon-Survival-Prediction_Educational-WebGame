import { useMemo, useState } from "react";
import { createRng, interpretSimulation, simulateEvents } from "../../shared/math";

export function Simulator({
  initialReturnPeriod = 50,
  initialYears = 50,
}: {
  initialReturnPeriod?: number;
  initialYears?: number;
}) {
  const [T, setT] = useState(initialReturnPeriod);
  const [years, setYears] = useState(initialYears);
  const [seed, setSeed] = useState(1);
  const result = useMemo(
    () => simulateEvents(T, years, createRng(seed * 1000 + T + years)),
    [T, years, seed],
  );

  return (
    <div className="sim">
      <div className="sim-controls">
        <label className="field">
          <span>Return period T (years)</span>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={T}
            onChange={(event) => setT(Number(event.target.value))}
            aria-valuetext={`${T}-year event, ${(100 / T).toFixed(1)} percent each year`}
          />
          <strong>{T}-year event · {(100 / T).toFixed(1)}% per year</strong>
        </label>
        <fieldset className="segmented">
          <legend>Simulate this many years</legend>
          {[10, 50, 100].map((n) => (
            <label key={n}>
              <input
                type="radio"
                name="sim-years"
                checked={years === n}
                onChange={() => setYears(n)}
              />
              {n}
            </label>
          ))}
        </fieldset>
        <button type="button" className="btn btn-secondary" onClick={() => setSeed((s) => s + 1)}>
          Run again with a new random history
        </button>
      </div>
      <SimTimeline result={result} />
      <p className="sim-readout" aria-live="polite">
        <strong>{result.count}</strong> event{result.count === 1 ? "" : "s"} in {years} years.
        Long-term average would be <strong>{result.expectedCount}</strong>.
        {result.eventYears.length > 0
          ? ` Timing: year ${result.eventYears.join(", year ")}.`
          : " Nothing crossed the line in this run."}
      </p>
      <p className="sim-note">{interpretSimulation(result)}</p>
    </div>
  );
}

function SimTimeline({
  result,
}: {
  result: ReturnType<typeof simulateEvents>;
}) {
  const width = 640;
  const height = 88;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="chart sim-chart"
      role="img"
      aria-label={`${result.count} events in ${result.years} years for a ${result.returnPeriod}-year event`}
    >
      <line x1={20} y1={48} x2={width - 20} y2={48} className="chart-axis" />
      {result.events.map((happened, index) => {
        const x = 20 + (index / Math.max(result.years - 1, 1)) * (width - 40);
        return happened ? (
          <circle key={index} cx={x} cy={48} r={5.5} className="chart-event" />
        ) : (
          <circle key={index} cx={x} cy={48} r={1.4} className="chart-tick" />
        );
      })}
      <text x={20} y={78} className="chart-label">year 1</text>
      <text x={width - 70} y={78} className="chart-label">year {result.years}</text>
    </svg>
  );
}
