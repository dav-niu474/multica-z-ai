'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Bot,
  Code2,
  GitPullRequest,
  ClipboardList,
  FileText,
  Sparkles,
} from 'lucide-react'

interface StepAgentProps {
  workspaceId: string
  workspaceName: string
  onNext: (agent: { id: string; name: string } | null) => void
  onBack: () => void
}

interface AgentTemplate {
  id: string
  name: string
  description: string
  instructions: string
  provider: string
  icon: typeof Bot
  color: string
  bgColor: string
  borderColor: string
  badgeText: string
}

const templates: AgentTemplate[] = [
  {
    id: 'coding-expert',
    name: 'Coding Expert',
    description: 'Full-stack developer agent that writes, debugs, and refactors code across your codebase.',
    instructions:
      'You are an expert full-stack developer. When assigned issues, analyze the requirements carefully, explore the codebase, write clean and well-tested code, and submit solutions. Follow existing code conventions and patterns. Always include necessary tests.',
    provider: 'claude',
    icon: Code2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    badgeText: 'Most Popular',
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Reviews pull requests and code changes for bugs, style issues, and best practices.',
    instructions:
      'You are a senior code reviewer. When reviewing code changes, look for bugs, security vulnerabilities, performance issues, and adherence to coding standards. Provide constructive, actionable feedback with specific suggestions. Check for test coverage and documentation.',
    provider: 'claude',
    icon: GitPullRequest,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/40',
    borderColor: 'border-violet-200 dark:border-violet-800',
    badgeText: 'Quality',
  },
  {
    id: 'planning-assistant',
    name: 'Planning Assistant',
    description: 'Breaks down complex features into well-structured tasks and creates project plans.',
    instructions:
      'You are a technical planning assistant. When given a feature request or project goal, break it down into actionable tasks with clear acceptance criteria. Estimate complexity, identify dependencies, and suggest an optimal execution order. Create detailed but concise issue descriptions.',
    provider: 'claude',
    icon: ClipboardList,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badgeText: 'Organizer',
  },
  {
    id: 'doc-writer',
    name: 'Documentation Writer',
    description: 'Creates and maintains high-quality documentation, READMEs, and API references.',
    instructions:
      'You are a technical documentation writer. When assigned tasks, create clear, comprehensive documentation including README files, API references, inline code comments, and user guides. Focus on accuracy, completeness, and readability. Follow existing documentation conventions.',
    provider: 'claude',
    icon: FileText,
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40',
    borderColor: 'border-sky-200 dark:border-sky-800',
    badgeText: 'Essential',
  },
]

const containerVariants = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
}

const cardContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export function StepAgent({ workspaceId, workspaceName, onNext, onBack }: StepAgentProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedTemplate = templates.find((t) => t.id === selectedId)

  async function handleCreateAgent() {
    if (!selectedTemplate) return

    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedTemplate.name,
          description: selectedTemplate.description,
          provider: selectedTemplate.provider,
          instructions: selectedTemplate.instructions,
          workspaceId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to create agent.')
        setSubmitting(false)
        return
      }

      const agent = await res.json()
      onNext({ id: agent.id, name: agent.name })
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  function handleSkip() {
    onNext(null)
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Create Your First Agent</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Choose a pre-configured AI agent to add to{' '}
          <span className="font-medium text-foreground">{workspaceName}</span>.
        </p>
      </div>

      {/* Template Cards */}
      <motion.div
        variants={cardContainerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
      >
        {templates.map((template) => {
          const Icon = template.icon
          const isSelected = selectedId === template.id

          return (
            <motion.button
              key={template.id}
              type="button"
              variants={cardVariants}
              onClick={() => setSelectedId(template.id)}
              disabled={submitting}
              className={`
                relative flex items-start gap-3 rounded-xl border p-4 text-left
                transition-all duration-200 cursor-pointer
                ${
                  isSelected
                    ? `${template.bgColor} ${template.borderColor} ring-2 ring-primary/20 shadow-sm`
                    : 'border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm'
                }
                disabled:opacity-60 disabled:cursor-not-allowed
              `}
            >
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? template.bgColor : 'bg-muted'
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 ${isSelected ? template.color : 'text-muted-foreground'}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {template.name}
                  </h3>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {template.badgeText}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {template.description}
                </p>
              </div>
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <svg
                    className="h-3 w-3 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 mb-4">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={submitting}
          className="gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={submitting}
          >
            Skip this step
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!selectedId || submitting}
            onClick={handleCreateAgent}
            className="gap-2 px-6"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Agent...
              </>
            ) : (
              <>
                Create Agent
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
