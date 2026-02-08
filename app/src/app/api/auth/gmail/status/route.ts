import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { queryOne } from '@/lib/db';

// GET /api/auth/gmail/status — get Gmail connection status
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  const row = await queryOne<{ gmail_connected: boolean; gmail_email: string | null }>(
    'SELECT gmail_connected, gmail_email FROM clients WHERE id = $1',
    [session.sub]
  );

  return NextResponse.json({
    success: true,
    data: {
      connected: row?.gmail_connected || false,
      email: row?.gmail_email || null,
    },
  });
}
