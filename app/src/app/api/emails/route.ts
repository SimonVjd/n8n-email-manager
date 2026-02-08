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

  const emails = await query<Email>(
    `SELECT * FROM emails WHERE client_id = $1 ORDER BY received_at DESC LIMIT 50`,
    [session.sub]
  );

  return NextResponse.json({ success: true, data: emails });
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
