import { useMemo, useState } from "react";
import { sanitiseNickname } from "../shared/nicknames";
import { buildQuiz } from "../shared/questions/generate";
import { gradeRun } from "../shared/questions/grade";
import type { StudentAnswer } from "../shared/questions/types";
import { HarbourScene, Nimbus } from "./components/Scene";
import { DEFAULT_PLAYER, type Player } from "./player";
import { Board } from "./views/Board";
import { Briefing } from "./views/Briefing";
import { Home } from "./views/Home";
import { Lab } from "./views/Lab";
import { Play } from "./views/Play";
import { Setup } from "./views/Setup";
import { Summary } from "./views/Summary";
import { submitRun } from "./lib/api";

type View = "home" | "setup" | "briefing" | "play" | "lab" | "summary" | "board";

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
