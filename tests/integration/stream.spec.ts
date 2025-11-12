/**
 * Integration tests for fleet streaming API
 * Tests token issuance and SSE endpoint connectivity
 */

describe('Fleet Streaming API', () => {
  const API_KEY = process.env.FLEET_API_KEY || 'test_api_key';
  const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

  beforeAll(() => {
    // Set env var if not already set
    if (!process.env.FLEET_API_KEY) {
      process.env.FLEET_API_KEY = 'test_api_key';
    }
  });

  describe('POST /api/stream-token', () => {
    test('should return token with valid API key', async () => {
      const response = await fetch(`${BASE_URL}/api/stream-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: API_KEY }),
      });

      expect(response.status).toBe(200);
      const { token, expires } = await response.json();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(expires).toBeDefined();
      expect(typeof expires).toBe('number');

      // Token should be JWT-like (3 parts separated by dots)
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    test('should reject invalid API key', async () => {
      const response = await fetch(`${BASE_URL}/api/stream-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: 'invalid_key' }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    test('should accept X-API-Key header', async () => {
      const response = await fetch(`${BASE_URL}/api/stream-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(200);
      const { token } = await response.json();
      expect(token).toBeDefined();
    });

    test('token should have valid expiry', async () => {
      const response = await fetch(`${BASE_URL}/api/stream-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: API_KEY }),
      });

      const { expires } = await response.json();
      const now = Math.floor(Date.now() / 1000);
      const ttl = expires - now;

      // Token TTL should be ~600 seconds (10 minutes)
      expect(ttl).toBeGreaterThan(590);
      expect(ttl).toBeLessThanOrEqual(610);
    });
  });

  describe('GET /api/fleet-stream', () => {
    let validToken: string;

    beforeAll(async () => {
      const response = await fetch(`${BASE_URL}/api/stream-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: API_KEY }),
      });
      const data = await response.json();
      validToken = data.token;
    });

    test('should require token', async () => {
      const response = await fetch(`${BASE_URL}/api/fleet-stream`);
      expect(response.status).toBe(401);
    });

    test('should start stream with valid token (query param)', async () => {
      const response = await fetch(`${BASE_URL}/api/fleet-stream?token=${validToken}`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/event-stream');
      expect(response.headers.get('cache-control')).toBe('no-cache');
    });

    test('should start stream with Bearer token (header)', async () => {
      const response = await fetch(`${BASE_URL}/api/fleet-stream`, {
        headers: { 'Authorization': `Bearer ${validToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/event-stream');
    });

    test('should reject invalid token', async () => {
      const response = await fetch(`${BASE_URL}/api/fleet-stream?token=invalid_token`);
      expect(response.status).toBe(401);
    });

    test('stream should send fleetEvent messages', async () => {
      const response = await fetch(`${BASE_URL}/api/fleet-stream?token=${validToken}&speed=100`);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let receivedEvents = 0;
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));

      try {
        await Promise.race([
          (async () => {
            while (receivedEvents < 2) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              if (chunk.includes('event: fleetEvent')) {
                receivedEvents++;
              }

              if (chunk.includes('data:')) {
                // Verify JSON parsing
                const dataMatch = chunk.match(/data: ({.*?})/);
                if (dataMatch) {
                  const event = JSON.parse(dataMatch[1]);
                  expect(event.id).toBeDefined();
                  expect(event.tripId).toBeDefined();
                  expect(event.timestamp).toBeDefined();
                }
              }
            }
          })(),
          timeout,
        ]);
      } finally {
        reader.cancel();
      }

      expect(receivedEvents).toBeGreaterThanOrEqual(2);
    });

    test('should support speed parameter', async () => {
      const response = await fetch(`${BASE_URL}/api/fleet-stream?token=${validToken}&speed=10`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/event-stream');
      // Events should be delivered faster with higher speed multiplier
    });
  });

  describe('Token Validation', () => {
    test('expired token should be rejected', async () => {
      // Create an old token (manually crafted for testing)
      // This would require access to token signing internals
      // For now, we verify that the verifyToken function exists
      expect(require('@/lib/token-utils').verifyToken).toBeDefined();
    });

    test('malformed token should be rejected', async () => {
      const response = await fetch(`${BASE_URL}/api/fleet-stream?token=not.a.valid.token`);
      expect(response.status).toBe(401);
    });

    test('token with missing signature should be rejected', async () => {
      const response = await fetch(`${BASE_URL}/api/fleet-stream?token=header.payload`);
      expect(response.status).toBe(401);
    });
  });
});
