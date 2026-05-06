'use client'

import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Bot, User, Copy, Check, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from '@/lib/i18n'
import type { ChatMessage } from '@/types'

interface ChatMessageBubbleProps {
  message: ChatMessage
  isUser: boolean
  agentName?: string
  agentAvatar?: string | null
}

// ==================== Copy Button ====================

function CopyButton({ content }: { content: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [content])

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {copied ? t.chat.copied : t.chat.copyMessage}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ==================== Task Status Pill ====================

function TaskStatusPill({ taskId }: { taskId: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
      <Zap className="h-3 w-3" />
      Task completed
    </div>
  )
}

// ==================== Code Block ====================

function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }, [children])

  return (
    <div className="my-2 rounded-lg overflow-hidden border">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#282c34] border-b border-gray-700">
        <span className="text-[10px] text-gray-400 font-mono">{language}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-gray-400 hover:text-white hover:bg-gray-700"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.8125rem',
          padding: '0.75rem 1rem',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

// ==================== Chat Message Bubble ====================

export default function ChatMessageBubble({
  message,
  isUser,
  agentName,
}: ChatMessageBubbleProps) {
  const timeStr = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })

  // System message
  if (message.role === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[10px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar */}
      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
        <AvatarFallback
          className={`text-[10px] ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {isUser ? (
            <User className="h-3.5 w-3.5" />
          ) : (
            <Bot className="h-3.5 w-3.5" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Bubble */}
      <div className={`max-w-[75%] min-w-0 space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">
            {isUser ? 'You' : agentName || 'Agent'}
          </span>
          <span className="text-[10px] text-muted-foreground">{timeStr}</span>
        </div>

        <div
          className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed relative ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted rounded-tl-sm'
          }`}
        >
          {/* Copy button for agent messages */}
          {!isUser && (
            <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton content={message.content} />
            </div>
          )}

          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-pre:my-2 prose-pre:bg-transparent prose-pre:p-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeString = String(children).replace(/\n$/, '')

                    if (match) {
                      return <CodeBlock language={match[1]}>{codeString}</CodeBlock>
                    }
                    return (
                      <code
                        className="bg-muted/80 text-foreground px-1.5 py-0.5 rounded text-[13px] font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  },
                  p({ children }) {
                    return <p className="my-1 last:mb-0">{children}</p>
                  },
                  ul({ children }) {
                    return <ul className="my-1 pl-4 list-disc">{children}</ul>
                  },
                  ol({ children }) {
                    return <ol className="my-1 pl-4 list-decimal">{children}</ol>
                  },
                  li({ children }) {
                    return <li className="my-0.5">{children}</li>
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {children}
                      </a>
                    )
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-2 border-muted-foreground/30 pl-3 my-2 italic">
                        {children}
                      </blockquote>
                    )
                  },
                  table({ children }) {
                    return (
                      <div className="my-2 overflow-x-auto rounded-lg border">
                        <table className="min-w-full">{children}</table>
                      </div>
                    )
                  },
                  th({ children }) {
                    return (
                      <th className="border-b px-3 py-1.5 text-left text-xs font-medium bg-muted/50">
                        {children}
                      </th>
                    )
                  },
                  td({ children }) {
                    return (
                      <td className="border-b px-3 py-1.5 text-xs">{children}</td>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Task status pill */}
        {message.taskId && (
          <TaskStatusPill taskId={message.taskId} />
        )}

        {/* Error indicator */}
        {message.role === 'agent' && message.failureReason && (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <Zap className="h-3 w-3" />
            {message.failureReason}
          </div>
        )}
      </div>
    </div>
  )
}
