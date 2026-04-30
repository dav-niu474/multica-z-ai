import type { NextAuthOptions } from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"

// Demo accounts for when GitHub OAuth is not configured
const DEMO_ACCOUNTS = [
  { email: "alex@agenthub.dev", password: "demo123", name: "Alex Chen" },
  { email: "sarah@agenthub.dev", password: "demo123", name: "Sarah Kim" },
  { email: "mike@agenthub.dev", password: "demo123", name: "Mike Rivera" },
]

export const hasCredentialsProvider = !process.env.GITHUB_ID

export const authOptions: NextAuthOptions = {
  providers: [
    // GitHub OAuth provider (only if GITHUB_ID is configured)
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),

    // Credentials provider for demo (always available, but only shown in UI when no GitHub)
    CredentialsProvider({
      id: "credentials",
      name: "Demo Account",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "alex@agenthub.dev",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const account = DEMO_ACCOUNTS.find(
          (a) =>
            a.email === credentials.email && a.password === credentials.password
        )

        if (!account) {
          return null
        }

        // Find or create user in database
        let user = await db().user.findUnique({
          where: { email: account.email },
        })

        if (!user) {
          user = await db().user.create({
            data: {
              email: account.email,
              name: account.name,
            },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        }
      },
    }),
  ],

  // JWT session strategy for API routes compatibility
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    // Add userId to JWT token
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },

    // Pass userId from token to session
    async session({ session, token }) {
      if (session.user && token.userId) {
        ;(session.user as { userId: string }).userId = token.userId as string
      }
      return session
    },

    // Auto-link user to workspace on sign in
    async signIn({ user, account, profile }) {
      if (!user?.email) {
        return false
      }

      try {
        // Find or create user in database
        let dbUser = await db().user.findUnique({
          where: { email: user.email },
        })

        if (!dbUser) {
          dbUser = await db().user.create({
            data: {
              email: user.email,
              name: user.name || "Unknown User",
              avatar: user.image || null,
            },
          })
        }

        // Auto-link to first workspace as member if not already a member
        const workspace = await db().workspace.findFirst()
        if (workspace) {
          const existingMember = await db().member.findFirst({
            where: {
              userId: dbUser.id,
              workspaceId: workspace.id,
            },
          })
          if (!existingMember) {
            await db().member.create({
              data: {
                userId: dbUser.id,
                workspaceId: workspace.id,
                role: "member",
              },
            })
          }
        }

        return true
      } catch (error) {
        console.error("Error in signIn callback:", error)
        return false
      }
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET || "agenthub-dev-secret-change-in-production",
}
