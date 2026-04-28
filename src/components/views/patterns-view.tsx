'use client'

import {
  Zap,
  Users,
  GitBranch,
  ArrowRight,
  Minus,
  AlertTriangle,
  Info,
  DollarSign,
  BookOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Pattern {
  id: number
  name: string
  description: string
  useWhen: string
  cost: 'low' | 'medium' | 'high'
  diagram: string
  example: string
}

const PATTERNS: Pattern[] = [
  {
    id: 1,
    name: 'Direct Invocation',
    description:
      'The simplest pattern — a human directly calls a single agent to perform a task. No orchestration layer needed.',
    useWhen:
      'Simple, well-defined tasks with clear inputs/outputs. One-shot operations like "generate tests for this function" or "review this code".',
    cost: 'low',
    diagram: `┌──────────┐        ┌──────────┐
│  Human   │───────▶│  Agent   │
│ (User)   │◀───────│          │
└──────────┘        └──────────┘
      1:1 synchronous call`,
    example: `# Example
Human → Agent: "Run TDD workflow on auth.ts"
Agent executes skill and returns results.
No other agents involved.`,
  },
  {
    id: 2,
    name: 'Single-Persona Command',
    description:
      'A human issues a command to one agent that acts as a "conductor" — it plans the work, then executes each step itself.',
    useWhen:
      'Multi-step tasks that benefit from planning before execution. The agent should be capable enough to handle all steps. Good for complex refactors, feature builds.',
    cost: 'low',
    diagram: `┌──────────┐        ┌──────────────────┐
│  Human   │───────▶│   Agent          │
│          │        │ ┌──────────────┐ │
│          │        │ │ 1. Plan      │ │
│          │◀───────│ │ 2. Execute   │ │
│          │        │ │ 3. Verify    │ │
│          │        │ │ 4. Report    │ │
│          │        │ └──────────────┘ │
└──────────┘        └──────────────────┘
   Single agent, multi-step`,
    example: `# Example
Human → Agent: "Implement user registration"
Agent internally plans:
  1. Create model
  2. Write API endpoint
  3. Add validation
  4. Write tests
Agent executes all steps, reports back.`,
  },
  {
    id: 3,
    name: 'Parallel Fan-out with Merge',
    description:
      'A task is decomposed into independent sub-tasks and dispatched to multiple agents simultaneously. Results are merged by the orchestrator or human.',
    useWhen:
      'Tasks with independent parallelizable work. Code generation + tests + docs can run in parallel. Good for speed on heterogeneous workloads.',
    cost: 'high',
    diagram: `                  ┌──────────┐
              ┌────▶│ Agent A  │────┐
┌──────────┐ │     │ (tests)  │    │
│  Human   │─┼────▶├──────────┤    │    ┌──────────┐
│ /Orch.   │ │     │ Agent B  │────┼───▶│  Merge   │
│          │─┼────▶│ (code)   │    │    │ Results  │
│          │ │     ├──────────┤    │    └──────────┘
└──────────┘ │     │ Agent C  │────┘         │
              └────▶│ (docs)   │              ▼
                    └──────────┘         Combined Output`,
    example: `# Example
Human → Dispatch 3 agents in parallel:
  Agent A: "Write unit tests for auth module"
  Agent B: "Implement auth API endpoints"  
  Agent C: "Write API documentation"
Merge results → combined codebase.`,
  },
  {
    id: 4,
    name: 'Sequential Pipeline',
    description:
      'Agents are chained in a sequence where each agent\'s output feeds into the next agent\'s input. Like an assembly line.',
    useWhen:
      'Tasks with clear stages where each depends on the previous output. Code → Review → Refactor → Test. Good for quality gates.',
    cost: 'medium',
    diagram: `┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Agent A │──▶│  Agent B │──▶│  Agent C │──▶│  Agent D │
│ (Write)  │   │ (Review) │   │ (Fix)    │   │ (Test)   │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
   Output A    Review B      Fix C          Test D
                                  │              │
                                  ▼              ▼
                              Final Code    ✅ Passed`,
    example: `# Example
Agent A writes code → Agent B reviews
  → Agent C fixes issues → Agent D tests
Each step must complete before the next begins.`,
  },
  {
    id: 5,
    name: 'Research Isolation',
    description:
      'One agent is dedicated to research/information gathering, isolated from the execution agent. Research results are passed to the executor without exposing the full context.',
    useWhen:
      'Tasks requiring deep research before action. Security audits, competitive analysis, documentation of large codebases. Prevents context bloat in executor.',
    cost: 'medium',
    diagram: `┌──────────┐   ┌─────────────────┐
│  Human   │──▶│  Research Agent │
│          │   │  (deep scan)    │
│          │   └────────┬────────┘
│          │            │ Summary
│          │            ▼
│          │   ┌─────────────────┐
│          │   │  Executor Agent │
│          │   │  (action)       │
│          │◀──└─────────────────┘
└──────────┘
  Research context is isolated`,
    example: `# Example
Human → Research Agent: "Audit all auth flows"
Research Agent scans codebase, returns summary.
→ Executor Agent receives summary (not full codebase)
Executor Agent fixes issues found.`,
  },
]

const ANTI_PATTERNS = [
  {
    title: 'Context Overflow',
    description:
      'Passing the entire codebase or massive context to every agent. Agents get confused, costs explode, and outputs degrade.',
    fix: 'Use Research Isolation or provide only relevant files.',
    severity: 'high',
  },
  {
    title: 'Circular Dependencies',
    description:
      'Agent A depends on Agent B which depends on Agent A. This creates infinite loops or deadlocks.',
    fix: 'Use a DAG (directed acyclic graph) for task dependencies.',
    severity: 'high',
  },
  {
    title: 'Over-Orchestration',
    description:
      'Using Parallel Fan-out for tasks that would be faster with a single agent. The overhead of coordination exceeds the benefit.',
    fix: 'Use Direct Invocation or Single-Persona Command for simple tasks.',
    severity: 'medium',
  },
  {
    title: 'No Error Recovery',
    description:
      'Pipeline fails silently at step 3, but steps 4-5 still run on stale/broken data.',
    fix: 'Add quality gates between pipeline stages. Halt on failure.',
    severity: 'high',
  },
  {
    title: 'Skill Duplication',
    description:
      'Multiple agents with overlapping skills compete or produce conflicting outputs.',
    fix: 'Define clear skill boundaries per agent. Use unique categories.',
    severity: 'medium',
  },
]

const COST_STYLES = {
  low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  high: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
}

const SEVERITY_STYLES = {
  low: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
}

export function PatternsView() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-lg bg-amber-100 dark:bg-amber-950">
            <BookOpen className="size-5 text-amber-700 dark:text-amber-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Agent Orchestration Patterns</h2>
            <p className="text-sm text-muted-foreground">
              Reference guide for structuring multi-agent workflows
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Based on the agent-skills framework, these five patterns cover the spectrum from simple
          single-agent invocations to complex parallel orchestration. Choose the right pattern based
          on task complexity, parallelizability, and cost constraints.
        </p>
      </div>

      {/* Patterns */}
      <div className="flex flex-col gap-6">
        {PATTERNS.map((pattern) => (
          <Card key={pattern.id} className="gap-0 py-0 overflow-hidden">
            <CardHeader className="px-6 py-4 gap-2 border-b">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-8 rounded-full bg-muted font-bold text-sm">
                    {pattern.id}
                  </div>
                  <CardTitle className="text-base">{pattern.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={`text-xs gap-1 ${COST_STYLES[pattern.cost]}`}
                  >
                    <DollarSign className="size-3" />
                    {pattern.cost} cost
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-sm">{pattern.description}</CardDescription>
            </CardHeader>

            <CardContent className="px-6 py-4 flex flex-col gap-4">
              {/* ASCII Diagram */}
              <div className="bg-muted/50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-foreground whitespace-pre leading-relaxed">
                  {pattern.diagram}
                </pre>
              </div>

              {/* Use When */}
              <div className="flex gap-3">
                <Info className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Use when:</p>
                  <p className="text-sm">{pattern.useWhen}</p>
                </div>
              </div>

              {/* Example */}
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Example:</p>
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                  {pattern.example}
                </pre>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Anti-Patterns Section */}
      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="size-5 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold">Anti-Patterns</h3>
            <p className="text-xs text-muted-foreground">
              Common mistakes to avoid when orchestrating agents
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ANTI_PATTERNS.map((anti) => (
            <Card key={anti.title} className="gap-3 py-0 border-red-200 dark:border-red-900/50">
              <CardHeader className="px-4 pt-3 pb-0 gap-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{anti.title}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${SEVERITY_STYLES[anti.severity]}`}
                  >
                    {anti.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3 flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">{anti.description}</p>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Fix: {anti.fix}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Reference */}
      <Separator />

      <Card className="gap-4">
        <CardHeader className="gap-1">
          <CardTitle className="text-base">Quick Reference: Pattern Selection Guide</CardTitle>
          <CardDescription>Use this decision matrix to choose the right pattern</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground">
                    Criteria
                  </th>
                  <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">
                    Direct
                  </th>
                  <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">
                    Persona
                  </th>
                  <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">
                    Parallel
                  </th>
                  <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">
                    Pipeline
                  </th>
                  <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">
                    Research
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <tr className="border-b">
                  <td className="py-2 pr-4 text-muted-foreground">Complexity</td>
                  <td className="text-center py-2 px-2">Low</td>
                  <td className="text-center py-2 px-2">Medium</td>
                  <td className="text-center py-2 px-2">High</td>
                  <td className="text-center py-2 px-2">Medium</td>
                  <td className="text-center py-2 px-2">Medium</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 text-muted-foreground">Speed</td>
                  <td className="text-center py-2 px-2 text-emerald-600">Fast</td>
                  <td className="text-center py-2 px-2 text-emerald-600">Fast</td>
                  <td className="text-center py-2 px-2 text-emerald-600">Fastest</td>
                  <td className="text-center py-2 px-2 text-amber-600">Moderate</td>
                  <td className="text-center py-2 px-2 text-amber-600">Moderate</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 text-muted-foreground">Cost</td>
                  <td className="text-center py-2 px-2">$</td>
                  <td className="text-center py-2 px-2">$</td>
                  <td className="text-center py-2 px-2">$$$</td>
                  <td className="text-center py-2 px-2">$$</td>
                  <td className="text-center py-2 px-2">$$</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 text-muted-foreground">Parallelizable</td>
                  <td className="text-center py-2 px-2">No</td>
                  <td className="text-center py-2 px-2">No</td>
                  <td className="text-center py-2 px-2 text-emerald-600">Yes</td>
                  <td className="text-center py-2 px-2">No</td>
                  <td className="text-center py-2 px-2">No</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-muted-foreground">Agents Needed</td>
                  <td className="text-center py-2 px-2">1</td>
                  <td className="text-center py-2 px-2">1</td>
                  <td className="text-center py-2 px-2">2+</td>
                  <td className="text-center py-2 px-2">2+</td>
                  <td className="text-center py-2 px-2">2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
