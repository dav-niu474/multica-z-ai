import { chatCompletion, streamChatCompletion, getProvider } from '@/lib/model-providers'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/chat/complete - Send a message and get AI completion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, providerId, model, stream } = body

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

    // Update session title if it's the first message
    if (!session.title) {
      await db().chatSession.update({
        where: { id: sessionId },
        data: {
          updatedAt: new Date(),
          title: message.length > 50 ? message.substring(0, 50) + '...' : message,
        },
      })
    }

    // If no provider specified, return early
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
      role: (m.role === 'agent' ? 'assistant' : m.role) as 'user' | 'assistant' | 'system',
      content: m.content,
    }))

    // Resolve the provider info for response metadata
    const providerInfo = getProvider(effectiveProviderId)
    const providerName = providerInfo?.name || effectiveProviderId
    const modelInfo = providerInfo?.availableModels.find(m => m.modelId === effectiveModel) || providerInfo?.availableModels[0]
    const modelDisplayName = modelInfo?.name || effectiveModel || providerInfo?.defaultModel

    // ==================== Streaming Mode ====================
    if (stream) {
      const encoder = new TextEncoder()
      let fullContent = ''

      const readable = new ReadableStream({
        async start(controller) {
          try {
            // Send provider/model metadata first
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'metadata', provider: effectiveProviderId, providerName, model: modelDisplayName })}\n\n`))

            // Stream from the model
            const streamGen = streamChatCompletion({
              provider: effectiveProviderId,
              model: effectiveModel || providerInfo?.defaultModel || '',
              messages,
            })

            for await (const chunk of streamGen) {
              fullContent += chunk
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`))
            }

            // Save the full agent response to DB
            const agentMessage = await db().chatMessage.create({
              data: {
                role: 'agent',
                content: fullContent,
                sessionId,
              },
            })

            // Update session
            await db().chatSession.update({
              where: { id: sessionId },
              data: {
                updatedAt: new Date(),
                unreadCount: { increment: 1 },
              },
            })

            // Send done event with message ID and usage info
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', messageId: agentMessage.id, createdAt: agentMessage.createdAt })}\n\n`))
            controller.close()
          } catch (modelError: unknown) {
            const errorMessage = modelError instanceof Error ? modelError.message : 'Stream API error'

            // Save error as system message
            try {
              await db().chatMessage.create({
                data: {
                  role: 'system',
                  content: `[Error] ${errorMessage}`,
                  sessionId,
                },
              })
            } catch {
              // Ignore DB errors in error handler
            }

            // If we streamed some content, save it anyway
            if (fullContent) {
              try {
                await db().chatMessage.create({
                  data: {
                    role: 'agent',
                    content: fullContent,
                    sessionId,
                  },
                })
              } catch {
                // Ignore
              }
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`))
            controller.close()
          }
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // ==================== Non-Streaming Mode ====================
    try {
      // Call model provider
      const completion = await chatCompletion({
        provider: effectiveProviderId,
        model: effectiveModel || providerInfo?.defaultModel || '',
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
        providerName,
        model: completion.model,
        modelDisplayName,
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
