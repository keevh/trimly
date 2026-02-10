CREATE TABLE IF NOT EXISTS links (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  destination_url TEXT NOT NULL,
  management_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_clicked_at TIMESTAMPTZ NULL,
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_ip_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS links_expires_at_idx ON links (expires_at);

CREATE TABLE IF NOT EXISTS click_events (
  id BIGSERIAL PRIMARY KEY,
  link_id BIGINT NOT NULL REFERENCES links (id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  referer TEXT NULL,
  device_type TEXT NOT NULL DEFAULT 'unknown',
  country_code TEXT NULL,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  visitor_ip_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS click_events_link_id_idx ON click_events (link_id);
CREATE INDEX IF NOT EXISTS click_events_clicked_at_idx ON click_events (clicked_at);
