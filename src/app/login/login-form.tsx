"use client"

import { useState } from "react"
import {
  Layers,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  KeyRound,
  ArrowLeft,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"
import { Separator } from "@/components/ui/separator"

type LoginMode = 'password' | 'code'

export function LoginForm({ hasGitHub }: { hasGitHub: boolean }) {
  const [mode, setMode] = useState<LoginMode>('password')

  // Password mode state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Code mode state
  const [codeEmail, setCodeEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [codeCooldown, setCodeCooldown] = useState(0)

  // Shared state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cooldown timer for resend
  useState(() => {
    if (codeCooldown > 0) {
      const timer = setInterval(() => {
        setCodeCooldown((prev) => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(timer)
    }
  })

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        window.location.href = '/'
      } else {
        setError(data.error || "Invalid email or password. Try alex@agenthub.dev / demo123")
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSendCode = async () => {
    if (!codeEmail.trim()) return
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: codeEmail }),
      })

      const data = await res.json()

      if (res.ok) {
        setCodeSent(true)
        setCodeCooldown(60)
        // Start cooldown
        const cooldownInterval = setInterval(() => {
          setCodeCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(cooldownInterval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(data.error || "Failed to send verification code")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codeEmail.trim() || otpCode.length !== 6) return
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: codeEmail, code: otpCode }),
      })

      const data = await res.json()

      if (res.ok && data.token) {
        // Store token
        if (typeof window !== 'undefined') {
          localStorage.setItem('multica_token', data.token)
        }
        window.location.href = '/'
      } else {
        setError(data.error || "Invalid verification code")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: LoginMode) => {
    setMode(newMode)
    setError(null)
    setCodeSent(false)
    setOtpCode('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Layers className="h-7 w-7 text-primary" />
            </div>
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-bold tracking-tight">
              AgentHub
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to your workspace
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Password Mode */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="alex@agenthub.dev"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={loading}
                    className="h-11 pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="h-11 pl-9 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-medium"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          )}

          {/* Code Mode */}
          {mode === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              {/* Back button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 h-7 text-xs text-muted-foreground hover:text-foreground -ml-1"
                onClick={() => switchMode('password')}
              >
                <ArrowLeft className="h-3 w-3" />
                Back to password
              </Button>

              <div className="space-y-2">
                <Label htmlFor="code-email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="code-email"
                      type="email"
                      placeholder="alex@agenthub.dev"
                      value={codeEmail}
                      onChange={(e) => {
                        setCodeEmail(e.target.value)
                        setCodeSent(false)
                      }}
                      autoComplete="email"
                      required
                      disabled={loading || codeSent}
                      className="h-11 pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0"
                    onClick={handleSendCode}
                    disabled={loading || !codeEmail.trim() || codeCooldown > 0 || codeSent}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : codeCooldown > 0 ? (
                      `${codeCooldown}s`
                    ) : codeSent ? (
                      "Sent"
                    ) : (
                      "Send Code"
                    )}
                  </Button>
                </div>
              </div>

              {codeSent && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Verification Code
                    </Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otpCode}
                        onChange={setOtpCode}
                        disabled={loading}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Enter the 6-digit code sent to {codeEmail}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-sm font-medium"
                    disabled={loading || otpCode.length !== 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        Verify & Sign In
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          )}

          <Separator />

          {/* Mode toggle */}
          <div className="text-center">
            {mode === 'password' ? (
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => switchMode('code')}
              >
                Or continue with{' '}
                <span className="font-medium text-primary hover:underline">
                  verification code
                </span>
              </button>
            ) : !codeSent ? (
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => switchMode('password')}
              >
                Or sign in with{' '}
                <span className="font-medium text-primary hover:underline">
                  email & password
                </span>
              </button>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Didn&apos;t receive the code?
                </p>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline disabled:text-muted-foreground disabled:hover:no-underline"
                  onClick={handleSendCode}
                  disabled={codeCooldown > 0}
                >
                  {codeCooldown > 0
                    ? `Resend in ${codeCooldown}s`
                    : 'Resend code'}
                </button>
              </div>
            )}
          </div>

          {/* Demo credentials */}
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground text-center">
              <span className="font-medium text-foreground/80">Demo credentials:</span>{" "}
              alex@agenthub.dev / demo123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
