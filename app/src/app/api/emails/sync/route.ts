import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fetchNewEmails, sendGmailReply } from '@/lib/gmail';
import { analyzeEmail } from '@/lib/email-analysis';
import type { Client, FAQ } from '@/lib/types';

function isGmailAuthError(error: unknown): boolean {
  const errStr = String(error);
  const msg = (error as { message?: string })?.message || '';
  const code = String((error as { code?: unknown })?.code || '');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const respData = (error as any)?.response?.data;
  const dataError = typeof respData === 'object' ? respData?.error : '';
  return (
    msg.includes('invalid_grant') ||
    msg.includes('invalid_client') ||
    msg.includes('Token has been expired') ||
    msg.includes('Token has been revoked') ||
    msg.includes('No refresh token') ||
    errStr.includes('invalid_grant') ||
    dataError === 'invalid_grant' ||
    code === '401' ||
    (code === '400' && (msg.includes('invalid') || msg.includes('token')))
  );
}

// POST /api/emails/sync — sync emails from Gmail with AI + FAQ matching + auto-send
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  console.log('[sync] Starting sync for client:', session.sub);

  // Get client's Gmail credentials and AI settings
  const client = await queryOne<Client>(
    'SELECT gmail_connected, gmail_refresh_token, ai_processing_enabled, auto_reply_enabled FROM clients WHERE id = $1',
    [session.sub]
  );

  if (!client?.gmail_connected || !client.gmail_refresh_token) {
    console.log('[sync] Gmail not connected for client:', session.sub);
    return NextResponse.json(
      { success: false, error: 'Gmail nie je pripojený' },
      { status: 400 }
    );
  }

  // Fetch emails from Gmail (separate try-catch for auth errors)
  let gmailEmails;
  try {
    console.log('[sync] Fetching emails from Gmail...');
    gmailEmails = await fetchNewEmails(client.gmail_refresh_token, 30);
    console.log('[sync] Fetched', gmailEmails.length, 'emails from Gmail');
  } catch (error) {
    console.error('[sync] Gmail fetch error:', error);
    if (isGmailAuthError(error)) {
      await query(
        'UPDATE clients SET gmail_connected = false, gmail_refresh_token = NULL WHERE id = $1',
        [session.sub]
      );
      return NextResponse.json(
        { success: false, error: 'Gmail token vypršal. Pripojte Gmail znova v nastaveniach.', code: 'GMAIL_TOKEN_EXPIRED' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa načítať emaily z Gmailu' },
      { status: 502 }
    );
  }

  try {
    // Load FAQs with auto_send enabled
    const autoFaqs = await query<FAQ>(
      `SELECT * FROM faqs WHERE client_id = $1 AND auto_send = true`,
      [session.sub]
    );
    const autoFaqMap = new Map(autoFaqs.map(f => [f.id, f]));

    // Get existing gmail_ids to avoid duplicates
    const existingRows = await query<{ gmail_id: string }>(
      'SELECT gmail_id FROM emails WHERE client_id = $1 AND gmail_id IS NOT NULL',
      [session.sub]
    );
    const existingIds = new Set(existingRows.map(r => r.gmail_id));

    // Get deleted gmail_ids to skip previously deleted emails
    const deletedRows = await query<{ gmail_id: string }>(
      'SELECT gmail_id FROM deleted_gmail_ids WHERE client_id = $1',
      [session.sub]
    );
    for (const r of deletedRows) existingIds.add(r.gmail_id);

    // Filter out already-synced and deleted emails
    const newEmails = gmailEmails.filter(e => !existingIds.has(e.gmail_id));
    console.log('[sync] New emails to process:', newEmails.length, '(existing:', existingRows.length, ', deleted:', deletedRows.length, ')');

    // Check if AI processing is enabled for this client
    // Respects both the client setting AND the ai_processing consent
    const aiEnabled = client.ai_processing_enabled !== false;
    let hasAiConsent = aiEnabled;
    if (aiEnabled) {
      const consentRow = await queryOne<{ granted: boolean }>(
        `SELECT granted FROM user_consents WHERE user_id = $1 AND consent_type = 'ai_processing'`,
        [session.sub]
      );
      hasAiConsent = consentRow?.granted === true;
    }
    const shouldRunAi = aiEnabled && hasAiConsent;

    console.log('[sync] AI processing:', shouldRunAi ? 'enabled' : 'disabled');

    let synced = 0;
    let faqMatched = 0;
    let autoSent = 0;
    for (const email of newEmails) {
      console.log('[sync] Processing email:', email.subject);

      // AI analysis + FAQ matching (only if enabled and consented)
      let summary_sk: string | null = null;
      let category = 'NORMAL';
      let faq_matched_id: string | null = null;
      let auto_reply_sk: string | null = null;

      if (shouldRunAi) {
        const analysis = await analyzeEmail(
          session.sub, email.subject, email.from_address, email.body
        );
        summary_sk = analysis.summary_sk;
        category = analysis.category;
        faq_matched_id = analysis.faq_matched_id;
        auto_reply_sk = analysis.auto_reply_sk;
      }

      // Check if matched FAQ has auto_send enabled AND client allows auto-replies
      const shouldAutoSend = client.auto_reply_enabled !== false && faq_matched_id && autoFaqMap.has(faq_matched_id) && auto_reply_sk;
      const replyStatus = shouldAutoSend ? 'auto_pending' : 'pending';

      const result = await query<{ id: string }>(
        `INSERT INTO emails (client_id, gmail_id, gmail_thread_id, from_address, subject, body, html_body, summary_sk, category, faq_matched_id, auto_reply_sk, reply_status, received_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (client_id, gmail_id) WHERE gmail_id IS NOT NULL DO NOTHING
         RETURNING id`,
        [session.sub, email.gmail_id, email.gmail_thread_id, email.from_address, email.subject, email.body, email.html_body, summary_sk, category, faq_matched_id, auto_reply_sk, replyStatus, email.received_at]
      );

      // Auto-send if FAQ has auto_send enabled
      if (shouldAutoSend && result[0]) {
        try {
          await sendGmailReply(
            client.gmail_refresh_token,
            email.from_address,
            email.subject,
            auto_reply_sk!,
            email.gmail_id,
            email.gmail_thread_id
          );
          await query(
            `UPDATE emails SET reply_status = 'auto_sent', reply_sent_at = NOW() WHERE id = $1`,
            [result[0].id]
          );
          await query(
            `INSERT INTO email_logs (client_id, type, subject) VALUES ($1, 'AUTO_REPLY', $2)`,
            [session.sub, `Re: ${email.subject}`]
          );
          await query(
            `UPDATE faqs SET usage_count = usage_count + 1 WHERE id = $1`,
            [faq_matched_id]
          );
          autoSent++;
        } catch (sendErr) {
          console.error('Auto-send failed:', sendErr);
          await query(
            `UPDATE emails SET reply_status = 'pending' WHERE id = $1`,
            [result[0].id]
          );
        }
      }

      synced++;
      if (faq_matched_id) faqMatched++;
    }

    console.log('[sync] Done. synced:', synced, 'faqMatched:', faqMatched, 'autoSent:', autoSent);
    return NextResponse.json({
      success: true,
      data: {
        synced,
        faq_matched: faqMatched,
        auto_sent: autoSent,
        total: gmailEmails.length,
        already_exists: gmailEmails.length - newEmails.length,
      },
    });
  } catch (error) {
    console.error('[sync] Email sync processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri spracovaní emailov' },
      { status: 500 }
    );
  }
}
