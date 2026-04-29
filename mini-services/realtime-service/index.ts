import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { Server } from "socket.io";

const PORT = 3003;

const httpServer = createServer();

const io = new Server(httpServer, {
  // DO NOT change the path — Caddy uses it to forward to the correct port
  path: "/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Health endpoint — prepend so it runs BEFORE Engine.IO's handler.
// With path: "/", Engine.IO intercepts all requests; we intercept
// plain HTTP GET / (without EIO query param) for health checks.
httpServer.prependListener("request", (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // Only handle non-Socket.IO requests (no EIO query param)
  if (!url.searchParams.has("EIO")) {
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      const activeRooms = Array.from(io.sockets.adapter.rooms.keys()).filter(
        (room) => !io.sockets.sockets.has(room as string)
      );
      res.end(
        JSON.stringify({
          status: "ok",
          service: "agenthub-realtime",
          port: PORT,
          uptime: process.uptime(),
          connectedClients: io.sockets.sockets.size,
          activeWorkspaces: activeRooms.length,
          activeRooms,
          timestamp: new Date().toISOString(),
        })
      );
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  }
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

/** Track which users are in which workspace rooms */
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

  // -----------------------------------------------------------------------
  // join-workspace
  // -----------------------------------------------------------------------
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

      // Notify the joining client about current room occupants
      const members = getMembers(workspaceId);
      socket.emit("workspace:members", {
        workspaceId,
        members,
      });

      // Broadcast that a new member joined to everyone else in the room
      socket.to(roomName).emit("workspace:member-joined", {
        member: { userId, username },
        workspaceId,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `[realtime] ${username} (user ${userId}) joined workspace ${workspaceId} — room now has ${members.length} member(s)`
      );
    }
  );

  // -----------------------------------------------------------------------
  // leave-workspace
  // -----------------------------------------------------------------------
  socket.on(
    "leave-workspace",
    (data: { workspaceId: string; userId: string; username: string }) => {
      const { workspaceId, userId, username } = data;
      const roomName = `workspace:${workspaceId}`;

      socket.leave(roomName);
      removeMember(socket.id, workspaceId);

      socket.to(roomName).emit("workspace:member-left", {
        userId,
        username,
        workspaceId,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `[realtime] ${username} (user ${userId}) left workspace ${workspaceId}`
      );
    }
  );

  // -----------------------------------------------------------------------
  // issue:update — broadcast issue changes to the workspace room
  // -----------------------------------------------------------------------
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
      console.log(
        `[realtime] Issue ${data.issueId} updated in workspace ${data.workspaceId} by ${data.updatedBy}`
      );
    }
  );

  // -----------------------------------------------------------------------
  // agent:status — broadcast agent status changes
  // -----------------------------------------------------------------------
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
      console.log(
        `[realtime] Agent ${data.agentId} status → ${data.status} in workspace ${data.workspaceId}`
      );
    }
  );

  // -----------------------------------------------------------------------
  // chat:message — broadcast chat messages
  // -----------------------------------------------------------------------
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
      console.log(
        `[realtime] Chat from ${data.senderName} in workspace ${data.workspaceId}: "${data.message.slice(0, 80)}"`
      );
    }
  );

  // -----------------------------------------------------------------------
  // task:progress — broadcast task progress
  // -----------------------------------------------------------------------
  socket.on(
    "task:progress",
    (data: {
      workspaceId: string;
      taskId: string;
      agentId: string;
      progress: number; // 0–100
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
      console.log(
        `[realtime] Task ${data.taskId} progress ${data.progress}% (${data.status}) in workspace ${data.workspaceId}`
      );
    }
  );

  // -----------------------------------------------------------------------
  // disconnect
  // -----------------------------------------------------------------------
  socket.on("disconnect", (reason) => {
    console.log(`[realtime] Client disconnected: ${socket.id} (${reason})`);
    removeAllMembersForSocket(socket.id);
  });

  // -----------------------------------------------------------------------
  // error
  // -----------------------------------------------------------------------
  socket.on("error", (error) => {
    console.error(`[realtime] Socket error (${socket.id}):`, error);
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

httpServer.listen(PORT, () => {
  console.log(`[realtime] AgentHub Realtime Service listening on port ${PORT}`);
  console.log(`[realtime] Health endpoint: http://localhost:${PORT}/`);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

function shutdown(signal: string) {
  console.log(`[realtime] Received ${signal}, shutting down...`);
  io.close();
  httpServer.close(() => {
    console.log("[realtime] Server closed");
    process.exit(0);
  });
  // Force exit after 5 s if graceful shutdown hangs
  setTimeout(() => process.exit(1), 5000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
