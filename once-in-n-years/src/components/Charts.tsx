import type { GraphData, GraphOption } from "../../shared/questions/types";
import { asPercent } from "../../shared/math";

export function Charts({ option, selected, onSelect, name }: {
  option: GraphOption;
  selected: boolean;
  onSelect: () => void;
  name: string;
}) {
  return (
    <label className={`graph-option ${selected ? "is-selected" : ""}`}>
      <input
        type="radio"
        name={name}
        value={option.id}
        checked={selected}
        onChange={onSelect}
      />
      <span className="graph-option-title">{option.title}</span>
      <GraphVisual data={option.data} />
      <span className="graph-option-caption">{option.caption}</span>
    </label>
  );
}

export function GraphVisual({ data }: { data: GraphData }) {
  if (data.kind === "timeline") {
    return <Timeline years={data.years} events={data.eventYears} label={data.thresholdLabel} />;
  }
  if (data.kind === "probability-bars") {
    return <ProbabilityBars bars={data.bars} />;
  }
  return <Rainfall values={data.values} threshold={data.threshold} unit={data.unit} />;
}

function Timeline({ years, events, label }: { years: number; events: number[]; label: string }) {
  const width = 320;
  const height = 64;
  const pad = 16;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img" aria-label={describeTimeline(years, events, label)}>
      <line x1={pad} y1={36} x2={width - pad} y2={36} className="chart-axis" />
      <text x={pad} y={56} className="chart-label">yr 1</text>
      <text x={width - pad - 28} y={56} className="chart-label">yr {years}</text>
      {events.map((year) => {
        const x = pad + ((year - 1) / Math.max(years - 1, 1)) * (width - pad * 2);
        return (
          <g key={year}>
            <circle cx={x} cy={36} r={6} className="chart-event" />
            <text x={x} y={18} textAnchor="middle" className="chart-label">{year}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ProbabilityBars({ bars }: { bars: { label: string; probability: number }[] }) {
  const max = Math.max(...bars.map((bar) => bar.probability), 0.1);
  return (
    <svg viewBox="0 0 320 110" className="chart" role="img" aria-label={bars.map((bar) => `${bar.label}: ${asPercent(bar.probability, 0)} percent`).join(". ")}>
      {bars.map((bar, index) => {
        const y = 18 + index * 44;
        const w = 40 + (bar.probability / max) * 200;
        return (
          <g key={bar.label}>
            <rect x={16} y={y} width={w} height={22} rx={6} className={index === 0 ? "chart-bar-a" : "chart-bar-b"} />
            <text x={24} y={y + 16} className="chart-onbar">{bar.label} · {asPercent(bar.probability, 0)}%</text>
          </g>
        );
      })}
    </svg>
  );
}

function Rainfall({ values, threshold, unit }: { values: number[]; threshold: number; unit: string }) {
  const width = 320;
  const height = 90;
  const max = Math.max(...values, threshold) * 1.1;
  const barW = width / values.length;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img" aria-label={`Rainfall series in ${unit} with a ${threshold} ${unit} threshold. ${values.filter((v) => v >= threshold).length} exceedances.`}>
      {values.map((value, index) => {
        const h = (value / max) * (height - 18);
        const over = value >= threshold;
        return (
          <rect
            key={index}
            x={index * barW}
            y={height - 8 - h}
            width={Math.max(barW - 0.6, 0.8)}
            height={h}
            className={over ? "chart-rain-over" : "chart-rain"}
          />
        );
      })}
      <line
        x1={0}
        x2={width}
        y1={height - 8 - (threshold / max) * (height - 18)}
        y2={height - 8 - (threshold / max) * (height - 18)}
        className="chart-threshold"
      />
    </svg>
  );
}

function describeTimeline(years: number, events: number[], label: string): string {
  if (events.length === 0) {
    return `${years}-year timeline for ${label} with no events.`;
  }
  return `${years}-year timeline for ${label} with events in years ${events.join(", ")}.`;
}
