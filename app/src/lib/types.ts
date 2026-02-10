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
  ai_processing_enabled: boolean;
  auto_reply_enabled: boolean;
  created_at: string;
}

export interface Email {
  id: string;
  client_id: string;
  gmail_id: string | null;
  from_address: string;
  subject: string;
  body: string;
  html_body: string | null;
  summary_sk: string | null;
  category: 'URGENT' | 'TIME_SENSITIVE' | 'FAQ' | 'NORMAL' | 'SPAM';
  faq_matched_id: string | null;
  auto_reply_sk: string | null;
  reply_status: 'pending' | 'sent' | 'edited_sent' | 'rejected' | 'auto_sent' | 'auto_pending';
  reply_sent_at: string | null;
  reply_edited_text: string | null;
  gmail_thread_id: string | null;
  is_read: boolean;
  received_at: string;
  thread_count?: number;
}

export interface FAQ {
  id: string;
  client_id: string;
  question_pattern: string;
  response_template_sk: string;
  usage_count: number;
  auto_send: boolean;
  times_edited: number;
  times_rejected: number;
  created_at: string;
}

export interface ReplyPattern {
  id: string;
  client_id: string;
  email_pattern: string;
  reply_template: string;
  auto_send: boolean;
  confidence_score: number;
  times_used: number;
  times_edited: number;
  times_rejected: number;
  created_at: string;
  updated_at: string;
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

// Reply templates
export interface ReplyTemplate {
  id: string;
  client_id: string;
  name: string;
  body: string;
  usage_count: number;
  created_at: string;
}

// Consent types
export type ConsentType = 'ai_processing' | 'email_access' | 'terms_accepted' | 'privacy_policy_accepted' | 'cookies_analytics' | 'cookies_marketing';

export interface UserConsent {
  id: number;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  granted_at: string;
  revoked_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  version: string;
}

export type GdprRequestType = 'export' | 'deletion' | 'access' | 'rectification';
export type GdprRequestStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface GdprRequest {
  id: number;
  user_id: string;
  request_type: GdprRequestType;
  status: GdprRequestStatus;
  requested_at: string;
  completed_at: string | null;
  notes: string | null;
}

// API response types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
