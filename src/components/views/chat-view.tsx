'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Plus,
  Send,
  Bot,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  Hash,
  AlertCircle,
  Cpu,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from '@/lib/i18n'
import ChatMessageBubble from '@/components/chat/chat-message'
import type { ChatSession, ChatMessage, Agent } from '@/types'

// Streaming event types from the SSE endpoint
interface StreamMetadata {
  type: 'metadata'
  provider: string
  providerName: string
  model: string
}

interface StreamChunk {
  type: 'chunk'
  content: string
}

interface StreamDone {
  type: 'done'
  messageId: string
  createdAt: string
}

interface StreamError {
  type: 'error'
  error: string
}

type StreamEvent = StreamMetadata | StreamChunk | StreamDone | StreamError

// Completion response (non-streaming)
interface CompletionResponse {
  userMessage: string
  agentMessage: {
    id: string
    content: string
    role: 'agent'
    createdAt: string
  } | null
  provider?: string
  providerName?: string
  model?: string
  modelDisplayName?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  error?: string
}

// Token usage attached to a message for display
interface MessageUsage {
  provider: string
  providerName: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

interface ChatViewProps {
  workspaceId: string
}

// Animated typing dots component
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '800ms' }}
        />
      ))}
    </div>
  )
}

export default function ChatView({ workspaceId }: ChatViewProps) {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [newChatAgentId, setNewChatAgentId] = useState<string>('')
  const [creatingChat, setCreatingChat] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingModel, setStreamingModel] = useState('')

  // Track token usage per message (indexed by message id)
  const [messageUsageMap, setMessageUsageMap] = useState<Record<string, MessageUsage>>({})

  // Track last response model info for header display
  const [lastModelInfo, setLastModelInfo] = useState<{ provider: string; model: string } | null>(null)

  // Abort controller ref for cancelling streaming
  const abortControllerRef = useRef<AbortController | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch sessions and agents
  const fetchSessions = useCallback(async () => {
    try {
      const [sessionsRes, agentsRes] = await Promise.all([
        fetch(`/api/chat?workspaceId=${workspaceId}`),
        fetch(`/api/agents?workspaceId=${workspaceId}`),
      ])
      const [sessionsData, agentsData] = await Promise.all([
        sessionsRes.json(),
        agentsRes.json(),
      ])
      setSessions(sessionsData)
      setAgents(agentsData)
    } catch (err) {
      console.error('Error fetching sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Fetch messages when session changes
  const fetchMessages = useCallback(async (sessionId: string) => {
    setMessagesLoading(true)
    setMessageUsageMap({})
    setLastModelInfo(null)
    try {
      const res = await fetch(`/api/chat/${sessionId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedSessionId) {
      fetchMessages(selectedSessionId)
    } else {
      setMessages([])
    }
  }, [selectedSessionId, fetchMessages])

  // Auto-scroll to bottom when messages or streaming content changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Auto-select first session
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id)
    }
  }, [sessions, selectedSessionId])

  // Focus textarea when session changes
  useEffect(() => {
    if (selectedSessionId) {
      // Small delay to allow DOM to update
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [selectedSessionId])

  const getAgent = (agentId: string | null) => {
    if (!agentId) return null
    return agents.find((a) => a.id === agentId)
  }

  const handleSendMessage = async () => {
    if (!selectedSessionId || !messageInput.trim() || sendingMessage) return

    const userMessage = messageInput.trim()
    setSendingMessage(true)
    setMessageInput('')
    setIsStreaming(false)
    setStreamingContent('')
    setStreamingModel('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Optimistically add the user message to the UI
    const optimisticUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
      sessionId: selectedSessionId,
    }
    setMessages((prev) => [...prev, optimisticUserMsg])

    try {
      // Call the AI completion endpoint with streaming
      abortControllerRef.current = new AbortController()

      const res = await fetch('/api/chat/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          message: userMessage,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!res.ok) {
        // Try to parse error from non-streaming response
        let errorMsg = t.chat.sendFailed
        try {
          const errData = await res.json()
          errorMsg = errData.error || errorMsg
        } catch {
          // Response might not be JSON
        }

        if (res.status === 400 || res.status === 404) {
          // Session errors - remove optimistic message
          setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id))
          toast.error(t.chat.sendFailed, { description: errorMsg })
          setSendingMessage(false)
          return
        }

        throw new Error(errorMsg)
      }

      // Handle no provider configured (non-streaming JSON fallback)
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data: CompletionResponse = await res.json()
        if (data.error) {
          // Show error as system message
          const sysMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            role: 'system',
            content: data.error,
            createdAt: new Date().toISOString(),
            sessionId: selectedSessionId,
          }
          setMessages((prev) => [...prev, sysMsg])
          if (data.error.includes('No model provider configured')) {
            toast.error(t.chat.noProviderConfigured, {
              description: t.chat.noProviderHint,
            })
          } else {
            toast.error(t.chat.aiError, { description: data.error })
          }
        } else if (data.agentMessage) {
          // Non-streaming fallback response
          setMessages((prev) => [...prev, data.agentMessage!])
          if (data.usage && data.agentMessage) {
            setMessageUsageMap((prev) => ({
              ...prev,
              [data.agentMessage!.id]: {
                provider: data.provider || 'unknown',
                providerName: data.providerName || data.provider || 'Unknown',
                model: data.modelDisplayName || data.model || 'unknown',
                promptTokens: data.usage.promptTokens,
                completionTokens: data.usage.completionTokens,
                totalTokens: data.usage.totalTokens,
              },
            }))
          }
          if (data.provider && data.modelDisplayName) {
            setLastModelInfo({ provider: data.provider, model: data.modelDisplayName })
          }
        }
        fetchSessions()
        setSendingMessage(false)
        return
      }

      // Stream the response
      setIsStreaming(true)

      const reader = res.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let accumulatedContent = ''
      let currentProvider = ''
      let currentModel = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          try {
            const event: StreamEvent = JSON.parse(trimmed.slice(6))

            switch (event.type) {
              case 'metadata':
                currentProvider = event.provider
                currentModel = event.model
                setStreamingModel(event.model)
                setLastModelInfo({ provider: event.provider, model: event.model })
                break

              case 'chunk':
                accumulatedContent += event.content
                setStreamingContent(accumulatedContent)
                break

              case 'done': {
                // Add the final message to the list
                const agentMsg: ChatMessage = {
                  id: event.messageId,
                  role: 'agent',
                  content: accumulatedContent,
                  createdAt: event.createdAt,
                  sessionId: selectedSessionId,
                }
                setMessages((prev) => [...prev, agentMsg])
                setIsStreaming(false)
                setStreamingContent('')
                setStreamingModel('')
                break
              }

              case 'error':
                // If we have partial content, add it as a message
                if (accumulatedContent) {
                  const partialMsg: ChatMessage = {
                    id: `partial-${Date.now()}`,
                    role: 'agent',
                    content: accumulatedContent,
                    createdAt: new Date().toISOString(),
                    sessionId: selectedSessionId,
                  }
                  setMessages((prev) => [...prev, partialMsg])
                }
                // Show error
                const errSysMsg: ChatMessage = {
                  id: `err-${Date.now()}`,
                  role: 'system',
                  content: `[Error] ${event.error}`,
                  createdAt: new Date().toISOString(),
                  sessionId: selectedSessionId,
                }
                setMessages((prev) => [...prev, errSysMsg])
                setIsStreaming(false)
                setStreamingContent('')
                setStreamingModel('')
                toast.error(t.chat.aiError, { description: event.error })
                break
            }
          } catch {
            // Skip malformed SSE data
          }
        }
      }

      // Ensure streaming is cleaned up
      setIsStreaming(false)
      setStreamingContent('')
      setStreamingModel('')
      fetchSessions()
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        toast.error(t.chat.sendFailed, { description: errorMsg })
      }
      setIsStreaming(false)
      setStreamingContent('')
      setStreamingModel('')
    } finally {
      setSendingMessage(false)
      abortControllerRef.current = null
    }
  }

  const handleCreateChat = async () => {
    setCreatingChat(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          agentId: newChatAgentId || null,
        }),
      })

      if (res.ok) {
        const newSession = await res.json()
        setSessions((prev) => [newSession, ...prev])
        setSelectedSessionId(newSession.id)
        setShowNewChatDialog(false)
        setNewChatAgentId('')
      }
    } catch (err) {
      console.error('Error creating chat:', err)
    } finally {
      setCreatingChat(false)
    }
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value)
    // Auto-resize
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId)
  const selectedAgent = selectedSession?.agentId
    ? getAgent(selectedSession.agentId)
    : null

  if (loading) {
    return (
      <div className="flex h-full">
        <div className="w-[280px] border-r p-4 space-y-3">
          <Skeleton className="h-8 w-36" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full overflow-hidden">
        {/* Sidebar — Session List */}
        <div
          className={`${
            sidebarOpen ? 'w-[280px]' : 'w-0'
          } border-r flex flex-col transition-all duration-200 overflow-hidden shrink-0`}
        >
          <div className="p-3 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{t.chat.title}</h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSidebarOpen(false)}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowNewChatDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground">{t.chat.noConversationsYet}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => setShowNewChatDialog(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t.chat.newChat}
                  </Button>
                </div>
              ) : (
                sessions.map((session) => {
                  const agent = session.agentId ? getAgent(session.agentId) : null
                  const lastMsg = session.messages?.[0]
                  const isSelected = session.id === selectedSessionId

                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback
                            className={`text-xs ${
                              agent?.avatar
                                ? ''
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {agent?.avatar ? (
                              <img
                                src={agent.avatar}
                                alt={agent.name}
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium truncate">
                              {session.title || agent?.name || t.chat.newChat}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {session.unreadCount > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="h-4 min-w-[16px] px-1 text-[10px] bg-primary text-primary-foreground"
                                >
                                  {session.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-xs text-muted-foreground truncate">
                              {lastMsg
                                ? lastMsg.content.slice(0, 50) + (lastMsg.content.length > 50 ? '...' : '')
                                : 'No messages yet'}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-0.5 block">
                            {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSidebarOpen(true)}
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              )}
              {selectedSession ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                      {selectedAgent?.avatar ? (
                        <img
                          src={selectedAgent.avatar}
                          alt={selectedAgent.name}
                          className="h-7 w-7 rounded-full"
                        />
                      ) : (
                        <Bot className="h-3.5 w-3.5" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {selectedSession.title || selectedAgent?.name || t.chat.newChat}
                    </p>
                    <div className="flex items-center gap-2">
                      {selectedAgent && (
                        <p className="text-[10px] text-muted-foreground">
                          {selectedAgent.name} · {t.agentStatus[selectedAgent.status]}
                        </p>
                      )}
                      {lastModelInfo && (
                        <>
                          {selectedAgent && <Separator orientation="vertical" className="h-3" />}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-default">
                                <Cpu className="h-2.5 w-2.5" />
                                {lastModelInfo.model}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {t.chat.modelLabel}: {lastModelInfo.model}
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.chat.selectConversation}</p>
              )}
            </div>
          </div>

          {/* Messages */}
          {selectedSessionId ? (
            <>
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex gap-2.5 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                        <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                        <Skeleton className="h-16 w-[240px] rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 && !isStreaming ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <Hash className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {t.chat.noMessagesYet}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {t.chat.noProviderHint}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        <ChatMessageBubble
                          message={msg}
                          isUser={msg.role === 'user'}
                          agentName={selectedAgent?.name}
                          agentAvatar={selectedAgent?.avatar}
                        />
                        {/* Token usage badge */}
                        {messageUsageMap[msg.id] && (
                          <div className="flex items-center gap-2 mt-1 ml-9">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="text-[9px] h-4 px-1.5 font-normal text-muted-foreground cursor-default"
                                >
                                  <Zap className="h-2.5 w-2.5 mr-0.5" />
                                  {messageUsageMap[msg.id].totalTokens} {t.chat.tokensUsed(0).split(' ').slice(1).join(' ')}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">
                                <div className="space-y-0.5">
                                  <p>{messageUsageMap[msg.id].providerName} · {messageUsageMap[msg.id].model}</p>
                                  <p className="text-muted-foreground">
                                    {t.chat.promptTokens(messageUsageMap[msg.id].promptTokens)}
                                    {' · '}
                                    {t.chat.completionTokens(messageUsageMap[msg.id].completionTokens)}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Streaming response indicator */}
                    {isStreaming && (
                      <div className="flex gap-2.5 flex-row">
                        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                            {selectedAgent?.avatar ? (
                              <img
                                src={selectedAgent.avatar}
                                alt={selectedAgent.name}
                                className="h-7 w-7 rounded-full"
                              />
                            ) : (
                              <Bot className="h-3.5 w-3.5" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="max-w-[75%] min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {selectedAgent?.name || 'Agent'}
                            </span>
                            {streamingModel && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-default">
                                    <Cpu className="h-2.5 w-2.5" />
                                    {streamingModel}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  {t.chat.modelLabel}: {streamingModel}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          {streamingContent ? (
                            <div className="rounded-xl px-3.5 py-2.5 text-sm leading-relaxed bg-muted rounded-tl-sm">
                              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1">
                                <p className="whitespace-pre-wrap">{streamingContent}</p>
                              </div>
                              <TypingDots />
                            </div>
                          ) : (
                            <div className="rounded-xl px-3.5 py-2.5 bg-muted rounded-tl-sm">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>{t.chat.thinking}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Thinking indicator (before streaming starts) */}
                    {sendingMessage && !isStreaming && (
                      <div className="flex gap-2.5 flex-row">
                        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                            {selectedAgent?.avatar ? (
                              <img
                                src={selectedAgent.avatar}
                                alt={selectedAgent.name}
                                className="h-7 w-7 rounded-full"
                              />
                            ) : (
                              <Bot className="h-3.5 w-3.5" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="max-w-[75%] min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {selectedAgent?.name || 'Agent'}
                            </span>
                          </div>
                          <div className="rounded-xl px-3.5 py-2.5 bg-muted rounded-tl-sm">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>{t.chat.thinking}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-3">
                <div className="flex items-start gap-2 max-w-3xl mx-auto">
                  <Textarea
                    ref={textareaRef}
                    placeholder={t.chat.sendMessagePlaceholder(selectedAgent?.name)}
                    value={messageInput}
                    onChange={handleTextareaChange}
                    onKeyDown={handleTextareaKeyDown}
                    disabled={sendingMessage}
                    className="flex-1 min-h-[40px] max-h-[200px] resize-none rounded-xl"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    className="shrink-0 mt-0.5 rounded-xl"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                  {t.chat.sendHint}
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {t.chat.selectOrCreate}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewChatDialog(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {t.chat.newChat}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* New Chat Dialog */}
        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{t.chat.newChatTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.chat.selectAgent}</label>
                <Select value={newChatAgentId} onValueChange={setNewChatAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.chat.generalChatNoAgent} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="flex items-center gap-2">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        {t.chat.generalNoAgent}
                      </span>
                    </SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <span className="flex items-center gap-2">
                          <Bot className="h-3.5 w-3.5" />
                          {agent.name}
                          <span className="text-[10px] text-muted-foreground">
                            ({t.agentStatus[agent.status]})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewChatDialog(false)}>
                {t.common.cancel}
              </Button>
              <Button onClick={handleCreateChat} disabled={creatingChat}>
                {creatingChat && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.chat.startChat}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
