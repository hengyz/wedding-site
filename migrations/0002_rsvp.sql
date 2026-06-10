CREATE TABLE IF NOT EXISTS rsvp_responses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  attendance TEXT NOT NULL,
  adult_count INTEGER DEFAULT 0,
  child_count INTEGER DEFAULT 0,
  arrival_time TEXT,
  departure_time TEXT,
  transport_type TEXT,
  pickup_location TEXT,
  remark TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rsvp_attendance ON rsvp_responses(attendance);
CREATE INDEX IF NOT EXISTS idx_rsvp_created_at ON rsvp_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_rsvp_ip_hash_created ON rsvp_responses(ip_hash, created_at);
