-- N8N-BUILDER Email Manager Database Schema

-- Clients (tenants)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'client',
  gmail_connected BOOLEAN DEFAULT false,
  gmail_refresh_token TEXT,
  gmail_email VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emails
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  gmail_id VARCHAR(255),
  from_address VARCHAR(255),
  subject TEXT,
  body TEXT,
  html_body TEXT,
  summary_sk TEXT,
  category VARCHAR(50) DEFAULT 'NORMAL',
  faq_matched_id UUID,
  auto_reply_sk TEXT,
  reply_status VARCHAR(20) DEFAULT 'pending',
  reply_sent_at TIMESTAMPTZ,
  reply_edited_text TEXT,
  gmail_thread_id VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQs
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  question_pattern TEXT NOT NULL,
  response_template_sk TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  auto_send BOOLEAN DEFAULT false,
  times_edited INTEGER DEFAULT 0,
  times_rejected INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reply patterns (learned from client behavior)
CREATE TABLE reply_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  email_pattern TEXT NOT NULL,
  reply_template TEXT NOT NULL,
  auto_send BOOLEAN DEFAULT false,
  confidence_score FLOAT DEFAULT 0.5,
  times_used INTEGER DEFAULT 0,
  times_edited INTEGER DEFAULT 0,
  times_rejected INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email logs
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  subject TEXT,
  n8n_execution_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin metrics (cached)
CREATE TABLE admin_metrics (
  client_id UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  emails_in INTEGER DEFAULT 0,
  emails_out INTEGER DEFAULT 0,
  api_cost DECIMAL(10,4) DEFAULT 0,
  workflow_runs INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reply templates (reusable response snippets)
CREATE TABLE reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track deleted gmail_ids to prevent re-sync
CREATE TABLE IF NOT EXISTS deleted_gmail_ids (
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  gmail_id TEXT NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (client_id, gmail_id)
);

-- Full-text search on emails
ALTER TABLE emails ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Search vector auto-update trigger
CREATE OR REPLACE FUNCTION emails_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.subject, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.from_address, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.summary_sk, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.body, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emails_search_vector_trigger ON emails;
CREATE TRIGGER emails_search_vector_trigger
BEFORE INSERT OR UPDATE ON emails
FOR EACH ROW EXECUTE FUNCTION emails_search_vector_update();

-- Indexes
CREATE INDEX idx_emails_client ON emails(client_id, received_at DESC);
CREATE INDEX idx_emails_category ON emails(client_id, category);
CREATE UNIQUE INDEX idx_emails_gmail_unique ON emails(client_id, gmail_id) WHERE gmail_id IS NOT NULL;
CREATE INDEX idx_faqs_client ON faqs(client_id);
CREATE INDEX idx_reply_patterns_client ON reply_patterns(client_id);
CREATE INDEX idx_logs_client ON email_logs(client_id, created_at DESC);
CREATE INDEX idx_reply_templates_client ON reply_templates(client_id);
CREATE INDEX idx_emails_search ON emails USING GIN(search_vector);

-- Insert default admin user (password: admin123 — change in production)
-- Hash generated with bcrypt, 10 rounds
INSERT INTO clients (name, email, password_hash, role) VALUES (
  'Admin',
  'admin@emailmanager.local',
  '$2b$10$TFxs2.12wBny9GFEEebQGepT3G8uMYr1tifyOKIhZt12C.9loWXy6',
  'admin'
);
