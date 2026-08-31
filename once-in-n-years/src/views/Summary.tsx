import { gradeRun } from "../../shared/questions/grade";
import type { StudentAnswer } from "../../shared/questions/types";
import type { Player } from "../player";

function stampsFor(report: ReturnType<typeof gradeRun>) {
  const stamps: { name: string; got: boolean }[] = [
    { name: "Nickname flipper", got: report.concepts.some((c) => c.concept === "t-from-p" && c.correct > 0) },
    { name: "Calendar breaker", got: report.concepts.some((c) => c.concept === "not-a-schedule" && c.correct > 0) },
    { name: "Cluster watcher", got: report.concepts.some((c) => c.concept === "clustering" && c.correct > 0) },
    { name: "63% club", got: report.concepts.some((c) => c.concept === "at-least-once" && c.correct > 0) || report.correct === report.items.length },
    { name: "Hot streak", got: report.bestStreak >= 5 },
  ];
  return stamps;
}

export function Summary({
  player,
  seed,
  report,
  answers,
  submitState,
  onSubmit,
  onReplay,
  onLab,
}: {
  player: Player;
  seed: number;
  report: ReturnType<typeof gradeRun>;
  answers: StudentAnswer[];
  submitState: string;
  onSubmit: () => void;
  onReplay: () => void;
  onLab: () => void;
}) {
  const stamps = stampsFor(report);
  return (
    <section className="panel glow">
      <h1>Watch complete</h1>
      <p className="scoreline">
        <strong>{report.totalPoints}</strong> pts · {report.correct}/{report.items.length} caught
        · best streak {report.bestStreak}
      </p>
      <p>{report.summary}</p>
      <ul className="stamps">
        {stamps.map((stamp) => (
          <li key={stamp.name} className={stamp.got ? "got" : ""}>
            <b>{stamp.got ? "★" : "☆"}</b> {stamp.name}
          </li>
        ))}
      </ul>
      <ul className="concepts">
        {report.concepts.map((concept) => (
          <li key={concept.concept}>
            <span>{concept.label}</span>
            <meter min={0} max={concept.attempted} value={concept.correct} />
            <b>{concept.correct}/{concept.attempted}</b>
          </li>
        ))}
      </ul>
      <blockquote>
        Take this home: T = 1/p is an average rate. It is not a calendar, and climate can still move N.
      </blockquote>
      <div className="hero-actions">
        <button type="button" className="btn btn-primary" onClick={onSubmit}>
          Pin {player.anonymous ? "an anonymous" : "my"} score
        </button>
        <button type="button" className="btn btn-secondary" onClick={onReplay}>
          Another watch
        </button>
        <button type="button" className="btn btn-ghost" onClick={onLab}>
          Shake the dice
        </button>
      </div>
      {submitState && <p className="muted" role="status">{submitState}</p>}
      <p className="fine">Seed {seed} · {answers.length} calls · no personal data.</p>
    </section>
  );
}
