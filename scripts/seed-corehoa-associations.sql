-- Seed CoreHOA associations from Propertyolio communities list
-- Run in Supabase SQL Editor
-- Tenant: Core HOA (slug: corehoa, id: 5fa3ed62-9188-47f5-a469-4d097b94d823)

-- First, remove the test seed associations (Mountain View Condos, Sunset Ridge HOA)
DELETE FROM associations
WHERE tenant_id = '5fa3ed62-9188-47f5-a469-4d097b94d823'
  AND name IN ('Mountain View Condos', 'Sunset Ridge HOA');

-- Insert all 42 CoreHOA communities
INSERT INTO associations (tenant_id, name, legal_name, state, project_type, total_units, city)
VALUES
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', '1500 Main HOA', '1500 Main HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', '214 North Temple HOA', '214 North Temple HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', '27th Street Condominiums HOA', '27th Street Condominiums HOA', 'UT', 'condo', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Applegate Townhomes HOA', 'Applegate Townhomes HOA', 'UT', 'townhome', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Birkhill Condominiums HOA', 'Birkhill Condominiums HOA', 'UT', 'condo', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Capstone Condominiums HOA', 'Capstone Condominiums HOA', 'UT', 'condo', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Copper Hills HOA', 'Copper Hills HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Cornerstone Homeowners Association II', 'Cornerstone Homeowners Association II', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Cottonwood Canyon Estates', 'Cottonwood Canyon Estates', 'UT', 'pud', 72, 'Cottonwood Heights'),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Country View Lane HOA', 'Country View Lane HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Crescent Heights Condominiums HOA', 'Crescent Heights Condominiums HOA', 'UT', 'condo', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Daybreak Highland Park', 'Daybreak Highland Park', 'UT', 'pud', 134, 'South Jordan'),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Edgewater Condominiums HOA', 'Edgewater Condominiums HOA', 'UT', 'condo', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Fairway Estates Condominiums Assoc.', 'Fairway Estates Condominiums Assoc.', 'UT', 'condo', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Farmington Ranches HOA', 'Farmington Ranches HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Granite Ridge HOA', 'Granite Ridge HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Heritage Townhomes HOA', 'Heritage Townhomes HOA', 'UT', 'townhome', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Highland Springs HOA', 'Highland Springs HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Lakeside Village HOA', 'Lakeside Village HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Legacy Crossing Owners Assoc.', 'Legacy Crossing Owners Assoc.', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Mount Vernon Estates HOA', 'Mount Vernon Estates HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Old Farm at Parkway HOA', 'Old Farm at Parkway HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Parkwood HOA', 'Parkwood HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Peaks Townhomes Association', 'Peaks Townhomes Association', 'UT', 'townhome', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Pepperwood Townhomes', 'Pepperwood Townhomes', 'UT', 'townhome', 48, 'Sandy'),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Renaissance Condominium Owners Association', 'Renaissance Condominium Owners Association', 'UT', 'condo', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Rivendell Condominiums HOA', 'Rivendell Condominiums HOA', 'UT', 'condo', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Rosehaven Condominiums HOA', 'Rosehaven Condominiums HOA', 'UT', 'condo', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'San Francisco Condominiums HOA', 'San Francisco Condominiums HOA', 'UT', 'condo', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Sand Ridge Village HOA', 'Sand Ridge Village HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Shaughnessy Apartments Condominium', 'Shaughnessy Apartments Condominium', 'UT', 'condo', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Sunburst Meadows HOA', 'Sunburst Meadows HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'The Views at Eaglewood HOA', 'The Views at Eaglewood HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'The Villages On Draper Hills HOA', 'The Villages On Draper Hills HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Three Fountains East HOA', 'Three Fountains East HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Village 2 HOA', 'Village 2 HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Villages at Wolf Hollow Condominium HOA', 'Villages at Wolf Hollow Condominium HOA', 'UT', 'condo', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Wanderwood Cove HOA', 'Wanderwood Cove HOA', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Wildflower Village 2 Common Association', 'Wildflower Village 2 Common Association', 'UT', NULL, NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Wildflower Village 2 CONDO Association', 'Wildflower Village 2 CONDO Association', 'UT', 'condo', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Wildflower Village 2 Townhome Association', 'Wildflower Village 2 Townhome Association', 'UT', 'townhome', NULL, NULL),
  ('5fa3ed62-9188-47f5-a469-4d097b94d823', 'Wolf Lodge HOA', 'Wolf Lodge HOA', 'UT', 'condo', NULL, NULL);
