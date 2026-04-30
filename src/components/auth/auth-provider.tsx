"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import type { ReactNode } from "react"

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Auth provider wrapper that makes NextAuth session available throughout the app.
 * Must be placed in the root layout to enable useSession() in any client component.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
