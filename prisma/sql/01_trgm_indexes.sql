-- ============================================================================
-- Full-text search acceleration using pg_trgm
-- ----------------------------------------------------------------------------
-- This file is NOT a Prisma migration. It contains raw SQL that should be
-- applied manually (via psql or the Supabase SQL editor) on environments where
-- the operator wants fast ILIKE / contains search on the list endpoints.
--
-- Indexes added here are *additive* and safe to re-run (IF NOT EXISTS).
-- Run with:
--   psql "$DATABASE_URL" -f prisma/sql/01_trgm_indexes.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Properties: title / reference / address (used by /api/properties search)
CREATE INDEX IF NOT EXISTS properties_title_trgm_idx
  ON properties USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS properties_reference_trgm_idx
  ON properties USING gin (reference gin_trgm_ops);
CREATE INDEX IF NOT EXISTS properties_address_trgm_idx
  ON properties USING gin (address gin_trgm_ops);

-- Contacts: first name / last name / email / company
CREATE INDEX IF NOT EXISTS contacts_firstname_trgm_idx
  ON contacts USING gin ("firstName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS contacts_lastname_trgm_idx
  ON contacts USING gin ("lastName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS contacts_email_trgm_idx
  ON contacts USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS contacts_company_trgm_idx
  ON contacts USING gin (company gin_trgm_ops);

-- Deals: title / reference
CREATE INDEX IF NOT EXISTS deals_title_trgm_idx
  ON deals USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS deals_reference_trgm_idx
  ON deals USING gin (reference gin_trgm_ops);
