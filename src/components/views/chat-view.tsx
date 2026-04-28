'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
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
  Plus,
  Send,
  Bot,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  Hash,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import ChatMessageBubble from '@/components/chat/chat-message'
import type { ChatSession, ChatMessage, Agent } from '@/types'

interface ChatViewProps {
  workspaceId: string
}

export default function ChatView({ workspaceId }: ChatViewProps) {
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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-select first session
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id)
    }
  }, [sessions, selectedSessionId])

  const getAgent = (agentId: string | null) => {
    if (!agentId) return null
    return agents.find((a) => a.id === agentId)
  }

  const handleSendMessage = async () => {
    if (!selectedSessionId || !messageInput.trim() || sendingMessage) return
    setSendingMessage(true)

    try {
      const res = await fetch(`/api/chat/${selectedSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: messageInput.trim(),
        }),
      })

      if (res.ok) {
        const newMsg = await res.json()
        setMessages((prev) => [...prev, newMsg])
        setMessageInput('')

        // Refresh sessions to update title / unread count
        fetchSessions()

        // Simulate agent response after a short delay
        setTimeout(async () => {
          const session = sessions.find((s) => s.id === selectedSessionId)
          const agent = session?.agentId ? getAgent(session.agentId) : null

          const agentRes = await fetch(`/api/chat/${selectedSessionId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'agent',
              content: agent
                ? `[${agent.name}] Received your message. I'm processing your request and will respond shortly.`
                : 'Message received. Processing...',
            }),
          })

          if (agentRes.ok) {
            const agentMsg = await agentRes.json()
            setMessages((prev) => [...prev, agentMsg])
            fetchSessions()
          }
        }, 1000)
      }
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSendingMessage(false)
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
    <div className="flex h-full overflow-hidden">
      {/* Sidebar — Session List */}
      <div
        className={`${
          sidebarOpen ? 'w-[280px]' : 'w-0'
        } border-r flex flex-col transition-all duration-200 overflow-hidden shrink-0`}
      >
        <div className="p-3 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Chats</h2>
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
                <p className="text-xs text-muted-foreground">No conversations yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 text-xs"
                  onClick={() => setShowNewChatDialog(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New Chat
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
                            {session.title || agent?.name || 'New Chat'}
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
                    {selectedSession.title || selectedAgent?.name || 'New Chat'}
                  </p>
                  {selectedAgent && (
                    <p className="text-[10px] text-muted-foreground">
                      {selectedAgent.name} · {selectedAgent.status}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a conversation</p>
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
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <Hash className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No messages yet
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {messages.map((msg) => (
                    <ChatMessageBubble
                      key={msg.id}
                      message={msg}
                      isUser={msg.role === 'user'}
                      agentName={selectedAgent?.name}
                      agentAvatar={selectedAgent?.avatar}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-3">
              <div className="flex items-center gap-2 max-w-3xl mx-auto">
                <Input
                  ref={inputRef}
                  placeholder={`Message ${selectedAgent?.name || 'agent'}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={sendingMessage}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                  className="shrink-0"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                Press Enter to send
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Select a conversation or create a new one
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewChatDialog(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Chat
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>New Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Agent (optional)</label>
              <Select value={newChatAgentId} onValueChange={setNewChatAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="General chat (no agent)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      General (no agent)
                    </span>
                  </SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <span className="flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5" />
                        {agent.name}
                        <span className="text-[10px] text-muted-foreground">
                          ({agent.status})
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
              Cancel
            </Button>
            <Button onClick={handleCreateChat} disabled={creatingChat}>
              {creatingChat && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
