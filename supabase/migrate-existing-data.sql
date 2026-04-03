-- ============================================================
-- PropertyDocz — Phase A: Migrate Existing Association Data
-- Run in Supabase SQL Editor AFTER seed-field-definitions.sql
--
-- Migrates existing association column data and seed live_data
-- into the new association_field_values table.
-- Sets all migrated values as verified/manual.
-- ============================================================

DO $$
DECLARE
  v_assoc record;
  v_now timestamptz := now();
BEGIN

-- Loop through all existing associations and populate field values
FOR v_assoc IN
  SELECT
    a.id,
    a.name,
    a.legal_name,
    a.address,
    a.city,
    a.state,
    a.zip,
    a.manager_name,
    a.manager_email,
    a.manager_phone,
    a.total_units,
    a.year_built,
    a.hoa_ein,
    a.monthly_assessment_amount,
    a.assessment_frequency,
    a.annual_budget_amount,
    a.reserve_balance,
    a.percent_funded,
    a.reserve_study_date,
    a.transfer_fee,
    a.capital_contribution_fee,
    a.master_policy_carrier,
    a.master_policy_number,
    a.master_policy_expiration,
    a.general_liability_coverage,
    a.general_liability_amount,
    a.fidelity_bond,
    a.fidelity_amount,
    a.flood_zone,
    a.flood_insurance_in_force,
    a.flood_coverage_amount,
    a.rental_policy,
    a.short_term_rental_policy,
    a.pet_policy,
    a.parking_policy,
    a.age_restrictions,
    a.right_of_first_refusal,
    a.in_litigation,
    a.litigation_details,
    a.payable_to,
    a.remit_address,
    a.wire_instructions,
    a.current_special_assessment,
    a.current_sa_amount,
    a.current_sa_terms,
    a.owner_occupied_pct,
    a.investor_owned_pct,
    a.phases_completed,
    a.phases_planned,
    a.developer_units_remaining,
    a.construction_status
  FROM associations a
LOOP
  RAISE NOTICE 'Migrating data for association: % (%)', v_assoc.name, v_assoc.id;

  -- Helper: insert only if value is not null/empty
  -- Using ON CONFLICT to handle re-runs gracefully

  -- === general_info section ===

  INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
  VALUES (v_assoc.id, 'association_name', v_assoc.name, 'verified', 'manual', v_now)
  ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;

  IF v_assoc.legal_name IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'association_legal_name', v_assoc.legal_name, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
  VALUES (v_assoc.id, 'association_address', v_assoc.address, 'verified', 'manual', v_now)
  ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;

  INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
  VALUES (v_assoc.id, 'association_city', v_assoc.city, 'verified', 'manual', v_now)
  ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;

  INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
  VALUES (v_assoc.id, 'association_state', v_assoc.state, 'verified', 'manual', v_now)
  ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;

  INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
  VALUES (v_assoc.id, 'association_zip', v_assoc.zip, 'verified', 'manual', v_now)
  ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;

  IF v_assoc.total_units IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'total_units', v_assoc.total_units::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.year_built IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'year_built', v_assoc.year_built::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.hoa_ein IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'association_ein', v_assoc.hoa_ein, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  -- === management section ===

  IF v_assoc.manager_name IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'manager_name', v_assoc.manager_name, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.manager_email IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'manager_email', v_assoc.manager_email, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.manager_phone IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'manager_phone', v_assoc.manager_phone, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  -- === financials section ===

  IF v_assoc.monthly_assessment_amount IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'monthly_assessment', '$' || (v_assoc.monthly_assessment_amount / 100.0)::numeric(10,2)::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.assessment_frequency IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'assessment_frequency', v_assoc.assessment_frequency::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.annual_budget_amount IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'annual_budget', '$' || (v_assoc.annual_budget_amount / 100.0)::numeric(12,2)::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.reserve_balance IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'reserve_balance', '$' || (v_assoc.reserve_balance / 100.0)::numeric(12,2)::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.percent_funded IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'percent_funded', v_assoc.percent_funded::text || '%', 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.reserve_study_date IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'reserve_study_date', v_assoc.reserve_study_date, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.transfer_fee IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'transfer_fee', '$' || (v_assoc.transfer_fee / 100.0)::numeric(10,2)::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.capital_contribution_fee IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'capital_contribution', '$' || (v_assoc.capital_contribution_fee / 100.0)::numeric(10,2)::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  -- Special assessments
  INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
  VALUES (v_assoc.id, 'special_assessments_planned', CASE WHEN v_assoc.current_special_assessment THEN 'Yes' ELSE 'No' END, 'verified', 'manual', v_now)
  ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;

  IF v_assoc.current_sa_terms IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'special_assessment_details', v_assoc.current_sa_terms, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  -- === insurance section ===

  IF v_assoc.master_policy_carrier IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'master_policy_carrier', v_assoc.master_policy_carrier, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.master_policy_expiration IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'master_policy_expiration', v_assoc.master_policy_expiration, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.general_liability_coverage AND v_assoc.general_liability_amount IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'general_liability', '$' || (v_assoc.general_liability_amount / 100.0)::numeric(12,2)::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.fidelity_bond AND v_assoc.fidelity_amount IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'fidelity_bond', '$' || (v_assoc.fidelity_amount / 100.0)::numeric(12,2)::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.flood_zone IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'flood_zone', v_assoc.flood_zone, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.flood_insurance_in_force AND v_assoc.flood_coverage_amount IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'flood_insurance', '$' || (v_assoc.flood_coverage_amount / 100.0)::numeric(12,2)::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  ELSIF NOT v_assoc.flood_insurance_in_force THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'flood_insurance', 'N/A', 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  -- === restrictions section ===

  IF v_assoc.rental_policy IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'rental_policy', v_assoc.rental_policy, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.short_term_rental_policy IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'short_term_rental_policy', v_assoc.short_term_rental_policy, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.pet_policy IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'pet_policy', v_assoc.pet_policy, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.parking_policy IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'parking_policy', v_assoc.parking_policy, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.age_restrictions IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'age_restrictions', v_assoc.age_restrictions, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.right_of_first_refusal IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'right_of_first_refusal', v_assoc.right_of_first_refusal, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  -- === legal section ===

  INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
  VALUES (v_assoc.id, 'in_litigation', CASE WHEN v_assoc.in_litigation THEN 'Yes' ELSE 'No' END, 'verified', 'manual', v_now)
  ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;

  IF v_assoc.litigation_details IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'litigation_details', v_assoc.litigation_details, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  -- === payment section ===

  IF v_assoc.payable_to IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'check_payable_to', v_assoc.payable_to, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.remit_address IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'payment_mail_address_line1', v_assoc.remit_address, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  -- === ownership section (derived from percentages) ===

  IF v_assoc.owner_occupied_pct IS NOT NULL AND v_assoc.total_units IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'percent_owner_occupied', v_assoc.owner_occupied_pct::text || '%', 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;

    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'owner_occupied_units', round(v_assoc.owner_occupied_pct / 100.0 * v_assoc.total_units)::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.investor_owned_pct IS NOT NULL AND v_assoc.total_units IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'investor_owned_units', round(v_assoc.investor_owned_pct / 100.0 * v_assoc.total_units)::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  -- === project section ===

  IF v_assoc.phases_completed IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'phases_complete', v_assoc.phases_completed::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  IF v_assoc.phases_planned IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'additional_phases_planned',
      CASE WHEN v_assoc.phases_planned > v_assoc.phases_completed THEN 'Yes' ELSE 'No' END,
      'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
  VALUES (v_assoc.id, 'project_complete',
    CASE WHEN v_assoc.construction_status = 'Complete' THEN 'Yes' ELSE 'No' END,
    'verified', 'manual', v_now)
  ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;

  IF v_assoc.construction_status = 'Complete' THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'percent_complete', '100%', 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
  VALUES (v_assoc.id, 'developer_in_control',
    CASE WHEN coalesce(v_assoc.developer_units_remaining, 0) > 0 THEN 'Yes' ELSE 'No' END,
    'verified', 'manual', v_now)
  ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;

  IF v_assoc.developer_units_remaining IS NOT NULL THEN
    INSERT INTO association_field_values (association_id, field_key, value, confidence, source, last_verified_at)
    VALUES (v_assoc.id, 'developer_held_units', v_assoc.developer_units_remaining::text, 'verified', 'manual', v_now)
    ON CONFLICT (association_id, field_key) DO UPDATE SET value = EXCLUDED.value, updated_at = v_now;
  END IF;

  -- Mark association onboarding as complete
  UPDATE associations SET onboarding_status = 'complete' WHERE id = v_assoc.id;

  RAISE NOTICE 'Migrated data for: %', v_assoc.name;

END LOOP;

RAISE NOTICE 'Migration complete!';

END $$;
