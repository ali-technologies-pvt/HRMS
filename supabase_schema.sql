-- ==============================================================================
-- quickslogx HRMS - Supabase Cloud Database Schema & Policies
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Select your project -> Click on "SQL Editor" in the left sidebar
-- 3. Click "+ New Query", paste this entire file, and click "RUN" (green button)
-- ==============================================================================

-- 1. Create HRMS Users Table (Stores Super Admin, Managers, and Employees)
CREATE TABLE IF NOT EXISTS public.hrms_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  department TEXT DEFAULT 'Operations',
  designation TEXT DEFAULT '',
  salary NUMERIC DEFAULT 5000,
  avatar_url TEXT,
  phone TEXT DEFAULT '',
  status TEXT DEFAULT 'offline',
  temp_password BOOLEAN DEFAULT false,
  must_change_password BOOLEAN DEFAULT false,
  joining_date TEXT DEFAULT '2026-10-01',
  leave_quota JSONB DEFAULT '{"medical": 12, "casual": 12, "annual": 24}'::jsonb,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Universal Synchronized Collections Table (Attendance, Tasks, Projects, Chat, Reports)
CREATE TABLE IF NOT EXISTS public.hrms_sync (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Configure Row Level Security (RLS) - Enable public read/write via Anon Key
ALTER TABLE public.hrms_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on hrms_users" ON public.hrms_users;
CREATE POLICY "Public access on hrms_users" ON public.hrms_users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.hrms_sync ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on hrms_sync" ON public.hrms_sync;
CREATE POLICY "Public access on hrms_sync" ON public.hrms_sync FOR ALL USING (true) WITH CHECK (true);

-- 4. Enable Realtime Publications (for live updates across devices without page reloads)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'hrms_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hrms_users;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'hrms_sync'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hrms_sync;
  END IF;
END $$;

-- 5. Insert Initial Super Admin if not already present
INSERT INTO public.hrms_users (
  id,
  email,
  name,
  password,
  role,
  department,
  designation,
  temp_password,
  must_change_password,
  status
)
VALUES (
  'usr-admin-1',
  'ali.raza@quickslogix.com',
  'ali raza',
  '#Imthepassword@123#',
  'super_admin',
  'Executive Administration',
  'Chief Technology & Ops Officer / Super Admin',
  false,
  false,
  'online'
)
ON CONFLICT (email) DO NOTHING;
