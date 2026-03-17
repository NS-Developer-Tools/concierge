-- NeighborServe Home Concierge - Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  services TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communication log table
CREATE TABLE IF NOT EXISTS communications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  communicated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_communications_client_id ON communications(client_id);
CREATE INDEX IF NOT EXISTS idx_communications_date ON communications(communicated_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on clients
DROP TRIGGER IF EXISTS clients_updated_at ON clients;
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Service completions: track when a recommended item has been discussed with a client
CREATE TABLE IF NOT EXISTS service_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,            -- matches MaintenanceItem.id or custom_services.id
  completed_month INTEGER NOT NULL,    -- 0-indexed month (0=Jan, 11=Dec)
  completed_year INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, service_id, completed_month, completed_year)
);

CREATE INDEX IF NOT EXISTS idx_service_completions_client ON service_completions(client_id);
CREATE INDEX IF NOT EXISTS idx_service_completions_period ON service_completions(completed_year, completed_month);

-- Custom services: client-specific maintenance items added by the service team
CREATE TABLE IF NOT EXISTS custom_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  season TEXT NOT NULL DEFAULT 'recurring',   -- spring, summer, fall, winter, recurring
  frequency TEXT,                              -- Monthly, Annually, etc.
  active_months INTEGER[] NOT NULL DEFAULT '{}',
  notify_months INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_services_client ON custom_services(client_id);

-- Enable Row Level Security (optional, disable for internal tool)
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
