/**
 * AgentHub Daemon Service (port 3031)
 *
 * Simulates a local daemon that:
 * 1. Auto-discovers and registers mock runtimes on startup
 * 2. Sends heartbeats every 15 seconds
 * 3. Polls for queued tasks every 3 seconds
 * 4. Simulates task execution (5-15s random duration)
 * 5. Exposes GET /health
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http'

// =========================================================================
// Config
// =========================================================================

const DAEMON_PORT = 3031
const MAIN_APP_URL = 'http://localhost:3000'
const HEARTBEAT_INTERVAL_MS = 15_000
const TASK_POLL_INTERVAL_MS = 3_000

// =========================================================================
// State
// =========================================================================

interface MockRuntime {
  agentId: string
  provider: string
  name: string
  os: string
  cliVersion: string
  deviceInfo: Record<string, string>
  runtimeId?: string
}

const DAEMON_UUID = crypto.randomUUID()

const MOCK_RUNTIMES: MockRuntime[] = [
  {
    agentId: '',  // will be set on registration
    provider: 'claude',
    name: 'Claude Dev',
    os: 'macOS 14.5 (Arm64)',
    cliVersion: '1.2.0',
    deviceInfo: { hostname: 'macbook-pro.local', arch: 'arm64', cpu: 'Apple M3 Pro' },
  },
  {
    agentId: '',
    provider: 'codex',
    name: 'Codex Worker',
    os: 'Ubuntu 22.04 (x86_64)',
    cliVersion: '0.9.4',
    deviceInfo: { hostname: 'dev-server-01', arch: 'x86_64', cpu: 'AMD EPYC 7763' },
  },
]

// Track running tasks
interface RunningTask {
  taskId: string
  agentId: string
  startedAt: number
  durationMs: number
  timeout: ReturnType<typeof setTimeout>
}

const runningTasks = new Map<string, RunningTask>()
let tasksProcessed = 0
const startTime = Date.now()

// =========================================================================
// Helpers
// =========================================================================

async function fetchJSON(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown error')
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json()
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// =========================================================================
// Registration: Create mock agents + runtimes
// =========================================================================

let WORKSPACE_ID = ''

async function registerRuntimes() {
  console.log(`[daemon] Registering mock runtimes for daemon ${DAEMON_UUID.slice(0, 8)}...`)

  try {
    // 1. GET /api/workspaces to get workspace
    const workspaces = await fetchJSON(`${MAIN_APP_URL}/api/workspaces`)
    if (!Array.isArray(workspaces) || workspaces.length === 0) {
      console.log('[daemon] No workspace found, will retry on next heartbeat')
      return false
    }
    WORKSPACE_ID = workspaces[0].id
    console.log(`[daemon] Using workspace: ${workspaces[0].name} (${WORKSPACE_ID.slice(0, 8)})`)

    // 2. GET /api/agents to get agents
    const existingAgents = await fetchJSON(
      `${MAIN_APP_URL}/api/agents?workspaceId=${WORKSPACE_ID}`
    )
    const agentList = Array.isArray(existingAgents) ? existingAgents : []

    // 3. Register 2 mock runtimes (one claude, one codex) via heartbeat
    for (const rt of MOCK_RUNTIMES) {
      try {
        const existing = agentList.find((a: { name: string }) => a.name === rt.name)
        let agentId: string

        if (existing) {
          agentId = existing.id
          console.log(`[daemon] Agent "${rt.name}" already exists (${agentId.slice(0, 8)})`)
        } else {
          // Create agent
          const agent = await fetchJSON(`${MAIN_APP_URL}/api/agents`, {
            method: 'POST',
            body: JSON.stringify({
              name: rt.name,
              provider: rt.provider,
              description: `Mock ${rt.provider} agent managed by daemon`,
              maxConcurrentTasks: 3,
              visibility: 'workspace',
              workspaceId: WORKSPACE_ID,
            }),
          })
          agentId = agent.id
          console.log(`[daemon] Created agent "${rt.name}" (${agentId.slice(0, 8)})`)
        }

        rt.agentId = agentId

        // Send initial heartbeat to register the runtime
        const hbResult = await fetchJSON(`${MAIN_APP_URL}/api/runtimes/heartbeat`, {
          method: 'POST',
          body: JSON.stringify({
            daemonId: DAEMON_UUID,
            agentId: rt.agentId,
            status: 'online',
            provider: rt.provider,
            os: rt.os,
            cliVersion: rt.cliVersion,
            deviceInfo: rt.deviceInfo,
            workspaceId: WORKSPACE_ID,
          }),
        })

        if (hbResult.ok) {
          rt.runtimeId = rt.runtimeId || hbResult.runtime?.id
          console.log(`[daemon] Runtime registered: ${rt.name}`)
        }
      } catch (err) {
        console.error(`[daemon] Failed to register runtime "${rt.name}":`, err)
      }
    }

    console.log(`[daemon] ✅ All ${MOCK_RUNTIMES.length} runtimes registered successfully`)
    return true
  } catch (err) {
    console.error('[daemon] Registration failed:', err)
    return false
  }
}

// =========================================================================
// Heartbeat loop — every 15s send heartbeat
// =========================================================================

function startHeartbeatLoop() {
  console.log(`[daemon] Heartbeat loop started (every ${HEARTBEAT_INTERVAL_MS / 1000}s)`)

  const interval = setInterval(async () => {
    for (const rt of MOCK_RUNTIMES) {
      if (!rt.agentId) continue

      try {
        await fetchJSON(`${MAIN_APP_URL}/api/runtimes/heartbeat`, {
          method: 'POST',
          body: JSON.stringify({
            daemonId: DAEMON_UUID,
            runtimeId: rt.runtimeId,
            agentId: rt.agentId,
            status: 'online',
            provider: rt.provider,
            os: rt.os,
            cliVersion: rt.cliVersion,
            deviceInfo: rt.deviceInfo,
            workspaceId: WORKSPACE_ID,
          }),
        })
      } catch (err) {
        console.error(`[daemon] Heartbeat failed for ${rt.name}:`, err)
      }
    }
  }, HEARTBEAT_INTERVAL_MS)

  return interval
}

// =========================================================================
// Task polling loop — every 3s poll for pending tasks
// =========================================================================

function startTaskPolling() {
  console.log(`[daemon] Task polling started (every ${TASK_POLL_INTERVAL_MS / 1000}s)`)

  const interval = setInterval(async () => {
    if (!WORKSPACE_ID) return

    try {
      const result = await fetchJSON(
        `${MAIN_APP_URL}/api/runtimes/tasks?status=queued&workspaceId=${WORKSPACE_ID}`
      )

      const tasks = result.tasks || []
      if (tasks.length === 0) return

      for (const task of tasks) {
        // Skip if already running
        if (runningTasks.has(task.id)) continue

        // Check if this task belongs to one of our runtimes
        const belongsToUs = MOCK_RUNTIMES.some((rt) => rt.agentId === task.agentId)
        if (!belongsToUs) continue

        // 6. When task found, simulate execution (5-15s), then mark completed
        await claimTask(task)
      }
    } catch {
      // Silent — polling is frequent
    }
  }, TASK_POLL_INTERVAL_MS)

  return interval
}

async function claimTask(task: { id: string; agentId: string }) {
  const taskId = task.id
  const durationMs = randomBetween(5_000, 15_000)
  const runtime = MOCK_RUNTIMES.find((rt) => rt.agentId === task.agentId)
  const agentName = runtime?.name || 'Unknown'

  console.log(`[daemon] 🚀 Claiming task ${taskId.slice(0, 8)} for ${agentName} (est. ${(durationMs / 1000).toFixed(1)}s)`)

  // Mark task as running via PATCH
  try {
    await fetchJSON(`${MAIN_APP_URL}/api/runtimes/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'running' }),
    })
  } catch {
    // Task API might not be available; continue with execution
  }

  // Set up timeout for completion
  const timeout = setTimeout(async () => {
    runningTasks.delete(taskId)
    tasksProcessed++

    const success = Math.random() > 0.1 // 90% success rate
    const tokensUsed = randomBetween(500, 5000)

    try {
      if (success) {
        const output = `[${agentName}] Task completed successfully. Processed in ${(durationMs / 1000).toFixed(1)}s with ${tokensUsed} tokens.`
        await fetchJSON(`${MAIN_APP_URL}/api/runtimes/tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'completed',
            output,
            tokensUsed,
            elapsedMs: durationMs,
          }),
        })
        console.log(`[daemon] ✅ Task ${taskId.slice(0, 8)} completed (${tokensUsed} tokens, ${(durationMs / 1000).toFixed(1)}s)`)
      } else {
        const failureReason = `Simulated failure: ${['timeout', 'rate_limit', 'context_overflow', 'api_error'][randomBetween(0, 3)]}`
        await fetchJSON(`${MAIN_APP_URL}/api/runtimes/tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'failed',
            failureReason,
            tokensUsed,
            elapsedMs: durationMs,
          }),
        })
        console.log(`[daemon] ❌ Task ${taskId.slice(0, 8)} failed: ${failureReason}`)
      }
    } catch (err) {
      console.error(`[daemon] Failed to update task ${taskId.slice(0, 8)}:`, err)
    }
  }, durationMs)

  runningTasks.set(taskId, {
    taskId,
    agentId: task.agentId,
    startedAt: Date.now(),
    durationMs,
    timeout,
  })
}

// =========================================================================
// HTTP Server — health check and status
// =========================================================================

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? '/', `http://localhost:${DAEMON_PORT}`)

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // GET /health → { status: 'ok', uptime, runtimes: [...], tasksProcessed }
  if (req.method === 'GET' && url.pathname === '/health') {
    const runtimes = MOCK_RUNTIMES.filter((rt) => rt.agentId).map((rt) => ({
      name: rt.name,
      provider: rt.provider,
      runtimeId: rt.runtimeId,
      agentId: rt.agentId,
      status: 'online',
    }))

    const tasks: Array<{
      taskId: string
      agentId: string
      progress: number
      elapsed: number
    }> = []

    runningTasks.forEach((task) => {
      tasks.push({
        taskId: task.taskId,
        agentId: task.agentId,
        progress: Math.min(100, Math.round((Date.now() - task.startedAt) / task.durationMs * 100)),
        elapsed: Date.now() - task.startedAt,
      })
    })

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      service: 'multica-daemon',
      daemonUuid: DAEMON_UUID,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      runtimes,
      runningTasks: tasks.length,
      tasks,
      tasksProcessed,
      workspaceId: WORKSPACE_ID || null,
      timestamp: new Date().toISOString(),
    }))
    return
  }

  // Status dashboard
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      service: 'multica-daemon',
      daemonUuid: DAEMON_UUID,
      port: DAEMON_PORT,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      endpoints: {
        health: '/health',
      },
      runtimes: MOCK_RUNTIMES.filter((rt) => rt.agentId).length,
      runningTasks: runningTasks.size,
      tasksProcessed,
    }))
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

// =========================================================================
// Main
// =========================================================================

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('  AgentHub Daemon Service')
  console.log(`  Daemon UUID: ${DAEMON_UUID}`)
  console.log(`  Port: ${DAEMON_PORT}`)
  console.log('═══════════════════════════════════════════════')

  // Start HTTP server
  httpServer.listen(DAEMON_PORT, () => {
    console.log(`[daemon] HTTP server listening on port ${DAEMON_PORT}`)
    console.log(`[daemon] Health check: http://localhost:${DAEMON_PORT}/health`)
  })

  // Register runtimes (retry a few times)
  let registered = false
  for (let attempt = 1; attempt <= 5; attempt++) {
    console.log(`[daemon] Registration attempt ${attempt}/5...`)
    registered = await registerRuntimes()
    if (registered) break
    await new Promise((r) => setTimeout(r, 3000))
  }

  if (!registered) {
    console.warn('[daemon] ⚠️  Auto-registration failed after 5 attempts.')
    console.warn('[daemon] The daemon will continue running. Heartbeats will attempt re-registration.')
  }

  // 4. Start heartbeat loop (every 15s send heartbeat)
  startHeartbeatLoop()

  // 5. Start task polling loop (every 3s poll for pending tasks)
  startTaskPolling()

  console.log('[daemon] ✅ Daemon is running')
}

// =========================================================================
// Graceful shutdown
// =========================================================================

function shutdown(signal: string) {
  console.log(`[daemon] Received ${signal}, shutting down...`)

  // Clear running task timeouts
  runningTasks.forEach((task) => clearTimeout(task.timeout))
  runningTasks.clear()

  httpServer.close(() => {
    console.log('[daemon] Server closed')
    process.exit(0)
  })

  setTimeout(() => process.exit(1), 5000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Start
main().catch((err) => {
  console.error('[daemon] Fatal error:', err)
  process.exit(1)
})
