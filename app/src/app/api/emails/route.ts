import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { analyzeEmail } from '@/lib/email-analysis';
import type { Email } from '@/lib/types';

// GET /api/emails — list emails for logged-in client
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  const emails = await query<Email & { thread_count: number }>(
    `SELECT e.*,
       CASE WHEN e.gmail_thread_id IS NOT NULL THEN
         (SELECT COUNT(*)::int FROM emails t WHERE t.gmail_thread_id = e.gmail_thread_id AND t.client_id = e.client_id)
       ELSE 1 END as thread_count
     FROM emails e
     WHERE e.client_id = $1
     ORDER BY e.received_at DESC LIMIT 100`,
    [session.sub]
  );

  return NextResponse.json({ success: true, data: emails });
}

// DELETE /api/emails — delete email(s)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Chýbajú ID emailov' }, { status: 400 });
    }

    const placeholders = ids.map((_: string, i: number) => `$${i + 2}`).join(',');

    // Save gmail_ids before deleting so sync won't re-import them
    const gmailRows = await query<{ gmail_id: string }>(
      `SELECT gmail_id FROM emails WHERE client_id = $1 AND id IN (${placeholders}) AND gmail_id IS NOT NULL`,
      [session.sub, ...ids]
    );
    if (gmailRows.length > 0) {
      const values = gmailRows.map((_, i) => `($1, $${i + 2})`).join(',');
      await query(
        `INSERT INTO deleted_gmail_ids (client_id, gmail_id) VALUES ${values} ON CONFLICT DO NOTHING`,
        [session.sub, ...gmailRows.map(r => r.gmail_id)]
      );
    }

    const result = await query(
      `DELETE FROM emails WHERE client_id = $1 AND id IN (${placeholders}) RETURNING id`,
      [session.sub, ...ids]
    );

    return NextResponse.json({ success: true, data: { deleted: result.length } });
  } catch (error) {
    console.error('Email delete error:', error);
    return NextResponse.json({ success: false, error: 'Chyba pri mazaní' }, { status: 500 });
  }
}

// POST /api/emails — add email with AI processing + FAQ matching
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  try {
    const { from_address, subject, body } = await req.json();

    if (!from_address || !subject || !body) {
      return NextResponse.json(
        { success: false, error: 'Odosielateľ, predmet a telo sú povinné' },
        { status: 400 }
      );
    }

    // AI analysis + FAQ matching
    const { summary_sk, category, faq_matched_id, auto_reply_sk } = await analyzeEmail(
      session.sub, subject, from_address, body
    );

    const email = await queryOne<Email>(
      `INSERT INTO emails (client_id, from_address, subject, body, summary_sk, category, faq_matched_id, auto_reply_sk)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [session.sub, from_address, subject, body, summary_sk, category, faq_matched_id, auto_reply_sk]
    );

    return NextResponse.json({ success: true, data: email });
  } catch (error) {
    console.error('Email create error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri vytváraní emailu' },
      { status: 500 }
    );
  }
}
