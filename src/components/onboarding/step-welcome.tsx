'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Layers, Bot, Kanban, RotateCcw, ArrowRight } from 'lucide-react'

interface StepWelcomeProps {
  onNext: () => void
}

const features = [
  {
    icon: Bot,
    title: 'AI Agents as Team Members',
    description:
      'Deploy autonomous AI agents that work alongside your team — writing code, reviewing PRs, and managing tasks.',
    badge: 'Autonomous',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    mockLines: [
      { w: '65%', h: 'h-2', color: 'bg-emerald-200 dark:bg-emerald-800' },
      { w: '80%', h: 'h-2', color: 'bg-emerald-100 dark:bg-emerald-900' },
      { w: '50%', h: 'h-2', color: 'bg-emerald-150 dark:bg-emerald-850' },
    ],
  },
  {
    icon: Kanban,
    title: 'Unified Task Board',
    description:
      'One board for humans and agents. Track issues, assign work, and watch AI pick up tasks automatically.',
    badge: 'Collaborative',
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/40',
    borderColor: 'border-violet-200 dark:border-violet-800',
    mockLines: [
      { w: '40%', h: 'h-8', color: 'bg-violet-200 dark:bg-violet-800 rounded' },
      { w: '55%', h: 'h-8', color: 'bg-violet-100 dark:bg-violet-900 rounded' },
      { w: '35%', h: 'h-8', color: 'bg-violet-200/60 dark:bg-violet-850 rounded' },
    ],
  },
  {
    icon: RotateCcw,
    title: 'Auto-Recover Sessions',
    description:
      'Agent sessions persist and recover from failures. Never lose progress — work resumes where it left off.',
    badge: 'Resilient',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    mockLines: [
      { w: '70%', h: 'h-2', color: 'bg-amber-200 dark:bg-amber-800' },
      { w: '45%', h: 'h-2', color: 'bg-amber-100 dark:bg-amber-900' },
      { w: '60%', h: 'h-2', color: 'bg-amber-200/60 dark:bg-amber-850' },
    ],
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <motion.div
      className="flex flex-col items-center text-center max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Logo / Hero */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Layers className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Welcome to AgentHub
        </h1>
        <p className="text-muted-foreground mt-3 text-base max-w-md mx-auto leading-relaxed">
          The multi-agent collaboration platform where AI agents and humans work
          together to ship software faster.
        </p>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-2 mb-8"
      >
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className={`relative flex flex-col gap-3 rounded-xl border p-4 ${feature.bgColor} ${feature.borderColor} transition-all hover:shadow-md hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center ${feature.bgColor}`}
                >
                  <Icon className={`h-4.5 w-4.5 ${feature.color}`} />
                </div>
                <Badge variant="secondary" className="text-[10px] font-medium">
                  {feature.badge}
                </Badge>
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {feature.description}
                </p>
              </div>
              {/* Mock UI lines */}
              <div className="flex flex-col gap-1.5 mt-1 px-1">
                {feature.mockLines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`${line.w} ${line.h} ${line.color} animate-pulse rounded`}
                    style={{
                      animationDelay: `${idx * 0.5}s`,
                      animationDuration: '2.5s',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* CTA */}
      <motion.div variants={itemVariants}>
        <Button
          size="lg"
          className="h-11 gap-2 px-8 text-base font-medium"
          onClick={onNext}
        >
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Takes about 2 minutes to set up
        </p>
      </motion.div>
    </motion.div>
  )
}
