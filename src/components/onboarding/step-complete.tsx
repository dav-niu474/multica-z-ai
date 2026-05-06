'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Bot,
  Sparkles,
  PartyPopper,
} from 'lucide-react'

interface StepCompleteProps {
  workspace: { name: string; slug: string; issuePrefix: string }
  agent: { id: string; name: string } | null
  onDashboard: () => void
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + i * 0.15, duration: 0.35, ease: 'easeOut' },
  }),
}

const checkVariants = {
  hidden: { scale: 0, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
      delay: 0.1,
    },
  },
}

export function StepComplete({ workspace, agent, onDashboard }: StepCompleteProps) {
  return (
    <motion.div
      className="max-w-md mx-auto text-center"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Success Animation */}
      <motion.div variants={checkVariants} className="mb-6 relative inline-block">
        <div className="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 12,
              delay: 0.3,
            }}
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </motion.div>
        </div>
        {/* Confetti-like decoration */}
        <motion.div
          className="absolute -top-2 -right-2"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: 0.5 }}
        >
          <PartyPopper className="h-6 w-6 text-amber-500" />
        </motion.div>
      </motion.div>

      {/* Heading */}
      <motion.div variants={itemVariants} custom={0}>
        <h2 className="text-2xl font-bold tracking-tight">
          You&apos;re All Set!
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Your workspace is ready. Here&apos;s what was created:
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="space-y-3 mt-6 mb-8">
        {/* Workspace Summary */}
        <motion.div
          variants={itemVariants}
          custom={1}
          className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left"
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {workspace.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px]">
                Workspace
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                agenthub.app/{workspace.slug}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Agent Summary */}
        {agent && (
          <motion.div
            variants={itemVariants}
            custom={2}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left"
          >
            <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {agent.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-[10px]">
                  AI Agent
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  Ready to work
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tips */}
        {!agent && (
          <motion.div
            variants={itemVariants}
            custom={2}
            className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/30 p-4 text-left"
          >
            <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              You can add AI agents anytime from the{' '}
              <span className="font-medium text-foreground">Agents</span> page
              in your workspace.
            </p>
          </motion.div>
        )}
      </div>

      {/* CTA */}
      <motion.div variants={itemVariants} custom={3}>
        <Button
          size="lg"
          className="h-11 gap-2 px-8 text-base font-medium"
          onClick={onDashboard}
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  )
}
