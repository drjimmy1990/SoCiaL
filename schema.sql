-- ####################################################################
-- # WhatsApp SaaS Platform - PostgreSQL Schema (v3.1 - VPS Compatible)
-- ####################################################################

-- NOTE: The 'uuid-ossp' extension is now expected to be enabled manually on the database.
-- Run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' as a superuser once.

-- ========= Users Table =========
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    instance_limit INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========= API Services Table =========
CREATE TABLE api_services (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true
);

-- ========= Tools Table =========
CREATE TABLE tools (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    service_id INTEGER NOT NULL REFERENCES api_services(id),
    is_enabled BOOLEAN NOT NULL DEFAULT true
);

-- ========= User Tool Permissions Table =========
CREATE TABLE user_tool_permissions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tool_id)
);

-- ========= Instances Table =========
CREATE TABLE instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_name TEXT NOT NULL,
    system_name TEXT UNIQUE NOT NULL,
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

-- ========= Campaigns Table =========
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
CREATE TABLE campaign_recipients (
    id BIGSERIAL PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    log_message TEXT,
    sent_at TIMESTAMPTZ
);

-- ========= API Logs Table =========
CREATE TABLE api_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    instance_id UUID REFERENCES instances(id) ON DELETE SET NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    endpoint TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for frequently queried columns for better performance
CREATE INDEX IF NOT EXISTS idx_instances_owner_id ON instances(owner_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_instance_id ON api_logs(instance_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_owner_id ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);