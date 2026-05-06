'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageSquare,
  X,
  Send,
  Minus,
  Maximize2,
  Bot,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/store/chat-store'

interface ChatWindowProps {
  workspaceId: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

export default function ChatWindow({ workspaceId }: ChatWindowProps) {
  const {
    isOpen,
    isExpanded,
    activeSessionId,
    setOpen,
    toggleOpen,
    setExpanded,
  } = useChatStore()

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/chat/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
          workspaceId,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const assistantMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: data.content || data.message || 'No response',
          createdAt: new Date(),
        }
        setMessages(prev => [...prev, assistantMsg])
      }
    } catch {
      const errorMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
        aria-label="Open chat"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    )
  }

  return (
    <Card
      className={cn(
        'fixed z-50 flex flex-col shadow-2xl border bg-card transition-all duration-300',
        isExpanded
          ? 'inset-4 rounded-lg'
          : 'bottom-6 right-6 h-[500px] w-[380px] rounded-xl'
      )}
    >
      {/* Header */}
      <CardHeader className="p-3 pb-2 border-b shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <CardTitle className="text-sm font-medium">AI Chat</CardTitle>
          <div className="ml-auto flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <Minus className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleOpen}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Ask anything about your workspace
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm max-w-[85%]',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px] bg-muted">
                      U
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-2 items-center text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Thinking...
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input */}
      <div className="p-3 border-t shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[36px] max-h-[120px] resize-none text-sm"
            rows={1}
            disabled={sending}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={sendMessage}
            disabled={!input.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
