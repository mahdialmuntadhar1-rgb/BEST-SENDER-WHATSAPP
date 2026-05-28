-- Businesses table for the discovery feed
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  governorate TEXT NOT NULL,
  description TEXT,
  rating REAL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Cursor-pagination indexes (keyset pagination)
CREATE INDEX IF NOT EXISTS idx_businesses_created_at_id 
  ON businesses(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_businesses_type_created 
  ON businesses(business_type, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_businesses_governorate 
  ON businesses(governorate);

CREATE INDEX IF NOT EXISTS idx_businesses_rating 
  ON businesses(rating DESC);

-- Full-text search helper index
CREATE INDEX IF NOT EXISTS idx_businesses_name 
  ON businesses(name);
