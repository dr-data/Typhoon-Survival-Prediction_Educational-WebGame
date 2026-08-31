import { useState, type FormEvent } from "react";
import { sanitiseNickname } from "../../shared/nicknames";
import type { Player } from "../player";

export function Setup({
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
