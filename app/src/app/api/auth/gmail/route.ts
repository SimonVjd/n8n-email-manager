import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAuthUrl } from '@/lib/gmail';

// GET /api/auth/gmail — start OAuth flow, returns Google consent URL
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  const url = getAuthUrl(session.sub);
  return NextResponse.json({ success: true, url });
}
