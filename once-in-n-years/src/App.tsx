import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { CLASSIC_100_IN_100, asPercent, roundTo } from "../shared/math";
import { sanitiseNickname } from "../shared/nicknames";
import { buildQuiz } from "../shared/questions/generate";
import { gradeRun } from "../shared/questions/grade";
import { TYPE_LABELS, type Quiz, type StudentAnswer } from "../shared/questions/types";
import type { Difficulty } from "../shared/scoring";
import { Charts } from "./components/Charts";
import { HarbourScene, Nimbus } from "./components/Scene";
import { Simulator } from "./components/Simulator";
import { fetchLeaderboard, submitRun, type LeaderboardEntry } from "./lib/api";

type View = "home" | "setup" | "briefing" | "play" | "lab" | "summary" | "board";

type Player = {
  nickname: string;
  anonymous: boolean;
  classCode: string;
  difficulty: Difficulty;
};

const DEFAULT_PLAYER: Player = {
  nickname: "",
  anonymous: true,
  classCode: "",
  difficulty: "practice",
};

const WATCHES = [
  "Watch 1 · The nickname",
  "Watch 2 · This year’s chance",
  "Watch 3 · The calendar myth",
  "Watch 4 · Rarer beasts",
  "Watch 5 · Read the sky",
  "Watch 6 · Two in ten?!",
  "Watch 7 · Picture the odds",
  "Watch 8 · Shake the dice",
];

export default function App() {
  const [view, setView] = useState<View>("home");
  const [player, setPlayer] = useState<Player>(DEFAULT_PLAYER);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000_000));
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [submitState, setSubmitState] = useState<string>("");

  const quiz = useMemo(() => buildQuiz(seed, player.difficulty), [seed, player.difficulty]);
  const report = useMemo(
    () => (answers.length ? gradeRun(seed, player.difficulty, answers) : null),
    [answers, seed, player.difficulty],
  );

  const nimbusMood =
    view === "summary" ? "cheer" : view === "play" ? "think" : view === "lab" ? "idle" : "idle";

  return (
    <div className="app">
      <HarbourScene />
      <a className="skip" href="#main">Skip to content</a>
      <header className="top">
        <button type="button" className="brand" onClick={() => setView("home")}>
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>
            Once in N Years
            <small>Harbour Watch</small>
          </span>
        </button>
        <nav className="nav" aria-label="Game">
          <button type="button" className={view === "lab" ? "is-active" : ""} onClick={() => setView("lab")}>
            Weather lab
          </button>
          <button type="button" className={view === "board" ? "is-active" : ""} onClick={() => setView("board")}>
            Honour board
          </button>
        </nav>
      </header>
      <main id="main">
        {view === "home" && (
          <Home
            onPlay={() => setView("setup")}
            onLab={() => setView("lab")}
            onBoard={() => setView("board")}
          />
        )}
        {view === "setup" && (
          <Setup
            player={player}
            onChange={setPlayer}
            onStart={() => {
              setSeed(Math.floor(Math.random() * 1_000_000_000));
              setAnswers([]);
              setSubmitState("");
              setView("briefing");
            }}
          />
        )}
        {view === "briefing" && (
          <Briefing difficulty={player.difficulty} onContinue={() => setView("play")} />
        )}
        {view === "play" && (
          <Play
            quiz={quiz}
            onFinish={(next) => {
              setAnswers(next);
              setView("summary");
            }}
          />
        )}
        {view === "lab" && <Lab onPlay={() => setView("setup")} />}
        {view === "summary" && report && (
          <Summary
            player={player}
            seed={seed}
            report={report}
            answers={answers}
            submitState={submitState}
            onSubmit={async () => {
              setSubmitState("Pinning your score to the harbour board…");
              try {
                const nick = sanitiseNickname(player.nickname, player.anonymous);
                if (!nick.ok) {
                  setSubmitState(nick.error);
                  return;
                }
                await submitRun({
                  seed,
                  difficulty: player.difficulty,
                  nickname: nick.nickname,
                  anonymous: nick.anonymous,
                  classCode: player.classCode,
                  answers,
                });
                setPlayer((current) => ({ ...current, nickname: nick.nickname }));
                setSubmitState(`Pinned ${nick.nickname} · ${report.totalPoints} pts`);
                setView("board");
              } catch (error) {
                setSubmitState(error instanceof Error ? error.message : "Could not save.");
              }
            }}
            onReplay={() => {
              setSeed(Math.floor(Math.random() * 1_000_000_000));
              setAnswers([]);
              setView("play");
            }}
            onLab={() => setView("lab")}
          />
        )}
        {view === "board" && (
          <Board classCode={player.classCode} difficulty={player.difficulty} />
        )}
      </main>
      <aside className="nimbus-dock">
        <Nimbus mood={nimbusMood} />
      </aside>
      <footer className="foot">
        A return period is a long-term average — never a promise.
        {" "}
        <a href="https://www.hko.gov.hk/en/education/climate/climate-change/00672-Return-Period-Once-in-N-Years.html">
          Hong Kong Observatory
        </a>
        . No email collected.
      </footer>
    </div>
  );
}

function Home({
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

function Setup({
  player,
  onChange,
  onStart,
}: {
  player: Player;
  onChange: (player: Player) => void;
  onStart: () => void;
}) {
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nick = sanitiseNickname(player.nickname, player.anonymous);
    if (!nick.ok) {
      setError(nick.error);
      return;
    }
    onChange({ ...player, nickname: nick.nickname });
    onStart();
  }

  return (
    <section className="panel glow">
      <h1>Pick your watch</h1>
      <p>Same idea either way. Typhoon watch just asks the spicier questions and pays 1.5× points.</p>
      <form className="stack" onSubmit={handleSubmit}>
        <div className="watch-pick">
          <button
            type="button"
            className={player.difficulty === "practice" ? "watch-card is-on" : "watch-card"}
            onClick={() => onChange({ ...player, difficulty: "practice" })}
          >
            <span className="watch-kicker">Morning watch</span>
            <strong>Practice</strong>
            <span>8 quick calls · tap answers · hints if you want them · about 6 minutes</span>
          </button>
          <button
            type="button"
            className={player.difficulty === "challenge" ? "watch-card is-on" : "watch-card"}
            onClick={() => onChange({ ...player, difficulty: "challenge" })}
          >
            <span className="watch-kicker">Typhoon watch</span>
            <strong>Challenge</strong>
            <span>14 calls · climate plot twists · 1.5× score · bragging rights</span>
          </button>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={player.anonymous}
            onChange={(event) => onChange({ ...player, anonymous: event.target.checked })}
          />
          Stay anonymous (we mint a storm ID — never your real name)
        </label>
        {!player.anonymous && (
          <label className="field">
            <span>Observer nickname</span>
            <input
              value={player.nickname}
              onChange={(event) => onChange({ ...player, nickname: event.target.value })}
              maxLength={24}
              autoComplete="nickname"
              placeholder="e.g. Harbour Fox"
            />
          </label>
        )}
        <label className="field">
          <span>Class or tutorial code (optional)</span>
          <input
            value={player.classCode}
            onChange={(event) => onChange({ ...player, classCode: event.target.value })}
            maxLength={12}
            placeholder="e.g. GEOG101"
            autoComplete="off"
          />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary">Meet Nimbus →</button>
      </form>
    </section>
  );
}

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

function Briefing({ difficulty, onContinue }: { difficulty: Difficulty; onContinue: () => void }) {
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

function Play({ quiz, onFinish }: { quiz: Quiz; onFinish: (answers: StudentAnswer[]) => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [draft, setDraft] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showType, setShowType] = useState(false);
  const [pop, setPop] = useState("");
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const live = useRef<HTMLDivElement>(null);
  const question = quiz.questions[index];
  const key = quiz.keys[index];
  const feedback = answers[index];

  useEffect(() => {
    setDraft("");
    setShowHint(false);
    setShowType(false);
    setStartedAt(Date.now());
  }, [index]);

  const graded = question && key && feedback
    ? gradeRun(quiz.seed, quiz.difficulty, answers.slice(0, index + 1)).items[index]
    : null;

  useEffect(() => {
    if (!graded) return;
    if (graded.kind === "correct") {
      setPop(graded.grade.streak >= 3 ? `Combo ×${graded.grade.streak}` : "Nice catch");
    } else if (graded.kind === "partial") {
      setPop("Close…");
    } else {
      setPop("Plot twist");
    }
    const timer = window.setTimeout(() => setPop(""), 900);
    return () => window.clearTimeout(timer);
  }, [graded?.kind, graded?.grade.streak, index]);

  if (!question || !key) return null;

  const hud = gradeRun(quiz.seed, quiz.difficulty, answers);
  const watch = WATCHES[index] ?? `Watch ${index + 1}`;

  function submit(value: string | number) {
    if (feedback) return;
    const next: StudentAnswer = {
      questionId: question.id,
      value,
      elapsedMs: Date.now() - startedAt,
    };
    setAnswers((current) => {
      const copy = [...current];
      copy[index] = next;
      return copy;
    });
    live.current?.focus();
  }

  function nextQuestion() {
    if (index + 1 >= quiz.questions.length) {
      onFinish(answers);
      return;
    }
    setIndex((value) => value + 1);
  }

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!question.choices || feedback) return;
    const map: Record<string, string> = { "1": "a", "2": "b", "3": "c", "4": "d" };
    const choice = map[event.key];
    if (choice && question.choices.some((item) => item.id === choice)) {
      submit(choice);
    }
  }

  return (
    <section className="play" onKeyDown={onKey}>
      {pop && <div className={`combo-pop combo-${graded?.kind}`} role="status">{pop}</div>}
      <div className="hud">
        <ol className="stations" aria-label="Watch progress">
          {quiz.questions.map((item, i) => (
            <li key={item.id} className={i < index ? "done" : i === index ? "now" : ""}>
              <span className="sr-only">
                {i === index ? "Current" : i < index ? "Done" : "Upcoming"} question {i + 1}
              </span>
            </li>
          ))}
        </ol>
        <div className="hud-stats">
          <span>{hud.totalPoints} pts</span>
          <span className={hud.bestStreak >= 3 ? "hot" : ""}>
            {hud.bestStreak >= 3 ? "🔥" : "·"} streak {answers.filter(Boolean).length ? hud.bestStreak : 0}
          </span>
        </div>
      </div>
      <article className="question glow">
        <p className="eyebrow">
          {watch} · {TYPE_LABELS[question.type]} · {index + 1}/{quiz.questions.length}
        </p>
        <h1>{question.prompt}</h1>
        <p>{question.context}</p>
        {question.formulaHint && !feedback && (
          showHint ? (
            <p className="formula">{question.formulaHint}</p>
          ) : (
            <button type="button" className="hint-link" onClick={() => setShowHint(true)}>
              Need a tiny formula?
            </button>
          )
        )}
        {question.type === "sim" && (
          <Simulator
            key={question.id}
            initialReturnPeriod={question.sim?.returnPeriod}
            initialYears={question.sim?.defaultYears}
          />
        )}
        {question.type === "calc" && !feedback && (
          <div className="chip-board">
            {question.chips?.map((chip) => (
              <button
                key={chip.value}
                type="button"
                className="chip"
                onClick={() => submit(chip.value)}
              >
                {chip.label}
              </button>
            ))}
            {!showType ? (
              <button type="button" className="hint-link" onClick={() => setShowType(true)}>
                I’d rather type a number
              </button>
            ) : (
              <form
                className="calc-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  submit(draft);
                }}
              >
                <label className="field">
                  <span>Your number</span>
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    inputMode="decimal"
                    placeholder={question.placeholder}
                    autoComplete="off"
                    required
                  />
                </label>
                <button type="submit" className="btn btn-primary">Check</button>
              </form>
            )}
          </div>
        )}
        {(question.type === "mcq" || question.type === "sim") && question.choices && !feedback && (
          <div className="choices" role="list">
            {question.choices.map((choice, choiceIndex) => (
              <button
                key={choice.id}
                type="button"
                className="choice"
                onClick={() => submit(choice.id)}
              >
                <kbd>{choiceIndex + 1}</kbd>
                {choice.label}
              </button>
            ))}
          </div>
        )}
        {question.type === "graph" && question.graphs && !feedback && (
          <div className="graphs">
            {question.graphs.map((option) => (
              <Charts
                key={option.id}
                option={option}
                name={question.id}
                selected={draft === option.id}
                onSelect={() => setDraft(option.id)}
              />
            ))}
            <button
              type="button"
              className="btn btn-primary"
              disabled={!draft}
              onClick={() => submit(draft)}
            >
              That’s the picture
            </button>
          </div>
        )}
        <div className="live" tabIndex={-1} ref={live} aria-live="polite">
          {graded && (
            <div className={`feedback feedback-${graded.kind}`}>
              <p>
                <strong>
                  {graded.kind === "correct"
                    ? "Nimbus learned something."
                    : graded.kind === "partial"
                      ? "Almost — half a biscuit."
                      : "Common mix-up. That’s the lesson."}
                </strong>{" "}
                +{graded.grade.points} pts
              </p>
              <p>{graded.explanation}</p>
              {graded.kind !== "correct" && <p className="miscon">{graded.misconception}</p>}
              <button type="button" className="btn btn-primary" onClick={nextQuestion}>
                {index + 1 >= quiz.questions.length ? "Collect your stamps" : "Next watch"}
              </button>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}

function Lab({ onPlay }: { onPlay: () => void }) {
  return (
    <section className="panel glow">
      <h1>Weather dice</h1>
      <p>
        Slide how rare the storm is. Pick a stretch of years. Hit reroll. The chance never changes —
        only the story does. That’s the whole game.
      </p>
      <Simulator />
      <button type="button" className="btn btn-primary" onClick={onPlay}>
        Clock in for a scored watch
      </button>
    </section>
  );
}

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

function Summary({
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

function Board({ classCode, difficulty }: { classCode: string; difficulty: Difficulty }) {
  const [filterCode, setFilterCode] = useState(classCode);
  const [filterDiff, setFilterDiff] = useState<string>(difficulty);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState("");

  async function load(event?: FormEvent) {
    event?.preventDefault();
    setError("");
    try {
      const data = await fetchLeaderboard(filterCode, filterDiff);
      setEntries(data.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Board unavailable.");
      setEntries([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="panel glow">
      <h1>Harbour honour board</h1>
      <p>Nicknames and anonymous storm IDs only. Filter by class code for a tutorial heat.</p>
      <form className="inline-form" onSubmit={load}>
        <label className="field">
          <span>Class code</span>
          <input value={filterCode} onChange={(event) => setFilterCode(event.target.value)} placeholder="All watches" />
        </label>
        <label className="field">
          <span>Watch</span>
          <select value={filterDiff} onChange={(event) => setFilterDiff(event.target.value)}>
            <option value="">All</option>
            <option value="practice">Morning</option>
            <option value="challenge">Typhoon</option>
          </select>
        </label>
        <button type="submit" className="btn btn-secondary">Refresh</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {entries.length === 0 && !error && <p className="muted">Empty pier. Be the first observer.</p>}
      {entries.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Observer</th>
                <th scope="col">Watch</th>
                <th scope="col">Score</th>
                <th scope="col">Caught</th>
                <th scope="col">Streak</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={`${entry.rank}-${entry.nickname}-${entry.createdAt}`}>
                  <td>{entry.rank}</td>
                  <td>{entry.nickname}{entry.anonymous ? " · anon" : ""}</td>
                  <td>{entry.difficulty === "challenge" ? "Typhoon" : "Morning"}</td>
                  <td>{entry.score}</td>
                  <td>{entry.correct}/{entry.questionCount}</td>
                  <td>{entry.bestStreak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
