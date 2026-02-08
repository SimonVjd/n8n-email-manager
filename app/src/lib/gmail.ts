import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(clientId: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: clientId,
  });
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export function getGmailClient(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

interface ParsedEmail {
  gmail_id: string;
  from_address: string;
  subject: string;
  body: string;
  received_at: string;
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function getHeader(headers: { name: string; value: string }[], name: string): string {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

function extractBody(payload: Record<string, unknown>): string {
  // Simple text/plain body
  if (payload.mimeType === 'text/plain' && payload.body && (payload.body as Record<string, unknown>).data) {
    return decodeBase64Url((payload.body as Record<string, unknown>).data as string);
  }

  // Multipart — look for text/plain first, then text/html
  if (payload.parts && Array.isArray(payload.parts)) {
    // Try text/plain first
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    // Fallback to text/html (strip tags)
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = decodeBase64Url(part.body.data);
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      }
    }
    // Nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
  }

  return '';
}

export async function fetchNewEmails(
  refreshToken: string,
  maxResults: number = 30
): Promise<ParsedEmail[]> {
  const gmail = getGmailClient(refreshToken);

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    labelIds: ['INBOX'],
  });

  const messages = listRes.data.messages || [];
  const emails: ParsedEmail[] = [];

  for (const msg of messages) {
    const full = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id!,
      format: 'full',
    });

    const headers = (full.data.payload?.headers || []) as { name: string; value: string }[];
    const from = getHeader(headers, 'From');
    const subject = getHeader(headers, 'Subject');
    const date = getHeader(headers, 'Date');
    const body = extractBody(full.data.payload as Record<string, unknown>);

    emails.push({
      gmail_id: msg.id!,
      from_address: from,
      subject: subject || '(bez predmetu)',
      body: body.substring(0, 5000), // Limit body size
      received_at: date ? new Date(date).toISOString() : new Date().toISOString(),
    });
  }

  return emails;
}

export async function getGmailProfile(refreshToken: string): Promise<string | null> {
  const gmail = getGmailClient(refreshToken);
  const profile = await gmail.users.getProfile({ userId: 'me' });
  return profile.data.emailAddress || null;
}
