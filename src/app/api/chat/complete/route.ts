import { chatCompletion } from '@/lib/model-providers'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/chat/complete - Send a message and get AI completion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, providerId, model } = body

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'sessionId and message are required' },
        { status: 400 }
      )
    }

    // Verify session exists
    const session = await db().chatSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      )
    }

    // Get the agent's provider config
    const agentId = session.agentId
    let effectiveProviderId = providerId
    let effectiveModel = model

    if (agentId && !providerId) {
      const agent = await db().agent.findUnique({ where: { id: agentId } })
      if (agent?.provider) {
        effectiveProviderId = agent.provider
      }
    }

    // Save user message
    await db().chatMessage.create({
      data: {
        role: 'user',
        content: message,
        sessionId,
      },
    })

    // If no provider specified, try to get a response anyway
    if (!effectiveProviderId) {
      return NextResponse.json({
        userMessage: message,
        agentMessage: null,
        error: 'No model provider configured. Please set up an API key.',
      })
    }

    // Get conversation history for context
    const recentMessages = await db().chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })

    const messages = recentMessages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }))

    try {
      // Call model provider
      const completion = await chatCompletion({
        provider: effectiveProviderId,
        model: effectiveModel || '',
        messages,
      })

      // Save agent response
      const agentMessage = await db().chatMessage.create({
        data: {
          role: 'agent',
          content: completion.content,
          sessionId,
        },
      })

      // Update session
      await db().chatSession.update({
        where: { id: sessionId },
        data: {
          updatedAt: new Date(),
          unreadCount: { increment: 1 },
          title: session.title || (message.length > 50 ? message.substring(0, 50) + '...' : message),
        },
      })

      return NextResponse.json({
        userMessage: message,
        agentMessage: {
          id: agentMessage.id,
          content: completion.content,
          role: 'agent',
          createdAt: agentMessage.createdAt,
        },
        provider: completion.provider,
        model: completion.model,
        usage: completion.usage,
      })
    } catch (modelError: unknown) {
      const errorMessage = modelError instanceof Error ? modelError.message : 'Model API error'

      // Save error as system message
      await db().chatMessage.create({
        data: {
          role: 'system',
          content: `[Error] ${errorMessage}`,
          sessionId,
        },
      })

      return NextResponse.json({
        userMessage: message,
        agentMessage: null,
        error: errorMessage,
      }, { status: 502 })
    }
  } catch (error) {
    console.error('Error in chat completion:', error)
    return NextResponse.json(
      { error: 'Failed to process chat completion' },
      { status: 500 }
    )
  }
}
