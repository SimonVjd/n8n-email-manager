import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

// PATCH /api/emails/[id] — mark email as read
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  const { id } = await params;

  await query(
    'UPDATE emails SET is_read = true WHERE id = $1 AND client_id = $2',
    [id, session.sub]
  );

  return NextResponse.json({ success: true });
}
