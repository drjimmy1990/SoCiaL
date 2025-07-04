-- ####################################################################
-- # WhatsApp SaaS Platform - PostgreSQL Schema (v3 - Advanced Campaigns)
-- ####################################################################

-- Enable UUID extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========= Users Table =========
-- Stores user credentials, roles, and limits.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    instance_limit INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========= API Services Table =========
-- Stores the different API services we integrate with.
CREATE TABLE api_services (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL, -- e.g., 'Evolution API', 'Instagram API'
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true
);

-- ========= Tools Table =========
-- Stores the specific tools/features offered, linked to a service.
CREATE TABLE tools (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL, -- e.g., 'Group Member Scraper'
    description TEXT,
    service_id INTEGER NOT NULL REFERENCES api_services(id),
    is_enabled BOOLEAN NOT NULL DEFAULT true
);

-- ========= User Tool Permissions Table =========
-- A join table to define which users have access to which tools.
CREATE TABLE user_tool_permissions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tool_id)
);

-- ========= Instances Table =========
-- Stores data for each WhatsApp instance created by a user.
CREATE TABLE instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_name TEXT NOT NULL,
    system_name TEXT UNIQUE NOT NULL, -- The name used by the Evolution API
    phone_number TEXT,
    api_key TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'disconnected',
    webhook_url TEXT,
    service_id INTEGER NOT NULL REFERENCES api_services(id),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_jid TEXT,
    profile_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========= Campaigns Table (v2) =========
-- Stores high-level details for each messaging campaign with advanced features.
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    message_content JSONB NOT NULL,
    use_placeholders BOOLEAN NOT NULL DEFAULT false,
    delay_speed TEXT NOT NULL CHECK (delay_speed IN ('fast', 'medium', 'slow', 'safe')),
    delay_from_seconds INTEGER NOT NULL DEFAULT 5,
    delay_to_seconds INTEGER NOT NULL DEFAULT 10,
    sending_mode TEXT NOT NULL CHECK (sending_mode IN ('internal', 'n8n')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'stopped', 'failed')),
    instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========= Campaign Recipients Table =========
-- Stores the status for each individual recipient in a campaign.
CREATE TABLE campaign_recipients (
    id BIGSERIAL PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    log_message TEXT,
    sent_at TIMESTAMPTZ
);

-- ========= API Logs Table =========
-- A generic table for logging important events and errors.
CREATE TABLE api_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    instance_id UUID REFERENCES instances(id) ON DELETE SET NULL,
    level TEXT NOT NULL, -- e.g., 'INFO', 'ERROR'
    message TEXT NOT NULL,
    endpoint TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for frequently queried columns for better performance
CREATE INDEX idx_instances_owner_id ON instances(owner_id);
CREATE INDEX idx_logs_user_id ON api_logs(user_id);
CREATE INDEX idx_logs_instance_id ON api_logs(instance_id);
CREATE INDEX idx_campaigns_owner_id ON campaigns(owner_id);
CREATE INDEX idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);