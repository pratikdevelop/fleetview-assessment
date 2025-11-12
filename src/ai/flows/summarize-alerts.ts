'use server';

/**
 * @fileOverview AI agent that summarizes fleet tracking alerts.
 * Uses DeepSeek API (OpenAI-compatible) with caching, rate-limiting, and retry logic.
 * Falls back to simple local summarizer if no API key.
 */

import { z } from 'zod';
import { LRUCache } from 'lru-cache';

// ---------------------------------------------------------------------
// 1. CACHE (5-minute TTL, 500 entries)
// ---------------------------------------------------------------------
const summaryCache = new LRUCache<string, SummarizeAlertsOutput>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 min
});

// ---------------------------------------------------------------------
// 2. RATE LIMITER (9 RPM → safe under DeepSeek limits)
// ---------------------------------------------------------------------
type QueueItem = { fn: () => Promise<SummarizeAlertsOutput>; resolve: (v: SummarizeAlertsOutput) => void; reject: (e: any) => void };
const requestQueue: QueueItem[] = [];
let lastRequestTs = 0;
const MIN_INTERVAL_MS = 6_700; // ~9 req/min
let draining = false;

async function enqueue<T extends SummarizeAlertsOutput>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve: any, reject) => {
    requestQueue.push({ fn, resolve, reject });
    if (!draining) {
      drainQueue();
    }
  });
}

async function drainQueue() {
  draining = true;
  while (requestQueue.length > 0) {
    const now = Date.now();
    const elapsed = now - lastRequestTs;
    const delay = Math.max(0, MIN_INTERVAL_MS - elapsed);
    if (delay > 0) {
      await new Promise(r => setTimeout(r, delay));
    }

    const item = requestQueue.shift()!;
    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (e) {
      item.reject(e);
    }
    lastRequestTs = Date.now();
  }
  draining = false;
}

// ---------------------------------------------------------------------
// 3. DEEPSEEK API CALL + RETRY (429 only)
// ---------------------------------------------------------------------
async function callDeepSeek(input: SummarizeAlertsInput): Promise<SummarizeAlertsOutput> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not set');
  }

  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  const url = 'https://api.deepseek.com/v1/chat/completions';

  const systemPrompt = `You are a fleet management assistant. Analyze fleet tracking events, aggregate and summarize alerts by severity and frequency, and provide actionable insights for a fleet manager.`;
  const userPrompt = `Events: ${input.events}\n\nSummary:`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`DeepSeek API error: ${response.status} ${errorText}`);
    (error as any).status = response.status;
    throw error;
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content || '';
  if (!content) {
    throw new Error('No content in DeepSeek response');
  }

  return { summary: content.trim() };
}

async function callModelWithRetry(input: SummarizeAlertsInput): Promise<SummarizeAlertsOutput> {
  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      return await callDeepSeek(input);
    } catch (err: any) {
      const isRateLimit = err?.message?.includes('429') || err?.status === 429 || err?.message?.includes('rate limit');
      if (isRateLimit && attempt < maxAttempts) {
        const backoff = Math.min(2 ** attempt * 1000, 30000); // 2s, 4s, 8s, max 30s
        console.warn(`[DeepSeek] Rate limit hit – retry ${attempt}/${maxAttempts} after ${backoff}ms`);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      // On non-rate-limit errors or final attempt, fallback to local
      console.warn(`[DeepSeek] Error (attempt ${attempt}): ${err.message}. Falling back to local summarizer.`);
      return { summary: simpleLocalSummarizer(input) };
    }
  }

  // If all retries fail, use local
  return { summary: simpleLocalSummarizer(input) };
}

// ---------------------------------------------------------------------
// 4. SCHEMAS
// ---------------------------------------------------------------------
const SummarizeAlertsInputSchema = z.object({
  events: z.string().describe('A JSON string containing an array of fleet tracking event objects.'),
});
export type SummarizeAlertsInput = z.infer<typeof SummarizeAlertsInputSchema>;

const SummarizeAlertsOutputSchema = z.object({
  summary: z.string().describe('A summary of the alerts, aggregated by severity and frequency, providing actionable insights.'),
});
export type SummarizeAlertsOutput = z.infer<typeof SummarizeAlertsOutputSchema>;

// Simple local fallback: Counts events by type and severity (assumes eventType and optional data.severity)
function simpleLocalSummarizer(input: SummarizeAlertsInput): string {
  try {
    const events = JSON.parse(input.events) as any[];
    if (events.length === 0) return 'No alerts detected.';

    const total = events.length;
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, unknown: 0 };

    events.forEach((e) => {
      const type = e.eventType || 'unknown';
      byType[type] = (byType[type] || 0) + 1;

      const sev = (e.data?.severity || e.severity || 'unknown').toLowerCase();
      const key = ['low', 'medium', 'high'].includes(sev) ? sev : 'unknown';
      bySeverity[key]++;
    });

    const topTypes = Object.entries(byType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const severitySummary = Object.entries(bySeverity)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    return `Fleet Alert Summary: ${total} total events. Top issues: ${topTypes}. Severity breakdown: ${severitySummary}. Action: Review high-severity items immediately.`;
  } catch (err) {
    console.error('Local summarizer parse error:', err);
    return 'Unable to parse events for summarization.';
  }
}

// ---------------------------------------------------------------------
// 5. MAIN FLOW (caching + rate-limit + retry/fallback)
// ---------------------------------------------------------------------
async function summarizeAlertsFlow(input: SummarizeAlertsInput): Promise<SummarizeAlertsOutput> {
  // Validate input (optional, but good practice)
  SummarizeAlertsInputSchema.parse(input);

  // Cache check
  const cacheKey = input.events; // Raw JSON string as key (deterministic)
  const cached = summaryCache.get(cacheKey);
  if (cached) {
    console.debug('[Cache] Hit for events summary');
    return cached;
  }

  // Enqueue the API call
  const result = await enqueue(() => callModelWithRetry(input));

  // Cache the result
  summaryCache.set(cacheKey, result);
  console.debug('[Cache] Stored new summary');
  return result;
}

// ---------------------------------------------------------------------
// 6. PUBLIC EXPORT (unchanged API)
// ---------------------------------------------------------------------
export async function summarizeAlerts(input: SummarizeAlertsInput): Promise<SummarizeAlertsOutput> {
  return summarizeAlertsFlow(input);
}