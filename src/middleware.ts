import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that are publicly accessible (no auth required)
const PUBLIC_API_ROUTES = [
  "/api/auth",
  "/api/setup",
  "/api/health",
  "/api/seed",
  "/api/models",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if this is a protected API route
  if (pathname.startsWith("/api/")) {
    const isPublic = PUBLIC_API_ROUTES.some((route) =>
      pathname.startsWith(route)
    )

    if (!isPublic) {
      try {
        // Verify JWT token
        const token = await getToken({
          req: request,
          secret:
            process.env.NEXTAUTH_SECRET ||
            "agenthub-dev-secret-change-in-production",
        })

        if (!token) {
          return NextResponse.json(
            { error: "Unauthorized", message: "Authentication required" },
            { status: 401 }
          )
        }
      } catch (error) {
        console.error("[Middleware] Token verification failed:", error)
        // If token verification fails (e.g., invalid secret), block the request
        return NextResponse.json(
          { error: "Unauthorized", message: "Token verification failed" },
          { status: 401 }
        )
      }
    }
  }

  // Allow all other routes (main page handles auth state client-side)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
  ],
}
