import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import type { ReplyPattern } from '@/lib/types';

// GET /api/reply-patterns — list client's reply patterns
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  const patterns = await query<ReplyPattern>(
    'SELECT * FROM reply_patterns WHERE client_id = $1 ORDER BY confidence_score DESC, times_used DESC',
    [session.sub]
  );

  return NextResponse.json({ success: true, data: patterns });
}

// PUT /api/reply-patterns — update pattern (toggle auto_send, edit template)
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  const { id, auto_send, reply_template } = await request.json();

  if (!id) {
    return NextResponse.json({ success: false, error: 'Chýba ID' }, { status: 400 });
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (typeof auto_send === 'boolean') {
    updates.push(`auto_send = $${idx++}`);
    values.push(auto_send);
  }
  if (typeof reply_template === 'string') {
    updates.push(`reply_template = $${idx++}`);
    values.push(reply_template);
  }

  if (updates.length === 0) {
    return NextResponse.json({ success: false, error: 'Žiadne zmeny' }, { status: 400 });
  }

  updates.push(`updated_at = NOW()`);
  values.push(id, session.sub);

  await query(
    `UPDATE reply_patterns SET ${updates.join(', ')} WHERE id = $${idx++} AND client_id = $${idx}`,
    values
  );

  return NextResponse.json({ success: true });
}

// DELETE /api/reply-patterns — delete pattern
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  const { id } = await request.json();
  await query(
    'DELETE FROM reply_patterns WHERE id = $1 AND client_id = $2',
    [id, session.sub]
  );

  return NextResponse.json({ success: true });
}
