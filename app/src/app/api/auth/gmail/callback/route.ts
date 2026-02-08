import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode, getGmailProfile } from '@/lib/gmail';
import { query } from '@/lib/db';

// GET /api/auth/gmail/callback — Google redirects here after consent
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state'); // client_id
  const error = req.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/dashboard/settings?gmail=error&reason=' + error, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard/settings?gmail=error&reason=missing_params', req.url));
  }

  try {
    const tokens = await getTokensFromCode(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL('/dashboard/settings?gmail=error&reason=no_refresh_token', req.url));
    }

    // Get the Gmail email address
    const gmailEmail = await getGmailProfile(tokens.refresh_token);

    // Store tokens and update gmail_connected
    await query(
      `UPDATE clients
       SET gmail_connected = true, gmail_refresh_token = $1, gmail_email = $2
       WHERE id = $3`,
      [tokens.refresh_token, gmailEmail, state]
    );

    return NextResponse.redirect(new URL('/dashboard/settings?gmail=connected', req.url));
  } catch (err) {
    console.error('Gmail OAuth callback error:', err);
    return NextResponse.redirect(new URL('/dashboard/settings?gmail=error&reason=token_exchange', req.url));
  }
}
