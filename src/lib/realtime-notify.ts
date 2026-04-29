/**
 * Server-side utility to broadcast realtime events through the realtime service.
 * Uses direct localhost call to the dedicated HTTP REST port (3004).
 */

const REALTIME_HTTP_PORT = 3004;
const REALTIME_EMIT_URL = `http://localhost:${REALTIME_HTTP_PORT}/emit`;

interface RealtimeEmitOptions {
  room: string;      // workspaceId
  event: string;     // e.g. 'issue:updated', 'agent:status-changed', 'chat:message-received'
  data?: Record<string, unknown>;
}

/**
 * Emit a realtime event to a workspace room via the realtime service's HTTP endpoint.
 * This is fire-and-forget — errors are logged but never thrown to avoid blocking the caller.
 */
export async function realtimeNotify({ room, event, data = {} }: RealtimeEmitOptions): Promise<void> {
  try {
    const res = await fetch(REALTIME_EMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, event, data }),
    });

    if (!res.ok) {
      console.warn(`[realtime-notify] Emit failed: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    // Fire-and-forget: log but never throw
    console.warn('[realtime-notify] Failed to reach realtime service:', err);
  }
}

/**
 * Convenience helpers for common events
 */
export function notifyIssueUpdated(workspaceId: string, issueId: string, changes: Record<string, unknown>) {
  return realtimeNotify({
    room: workspaceId,
    event: 'issue:updated',
    data: { issueId, changes },
  });
}

export function notifyAgentStatusChanged(workspaceId: string, agentId: string, status: string) {
  return realtimeNotify({
    room: workspaceId,
    event: 'agent:status-changed',
    data: { agentId, status },
  });
}

export function notifyChatMessageReceived(workspaceId: string, sessionId: string, message: Record<string, unknown>) {
  return realtimeNotify({
    room: workspaceId,
    event: 'chat:message-received',
    data: { sessionId, message },
  });
}
