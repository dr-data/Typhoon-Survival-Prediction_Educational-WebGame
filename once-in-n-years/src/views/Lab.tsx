import { Simulator } from "../components/Simulator";

export function Lab({ onPlay }: { onPlay: () => void }) {
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
