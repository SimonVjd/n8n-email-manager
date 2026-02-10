import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { FAQ } from '@/lib/types';

// GET /api/faqs — list FAQs for logged-in client
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  const faqs = await query<FAQ>(
    'SELECT * FROM faqs WHERE client_id = $1 ORDER BY usage_count DESC, created_at DESC',
    [session.sub]
  );

  return NextResponse.json({ success: true, data: faqs });
}

// POST /api/faqs — create new FAQ
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  try {
    const { question_pattern, response_template_sk } = await req.json();

    if (!question_pattern || !response_template_sk) {
      return NextResponse.json(
        { success: false, error: 'Vzor otázky a šablóna odpovede sú povinné' },
        { status: 400 }
      );
    }

    const faq = await queryOne<FAQ>(
      `INSERT INTO faqs (client_id, question_pattern, response_template_sk)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [session.sub, question_pattern, response_template_sk]
    );

    return NextResponse.json({ success: true, data: faq });
  } catch (error) {
    console.error('FAQ create error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri vytváraní FAQ' },
      { status: 500 }
    );
  }
}

// PUT /api/faqs — update FAQ
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  try {
    const { id, question_pattern, response_template_sk, auto_send } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID je povinné' },
        { status: 400 }
      );
    }

    // Build dynamic update
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (typeof question_pattern === 'string') {
      updates.push(`question_pattern = $${idx++}`);
      values.push(question_pattern);
    }
    if (typeof response_template_sk === 'string') {
      updates.push(`response_template_sk = $${idx++}`);
      values.push(response_template_sk);
    }
    if (typeof auto_send === 'boolean') {
      updates.push(`auto_send = $${idx++}`);
      values.push(auto_send);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Žiadne zmeny' },
        { status: 400 }
      );
    }

    values.push(id, session.sub);
    const faq = await queryOne<FAQ>(
      `UPDATE faqs SET ${updates.join(', ')}
       WHERE id = $${idx++} AND client_id = $${idx}
       RETURNING *`,
      values
    );

    if (!faq) {
      return NextResponse.json({ success: false, error: 'FAQ nenájdené' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: faq });
  } catch (error) {
    console.error('FAQ update error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri aktualizácii FAQ' },
      { status: 500 }
    );
  }
}

// DELETE /api/faqs — delete FAQ
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID je povinné' }, { status: 400 });
    }

    const faq = await queryOne<FAQ>(
      'DELETE FROM faqs WHERE id = $1 AND client_id = $2 RETURNING *',
      [id, session.sub]
    );

    if (!faq) {
      return NextResponse.json({ success: false, error: 'FAQ nenájdené' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('FAQ delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri mazaní FAQ' },
      { status: 500 }
    );
  }
}
