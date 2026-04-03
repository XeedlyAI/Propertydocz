-- Add signature_font_style column to tenants
-- Stores the selected cursive font for typed electronic signatures
-- Valid values: 'dancing_script', 'great_vibes', 'pacifico'
-- Default: 'dancing_script'

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS signature_font_style text DEFAULT 'dancing_script';
