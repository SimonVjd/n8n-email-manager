import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import type { Client } from '@/lib/types';

// GET /api/gdpr/export — download all user data as JSON (GDPR Art. 20)
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neprihlásený' }, { status: 401 });
  }

  const client = await queryOne<Client>(
    'SELECT id, name, email, role, gmail_email, gmail_connected, ai_processing_enabled, auto_reply_enabled, created_at FROM clients WHERE id = $1',
    [session.sub]
  );

  if (!client) {
    return NextResponse.json({ success: false, error: 'Užívateľ neexistuje' }, { status: 404 });
  }

  // Collect all user data
  const emails = await query(
    'SELECT id, gmail_id, from_address, subject, body, summary_sk, category, faq_matched_id, auto_reply_sk, reply_status, received_at, created_at FROM emails WHERE client_id = $1 ORDER BY received_at DESC',
    [session.sub]
  );

  const faqs = await query(
    'SELECT id, question_pattern, response_template_sk, auto_send, usage_count, created_at FROM faqs WHERE client_id = $1',
    [session.sub]
  );

  const replyPatterns = await query(
    'SELECT id, email_pattern, reply_template, confidence_score, created_at FROM reply_patterns WHERE client_id = $1',
    [session.sub]
  );

  const replyTemplates = await query(
    'SELECT id, name, body, is_favorite, created_at FROM reply_templates WHERE client_id = $1',
    [session.sub]
  );

  const consents = await query(
    'SELECT id, consent_type, granted, granted_at, ip_address FROM user_consents WHERE user_id = $1',
    [session.sub]
  );

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: client.id,
      name: client.name,
      email: client.email,
      role: client.role,
      gmail_email: client.gmail_email,
      gmail_connected: client.gmail_connected,
      ai_processing_enabled: client.ai_processing_enabled,
      auto_reply_enabled: client.auto_reply_enabled,
      created_at: client.created_at,
    },
    emails,
    faqs,
    reply_patterns: replyPatterns,
    reply_templates: replyTemplates,
    consents,
  };

  // Log the export request
  await query(
    `INSERT INTO gdpr_requests (user_id, request_type, status, completed_at)
     VALUES ($1, 'data_export', 'completed', NOW())`,
    [session.sub]
  );

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="email-manager-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
