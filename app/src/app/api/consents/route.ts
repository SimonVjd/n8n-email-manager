import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { UserConsent } from '@/lib/types';

// GET /api/consents — get all consents for current user
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neprihlásený' }, { status: 401 });
  }

  const consents = await query<UserConsent>(
    'SELECT id, consent_type, granted, granted_at FROM user_consents WHERE user_id = $1 ORDER BY granted_at DESC',
    [session.sub]
  );

  return NextResponse.json({ success: true, data: consents });
}

// POST /api/consents — grant a consent
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neprihlásený' }, { status: 401 });
  }

  const { consent_type } = await req.json();
  const validTypes = ['terms_accepted', 'privacy_acknowledged', 'ai_processing', 'gmail_data_access'];

  if (!consent_type || !validTypes.includes(consent_type)) {
    return NextResponse.json(
      { success: false, error: 'Neplatný typ súhlasu' },
      { status: 400 }
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';

  const consent = await queryOne<UserConsent>(
    `INSERT INTO user_consents (user_id, consent_type, granted, ip_address, user_agent)
     VALUES ($1, $2, true, $3, $4)
     ON CONFLICT (user_id, consent_type) DO UPDATE SET granted = true, granted_at = NOW(), ip_address = $3, user_agent = $4
     RETURNING id, consent_type, granted, granted_at`,
    [session.sub, consent_type, ip, ua]
  );

  return NextResponse.json({ success: true, data: consent });
}

// DELETE /api/consents — revoke a consent
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neprihlásený' }, { status: 401 });
  }

  const { consent_type } = await req.json();

  if (!consent_type) {
    return NextResponse.json(
      { success: false, error: 'Chýba consent_type' },
      { status: 400 }
    );
  }

  await query(
    'UPDATE user_consents SET granted = false WHERE user_id = $1 AND consent_type = $2',
    [session.sub, consent_type]
  );

  return NextResponse.json({ success: true });
}
