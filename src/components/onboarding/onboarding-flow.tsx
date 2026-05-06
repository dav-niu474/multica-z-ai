'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { StepWelcome } from './step-welcome'
import { StepWorkspace } from './step-workspace'
import { StepAgent } from './step-agent'
import { StepComplete } from './step-complete'

export type OnboardingStep = 'welcome' | 'workspace' | 'agent' | 'complete'

interface OnboardingData {
  workspaceId: string
  workspace: {
    name: string
    slug: string
    issuePrefix: string
  }
  agent: {
    id: string
    name: string
  } | null
}

interface OnboardingFlowProps {
  onComplete: () => void
}

const ONBOARDING_DONE_KEY = 'multica_onboarding_done'

const STEP_ORDER: OnboardingStep[] = ['welcome', 'workspace', 'agent', 'complete']

const stepLabels: Record<OnboardingStep, string> = {
  welcome: 'Welcome',
  workspace: 'Workspace',
  agent: 'Agent',
  complete: 'Done',
}

function getStepProgress(step: OnboardingStep): number {
  const idx = STEP_ORDER.indexOf(step)
  return Math.round(((idx + 1) / STEP_ORDER.length) * 100)
}

const pageVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 60 : -60,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -60 : 60,
    transition: { duration: 0.2, ease: 'easeIn' },
  }),
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [direction, setDirection] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    workspaceId: '',
    workspace: { name: '', slug: '', issuePrefix: 'ISSUE' },
    agent: null,
  })

  // Persist onboarding done in localStorage
  const markDone = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_DONE_KEY, Date.now().toString())
    }
  }, [])

  // Navigate steps
  const goToStep = useCallback(
    (step: OnboardingStep, dir?: number) => {
      setDirection(dir ?? 1)
      setCurrentStep(step)
    },
    [],
  )

  // Step handlers
  const handleWorkspaceCreated = useCallback(
    (wsData: { name: string; slug: string; issuePrefix: string }) => {
      // We need the workspaceId for agent creation — fetch it
      fetch(`/api/workspaces?slug=${encodeURIComponent(wsData.slug)}`)
        .then((res) => res.json())
        .then((workspaces) => {
          const ws = Array.isArray(workspaces) ? workspaces[0] : workspaces
          setData((prev) => ({
            ...prev,
            workspaceId: ws?.id || '',
            workspace: wsData,
          }))
          goToStep('agent')
        })
        .catch(() => {
          // If we can't fetch the workspaceId, still proceed (agent step will handle error)
          setData((prev) => ({
            ...prev,
            workspace: wsData,
          }))
          goToStep('agent')
        })
    },
    [goToStep],
  )

  const handleAgentCreated = useCallback(
    (agent: { id: string; name: string } | null) => {
      setData((prev) => ({
        ...prev,
        agent,
      }))
      markDone()
      goToStep('complete')
    },
    [goToStep, markDone],
  )

  const handleGoBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(currentStep)
    if (idx > 0) {
      goToStep(STEP_ORDER[idx - 1], -1)
    }
  }, [currentStep, goToStep])

  const handleGoDashboard = useCallback(() => {
    onComplete()
  }, [onComplete])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // Don't allow escape to skip onboarding
        return
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const progress = getStepProgress(currentStep)
  const stepIndex = STEP_ORDER.indexOf(currentStep)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03] dark:opacity-[0.05]" />

      {/* Top gradient overlay */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/[0.03] to-transparent" />

      <div className="relative z-10 w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              {STEP_ORDER.map((step, idx) => (
                <div key={step} className="flex items-center gap-1.5">
                  <div
                    className={`flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-semibold transition-colors ${
                      idx < stepIndex
                        ? 'bg-primary text-primary-foreground'
                        : idx === stepIndex
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {idx < stepIndex ? (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  {idx < STEP_ORDER.length - 1 && (
                    <div
                      className={`h-px w-6 sm:w-8 transition-colors ${
                        idx < stepIndex ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {stepLabels[currentStep]}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Step Content */}
        <div className="relative min-h-[420px] flex items-start justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            {currentStep === 'welcome' && (
              <motion.div
                key="welcome"
                custom={direction}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 flex items-center justify-center"
              >
                <StepWelcome onNext={() => goToStep('workspace')} />
              </motion.div>
            )}

            {currentStep === 'workspace' && (
              <motion.div
                key="workspace"
                custom={direction}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 flex items-start justify-center pt-4"
              >
                <StepWorkspace
                  onNext={handleWorkspaceCreated}
                  onBack={handleGoBack}
                />
              </motion.div>
            )}

            {currentStep === 'agent' && (
              <motion.div
                key="agent"
                custom={direction}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 flex items-start justify-center pt-2"
              >
                <StepAgent
                  workspaceId={data.workspaceId}
                  workspaceName={data.workspace.name}
                  onNext={handleAgentCreated}
                  onBack={handleGoBack}
                />
              </motion.div>
            )}

            {currentStep === 'complete' && (
              <motion.div
                key="complete"
                custom={direction}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 flex items-center justify-center"
              >
                <StepComplete
                  workspace={data.workspace}
                  agent={data.agent}
                  onDashboard={handleGoDashboard}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
