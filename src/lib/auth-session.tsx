'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { setApiInstance, getApi } from '@/lib/api-client'

// ==================== Types ====================

interface AuthUser {
  id: string
  name: string | null
  email: string | null
  avatarUrl: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  authenticated: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithCode: (email: string, code: string) => Promise<void>
  refresh: () => Promise<void>
  signOut: () => void
}

// ==================== Context ====================

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  authenticated: false,
  login: async () => {},
  loginWithCode: async () => {},
  refresh: async () => {},
  signOut: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

// ==================== Token helpers ====================

const TOKEN_KEY = 'multica_token'

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

// Simple localStorage subscription for useSyncExternalStore
let tokenListeners: Array<() => void> = []

function subscribeToToken(callback: () => void) {
  tokenListeners.push(callback)
  return () => {
    tokenListeners = tokenListeners.filter((l) => l !== callback)
  }
}

function getSnapshotToken(): string | null {
  return getStoredToken()
}

function getServerSnapshotToken(): string | null {
  return null
}

function emitTokenChange() {
  tokenListeners.forEach((l) => l())
}

// ==================== Provider ====================

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)
  const fetchIdRef = useRef(0)

  // Sync token from localStorage via useSyncExternalStore (no setState needed)
  const token = useSyncExternalStore(
    subscribeToToken,
    getSnapshotToken,
    getServerSnapshotToken,
  )

  // Mount/unmount tracking
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Initialize the API client singleton once
  useEffect(() => {
    const client = getApi()
    setApiInstance(client)
  }, [])

  // Map API User to AuthUser
  const mapUser = useCallback(
    (u: { id: string; name?: string | null; email?: string | null; avatarUrl?: string | null }): AuthUser => ({
      id: u.id,
      name: u.name ?? null,
      email: u.email ?? null,
      avatarUrl: u.avatarUrl ?? null,
    }),
    [],
  )

  // Fetch current user — only called from async callbacks, never synchronously in effects
  const fetchSession = useCallback(
    async (currentToken: string | null) => {
      const fetchId = ++fetchIdRef.current
      try {
        const api = getApi()
        let currentUser: AuthUser | null = null

        if (currentToken) {
          // Use a no-op microtask to ensure setState happens after the call stack
          await Promise.resolve()
          const me = await api.getMe()
          currentUser = mapUser(me)
        }

        // Only update if this is still the latest fetch
        if (mountedRef.current && fetchId === fetchIdRef.current) {
          setUser(currentUser)
          setLoading(false)
        }
      } catch {
        if (mountedRef.current && fetchId === fetchIdRef.current) {
          setStoredToken(null)
          emitTokenChange()
          setUser(null)
          setLoading(false)
        }
      }
    },
    [mapUser],
  )

  // Silent revalidation — updates user without touching loading state
  const silentRefresh = useCallback(async () => {
    const fetchId = ++fetchIdRef.current
    try {
      const currentToken = getStoredToken()
      if (!currentToken) {
        if (mountedRef.current && fetchId === fetchIdRef.current) {
          setUser(null)
          setLoading(false)
        }
        return
      }
      const api = getApi()
      await Promise.resolve()
      const me = await api.getMe()
      const mappedUser = mapUser(me)
      if (mountedRef.current && fetchId === fetchIdRef.current) {
        setUser(mappedUser)
        setLoading(false)
      }
    } catch {
      // Silent failures — don't disrupt UI
    }
  }, [mapUser])

  // Initial auth check — loading starts as true (from useState default)
  useEffect(() => {
    // Use queueMicrotask to ensure the setState is deferred
    const currentToken = getStoredToken()
    queueMicrotask(() => {
      fetchSession(currentToken)
    })
    return () => {
      fetchIdRef.current++
    }
  }, [])

  // Revalidate on pathname change (silent, no loading spinner)
  useEffect(() => {
    queueMicrotask(() => {
      silentRefresh()
    })
  }, [pathname, silentRefresh])

  // ---- Login with email/password ----
  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      try {
        const api = getApi()
        const result = await api.login(email, password)
        const newToken = result.token
        const mappedUser = mapUser(result.user)

        setStoredToken(newToken)
        emitTokenChange()
        setUser(mappedUser)

        if (mountedRef.current) {
          setLoading(false)
        }
      } catch (error) {
        if (mountedRef.current) {
          setLoading(false)
        }
        throw error
      }
    },
    [mapUser],
  )

  // ---- Login with email/code (magic link / OTP) ----
  const loginWithCode = useCallback(
    async (email: string, code: string) => {
      setLoading(true)
      try {
        const api = getApi()
        const result = await api.verifyCode(email, code)
        const newToken = result.token
        const mappedUser = mapUser(result.user)

        setStoredToken(newToken)
        emitTokenChange()
        setUser(mappedUser)

        if (mountedRef.current) {
          setLoading(false)
        }
      } catch (error) {
        if (mountedRef.current) {
          setLoading(false)
        }
        throw error
      }
    },
    [mapUser],
  )

  // ---- Refresh current session ----
  const refresh = useCallback(async () => {
    try {
      const api = getApi()
      const me = await api.getMe()
      const mappedUser = mapUser(me)
      if (mountedRef.current) {
        setUser(mappedUser)
      }
    } catch {
      if (mountedRef.current) {
        setStoredToken(null)
        emitTokenChange()
        setUser(null)
      }
    }
  }, [mapUser])

  // ---- Sign out ----
  const signOut = useCallback(() => {
    try {
      const api = getApi()
      api.logout().catch(() => {/* ignore */})
    } catch {
      // API might not be initialized
    }

    setStoredToken(null)
    emitTokenChange()
    setUser(null)

    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }, [])

  const value: AuthContextValue = {
    user,
    token,
    loading,
    authenticated: !!user,
    login,
    loginWithCode,
    refresh,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
