import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { CLASSIC_100_IN_100, asPercent, roundTo } from "../shared/math";
import { sanitiseNickname } from "../shared/nicknames";
import { buildQuiz } from "../shared/questions/generate";
import { gradeRun } from "../shared/questions/grade";
import type { Quiz, StudentAnswer } from "../shared/questions/types";
import type { Difficulty } from "../shared/scoring";
import { Charts } from "./components/Charts";
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

  return (
    <div className="app">
      <Rain />
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="top">
        <button type="button" className="brand" onClick={() => setView("home")}>
          <span className="brand-mark" aria-hidden="true">N</span>
          Once in N Years
        </button>
        <nav className="nav" aria-label="Game">
          <button type="button" className={view === "lab" ? "is-active" : ""} onClick={() => setView("lab")}>
            Lab
          </button>
          <button type="button" className={view === "board" ? "is-active" : ""} onClick={() => setView("board")}>
            Leaderboard
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
          <Briefing
            difficulty={player.difficulty}
            onContinue={() => setView("play")}
          />
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
        {view === "lab" && (
          <Lab onPlay={() => setView("setup")} />
        )}
        {view === "summary" && report && (
          <Summary
            player={player}
            seed={seed}
            report={report}
            answers={answers}
            submitState={submitState}
            onSubmit={async () => {
              setSubmitState("Saving…");
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
                setSubmitState(`Saved ${nick.nickname} · ${report.totalPoints} pts`);
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
      <footer className="foot">
        Based on the Hong Kong Observatory’s explanation of return periods.
        A return period is a long-term average — not a guarantee.
        {" "}
        <a href="https://www.hko.gov.hk/en/education/climate/climate-change/00672-Return-Period-Once-in-N-Years.html">
          Source
        </a>
        . No email or real name is collected.
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
      <p className="eyebrow">Educational game · for non-science university courses</p>
      <h1>
        If a storm is “once in 100 years”,
        <em> are you safe for 99 years?</em>
      </h1>
      <p className="lede">
        No. A <strong>return period</strong> is a long-term statistical average.
        A 100-year event has about a 1% chance each year. It may happen twice in a decade,
        or not at all in a century. Play to see why.
      </p>
      <div className="hero-actions">
        <button type="button" className="btn btn-primary" onClick={onPlay}>
          Play the quiz
        </button>
        <button type="button" className="btn btn-secondary" onClick={onLab}>
          Open the simulation lab
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBoard}>
          Leaderboard
        </button>
      </div>
      <ul className="facts">
        <li>
          <strong>T = 1 / p</strong>
          <span>Return period is the reciprocal of annual probability.</span>
        </li>
        <li>
          <strong>{roundTo(asPercent(CLASSIC_100_IN_100, 1), 1)}%</strong>
          <span>Chance of at least one 100-year event in 100 years — not 100%.</span>
        </li>
        <li>
          <strong>Random clustering</strong>
          <span>Events can bunch together, then vanish for a long stretch.</span>
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
    <section className="panel">
      <h1>How do you want to play?</h1>
      <p>
        Practice is untimed-friendly with formula hints. Challenge adds multi-year probability,
        climate caveats, and a 1.5× score multiplier.
      </p>
      <form className="stack" onSubmit={handleSubmit}>
        <fieldset className="segmented">
          <legend>Difficulty</legend>
          {(["practice", "challenge"] as const).map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="difficulty"
                checked={player.difficulty === value}
                onChange={() => onChange({ ...player, difficulty: value })}
              />
              {value === "practice" ? "Practice" : "Challenge"}
            </label>
          ))}
        </fieldset>
        <label className="check">
          <input
            type="checkbox"
            checked={player.anonymous}
            onChange={(event) => onChange({ ...player, anonymous: event.target.checked })}
          />
          Use an anonymous ID (recommended — we never ask for your real name)
        </label>
        {!player.anonymous && (
          <label className="field">
            <span>Nickname</span>
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
          <span>Class or tutorial group code (optional)</span>
          <input
            value={player.classCode}
            onChange={(event) => onChange({ ...player, classCode: event.target.value })}
            maxLength={12}
            placeholder="e.g. GEOG101"
            autoComplete="off"
          />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary">Continue to the briefing</button>
      </form>
    </section>
  );
}

function Briefing({ difficulty, onContinue }: { difficulty: Difficulty; onContinue: () => void }) {
  return (
    <section className="panel">
      <h1>The one idea to keep</h1>
      <ol className="brief">
        <li>
          <strong>Name.</strong> “Once in N years” is a <em>return period</em> T. It is an average wait, not a calendar appointment.
        </li>
        <li>
          <strong>Formula.</strong> If p is the chance in any one year, then T = 1 / p. A 20-year event is 5% per year.
        </li>
        <li>
          <strong>Many years.</strong> The chance of at least one event in n years is 1 − (1 − 1/T)<sup>n</sup>. For T = 100 and n = 100 that is about 63%, not 100%.
        </li>
        <li>
          <strong>Caveats.</strong> Short records, statistical methods, geography, and climate change can all move the estimated T.
        </li>
      </ol>
      <p className="muted">
        {difficulty === "challenge"
          ? "Challenge mode expects the multi-year formula and the Observatory caveats."
          : "Practice mode shows the formula on calculation questions."}
      </p>
      <button type="button" className="btn btn-primary" onClick={onContinue}>
        Start the questions
      </button>
    </section>
  );
}

function Play({ quiz, onFinish }: { quiz: Quiz; onFinish: (answers: StudentAnswer[]) => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [draft, setDraft] = useState("");
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const question = quiz.questions[index];
  const key = quiz.keys[index];
  const feedback = answers[index];
  const live = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft("");
    setStartedAt(Date.now());
  }, [index]);

  if (!question || !key) return null;

  const graded = feedback
    ? gradeRun(quiz.seed, quiz.difficulty, answers.slice(0, index + 1)).items[index]
    : null;
  const hud = gradeRun(quiz.seed, quiz.difficulty, answers);

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
      <div className="hud" aria-live="polite">
        <span>Q {index + 1} / {quiz.questions.length}</span>
        <span>{hud.totalPoints} pts</span>
        <span>Streak {hud.bestStreak}</span>
      </div>
      <article className="question">
        <p className="eyebrow">{question.title}</p>
        <h1>{question.prompt}</h1>
        <p>{question.context}</p>
        {quiz.difficulty === "practice" && question.formulaHint && (
          <p className="formula" aria-label="Formula hint">
            {question.formulaHint}
          </p>
        )}
        {question.type === "sim" && (
          <Simulator
            key={question.id}
            initialReturnPeriod={question.sim?.returnPeriod}
            initialYears={question.sim?.defaultYears}
          />
        )}
        {question.type === "calc" && !feedback && (
          <form
            className="calc-form"
            onSubmit={(event) => {
              event.preventDefault();
              submit(draft);
            }}
          >
            <label className="field">
              <span>Your answer</span>
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
              Lock in this graph
            </button>
          </div>
        )}
        <div className="live" tabIndex={-1} ref={live} aria-live="polite">
          {graded && (
            <div className={`feedback feedback-${graded.kind}`}>
              <p>
                <strong>
                  {graded.kind === "correct"
                    ? "That’s the idea."
                    : graded.kind === "partial"
                      ? "Close — partial credit."
                      : "Not quite — and that misconception is common."}
                </strong>{" "}
                +{graded.grade.points} pts
              </p>
              <p>{graded.explanation}</p>
              {graded.kind !== "correct" && <p className="miscon">{graded.misconception}</p>}
              <button type="button" className="btn btn-primary" onClick={nextQuestion}>
                {index + 1 >= quiz.questions.length ? "See your summary" : "Next question"}
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
    <section className="panel">
      <h1>Simulation lab</h1>
      <p>
        Drag the return period, pick 10, 50, or 100 years, and run it again. The probability stays put.
        The history does not. That is what “once in N years” actually looks like.
      </p>
      <Simulator />
      <button type="button" className="btn btn-primary" onClick={onPlay}>
        Play a scored round
      </button>
    </section>
  );
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
  return (
    <section className="panel">
      <h1>Your learning summary</h1>
      <p className="scoreline">
        <strong>{report.totalPoints}</strong> points · {report.correct}/{report.items.length} correct
        · best streak {report.bestStreak}
      </p>
      <p>{report.summary}</p>
      <ul className="concepts">
        {report.concepts.map((concept) => (
          <li key={concept.concept}>
            <span>{concept.label}</span>
            <meter
              min={0}
              max={concept.attempted}
              value={concept.correct}
              aria-label={`${concept.correct} of ${concept.attempted} on ${concept.label}`}
            />
            <b>{concept.correct}/{concept.attempted}</b>
          </li>
        ))}
      </ul>
      {report.strengths.length > 0 && (
        <p><strong>Strengths:</strong> {report.strengths.join("; ")}.</p>
      )}
      {report.improve.length > 0 && (
        <p><strong>Revisit:</strong> {report.improve.join("; ")}.</p>
      )}
      <blockquote>
        Remember: T = 1/p is an average rate. Limited data, methods, geography, and climate change can all revise N.
      </blockquote>
      <div className="hero-actions">
        <button type="button" className="btn btn-primary" onClick={onSubmit}>
          Post {player.anonymous ? "an anonymous" : "my"} score
        </button>
        <button type="button" className="btn btn-secondary" onClick={onReplay}>
          New questions
        </button>
        <button type="button" className="btn btn-ghost" onClick={onLab}>
          Try the lab
        </button>
      </div>
      {submitState && <p className="muted" role="status">{submitState}</p>}
      <p className="fine">Seed {seed} · {answers.length} answers stored only as a score, not as personal data.</p>
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
      setError(err instanceof Error ? err.message : "Leaderboard unavailable.");
      setEntries([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="panel">
      <h1>Leaderboard</h1>
      <p>Scores are nicknames or anonymous IDs only. Filter by class code for a tutorial-group board.</p>
      <form className="inline-form" onSubmit={load}>
        <label className="field">
          <span>Class code</span>
          <input value={filterCode} onChange={(event) => setFilterCode(event.target.value)} placeholder="All classes" />
        </label>
        <label className="field">
          <span>Mode</span>
          <select value={filterDiff} onChange={(event) => setFilterDiff(event.target.value)}>
            <option value="">All</option>
            <option value="practice">Practice</option>
            <option value="challenge">Challenge</option>
          </select>
        </label>
        <button type="submit" className="btn btn-secondary">Refresh</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {entries.length === 0 && !error && <p className="muted">No scores yet. Be the first storm.</p>}
      {entries.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Player</th>
                <th scope="col">Mode</th>
                <th scope="col">Score</th>
                <th scope="col">Correct</th>
                <th scope="col">Streak</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={`${entry.rank}-${entry.nickname}-${entry.createdAt}`}>
                  <td>{entry.rank}</td>
                  <td>{entry.nickname}{entry.anonymous ? " · anon" : ""}</td>
                  <td>{entry.difficulty}</td>
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

function Rain() {
  return <div className="rain" aria-hidden="true" />;
}
