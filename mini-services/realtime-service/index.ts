import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { Server } from "socket.io";

const SOCKET_PORT = 3003;
const HTTP_PORT = 3004;

// =========================================================================
// REST HTTP Server — for server-side emit triggers (port 3004)
// =========================================================================

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", `http://localhost:${HTTP_PORT}`);

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "agenthub-realtime-http",
        port: HTTP_PORT,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // Emit endpoint
  if (req.method === "POST" && url.pathname === "/emit") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const { room, event, data } = payload;

        if (!room || !event) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "room and event are required" }));
          return;
        }

        const roomName = `workspace:${room}`;
        io.to(roomName).emit(event, {
          ...data,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `[realtime] HTTP emit → room ${roomName}, event ${event}`
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, room: roomName, event }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body" }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

// =========================================================================
// Socket.IO Server — for real-time client connections (port 3003)
// =========================================================================

const socketHttpServer = createServer();

// Health endpoint on Socket.IO port (via prependListener, before engine.io)
socketHttpServer.prependListener("request", (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", `http://localhost:${SOCKET_PORT}`);

  if (!url.searchParams.has("EIO")) {
    if (req.method === "GET" && url.pathname === "/") {
      const activeRooms = Array.from(io.sockets.adapter.rooms.keys()).filter(
        (room) => !io.sockets.sockets.has(room as string)
      );
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          service: "agenthub-realtime",
          port: SOCKET_PORT,
          uptime: process.uptime(),
          connectedClients: io.sockets.sockets.size,
          activeWorkspaces: activeRooms.length,
          activeRooms,
          timestamp: new Date().toISOString(),
        })
      );
    } else if (req.method === "POST" && url.pathname === "/emit") {
      // Also support emit on the Socket.IO port for convenience
      let body = "";
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const payload = JSON.parse(body);
          const { room, event, data } = payload;
          if (!room || !event) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "room and event are required" }));
            return;
          }
          const roomName = `workspace:${room}`;
          io.to(roomName).emit(event, { ...data, timestamp: new Date().toISOString() });
          console.log(`[realtime] HTTP emit → room ${roomName}, event ${event}`);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, room: roomName, event }));
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON body" }));
        }
      });
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  }
  // Don't handle Socket.IO requests (with EIO param) — let engine.io handle them
});

const io = new Server(socketHttpServer, {
  // DO NOT change the path — Caddy uses it to forward to the correct port
  path: "/",
  cors: false,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkspaceMember {
  socketId: string;
  userId: string;
  username: string;
  workspaceId: string;
}

const workspaceMembers = new Map<string, WorkspaceMember[]>();

function getMembers(workspaceId: string): WorkspaceMember[] {
  return workspaceMembers.get(workspaceId) ?? [];
}

function addMember(member: WorkspaceMember) {
  const members = getMembers(member.workspaceId);
  if (!members.find((m) => m.socketId === member.socketId)) {
    members.push(member);
  }
  workspaceMembers.set(member.workspaceId, members);
}

function removeMember(socketId: string, workspaceId: string) {
  const members = getMembers(workspaceId);
  const filtered = members.filter((m) => m.socketId !== socketId);
  workspaceMembers.set(workspaceId, filtered);
}

function removeAllMembersForSocket(socketId: string) {
  workspaceMembers.forEach((members, workspaceId) => {
    const filtered = members.filter((m) => m.socketId !== socketId);
    workspaceMembers.set(workspaceId, filtered);
  });
}

// ---------------------------------------------------------------------------
// Socket event handlers
// ---------------------------------------------------------------------------

io.on("connection", (socket) => {
  console.log(`[realtime] Client connected: ${socket.id}`);

  socket.on(
    "join-workspace",
    (data: { workspaceId: string; userId: string; username: string }) => {
      const { workspaceId, userId, username } = data;
      const roomName = `workspace:${workspaceId}`;
      socket.join(roomName);

      const member: WorkspaceMember = {
        socketId: socket.id,
        userId,
        username,
        workspaceId,
      };
      addMember(member);

      const members = getMembers(workspaceId);
      socket.emit("workspace:members", { workspaceId, members });
      socket.to(roomName).emit("workspace:member-joined", {
        member: { userId, username },
        workspaceId,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `[realtime] ${username} joined workspace ${workspaceId} — ${members.length} member(s)`
      );
    }
  );

  socket.on(
    "leave-workspace",
    (data: { workspaceId: string; userId: string; username: string }) => {
      const { workspaceId, userId, username } = data;
      const roomName = `workspace:${workspaceId}`;
      socket.leave(roomName);
      removeMember(socket.id, workspaceId);
      socket.to(roomName).emit("workspace:member-left", {
        userId, username, workspaceId,
        timestamp: new Date().toISOString(),
      });
      console.log(`[realtime] ${username} left workspace ${workspaceId}`);
    }
  );

  socket.on(
    "issue:update",
    (data: {
      workspaceId: string;
      issueId: string;
      changes: Record<string, unknown>;
      updatedBy: string;
    }) => {
      const roomName = `workspace:${data.workspaceId}`;
      io.to(roomName).emit("issue:updated", {
        issueId: data.issueId,
        changes: data.changes,
        updatedBy: data.updatedBy,
        timestamp: new Date().toISOString(),
      });
      console.log(`[realtime] Issue ${data.issueId} updated in ${data.workspaceId}`);
    }
  );

  socket.on(
    "agent:status",
    (data: {
      workspaceId: string;
      agentId: string;
      status: string;
      details?: Record<string, unknown>;
    }) => {
      const roomName = `workspace:${data.workspaceId}`;
      io.to(roomName).emit("agent:status-changed", {
        agentId: data.agentId,
        status: data.status,
        details: data.details ?? {},
        timestamp: new Date().toISOString(),
      });
      console.log(`[realtime] Agent ${data.agentId} → ${data.status} in ${data.workspaceId}`);
    }
  );

  socket.on(
    "chat:message",
    (data: {
      workspaceId: string;
      message: string;
      senderId: string;
      senderName: string;
      channelId?: string;
    }) => {
      const roomName = `workspace:${data.workspaceId}`;
      const enriched = {
        id: crypto.randomUUID(),
        workspaceId: data.workspaceId,
        message: data.message,
        senderId: data.senderId,
        senderName: data.senderName,
        channelId: data.channelId ?? "general",
        timestamp: new Date().toISOString(),
      };
      io.to(roomName).emit("chat:message-received", enriched);
      console.log(`[realtime] Chat from ${data.senderName} in ${data.workspaceId}`);
    }
  );

  socket.on(
    "task:progress",
    (data: {
      workspaceId: string;
      taskId: string;
      agentId: string;
      progress: number;
      status: "pending" | "in_progress" | "completed" | "failed";
      message?: string;
    }) => {
      const roomName = `workspace:${data.workspaceId}`;
      io.to(roomName).emit("task:progress-updated", {
        taskId: data.taskId,
        agentId: data.agentId,
        progress: data.progress,
        status: data.status,
        message: data.message ?? "",
        timestamp: new Date().toISOString(),
      });
      console.log(`[realtime] Task ${data.taskId} ${data.progress}% (${data.status})`);
    }
  );

  socket.on("disconnect", (reason) => {
    console.log(`[realtime] Client disconnected: ${socket.id} (${reason})`);
    removeAllMembersForSocket(socket.id);
  });

  socket.on("error", (error) => {
    console.error(`[realtime] Socket error (${socket.id}):`, error);
  });
});

// ---------------------------------------------------------------------------
// Start servers
// ---------------------------------------------------------------------------

socketHttpServer.listen(SOCKET_PORT, () => {
  console.log(`[realtime] Socket.IO server listening on port ${SOCKET_PORT}`);
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`[realtime] HTTP REST server listening on port ${HTTP_PORT}`);
  console.log(`[realtime] Emit endpoint: http://localhost:${HTTP_PORT}/emit`);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

function shutdown(signal: string) {
  console.log(`[realtime] Received ${signal}, shutting down...`);
  io.close();
  socketHttpServer.close(() => {
    httpServer.close(() => {
      console.log("[realtime] Servers closed");
      process.exit(0);
    });
  });
  setTimeout(() => process.exit(1), 5000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
