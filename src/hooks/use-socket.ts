'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAppStore } from '@/store/app-store';

interface UseSocketReturn {
  isConnected: boolean;
}

interface SocketEventHandlers {
  onIssueUpdated?: (data: unknown) => void;
  onAgentStatusChanged?: (data: unknown) => void;
  onChatMessageReceived?: (data: unknown) => void;
  onTaskProgressUpdated?: (data: unknown) => void;
}

// Module-level singleton for the emit hook
let emitSocketInstance: Socket | null = null;

function getEmitSocket(): Socket {
  if (!emitSocketInstance) {
    emitSocketInstance = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
  }
  return emitSocketInstance;
}

export function useSocket(handlers?: SocketEventHandlers): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  const [isConnected, setIsConnected] = useState(false);
  const workspaceId = useAppStore((s) => s.workspaceId);

  // Connect to socket on mount
  useEffect(() => {
    const s = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = s;

    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return () => {
      s.removeAllListeners();
      s.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, []);

  // Keep handlers ref updated
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // Register event handlers
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    const onIssueUpdated = (data: unknown) => handlersRef.current?.onIssueUpdated?.(data);
    const onAgentStatusChanged = (data: unknown) =>
      handlersRef.current?.onAgentStatusChanged?.(data);
    const onChatMessageReceived = (data: unknown) =>
      handlersRef.current?.onChatMessageReceived?.(data);
    const onTaskProgressUpdated = (data: unknown) =>
      handlersRef.current?.onTaskProgressUpdated?.(data);

    s.on('issue:updated', onIssueUpdated);
    s.on('agent:status-changed', onAgentStatusChanged);
    s.on('chat:message-received', onChatMessageReceived);
    s.on('task:progress-updated', onTaskProgressUpdated);

    return () => {
      s.off('issue:updated', onIssueUpdated);
      s.off('agent:status-changed', onAgentStatusChanged);
      s.off('chat:message-received', onChatMessageReceived);
      s.off('task:progress-updated', onTaskProgressUpdated);
    };
  }, []);

  // Join workspace room when workspaceId changes
  useEffect(() => {
    const s = socketRef.current;
    if (!s || !workspaceId) return;

    s.emit('leave-workspace', { workspaceId: '*' });
    s.emit('join-workspace', { workspaceId });

    return () => {
      s.emit('leave-workspace', { workspaceId });
    };
  }, [workspaceId]);

  return {
    isConnected,
  };
}

// Helper hook to emit events
export function useSocketEmit() {
  const workspaceId = useAppStore((s) => s.workspaceId);

  const emitIssueUpdate = useCallback(
    (data: { issueId: string; field: string; value: unknown }) => {
      getEmitSocket().emit('issue:update', { workspaceId, ...data });
    },
    [workspaceId]
  );

  const emitAgentStatus = useCallback(
    (data: { agentId: string; status: string }) => {
      getEmitSocket().emit('agent:status', { workspaceId, ...data });
    },
    [workspaceId]
  );

  const emitChatMessage = useCallback(
    (data: { sessionId: string; content: string; role: string }) => {
      getEmitSocket().emit('chat:message', { workspaceId, ...data });
    },
    [workspaceId]
  );

  const emitTaskProgress = useCallback(
    (data: { taskId: string; progress: number; status: string }) => {
      getEmitSocket().emit('task:progress', { workspaceId, ...data });
    },
    [workspaceId]
  );

  return {
    emitIssueUpdate,
    emitAgentStatus,
    emitChatMessage,
    emitTaskProgress,
  };
}
