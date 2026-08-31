import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { gradeRun } from "../../shared/questions/grade";
import { TYPE_LABELS, type Quiz, type StudentAnswer } from "../../shared/questions/types";
import { Charts } from "../components/Charts";
import { Simulator } from "../components/Simulator";

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

export function Play({ quiz, onFinish }: { quiz: Quiz; onFinish: (answers: StudentAnswer[]) => void }) {
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
