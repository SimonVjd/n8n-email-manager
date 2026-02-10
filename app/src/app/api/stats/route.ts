import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/stats — inline stats for dashboard
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  try {
    // Today's stats
    const today = await queryOne<{
      new_count: string;
      urgent_count: string;
      waiting_count: string;
    }>(`
      SELECT
        COUNT(*) FILTER (WHERE received_at >= CURRENT_DATE) AS new_count,
        COUNT(*) FILTER (WHERE category = 'URGENT' AND reply_status = 'pending') AS urgent_count,
        COUNT(*) FILTER (WHERE reply_status IN ('pending', 'auto_pending') AND category != 'SPAM') AS waiting_count
      FROM emails WHERE client_id = $1
    `, [session.sub]);

    // Average response time (only for replied emails, last 30 days)
    const avgTime = await queryOne<{ avg_minutes: string | null }>(`
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (reply_sent_at - received_at)) / 60)) AS avg_minutes
      FROM emails
      WHERE client_id = $1
        AND reply_sent_at IS NOT NULL
        AND received_at >= NOW() - INTERVAL '30 days'
    `, [session.sub]);

    // Follow-ups: emails sent by user (reply_status = sent/edited_sent) where no response came within 3 days
    const followUps = await query<{
      id: string;
      from_address: string;
      subject: string;
      reply_sent_at: string;
      days_waiting: string;
    }>(`
      SELECT e.id, e.from_address, e.subject, e.reply_sent_at,
        EXTRACT(DAY FROM NOW() - e.reply_sent_at)::int AS days_waiting
      FROM emails e
      WHERE e.client_id = $1
        AND e.reply_status IN ('sent', 'edited_sent')
        AND e.reply_sent_at IS NOT NULL
        AND e.reply_sent_at < NOW() - INTERVAL '3 days'
        AND NOT EXISTS (
          SELECT 1 FROM emails e2
          WHERE e2.client_id = $1
            AND e2.gmail_thread_id = e.gmail_thread_id
            AND e2.gmail_thread_id IS NOT NULL
            AND e2.received_at > e.reply_sent_at
        )
      ORDER BY e.reply_sent_at ASC
      LIMIT 10
    `, [session.sub]);

    const avgMinutes = avgTime?.avg_minutes ? parseInt(avgTime.avg_minutes) : null;
    let avgDisplay = '—';
    if (avgMinutes !== null) {
      if (avgMinutes < 60) avgDisplay = `${avgMinutes}min`;
      else if (avgMinutes < 1440) avgDisplay = `${Math.round(avgMinutes / 60)}h`;
      else avgDisplay = `${Math.round(avgMinutes / 1440)}d`;
    }

    return NextResponse.json({
      success: true,
      data: {
        new_today: parseInt(today?.new_count || '0'),
        urgent_pending: parseInt(today?.urgent_count || '0'),
        waiting_reply: parseInt(today?.waiting_count || '0'),
        avg_response_time: avgDisplay,
        avg_response_minutes: avgMinutes,
        follow_ups: followUps,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    return NextResponse.json({ success: false, error: 'Chyba' }, { status: 500 });
  }
}
