-- =============================================
-- PropertyDocz — Phase E: Sync Log Column Additions
-- =============================================
-- Adds columns to document_sync_log for:
-- 1. deleted_at — track files removed from Dropbox
-- 2. file_modified_at — Dropbox's modification timestamp for change detection
--
-- Run manually: DO NOT auto-execute.
-- =============================================

-- Add deleted_at to track files removed from Dropbox
-- (data in association_field_values is preserved even if source file is removed)
ALTER TABLE document_sync_log
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Add file_modified_at to store Dropbox's server_modified timestamp
-- Used for accurate change detection instead of relying on file_hash
ALTER TABLE document_sync_log
ADD COLUMN IF NOT EXISTS file_modified_at timestamptz;

-- Index for efficient sync queries
CREATE INDEX IF NOT EXISTS idx_sync_log_association_deleted
ON document_sync_log (association_id, deleted_at)
WHERE deleted_at IS NULL;
