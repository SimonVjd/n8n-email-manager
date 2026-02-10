import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limit store: IP -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Route-specific limits: [maxRequests, windowMs]
const ROUTE_LIMITS: Record<string, [number, number]> = {
  '/api/auth/login': [5, 60_000],       // 5 per minute
  '/api/auth/register': [3, 60_000],    // 3 per minute
  '/api/emails/sync': [5, 60_000],      // 5 per minute
  '/api/emails/search': [30, 60_000],   // 30 per minute
};

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) rateLimitMap.delete(key);
  }
}, 5 * 60_000);

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-client-ip') ??
    'unknown'
  );
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const limits = ROUTE_LIMITS[path];
  if (!limits) return NextResponse.next();

  const [maxRequests, windowMs] = limits;
  const ip = getClientIp(request);
  const key = `${ip}:${path}`;
  const now = Date.now();

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return NextResponse.next();
  }

  if (record.count >= maxRequests) {
    return NextResponse.json(
      { success: false, error: 'Príliš veľa požiadaviek. Skúste neskôr.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)) },
      }
    );
  }

  record.count++;
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/emails/sync',
    '/api/emails/search',
  ],
};
