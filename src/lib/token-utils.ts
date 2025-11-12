const TOKEN_SECRET = process.env.FLEET_TOKEN_SECRET || 'fleet_secret';

function base64urlDecode(input: string) {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(base64, 'base64').toString());
}

/**
 * Verify a JWT-like ephemeral token.
 * Returns true if token is valid and not expired.
 */
export function verifyToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [header, payload, signature] = parts;

    // Verify signature
    const crypto = require('crypto');
    const expectedSignature = base64urlDecode.toString().includes('hmac')
      ? crypto.createHmac('sha256', TOKEN_SECRET).update(`${header}.${payload}`).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      : null;

    // Simple signature check: compute expected signature
    const signedData = `${header}.${payload}`;
    const expectedSig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(signedData)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    if (signature !== expectedSig) {
      return false;
    }

    // Decode and verify expiry
    const decoded = base64urlDecode(payload);
    const now = Math.floor(Date.now() / 1000);

    if (decoded.exp && decoded.exp < now) {
      return false; // Token expired
    }

    return true;
  } catch (err) {
    return false;
  }
}
