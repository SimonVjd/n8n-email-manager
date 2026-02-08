import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/db';
import { createToken, setSessionCookie } from '@/lib/auth';
import type { Client } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email a heslo sú povinné' },
        { status: 400 }
      );
    }

    const client = await queryOne<Client>(
      'SELECT * FROM clients WHERE email = $1 AND active = true',
      [email]
    );

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Nesprávny email alebo heslo' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, client.password_hash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Nesprávny email alebo heslo' },
        { status: 401 }
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
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba servera' },
      { status: 500 }
    );
  }
}
