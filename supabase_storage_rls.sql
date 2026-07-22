-- ===============================================================
-- CHRAD.MA — SUPABASE STORAGE BUCKET RLS POLICIES
-- Enables strict bucket security on 'kyc-documents', 'task-photos',
-- and 'delivery-proofs'.
-- ===============================================================

-- 1. Create Storage Buckets if missing
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('kyc-documents', 'kyc-documents', false), -- Private bucket for sensitive CIN / Selfie docs
  ('task-photos', 'task-photos', true),      -- Public bucket for task item images
  ('delivery-proofs', 'delivery-proofs', true) -- Public bucket for runner delivery proof photos
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ===============================================================
-- BUCKET 1: KYC DOCUMENTS (STRICT PRIVATE ISOLATION)
-- ===============================================================

-- Users can upload documents into their own folder (auth.uid() = folder prefix)
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can select/read their own KYC documents
CREATE POLICY "Users can read their own KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
  )
);

-- Users can update/replace their own KYC documents
CREATE POLICY "Users can update their own KYC documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ===============================================================
-- BUCKET 2: TASK PHOTOS & DELIVERY PROOFS (PUBLIC READ, AUTH INSERT)
-- ===============================================================

-- Authenticated users can upload task photos and delivery proof photos
CREATE POLICY "Authenticated users can upload task photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('task-photos', 'delivery-proofs'));

-- Anyone can view task photos and delivery proofs
CREATE POLICY "Public read access for task and delivery photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('task-photos', 'delivery-proofs'));
