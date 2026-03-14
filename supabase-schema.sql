-- Oscar Pool Supabase Schema
-- All tables use camelCase column names (quoted identifiers)

-- ─── User Profiles ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "oscar_user_profiles" (
  "id" BIGSERIAL PRIMARY KEY,
  "userId" UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  "displayName" TEXT NOT NULL,
  "slogan" TEXT,
  "payoutMethod" TEXT,
  "hasPaid" BOOLEAN NOT NULL DEFAULT false,
  "isMonetary" BOOLEAN NOT NULL DEFAULT true,
  "profileComplete" BOOLEAN NOT NULL DEFAULT false,
  "role" TEXT NOT NULL DEFAULT 'user' CHECK ("role" IN ('user', 'admin')),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oscar_user_profiles_user_id ON "oscar_user_profiles" ("userId");

-- ─── Categories ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "oscar_categories" (
  "id" BIGSERIAL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_oscar_categories_sort ON "oscar_categories" ("sortOrder");

-- ─── Nominees ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "oscar_nominees" (
  "id" BIGSERIAL PRIMARY KEY,
  "categoryId" BIGINT NOT NULL REFERENCES "oscar_categories"(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "detail" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_oscar_nominees_category ON "oscar_nominees" ("categoryId");

-- ─── Ballots ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "oscar_ballots" (
  "id" BIGSERIAL PRIMARY KEY,
  "userId" UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "isLocked" BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_oscar_ballots_user_id ON "oscar_ballots" ("userId");

-- ─── Ballot Picks ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "oscar_ballot_picks" (
  "id" BIGSERIAL PRIMARY KEY,
  "ballotId" BIGINT NOT NULL REFERENCES "oscar_ballots"(id) ON DELETE CASCADE,
  "categoryId" BIGINT NOT NULL REFERENCES "oscar_categories"(id) ON DELETE CASCADE,
  "nomineeId" BIGINT NOT NULL REFERENCES "oscar_nominees"(id) ON DELETE CASCADE,
  UNIQUE ("ballotId", "categoryId")
);

CREATE INDEX IF NOT EXISTS idx_oscar_ballot_picks_ballot ON "oscar_ballot_picks" ("ballotId");

-- ─── Winners ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "oscar_winners" (
  "id" BIGSERIAL PRIMARY KEY,
  "categoryId" BIGINT NOT NULL UNIQUE REFERENCES "oscar_categories"(id) ON DELETE CASCADE,
  "nomineeId" BIGINT NOT NULL REFERENCES "oscar_nominees"(id) ON DELETE CASCADE,
  "announcedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Pool Settings ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "oscar_pool_settings" (
  "id" INTEGER PRIMARY KEY DEFAULT 1 CHECK ("id" = 1),
  "cutoffTime" TIMESTAMPTZ,
  "ceremonyStarted" BOOLEAN NOT NULL DEFAULT false,
  "showTitle" TEXT DEFAULT '98th Academy Awards',
  "cashappHandle" TEXT,
  "zellePhone" TEXT,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings row
INSERT INTO "oscar_pool_settings" ("id", "showTitle")
VALUES (1, '98th Academy Awards')
ON CONFLICT ("id") DO NOTHING;

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- Enable RLS on all tables (service role key bypasses RLS)

ALTER TABLE "oscar_user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oscar_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oscar_nominees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oscar_ballots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oscar_ballot_picks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oscar_winners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oscar_pool_settings" ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (these policies allow the server-side admin client to work)
-- Since we use supabaseAdmin (service role key), RLS is bypassed automatically.
-- Add read policies for authenticated users as needed:

CREATE POLICY "Users can read categories" ON "oscar_categories"
  FOR SELECT USING (true);

CREATE POLICY "Users can read nominees" ON "oscar_nominees"
  FOR SELECT USING (true);

CREATE POLICY "Users can read winners" ON "oscar_winners"
  FOR SELECT USING (true);

CREATE POLICY "Users can read pool settings" ON "oscar_pool_settings"
  FOR SELECT USING (true);

CREATE POLICY "Users can read own profile" ON "oscar_user_profiles"
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can read own ballot" ON "oscar_ballots"
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can read own picks" ON "oscar_ballot_picks"
  FOR SELECT USING (
    "ballotId" IN (SELECT "id" FROM "oscar_ballots" WHERE "userId" = auth.uid())
  );
