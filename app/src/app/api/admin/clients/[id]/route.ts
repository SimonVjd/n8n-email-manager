import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Neautorizovaný prístup' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const client = await queryOne<{
      id: string;
      name: string;
      email: string;
      gmail_connected: boolean;
      gmail_email: string | null;
      active: boolean;
      created_at: string;
    }>(
      `SELECT id, name, email, gmail_connected, gmail_email, active, created_at
       FROM clients WHERE id = $1 AND role = 'client'`,
      [id]
    );

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Klient nenájdený' },
        { status: 404 }
      );
    }

    const [emailStats, categories, faqCount] = await Promise.all([
      queryOne<{ total: string; today: string; faq_matched: string }>(
        `SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE received_at >= CURRENT_DATE) as today,
                COUNT(*) FILTER (WHERE faq_matched_id IS NOT NULL) as faq_matched
         FROM emails WHERE client_id = $1`,
        [id]
      ),
      query<{ category: string; count: string }>(
        `SELECT category, COUNT(*) as count FROM emails
         WHERE client_id = $1 GROUP BY category ORDER BY count DESC`,
        [id]
      ),
      queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM faqs WHERE client_id = $1',
        [id]
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...client,
        email_total: Number(emailStats?.total ?? 0),
        email_today: Number(emailStats?.today ?? 0),
        faq_matched: Number(emailStats?.faq_matched ?? 0),
        faq_count: Number(faqCount?.count ?? 0),
        categories: categories.map((c) => ({ category: c.category, count: Number(c.count) })),
      },
    });
  } catch (error) {
    console.error('Admin client detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba servera' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Neautorizovaný prístup' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { active, name, email } = body;

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (typeof active === 'boolean') {
      fields.push(`active = $${idx++}`);
      values.push(active);
    }
    if (typeof name === 'string' && name.trim()) {
      fields.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (typeof email === 'string' && email.trim()) {
      fields.push(`email = $${idx++}`);
      values.push(email.trim());
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Žiadne zmeny' },
        { status: 400 }
      );
    }

    values.push(id);
    const updated = await queryOne<{ id: string; name: string; email: string; active: boolean }>(
      `UPDATE clients SET ${fields.join(', ')} WHERE id = $${idx} AND role = 'client'
       RETURNING id, name, email, active`,
      values
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Klient nenájdený' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Admin client update error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba servera' },
      { status: 500 }
    );
  }
}
