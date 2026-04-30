# Task: Replace Simulated Chat Responses with Real AI-Powered Responses

## Summary
Replaced the `setTimeout(1000)` simulated agent response in the Chat view with real AI-powered streaming completions using the existing `/api/chat/complete` endpoint.

## Files Modified

### 1. `src/app/api/chat/complete/route.ts` — Added Streaming Support
- Added `stream` parameter to the POST body
- When `stream: true`, returns an SSE (Server-Sent Events) response instead of JSON
- SSE events: `metadata` (provider/model info), `chunk` (content deltas), `done` (finalization with messageId), `error`
- Falls back to non-streaming JSON response when `stream` is false/absent
- Properly maps `agent` role to `assistant` role for model API compatibility
- Resolves provider/model display names for metadata
- Saves streamed content to DB after completion
- Handles partial content save on stream errors

### 2. `src/components/views/chat-view.tsx` — Complete Chat View Rewrite
- **Removed**: `setTimeout` simulated response logic
- **Added**: Real call to `POST /api/chat/complete` with `{ sessionId, message, stream: true }`
- **Streaming support**: Reads SSE stream, updates UI character-by-character as content arrives
- **Thinking indicator**: Shows animated spinner + "Thinking..." text before first chunk
- **Streaming indicator**: Shows animated bouncing dots after first chunk while content is still being generated
- **Model display**: Shows model name badge in chat header and next to streaming messages via Tooltip
- **Token usage**: Non-streaming responses show token usage badge under agent messages (prompt + completion tokens in tooltip)
- **Error handling**: Uses `toast` from sonner for error notifications; handles no-provider-configured gracefully with informative message
- **Textarea**: Replaced `Input` with `Textarea` for multi-line support; auto-resizes up to 200px
- **Keyboard shortcuts**: Enter to send, Shift+Enter for new line
- **Abort support**: AbortController for cancelling in-flight requests
- **Optimistic updates**: User messages appear immediately in UI before server confirmation
- **Auto-scroll**: Smooth scroll to bottom on new messages and streaming content
- **i18n**: All new user-facing text uses `useTranslation` hook

### 3. `src/lib/i18n/locales/en.ts` — Added Chat i18n Keys
New keys under `chat`:
- `thinking`, `generating`, `noProviderConfigured`, `noProviderHint`, `sendFailed`, `aiError`
- `modelLabel`, `tokensUsed`, `promptTokens`, `completionTokens`
- Updated `sendHint` to "Enter to send, Shift+Enter for new line"

### 4. `src/lib/i18n/locales/zh.ts` — Added Chinese Translations
Corresponding Chinese translations for all new keys.

## Architecture Decisions
- **Streaming-first**: Default to streaming for better UX; non-streaming is available as fallback
- **SSE over WebSocket**: Used Server-Sent Events for streaming since it's simpler and the endpoint already uses REST
- **Optimistic UI**: User messages appear immediately; errors remove them if needed
- **Graceful degradation**: Chat still works when no AI provider is configured (shows helpful message)
- **Existing session management preserved**: Session listing, creation, selection, and message history fetching remain unchanged
