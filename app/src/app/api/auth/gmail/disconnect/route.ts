import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { getOAuth2Client } from '@/lib/gmail';
import type { Client } from '@/lib/types';

// POST /api/auth/gmail/disconnect — revoke Gmail access
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  try {
    const client = await queryOne<Client>(
      'SELECT gmail_refresh_token FROM clients WHERE id = $1',
      [session.sub]
    );

    // Try to revoke the token with Google
    if (client?.gmail_refresh_token) {
      try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({ refresh_token: client.gmail_refresh_token });
        await oauth2Client.revokeToken(client.gmail_refresh_token);
      } catch {
        // Token may already be revoked — continue anyway
      }
    }

    // Clear Gmail data from DB
    await query(
      `UPDATE clients
       SET gmail_connected = false, gmail_refresh_token = NULL, gmail_email = NULL
       WHERE id = $1`,
      [session.sub]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Gmail disconnect error:', err);
    return NextResponse.json({ success: false, error: 'Chyba pri odpájaní Gmail' }, { status: 500 });
  }
}
