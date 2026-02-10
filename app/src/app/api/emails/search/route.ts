import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { Email } from '@/lib/types';

// GET /api/emails/search?q=term&category=URGENT&limit=20
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get('q')?.trim();
  const category = req.nextUrl.searchParams.get('category');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20'), 50);

  if (!q) {
    return NextResponse.json({ success: false, error: 'Parameter q je povinný' }, { status: 400 });
  }

  // Build search query — use plainto_tsquery for user-friendly input
  // Also do ILIKE fallback for partial matches the tsvector misses
  const conditions: string[] = ['e.client_id = $1'];
  const params: (string | number)[] = [session.sub];

  if (category && category !== 'ALL') {
    params.push(category);
    conditions.push(`e.category = $${params.length}`);
  }

  params.push(q);
  const qIdx = params.length;

  // Full-text search with rank + ILIKE fallback for partial word matches
  const sql = `
    SELECT e.*,
      ts_rank(e.search_vector, plainto_tsquery('simple', $${qIdx})) AS rank
    FROM emails e
    WHERE ${conditions.join(' AND ')}
      AND (
        e.search_vector @@ plainto_tsquery('simple', $${qIdx})
        OR e.subject ILIKE '%' || $${qIdx} || '%'
        OR e.from_address ILIKE '%' || $${qIdx} || '%'
        OR e.summary_sk ILIKE '%' || $${qIdx} || '%'
      )
    ORDER BY rank DESC, e.received_at DESC
    LIMIT $${qIdx + 1}
  `;
  params.push(limit);

  try {
    const results = await query<Email & { rank: number }>(sql, params);
    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json(
      { success: false, error: 'Chyba pri vyhľadávaní' },
      { status: 500 }
    );
  }
}
