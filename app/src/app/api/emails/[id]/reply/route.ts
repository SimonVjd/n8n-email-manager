import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { sendGmailReply } from '@/lib/gmail';
import type { Email, Client } from '@/lib/types';

// POST /api/emails/[id]/reply — send reply via Gmail
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  const { id } = await params;
  const { action, replyText: sentText, isEdited } = await request.json() as {
    action: 'send' | 'send_and_automate';
    replyText: string;
    isEdited: boolean;
  };

  try {
    // Get email
    const email = await queryOne<Email>(
      'SELECT * FROM emails WHERE id = $1 AND client_id = $2',
      [id, session.sub]
    );
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email nenájdený' }, { status: 404 });
    }

    // Get client's Gmail credentials
    const client = await queryOne<Client>(
      'SELECT gmail_connected, gmail_refresh_token FROM clients WHERE id = $1',
      [session.sub]
    );
    if (!client?.gmail_connected || !client.gmail_refresh_token) {
      return NextResponse.json({ success: false, error: 'Gmail nie je pripojený' }, { status: 400 });
    }

    // Use the text sent from the frontend (always the current textarea content)
    const replyText = sentText || email.auto_reply_sk;

    if (!replyText) {
      return NextResponse.json({ success: false, error: 'Žiadna odpoveď na odoslanie' }, { status: 400 });
    }

    // Send via Gmail
    let gmailMessageId: string | null = null;
    if (email.gmail_id) {
      try {
        gmailMessageId = await sendGmailReply(
          client.gmail_refresh_token,
          email.from_address,
          email.subject,
          replyText,
          email.gmail_id,
          email.gmail_thread_id || email.gmail_id
        );
      } catch (gmailError: unknown) {
        console.error('Gmail send error:', gmailError);
        const msg = gmailError instanceof Error ? gmailError.message : '';
        const code = (gmailError as { code?: number })?.code;
        if (msg.includes('invalid_grant') || msg.includes('Token has been expired')) {
          return NextResponse.json(
            { success: false, error: 'Gmail token expiroval. Odpojte a znova pripojte Gmail v Nastaveniach.' },
            { status: 401 }
          );
        }
        if (msg.includes('insufficient authentication scopes') || code === 403) {
          return NextResponse.json(
            { success: false, error: 'Gmail nemá povolenie na odosielanie. Odpojte a znova pripojte Gmail v Nastaveniach.' },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'Nepodarilo sa odoslať cez Gmail. Skúste znova.' },
          { status: 502 }
        );
      }
    }

    // Determine reply_status
    const replyStatus = isEdited ? 'edited_sent' : 'sent';

    // Update email record
    await query(
      `UPDATE emails SET
        reply_status = $1,
        reply_sent_at = NOW(),
        reply_edited_text = $2
      WHERE id = $3`,
      [replyStatus, isEdited ? replyText : null, id]
    );

    // Log the sent email
    await query(
      `INSERT INTO email_logs (client_id, type, subject) VALUES ($1, 'SENT', $2)`,
      [session.sub, `Re: ${email.subject}`]
    );

    // Update FAQ stats if this was a FAQ-matched email
    if (email.faq_matched_id) {
      await query(
        `UPDATE faqs SET
          usage_count = usage_count + 1,
          times_edited = times_edited + $1
        WHERE id = $2 AND client_id = $3`,
        [isEdited ? 1 : 0, email.faq_matched_id, session.sub]
      );

      // If user edited the reply, update the FAQ template for future use
      if (isEdited) {
        await query(
          `UPDATE faqs SET response_template_sk = $1 WHERE id = $2 AND client_id = $3`,
          [replyText, email.faq_matched_id, session.sub]
        );
      }
    }

    // Handle "send_and_automate" — enable auto_send on the matched FAQ
    if (action === 'send_and_automate' && email.faq_matched_id) {
      await query(
        `UPDATE faqs SET auto_send = true WHERE id = $1 AND client_id = $2`,
        [email.faq_matched_id, session.sub]
      );
    }

    return NextResponse.json({
      success: true,
      data: { gmail_message_id: gmailMessageId, reply_status: replyStatus },
    });
  } catch (error) {
    console.error('Reply send error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri odosielaní odpovede' },
      { status: 500 }
    );
  }
}

// PATCH /api/emails/[id]/reply — reject AI reply
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Neautorizovaný' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Get email to find matched FAQ
    const email = await queryOne<Email>(
      'SELECT faq_matched_id FROM emails WHERE id = $1 AND client_id = $2',
      [id, session.sub]
    );

    await query(
      `UPDATE emails SET reply_status = 'rejected' WHERE id = $1 AND client_id = $2`,
      [id, session.sub]
    );

    // Update FAQ rejected stats
    if (email?.faq_matched_id) {
      await query(
        `UPDATE faqs SET times_rejected = times_rejected + 1 WHERE id = $1 AND client_id = $2`,
        [email.faq_matched_id, session.sub]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reply reject error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri odmietnutí odpovede' },
      { status: 500 }
    );
  }
}
