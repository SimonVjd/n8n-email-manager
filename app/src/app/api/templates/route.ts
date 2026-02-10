import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { ReplyTemplate } from '@/lib/types';

// GET /api/templates — list templates for logged-in client
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  const templates = await query<ReplyTemplate>(
    'SELECT * FROM reply_templates WHERE client_id = $1 ORDER BY usage_count DESC, created_at DESC',
    [session.sub]
  );

  return NextResponse.json({ success: true, data: templates });
}

// POST /api/templates — create new template
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  try {
    const { name, body } = await req.json();

    if (!name?.trim() || !body?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Názov a text šablóny sú povinné' },
        { status: 400 }
      );
    }

    const template = await queryOne<ReplyTemplate>(
      'INSERT INTO reply_templates (client_id, name, body) VALUES ($1, $2, $3) RETURNING *',
      [session.sub, name.trim(), body.trim()]
    );

    return NextResponse.json({ success: true, data: template });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Chyba pri vytváraní šablóny' },
      { status: 500 }
    );
  }
}

// PUT /api/templates — update template
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  try {
    const { id, name, body } = await req.json();

    if (!id || !name?.trim() || !body?.trim()) {
      return NextResponse.json(
        { success: false, error: 'ID, názov a text sú povinné' },
        { status: 400 }
      );
    }

    const template = await queryOne<ReplyTemplate>(
      'UPDATE reply_templates SET name = $1, body = $2 WHERE id = $3 AND client_id = $4 RETURNING *',
      [name.trim(), body.trim(), id, session.sub]
    );

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Šablóna nenájdená' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: template });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Chyba pri aktualizácii šablóny' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates — delete template
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID šablóny je povinné' },
        { status: 400 }
      );
    }

    const result = await queryOne(
      'DELETE FROM reply_templates WHERE id = $1 AND client_id = $2 RETURNING id',
      [id, session.sub]
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Šablóna nenájdená' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Chyba pri mazaní šablóny' },
      { status: 500 }
    );
  }
}

// PATCH /api/templates — increment usage count
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    await queryOne(
      'UPDATE reply_templates SET usage_count = usage_count + 1 WHERE id = $1 AND client_id = $2',
      [id, session.sub]
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Chyba' },
      { status: 500 }
    );
  }
}
