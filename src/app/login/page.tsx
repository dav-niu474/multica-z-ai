import { LoginForm } from "./login-form"
import { hasCredentialsProvider } from "@/lib/auth"

/**
 * Login page — Server Component
 * Renders the LoginForm client component with configuration props.
 */
export default function LoginPage() {
  const showGitHub = !hasCredentialsProvider

  return <LoginForm hasGitHub={showGitHub} />
}
