import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import type { ClientWithStats } from '@/lib/types';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Neautorizovaný prístup' },
        { status: 401 }
      );
    }

    const clients = await query<ClientWithStats>(
      `SELECT c.id, c.name, c.email, c.role, c.gmail_connected, c.gmail_email, c.active, c.created_at,
        (SELECT COUNT(*) FROM emails WHERE client_id = c.id)::int as email_count,
        (SELECT COUNT(*) FROM faqs WHERE client_id = c.id)::int as faq_count
       FROM clients c WHERE c.role = 'client'
       ORDER BY c.created_at DESC`
    );

    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    console.error('Admin clients error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba servera' },
      { status: 500 }
    );
  }
}
