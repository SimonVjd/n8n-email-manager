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
  summary_sk TEXT,
  category VARCHAR(50) DEFAULT 'NORMAL',
  faq_matched_id UUID,
  auto_reply_sk TEXT,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Indexes
CREATE INDEX idx_emails_client ON emails(client_id, received_at DESC);
CREATE INDEX idx_emails_category ON emails(client_id, category);
CREATE INDEX idx_faqs_client ON faqs(client_id);
CREATE INDEX idx_logs_client ON email_logs(client_id, created_at DESC);

-- Insert default admin user (password: admin123 — change in production)
-- Hash generated with bcrypt, 10 rounds
INSERT INTO clients (name, email, password_hash, role) VALUES (
  'Admin',
  'admin@emailmanager.local',
  '$2b$10$TFxs2.12wBny9GFEEebQGepT3G8uMYr1tifyOKIhZt12C.9loWXy6',
  'admin'
);
