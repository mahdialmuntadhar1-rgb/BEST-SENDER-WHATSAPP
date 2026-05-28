-- Users table for Shaku Maku (billboard3dnakedeye-mor) custom auth
CREATE TABLE IF NOT EXISTS shaku_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    photo_url TEXT,
    role TEXT DEFAULT 'user',
    onboarded INTEGER DEFAULT 0,
    business_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shaku_users_email ON shaku_users(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
