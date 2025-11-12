import { NextRequest } from 'next/server';
import { getTripConfigs } from '@/lib/trip-config';
import { loadAssessmentData } from '@/lib/load-assessment-data';
import { fleetData } from '@/lib/fleet-data';
import { verifyToken } from '@/lib/token-utils';

export const runtime = 'nodejs';

function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

export async function GET(req: NextRequest) {
  // Accept token via query param or Authorization header
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || req.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!token || !verifyToken(token)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Optional speed multiplier
  const speed = Number(searchParams.get('speed') || '1');

  // Load trips (assessment data or fallback)
  let trips = [];
  try {
    trips = await loadAssessmentData();
    if (!trips || trips.length === 0) trips = fleetData;
  } catch {
    trips = fleetData;
  }

  // Merge and sort all events
  const allEvents = trips.flatMap(trip => trip.events.map(e => ({ ...e, tripId: trip.id })))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      for (const event of allEvents) {
        controller.enqueue(`event: fleetEvent\ndata: ${JSON.stringify(event)}\n\n`);
        await delay(1000 / speed);
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
