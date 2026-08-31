import { useEffect, useState, type FormEvent } from "react";
import type { Difficulty } from "../../shared/scoring";
import { fetchLeaderboard, type LeaderboardEntry } from "../lib/api";

export function Board({ classCode, difficulty }: { classCode: string; difficulty: Difficulty }) {
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
