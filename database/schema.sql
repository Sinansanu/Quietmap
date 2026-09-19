-- QuietMap PostgreSQL 16 Relational Schema DDL
-- Generated for client-server modernization

CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_locations_name ON locations (name);

CREATE TABLE IF NOT EXISTS focus_sessions (
    id VARCHAR(36) PRIMARY KEY,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NULL,
    location_id VARCHAR(36) NULL REFERENCES locations(id) ON DELETE SET NULL,
    activity VARCHAR(64) NULL,
    focus_score INTEGER NULL CHECK ((focus_score IS NULL) OR (focus_score >= 0 AND focus_score <= 100)),
    average_noise DOUBLE PRECISION NULL,
    stability_score DOUBLE PRECISION NULL,
    interruption_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_focus_sessions_started_at ON focus_sessions (started_at);
CREATE INDEX IF NOT EXISTS ix_focus_sessions_ended_at ON focus_sessions (ended_at);
CREATE INDEX IF NOT EXISTS ix_focus_sessions_location_id ON focus_sessions (location_id);

CREATE TABLE IF NOT EXISTS noise_samples (
    id VARCHAR(36) PRIMARY KEY,
    recorded_at TIMESTAMPTZ NOT NULL,
    noise_level DOUBLE PRECISION NOT NULL CHECK (noise_level >= 0.0 AND noise_level <= 100.0),
    location_id VARCHAR(36) NULL REFERENCES locations(id) ON DELETE SET NULL,
    focus_session_id VARCHAR(36) NULL REFERENCES focus_sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_noise_samples_recorded_at ON noise_samples (recorded_at);
CREATE INDEX IF NOT EXISTS ix_noise_samples_location_id ON noise_samples (location_id);
CREATE INDEX IF NOT EXISTS ix_noise_samples_focus_session_id ON noise_samples (focus_session_id);
CREATE INDEX IF NOT EXISTS ix_noise_samples_location_time ON noise_samples (location_id, recorded_at);
CREATE INDEX IF NOT EXISTS ix_noise_samples_session_time ON noise_samples (focus_session_id, recorded_at);

CREATE TABLE IF NOT EXISTS interruptions (
    id VARCHAR(36) PRIMARY KEY,
    focus_session_id VARCHAR(36) NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    duration_seconds DOUBLE PRECISION NOT NULL,
    intensity DOUBLE PRECISION NOT NULL,
    peak_level DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_interruptions_focus_session_id ON interruptions (focus_session_id);
CREATE INDEX IF NOT EXISTS ix_interruptions_started_at ON interruptions (started_at);

CREATE TABLE IF NOT EXISTS daily_statistics (
    date DATE PRIMARY KEY,
    average_noise DOUBLE PRECISION NULL,
    quietest_hour INTEGER NULL,
    quietest_period_label VARCHAR(32) NULL,
    interruption_count INTEGER NOT NULL DEFAULT 0,
    average_focus_score DOUBLE PRECISION NULL,
    total_focus_minutes DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    sample_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(64) PRIMARY KEY,
    value VARCHAR(256) NOT NULL
);
