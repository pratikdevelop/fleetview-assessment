import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const API_KEY = process.env.FLEET_API_KEY;
const TOKEN_TTL_SECONDS = 600; // 10 minutes
const TOKEN_SECRET = process.env.FLEET_TOKEN_SECRET || 'fleet_secret';

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signToken(payload: object, secret: string) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const signature = base64url(
    require('crypto').createHmac('sha256', secret).update(`${header}.${body}`).digest()
  );
  return `${header}.${body}.${signature}`;
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const apiKey = data.apiKey || req.headers.get('x-api-key');
  if (!API_KEY || apiKey !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
    jti: base64url(randomBytes(12)),
    sub: 'fleet-stream',
  };
  const token = signToken(payload, TOKEN_SECRET);
  return NextResponse.json({ token, expires: payload.exp });
}

export const runtime = 'nodejs';
