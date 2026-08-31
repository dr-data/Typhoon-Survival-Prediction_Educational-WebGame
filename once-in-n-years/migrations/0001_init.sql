-- Return-period game: nicknames and scores only. No email, no real names.

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  anonymous INTEGER NOT NULL DEFAULT 0,
  class_code TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('practice', 'challenge')),
  seed INTEGER NOT NULL,
  score INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  best_streak INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_runs_score ON runs (score DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_runs_class ON runs (class_code, score DESC);
CREATE INDEX IF NOT EXISTS idx_runs_difficulty ON runs (difficulty, score DESC);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT,
  kind TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_kind ON events (kind, created_at);
