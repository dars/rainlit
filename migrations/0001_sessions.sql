CREATE TABLE IF NOT EXISTS sessions (
 id TEXT PRIMARY KEY, state TEXT NOT NULL, history TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0, calls INTEGER NOT NULL DEFAULT 0,
 pending TEXT, locked_at INTEGER, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS turns (
 session_id TEXT NOT NULL, turn_id TEXT NOT NULL, response TEXT NOT NULL,
 PRIMARY KEY(session_id,turn_id)
);
