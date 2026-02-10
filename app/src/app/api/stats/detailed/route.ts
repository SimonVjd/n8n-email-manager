import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/stats/detailed?period=week|month|today
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  const period = req.nextUrl.searchParams.get('period') || 'week';
  const interval = period === 'today' ? '1 day' : period === 'month' ? '30 days' : '7 days';

  try {
    // Scorecards
    const scorecards = await queryOne<{
      received: string;
      replied: string;
      avg_minutes: string | null;
      reply_rate: string | null;
    }>(`
      SELECT
        COUNT(*) AS received,
        COUNT(*) FILTER (WHERE reply_status IN ('sent', 'edited_sent', 'auto_sent')) AS replied,
        ROUND(AVG(EXTRACT(EPOCH FROM (reply_sent_at - received_at)) / 60)
          FILTER (WHERE reply_sent_at IS NOT NULL)) AS avg_minutes,
        ROUND(
          COUNT(*) FILTER (WHERE reply_status IN ('sent', 'edited_sent', 'auto_sent'))::decimal /
          NULLIF(COUNT(*) FILTER (WHERE category != 'SPAM'), 0) * 100
        ) AS reply_rate
      FROM emails
      WHERE client_id = $1 AND received_at >= NOW() - $2::interval
    `, [session.sub, interval]);

    // Category breakdown
    const categories = await query<{ category: string; count: string }>(`
      SELECT category, COUNT(*)::int AS count
      FROM emails
      WHERE client_id = $1 AND received_at >= NOW() - $2::interval
      GROUP BY category ORDER BY count DESC
    `, [session.sub, interval]);

    // Top senders
    const topSenders = await query<{ from_address: string; count: string }>(`
      SELECT from_address, COUNT(*)::int AS count
      FROM emails
      WHERE client_id = $1 AND received_at >= NOW() - $2::interval
      GROUP BY from_address ORDER BY count DESC LIMIT 5
    `, [session.sub, interval]);

    // Daily trend (last 7 days)
    const dailyTrend = await query<{ day: string; count: string }>(`
      SELECT DATE(received_at) AS day, COUNT(*)::int AS count
      FROM emails
      WHERE client_id = $1 AND received_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(received_at) ORDER BY day ASC
    `, [session.sub]);

    // Auto-reply effectiveness
    const autoReply = await queryOne<{
      auto_sent: string;
      edited_sent: string;
      rejected: string;
    }>(`
      SELECT
        COUNT(*) FILTER (WHERE reply_status = 'auto_sent') AS auto_sent,
        COUNT(*) FILTER (WHERE reply_status = 'edited_sent') AS edited_sent,
        COUNT(*) FILTER (WHERE reply_status = 'rejected') AS rejected
      FROM emails
      WHERE client_id = $1 AND auto_reply_sk IS NOT NULL AND received_at >= NOW() - $2::interval
    `, [session.sub, interval]);

    const avgMin = scorecards?.avg_minutes ? parseInt(scorecards.avg_minutes) : null;
    let avgDisplay = '—';
    if (avgMin !== null) {
      if (avgMin < 60) avgDisplay = `${avgMin}min`;
      else if (avgMin < 1440) avgDisplay = `${Math.round(avgMin / 60)}h`;
      else avgDisplay = `${Math.round(avgMin / 1440)}d`;
    }

    return NextResponse.json({
      success: true,
      data: {
        scorecards: {
          received: parseInt(scorecards?.received || '0'),
          replied: parseInt(scorecards?.replied || '0'),
          avg_response_time: avgDisplay,
          reply_rate: scorecards?.reply_rate ? `${scorecards.reply_rate}%` : '—',
        },
        categories: categories.map(c => ({ category: c.category, count: parseInt(c.count) })),
        topSenders: topSenders.map(s => ({ from_address: s.from_address, count: parseInt(s.count) })),
        dailyTrend: dailyTrend.map(d => ({ day: d.day, count: parseInt(d.count) })),
        autoReply: {
          auto_sent: parseInt(autoReply?.auto_sent || '0'),
          edited_sent: parseInt(autoReply?.edited_sent || '0'),
          rejected: parseInt(autoReply?.rejected || '0'),
        },
      },
    });
  } catch (err) {
    console.error('Stats detailed error:', err);
    return NextResponse.json({ success: false, error: 'Chyba' }, { status: 500 });
  }
}
