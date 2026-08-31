import type { Difficulty } from "../../shared/scoring";
import { useState } from "react";

const BRIEF_CARDS = [
  {
    kicker: "The nickname",
    title: "“Once in N years” is a nickname, not a diary.",
    body: "A 20-year event is just a 5% chance this year. Flip the number: T = 1 / p. Nobody promised you a storm in year 20.",
  },
  {
    kicker: "The dice",
    title: "Each year is a fresh roll.",
    body: "Last year’s flood does not “use up” this year’s chance. Unlikely things can still happen twice in a row.",
  },
  {
    kicker: "The surprise",
    title: "100 years is not a 100% chance.",
    body: "A 100-year event has only about a 63% chance of showing up at least once in 100 years. Quiet centuries happen.",
  },
  {
    kicker: "The small print",
    title: "The number can move.",
    body: "Short records, fancy curves, different cities, and a changing climate can all revise N. Treat it as useful, not carved in stone.",
  },
];

export function Briefing({ difficulty, onContinue }: { difficulty: Difficulty; onContinue: () => void }) {
  const [page, setPage] = useState(0);
  const card = BRIEF_CARDS[page];
  if (!card) return null;
  const last = page === BRIEF_CARDS.length - 1;
  return (
    <section className="panel story">
      <p className="eyebrow">{card.kicker} · {page + 1}/{BRIEF_CARDS.length}</p>
      <h1>{card.title}</h1>
      <p className="lede">{card.body}</p>
      <div className="story-dots" aria-hidden="true">
        {BRIEF_CARDS.map((item, i) => (
          <span key={item.kicker} className={i === page ? "is-on" : ""} />
        ))}
      </div>
      <div className="hero-actions">
        {page > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => setPage((n) => n - 1)}>
            Back
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => (last ? onContinue() : setPage((n) => n + 1))}
        >
          {last
            ? difficulty === "challenge"
              ? "Start typhoon watch"
              : "Start morning watch"
            : "Next beat"}
        </button>
      </div>
    </section>
  );
}
