import { CLASSIC_100_IN_100, asPercent, roundTo } from "../../shared/math";

export function Home({
  onPlay,
  onLab,
  onBoard,
}: {
  onPlay: () => void;
  onLab: () => void;
  onBoard: () => void;
}) {
  return (
    <section className="hero">
      <p className="eyebrow">Tonight’s harbour watch · for non-science students</p>
      <h1>
        “Once in 100 years.”
        <em> Does that mean you’re safe until 2126?</em>
      </h1>
      <p className="lede">
        Nimbus the cloud thinks so. Nimbus is wrong. Clock in as a junior observer and
        bust the calendar myth in about eight minutes — with pictures, dice, and tap-the-answer calls.
      </p>
      <div className="hero-actions">
        <button type="button" className="btn btn-primary" onClick={onPlay}>
          Clock in for a watch
        </button>
        <button type="button" className="btn btn-secondary" onClick={onLab}>
          Shake the weather dice
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBoard}>
          Honour board
        </button>
      </div>
      <ul className="facts">
        <li>
          <span className="fact-icon" aria-hidden="true">1÷</span>
          <strong>Flip the nickname</strong>
          <span>A 20-year event is just 5% this year. Tap it. Don’t derive it from a textbook first.</span>
        </li>
        <li>
          <span className="fact-icon" aria-hidden="true">{roundTo(asPercent(CLASSIC_100_IN_100, 1), 1)}%</span>
          <strong>Not a booking</strong>
          <span>A 100-year storm is only ~63% likely to show up even once in 100 years.</span>
        </li>
        <li>
          <span className="fact-icon" aria-hidden="true">•• •</span>
          <strong>Storms cluster</strong>
          <span>Two close together, then a long quiet spell. That’s random, not a broken model.</span>
        </li>
      </ul>
    </section>
  );
}
