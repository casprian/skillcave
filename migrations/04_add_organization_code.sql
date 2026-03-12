-- Add organization_code column to organizations table
ALTER TABLE IF EXISTS organizations 
ADD COLUMN IF NOT EXISTS organization_code VARCHAR(10) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_code ON organizations(organization_code);

-- Log completion
-- Migration: Added organization_code column and index to organizations table
