import { MODEL_PROVIDERS, getEnabledProviders, getDefaultProvider } from '@/lib/model-providers'
import { NextResponse } from 'next/server'

// GET /api/models - List all model providers and their configurations
export async function GET() {
  const enabled = getEnabledProviders()
  const defaultProvider = getDefaultProvider()

  return NextResponse.json({
    providers: MODEL_PROVIDERS.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      icon: p.icon,
      description: p.description,
      enabled: p.enabled,
      defaultModel: p.defaultModel,
      availableModels: p.availableModels.map(m => ({
        id: m.id,
        name: m.name,
        modelId: m.modelId,
        maxTokens: m.maxTokens,
        supportsStreaming: m.supportsStreaming,
        supportsVision: m.supportsVision,
      })),
    })),
    enabledCount: enabled.length,
    defaultProviderId: defaultProvider?.id || null,
  })
}
