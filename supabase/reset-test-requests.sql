-- ============================================================
-- Reset seeded document requests for re-testing generation
-- Run in Supabase SQL Editor
-- ============================================================

-- Step 1: Delete all generated documents for seeded requests
DELETE FROM generated_documents
WHERE document_request_id IN (
  SELECT id FROM document_requests
  WHERE status IN ('pending_review', 'approved', 'delivered')
    AND live_data IS NOT NULL
    AND live_data != '{}'::jsonb
);

-- Step 2: Reset those requests back to ready_for_generation
UPDATE document_requests
SET
  status = 'ready_for_generation',
  file_urls = '{}',
  reviewed_by = NULL,
  reviewed_at = NULL,
  approved_by = NULL,
  approved_at = NULL,
  delivered_at = NULL,
  ai_validation_notes = NULL
WHERE status IN ('pending_review', 'approved', 'delivered')
  AND live_data IS NOT NULL
  AND live_data != '{}'::jsonb;

-- Verify
SELECT id, requester_name, status, document_types
FROM document_requests
WHERE status = 'ready_for_generation'
ORDER BY created_at DESC;
