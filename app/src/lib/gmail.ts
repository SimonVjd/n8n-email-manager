/**
 * Gmail API Integration
 *
 * Google API Services User Data Policy — Limited Use Disclosure:
 * This app's use of Google user data (Gmail messages) is limited to:
 *   1. Reading inbox messages for display and AI-powered categorization/summarization
 *   2. Sending reply emails on behalf of the user (only with explicit user action or FAQ auto-reply consent)
 * Data is stored in a secured database and is never shared with third parties.
 * Users can revoke access at any time via Settings or Google Account permissions.
 * AI processing (OpenAI) of email content requires separate explicit consent (ai_processing consent type).
 */
import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];

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

export interface ParsedEmail {
  gmail_id: string;
  gmail_thread_id: string;
  from_address: string;
  subject: string;
  body: string;
  html_body: string | null;
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

function extractHtmlBody(payload: Record<string, unknown>): string | null {
  // Direct text/html body
  if (payload.mimeType === 'text/html' && payload.body && (payload.body as Record<string, unknown>).data) {
    return decodeBase64Url((payload.body as Record<string, unknown>).data as string);
  }

  // Multipart — look for text/html
  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    // Nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractHtmlBody(part);
        if (nested) return nested;
      }
    }
  }

  return null;
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
    const payload = full.data.payload as Record<string, unknown>;
    const body = extractBody(payload);
    const htmlBody = extractHtmlBody(payload);

    emails.push({
      gmail_id: msg.id!,
      gmail_thread_id: full.data.threadId || msg.id!,
      from_address: from,
      subject: subject || '(bez predmetu)',
      body: body.substring(0, 5000),
      html_body: htmlBody ? htmlBody.substring(0, 100000) : null,
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

export async function sendGmailReply(
  refreshToken: string,
  to: string,
  subject: string,
  body: string,
  inReplyToMessageId: string,
  threadId: string
): Promise<string> {
  const gmail = getGmailClient(refreshToken);
  const profile = await gmail.users.getProfile({ userId: 'me' });
  const fromEmail = profile.data.emailAddress!;

  // Fetch the original message's RFC-822 Message-ID header for proper threading
  let rfc822MessageId = '';
  try {
    const original = await gmail.users.messages.get({
      userId: 'me',
      id: inReplyToMessageId,
      format: 'metadata',
      metadataHeaders: ['Message-ID'],
    });
    const headers = (original.data.payload?.headers || []) as { name: string; value: string }[];
    const mid = headers.find(h => h.name.toLowerCase() === 'message-id');
    if (mid?.value) {
      rfc822MessageId = mid.value;
    }
  } catch {
    // If we can't fetch the original, proceed without In-Reply-To
  }

  const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;

  const messageLines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${replySubject}`,
  ];

  if (rfc822MessageId) {
    messageLines.push(`In-Reply-To: ${rfc822MessageId}`);
    messageLines.push(`References: ${rfc822MessageId}`);
  }

  messageLines.push('Content-Type: text/plain; charset=UTF-8');
  messageLines.push('');
  messageLines.push(body);

  const rawMessage = messageLines.join('\r\n');

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId,
      },
    });
    return res.data.id || '';
  } catch (err: unknown) {
    // If thread not found (404), retry without threadId — sends as new email
    const code = (err as { code?: number })?.code;
    if (code === 404) {
      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage },
      });
      return res.data.id || '';
    }
    throw err;
  }
}
