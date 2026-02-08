import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Neautorizovaný prístup' },
        { status: 401 }
      );
    }

    const [clientStats, emailTotal, emailToday, faqMatches, categories, recentEmails] =
      await Promise.all([
        queryOne<{ active_clients: string; total_clients: string }>(
          `SELECT COUNT(*) FILTER (WHERE active) as active_clients, COUNT(*) as total_clients
           FROM clients WHERE role = 'client'`
        ),
        queryOne<{ count: string }>('SELECT COUNT(*) as count FROM emails'),
        queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM emails WHERE received_at >= CURRENT_DATE`
        ),
        queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM emails WHERE faq_matched_id IS NOT NULL`
        ),
        query<{ category: string; count: string }>(
          `SELECT category, COUNT(*) as count FROM emails GROUP BY category ORDER BY count DESC`
        ),
        query<{
          id: string;
          from_address: string;
          subject: string;
          category: string;
          received_at: string;
          client_name: string;
        }>(
          `SELECT e.id, e.from_address, e.subject, e.category, e.received_at, c.name as client_name
           FROM emails e JOIN clients c ON e.client_id = c.id
           ORDER BY e.received_at DESC LIMIT 10`
        ),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        active_clients: Number(clientStats?.active_clients ?? 0),
        total_clients: Number(clientStats?.total_clients ?? 0),
        total_emails: Number(emailTotal?.count ?? 0),
        today_emails: Number(emailToday?.count ?? 0),
        faq_matches: Number(faqMatches?.count ?? 0),
        categories: categories.map((c) => ({ category: c.category, count: Number(c.count) })),
        recent_emails: recentEmails,
      },
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba servera' },
      { status: 500 }
    );
  }
}
