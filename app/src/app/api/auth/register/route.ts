import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { createToken, setSessionCookie } from '@/lib/auth';
import type { Client } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, consents } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Meno, email a heslo sú povinné' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Heslo musí mať aspoň 6 znakov' },
        { status: 400 }
      );
    }

    const existing = await queryOne<Client>(
      'SELECT id FROM clients WHERE email = $1',
      [email]
    );

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email je už registrovaný' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const client = await queryOne<Client>(
      `INSERT INTO clients (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'client')
       RETURNING id, name, email, role`,
      [name, email, passwordHash]
    );

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Registrácia zlyhala' },
        { status: 500 }
      );
    }

    // Save consent records
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const ua = req.headers.get('user-agent') || 'unknown';

    if (consents?.terms) {
      await query(
        `INSERT INTO user_consents (user_id, consent_type, granted, ip_address, user_agent)
         VALUES ($1, 'terms_accepted', true, $2, $3)
         ON CONFLICT (user_id, consent_type) DO UPDATE SET granted = true, granted_at = NOW(), ip_address = $2, user_agent = $3`,
        [client.id, ip, ua]
      );
    }
    if (consents?.privacy) {
      await query(
        `INSERT INTO user_consents (user_id, consent_type, granted, ip_address, user_agent)
         VALUES ($1, 'privacy_acknowledged', true, $2, $3)
         ON CONFLICT (user_id, consent_type) DO UPDATE SET granted = true, granted_at = NOW(), ip_address = $2, user_agent = $3`,
        [client.id, ip, ua]
      );
    }

    const token = await createToken({
      sub: client.id,
      email: client.email,
      role: client.role,
      name: client.name,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      data: {
        id: client.id,
        name: client.name,
        email: client.email,
        role: client.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba servera' },
      { status: 500 }
    );
  }
}
