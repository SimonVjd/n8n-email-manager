import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM emails
       WHERE client_id = $1
         AND is_read = false
         AND reply_status NOT IN ('sent', 'edited_sent', 'auto_sent')
         AND category != 'SPAM'`,
      [session.sub]
    );

    return NextResponse.json({
      success: true,
      data: { count: parseInt(result?.count || '0', 10) },
    });
  } catch (err) {
    console.error('Unread count error:', err);
    return NextResponse.json(
      { success: false, error: 'Chyba servera' },
      { status: 500 }
    );
  }
}
