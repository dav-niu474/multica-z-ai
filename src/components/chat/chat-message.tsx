'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bot, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ChatMessage } from '@/types'

interface ChatMessageBubbleProps {
  message: ChatMessage
  isUser: boolean
  agentName?: string
  agentAvatar?: string | null
}

export default function ChatMessageBubble({
  message,
  isUser,
  agentName,
  agentAvatar,
}: ChatMessageBubbleProps) {
  const timeStr = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })

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
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
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
          ) : agentAvatar ? (
            <img
              src={agentAvatar}
              alt={agentName || 'Agent'}
              className="h-7 w-7 rounded-full"
            />
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
          className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted rounded-tl-sm'
          }`}
        >
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
                      return (
                        <div className="my-2 rounded-lg overflow-hidden border">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-[#282c34] border-b border-gray-700">
                            <span className="text-[10px] text-gray-400 font-mono">
                              {match[1]}
                            </span>
                          </div>
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              borderRadius: 0,
                              fontSize: '0.8125rem',
                              padding: '0.75rem 1rem',
                            }}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      )
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
                        className={isUser ? 'underline' : 'text-primary underline hover:text-primary/80'}
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
      </div>
    </div>
  )
}
