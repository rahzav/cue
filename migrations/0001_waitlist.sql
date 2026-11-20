CREATE TABLE IF NOT EXISTS waitlist (
  google_sub TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  university TEXT NOT NULL,
  interest TEXT NOT NULL CHECK (interest IN ('browse', 'offer', 'both')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
