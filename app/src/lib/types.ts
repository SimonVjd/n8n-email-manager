// Database row types

export interface Client {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'client' | 'admin';
  gmail_connected: boolean;
  gmail_refresh_token: string | null;
  gmail_email: string | null;
  active: boolean;
  created_at: string;
}

export interface Email {
  id: string;
  client_id: string;
  gmail_id: string | null;
  from_address: string;
  subject: string;
  body: string;
  summary_sk: string | null;
  category: 'URGENT' | 'TIME_SENSITIVE' | 'FAQ' | 'NORMAL' | 'SPAM';
  faq_matched_id: string | null;
  auto_reply_sk: string | null;
  is_read: boolean;
  received_at: string;
}

export interface FAQ {
  id: string;
  client_id: string;
  question_pattern: string;
  response_template_sk: string;
  usage_count: number;
  created_at: string;
}

export interface EmailLog {
  id: string;
  client_id: string;
  type: 'RECEIVED' | 'SENT' | 'AUTO_REPLY';
  subject: string | null;
  n8n_execution_id: string | null;
  created_at: string;
}

export interface AdminMetrics {
  client_id: string;
  emails_in: number;
  emails_out: number;
  api_cost: number;
  workflow_runs: number;
  updated_at: string;
}

// Auth types

export interface JWTPayload {
  sub: string;
  email: string;
  role: 'client' | 'admin';
  name: string;
}

// Admin dashboard types

export interface ClientWithStats {
  id: string;
  name: string;
  email: string;
  role: string;
  gmail_connected: boolean;
  gmail_email: string | null;
  active: boolean;
  created_at: string;
  email_count: number;
  faq_count: number;
}

export interface DashboardMetrics {
  active_clients: number;
  total_clients: number;
  total_emails: number;
  today_emails: number;
  faq_matches: number;
  categories: { category: string; count: number }[];
  recent_emails: (Email & { client_name: string })[];
}

// API response types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
