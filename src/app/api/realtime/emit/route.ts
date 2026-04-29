import { NextRequest, NextResponse } from 'next/server';

// POST /api/realtime/emit — Proxy route that forwards emit requests to the realtime service
// Used as an alternative server-side path that goes through the gateway (with XTransformPort)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, event, data } = body;

    if (!room || !event) {
      return NextResponse.json(
        { error: 'room and event are required' },
        { status: 400 }
      );
    }

    // Forward to the realtime service directly (same machine)
    const res = await fetch('http://localhost:3003/emit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, event, data }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(errorData, { status: res.status });
    }

    const result = await res.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[realtime/emit] Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to forward realtime event' },
      { status: 500 }
    );
  }
}
