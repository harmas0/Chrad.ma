-- =============================================
-- ADMIN DASHBOARD & KYC MIGRATION
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. EXTEND PROFILES TABLE
-- =============================================

-- Role column: 'user' (default), 'runner', 'admin'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- KYC fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_id_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_selfie_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_reviewer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;

-- Ban fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_by TEXT;

-- =============================================
-- 2. DISPUTES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL,
  reported_user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_reporter ON disputes(reporter_id);
CREATE INDEX IF NOT EXISTS idx_disputes_reported ON disputes(reported_user_id);

-- =============================================
-- 3. ADMIN AUDIT LOG TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);

-- =============================================
-- 4. ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on new tables
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- DISPUTES POLICIES --

-- Users can view disputes they are involved in
CREATE POLICY "Users can view own disputes"
ON disputes FOR SELECT
USING (
  auth.uid()::text = reporter_id OR
  auth.uid()::text = reported_user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
);

-- Users can create disputes (as reporter)
CREATE POLICY "Users can create disputes"
ON disputes FOR INSERT
WITH CHECK (auth.uid()::text = reporter_id);

-- Only admins can update disputes (resolve/dismiss)
CREATE POLICY "Admins can update disputes"
ON disputes FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin'));

-- AUDIT LOG POLICIES --

-- Only admins can view the audit log
CREATE POLICY "Admins can view audit log"
ON admin_audit_log FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin'));

-- Only admins can insert into audit log
CREATE POLICY "Admins can insert audit log"
ON admin_audit_log FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin'));

-- ADMIN PROFILE POLICIES --
-- Admins can update ANY profile (for bans, KYC review, role changes)
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
USING (
  auth.uid()::text = id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
);

-- Drop the old user-only update policy if it exists (it will conflict)
-- Note: Run this only if the old policy exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile.' AND tablename = 'profiles'
  ) THEN
    DROP POLICY "Users can update own profile." ON profiles;
  END IF;
END $$;

-- =============================================
-- 5. SUPABASE STORAGE BUCKET FOR KYC DOCUMENTS
-- =============================================

-- Create the bucket (run via Supabase Dashboard > Storage if this doesn't work in SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can upload to their own folder
CREATE POLICY "Users can upload own KYC docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own KYC docs
CREATE POLICY "Users can view own KYC docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
  )
);

-- Admins can view all KYC docs (for review)
CREATE POLICY "Admins can view all KYC docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
);
