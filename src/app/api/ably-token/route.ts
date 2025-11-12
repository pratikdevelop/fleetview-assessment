import { NextRequest, NextResponse } from 'next/server';

// Server endpoint to create Ably token requests
// Requires ABLY_API_KEY in env (server key)

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ABLY_API_KEY = process.env.ABLY_API_KEY;
  if (!ABLY_API_KEY) {
    return NextResponse.json({ error: 'Ably API key not configured' }, { status: 500 });
  }

  // Use Ably REST to create a token request
  try {
    // require at runtime to avoid bundler issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Ably = require('ably');
    const rest = new Ably.Rest({ key: ABLY_API_KEY });

    const tokenRequest = await new Promise((resolve, reject) => {
      rest.auth.createTokenRequest({}, (err: any, tokenReq: any) => {
        if (err) return reject(err);
        resolve(tokenReq);
      });
    });

    return NextResponse.json(tokenRequest);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create token request', detail: String(err) }, { status: 500 });
  }
}
