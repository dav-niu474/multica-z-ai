// Model Provider Configuration
// Supports: NVIDIA NIM, GLM (ZhipuAI), Volcano Engine (ByteDance), and extensible for more

export interface ModelProvider {
  id: string
  name: string
  type: 'nvidia' | 'glm' | 'volcano' | 'openai' | 'anthropic' | 'gemini' | 'custom'
  baseUrl: string
  apiKeyEnvVar: string
  defaultModel: string
  availableModels: ModelConfig[]
  icon?: string
  description?: string
  enabled: boolean
}

export interface ModelConfig {
  id: string
  name: string
  modelId: string
  maxTokens?: number
  supportsStreaming?: boolean
  supportsVision?: boolean
}

export interface ChatCompletionRequest {
  provider: string
  model: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  id: string
  content: string
  model: string
  provider: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason?: string
}

// Provider configurations
export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    type: 'nvidia',
    baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    apiKeyEnvVar: 'NVIDIA_API_KEY',
    defaultModel: 'meta/llama-3.1-405b-instruct',
    availableModels: [
      {
        id: 'llama-3.1-405b',
        name: 'Llama 3.1 405B Instruct',
        modelId: 'meta/llama-3.1-405b-instruct',
        maxTokens: 131072,
        supportsStreaming: true,
        supportsVision: false,
      },
      {
        id: 'llama-3.1-70b',
        name: 'Llama 3.1 70B Instruct',
        modelId: 'meta/llama-3.1-70b-instruct',
        maxTokens: 131072,
        supportsStreaming: true,
        supportsVision: false,
      },
      {
        id: 'llama-3.1-8b',
        name: 'Llama 3.1 8B Instruct',
        modelId: 'meta/llama-3.1-8b-instruct',
        maxTokens: 131072,
        supportsStreaming: true,
        supportsVision: false,
      },
      {
        id: 'mixtral-8x22b',
        name: 'Mixtral 8x22B Instruct',
        modelId: 'mistralai/mixtral-8x22b-instruct-v0.1',
        maxTokens: 65536,
        supportsStreaming: true,
        supportsVision: false,
      },
      {
        id: 'nemotron-4-340b',
        name: 'Nemotron-4 340B Instruct',
        modelId: 'nvidia/nemotron-4-340b-instruct',
        maxTokens: 4096,
        supportsStreaming: true,
        supportsVision: false,
      },
      {
        id: 'qwen2.5-72b',
        name: 'Qwen 2.5 72B Instruct',
        modelId: 'qwen/qwen2.5-72b-instruct',
        maxTokens: 32768,
        supportsStreaming: true,
        supportsVision: false,
      },
    ],
    icon: '🟢',
    description: 'NVIDIA NIM provides optimized inference for open-source and NVIDIA-built AI models via a unified API.',
    enabled: !!process.env.NVIDIA_API_KEY,
  },
  {
    id: 'glm',
    name: 'GLM (智谱AI)',
    type: 'glm',
    baseUrl: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    apiKeyEnvVar: 'GLM_API_KEY',
    defaultModel: 'glm-4-plus',
    availableModels: [
      {
        id: 'glm-4-plus',
        name: 'GLM-4-Plus',
        modelId: 'glm-4-plus',
        maxTokens: 128000,
        supportsStreaming: true,
        supportsVision: false,
      },
      {
        id: 'glm-4-long',
        name: 'GLM-4-Long',
        modelId: 'glm-4-long',
        maxTokens: 1000000,
        supportsStreaming: true,
        supportsVision: false,
      },
      {
        id: 'glm-4-flash',
        name: 'GLM-4-Flash',
        modelId: 'glm-4-flash',
        maxTokens: 128000,
        supportsStreaming: true,
        supportsVision: false,
      },
      {
        id: 'glm-4v-plus',
        name: 'GLM-4V-Plus (Vision)',
        modelId: 'glm-4v-plus',
        maxTokens: 8192,
        supportsStreaming: true,
        supportsVision: true,
      },
      {
        id: 'glm-4-alltools',
        name: 'GLM-4-AllTools',
        modelId: 'glm-4-alltools',
        maxTokens: 128000,
        supportsStreaming: true,
        supportsVision: true,
      },
    ],
    icon: '🔵',
    description: '智谱AI GLM 系列模型，支持长文本、视觉理解等多种能力。',
    enabled: !!process.env.GLM_API_KEY,
  },
  {
    id: 'volcano',
    name: '火山引擎 (豆包)',
    type: 'volcano',
    baseUrl: process.env.VOLCANO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    apiKeyEnvVar: 'VOLCANO_API_KEY',
    defaultModel: 'doubao-pro-32k',
    availableModels: [
      {
        id: 'doubao-pro-32k',
        name: '豆包 Pro 32K',
        modelId: 'doubao-pro-32k',
        maxTokens: 32768,
        supportsStreaming: true,
        supportsVision: false,
      },
      {
        id: 'doubao-pro-128k',
        name: '豆包 Pro 128K',
        modelId: 'doubao-pro-128k',
        maxTokens: 131072,
        supportsStreaming: true,
        supportsVision: false,
      },
      {
        id: 'doubao-lite-32k',
        name: '豆包 Lite 32K',
        modelId: 'doubao-lite-32k',
        maxTokens: 32768,
        supportsStreaming: true,
        supportsVision: false,
      },
    ],
    icon: '🟠',
    description: '字节跳动火山引擎豆包大模型，支持长文本和多模态能力。',
    enabled: !!process.env.VOLCANO_API_KEY,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o',
    availableModels: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        modelId: 'gpt-4o',
        maxTokens: 128000,
        supportsStreaming: true,
        supportsVision: true,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        modelId: 'gpt-4o-mini',
        maxTokens: 128000,
        supportsStreaming: true,
        supportsVision: true,
      },
    ],
    icon: '🟢',
    description: 'OpenAI GPT series models.',
    enabled: !!process.env.OPENAI_API_KEY,
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    type: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-sonnet-4-20250514',
    availableModels: [
      {
        id: 'claude-sonnet-4',
        name: 'Claude Sonnet 4',
        modelId: 'claude-sonnet-4-20250514',
        maxTokens: 200000,
        supportsStreaming: true,
        supportsVision: true,
      },
      {
        id: 'claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        modelId: 'claude-3-5-sonnet-20241022',
        maxTokens: 200000,
        supportsStreaming: true,
        supportsVision: true,
      },
    ],
    icon: '🟤',
    description: 'Anthropic Claude series models.',
    enabled: !!process.env.ANTHROPIC_API_KEY,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    type: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyEnvVar: 'GEMINI_API_KEY',
    defaultModel: 'gemini-2.5-pro',
    availableModels: [
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        modelId: 'gemini-2.5-pro-preview-05-06',
        maxTokens: 1048576,
        supportsStreaming: true,
        supportsVision: true,
      },
    ],
    icon: '🔵',
    description: 'Google Gemini series models.',
    enabled: !!process.env.GEMINI_API_KEY,
  },
]

// Get a provider by ID
export function getProvider(providerId: string): ModelProvider | undefined {
  return MODEL_PROVIDERS.find(p => p.id === providerId)
}

// Get enabled providers
export function getEnabledProviders(): ModelProvider[] {
  return MODEL_PROVIDERS.filter(p => p.enabled)
}

// Get default provider (first enabled provider)
export function getDefaultProvider(): ModelProvider | undefined {
  return getEnabledProviders()[0]
}

// Get API key for a provider from environment
export function getProviderApiKey(provider: ModelProvider): string | undefined {
  return process.env[provider.apiKeyEnvVar]
}

// OpenAI-compatible chat completion (works for NVIDIA, GLM, Volcano)
export async function chatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const provider = getProvider(request.provider)
  if (!provider) {
    throw new Error(`Provider not found: ${request.provider}`)
  }

  const apiKey = getProviderApiKey(provider)
  if (!apiKey) {
    throw new Error(`API key not configured for provider: ${provider.name}`)
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }

  const body = {
    model: request.model,
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.maxTokens ?? 4096,
    stream: false,
  }

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Model API error (${response.status}): ${error}`)
  }

  const data = await response.json()

  return {
    id: data.id || `chatcmpl-${Date.now()}`,
    content: data.choices?.[0]?.message?.content || '',
    model: data.model || request.model,
    provider: provider.id,
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0,
    } : undefined,
    finishReason: data.choices?.[0]?.finish_reason,
  }
}

// Streaming chat completion (Server-Sent Events)
export async function* streamChatCompletion(
  request: ChatCompletionRequest
): AsyncGenerator<string> {
  const provider = getProvider(request.provider)
  if (!provider) {
    throw new Error(`Provider not found: ${request.provider}`)
  }

  const apiKey = getProviderApiKey(provider)
  if (!apiKey) {
    throw new Error(`API key not configured for provider: ${provider.name}`)
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }

  const body = {
    model: request.model,
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.maxTokens ?? 4096,
    stream: true,
  }

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok || !response.body) {
    const error = await response.text()
    throw new Error(`Stream API error (${response.status}): ${error}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed === 'data: [DONE]') continue
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6))
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            yield content
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }
}
