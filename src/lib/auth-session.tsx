'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'

// ==================== Lightweight Auth Context ====================

interface AuthUser {
  name?: string | null
  email?: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  authenticated: boolean
  refresh: () => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  authenticated: false,
  refresh: async () => {},
  signOut: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch session from server on mount and route change
  useEffect(() => {
    let cancelled = false

    async function fetchSession() {
      try {
        const res = await fetch('/api/me')
        if (!cancelled && res.ok) {
          const data = await res.json()
          setUser(data.user ?? null)
        }
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSession()
    return () => { cancelled = true }
  }, [pathname])

  function signOut() {
    fetch('/api/signout', { method: 'POST' }).finally(() => {
      setUser(null)
      window.location.href = '/login'
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticated: !!user,
        refresh: async () => {
          const res = await fetch('/api/me')
          if (res.ok) {
            const data = await res.json()
            setUser(data.user ?? null)
          }
        },
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
