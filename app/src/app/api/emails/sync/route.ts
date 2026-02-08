import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fetchNewEmails } from '@/lib/gmail';
import { analyzeEmail } from '@/lib/email-analysis';
import type { Client } from '@/lib/types';

// POST /api/emails/sync — sync emails from Gmail with AI + FAQ matching
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  try {
    // Get client's Gmail credentials
    const client = await queryOne<Client>(
      'SELECT gmail_connected, gmail_refresh_token FROM clients WHERE id = $1',
      [session.sub]
    );

    if (!client?.gmail_connected || !client.gmail_refresh_token) {
      return NextResponse.json(
        { success: false, error: 'Gmail nie je pripojený' },
        { status: 400 }
      );
    }

    // Fetch emails from Gmail
    const gmailEmails = await fetchNewEmails(client.gmail_refresh_token, 30);

    // Get existing gmail_ids to avoid duplicates
    const existingRows = await query<{ gmail_id: string }>(
      'SELECT gmail_id FROM emails WHERE client_id = $1 AND gmail_id IS NOT NULL',
      [session.sub]
    );
    const existingIds = new Set(existingRows.map(r => r.gmail_id));

    // Filter out already-synced emails
    const newEmails = gmailEmails.filter(e => !existingIds.has(e.gmail_id));

    let synced = 0;
    let faqMatched = 0;
    for (const email of newEmails) {
      // AI analysis + FAQ matching
      const { summary_sk, category, faq_matched_id, auto_reply_sk } = await analyzeEmail(
        session.sub, email.subject, email.from_address, email.body
      );

      await query(
        `INSERT INTO emails (client_id, gmail_id, from_address, subject, body, summary_sk, category, faq_matched_id, auto_reply_sk, received_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [session.sub, email.gmail_id, email.from_address, email.subject, email.body, summary_sk, category, faq_matched_id, auto_reply_sk, email.received_at]
      );

      synced++;
      if (faq_matched_id) faqMatched++;
    }

    return NextResponse.json({
      success: true,
      data: {
        synced,
        faq_matched: faqMatched,
        total: gmailEmails.length,
        already_exists: gmailEmails.length - newEmails.length,
      },
    });
  } catch (error) {
    console.error('Email sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri synchronizácii emailov' },
      { status: 500 }
    );
  }
}
